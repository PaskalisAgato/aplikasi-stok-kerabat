import crypto from 'crypto';
import { db } from '../config/db.js';
import { users } from '../db/schema.js';
import * as schema from '../db/schema.js';
import { desc, eq, and } from 'drizzle-orm';
export class UserService {
    static async loginByPin(role, pin) {
        const [user] = await db.select()
            .from(users)
            .where(and(eq(users.role, role), eq(users.pin, pin)))
            .limit(1);
        return user;
    }
    static async getAllUsers() {
        return await db.select().from(users).orderBy(desc(users.createdAt));
    }
    static async createUser(data, currentUserId) {
        const { name, email, role, pin } = data;
        const [newUser] = await db.insert(users).values({
            id: crypto.randomUUID(),
            name,
            email,
            emailVerified: true,
            role,
            pin,
            createdAt: new Date(),
            updatedAt: new Date()
        }).returning();
        await db.insert(schema.auditLogs).values({
            userId: currentUserId,
            action: `CREATE_USER: ${newUser.name} (${newUser.role})`,
            tableName: 'user',
            newData: JSON.stringify(newUser),
            createdAt: new Date()
        });
        return newUser;
    }
    static async updateUser(id, data, currentUserId) {
        const { name, email, role, pin } = data;
        const oldUser = await db.select().from(users).where(eq(users.id, id)).limit(1);
        const [updatedUser] = await db.update(users)
            .set({
            name,
            email,
            role,
            pin,
            updatedAt: new Date()
        })
            .where(eq(users.id, id))
            .returning();
        if (updatedUser) {
            await db.insert(schema.auditLogs).values({
                userId: currentUserId,
                action: `UPDATE_USER: ${updatedUser.name}`,
                tableName: 'user',
                oldData: JSON.stringify(oldUser[0]),
                newData: JSON.stringify(updatedUser),
                createdAt: new Date()
            });
        }
        return updatedUser;
    }
    static async deleteUser(id, currentUserId) {
        const [deletedUser] = await db.delete(users)
            .where(eq(users.id, id))
            .returning();
        if (deletedUser) {
            await db.insert(schema.auditLogs).values({
                userId: currentUserId,
                action: `DELETE_USER: ${deletedUser.name}`,
                tableName: 'user',
                oldData: JSON.stringify(deletedUser),
                createdAt: new Date()
            });
        }
        return deletedUser;
    }
    static async createSessionManual(userId) {
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const [session] = await db.insert(schema.sessions).values({
            id: crypto.randomUUID(),
            userId,
            token: hashedToken,
            createdAt: new Date(),
            updatedAt: new Date(),
            expiresAt
        }).returning();
        return session;
    }
    static async getSessionByToken(token) {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const [session] = await db.select({
            id: schema.sessions.id,
            userId: schema.sessions.userId,
            expiresAt: schema.sessions.expiresAt,
            user: {
                id: users.id,
                name: users.name,
                email: users.email,
                role: users.role
            }
        })
            .from(schema.sessions)
            .innerJoin(users, eq(schema.sessions.userId, users.id))
            .where(eq(schema.sessions.token, hashedToken))
            .limit(1);
        if (session && new Date(session.expiresAt) > new Date()) {
            return session;
        }
        return null;
    }
    // New: Retrieve session by its exact UUID (useful for the Bearer token check from localStorage)
    static async getSessionById(sessionId) {
        const [session] = await db.select({
            id: schema.sessions.id,
            userId: schema.sessions.userId,
            expiresAt: schema.sessions.expiresAt,
            user: {
                id: users.id,
                name: users.name,
                email: users.email,
                role: users.role
            }
        })
            .from(schema.sessions)
            .innerJoin(users, eq(schema.sessions.userId, users.id))
            .where(eq(schema.sessions.id, sessionId))
            .limit(1);
        if (session && new Date(session.expiresAt) > new Date()) {
            return session;
        }
        return null;
    }
    // New: Retrieve session by already hashed token (useful for cookie check since cookie stores the hash)
    static async getSessionByHashedToken(hashedToken) {
        const [session] = await db.select({
            id: schema.sessions.id,
            userId: schema.sessions.userId,
            expiresAt: schema.sessions.expiresAt,
            user: {
                id: users.id,
                name: users.name,
                email: users.email,
                role: users.role
            }
        })
            .from(schema.sessions)
            .innerJoin(users, eq(schema.sessions.userId, users.id))
            .where(eq(schema.sessions.token, hashedToken))
            .limit(1);
        if (session && new Date(session.expiresAt) > new Date()) {
            return session;
        }
        return null;
    }
    // Delete session by hashing a plaintext token first
    static async deleteSessionByToken(token) {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const deleted = await db.delete(schema.sessions)
            .where(eq(schema.sessions.token, hashedToken))
            .returning();
        return deleted.length > 0;
    }
    // Delete session by its UUID primary key (used when Bearer token = session.id)
    static async deleteSessionById(sessionId) {
        const deleted = await db.delete(schema.sessions)
            .where(eq(schema.sessions.id, sessionId))
            .returning();
        return deleted.length > 0;
    }
    // Delete session by already-hashed token (used when cookie stores the hash)
    static async deleteSessionByHashedToken(hashedToken) {
        const deleted = await db.delete(schema.sessions)
            .where(eq(schema.sessions.token, hashedToken))
            .returning();
        return deleted.length > 0;
    }
    static async logAction(userId, action, tableName, oldData, newData) {
        await db.insert(schema.auditLogs).values({
            userId,
            action,
            tableName,
            oldData: oldData ? JSON.stringify(oldData) : null,
            newData: newData ? JSON.stringify(newData) : null,
            createdAt: new Date()
        });
    }
}
