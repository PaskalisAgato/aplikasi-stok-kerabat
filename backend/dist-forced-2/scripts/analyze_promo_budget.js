import { db } from '../config/db.js';
import * as schema from '../db/schema.js';
import { eq, and, gte, sql, desc, count } from 'drizzle-orm';
async function analyzePromoBudget() {
    console.log('--- Promotion Budget Analysis Report ---\n');
    // 1. Per-Discount Budget Usage
    console.log('1. Per-Discount Budget Usage:');
    const discounts = await db.select().from(schema.discounts).orderBy(desc(schema.discounts.priority));
    discounts.forEach(d => {
        const used = parseFloat(d.budgetUsed || '0');
        const limit = d.budgetLimit ? parseFloat(d.budgetLimit) : Infinity;
        const percent = limit !== Infinity ? ((used / limit) * 100).toFixed(1) : 'Unlimited';
        const quotaUsed = d.totalUsed || 0;
        const quotaLimit = d.totalQuota !== null ? d.totalQuota : 'Unlimited';
        console.log(`- [${d.id}] ${d.name} (${d.type}):`);
        console.log(`  Budget: Rp ${used.toLocaleString()} / ${limit === Infinity ? 'Unlimited' : 'Rp ' + limit.toLocaleString()} (${percent}%)`);
        console.log(`  Quota:  ${quotaUsed} / ${quotaLimit} uses`);
        console.log(`  Status: ${d.isActive ? 'ACTIVE' : 'INACTIVE'}`);
        console.log('');
    });
    // 2. Historical Discount Data (Last 30 Days)
    console.log('\n2. Discount Usage (Last 30 Days):');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const historicalData = await db.select({
        date: sql `DATE(${schema.sales.createdAt} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta')`,
        totalDiscount: sql `SUM(CAST(${schema.sales.discountTotal} AS DECIMAL))`,
        usageCount: count(schema.sales.id)
    })
        .from(schema.sales)
        .where(and(gte(schema.sales.createdAt, thirtyDaysAgo), eq(schema.sales.isDeleted, false), eq(schema.sales.isVoided, false), eq(schema.sales.status, 'PAID'), sql `CAST(${schema.sales.discountTotal} AS DECIMAL) > 0`))
        .groupBy(sql `DATE(${schema.sales.createdAt} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta')`)
        .orderBy(desc(sql `DATE(${schema.sales.createdAt} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta')`));
    if (historicalData.length === 0) {
        console.log('No discount usage recorded in the last 30 days.');
    }
    else {
        historicalData.forEach(row => {
            console.log(`- ${row.date}: Rp ${Number(row.totalDiscount).toLocaleString()} (${row.usageCount} transactions)`);
        });
    }
    // 3. Top Performing Promos (By Budget Used)
    console.log('\n3. Top Performing Promos (By Cumulative Budget Used):');
    const topPromos = [...discounts]
        .sort((a, b) => parseFloat(b.budgetUsed || '0') - parseFloat(a.budgetUsed || '0'))
        .slice(0, 5);
    topPromos.forEach((p, index) => {
        if (parseFloat(p.budgetUsed || '0') > 0) {
            console.log(`${index + 1}. ${p.name}: Rp ${parseFloat(p.budgetUsed || '0').toLocaleString()}`);
        }
    });
    console.log('\n--- End of Report ---');
    process.exit(0);
}
analyzePromoBudget().catch(err => {
    console.error('Error during analysis:', err);
    process.exit(1);
});
