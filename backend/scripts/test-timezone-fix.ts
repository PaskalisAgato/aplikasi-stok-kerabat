// scripts/test-timezone-fix.ts
// Verification script for timezone fixes in reporting

function testDateParsing() {
    const testDates = ['2026-04-16', '2026-01-01', '2026-12-31'];
    
    console.log("=== Testing Jakarta Date Parsing ===");
    
    testDates.forEach(dateStr => {
        const start = new Date(`${dateStr}T00:00:00+07:00`);
        const end = new Date(`${dateStr}T23:59:59.999+07:00`);
        
        console.log(`Input: ${dateStr}`);
        console.log(`  START (WIB): ${start.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`);
        console.log(`  START (UTC): ${start.toISOString()}`);
        console.log(`  END (WIB):   ${end.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`);
        console.log(`  END (UTC):   ${end.toISOString()}`);
        
        // Assertions (Visual or programmatic)
        const expectedStartHourUTC = 17; // April 16 00:00 WIB is April 15 17:00 UTC
        const startHourUTC = start.getUTCHours();
        
        if (start.toISOString().includes('17:00:00.000Z') || start.toISOString().includes('00:00:00.000Z')) {
             // 17:00Z is correct for +07:00 if the day before.
             // Wait, new Date('2026-04-16T00:00:00+07:00').toISOString() -> 2026-04-15T17:00:00.000Z
        }
        
        console.log("--------------------");
    });
}

const now = new Date();
const jakartaDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(now);
const todayStart = new Date(`${jakartaDate}T00:00:00+07:00`);

console.log(`Current Time: ${now.toISOString()}`);
console.log(`Jakarta Date: ${jakartaDate}`);
console.log(`Today Start (WIB): ${todayStart.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`);
console.log(`Today Start (UTC): ${todayStart.toISOString()}`);

testDateParsing();
