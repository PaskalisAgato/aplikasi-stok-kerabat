import { ShiftService } from '../services/shift.service.js';
export class ShiftController {
    static async getAllShifts(req, res) {
        try {
            const shifts = await ShiftService.getAllShifts();
            res.json(shifts);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async getMyShifts(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ error: 'Unauthorized' });
            const shifts = await ShiftService.getShiftsByUser(userId);
            res.json(shifts);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async createShift(req, res) {
        try {
            const currentUserId = req.user?.id;
            const { userId, date, startTime, endTime } = req.body;
            const newShift = await ShiftService.createShift(userId, new Date(date), startTime, endTime, currentUserId);
            res.status(201).json(newShift);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async updateShift(req, res) {
        try {
            const currentUserId = req.user?.id;
            const id = req.params.id;
            const updatedShift = await ShiftService.updateShift(parseInt(id), req.body, currentUserId);
            res.json(updatedShift);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async deleteShift(req, res) {
        try {
            const currentUserId = req.user?.id;
            const id = req.params.id;
            await ShiftService.deleteShift(parseInt(id), currentUserId);
            res.json({ success: true });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
