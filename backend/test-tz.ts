try {
    const now = new Date();
    const jakartaDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(now); 
    const todayStart = new Date(`${jakartaDate}T00:00:00+07:00`); 
    console.log("Now:", now.toISOString());
    console.log("Jakarta Date:", jakartaDate);
    console.log("Today Start:", todayStart.toISOString());
    console.log("SUCCESS");
} catch (e) {
    console.error("FAILED", e);
}
process.exit(0);
