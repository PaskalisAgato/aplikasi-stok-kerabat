import EscPosEncoder from 'esc-pos-encoder';
import { db, PrinterConfig as _PrTrConf, PrintData as _PrTrData, OfflinePrintJob } from './db';

const BRIDGE_URL = 'http://127.0.0.1:3001';

export type PrinterConfig = _PrTrConf;
export type PrintData = _PrTrData;

export class PrintService {
    private static bluetoothDevice: any = null;
    private static bluetoothCharacteristic: any = null;
    private static serialPort: any = null;
    private static serialWriter: any = null;
    private static isPrinting = false;
    private static QUEUE_DELAY_MS = 500;

    public static async recover() {
        console.log('[PrintService] Recovering pending print jobs...');
        this.startQueueWorker();
    }

    private static startQueueWorker() {
        if (this.isPrinting) return;
        
        const worker = async () => {
            try {
                await this.processQueue();
            } catch (err) {
                console.error('[PrintService] Queue worker error:', err);
                await this.logDiagnostic('ERROR', 'PrintService', `Queue worker failed: ${String(err)}`);
            } finally {
                // Check again in 10 seconds if idle
                setTimeout(() => {
                    const pendingCount = db.printQueue.where('status').equals('PENDING').count();
                    pendingCount.then(c => {
                        if (c > 0) this.startQueueWorker();
                        else this.isPrinting = false;
                    });
                }, 10000);
            }
        };
        worker();
    }

    private static async logDiagnostic(level: 'INFO' | 'WARN' | 'ERROR', module: string, message: string) {
        try {
            await db.diagnostics.add({
                level,
                module,
                message,
                timestamp: new Date().toISOString()
            });
        } catch (err) {
            console.error('Print Diagnostic log failed', err);
        }
    }

    public static async saveSettings(configs: PrinterConfig[]) {
        await db.settings.put({ id: 'printer_configs', value: configs });
    }

    public static async getSettings(): Promise<PrinterConfig[]> {
        const entry = await db.settings.get('printer_configs');
        return entry?.value || [];
    }

    public static isBluetoothSupported(): boolean {
        if (typeof window === 'undefined') return false;
        const nav = navigator as any;
        const isNative = (window as any).bluetoothSerial !== undefined;
        return !!(nav.bluetooth || isNative);
    }

    public static isSerialSupported(): boolean {
        if (typeof window === 'undefined') return false;
        return !!(navigator as any).serial;
    }

