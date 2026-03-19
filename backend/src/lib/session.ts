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
        let sessionId: string | undefined;

        // 1. Priority: Authorization header (Manual Bearer token)
        // This is most reliable for cross-domain / mobile
        if (req.headers.authorization?.startsWith('Bearer ')) {
            sessionId = req.headers.authorization.split(' ')[1];
            console.log(`[AUTH] Priority: Session from Bearer: ${sessionId?.substring(0, 8)}...`);
        }
        
        // 2. Fallback: Cookie-based session
        if (!sessionId) {
            const cookieHeader = req.headers.cookie;
            if (cookieHeader) {
                const cookies: Record<string, string> = {};
                cookieHeader.split(';').forEach(c => {
                    const parts = c.trim().split('=');
                    if (parts.length === 2) {
                        cookies[parts[0]] = parts[1];
                    }
                });
                sessionId = cookies['better-auth.session_token'];
                if (sessionId) {
                    console.log(`[AUTH] Fallback: Session from Cookie: ${sessionId?.substring(0, 8)}...`);
                }
            }
        }

        if (!sessionId) {
            console.log(`[AUTH] No session ID found in Authorization header or Cookie`);
            return null;
        }

        // 3. Hash it (following our new SHA-256 standard)
        const hashedToken = crypto
            .createHash('sha256')
            .update(sessionId)
            .digest('hex');

        // 4. Lookup session and user in one go using a join
        const result = await db
            .select({
                session: sessions,
                user: users
            })
            .from(sessions)
            .innerJoin(users, eq(sessions.userId, users.id))
            .where(eq(sessions.token, hashedToken))
            .limit(1);

        if (result.length === 0) {
            console.log(`[AUTH] Session not found in DB for token: ${hashedToken.substring(0, 8)}...`);
            return null;
        }

        const { session, user } = result[0];

        // 5. Check expiration
        if (new Date() > session.expiresAt) {
            console.log(`[AUTH] Session expired for user ${user.id}`);
            return null;
        }

        // 6. Return in Better Auth format
        return {
            user,
            session
        };
    } catch (error) {
        console.error("getSessionManually Error:", error);
        return null;
    }
}
