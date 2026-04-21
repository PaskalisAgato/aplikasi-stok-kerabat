import 'dotenv/config';
import app from './app.js';
import cron from 'node-cron';
import { BackupService } from './services/backup.service.js';

const PORT = process.env.PORT || 5000;

// Jadwalkan Auto-Backup setiap hari pukul 03:00 Pagi (Waktu Server)
cron.schedule('0 3 * * *', async () => {
    console.log('[CRON] Menjalankan Auto-Backup Harian (03:00 AM)...');
    await BackupService.runDailyBackup();
});

const server = app.listen(PORT, () => {
    console.log(`\n--- SERVER STARTUP ---`);
    console.log(`🚀 Port: ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Database: ${process.env.DATABASE_URL ? 'Configured' : 'MISSING'}`);
    console.log(`🛡️  Auto-Backup terpasang (Jadwal: 03:00 WIB)`);
    console.log(`-----------------------\n`);
});

server.on('error', (error: any) => {
    console.error(`[FATAL_SERVER_ERROR]`, error);
    process.exit(1);
});