    /**
     * Connects to a Bluetooth printer. Supports both Web Bluetooth and Native Android SPP.
     */
    public static async connectBluetooth(forcePopup = false): Promise<string | null> {
        const nav = navigator as any;
        const btSerial = (window as any).bluetoothSerial;

        // --- NATIVE ANDROID SPP (Capacitor) ---
        if (btSerial) {
            return new Promise((resolve, reject) => {
                btSerial.list((devices: { name: string, address?: string, id?: string }[]) => {
                    const printer = devices.find(d => 
                        d.name?.toLowerCase().includes('printer') || 
                        d.name?.toLowerCase().includes('mpt') ||
                        d.name?.toLowerCase().includes('bt-') ||
                        d.name?.toLowerCase().includes('rp')
                    );

                    if (printer) {
                        btSerial.connect(printer.address || printer.id, () => {
                            console.log('[Native] Connected to:', printer.name);
                            this.bluetoothDevice = printer; // Store for state
                            resolve(printer.name);
                        }, (err: any) => {
                            console.error('[Native] Connection failed:', err);
                            reject(err);
                        });
                    } else {
                        reject(new Error('No paired Bluetooth printer found. Please pair in Android Settings first.'));
                    }
                }, (err: any) => reject(err));
            });
        }

        // --- WEB BLUETOOTH (PWA/Chrome) ---
        if (!nav.bluetooth) {
            throw new Error('Bluetooth is not supported in this browser.');
        }

        try {
            // 1. Try silent reconnect first if not forcing popup
            if (!forcePopup && nav.bluetooth.getDevices) {
                const devices = await nav.bluetooth.getDevices();
                if (devices.length > 0) {
                    const printer = devices.find((d: any) => 
                        d.name?.toLowerCase().includes('printer') || 
                        d.name?.toLowerCase().includes('mpt') ||
                        d.name?.toLowerCase().includes('bt-') ||
                        d.name?.toLowerCase().includes('rp') ||
                        d.name?.toLowerCase().includes('thermal') ||
                        d.name?.toLowerCase().includes('pos')
                    ) || devices[0];

                    if (printer) {
                        console.log('Attempting silent reconnect to:', printer.name);
                        this.bluetoothDevice = printer;
                        const ok = await this.setupGATT(printer);
                        if (ok) return printer.name || 'Bluetooth Printer';
                    }
                }
            }

            // 2. Fallback to popup if silent failed or forced
            console.log('Requesting new Bluetooth device via popup...');
            
            // Broadest possible search for printers
            this.bluetoothDevice = await nav.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: [
                    '000018f0-0000-1000-8000-00805f9b34fb', // Common thermal printer
                    '0000ff00-0000-1000-8000-00805f9b34fb', // Generic vendor
                    '0000ffe0-0000-1000-8000-00805f9b34fb', // HM-10 / JDY modules
                    '0000ffe1-0000-1000-8000-00805f9b34fb', // HM-10 characteristic
                    '0000af30-0000-1000-8000-00805f9b34fb', // Generic Chinese thermal
                    '00001101-0000-1000-8000-00805f9b34fb', // SPP (Classic) fallback
                    '0000180a-0000-1000-8000-00805f9b34fb', // Device Information
                    '0000180f-0000-1000-8000-00805f9b34fb', // Battery Service
                    '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Microchip BLE
                    '49535343-8841-43f4-a8d4-ecbe34729bb3', // Microchip TX
                    'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // RD / low-cost generic
                    '00001800-0000-1000-8000-00805f9b34fb', // Generic Access
                    '00001801-0000-1000-8000-00805f9b34fb', // Generic Attribute
                ]
            });

            const deviceName = this.bluetoothDevice.name || 'Unknown Device';
            console.log(`Selected device: ${deviceName}`);

