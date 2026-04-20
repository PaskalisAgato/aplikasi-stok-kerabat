import { db } from './backend/src/db/index.ts';
import { members, discounts } from './backend/src/db/schema.ts';

async function checkData() {
    try {
        console.log('--- Database Consistency Check ---');
        
        const allMembers = await db.select().from(members);
        console.log(`Members Count: ${allMembers.length}`);
        
        const allDiscounts = await db.select().from(discounts);
        console.log(`Discounts Count: ${allDiscounts.length}`);
        
        if (allMembers.length > 0) {
            console.log('First 3 members:');
            console.log(allMembers.slice(0, 3).map(m => `- ${m.name} (${m.phone})`));
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error during check:', error);
        process.exit(1);
    }
}

checkData();
