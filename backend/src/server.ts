import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`\n--- SERVER STARTUP ---`);
    console.log(`🚀 Port: ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Database: ${process.env.DATABASE_URL ? 'Configured' : 'MISSING'}`);
    console.log(`-----------------------\n`);
});

server.on('error', (error: any) => {
    console.error(`[FATAL_SERVER_ERROR]`, error);
    process.exit(1);
});

