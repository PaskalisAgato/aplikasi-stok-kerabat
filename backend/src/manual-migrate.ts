import pg from 'pg';
import 'dotenv/config';

const { Client } = pg;

async function migrate() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });

    try {
        await client.connect();
        console.log('Connected to DB');

        // Add missing columns if they don't exist
        try {
            await client.query("ALTER TABLE expenses ADD COLUMN vendor TEXT;");
            console.log('Added vendor');
        } catch (e: any) { console.log('vendor exists or error:', e.message); }

        try {
            await client.query("ALTER TABLE expenses ADD COLUMN external_receipt_url TEXT;");
            console.log('Added external_receipt_url');
        } catch (e: any) { console.log('external_receipt_url exists or error:', e.message); }

        try {
            await client.query("ALTER TABLE expenses ADD COLUMN fund_source TEXT DEFAULT 'CASHIER' NOT NULL;");
            console.log('Added fund_source');
        } catch (e: any) { console.log('fund_source exists or error:', e.message); }

        console.log('Done!');
    } catch (e: any) {
        console.error('Migration failed:', e.message);
    } finally {
        await client.end();
    }
}

migrate();
