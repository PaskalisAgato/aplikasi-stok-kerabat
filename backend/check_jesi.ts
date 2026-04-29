import { db } from './src/config/db.js';
import * as schema from './src/db/schema.js';
import { eq, and, between, like, desc } from 'drizzle-orm';

async function run() {
    try {
        const users = await db.select().from(schema.users).where(like(schema.users.name, '%Jesi%'));
        console.log("Users matching Jesi:", users);

        if (users.length > 0) {
            const jesiId = users[0].id;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tonight = new Date();
            tonight.setHours(23, 59, 59, 999);

            console.log("Checking records for:", today.toISOString(), "to", tonight.toISOString());

            const recentRecords = await db.select()
                .from(schema.attendance)
                .where(
                    and(
                        eq(schema.attendance.userId, jesiId),
                        between(schema.attendance.date, new Date('2026-04-25T00:00:00'), new Date('2026-04-30T23:59:59'))
                    )
                )
                .orderBy(desc(schema.attendance.date));
            console.log("Jesi's records from April 25 to 30:", recentRecords);
        }
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}
run();
