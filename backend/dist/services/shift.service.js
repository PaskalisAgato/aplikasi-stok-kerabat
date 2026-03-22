import { db } from '../config/db.js';
import * as schema from '../db/schema.js';
import { eq, and, between, desc } from 'drizzle-orm';
export class ShiftService {
    static async getAllShifts() {
        return await db.select({
            id: schema.workShifts.id,
            userId: schema.workShifts.userId,
            userName: schema.users.name,
            userRole: schema.users.role,
            date: schema.workShifts.date,
            startTime: schema.workShifts.startTime,
            endTime: schema.workShifts.endTime,
        })
            .from(schema.workShifts)
            .innerJoin(schema.users, eq(schema.workShifts.userId, schema.users.id))
            .orderBy(desc(schema.workShifts.date));
    }
    static async getShiftsByUser(userId) {
        return await db.select()
            .from(schema.workShifts)
            .where(eq(schema.workShifts.userId, userId))
            .orderBy(desc(schema.workShifts.date));
    }
    static async createShift(userId, date, startTime, endTime, currentUserId) {
        // Simple conflict validation: same user, same day
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);
        const existing = await db.select()
            .from(schema.workShifts)
            .where(and(eq(schema.workShifts.userId, userId), between(schema.workShifts.date, dayStart, dayEnd)));
        if (existing.length > 0) {
            throw new Error('Karyawan sudah memiliki shift pada tanggal tersebut.');
        }
        const [newShift] = await db.insert(schema.workShifts).values({
            userId,
            date,
            startTime,
            endTime,
            createdAt: new Date(),
            updatedAt: new Date()
        }).returning();
        // Log action
        await db.insert(schema.auditLogs).values({
            userId: currentUserId,
            action: `CREATE_SHIFT for user ${userId} on ${date.toDateString()}`,
            tableName: 'work_shifts',
            newData: JSON.stringify(newShift),
            createdAt: new Date()
        });
        return newShift;
    }
    static async updateShift(id, data, currentUserId) {
        const { startTime, endTime, date } = data;
        const [oldShift] = await db.select().from(schema.workShifts).where(eq(schema.workShifts.id, id)).limit(1);
        const [updatedShift] = await db.update(schema.workShifts)
            .set({
            startTime,
            endTime,
            date: date ? new Date(date) : undefined,
            updatedAt: new Date()
        })
            .where(eq(schema.workShifts.id, id))
            .returning();
        if (updatedShift) {
            await db.insert(schema.auditLogs).values({
                userId: currentUserId,
                action: `UPDATE_SHIFT ID: ${id}`,
                tableName: 'work_shifts',
                oldData: JSON.stringify(oldShift),
                newData: JSON.stringify(updatedShift),
                createdAt: new Date()
            });
        }
        return updatedShift;
    }
    static async deleteShift(id, currentUserId) {
        const [deletedShift] = await db.delete(schema.workShifts)
            .where(eq(schema.workShifts.id, id))
            .returning();
        if (deletedShift) {
            await db.insert(schema.auditLogs).values({
                userId: currentUserId,
                action: `DELETE_SHIFT ID: ${id}`,
                tableName: 'work_shifts',
                oldData: JSON.stringify(deletedShift),
                createdAt: new Date()
            });
        }
        return deletedShift;
    }
}
