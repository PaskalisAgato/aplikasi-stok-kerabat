import { db } from './src/config/db.js';
import { users } from './src/db/schema.js';

async function main() {
    try {
        const allUsers = await db.select().from(users);
        console.log('--- User List ---');
        allUsers.forEach(u => {
            console.log(`ID: ${u.id} | Name: ${u.name} | isDeleted: ${u.isDeleted} | status: ${u.status}`);
        });
    } catch (error) {
        console.error('Error fetching users:', error);
    } finally {
        process.exit(0);
    }
}

main();