            const ok = await this.setupGATT(this.bluetoothDevice);
            if (!ok) {
                // Device selected but GATT failed → likely a Bluetooth Classic printer
                throw new Error(
                    `Printer "${deviceName}" tidak mendukung Bluetooth Low Energy (BLE). ` +
                    `Printer ini kemungkinan hanya mendukung Bluetooth Classic (SPP). ` +
                    `Coba gunakan tipe koneksi "Serial / Legacy Bluetooth" di pengaturan printer.`
                );
            }
            return deviceName;
        } catch (error: any) {
            console.error('Bluetooth connection failed:', error);
            if (error.message?.includes('tidak mendukung')) throw error;
            if (error.name === 'NotFoundError') return null;
            return null;
        }
    }

    /**
     * Connects to a Serial port (used for legacy Bluetooth SPP mapped as COM/TTY).
     */
    public static async connectSerial(): Promise<string | null> {
        const nav = navigator as any;
        if (!nav.serial) {
            throw new Error('Web Serial API tidak didukung di browser ini.');
        }

        try {
            this.serialPort = await nav.serial.requestPort();
            await this.serialPort.open({ baudRate: 9600 }); // Common default for thermal printers
            
            const writable = this.serialPort.writable;
            if (writable) {
                this.serialWriter = writable.getWriter();
                console.log('[Serial] Port opened and writer acquired.');
            }
            
            return 'Serial Port Printer';
        } catch (error: any) {
            console.error('[Serial] Connection failed:', error);
            if (error.name === 'NotFoundError') return null;
            throw error;
        }
    }


    private static async setupGATT(device: any): Promise<boolean> {
        try {
            console.log(`[BT] Connecting GATT to "${device.name}"...`);
            const server = await device.gatt?.connect();
            if (!server) {
                console.warn('[BT] GATT server not available on this device');
                return false;
            }

            // Strategy 1: Try known printer service UUIDs first (faster)
            const knownPrinterServices = [
                '000018f0-0000-1000-8000-00805f9b34fb',
                '0000ff00-0000-1000-8000-00805f9b34fb',
                '0000ffe0-0000-1000-8000-00805f9b34fb',
                '49535343-fe7d-4ae5-8fa9-9fafd205e455',
                'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
            ];

            for (const uuid of knownPrinterServices) {
                try {
                    const service = await server.getPrimaryService(uuid);
                    const chars = await service.getCharacteristics();
                    for (const char of chars) {
                        if (char.properties.write || char.properties.writeWithoutResponse) {
                            console.log(`[BT] ✓ Found writable char ${char.uuid} via known service ${uuid}`);
                            this.bluetoothCharacteristic = char;
                            return true;
                        }
                    }
                } catch {
                    // Service not found on this device, try next
                }
            }

            // Strategy 2: Discover ALL services (slower but catches unknown printers)
            console.log('[BT] Known services not found, discovering all services...');
            try {
                const services = await server.getPrimaryServices();
                console.log(`[BT] Found ${services.length} primary services`);

                for (const service of services) {
                    try {
                        const chars = await service.getCharacteristics();
                        for (const char of chars) {
                            if (char.properties.write || char.properties.writeWithoutResponse) {
                                console.log(`[BT] ✓ Found writable char ${char.uuid} in service ${service.uuid}`);
                                this.bluetoothCharacteristic = char;
                                return true;
                            }
                        }
                    } catch {
                        continue;
                    }
                }
            } catch (discoverErr) {
                console.warn('[BT] Full service discovery failed:', discoverErr);
            }

            console.warn('[BT] ✗ No writable characteristic found on this device.');
            return false;
        } catch (err) {
            console.error('[BT] GATT setup failed:', err);
            return false;
        }
    }

    private static async delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private static async sendToSerial(buffer: Uint8Array): Promise<boolean> {
        if (!this.serialWriter) {
            const name = await this.connectSerial();
            if (!name) return false;
        }

        try {
            await this.serialWriter.write(buffer);
            console.log('[Serial] Data written successfully.');
            return true;
        } catch (error) {
            console.error('[Serial] Write failed:', error);
            this.serialWriter = null;
            this.serialPort = null;
            return false;
        }
    }

    private static async sendToBluetooth(buffer: Uint8Array): Promise<boolean> {
        const btSerial = (window as any).bluetoothSerial;

        try {
            if (btSerial) {
                return new Promise((resolve) => {
                    btSerial.isConnected(() => {
                        this.writeNativeChunks(buffer).then(() => resolve(true)).catch(() => resolve(false));
                    }, async () => {
                        try {
                            const name = await this.connectBluetooth();
                            if (name) {
                                await this.writeNativeChunks(buffer);
                                resolve(true);
                            } else {
                                resolve(false);
                            }
                        } catch {
                            resolve(false);
                        }
                    });
                });
            }

            if (!this.bluetoothCharacteristic) {
                const name = await this.connectBluetooth();
                if (!name) return false;
            }

            const chunkSize = 20;
            for (let i = 0; i < buffer.length; i += chunkSize) {
                const chunk = buffer.slice(i, i + chunkSize);
                if (this.bluetoothCharacteristic.properties.writeWithoutResponse) {
                    await this.bluetoothCharacteristic.writeValueWithoutResponse(chunk);
                } else {
                    await this.bluetoothCharacteristic.writeValue(chunk);
                }
                await this.delay(50);
            }

            return true;
        } catch (error) {
            console.error('Bluetooth print failed:', error);
            this.bluetoothCharacteristic = null;
            return false;
        }
    }

    public static async pulseDrawer(config: PrinterConfig): Promise<boolean> {
        const encoder = new EscPosEncoder();
        encoder.initialize().raw([0x1b, 0x70, 0x00, 0x19, 0xfa]);
        const buffer = encoder.encode();
        
        if (config.connectionType === 'bluetooth') {
            await this.connectBluetooth();
            return this.sendToBluetooth(buffer);
        }
        if (config.connectionType === 'serial') {
            return this.sendToSerial(buffer);
        }
        return this.sendToBridge(buffer, config.ip || '127.0.0.1');
    }

    private static async writeNativeChunks(buffer: Uint8Array) {
        const btSerial = (window as any).bluetoothSerial;
        const chunkSize = 400; 
        
        return new Promise<void>((resolve, reject) => {
            const sendNextChunk = (index: number) => {
                if (index >= buffer.length) {
                    resolve();
                    return;
                }
                const chunk = buffer.slice(index, index + chunkSize);
                btSerial.write(chunk, () => {
                    setTimeout(() => sendNextChunk(index + chunkSize), 20);
                }, (err: any) => reject(err));
            };
            sendNextChunk(0);
        });
    }

    public static async testPrint(config: PrinterConfig): Promise<boolean> {
        const encoder = new EscPosEncoder();
        encoder.initialize()
            .align('center')
            .line('==========================')
            .line('      KERABAT POS       ')
            .line('==========================')
            .newline()
            .line('TEST PRINT BERHASIL!')
            .line(`Printer: ${config.name}`)
            .line(`Mode: ${config.connectionType.toUpperCase()}`)
            .newline()
            .line('--------------------------')
            .line(new Date().toLocaleString('id-ID'))
            .newline()
            .newline()
            .cut();
        
        const buffer = encoder.encode();
        if (config.connectionType === 'bluetooth') {
            return this.sendToBluetooth(buffer);
        }
        if (config.connectionType === 'serial') {
            return this.sendToSerial(buffer);
        }
        return this.sendToBridge(buffer, config.ip || '127.0.0.1');
    }

    public static async printOrder(data: PrintData, isManual = false) {
        const settings = await this.getSettings();
        
        if (settings.length === 0) {
            if (isManual) {
                console.warn('[PrintService] No printers configured. Offering browser print fallback.');
                this.browserPrint(data);
            } else {
                console.log('[PrintService] No printers configured. Skipping auto-print silently.');
            }
            return;
        }

        for (const printer of settings) {
            if (printer.autoPrint === false) continue;

            let filteredItems = data.items;
            let isPrepTicket = false;

            if (printer.categories.length > 0) {
                filteredItems = data.items.filter(item => 
                    item.category && printer.categories.includes(item.category)
                );
                isPrepTicket = true;
            }

            if (filteredItems.length > 0) {
                if (printer.connectionType === 'bluetooth') {
                    // Bluetooth requires active User Gesture. Cannot be queued asynchronously.
                    console.log(`[PrintService] Executing Bluetooth print immediately for ${printer.name}`);
                    const buffer = this.encodeReceipt(data, { config: printer, isPrepTicket });
                    this.sendToBluetooth(buffer).catch(err => {
                        console.error('Immediate BT Print failed', err);
                        if (isManual) {
                            window.dispatchEvent(new CustomEvent('print-alert', { 
                                detail: { message: `Printer Bluetooth "${printer.name}" gagal.`, type: 'WARN', data } 
                            }));
                        }
                    });
                } else if (printer.connectionType === 'serial') {
                    console.log(`[PrintService] Executing Serial print immediately for ${printer.name}`);
                    const buffer = this.encodeReceipt(data, { config: printer, isPrepTicket });
                    this.sendToSerial(buffer).catch(err => {
                        console.error('Immediate Serial Print failed', err);
                    });
                } else if (printer.connectionType === 'bridge') {
                    // Optimized: Encode once, set status to PENDING
                    await this.enqueuePrintJob(data, printer, isPrepTicket, isManual);
                }
            }
        }
        
        // Start worker for bridge jobs
        this.startQueueWorker();
    }

    /**
     * Standard Browser Print Fallback
     */
    public static browserPrint(data: PrintData) {
        if (typeof window === 'undefined') return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Popup terblokir! Izinkan popup untuk mencetak struk.');
            return;
        }

        const itemsHtml = data.items.map(item => `
            <tr>
                <td style="padding: 4px 0;">${item.quantity}x ${item.name}</td>
                <td style="text-align: right; padding: 4px 0;">Rp ${item.subtotal.toLocaleString('id-ID')}</td>
            </tr>
        `).join('');

        const html = `
            <html>
            <head>
                <title>Receipt #${data.id}</title>
                <style>
                    body { font-family: 'Courier New', Courier, monospace; width: 80mm; margin: 0 auto; padding: 10px; font-size: 12px; }
                    .center { text-align: center; }
                    .bold { font-weight: bold; }
                    .divider { border-top: 1px dotted #000; margin: 10px 0; }
                    table { width: 100%; border-collapse: collapse; }
                </style>
            </head>
            <body>
                <div class="center bold" style="font-size: 16px;">KERABAT KOPI TIAM</div>
                <div class="center">Premium Coffee & Toast</div>
                <div class="divider"></div>
                <div>Date: ${new Date(data.date).toLocaleString('id-ID')}</div>
                <div>Order: #${data.id}</div>
                <div class="divider"></div>
                <table>${itemsHtml}</table>
                <div class="divider"></div>
                <div style="display: flex; justify-content: space-between;" class="bold">
                    <span>TOTAL:</span>
                    <span>Rp ${data.total.toLocaleString('id-ID')}</span>
                </div>
                <div style="margin-top: 10px;">Metode: ${data.paymentMethod}</div>
                <div class="divider"></div>
                <div class="center">Terima Kasih!</div>
                <div class="center">Selamat Menikmati</div>
                <script>
                    window.onload = () => {
                        window.print();
                        setTimeout(() => window.close(), 500);
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    }

    /**
     * Downloadable PDF Receipt Fallback
     */
    public static downloadPdfReceipt(data: PrintData) {
        // Simple implementation: generate text/plain blob as a placeholder for "PDF"
        // In a real app we might use jspdf, but simple text is more robust for fallbacks.
        const content = `
