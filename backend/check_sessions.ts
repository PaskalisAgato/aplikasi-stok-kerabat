import { db } from './src/db';
import { sessions, users } from './src/db/schema';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';

async function checkSessions() {
    try {
        const allSessions = await db.select().from(sessions);
        let output = `Ditemukan ${allSessions.length} sesi di database.\n\n`;
        
        for (const s of allSessions) {
            const user = await db.query.users.findFirst({
                where: eq(users.id, s.userId)
            });
            output += `- Session ID: ${s.id}\n`;
            output += `  Token: ${s.token}\n`;
            output += `  User: ${user?.name} (Role: ${user?.role})\n`;
            output += `  Expires: ${s.expiresAt}\n`;
            output += `  Created: ${s.createdAt}\n`;
            output += `-------------------\n`;
        }
        fs.writeFileSync('sessions_output.txt', output);
        console.log("Output written to sessions_output.txt");
        process.exit(0);
    } catch (error) {
        console.error("Gagal mengecek sesi:", error);
        process.exit(1);
    }
}

checkSessions();
