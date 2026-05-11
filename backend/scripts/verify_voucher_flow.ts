import { db } from '../src/config/db.js';
import * as schema from '../src/db/schema.js';
import { VoucherService } from '../src/services/voucher_barcode.service.js';
import { eq, desc } from 'drizzle-orm';

async function verifyFlow() {
    console.log('--- STARTING VOUCHER FLOW VERIFICATION ---');

    try {
        // 1. Find a source transaction
        console.log('[1/7] Finding recent transaction...');
        const [lastSale] = await db.select().from(schema.sales).orderBy(desc(schema.sales.id)).limit(1);
        if (!lastSale) {
            console.warn('No transactions found in database. Please run POS once.');
            process.exit(1);
        }
        console.log(`Using transaction ID: ${lastSale.id}`);

        // 2. Generate a voucher
        console.log('[2/7] Generating voucher...');
        const voucher = await VoucherService.generateVoucher(lastSale.id, lastSale.outletId || 1);
        console.log(`Generated voucher: ${voucher.code}, status: ${voucher.status}, expires: ${voucher.expiresAt}`);

        // 3. Validate the voucher (Initial)
        console.log('[3/7] Validating voucher (Initial)...');
        const vInitial = await VoucherService.validateVoucher(voucher.code);
        console.log(`Validation result: valid=${vInitial.valid}, message=${vInitial.message}`);
        if (!vInitial.valid) throw new Error('Initial validation failed');

        // 4. Redeem the voucher (Simulating Checkout)
        console.log('[4/7] Redeeming voucher...');
        // We use -999 as a placeholder for a new sale if we're not actually doing a full checkout
        const redeemed = await VoucherService.redeemVoucher(voucher.code, lastSale.outletId || 1, -999);
        console.log(`Redeemed voucher status: ${redeemed.status}, redeemedAt: ${redeemed.redeemedAt}`);
        if (redeemed.status !== 'redeemed') throw new Error('Redemption failed');

        // 5. Validate the voucher (Post-Redemption) - Should FAIL
        console.log('[5/7] Validating voucher (Post-Redemption)...');
        const vPost = await VoucherService.validateVoucher(voucher.code);
        console.log(`Validation result: valid=${vPost.valid}, message=${vPost.message}`);
        if (vPost.valid) throw new Error('Voucher should be invalid after redemption');

        // 6. Test Idempotency (same sale ID) - Should PASS
        console.log('[6/7] Testing idempotency (same sale ID)...');
        const vIdempotent = await VoucherService.validateVoucher(voucher.code, undefined, -999);
        console.log(`Validation result (same sale): valid=${vIdempotent.valid}`);
        if (!vIdempotent.valid) throw new Error('Idempotency validation failed');

        // 7. Check Analytics
        console.log('[7/7] Checking analytics...');
        const stats = await VoucherService.getVoucherAnalytics();
        console.log('Analytics stats:', stats);

        console.log('--- VERIFICATION SUCCESSFUL ---');
    } catch (e) {
        console.error('--- VERIFICATION FAILED ---');
        console.error(e);
        process.exit(1);
    }
    process.exit(0);
}

verifyFlow();
