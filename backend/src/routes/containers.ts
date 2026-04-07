import express, { Request, Response } from 'express';
import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

export const containersRouter = express.Router();

// GET all containers
containersRouter.get('/', requireAuth, async (req: Request, res: Response) => {
    try {
        const results = await db.select().from(schema.containers);
        res.json({ success: true, data: results });
    } catch (error) {
        console.error('Error fetching containers:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data wadah' });
    }
});

// GET single container
containersRouter.get('/:id', requireAuth, async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id as string);
        const [container] = await db.select().from(schema.containers).where(eq(schema.containers.id, id)).limit(1);
        
        if (!container) {
            return res.status(404).json({ success: false, message: 'Wadah tidak ditemukan' });
        }
        
        res.json({ success: true, data: container });
    } catch (error) {
        console.error('Error fetching container:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data wadah' });
    }
});

// POST new container (Admin only)
containersRouter.post('/', requireAdmin, async (req: Request, res: Response) => {
    try {
        const { name, tareWeight, qrCode } = req.body;
        
        if (!name || tareWeight === undefined) {
            return res.status(400).json({ success: false, message: 'Nama dan berat wadah wajib diisi' });
        }

        const [newContainer] = await db.insert(schema.containers).values({
            name,
            tareWeight: tareWeight.toString(),
            qrCode
        }).returning();

        res.status(201).json({ success: true, data: newContainer });
    } catch (error: any) {
        console.error('Error creating container:', error);
        res.status(500).json({ success: false, message: 'Gagal membuat wadah baru', error: error.message });
    }
});

// PUT update container (Admin only, audit log included)
containersRouter.put('/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id as string);
        const { name, tareWeight, isLocked, qrCode } = req.body;
        const user = (req as any).user;

        const [oldContainer] = await db.select().from(schema.containers).where(eq(schema.containers.id, id)).limit(1);
        if (!oldContainer) {
            return res.status(404).json({ success: false, message: 'Wadah tidak ditemukan' });
        }

        if (oldContainer.isLocked && tareWeight !== undefined && tareWeight.toString() !== oldContainer.tareWeight) {
             return res.status(403).json({ success: false, message: 'Wadah terkunci. Berat wadah tidak dapat diubah.' });
        }

        const [updatedContainer] = await db.update(schema.containers)
            .set({
                ...(name && { name }),
                ...(tareWeight !== undefined && { tareWeight: tareWeight.toString() }),
                ...(isLocked !== undefined && { isLocked }),
                ...(qrCode !== undefined && { qrCode })
            })
            .where(eq(schema.containers.id, id))
            .returning();

        // Audit Log for Tare Weight Changes
        if (tareWeight !== undefined && tareWeight.toString() !== oldContainer.tareWeight) {
            await db.insert(schema.auditLogs).values({
                userId: user.id,
                action: 'UPDATE_CONTAINER_TARE',
                tableName: 'containers',
                oldData: JSON.stringify(oldContainer),
                newData: JSON.stringify(updatedContainer)
            });
        }

        res.json({ success: true, data: updatedContainer });
    } catch (error: any) {
        console.error('Error updating container:', error);
        res.status(500).json({ success: false, message: 'Gagal memperbarui wadah', error: error.message });
    }
});

// DELETE container (Admin only)
containersRouter.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id as string);
        
        // Check if items are using this container? 
        // For simplicity, we just allow delete but warn user that it might break links if not handled.
        
        await db.delete(schema.containers).where(eq(schema.containers.id, id));
        res.json({ success: true, message: 'Wadah berhasil dihapus' });
    } catch (error) {
        console.error('Error deleting container:', error);
        res.status(500).json({ success: false, message: 'Gagal menghapus wadah' });
    }
});
