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
        // 1. Get cookie from headers
        const cookieHeader = req.headers.cookie;
        if (!cookieHeader)
            return null;
        const cookies = {};
        cookieHeader.split(';').forEach(c => {
            const parts = c.trim().split('=');
            if (parts.length === 2) {
                cookies[parts[0]] = parts[1];
            }
        });
        const sessionId = cookies['better-auth.session_token'];
        if (!sessionId)
            return null;
        // 2. Hash it (following our new SHA-256 standard)
        const hashedToken = crypto_1.default
            .createHash('sha256')
            .update(sessionId)
            .digest('hex');
        // 3. Lookup in DB
        const foundSession = await db_1.db.query.sessions.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.sessions.token, hashedToken)
        });
        if (!foundSession)
            return null;
        // 4. Check expiration
        if (new Date() > foundSession.expiresAt) {
            return null;
        }
        // 5. Get user
        const foundUser = await db_1.db.query.users.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.users.id, foundSession.userId)
        });
        if (!foundUser)
            return null;
        // 6. Return in Better Auth format
        return {
            user: foundUser,
            session: foundSession
        };
    }
    catch (error) {
        console.error("getSessionManually Error:", error);
        return null;
    }
}
