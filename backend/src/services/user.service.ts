import crypto from 'crypto';
import { db } from '../config/db';
import { users } from '../db/schema';
import * as schema from '../db/schema';
import { desc, eq } from 'drizzle-orm';

export class UserService {
    static async getAllUsers() {
        return await db.select().from(users).orderBy(desc(users.createdAt));
    }

    static async createUser(data: any, currentUserId: string) {
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

    static async updateUser(id: string, data: any, currentUserId: string) {
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

    static async deleteUser(id: string, currentUserId: string) {
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
}
