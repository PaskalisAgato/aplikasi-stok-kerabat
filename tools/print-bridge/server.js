const express = require('express');
const cors = require('cors');
const escpos = require('escpos');
escpos.Network = require('escpos-network');

const app = express();
const port = 3001; // Default bridge port

app.use(cors());
app.use(express.json());

/**
 * Endpoint to process raw ESC/POS binary buffers
 * The PWA will send a base64 encoded buffer or a list of commands
 */
app.post('/print-raw', async (req, res) => {
    const { printerIp, printerPort = 9100, bufferBase64 } = req.body;

    if (!printerIp || !bufferBase64) {
        return res.status(400).json({ error: 'Missing printerIp or bufferBase64' });
    }

    try {
        const device = new escpos.Network(printerIp, printerPort);
        const printer = new escpos.Printer(device);
        const buffer = Buffer.from(bufferBase64, 'base64');

        device.open((err) => {
            if (err) {
                console.error('Failed to open printer:', err);
                return res.status(500).json({ error: 'Could not connect to printer at ' + printerIp });
            }

            // Raw write the buffer
            device.write(buffer, (err) => {
                if (err) {
                    console.error('Failed to write to printer:', err);
                    return res.status(500).json({ error: 'Failed to transmit data to printer' });
                }
                
                // Close after brief delay to ensure buffer is sent
                setTimeout(() => {
                    device.close();
                    res.json({ success: true, message: 'Print job dispatched to ' + printerIp });
                }, 500);
            });
        });
    } catch (error) {
        console.error('Bridge error:', error);
        res.status(500).json({ error: 'Internal Bridge Error: ' + error.message });
    }
});

/**
 * Health check endpoint
 */
app.get('/status', (req, res) => {
    res.json({ status: 'online', version: '1.0.0', bridge: 'Kerabat Print Bridge' });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Kerabat Print Bridge running on http://localhost:${port}`);
    console.log(`🔧 Configure your POS app to point to this IP for printing.`);
});
