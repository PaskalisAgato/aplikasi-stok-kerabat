import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service.js';

export class AnalyticsController {
    static async getDashboardAnalytics(req: Request, res: Response) {
        try {
            const { date, startDate, endDate } = req.query;
            let start = new Date();
            let end = new Date();

            if (date === 'today') {
                const jakartaDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
                start = new Date(`${jakartaDate}T00:00:00+07:00`);
                end = new Date(`${jakartaDate}T23:59:59+07:00`);
            } else if (date === 'yesterday') {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const jakartaDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(yesterday);
                start = new Date(`${jakartaDate}T00:00:00+07:00`);
                end = new Date(`${jakartaDate}T23:59:59+07:00`);
            } else if (startDate && endDate) {
                start = new Date(`${startDate}T00:00:00+07:00`);
                end = new Date(`${endDate}T23:59:59.999+07:00`);
            }

            const data = await AnalyticsService.getDashboardAnalytics({ start, end });
            res.status(200).json({ success: true, data });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Gagal memuat data dashboard' });
        }
    }

    static async getShiftReports(req: Request, res: Response) {
        try {
            const { startDate, endDate } = req.query;
            let start = new Date();
            let end = new Date();

            if (startDate && endDate) {
                start = new Date(`${startDate}T00:00:00+07:00`);
                end = new Date(`${endDate}T23:59:59.999+07:00`);
            } else {
                // Default to last 7 days
                start.setDate(start.getDate() - 7);
                start.setHours(0, 0, 0, 0);
            }

            const data = await AnalyticsService.getShiftReports({ start, end });
            res.status(200).json({ success: true, data });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Gagal memuat laporan harian' });
        }
    }
}
