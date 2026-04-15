import { db } from './src/config/db.js';
import * as schema from './src/db/schema.js';

async function main() {
    console.log("=== USER CHECK ===");
    const users = await db.select().from(schema.users);
    console.log("Total Users:", users.length);
    for(let u of users) {
        console.log(`- ID: ${u.id}, Name: ${u.name}, Role: ${u.role}`);
    }

    const shifts = await db.select().from(schema.shifts);
    console.log("\nShifts with User existence check:");
    for(let s of shifts) {
        const userExists = users.find(u => u.id === s.userId);
        console.log(`- Shift ID: ${s.id}, UserId: ${s.userId}, Status: ${s.status}, UserFound: ${!!userExists}`);
    }

    process.exit(0);
}
main();
