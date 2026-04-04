import EscPosEncoder from 'esc-pos-encoder';
import { openDB } from 'idb';

const DB_NAME = 'kerabat-pos-pwa';
const STORE_NAME = 'print-queue';
const SETTINGS_STORE = 'print-settings';
const BRIDGE_URL = 'http://127.0.0.1:3001';

export interface PrinterConfig {
    id: string;
    name: string;
    ip: string;
    port: number;
    width: 32 | 48;
    categories: string[]; // empty means "Main/All"
}

export interface PrintItem {
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
    category?: string;
}

export interface PrintData {
    id: string | number;
    date: string;
    items: PrintItem[];
    total: number;
    paymentMethod: string;
}

export class PrintService {
    private static async getDB() {
        return openDB(DB_NAME, 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
                    db.createObjectStore(SETTINGS_STORE, { keyPath: 'id' });
                }
            },
        });
    }

    public static async saveSettings(configs: PrinterConfig[]) {
        const db = await this.getDB();
        await db.clear(SETTINGS_STORE);
        for (const config of configs) {
            await db.put(SETTINGS_STORE, config);
        }
    }

    public static async getSettings(): Promise<PrinterConfig[]> {
        const db = await this.getDB();
        return db.getAll(SETTINGS_STORE);
    }

    /**
     * Test print for a specific configuration
     */
    public static async testPrint(config: PrinterConfig): Promise<boolean> {
        const encoder = new EscPosEncoder();
        encoder.initialize()
            .align('center')
            .line('TEST PRINT')
            .line(config.name)
            .line(`Width: ${config.width} chars`)
            .line(`IP: ${config.ip}`)
            .newline()
            .line('Cash Drawer Test...')
            .raw([0x1b, 0x70, 0x00, 0x19, 0xfa])
            .newline()
            .cut();
        
        return this.sendToBridge(encoder.encode(), config.ip);
    }

    /**
     * Smart routing: Prints the order to all matching printers
     */
    public static async printOrder(data: PrintData) {
        const settings = await this.getSettings();
        
        // If no printers configured, try default bridge
        if (settings.length === 0) {
            return this.print(data, '192.168.1.100');
        }

        for (const printer of settings) {
            let filteredItems = data.items;
            let isPrepTicket = false;

            // If printer has categories, it's a prep ticket (Kitchen/Bar)
            if (printer.categories.length > 0) {
                filteredItems = data.items.filter(item => 
                    item.category && printer.categories.includes(item.category)
                );
                isPrepTicket = true;
            }

            if (filteredItems.length > 0) {
                const buffer = this.encodeReceipt({ ...data, items: filteredItems }, { 
                    width: printer.width,
                    isPrepTicket 
                });
                await this.sendToBridge(buffer, printer.ip);
            }
        }
    }

    /**
     * Formats receipt data into ESC/POS binary buffer
     */
    public static encodeReceipt(data: PrintData, options: { width: 32 | 48, isPrepTicket?: boolean } = { width: 32 }): Uint8Array {
        const encoder = new EscPosEncoder();
        const { width, isPrepTicket } = options;

        encoder.initialize().align('center');

        if (isPrepTicket) {
            encoder.bold(true).line('ORDER PERSIAPAN').bold(false);
        } else {
            encoder.line('KERABAT KOPI TIAM').line('Premium Coffee & Toast');
        }

        encoder
            .line('--------------------------------')
            .align('left')
            .line(`Order: #${data.id}`)
            .line(`Date:  ${new Date(data.date).toLocaleString('id-ID')}`)
            .line('--------------------------------');

        data.items.forEach((item) => {
            const name = item.name.length > (width - 10) ? item.name.substring(0, width - 13) + '...' : item.name;
            const qty = `${item.quantity}x`.padEnd(4);
            
            if (isPrepTicket) {
                encoder.bold(true).line(`${qty}${name}`).bold(false);
            } else {
                const price = item.subtotal.toLocaleString('id-ID').padStart(width - name.length - 4);
                encoder.line(`${qty}${name}${price}`);
            }
        });

        encoder.line('--------------------------------');

        if (!isPrepTicket) {
            encoder
                .align('right')
                .bold(true)
                .line(`TOTAL: Rp ${data.total.toLocaleString('id-ID')}`)
                .bold(false)
                .align('left')
                .line(`Bayar: ${data.paymentMethod}`)
                .line('--------------------------------')
                .align('center')
                .line('Scan untuk Cek Transaksi:')
                .qrcode(`https://kerabatpos.com/check/${data.id}`, 2, 4, 'h')
                .newline()
                .line('Terima Kasih!')
                .line('Selamat Menikmati');
        }

        encoder.newline().newline();

        // Cash Drawer Kick if Cash and NOT a prep ticket
        if (!isPrepTicket && data.paymentMethod === 'CASH') {
            encoder.raw([0x1b, 0x70, 0x00, 0x19, 0xfa]);
        }

        encoder.cut();
        return encoder.encode();
    }

    /**
     * Dispatches a print job to the local bridge
     */
    public static async print(data: PrintData, printerIp: string): Promise<boolean> {
        const buffer = this.encodeReceipt(data);
        return this.sendToBridge(buffer, printerIp, data);
    }

    private static async sendToBridge(buffer: Uint8Array, printerIp: string, originalData?: PrintData): Promise<boolean> {
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

            if (!response.ok) throw new Error('Bridge error');
            return true;
        } catch (error) {
            console.error('Printing failed, queuing job...', error);
            if (originalData) {
                await this.queueJob({ ...originalData, printerIp });
            }
            return false;
        }
    }

    private static async queueJob(job: any) {
        const db = await this.getDB();
        await db.add(STORE_NAME, { ...job, status: 'pending', timestamp: Date.now() });
    }

    public static async processQueue(printerIp: string) {
        const db = await this.getDB();
        const pending = await db.getAll(STORE_NAME);
        
        for (const job of pending) {
            const success = await this.print(job, printerIp);
            if (success) {
                await db.delete(STORE_NAME, job.id);
            }
        }
    }
}
