import { db } from '../config/db.js';
import * as schema from '../db/schema.js';
import { eq, and, between, desc, sql, like } from 'drizzle-orm';
import { deleteFromCloudinary } from '../utils/cloudinary.js';

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

    static async checkIn(userId: string, photoPath?: string, locationData?: { latitude?: number; longitude?: number; location?: string }) {
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

        const timestampStr = new Date().toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit' });

        // 3. Insert or Update
        if (existing) {
            return await db.update(schema.attendance)
                .set({ 
                    checkIn: today, 
                    status, 
                    checkInPhoto: photoPath, 
                    checkInTimestamp: timestampStr,
                    location: locationData?.location,
                    latitude: locationData?.latitude?.toString(),
                    longitude: locationData?.longitude?.toString(),
                    createdAt: new Date() 
                })
                .where(eq(schema.attendance.id, existing.id))
                .returning();
        } else {
            return await db.insert(schema.attendance).values({
                userId,
                date: dayStart,
                checkIn: today,
                checkInPhoto: photoPath,
                checkInTimestamp: timestampStr,
                location: locationData?.location,
                latitude: locationData?.latitude?.toString(),
                longitude: locationData?.longitude?.toString(),
                status,
                createdAt: new Date()
            }).returning();
        }
    }

    static async checkOut(userId: string, photoPath?: string, locationData?: { latitude?: number; longitude?: number; location?: string }) {
        const existing = await this.getTodayAttendance(userId);
        if (!existing) {
            throw new Error('Anda belum melakukan Check-In hari ini.');
        }
        if (existing.checkOut) {
            throw new Error('Anda sudah melakukan Check-Out hari ini.');
        }

        const timestampStr = new Date().toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit' });

        return await db.update(schema.attendance)
            .set({ 
                checkOut: new Date(), 
                checkOutPhoto: photoPath,
                checkOutTimestamp: timestampStr,
                // Update location if provided during logout, or keep existing from login
                location: locationData?.location || existing.location,
                latitude: locationData?.latitude?.toString() || existing.latitude,
                longitude: locationData?.longitude?.toString() || existing.longitude,
            })
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
            // 2. Delete photos from Cloudinary
            const photos = [record.checkInPhoto, record.checkOutPhoto].filter(Boolean) as string[];
            for (const photo of photos) {
                if (photo.includes('cloudinary.com')) {
                    await deleteFromCloudinary(photo);
                }
            }
        }

        // 3. Delete from DB
        return await db.delete(schema.attendance)
            .where(eq(schema.attendance.id, numericId))
            .returning();
    }

    static async deleteByRange(startDate: string, endDate: string) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        // 1. Find all records in range to clean up photos
        const records = await db.select()
            .from(schema.attendance)
            .where(between(schema.attendance.date, start, end));

        let deletedFiles = 0;
        for (const record of records) {
            const photos = [record.checkInPhoto, record.checkOutPhoto].filter(Boolean) as string[];
            for (const photo of photos) {
                if (photo.includes('cloudinary.com')) {
                    const success = await deleteFromCloudinary(photo);
                    if (success) deletedFiles++;
                }
            }
        }

        // 2. Delete from DB
        const result = await db.delete(schema.attendance)
            .where(between(schema.attendance.date, start, end))
            .returning();

        return { count: result.length, filesDeleted: deletedFiles };
    }

    static async clearPhotoUrl(filename: string) {
        await db.update(schema.attendance)
            .set({ checkInPhoto: null })
            .where(like(schema.attendance.checkInPhoto, `%${filename}%`));

        await db.update(schema.attendance)
            .set({ checkOutPhoto: null })
            .where(like(schema.attendance.checkOutPhoto, `%${filename}%`));
    }
}
