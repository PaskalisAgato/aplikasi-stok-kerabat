import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service.js';

export class AnalyticsController {
    static async getDashboardAnalytics(req: Request, res: Response) {
        try {
            const { date, startDate, endDate } = req.query;
            let start = new Date();
            let end = new Date();

            if (date === 'today') {
                const now = new Date();
                // 5-hour offset: If it's before 5 AM, it still counts as yesterday
                const offsetDate = new Date(now.getTime() - (5 * 60 * 60 * 1000));
                const jakartaDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(offsetDate);
                
                // Business day starts at 05:00 WIB of the calculated jakartaDate
                start = new Date(`${jakartaDate}T05:00:00+07:00`);
                // and ends at 05:00 WIB the next day
                end = new Date(start.getTime() + (24 * 60 * 60 * 1000));
            } else if (date === 'yesterday') {
                const now = new Date();
                const yesterdayOffset = new Date(now.getTime() - (5 * 60 * 60 * 1000));
                yesterdayOffset.setDate(yesterdayOffset.getDate() - 1);
                const jakartaDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(yesterdayOffset);
                
                start = new Date(`${jakartaDate}T05:00:00+07:00`);
                end = new Date(start.getTime() + (24 * 60 * 60 * 1000));
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
