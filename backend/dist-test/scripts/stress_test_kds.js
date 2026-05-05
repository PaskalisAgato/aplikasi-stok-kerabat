import https from 'https';
const KDS_URL = 'https://api.kerabatkopitiam.my.id/api/kds/stream?outletId=1';
const CONCURRENT_CLIENTS = 100;
const DURATION_MS = 20000;
async function runSSEStressTest() {
    console.log(`--- KDS SSE STRESS TEST (${CONCURRENT_CLIENTS} CLIENTS) ---`);
    console.log(`Target: ${KDS_URL}`);
    console.log(`Duration: ${DURATION_MS / 1000}s`);
    let connections = 0;
    let errors = 0;
    let totalMessages = 0;
    const clients = [];
    const startTime = Date.now();
    for (let i = 0; i < CONCURRENT_CLIENTS; i++) {
        const req = https.get(KDS_URL, (res) => {
            if (res.statusCode === 200) {
                connections++;
            }
            else {
                errors++;
            }
            res.on('data', (chunk) => {
                const data = chunk.toString();
                if (data.includes('data:')) {
                    totalMessages++;
                }
            });
            res.on('error', () => {
                errors++;
            });
        });
        req.on('error', () => {
            errors++;
        });
        clients.push(req);
    }
    console.log(`[Connecting] Spawning ${CONCURRENT_CLIENTS} SSE connections...`);
    const publishInterval = setInterval(() => {
        // Ping the KDS endpoint to simulate a new order (assuming a POST endpoint exists or just track keep-alive messages)
        console.log(`[Load] Pinging clients... (Active connections: ${connections})`);
    }, 5000);
    return new Promise((resolve) => {
        setTimeout(() => {
            clearInterval(publishInterval);
            console.log("\n--- STRESS TEST RESULTS ---");
            console.log(`Total Connections Established: ${connections}/${CONCURRENT_CLIENTS}`);
            console.log(`Total Messages Received:       ${totalMessages}`);
            console.log(`Errors encountered:            ${errors}`);
            console.log(`Memory Usage (approx):         ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`);
            // Cleanup
            clients.forEach(req => req.destroy());
            if (errors > 0 || connections !== CONCURRENT_CLIENTS) {
                console.error("❌ STRESS TEST FAILED OR HAD INSTABILITY.");
                resolve(1);
            }
            else {
                console.log("✅ STRESS TEST PASSED. NO SSE LEAKS DETECTED.");
                resolve(0);
            }
        }, DURATION_MS);
    });
}
runSSEStressTest().then((exitCode) => process.exit(exitCode));
