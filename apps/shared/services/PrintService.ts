import EscPosEncoder from 'esc-pos-encoder';
import { openDB } from 'idb';

const DB_NAME = 'kerabat-pos-pwa';
const STORE_NAME = 'print-queue';
const BRIDGE_URL = 'http://localhost:3001'; // Default bridge address

export interface PrintItem {
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
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
            },
        });
    }

    /**
     * Formats receipt data into ESC/POS binary buffer
     */
    public static encodeReceipt(data: PrintData, options: { width: 32 | 48 } = { width: 32 }): Uint8Array {
        const encoder = new EscPosEncoder();
        const { width } = options;

        encoder
            .initialize()
            .align('center')
            .line('KERABAT KOPI TIAM')
            .line('Premium Coffee & Toast')
            .line('Jl. Kopi No. 1, Jakarta')
            .line('--------------------------------')
            .align('left')
            .line(`Order: #${data.id}`)
            .line(`Date:  ${new Date(data.date).toLocaleString('id-ID')}`)
            .line('--------------------------------');

        data.items.forEach((item) => {
            const name = item.name.length > (width - 10) ? item.name.substring(0, width - 13) + '...' : item.name;
            const qty = `${item.quantity}x`.padEnd(4);
            const price = item.subtotal.toLocaleString('id-ID').padStart(width - name.length - 4);
            encoder.line(`${qty}${name}${price}`);
        });

        encoder
            .line('--------------------------------')
            .align('right')
            .bold(true)
            .line(`TOTAL: Rp ${data.total.toLocaleString('id-ID')}`)
            .bold(false)
            .align('left')
            .line(`Bayar: ${data.paymentMethod}`)
            .line('--------------------------------')
            .align('center')
            .line('Scan untuk Cek Transaksi:')
            .qrcode(`https://kerabatpos.com/check/${data.id}`, 2, 4, 'H') // Model 2, Size 4, Level H
            .newline()
            .line('Terima Kasih!')
            .line('Selamat Menikmati')
            .newline()
            .newline();

        // Cash Drawer Kick if Cash
        if (data.paymentMethod === 'CASH') {
            // Standard ESC p command for drawer kick
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
            
            console.log('Print job sent successfully');
            return true;
        } catch (error) {
            console.error('Printing failed, queuing job...', error);
            await this.queueJob({ ...data, printerIp });
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
