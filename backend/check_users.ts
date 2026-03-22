import { db } from './src/db';
import { users } from './src/db/schema.js';

async function listUsers() {
    try {
        const allUsers = await db.select().from(users);
        console.log("Daftar Pengguna di Database:");
        allUsers.forEach(u => {
            console.log(`- Nama: ${u.name}, Email: ${u.email}, Role: ${u.role}, PIN: ${u.pin || '(Belum diset)'}`);
        });
        process.exit(0);
    } catch (error) {
        console.error("Gagal mengambil data pengguna:", error);
        process.exit(1);
    }
}

listUsers();
