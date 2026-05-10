import { db } from './src/config/db.js';
import * as schema from './src/db/schema.js';
import { eq } from 'drizzle-orm';

async function patchTemplate() {
    try {
        const [updated] = await db.update(schema.discounts)
            .set({ conditions: '{}' }) // Clear conditions
            .where(eq(schema.discounts.id, 10))
            .returning();
        
        console.log('--- PATCH SUCCESSFUL ---');
        console.log(JSON.stringify(updated, null, 2));
    } catch (e) {
        console.error('Database Error:', e);
    }
    process.exit(0);
}

patchTemplate().catch(err => {
    console.error('Fatal Error:', err);
    process.exit(1);
});
