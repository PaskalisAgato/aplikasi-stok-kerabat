import express from 'express';
import crypto from 'crypto';
import { db } from '../db';
import { sessions, users } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export interface SessionData {
    user: any;
    session: any;
}

export async function getSessionManually(req: express.Request): Promise<SessionData | null> {
    try {
        // 1. Get cookie from headers
        const cookieHeader = req.headers.cookie;
        const cookies: Record<string, string> = {};
        if (cookieHeader) {
            cookieHeader.split(';').forEach(c => {
                const parts = c.trim().split('=');
                if (parts.length === 2) {
                    cookies[parts[0]] = parts[1];
                }
            });
        }
        
        let sessionId = cookies['better-auth.session_token'];
        
        // 2. Fallback to Authorization header (for iOS Safari compat)
        if (!sessionId && req.headers.authorization?.startsWith('Bearer ')) {
            sessionId = req.headers.authorization.split(' ')[1];
            console.log(`[AUTH] Session from Bearer: ${sessionId?.substring(0, 8)}...`);
        }

        if (!sessionId) {
            console.log(`[AUTH] No session ID found in Cookie or Authorization header`);
            return null;
        }

        // 3. Hash it (following our new SHA-256 standard)
        const hashedToken = crypto
            .createHash('sha256')
            .update(sessionId)
            .digest('hex');

        // 3. Lookup in DB
        const foundSession = await db.query.sessions.findFirst({
            where: eq(sessions.token, hashedToken)
        });

        if (!foundSession) return null;

        // 4. Check expiration
        if (new Date() > foundSession.expiresAt) {
            return null;
        }

        // 5. Get user
        const foundUser = await db.query.users.findFirst({
            where: eq(users.id, foundSession.userId)
        });

        if (!foundUser) return null;

        // 6. Return in Better Auth format
        return {
            user: foundUser,
            session: foundSession
        };
    } catch (error) {
        console.error("getSessionManually Error:", error);
        return null;
    }
}
