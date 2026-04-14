import { db, type OfflineAction } from './db';
import { apiClient } from '../apiClient';

class SyncEngine {
  private isRunning = false;
  private intervalId: any = null;
  private pendingCount = 0;
  private lastPullTime = 0;
  private isPulling = false;
  private isPushing = false;
  private lastError: string | null = null;
  private listeners: ((count: number) => void)[] = [];
  private stateListeners: ((state: { isPulling: boolean, isPushing: boolean, lastError: string | null }) => void)[] = [];

  private readonly PULL_INTERVAL_MS = 60000; // Pull every 1 minute
  private readonly MAX_RETRIES = 3; // Reduced for Enterprise Hardening Phase

  public async start(intervalMs = 15000) {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[SyncEngine] Started');

    // Recovery & Initial Sync
    await this.recover();

    this.intervalId = setInterval(() => {
      this.tick();
    }, intervalMs);

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[SyncEngine] Network back online. Triggering sync.');
        this.processQueue();
        this.pullInventory();
      });
    }
  }

  public onStateChange(callback: (state: { isPulling: boolean, isPushing: boolean, lastError: string | null }) => void) {
    this.stateListeners.push(callback);
    callback({ isPulling: this.isPulling, isPushing: this.isPushing, lastError: this.lastError });
    return () => {
      this.stateListeners = this.stateListeners.filter(l => l !== callback);
    };
  }

  private notifyState() {
    this.stateListeners.forEach(l => l({ 
      isPulling: this.isPulling, 
      isPushing: this.isPushing, 
      lastError: this.lastError 
    }));
  }

  private async tick() {
    await this.processQueue();
    
    // Check if it's time to pull
    if (Date.now() - this.lastPullTime > this.PULL_INTERVAL_MS) {
      await this.pullInventory();
    }
  }

  public async recover() {
    console.log('[SyncEngine] Running recovery...');
    await this.pullInventory();
    await this.processQueue();
    await this.cleanup(); // Phase 8
  }

  public async pullInventory() {
    if (this.isPulling) return;
    this.isPulling = true;
    this.notifyState();

    try {
      console.log('[SyncEngine] Pulling fresh inventory from server...');
      const response = await apiClient.getInventory(1000, 0); 
      if (response && Array.isArray(response.data)) {
        await db.inventoryCache.bulkPut(response.data.map((item: any) => ({
          ...item,
          version: item.version || 1,
          updatedAt: new Date().toISOString()
        })));
        this.lastPullTime = Date.now();
        console.log(`[SyncEngine] Successfully pulled ${response.data.length} items.`);
        
        await this.logAudit('PULL_INVENTORY', 'Inventory', 'all');
      }
    } catch (error: any) {
      console.error('[SyncEngine] Pull inventory failed', error);
      await this.logDiagnostic('ERROR', 'SyncEngine', `Pull inventory failed: ${error.message}`);
    } finally {
      this.isPulling = false;
      this.notifyState();
    }
  }

  /**
   * Phase 8: Auto-Cleanup of synced actions older than 7 days
   */
  public async cleanup() {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const oldSynced = await db.offlineActions
        .where('sync_status').equals('SYNCED')
        .and(action => new Date(action.created_at) < sevenDaysAgo)
        .primaryKeys();
      
      if (oldSynced.length > 0) {
        console.log(`[SyncEngine] Cleaning up ${oldSynced.length} old synced actions...`);
        await db.offlineActions.bulkDelete(oldSynced);
        await this.logDiagnostic('INFO', 'SyncEngine', `Cleaned up ${oldSynced.length} old actions`);
      }
    } catch (error) {
      console.error('[SyncEngine] Cleanup failed', error);
    }
  }

  private async logAudit(action: string, entity: string, entityId: string) {
    try {
      await db.auditLog.add({
        action,
        entity,
        entityId,
        timestamp: new Date().toISOString(),
        userId: 'system', // Replace with real UI session
        deviceId: 'default_pos' // Replace with real device ID
      });
    } catch (err) {
      console.error('Audit log failed', err);
    }
  }

  private async logDiagnostic(level: 'INFO' | 'WARN' | 'ERROR', module: string, message: string) {
    try {
      await db.diagnostics.add({
        level,
        module,
        message,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
       console.error('Diagnostic log failed', err);
    }
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('[SyncEngine] Stopped');
  }

  public onChange(callback: (count: number) => void) {
    this.listeners.push(callback);
    callback(this.pendingCount);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notify(count: number) {
    this.pendingCount = count;
    this.listeners.forEach(l => l(count));
  }

  private async processQueue() {
    if (this.isPushing) return;
    this.isPushing = true;
    this.notifyState();

    try {
      const pending = await db.offlineActions
        .where('sync_status')
        .equals('PENDING')
        .sortBy('sequence_number');

      this.notify(pending.length);

      if (pending.length === 0) return;

      console.log(`[SyncEngine] Processing ${pending.length} pending actions STRICT FIFO...`);

      for (const action of pending) {
        if (!this.isRunning) break;
        
        // 1. Exponential Backoff Check (Per-Action Isolation)
        if (action.retry_count > 0) {
          const waitTime = Math.min(Math.pow(2, action.retry_count) * 5000, 3600000); 
          const lastAttempt = new Date(action.last_attempt_at || action.created_at).getTime(); 
          if (Date.now() - lastAttempt < waitTime) {
             // We no longer halt the entire queue for one action's backoff!
             continue; 
          }
        }

        // 2. Process Action (Errors are handled internally in syncAction)
        await this.syncAction(action);
      }
      
      const remaining = await db.offlineActions
        .where('sync_status')
        .equals('PENDING')
        .count();
      this.notify(remaining);

    } catch (error) {
      console.error('[SyncEngine] Queue processing failed', error);
    } finally {
      this.isPushing = false;
      this.notifyState();
    }
  }

  private async syncAction(action: OfflineAction): Promise<boolean> {
    try {
      await db.offlineActions.update(action.id, { last_attempt_at: new Date().toISOString() });

      let path = '';
      let useDelete = false;

      if (action.type === 'CHECKOUT') path = '/transactions/checkout';
      else if (action.type === 'VOID') path = `/transactions/${action.payload.id}/void`; 
      else if (action.type === 'DELETE_TRANSACTION') {
          path = `/transactions/${action.payload.id}`;
          useDelete = true;
      }
      else if (action.type === 'EXPENSE') path = '/finance/expenses';
      else if (action.type === 'SHIFT_HANDOVER') path = '/cashier-shifts/handover';
      else if (action.type === 'SHIFT_CLOSE') path = `/cashier-shifts/close/${action.payload.shiftId}`;
      else if (action.type === 'ENQUEUE_PRINT') path = '/print/enqueue'; 

      if (useDelete) {
          await apiClient.deleteWithIdempotency(path, action.idempotency_key);
      } else {
          await apiClient.postWithIdempotency(path, action.payload, action.idempotency_key);
      }

      // Phase Hardening: Immediately remove successful actions to prevent double-processing risk
      await db.offlineActions.delete(action.id);
      
      console.log(`[SyncEngine] Successfully synced action ${action.type} [Seq: ${action.sequence_number}] - DELETED FROM QUEUE`);
      return true;
    } catch (error: any) {
      console.error(`[SyncEngine] Failed to sync ${action.type}`, error);
      this.lastError = error.message || 'Network Fail';
      
      if (error.status === 401 || error.status === 403) {
        console.warn('[SyncEngine] Unauthorized. Stopping sync engine.');
        // Notify UI to re-auth
        window.dispatchEvent(new CustomEvent('sync-auth-failed'));
        return false; 
      }

      // Logical Server Reject (400, 422, etc). It shouldn't block the queue forever!
      // 404 treated as possibly transient (deploy lag) but subject to max retries.
      if (error.status >= 400 && error.status < 500 && error.status !== 404) {
         await db.offlineActions.update(action.id, { 
            sync_status: 'REJECTED', // Mark as failed definitively
            failure_reason: error.message || 'Server rejected payload logically',
            retry_count: action.retry_count + 1
          });
         this.lastError = null; // Clear error since we bypassed it
         return true; // Return true to continue the queue processing past this corrupted item
      }

      const nextRetryCount = action.retry_count + 1;
      const nextStatus = nextRetryCount >= this.MAX_RETRIES ? 'FAILED_PERMANENT' : 'PENDING';

      await db.offlineActions.update(action.id, { 
        retry_count: nextRetryCount,
        sync_status: nextStatus as any,
        failure_reason: error.message || 'Unknown error'
      });
      
      // If it's a network retry (PENDING), return false to strictly halt the queue 
      // If FAILED_PERMANENT, return true to skip it and keep processing others
      return nextStatus === 'FAILED_PERMANENT'; 
    }
  }

  public getLastError() {
      return this.lastError;
  }

  public getPendingCount() {
      return this.pendingCount;
  }

  public async forceSync() {
      await this.processQueue();
  }

  /**
   * Emergency flush: marks all PENDING actions as REJECTED.
   * Use when old queued items are permanently stuck (e.g. expired session data).
   */
  public async clearAllPending() {
      const pending = await db.offlineActions
          .where('sync_status').equals('PENDING')
          .toArray();
      
      for (const action of pending) {
          await db.offlineActions.update(action.id, {
              sync_status: 'REJECTED' as any,
              failure_reason: 'Manually cleared by user (session expired or stuck)'
          });
      }

      this.notify(0);
      console.log(`[SyncEngine] Manually cleared ${pending.length} stuck PENDING actions.`);
      return pending.length;
  }

  /**
   * Get all actions in the sync queue (not just pending)
   */
  public async getAllActions(): Promise<OfflineAction[]> {
      return db.offlineActions
          .orderBy('sequence_number')
          .reverse()
          .toArray();
  }

  /**
   * Cancel / Delete a specific action from the local queue
   */
  public async cancelAction(id: string): Promise<void> {
      const action = await db.offlineActions.get(id);
      if (action) {
          await db.offlineActions.delete(id);
          console.log(`[SyncEngine] Action ${id} was manually CANCELLED/DELETED from queue.`);
          
          // Refresh count
          const count = await db.offlineActions.where('sync_status').equals('PENDING').count();
          this.notify(count);
      }
  }
}

export const syncEngine = new SyncEngine();
