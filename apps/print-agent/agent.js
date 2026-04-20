import axios from 'axios';
import 'dotenv/config';

// --- CONFIGURATION ---
const BACKEND_URL = process.env.BACKEND_URL || 'https://api.kerabatkopitiam.my.id/api';
const LOCAL_BRIDGE_URL = process.env.LOCAL_BRIDGE_URL || 'http://127.0.0.1:3001';
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL || '5000');
const AUTH_TOKEN = process.env.AUTH_TOKEN; // Optional: if backend requires it

console.log('🚀 Kerabat Local Print Agent starting...');
console.log(`📡 Backend: ${BACKEND_URL}`);
console.log(`🖨️  Local Bridge: ${LOCAL_BRIDGE_URL}`);

let isPolling = false;

async function pollJobs() {
    if (isPolling) return;
    isPolling = true;

    try {
        const response = await axios.get(`${BACKEND_URL}/print/poll`, {
            headers: AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {}
        });

        const { jobs } = response.data;
        if (jobs && jobs.length > 0) {
            console.log(`[AGENT] Found ${jobs.length} pending jobs.`);

            for (const job of jobs) {
                try {
                    console.log(`[AGENT] Processing job ${job.id} for ${job.printerName}...`);
                    
                    const jobPayload = JSON.parse(job.payload);
                    const { bufferBase64, printerIp } = jobPayload;

                    if (!bufferBase64) {
                        throw new Error('Job missing bufferBase64');
                    }

                    // 1. Forward to Local Bridge
                    console.log(`[BRIDGE] Sending to ${printerIp}...`);
                    await axios.post(`${LOCAL_BRIDGE_URL}/print-raw`, {
                        printerIp: printerIp || '127.0.0.1',
                        bufferBase64
                    });

                    // 2. Acknowledge Success to Cloud
                    await axios.post(`${BACKEND_URL}/print/acknowledge`, { 
                        jobId: job.id, 
                        status: 'success' 
                    }, {
                        headers: AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {}
                    });

                    console.log(`[AGENT] Job ${job.id} printed and acknowledged.`);
                } catch (err) {
                    const errorMsg = err.response?.data?.message || err.message;
                    console.error(`[AGENT] Job ${job.id} failed:`, errorMsg);
                    
                    // Acknowledge Failure to Cloud
                    await axios.post(`${BACKEND_URL}/print/acknowledge`, { 
                        jobId: job.id, 
                        status: 'failed',
                        error: errorMsg
                    }, {
                        headers: AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {}
                    });
                }
            }
        }
    } catch (error) {
        console.error('[AGENT] Polling error:', error.response?.status === 404 ? 'Route not found' : error.message);
    } finally {
        isPolling = false;
    }
}


// Start Polling
setInterval(pollJobs, POLL_INTERVAL_MS);
console.log(`[AGENT] Polling active (every ${POLL_INTERVAL_MS}ms)`);
