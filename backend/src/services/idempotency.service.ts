import { db } from '../config/db.js';
import * as schema from '../db/schema.js';
import { eq } from 'drizzle-orm';

export class IdempotencyService {
    /**
     * Attempts to find an existing response for a given idempotency key.
     */
    static async getCachedResponse(key: string) {
        if (!key) return null;
        const [existing] = await db.select()
            .from(schema.idempotencyKeys)
            .where(eq(schema.idempotencyKeys.key, key))
            .limit(1);
        
        if (existing) {
            console.log(`[Idempotency] Hit for key: ${key}`);
            return {
                statusCode: existing.statusCode,
                body: JSON.parse(existing.responseBody || '{}')
            };
        }
        return null;
    }

    /**
     * Stores a response in the idempotency table.
     */
    static async setCachedResponse(key: string, body: any, statusCode: number = 201) {
        if (!key) return;
        await db.insert(schema.idempotencyKeys).values({
            key,
            responseBody: JSON.stringify(body),
            statusCode,
            createdAt: new Date()
        }).onConflictDoUpdate({
            target: schema.idempotencyKeys.key,
            set: { 
                responseBody: JSON.stringify(body), 
                statusCode,
                createdAt: new Date() 
            }
        });
    }
}