RESEPSI PEMBAYARAN - KERABAT POS
===============================
ID: #${data.id}
Waktu: ${new Date(data.date).toLocaleString('id-ID')}
-------------------------------
${data.items.map(i => `${i.quantity}x ${i.name.padEnd(20)} Rp ${i.subtotal.toLocaleString('id-ID')}`).join('\n')}
-------------------------------
TOTAL: Rp ${data.total.toLocaleString('id-ID')}
Metode: ${data.paymentMethod}
===============================
Terima Kasih!
        `;
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Receipt_${data.id}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    private static async enqueuePrintJob(data: PrintData, config: PrinterConfig, isPrepTicket = false, isManual = false) {
        // Pre-encode the receipt here using frontend settings
        const buffer = this.encodeReceipt(data, { config, isPrepTicket });
        const bufferBase64 = btoa(String.fromCharCode(...buffer));

        // Pivot: Instead of local bridge, we send to cloud queue via SyncEngine
        await db.offlineActions.add({
            id: `p_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            type: 'ENQUEUE_PRINT',
            payload: {
                payload: data,
                printerName: config.name,
                isPrepTicket,
                bufferBase64, // Included for the Local Agent
                printerIp: config.ip || '127.0.0.1',
                isManual
            },
            sync_status: 'PENDING',
            retry_count: 0,
            idempotency_key: `print_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            created_at: new Date().toISOString(),
            sequence_number: Date.now()
        });
        
        console.log(`[PrintService] Enqueued CLOUD job for ${config.name} (Encoded)`);
    }

    public static async processQueue() {
        const pending = await db.printQueue
            .where('status')
            .equals('PENDING')
            .toArray();
        
        if (pending.length === 0) {
            return;
        }

        this.isPrinting = true;

        for (const job of pending) {
            let { data, config, isPrepTicket } = job.data as { data: _PrTrData, config: _PrTrConf, isPrepTicket: boolean };
            
            // Backward Compatibility: If 'data' is missing, it might be an old flattened job
            if (!data && (job.data as any).items) {
                console.log(`[PrintService] Found legacy flattened job ${job.id}. Re-nesting...`);
                data = job.data as unknown as _PrTrData;
                // Note: config and isPrepTicket are already part of job.data in legacy structure too
            }

            const buffer = this.encodeReceipt(data, { 
                config,
                isPrepTicket 
            });

            console.log(`[PrintService] Processing job ${job.id} for ${config.name}...`);
            let success = false;
            
            if (config.connectionType === 'bluetooth') {
                success = await this.sendToBluetooth(buffer);
            } else if (config.connectionType === 'serial') {
                success = await this.sendToSerial(buffer);
            } else {
                success = await this.sendToBridge(buffer, config.ip || '127.0.0.1', data, job.data.isManual);
            }

            if (success) {
                await db.printQueue.update(job.id, { status: 'DONE' });
                await db.printQueue.delete(job.id);
            } else {
                await db.printQueue.update(job.id, { 
                    retry_count: job.retry_count + 1,
                    last_error: 'Connection failed' 
                });
            }

            // Phase 8: Inter-job delay to prevent buffer overflow
            await this.delay(this.QUEUE_DELAY_MS);
        }
        
        this.isPrinting = false;
    }

    public static encodeReceipt(data: _PrTrData, options: { config: _PrTrConf, isPrepTicket?: boolean }): Uint8Array {
        const encoder = new EscPosEncoder();
        const { config, isPrepTicket } = options;
        
        // Anti-crash guard for malformed job data
        if (!data) {
            console.error('[PrintService] encodeReceipt: Missing data object');
            return encoder.initialize().line('ERR: MISSING DATA').encode();
        }

        const width = config.width || 32;

        const centerText = (text: string) => {
            const padSize = Math.max(0, Math.floor((width - text.length) / 2));
            return ' '.repeat(padSize) + text;
        };

        if (isPrepTicket) {
            encoder.align('center').bold(true).line(centerText('ORDER PERSIAPAN')).bold(false);
        } else {
            const hTitle = config.headerTitle || 'KERABAT KOPI TIAM';
            const hSub = config.headerSubtitle || 'Premium Coffee & Toast';
            encoder.align('center').bold(true).line(centerText(hTitle)).bold(false).line(centerText(hSub));
        }

        encoder
            .line('--------------------------------')
            .align('left');
        
        if (config.showDate !== false) {
            const printDate = data.date ? new Date(data.date) : new Date();
            encoder.line(`Date:  ${printDate.toLocaleString('id-ID')}`);
        }
        
        encoder.line(`Order: #${data.id}`)
            .line('--------------------------------');

        data.items.forEach((item: any) => {
            const qty = `${item.quantity}x `;
            const priceStr = item.subtotal.toLocaleString('id-ID');
            const inlineNameWidth = width - qty.length - priceStr.length - 1;

            if (item.name.length <= inlineNameWidth) {
                // Standard inline layout
                const spaces = width - qty.length - item.name.length - priceStr.length;
                encoder.line(`${qty}${item.name}${' '.repeat(Math.max(1, spaces))}${priceStr}`);
            } else {
                // Wrap name and drop price
                const availableForName = width - 4;
                const words = item.name.split(' ');
                const nameLines = [];
                let currentLine = '';
                
                words.forEach((word: string) => {
                    if ((currentLine + word).length < availableForName) {
                        currentLine += (currentLine ? ' ' : '') + word;
                    } else {
                        nameLines.push(currentLine);
                        currentLine = word;
                    }
                });
                if (currentLine) nameLines.push(currentLine);

                encoder.line(`${qty.padEnd(4)}${nameLines[0]}`);
                for (let i = 1; i < nameLines.length; i++) {
                    encoder.line(`    ${nameLines[i]}`);
                }
                encoder.align('right').line(priceStr).align('left');
            }
        });

        encoder.line('--------------------------------');

        if (!isPrepTicket) {
            const totalLabel = 'TOTAL:';
            const totalValue = `Rp ${data.total.toLocaleString('id-ID')}`;
            const spaces = width - totalLabel.length - totalValue.length;
            const spacer = spaces > 0 ? ' '.repeat(spaces) : ' ';
            
            encoder
                .bold(true)
                .line(`${totalLabel}${spacer}${totalValue}`)
                .bold(false)
                .align('left');
            
            if (config.showCashier) {
                encoder.line(`Kasir: ${data.cashier_id || 'Staff'}`);
            }

            encoder
                .line(`Bayar: ${data.paymentMethod}`)
                .line(`Cash:  Rp ${data.amountPaid?.toLocaleString('id-ID') || 0}`)
                .line(`Laba:  Rp ${data.change_due?.toLocaleString('id-ID') || 0}`)
                .line('--------------------------------')
                .align('center')
                .line(centerText(config.footerMessage || 'Terima Kasih!'))
                .line(centerText('Selamat Menikmati'));
        }

        encoder.newline().newline();

        if (config.openCashDrawer && !isPrepTicket && data.paymentMethod === 'CASH') {
            // Pulse command for cash drawer
            encoder.raw([0x1b, 0x70, 0x00, 0x19, 0xfa]);
        }

        encoder.cut();
        return encoder.encode();
    }

    private static async sendToBridge(buffer: Uint8Array, printerIp: string, data?: PrintData, isManual = false): Promise<boolean> {
        const bufferBase64 = btoa(String.fromCharCode(...buffer));

        try {
            const response = await fetch(`${BRIDGE_URL}/print-raw`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    printerIp,
                    bufferBase64
                })
            });

            return response.ok;
        } catch (error) {
            console.error('Bridge printing failed:', error);
            if (isManual) {
                window.dispatchEvent(new CustomEvent('print-alert', { 
                    detail: { message: `Gagal terhubung ke Print Agent (Bridge). Pastikan Agent aktif di terminal.`, type: 'ERROR', data } 
                }));
            }
            return false;
        }
    }

    // ========== PRINT QUEUE MANAGEMENT ==========

    /**
     * Queue a receipt for later printing (NO auto-print).
     * Called during checkout instead of printOrder.
     */
    public static async queueReceipt(data: PrintData): Promise<void> {
        await db.printQueue.add({
            id: `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            data,
            status: 'PENDING',
            retry_count: 0,
            created_at: new Date().toISOString()
        });
        console.log('[PrintService] Receipt queued for later printing:', data.id);
    }

    /**
     * Get all pending print jobs for the queue manager UI.
     */
    public static async getPendingJobs(): Promise<OfflinePrintJob[]> {
        return db.printQueue
            .orderBy('created_at')
            .reverse()
            .toArray();
    }

    /**
     * Print a specific job from the queue by its ID.
     * Tries printOrder (which handles bridge/bluetooth routing).
     * Returns true if print succeeded.
     */
    public static async printFromQueue(jobId: string): Promise<boolean> {
        const job = await db.printQueue.get(jobId);
        if (!job) {
            console.warn('[PrintService] Job not found:', jobId);
            return false;
        }

        try {
            // Use printOrder with isManual=true so alerts fire on failure
            await this.printOrder(job.data as PrintData, true);
            
            // Mark as done
            await db.printQueue.update(jobId, { status: 'DONE' });
            console.log('[PrintService] Queue job printed:', jobId);
            return true;
        } catch (err) {
            console.error('[PrintService] Queue job print failed:', jobId, err);
            await db.printQueue.update(jobId, { 
                status: 'FAILED', 
                retry_count: (job.retry_count || 0) + 1,
                last_error: (err as Error).message
            });
            return false;
        }
    }

    /**
     * Delete a single job from the queue.
     */
    public static async deleteJob(jobId: string): Promise<void> {
        await db.printQueue.delete(jobId);
        console.log('[PrintService] Queue job deleted:', jobId);
    }

    /**
     * Clear the entire print queue.
     */
    public static async clearQueue(): Promise<void> {
        await db.printQueue.clear();
        console.log('[PrintService] Entire print queue cleared.');
    }
}
