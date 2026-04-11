import EscPosEncoder from 'esc-pos-encoder';
import { db, PrinterConfig as _PrTrConf, PrintData as _PrTrData } from './db';

const BRIDGE_URL = 'http://127.0.0.1:3001';

export type PrinterConfig = _PrTrConf;
export type PrintData = _PrTrData;

export class PrintService {
    private static bluetoothDevice: any = null;
    private static bluetoothCharacteristic: any = null;
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
                        d.name?.toLowerCase().includes('rp')
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
            this.bluetoothDevice = await nav.bluetooth.requestDevice({
                filters: [
                    { services: ['000018f0-0000-1000-8000-00805f9b34fb'] },
                    { services: ['0000ff00-0000-1000-8000-00805f9b34fb'] },
                    { services: ['0000ffe0-0000-1000-8000-00805f9b34fb'] },
                    { namePrefix: 'Printer' },
                    { namePrefix: 'RP' },
                    { namePrefix: 'MPT' },
                    { namePrefix: 'BT-' },
                    { namePrefix: 'MP' },
                    { namePrefix: 'Inner' }
                ],
                optionalServices: [
                    '000018f0-0000-1000-8000-00805f9b34fb', 
                    '00001101-0000-1000-8000-00805f9b34fb',
                    '0000ff00-0000-1000-8000-00805f9b34fb',
                    '0000ffe0-0000-1000-8000-00805f9b34fb'
                ]
            });

            const ok = await this.setupGATT(this.bluetoothDevice);
            return ok ? (this.bluetoothDevice.name || 'Bluetooth Printer') : null;
        } catch (error) {
            console.error('Bluetooth connection failed:', error);
            return null;
        }
    }

    private static async setupGATT(device: any): Promise<boolean> {
        try {
            console.log('Connecting to GATT server...');
            const server = await device.gatt?.connect();
            
            const serviceUUIDs = [
                '000018f0-0000-1000-8000-00805f9b34fb',
                '0000ff00-0000-1000-8000-00805f9b34fb',
                '0000ffe0-0000-1000-8000-00805f9b34fb'
            ];

            for (const uuid of serviceUUIDs) {
                try {
                    const service = await server?.getPrimaryService(uuid);
                    if (service) {
                        const chars = await service.getCharacteristics();
                        for (const char of chars) {
                            if (char.properties.write || char.properties.writeWithoutResponse) {
                                console.log(`GATT Setup: Found writable characteristic: ${char.uuid}`);
                                this.bluetoothCharacteristic = char;
                                return true;
                            }
                        }
                    }
                } catch (e) {
                    continue;
                }
            }
            return false;
        } catch (err) {
            console.error('GATT setup failed:', err);
            return false;
        }
    }

    private static async delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
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
        return this.sendToBridge(buffer, config.ip || '127.0.0.1');
    }

    public static async printOrder(data: PrintData) {
        const settings = await this.getSettings();
        
        if (settings.length === 0) {
            // Default bridge fallback
            await this.enqueuePrintJob(data, { 
                id: 'default', name: 'Default', connectionType: 'bridge', ip: '127.0.0.1', 
                port: 9100, width: 32, categories: [], autoPrint: true 
            });
            this.startQueueWorker();
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
                    this.sendToBluetooth(buffer).catch(err => console.error('Immediate BT Print failed', err));
                } else {
                    await this.enqueuePrintJob(data, printer, isPrepTicket);
                }
            }
        }
        
        this.startQueueWorker();
    }

    private static async enqueuePrintJob(data: PrintData, config: PrinterConfig, isPrepTicket = false) {
        const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        await db.printQueue.put({
            id: jobId,
            data: { ...data, config, isPrepTicket },
            status: 'PENDING',
            retry_count: 0,
            created_at: new Date().toISOString()
        });
        console.log(`[PrintService] Enqueued job ${jobId} for ${config.name}`);
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
            const { data, config, isPrepTicket } = job.data as { data: _PrTrData, config: _PrTrConf, isPrepTicket: boolean };
            const buffer = this.encodeReceipt(data, { 
                config,
                isPrepTicket 
            });

            console.log(`[PrintService] Processing job ${job.id} for ${config.name}...`);
            let success = false;
            
            if (config.connectionType === 'bluetooth') {
                success = await this.sendToBluetooth(buffer);
            } else {
                success = await this.sendToBridge(buffer, config.ip || '127.0.0.1');
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
            encoder.line(`Date:  ${new Date(data.date).toLocaleString('id-ID')}`);
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
                
                words.forEach(word => {
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

    private static async sendToBridge(buffer: Uint8Array, printerIp: string): Promise<boolean> {
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
            return false;
        }
    }
}
