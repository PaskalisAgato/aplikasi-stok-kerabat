import { db } from './db/index.js';
import * as schema from './db/schema.js';
import { sql } from 'drizzle-orm';
import 'dotenv/config';
async function testUserCount() {
    console.log('Testing USER Count...');
    try {
        const result = await db.select({ count: sql `count(*)` }).from(schema.users);
        console.log(`Success! Total users: ${JSON.stringify(result[0])}`);
        process.exit(0);
    }
    catch (error) {
        console.error('FAILED to fetch user count:');
        console.error(error.message);
        process.exit(1);
    }
}
testUserCount();
