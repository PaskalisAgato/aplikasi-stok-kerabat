import 'dotenv/config';

console.log("=== ENV CHECK ===");
const dbUrl = process.env.DATABASE_URL || "NOT SET";
if (dbUrl !== "NOT SET") {
    const parts = dbUrl.split('@');
    if (parts.length > 1) {
        console.log("DATABASE_URL Host:", parts[1]);
    } else {
        console.log("DATABASE_URL (short):", dbUrl.substring(0, 20));
    }
} else {
    console.log("DATABASE_URL is missing!");
}
process.exit(0);
