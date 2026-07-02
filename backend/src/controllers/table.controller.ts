import { Request, Response } from 'express';
import { TableService } from '../services/table.service.js';

export class TableController {
    static async getAll(req: Request, res: Response) {
        try {
            const tables = await TableService.getAllTables();
            res.json({ success: true, data: tables });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async create(req: Request, res: Response) {
        try {
            const table = await TableService.createTable(req.body);
            res.status(201).json({ success: true, data: table });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    static async update(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id as string);
            const table = await TableService.updateTable(id, req.body);
            res.json({ success: true, data: table });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    static async updateBulk(req: Request, res: Response) {
        try {
            const { items } = req.body;
            if (!items || !Array.isArray(items)) {
                return res.status(400).json({ success: false, message: "items must be an array" });
            }
            await TableService.updateBulkPositions(items);
            res.json({ success: true, message: "Positions updated successfully" });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    static async delete(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id as string);
            await TableService.deleteTable(id);
            res.json({ success: true, message: 'Meja berhasil dihapus' });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
