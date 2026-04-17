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
        console.log('[PrintService] Recovering pending print jobs and connections...');
        this.startQueueWorker();
        
        // Proactive Reconnection for Bluetooth/Serial
        const settings = await this.getSettings();
        for (const printer of settings) {
            if (printer.autoPrint !== false) {
                if (printer.connectionType === 'bluetooth') {
                    console.log(`[PrintService] Proactive reconnect to BT: ${printer.name}`);
                    this.connectBluetooth(false, printer.deviceId).catch(() => {});
                } else if (printer.connectionType === 'serial') {
                    console.log(`[PrintService] Proactive reconnect to Serial: ${printer.name}`);
                    this.connectSerial(false).catch(() => {});
                }
            }
        }
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
    public static async connectBluetooth(forcePopup = false, preferredId?: string): Promise<{name: string, deviceId: string} | null> {
        const nav = navigator as any;
        const btSerial = (window as any).bluetoothSerial;

        // --- NATIVE ANDROID SPP (Capacitor) ---
        if (btSerial) {
            return new Promise((resolve, reject) => {
                btSerial.list((devices: { name: string, address?: string, id?: string }[]) => {
                    const printer = preferredId 
                        ? devices.find(d => (d.address || d.id) === preferredId)
                        : devices.find(d => 
                            d.name?.toLowerCase().includes('printer') || 
                            d.name?.toLowerCase().includes('mpt') ||
                            d.name?.toLowerCase().includes('bt-') ||
                            d.name?.toLowerCase().includes('rp')
                        );

                    if (printer) {
                        btSerial.connect(printer.address || printer.id, () => {
                            console.log('[Native] Connected to:', printer.name);
                            this.bluetoothDevice = printer; // Store for state
                            resolve({ name: printer.name, deviceId: printer.address || printer.id || '' });
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
                    const printer = preferredId 
                        ? devices.find((d: any) => d.id === preferredId)
                        : devices.find((d: any) => 
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
                        if (ok) return { name: printer.name || 'Bluetooth Printer', deviceId: printer.id };
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
            const deviceId = this.bluetoothDevice.id;
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
            return { name: deviceName, deviceId };
        } catch (error: any) {
            console.error('Bluetooth connection failed:', error);
            if (error.message?.includes('tidak mendukung')) throw error;
            if (error.name === 'NotFoundError') return null;
            return null;
        }
    }

    /**
     * Safely releases the serial writer lock.
     */
    private static async releaseSerial() {
        if (this.serialWriter) {
            try {
                // If the writer is currently busy, this might fail, so we catch it
                await this.serialWriter.close().catch(() => {});
                this.serialWriter.releaseLock();
            } catch (e) {
                console.warn('[Serial] Failed to release lock:', e);
            }
            this.serialWriter = null;
        }
    }

    /**
     * Connects to a Serial port (used for legacy Bluetooth SPP mapped as COM/TTY).
     */
    public static async connectSerial(forcePopup = false): Promise<{name: string, deviceId: string} | null> {
        const nav = navigator as any;
        if (!nav.serial) {
            throw new Error('Web Serial API tidak didukung di browser ini.');
        }

        try {
            // 1. Try silent reconnect first
            if (!forcePopup) {
                // Reuse existing writer if stream is already open and not locked or we already own the lock
                if (this.serialPort?.readable && this.serialWriter) {
                     console.log('[Serial] Reusing existing open port and writer.');
                     return { name: 'Serial Port Printer', deviceId: 'serial-0' };
                }

                const ports = await nav.serial.getPorts();
                if (ports.length > 0) {
                    console.log('[Serial] Found authorized ports, trying to reuse...');
                    const port = ports[0];
                    
                    // If this is a DIFFERENT port than current, release current
                    if (this.serialPort && this.serialPort !== port) {
                        await this.releaseSerial();
                        await this.serialPort.close().catch(() => {});
                    }

                    this.serialPort = port;
                    
                    try {
                        if (this.serialPort.readable === null) {
                            await this.serialPort.open({ baudRate: 9600 });
                        }
                    } catch (openErr) {
                        console.log('[Serial] Port already open or failed to open, continuing...');
                    }
                    
                    if (this.serialPort.writable) {
                        if (this.serialPort.writable.locked && this.serialWriter) {
                            console.log('[Serial] Writable already locked by us, reusing writer.');
                        } else {
                            await this.releaseSerial(); // Clear any stale writers
                            this.serialWriter = this.serialPort.writable.getWriter();
                            console.log('[Serial] New writer acquired for existing port.');
                        }
                        return { name: 'Serial Port Printer', deviceId: 'serial-0' };
                    }
                }
            }

            // 2. Fallback to popup (forced or no authorized ports)
            console.log('[Serial] Requesting new port via popup...');
            await this.releaseSerial();
            if (this.serialPort) {
                await this.serialPort.close().catch(() => {});
            }
            
            this.serialPort = await nav.serial.requestPort();
            await this.serialPort.open({ baudRate: 9600 }); 
            
            if (this.serialPort.writable) {
                this.serialWriter = this.serialPort.writable.getWriter();
                console.log('[Serial] New port opened and writer acquired.');
            }
            
            return { name: 'Serial Port Printer', deviceId: 'serial-0' };
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
            await this.releaseSerial();
            if (this.serialPort) {
                await this.serialPort.close().catch(() => {});
                this.serialPort = null;
            }
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

    public static async printChecker(data: PrintData, isManual = false): Promise<boolean> {
        const settings = await this.getSettings();
        
        if (settings.length === 0) return false;

        let totalSuccess = true;
        const processedPrinters = new Set<string>();
        
        // Check if there are any dedicated kitchen printers configured
        const hasKitchenPrinters = settings.some(p => (p.categories || []).length > 0);

        for (const printer of settings) {
            if (printer.autoPrint === false) continue;

            const printerKey = `${printer.connectionType}:${printer.name}:${printer.ip || ''}:${printer.deviceId || ''}`;
            if (processedPrinters.has(printerKey)) continue;
            processedPrinters.add(printerKey);

            const cats = (printer.categories || []).map(c => c.toLowerCase());
            let filteredItems: any[] = [];

            if (cats.length === 0) {
                if (hasKitchenPrinters) {
                    continue; // Skip cashier printer if we have kitchen printers
                } else {
                    filteredItems = data.items; // Fallback: print everything as checker
                }
            } else {
                filteredItems = data.items.filter(item => 
                    item.category && cats.includes(item.category.toLowerCase())
                );
            }

            console.log(`[PrintService] Printer "${printer.name}" (Cats: ${cats.join(',')}) -> Found ${filteredItems.length}/${data.items.length} matching items for checker.`);

            if (filteredItems.length > 0) {
                const checkerData = { ...data, items: filteredItems };
                const buffer = this.encodeChecker(checkerData);
                
                let success = false;
                if (printer.connectionType === 'bluetooth') {
                    success = await this.sendToBluetooth(buffer);
                } else if (printer.connectionType === 'serial') {
                    success = await this.sendToSerial(buffer);
                } else if (printer.connectionType === 'bridge') {
                    const bufferBase64 = btoa(String.fromCharCode(...buffer));
                    await db.offlineActions.add({
                        id: `ck_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                        type: 'ENQUEUE_PRINT',
                        payload: {
                            payload: checkerData,
                            printerName: printer.name,
                            isPrepTicket: true,
                            bufferBase64,
                            printerIp: printer.ip || '127.0.0.1',
                            isManual
                        },
                        sync_status: 'PENDING',
                        retry_count: 0,
                        idempotency_key: `ckp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                        created_at: new Date().toISOString(),
                        sequence_number: Date.now()
                    });
                    success = true; // Assume success when queued
                }
                if (!success) totalSuccess = false;
            }
        }
        return totalSuccess;
    }

    public static async printOrder(data: PrintData, isManual = false): Promise<boolean> {
        const settings = await this.getSettings();
        
        if (settings.length === 0) {
            if (isManual) {
                console.warn('[PrintService] No printers configured. Offering browser print fallback.');
                this.browserPrint(data);
                return true;
            } else {
                console.log('[PrintService] No printers configured. Skipping auto-print silently.');
                return false;
            }
        }

        let totalSuccess = true;
        const processedPrinters = new Set<string>();
        for (const printer of settings) {
            if (printer.autoPrint === false) continue;

            const printerKey = `${printer.connectionType}:${printer.name}:${printer.ip || ''}:${printer.deviceId || ''}`;
            if (processedPrinters.has(printerKey)) continue;
            processedPrinters.add(printerKey);

            const cats = printer.categories || [];
            if (!isManual && cats.length > 0) continue;

            if (data.items.length > 0) {
                let success = false;
                if (printer.connectionType === 'bluetooth') {
                    console.log(`[PrintService] Executing Bluetooth print immediately for ${printer.name}`);
                    const buffer = this.encodeReceipt(data, { config: printer });
                    success = await this.sendToBluetooth(buffer);
                    if (!success && isManual) {
                        window.dispatchEvent(new CustomEvent('print-alert', { 
                            detail: { message: `Printer Bluetooth "${printer.name}" gagal.`, type: 'WARN', data } 
                        }));
                    }
                } else if (printer.connectionType === 'serial') {
                    console.log(`[PrintService] Executing Serial print immediately for ${printer.name}`);
                    const buffer = this.encodeReceipt(data, { config: printer });
                    success = await this.sendToSerial(buffer);
                } else if (printer.connectionType === 'bridge') {
                    await this.enqueuePrintJob(data, printer, isManual);
                    success = true;
                }
                if (!success) totalSuccess = false;
            }
        }
        
        // Start worker for bridge jobs
        this.startQueueWorker();
        return totalSuccess;
    }

    public static async printTransaction(data: PrintData) {
        if (this.isPrinting) {
            console.warn('[PrintService] Printing already in progress, skipping sequential request.');
            return;
        }

        try {
            this.isPrinting = true;

            // 1. Print Checker (Kitchen/Bar)
            console.log('[PrintService] Starting Sequential Print: Checker...');
            let checkerSuccess = await this.printChecker(data);
            if (!checkerSuccess) {
                console.warn('[PrintService] First Checker print failed, retrying once in 1s...');
                await this.delay(1000);
                checkerSuccess = await this.printChecker(data);
            }

            // 2. Mandatory Delay (3 seconds)
            console.log('[PrintService] Waiting 3000ms before customer receipt...');
            await this.delay(3000);

            // 3. Print Customer Receipt
            console.log('[PrintService] Starting Sequential Print: Customer Receipt...');
            let orderSuccess = await this.printOrder(data);
            if (!orderSuccess) {
                console.warn('[PrintService] First Customer receipt failed, retrying once in 1s...');
                await this.delay(1000);
                orderSuccess = await this.printOrder(data);
            }

            if (!checkerSuccess || !orderSuccess) {
                window.dispatchEvent(new CustomEvent('print-alert', { 
                    detail: { 
                        message: `Beberapa struk gagal dicetak. Harap periksa antrean cetak.`, 
                        type: 'WARN', 
                        data 
                    } 
                }));
            }

        } catch (error) {
            console.error('[PrintService] printTransaction fatal error:', error);
            window.dispatchEvent(new CustomEvent('print-alert', { 
                detail: { message: `Sistem printing error: ${String(error)}`, type: 'ERROR', data } 
            }));
        } finally {
            this.isPrinting = false;
        }
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

    private static async enqueuePrintJob(data: PrintData, config: PrinterConfig, isManual = false) {
        // Pre-encode the receipt here using frontend settings
        const buffer = this.encodeReceipt(data, { config });
        const bufferBase64 = btoa(String.fromCharCode(...buffer));

        // Pivot: Instead of local bridge, we send to cloud queue via SyncEngine
        await db.offlineActions.add({
            id: `p_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            type: 'ENQUEUE_PRINT',
            payload: {
                payload: data,
                printerName: config.name,
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
            let { data, config } = job.data as { data: _PrTrData, config: _PrTrConf };
            
            // Backward Compatibility: If 'data' is missing, it might be an old flattened job
            if (!data && (job.data as any).items) {
                console.log(`[PrintService] Found legacy flattened job ${job.id}. Re-nesting...`);
                data = job.data as unknown as _PrTrData;
                // Note: config and isPrepTicket are already part of job.data in legacy structure too
            }

            const buffer = this.encodeReceipt(data, { 
                config
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

    public static encodeChecker(data: _PrTrData): Uint8Array {
        const encoder = new EscPosEncoder();

        encoder.initialize();
        
        // --- 1. Header (Beep + Bold Center) ---
        encoder.raw([0x1b, 0x42, 0x02, 0x01]); // Beep
        encoder.raw([0x07]); // BEL

        encoder
            .raw([0x1d, 0x21, 0x11]) // Double height & width for header
            .bold(true)
            .align('center')
            .line('ORDERAN')
            .raw([0x1d, 0x21, 0x00]) // Normal size
            .bold(false)
            .align('left')
            .line('--------------------------------');

        // --- 2. Metadata ---
        encoder.align('left');
        const orderIdShort = data.id.toString().split('-')[0].toUpperCase();
        const timeStr = new Date(data.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        
        encoder.line(`No Order : #${orderIdShort}`);
        encoder.line(`Waktu    : ${timeStr}`);
        encoder.line(`Meja     : ${data.customerName || data.tableNumber || '-'}`);
        encoder.line('--------------------------------');
        encoder.newline();

        // --- 3. Items (Proporsional & Rapi) ---
        // Normal font per user request so paper is saved
        data.items.forEach((item: any) => {
            encoder.line(`${item.quantity}x ${item.name}`);
            
            if (item.notes) {
                encoder.line(`   (Catatan: ${item.notes})`);
            }
        });

        // --- 4. Footer ---
        encoder
            .newline()
            .line('--------------------------------')
            .newline()
            .newline()
            .cut();
            
        return encoder.encode();
    }

    public static encodeReceipt(data: _PrTrData, options: { config: _PrTrConf }): Uint8Array {
        const encoder = new EscPosEncoder();
        const { config } = options;
        
        if (!data) return encoder.initialize().line('ERR: MISSING DATA').encode();

        const width = config.width || 32;

        // --- Header ---
        encoder.initialize();
        const hTitle = config.headerTitle || 'KERABAT KOPI TIAM';
        const hSub = config.headerSubtitle || 'Premium Coffee & Toast';
        
        encoder.bold(true).align('center').line(hTitle).bold(false);
        if (hSub) encoder.align('center').line(hSub);
        
        encoder.align('left').line('--------------------------------');

        // --- Metadata ---
        const orderIdShort = data.id.toString().split('-')[0].toUpperCase();
        encoder.line(`No Order : #${orderIdShort}`);
        encoder.line(`Waktu    : ${new Date(data.date).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit' })}`);
        if (data.tableNumber || data.customerName) {
            encoder.line(`Meja     : ${data.customerName || data.tableNumber}`);
        }
        encoder.line('--------------------------------');
        encoder.newline();

        // --- Items ---
        data.items.forEach((item: any) => {
            const leftPart = `${item.quantity}x ${item.name}`;
            const rightPart = item.subtotal.toLocaleString('id-ID'); // Only display the subtotal price, e.g. 16.000
            
            if (leftPart.length + rightPart.length < width) {
                const spacesStr = ' '.repeat(width - leftPart.length - rightPart.length);
                encoder.line(`${leftPart}${spacesStr}${rightPart}`);
            } else {
                // If text is too long, print name first, then price aligned right on next line
                encoder.line(leftPart);
                const spacesStr = ' '.repeat(Math.max(0, width - rightPart.length));
                encoder.line(`${spacesStr}${rightPart}`);
            }

            if (item.notes) {
                encoder.line(`   (Cat: ${item.notes})`);
            }
        });

        encoder.newline();
        encoder.line('--------------------------------');

        // --- Summary ---
        const totalLabel = 'TOTAL:';
        const totalValue = `Rp ${data.total.toLocaleString('id-ID')}`;
        const tSpaces = ' '.repeat(Math.max(1, width - totalLabel.length - totalValue.length));
        
        encoder.bold(true).line(`${totalLabel}${tSpaces}${totalValue}`).bold(false);
        
        encoder.newline();
        
        // --- Footer ---
        encoder.align('left');
        encoder.line(`Metode: ${data.paymentMethod}`);
        
        if (data.paymentMethod === 'CASH') {
            const payLabel = 'Bayar :';
            const payValue = `Rp ${(data.amountPaid || 0).toLocaleString('id-ID')}`;
            if (payLabel.length + payValue.length < width) {
                const pSpaces = ' '.repeat(width - payLabel.length - payValue.length);
                encoder.line(`${payLabel}${pSpaces}${payValue}`);
            }

            const changeLabel = 'Kembali:';
            const changeValue = `Rp ${(data.change_due || 0).toLocaleString('id-ID')}`;
            if (changeLabel.length + changeValue.length < width) {
                const cSpaces = ' '.repeat(width - changeLabel.length - changeValue.length);
                encoder.line(`${changeLabel}${cSpaces}${changeValue}`);
            }
        }

        encoder
            .newline()
            .align('left')
            .line('--------------------------------')
            .align('center')
            .line(config.footerMessage || 'Terima Kasih')
            .align('center')
            .line('Selamat Menikmati')
            .newline()
            .newline();

        if (config.openCashDrawer && data.paymentMethod === 'CASH') {
            encoder.raw([0x1b, 0x70, 0x00, 0x19, 0xfa]); // Pulse
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
        const settings = await this.getSettings();
        const primaryPrinter = settings.find(p => p.autoPrint !== false) || settings[0];

        await db.printQueue.add({
            id: `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            data: {
                data,
                config: primaryPrinter
            },
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
