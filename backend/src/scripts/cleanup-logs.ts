import { db } from '../db/index.js';
import { systemLogs } from '../db/schema.js';
import { and, lt, ne } from 'drizzle-orm';

async function cleanupOldLogs() {
    console.log('--- Starting System Log Cleanup ---');
    
    // Calculate date: 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    console.log(`Deleting all logs older than: ${thirtyDaysAgo.toISOString()}`);
    
    try {
        // Section 9: Never delete critical ERROR logs
        const result = await db.delete(systemLogs).where(
            and(
                lt(systemLogs.createdAt, thirtyDaysAgo),
                ne(systemLogs.level, 'ERROR')
            )
        );
        console.log(`--- Cleanup Completed successfully ---`);
    } catch (error) {
       console.error('--- Cleanup Failed ---', error);
    }
}

cleanupOldLogs().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
