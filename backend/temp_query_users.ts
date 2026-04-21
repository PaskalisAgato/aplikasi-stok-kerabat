import { db } from './src/db/index.js';
import { users } from './src/db/schema.js';

async function main() {
    try {
        const res = await db.select().from(users);
        console.log(JSON.stringify(res, null, 2));
    } catch (err) {
        console.error(err);
    }
}

main();
