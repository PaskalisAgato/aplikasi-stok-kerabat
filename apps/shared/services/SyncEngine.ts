import { db, type OfflineTransaction } from './db';
import { apiClient } from '../apiClient';

class SyncEngine {
  private isRunning = false;
  private intervalId: any = null;
  private pendingCount = 0;
  private lastPullTime = 0;
  private isPulling = false;
  private isPushing = false;
  private listeners: ((count: number) => void)[] = [];
  private stateListeners: ((state: { isPulling: boolean, isPushing: boolean }) => void)[] = [];

  private readonly PULL_INTERVAL_MS = 60000; // Pull every 1 minute
  private readonly MAX_RETRIES = 10;

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

  public onStateChange(callback: (state: { isPulling: boolean, isPushing: boolean }) => void) {
    this.stateListeners.push(callback);
    callback({ isPulling: this.isPulling, isPushing: this.isPushing });
    return () => {
      this.stateListeners = this.stateListeners.filter(l => l !== callback);
    };
  }

  private notifyState() {
    this.stateListeners.forEach(l => l({ isPulling: this.isPulling, isPushing: this.isPushing }));
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
   * Phase 8: Auto-Cleanup of synced transactions older than 7 days
   */
  public async cleanup() {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const oldSynced = await db.transactions
        .where('sync_status').equals('SYNCED')
        .and(trx => new Date(trx.created_at) < sevenDaysAgo)
        .primaryKeys();
      
      if (oldSynced.length > 0) {
        console.log(`[SyncEngine] Cleaning up ${oldSynced.length} old synced transactions...`);
        await db.transactions.bulkDelete(oldSynced);
        await this.logDiagnostic('INFO', 'SyncEngine', `Cleaned up ${oldSynced.length} old transactions`);
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
      const pending = await db.transactions
        .where('sync_status')
        .equals('PENDING')
        .toArray();

      this.notify(pending.length);

      if (pending.length === 0) return;

      console.log(`[SyncEngine] Processing ${pending.length} pending transactions...`);

      for (const trx of pending) {
        if (!this.isRunning) break;
        
        // Handle Exponential Backoff check
        if (trx.retry_count > 0) {
          const waitTime = Math.min(Math.pow(2, trx.retry_count) * 5000, 3600000); 
          const lastAttempt = new Date(trx.created_at).getTime(); 
          if (Date.now() - lastAttempt < waitTime) continue; 
        }

        const success = await this.syncTransaction(trx);
        if (!success) break; 
      }
      
      const remaining = await db.transactions
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

  private async syncTransaction(trx: OfflineTransaction): Promise<boolean> {
    try {
      const checkoutData = {
        id: trx.id, 
        items: trx.items,
        paymentMethod: trx.payment_method,
        totalAmount: trx.total_amount,
        subTotal: trx.total_amount,
        createdAt: trx.created_at
      };

      await apiClient.checkoutCart(checkoutData);
      
      await db.transactions.update(trx.id, { 
        sync_status: 'SYNCED',
        retry_count: trx.retry_count + 1 
      });
      
      console.log(`[SyncEngine] Successfully synced transaction ${trx.receipt_number}`);
      return true;
    } catch (error: any) {
      console.error(`[SyncEngine] Failed to sync ${trx.receipt_number}`, error);
      
      if (error.status === 401 || error.status === 403) {
        console.warn('[SyncEngine] Unauthorized. Stopping sync engine.');
        return false; 
      }

      const nextRetryCount = trx.retry_count + 1;
      const nextStatus = nextRetryCount >= this.MAX_RETRIES ? 'FAILED' : 'PENDING';

      await db.transactions.update(trx.id, { 
        retry_count: nextRetryCount,
        sync_status: nextStatus,
        errorMessage: error.message || 'Unknown error'
      });
      return true; 
    }
  }

  public getPendingCount() {
      return this.pendingCount;
  }
}

export const syncEngine = new SyncEngine();
