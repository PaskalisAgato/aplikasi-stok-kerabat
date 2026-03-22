import { db } from './src/db';
import { users } from './src/db/schema.js';
import { sql } from 'drizzle-orm';

async function manageUsers() {
    try {
        console.log("Checking database schema...");
        
        // Ensure columns exist (Raw SQL to be safe)
        try {
            await db.execute(sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "pin" TEXT;`);
            await db.execute(sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT 'Karyawan';`);
            console.log("Schema verified/updated.");
        } catch (e) {
            console.log("Schema update noted (might already exist):", (e as any).message);
        }

        // Check for Admin
        let admin = await db.query.users.findFirst({
            where: (users, { eq }) => eq(users.role, 'Admin')
        });

        if (!admin) {
            console.log("No Admin found. Creating default Admin...");
            const adminId = 'admin_' + Date.now();
            await db.insert(users).values({
                id: adminId,
                name: 'Admin Toko',
                email: 'admin@kerabat.com',
                emailVerified: true,
                role: 'Admin',
                pin: '1234',
                createdAt: new Date(),
                updatedAt: new Date()
            });
            console.log("Admin created: user: Admin, PIN: 1234");
        } else {
            console.log(`Admin found: ${admin.name}, PIN: ${admin.pin || '1234'}`);
            if (!admin.pin) {
                console.log("Admin exists but has no PIN. Setting to 1234...");
                await db.update(users).set({ pin: '1234' }).where(sql`id = ${admin.id}`);
            }
        }

        // Check for Karyawan
        let employee = await db.query.users.findFirst({
            where: (users, { eq }) => eq(users.role, 'Karyawan')
        });

        if (!employee) {
            console.log("No Karyawan found. Creating default Karyawan...");
            const empId = 'emp_' + Date.now();
            await db.insert(users).values({
                id: empId,
                name: 'Karyawan Toko',
                email: 'karyawan@kerabat.com',
                emailVerified: true,
                role: 'Karyawan',
                pin: '5678',
                createdAt: new Date(),
                updatedAt: new Date()
            });
            console.log("Karyawan created: user: Karyawan, PIN: 5678");
        } else {
            console.log(`Karyawan found: ${employee.name}, PIN: ${employee.pin || '5678'}`);
            if (!employee.pin) {
                console.log("Karyawan exists but has no PIN. Setting to 5678...");
                await db.update(users).set({ pin: '5678' }).where(sql`id = ${employee.id}`);
            }
        }

        process.exit(0);
    } catch (error) {
        console.error("Critical error in manageUsers:", error);
        process.exit(1);
    }
}

manageUsers();
