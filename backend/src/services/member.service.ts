import { eq, or, ilike, desc } from 'drizzle-orm';
import { db } from '../config/db.js';
import * as schema from '../db/schema.js';

// Points calculation defaults
const DEFAULT_RATIO = 10000; // Rp X = 1 point
const DEFAULT_VALUE = 100;   // 1 point = Rp X

export class MemberService {
    static async getAllMembers(search = '') {
        if (search) {
            return await db.select().from(schema.members)
                .where(or(
                    ilike(schema.members.name, `%${search}%`),
                    ilike(schema.members.phone, `%${search}%`)
                ));
        }
        return await db.select().from(schema.members);
    }

    static async getMemberById(id: number) {
        const [member] = await db.select().from(schema.members).where(eq(schema.members.id, id)).limit(1);
        return member || null;
    }

    static async getMemberByPhone(phone: string) {
        const [member] = await db.select().from(schema.members).where(eq(schema.members.phone, phone)).limit(1);
        return member || null;
    }

    static async createMember(data: { name: string; phone: string; email?: string }) {
        const existing = await this.getMemberByPhone(data.phone);
        if (existing) throw new Error(`Member dengan No HP ${data.phone} sudah terdaftar.`);

        const [newMember] = await db.insert(schema.members).values({
            name: data.name,
            phone: data.phone,
            email: data.email || null,
            points: 0,
            level: 'bronze',
        }).returning();
        return newMember;
    }

    static async updateMember(id: number, data: { name?: string; email?: string; phone?: string; isActive?: boolean }) {
        const [updated] = await db.update(schema.members).set(data).where(eq(schema.members.id, id)).returning();
        if (!updated) throw new Error('Member tidak ditemukan');
        return updated;
    }

    static async adjustPoints(id: number, delta: number, reason = 'Manual Adjustment') {
        const member = await this.getMemberById(id);
        if (!member) throw new Error('Member tidak ditemukan');
        const newPoints = Math.max(0, member.points + delta);
        const newLevel = this.calcLevel(newPoints);
        const [updated] = await db.update(schema.members)
            .set({ points: newPoints, level: newLevel })
            .where(eq(schema.members.id, id))
            .returning();
        return { updated, delta, reason };
    }

    static async deleteMember(id: number) {
        await db.delete(schema.members).where(eq(schema.members.id, id));
    }

    static async getSettings() {
        try {
            const [settings] = await db.select().from(schema.loyaltySettings).orderBy(desc(schema.loyaltySettings.updatedAt)).limit(1);
            return {
                ratio: settings ? parseFloat(settings.pointRatio) : DEFAULT_RATIO,
                value: settings ? parseFloat(settings.pointValue) : DEFAULT_VALUE
            };
        } catch (e) {
            console.error("Error fetching loyalty settings:", e);
            return { ratio: DEFAULT_RATIO, value: DEFAULT_VALUE };
        }
    }

    static async calcPointsEarned(totalAmount: number): Promise<number> {
        const settings = await this.getSettings();
        return Math.floor(totalAmount / settings.ratio);
    }

    static async calcPointsValue(points: number): Promise<number> {
        const settings = await this.getSettings();
        // points → Rupiah
        return Math.floor(points * settings.value);
    }

    static calcLevel(points: number): string {
        if (points >= 1000) return 'gold';
        if (points >= 300) return 'silver';
        return 'bronze';
    }
}
