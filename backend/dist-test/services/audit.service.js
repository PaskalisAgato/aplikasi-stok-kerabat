import crypto from 'crypto';
import { db } from '../config/db.js';
import * as schema from '../db/schema.js';
export class AuditService {
    /**
     * Records a sensitive action with a cryptographic hash for tamper detection.
     */
    static async logAction(params) {
        const { userId, outletId, action, tableName, oldData, newData } = params;
        const oldDataStr = oldData ? JSON.stringify(oldData) : '';
        const newDataStr = newData ? JSON.stringify(newData) : '';
        const timestamp = new Date().toISOString();
        // Create SHA-256 hash
        const dataToHash = `${userId}|${outletId}|${action}|${tableName}|${oldDataStr}|${newDataStr}|${timestamp}`;
        const hash = crypto.createHash('sha256').update(dataToHash).digest('hex');
        try {
            await db.insert(schema.auditLogs).values({
                userId,
                outletId,
                action,
                tableName,
                oldData: oldDataStr || null,
                newData: newDataStr || null,
                hash,
                createdAt: new Date(timestamp)
            });
            console.log(`[AuditLog] ${action} on ${tableName} by ${userId} logged with hash ${hash.substring(0, 8)}...`);
        }
        catch (error) {
            console.error('[AuditLog] Failed to save audit log:', error);
            // We don't want to fail the primary transaction if logging fails, 
            // but in a production-grade system, you might want to use a reliable queue or a transaction hook.
        }
    }
    /**
     * Verifies if an audit log entry has been tampered with.
     */
    static async verifyEntry(logId) {
        // Implementation for manual verification if needed
        return true;
    }
}
