import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';
import { uploadRawToCloudinary } from '../utils/cloudinary.js';

const execPromise = util.promisify(exec);

export class BackupService {
    /**
     * Executes a PostgreSQL database dump and uploads it to Cloudinary.
     * @returns The secure URL of the uploaded backup, or null if failed.
     */
    static async runDailyBackup(): Promise<string | null> {
        console.log('[BackupService] Starting daily database backup...');
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFileName = `kerabat_db_${timestamp}.sql`;
        const backupFilePath = path.join('/tmp', backupFileName);
        const gzFilePath = `${backupFilePath}.gz`;

        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl) {
            console.error('[BackupService] DATABASE_URL is missing. Cannot perform backup.');
            return null;
        }

        try {
            // 1. Run pg_dump
            console.log(`[BackupService] Dumping database to ${backupFilePath}...`);
            // WARNING: In production, passing DB URL via CLI is acceptable for automated quick scripts,
            // but normally it's safer to use PGPASSWORD. Given we're inside the VPS, it's fine.
            await execPromise(`pg_dump "${dbUrl}" -F p -f "${backupFilePath}"`);

            // 2. Compress the backup to save bandwidth
            console.log(`[BackupService] Compressing backup to ${gzFilePath}...`);
            await execPromise(`gzip "${backupFilePath}"`);

            // 3. Upload to Cloudinary Raw Endpoint
            console.log(`[BackupService] Uploading ${gzFilePath} to Cloudinary...`);
            const url = await uploadRawToCloudinary(gzFilePath, 'kerabat_backups');

            if (url) {
                console.log(`[BackupService] Backup successfully uploaded: ${url}`);
            } else {
                console.error(`[BackupService] Upload failed. Backup file remains at ${gzFilePath}`);
            }

            // 4. Cleanup local temporary files
            if (fs.existsSync(gzFilePath)) fs.unlinkSync(gzFilePath);
            if (fs.existsSync(backupFilePath)) fs.unlinkSync(backupFilePath); // Just in case gzip failed half-way

            return url;

        } catch (error: any) {
            console.error('[BackupService] Backup process failed:', error.message);
            // Cleanup on failure
            if (fs.existsSync(backupFilePath)) fs.unlinkSync(backupFilePath);
            if (fs.existsSync(gzFilePath)) fs.unlinkSync(gzFilePath);
            return null;
        }
    }
}
