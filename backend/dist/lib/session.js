"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSessionManually = getSessionManually;
const crypto_1 = __importDefault(require("crypto"));
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
async function getSessionManually(req) {
    try {
        const bearerToken = req.headers.authorization?.startsWith('Bearer ')
            ? req.headers.authorization.split(' ')[1]
            : undefined;
        const cookieToken = req.cookies?.['better-auth.session_token']
            || extractCookieFromHeader(req.headers.cookie, 'better-auth.session_token');
        if (!bearerToken && !cookieToken) {
            console.log(`[AUTH] No session ID found in Authorization header or Cookie`);
            return null;
        }
        let result = [];
        // 1. Bearer token = session UUID (primary key in 'id' column)
        if (bearerToken) {
            result = await db_1.db
                .select({ session: schema_1.sessions, user: schema_1.users })
                .from(schema_1.sessions)
                .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.sessions.userId, schema_1.users.id))
                .where((0, drizzle_orm_1.eq)(schema_1.sessions.id, bearerToken))
                .limit(1);
            if (result.length > 0) {
                console.log(`[AUTH] Session found via Bearer UUID: ${bearerToken.substring(0, 8)}...`);
            }
        }
        // 2. Cookie token = hashed token (stored in 'token' column)
        if (result.length === 0 && cookieToken) {
            // Try as-is first (cookie may already contain the hash)
            result = await db_1.db
                .select({ session: schema_1.sessions, user: schema_1.users })
                .from(schema_1.sessions)
                .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.sessions.userId, schema_1.users.id))
                .where((0, drizzle_orm_1.eq)(schema_1.sessions.token, cookieToken))
                .limit(1);
            // If that didn't work, try hashing it (cookie may contain plaintext token)
            if (result.length === 0) {
                const hashedCookie = crypto_1.default.createHash('sha256').update(cookieToken).digest('hex');
                result = await db_1.db
                    .select({ session: schema_1.sessions, user: schema_1.users })
                    .from(schema_1.sessions)
                    .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.sessions.userId, schema_1.users.id))
                    .where((0, drizzle_orm_1.eq)(schema_1.sessions.token, hashedCookie))
                    .limit(1);
            }
            if (result.length > 0) {
                console.log(`[AUTH] Session found via Cookie`);
            }
        }
        if (result.length === 0) {
            console.log(`[AUTH] Session not found in DB`);
            return null;
        }
        const { session, user } = result[0];
        // Check expiration
        if (new Date() > session.expiresAt) {
            console.log(`[AUTH] Session expired for user ${user.id}`);
            return null;
        }
        return { user, session };
    }
    catch (error) {
        console.error("getSessionManually Error:", error);
        return null;
    }
}
// Helper to parse cookie from raw header string
function extractCookieFromHeader(cookieHeader, name) {
    if (!cookieHeader)
        return undefined;
    const match = cookieHeader.split(';').find(c => c.trim().startsWith(`${name}=`));
    return match ? match.trim().split('=')[1] : undefined;
}
