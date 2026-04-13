import { Request, Response, NextFunction } from 'express';
import { db } from '../config/db.js';
import * as schema from '../db/schema.js';
import { eq } from 'drizzle-orm';

export const idempotencyMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    // Only apply to state-changing operations
    if (['GET', 'OPTIONS', 'HEAD'].includes(req.method)) {
        return next();
    }

    const key = req.headers['idempotency-key'] as string;
    
    if (!key) {
        return next(); // Proceed normally if no idempotency key provided
    }

    try {
        const [existing] = await db.select().from(schema.idempotencyKeys).where(eq(schema.idempotencyKeys.key, key)).limit(1);

        if (existing) {
            console.log(`[Idempotency] Request blocked, returning cached response for key: ${key}`);
            if (existing.responseBody) {
                return res.status(existing.statusCode).json(JSON.parse(existing.responseBody));
            } else {
                return res.status(existing.statusCode).send();
            }
        }

        // Intercept res.json to cache it on successful or failed completion
        const originalJson = res.json.bind(res);
        res.json = (body: any) => {
            const statusCode = res.statusCode;
            
            // Fire and forget caching the response
            db.insert(schema.idempotencyKeys).values({
                key,
                responseBody: JSON.stringify(body),
                statusCode: statusCode
            }).catch(err => console.error('[Idempotency] Failed to save key:', err));

            return originalJson(body);
        };

        next();
    } catch (e) {
        console.error('Idempotency middleware error:', e);
        next();
    }
};
