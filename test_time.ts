const startDate = "2026-04-19T00:00";
const endStr = "2026-04-19T23:59";

// Simulating UTC Vercel Function Environment
process.env.TZ = 'UTC';

const startD = new Date(startDate);
const endD = new Date(endStr);

console.log("If Vercel parses start date:", startD.toISOString());
console.log("If Vercel parses end date:", endD.toISOString());

// Now evaluating what happens!
const expenseWIB = new Date("2026-04-19T00:00:00.000+07:00");
console.log("Expense added at 00:00 WIB:", expenseWIB.toISOString());

console.log("Is expense GTE startD?", expenseWIB >= startD);
console.log("Is expense LTE endD?", expenseWIB <= endD);

