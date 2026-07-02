import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { tables } from '../db/schema.js';

export class TableService {
    static async getAllTables() {
        return await db.select().from(tables).where(eq(tables.isActive, true));
    }

    static async createTable(data: any) {
        const [table] = await db.insert(tables).values({
            name: data.name,
            shape: data.shape || 'rect',
            x: data.x || 0,
            y: data.y || 0,
            width: data.width || 100,
            height: data.height || 100,
            isActive: true
        }).returning();
        return table;
    }

    static async updateTable(id: number, data: any) {
        const [updated] = await db.update(tables)
            .set({
                name: data.name,
                shape: data.shape,
                x: data.x,
                y: data.y,
                width: data.width,
                height: data.height
            })
            .where(eq(tables.id, id))
            .returning();
        return updated;
    }

    static async deleteTable(id: number) {
        await db.update(tables)
            .set({ isActive: false })
            .where(eq(tables.id, id));
        return true;
    }

    static async updateBulkPositions(items: any[]) {
        // Since sqlite doesn't easily support bulk update easily in drizzle without complex raw SQL, 
        // we map individual updates (it is postgres actually, but for simplicity we can do Promise.all)
        // If there's 50 tables, 50 queries is extremely fast anyway.
        const promises = items.map(async (item) => {
            return await db.update(tables)
                .set({
                    x: item.x,
                    y: item.y,
                    width: item.width,
                    height: item.height,
                    shape: item.shape
                })
                .where(eq(tables.id, item.id));
        });

        await Promise.all(promises);
        return true;
    }
}
