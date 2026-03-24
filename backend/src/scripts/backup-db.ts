import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import { backups } from '../db/schema.js';

/**
 * Enterprise Backup System
 * Exports all critical tables to a JSON file and tracks in DB
 */
async function performBackup() {
    console.log('--- Starting System Backup ---');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'backups');
    
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
    }

    const filename = `backup_${timestamp}.json`;
    const filePath = path.join(backupDir, filename);

    try {
        const data: any = {};
        const tables = [
            { name: 'users', table: schema.users },
            { name: 'inventory', table: schema.inventory },
            { name: 'recipes', table: schema.recipes },
            { name: 'recipeIngredients', table: schema.recipeIngredients },
            { name: 'sales', table: schema.sales },
            { name: 'saleItems', table: schema.saleItems },
            { name: 'expenses', table: schema.expenses },
            { name: 'suppliers', table: schema.suppliers },
            { name: 'attendance', table: schema.attendance },
            { name: 'todos', table: schema.todos },
            { name: 'todoCompletions', table: schema.todoCompletions },
            { name: 'auditLogs', table: schema.auditLogs },
            { name: 'inventoryPriceLogs', table: schema.inventoryPriceLogs }
        ];

        for (const t of tables) {
            process.stdout.write(`Exporting ${t.name}... `);
            data[t.name] = await db.select().from(t.table);
            console.log('Done');
        }

        const jsonContent = JSON.stringify(data, null, 2);
        fs.writeFileSync(filePath, jsonContent);
        const stats = fs.statSync(filePath);

        // Track in DB
        await db.insert(backups).values({
            filename: filename,
            size: stats.size,
            status: 'Success'
        });

        console.log(`\nBackup successful: ${filename} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
        return { success: true, filename, size: stats.size };
    } catch (error: any) {
        console.error('\nBackup failed:', error);
        await db.insert(backups).values({
            filename: filename,
            size: 0,
            status: 'Failed'
        });
        return { success: false, error: error.message };
    }
}

// Allow running directly
if (import.meta.url === `file://${process.argv[1]}`) {
    performBackup().then(() => process.exit(0));
}

export { performBackup };
