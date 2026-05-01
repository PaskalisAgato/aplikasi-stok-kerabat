import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const { Client } = pg;
const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    const migrationPath = path.join(__dirname, 'src/db/migrate_promo_v2.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Using DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');
    console.log('Connecting to database...');
    try {
        await client.connect();
        console.log('Connected! Running migration SQL...');
        await client.query(migrationSql);
        console.log('Migration successful!');
    } catch (error: any) {
        console.error('Migration failed!');
        console.error('Error Code:', error.code);
        console.error('Error message:', error.message);
    } finally {
        await client.end();
        console.log('Database connection closed.');
    }
}

run();
