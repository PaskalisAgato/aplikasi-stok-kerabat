import { db } from '../config/db.js';
import * as schema from '../db/schema.js';
import { eq, and, between, gte, lte, desc } from 'drizzle-orm';

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
            note: schema.workShifts.note,
        })
        .from(schema.workShifts)
        .innerJoin(schema.users, eq(schema.workShifts.userId, schema.users.id))
        .orderBy(desc(schema.workShifts.date));
    }

    static async getShiftsByUser(userId: string) {
        return await db.select()
            .from(schema.workShifts)
            .where(eq(schema.workShifts.userId, userId))
            .orderBy(desc(schema.workShifts.date));
    }

    static async createShift(userId: string, date: Date, startTime: string, endTime: string, currentUserId: string) {
        // Simple conflict validation: same user, same day
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        const existing = await db.select()
            .from(schema.workShifts)
            .where(
                and(
                    eq(schema.workShifts.userId, userId),
                    between(schema.workShifts.date, dayStart, dayEnd)
                )
            );

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

    static async updateShift(id: number, data: any, currentUserId: string) {
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

    static async deleteShift(id: number, currentUserId: string) {
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

    static async batchSave(shifts: any[], currentUserId: string, options?: { startDate?: string, endDate?: string, userIdsToSync?: string[] }) {
        const { inArray, and, gte, lte } = await import('drizzle-orm');
        console.log('[ShiftService] batchSave triggered:', { 
            shiftCount: shifts.length, 
            userIdsToSync: options?.userIdsToSync, 
            range: `${options?.startDate} to ${options?.endDate}` 
        });
        
        return await db.transaction(async (tx) => {
            let userIds: string[] = [];
            let minDate: Date;
            let maxDate: Date;

            if (options?.startDate && options?.endDate && options?.userIdsToSync) {
                userIds = options.userIdsToSync;
                minDate = new Date(options.startDate);
                // Set maxDate to the end of the day to ensure full coverage
                maxDate = new Date(options.endDate);
                maxDate.setHours(23, 59, 59, 999);
            } else {
                if (shifts.length === 0) return { count: 0 };
                userIds = [...new Set(shifts.map(s => s.userId))];
                const timeList = shifts.map(s => new Date(s.date).getTime());
                minDate = new Date(Math.min(...timeList));
                maxDate = new Date(Math.max(...timeList));
                maxDate.setHours(23, 59, 59, 999);
            }

            console.log('[ShiftService] Cleanup range:', { minDate, maxDate, users: userIds.length });

            if (userIds.length > 0) {
                const deleted = await tx.delete(schema.workShifts)
                    .where(
                        and(
                            gte(schema.workShifts.date, minDate),
                            lte(schema.workShifts.date, maxDate),
                            inArray(schema.workShifts.userId, userIds)
                        )
                    ).returning();
                console.log(`[ShiftService] Deleted ${deleted.length} existing shifts.`);
            }

            let insertedCount = 0;
            if (shifts.length > 0) {
                const inserted = await tx.insert(schema.workShifts).values(
                    shifts.map(s => ({
                        userId: s.userId,
                        date: new Date(s.date),
                        startTime: s.startTime,
                        endTime: s.endTime,
                        note: s.note,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }))
                ).returning();
                insertedCount = inserted.length;
                console.log(`[ShiftService] Inserted ${insertedCount} new shifts.`);
            }

            await tx.insert(schema.auditLogs).values({
                userId: currentUserId,
                action: `BATCH_SAVE_SHIFTS: ${insertedCount} items saved, synced for ${userIds.length} users`,
                tableName: 'work_shifts',
                newData: JSON.stringify({ count: insertedCount, userIdsSynced: userIds.length }),
                createdAt: new Date()
            });

            return { count: insertedCount };
        });
    }
}
