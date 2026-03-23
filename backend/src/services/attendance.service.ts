import { db } from '../config/db.js';
import * as schema from '../db/schema.js';
import { eq, and, between, desc, sql, like } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

export class AttendanceService {
    static async getTodayAttendance(userId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tonight = new Date();
        tonight.setHours(23, 59, 59, 999);

        const [record] = await db.select()
            .from(schema.attendance)
            .where(
                and(
                    eq(schema.attendance.userId, userId),
                    between(schema.attendance.date, today, tonight)
                )
            ).limit(1);
        
        return record || null;
    }

    static async checkIn(userId: string, photoPath?: string) {
        const today = new Date();
        const dayStart = new Date(today);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(today);
        dayEnd.setHours(23, 59, 59, 999);

        // 1. Check if already checked in
        const existing = await this.getTodayAttendance(userId);
        if (existing?.checkIn) {
            throw new Error('Anda sudah melakukan Check-In hari ini.');
        }

        // 2. Determine status based on shift
        let status = 'Hadir';
        const [shift] = await db.select()
            .from(schema.workShifts)
            .where(
                and(
                    eq(schema.workShifts.userId, userId),
                    between(schema.workShifts.date, dayStart, dayEnd)
                )
            ).limit(1);

        if (shift) {
            const [shiftH, shiftM] = (shift.startTime as string).split(':').map(Number);
            const shiftTime = new Date(today);
            shiftTime.setHours(shiftH, shiftM, 0, 0);
            
            if (today > shiftTime) {
                status = 'Terlambat';
            }
        }

        // 3. Insert or Update
        if (existing) {
            return await db.update(schema.attendance)
                .set({ checkIn: today, status, checkInPhoto: photoPath, createdAt: new Date() })
                .where(eq(schema.attendance.id, existing.id))
                .returning();
        } else {
            return await db.insert(schema.attendance).values({
                userId,
                date: dayStart,
                checkIn: today,
                checkInPhoto: photoPath,
                status,
                createdAt: new Date()
            }).returning();
        }
    }

    static async checkOut(userId: string, photoPath?: string) {
        const existing = await this.getTodayAttendance(userId);
        if (!existing) {
            throw new Error('Anda belum melakukan Check-In hari ini.');
        }
        if (existing.checkOut) {
            throw new Error('Anda sudah melakukan Check-Out hari ini.');
        }

        return await db.update(schema.attendance)
            .set({ checkOut: new Date(), checkOutPhoto: photoPath })
            .where(eq(schema.attendance.id, existing.id))
            .returning();
    }

    static async getHistory(filters: { userId?: string; startDate?: string; endDate?: string; name?: string }) {
        let query = db.select({
            id: schema.attendance.id,
            userId: schema.attendance.userId,
            userName: schema.users.name,
            date: schema.attendance.date,
            checkIn: schema.attendance.checkIn,
            checkOut: schema.attendance.checkOut,
            checkInPhoto: schema.attendance.checkInPhoto,
            checkOutPhoto: schema.attendance.checkOutPhoto,
            status: schema.attendance.status,
        })
        .from(schema.attendance)
        .innerJoin(schema.users, eq(schema.attendance.userId, schema.users.id))
        .orderBy(desc(schema.attendance.date));

        const conditions = [];

        if (filters.userId) {
            conditions.push(eq(schema.attendance.userId, filters.userId));
        }
        if (filters.name) {
            conditions.push(like(schema.users.name, `%${filters.name}%`));
        }
        if (filters.startDate && filters.endDate) {
            conditions.push(between(schema.attendance.date, new Date(filters.startDate), new Date(filters.endDate)));
        }

        if (conditions.length > 0) {
            // @ts-ignore
            query = query.where(and(...conditions));
        }

        return await query;
    }

    static async deleteRecord(id: string) {
        const numericId = parseInt(id);
        // 1. Get record to find photos
        const [record] = await db.select().from(schema.attendance).where(eq(schema.attendance.id, numericId)).limit(1);
        
        if (record) {
            // 2. Delete photos if segments exist
            const photos = [record.checkInPhoto, record.checkOutPhoto].filter(Boolean) as string[];
            for (const photo of photos) {
                const filePath = path.resolve(process.cwd(), 'uploads', photo);
                if (fs.existsSync(filePath)) {
                    try {
                        fs.unlinkSync(filePath);
                        console.log(`[DeleteRecord] Cleaned up file: ${photo}`);
                    } catch (e) {
                        console.error(`Failed to delete file ${photo}:`, e);
                    }
                }
            }
        }

        // 3. Delete from DB
        return await db.delete(schema.attendance)
            .where(eq(schema.attendance.id, numericId))
            .returning();
    }
}
