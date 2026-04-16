// scripts/diagnose-shifts.ts
import { db } from '../config/db.js';
import * as schema from '../db/schema.js';
import { gte, desc } from 'drizzle-orm';

async function diagnose() {
    console.log("=== Diagnosing Recent Shifts ===");
    
    // Fetch shifts from last 3 days
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    const recentShifts = await db.select({
        id: schema.shifts.id,
        startTime: schema.shifts.startTime,
        endTime: schema.shifts.endTime,
        status: schema.shifts.status,
        cashier: schema.users.name
    })
    .from(schema.shifts)
    .innerJoin(schema.users, eq(schema.shifts.userId, schema.users.id))
    .where(gte(schema.shifts.startTime, threeDaysAgo))
    .orderBy(desc(schema.shifts.startTime));
    
    console.log(`Found ${recentShifts.length} shifts:`);
    recentShifts.forEach(s => {
        console.log(`ID: ${s.id} | Cashier: ${s.cashier} | Start: ${s.startTime.toISOString()} (${s.startTime.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}) | End: ${s.endTime ? s.endTime.toISOString() : 'OPEN'}`);
    });

    const now = new Date();
    const jakartaDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(now);
    console.log(`\nToday (WIB): ${jakartaDate}`);
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayJakartaDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(yesterday);
    console.log(`Yesterday (WIB): ${yesterdayJakartaDate}`);

    const startYesterday = new Date(`${yesterdayJakartaDate}T00:00:00+07:00`);
    const endYesterday = new Date(`${yesterdayJakartaDate}T23:59:59.999+07:00`);
    
    console.log(`\nQuery Range for Yesterday:`);
    console.log(`START: ${startYesterday.toISOString()}`);
    console.log(`END:   ${endYesterday.toISOString()}`);
    
    const yesterdayShifts = recentShifts.filter(s => s.startTime >= startYesterday && s.startTime <= endYesterday);
    console.log(`\nShifts that WOULD be caught in Yesterday Query: ${yesterdayShifts.length}`);
    yesterdayShifts.forEach(s => console.log(` - ID: ${s.id}`));
}

import { eq } from 'drizzle-orm';
diagnose().catch(console.error);
