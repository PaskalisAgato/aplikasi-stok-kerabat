import { Request, Response, NextFunction } from 'express';
import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';
import { systemLogs } from '../db/schema.js';

/**
 * Idempotency Middleware (Phase 3)
 * Prevents double-processing of critical requests.
 * Uses X-Idempotency-Key header.
 */
export const idempotencyMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    // Only protect mutation requests
    if (!['POST', 'PUT', 'DELETE'].includes(req.method)) {
        return next();
    }

    const key = req.header('x-idempotency-key');
    if (!key) {
        return next(); // Key is optional but highly recommended for critical routes
    }

    try {
        // 1. Check for existing key
        const existing = await db.execute(sql`
            SELECT response_body, status_code FROM idempotency_keys WHERE key = ${key} LIMIT 1
        `);

        if (existing.rows && existing.rows.length > 0) {
            const cached = existing.rows[0] as any;
            console.log(`[Idempotency] Duplicate request detected for key: ${key}. Returning stored result.`);
            
            // Add header to indicate it's a replay
            res.setHeader('X-Idempotency-Replay', 'true');
            return res.status(cached.status_code).json(cached.response_body);
        }

        // 2. Intercept response to store it
        const originalSend = res.send;
        res.send = function (body: any): Response {
            // Restore original send to actually send the response
            res.send = originalSend;

            // Only store successful or 4xx responses
            if (res.statusCode < 500) {
                let parsedBody = body;
                try {
                    if (typeof body === 'string') parsedBody = JSON.parse(body);
                } catch (e) {
                    // Not JSON, just ignore
                }

                db.execute(sql`
                    INSERT INTO idempotency_keys (key, response_body, status_code)
                    VALUES (${key}, ${parsedBody}, ${res.statusCode})
                    ON CONFLICT (key) DO NOTHING
                `).catch((err: any) => {
                    console.error('[Idempotency] Failed to store result:', err);
                });
            }

            return originalSend.call(this, body);
        };

        next();
    } catch (error) {
        console.error('[Idempotency] Error in middleware:', error);
        next(); // Proceed anyway to avoid breaking the app
    }
};

/**
 * Periodic cleanup of old idempotency keys (> 24h)
 */
export const cleanupIdempotencyKeys = async () => {
    try {
        await db.execute(sql`
            DELETE FROM idempotency_keys WHERE created_at < NOW() - INTERVAL '24 hours'
        `);
        console.log(`[Idempotency] Cleaned up old keys.`);
    } catch (error) {
        console.error('[Idempotency] Failed to cleanup keys:', error);
    }
};
