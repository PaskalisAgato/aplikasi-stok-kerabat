import { Response } from 'express';

interface KdsClient {
    id: string;
    outletId: number;
    res: Response;
}

export class KdsService {
    private static clients: KdsClient[] = [];

    /**
     * Registers a new KDS client (SSE connection)
     */
    static addClient(id: string, outletId: number, res: Response) {
        this.clients.push({ id, outletId, res });
        
        // SSE Setup
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        // Send initial heartbeat
        res.write('retry: 10000\n\n');
        res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'KDS Stream Connected' })}\n\n`);

        console.log(`[KDS] Client ${id} connected to outlet ${outletId}`);
    }

    /**
     * Removes a KDS client
     */
    static removeClient(id: string) {
        this.clients = this.clients.filter(c => c.id !== id);
        console.log(`[KDS] Client ${id} disconnected`);
    }

    /**
     * Notifies all KDS clients in a specific outlet about a new order
     */
    static notifyNewOrder(outletId: number, orderData: any) {
        const outletClients = this.clients.filter(c => c.outletId === outletId);
        const payload = JSON.stringify({
            type: 'NEW_ORDER',
            data: orderData
        });

        outletClients.forEach(client => {
            client.res.write(`data: ${payload}\n\n`);
        });

        console.log(`[KDS] Notified ${outletClients.length} clients for outlet ${outletId}`);
    }

    /**
     * Notifies KDS client about an order update (e.g. Cancelled/Voided)
     */
    static notifyOrderUpdate(outletId: number, updateData: any) {
        const outletClients = this.clients.filter(c => c.outletId === outletId);
        const payload = JSON.stringify({
            type: 'ORDER_UPDATE',
            data: updateData
        });

        outletClients.forEach(client => {
            client.res.write(`data: ${payload}\n\n`);
        });
    }
}
