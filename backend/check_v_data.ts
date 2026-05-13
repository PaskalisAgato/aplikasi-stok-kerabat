
import { eq } from 'drizzle-orm';
import { db } from './src/config/db.js';
import * as schema from './src/db/schema.js';

async function checkVoucherData() {
    const code = 'KKT-DSL5ZW-31';
    console.log(`=== CHECKING DATA FOR VOUCHER: ${code} ===`);
    
    try {
        const [voucher] = await db.select()
            .from(schema.promoVouchers)
            .where(eq(schema.promoVouchers.code, code))
            .limit(1);

        if (!voucher) {
            console.error('❌ Voucher NOT FOUND in database!');
            process.exit(1);
        }

        console.log('✅ Voucher Found:');
        console.log(JSON.stringify(voucher, null, 2));
        
        console.log('\n--- Key Fields for Discount Calculation ---');
        console.log(`menuName:        "${voucher.menuName}"`);
        console.log(`voucherPrice:    "${voucher.voucherPrice}" (Type: ${typeof voucher.voucherPrice})`);
        console.log(`discountNominal: "${voucher.discountNominal}" (Type: ${typeof voucher.discountNominal})`);
        console.log(`normalPrice:     "${voucher.normalPrice}" (Type: ${typeof voucher.normalPrice})`);
        
        const vPriceNum = parseFloat(voucher.voucherPrice?.toString() || '0');
        const dNominalNum = parseFloat(voucher.discountNominal?.toString() || '0');
        
        console.log(`\nParsed vPrice:   ${vPriceNum}`);
        console.log(`Parsed dNominal: ${dNominalNum}`);

        if (vPriceNum === 0 && dNominalNum === 0) {
            console.warn('\n⚠️  WARNING: Both discount fields are ZERO! This is why evaluation fails.');
        } else {
            console.log('\n✅ Fields seem to have numeric values.');
        }

    } catch (error) {
        console.error('❌ Error checking voucher:', error);
    } finally {
        process.exit(0);
    }
}

checkVoucherData();
