import { db } from './src/config/db.js';
import * as schema from './src/db/schema.js';
import { AnalyticsService } from './src/services/analytics.service.js';

async function main() {
    console.log("=== CHECKING ANALYTICS ===");
    try {
        const summary = await AnalyticsService.getDailySummary();
        console.log("Daily Summary:", summary);

        const sales = await db.select().from(schema.sales).limit(5);
        console.log("\nSome latest sales:");
        for(let s of sales) {
            console.log(`- ID: ${s.id}, Date: ${s.createdAt}, Status: ${s.status}, method: ${s.paymentMethod}, Amount: ${s.totalAmount}`);
        }
    } catch(e) {
        console.error("ERROR", e);
    }
    process.exit(0);
}
main();
