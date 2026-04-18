import { db } from './backend/src/db/index';
import { transactions } from './backend/src/db/schema';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

async function check() {
    const txId = parseInt(process.argv[2]);
    if (!txId) {
        console.error("Please provide transaction ID");
        process.exit(1);
    }

    console.log(`Checking Transaction #${txId}...`);
    const result = await db.select().from(transactions).where(eq(transactions.id, txId));
    
    if (result.length === 0) {
        console.error("Transaction not found");
    } else {
        const tx = result[0];
        console.log("Status:", {
            id: tx.id,
            totalAmount: tx.totalAmount,
            isVoided: tx.isVoided,
            voidReason: tx.voidReason,
            pointsEarned: tx.pointsEarned,
            pointsUsed: tx.pointsUsed,
            memberId: tx.memberId,
            createdAt: tx.createdAt
        });
    }
    process.exit(0);
}

check().catch(err => {
    console.error(err);
    process.exit(1);
});
