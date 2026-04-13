import { Request, Response } from 'express';
import { db } from '../config/db.js';
import * as schema from '../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';

export class PrintController {
    /**
     * Enqueue a new print job (Called by Frontend)
     */
    static async enqueue(req: Request, res: Response) {
        try {
            const { payload, printerName } = req.body;
            console.log(`[PRINT REQUEST] Enqueuing job for printer: ${printerName || 'Default'}`);

            const [newJob] = await db.insert(schema.printJobs).values({
                payload: JSON.stringify(payload),
                printerName: printerName || 'Default',
                status: 'PENDING'
            }).returning();

            res.status(201).json({ 
                success: true, 
                message: 'Job enqueued',
                jobId: newJob.id 
            });
        } catch (error: any) {
            console.error('[PRINT ERROR] Enqueue failed:', error);
            res.status(500).json({ success: false, message: 'Gagal memasukkan antrean print: ' + error.message });
        }
    }

    /**
     * Poll pending jobs (Called by Local Agent)
     */
    static async poll(req: Request, res: Response) {
        try {
            const jobs = await db.select()
                .from(schema.printJobs)
                .where(eq(schema.printJobs.status, 'PENDING'))
                .limit(10);

            // Mark as PROCESSING so others don't pick it up (simplified locked)
            if (jobs.length > 0) {
                const jobIds = jobs.map(j => j.id);
                await db.update(schema.printJobs)
                    .set({ status: 'PROCESSING' })
                    .where(sql`id IN (${sql.join(jobIds, sql`, `)})`);
            }

            res.json({ success: true, count: jobs.length, jobs });
        } catch (error: any) {
            console.error('[PRINT ERROR] Poll failed:', error);
            res.status(500).json({ success: false, message: 'Poll failed' });
        }
    }

    /**
     * Acknowledge job completion (Called by Local Agent)
     */
    static async acknowledge(req: Request, res: Response) {
        try {
            const { jobId, status, error } = req.body;
            console.log(`[PRINT ACK] Job ${jobId} finished with status: ${status}`);

            await db.update(schema.printJobs)
                .set({ 
                    status: status === 'success' ? 'SUCCESS' : 'FAILED',
                    lastError: error || null,
                    processedAt: new Date()
                })
                .where(eq(schema.printJobs.id, jobId));

            res.json({ success: true });
        } catch (error: any) {
            console.error('[PRINT ERROR] Ack failed:', error);
            res.status(500).json({ success: false, message: 'Ack failed' });
        }
    }
}
