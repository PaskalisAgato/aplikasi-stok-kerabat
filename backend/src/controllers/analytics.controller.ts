import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service.js';

export class AnalyticsController {
    static async getDashboardAnalytics(req: Request, res: Response) {
        try {
            const { date, startDate, endDate } = req.query;
            
            // Default to Today in WIB
            const now = new Date();
            const jakartaStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(now);
            let start = new Date(`${jakartaStr}T00:00:00+07:00`);
            let end = new Date(`${jakartaStr}T23:59:59+07:00`);

            if (date === 'yesterday') {
                const yesterday = new Date(start);
                yesterday.setDate(yesterday.getDate() - 1);
                start = yesterday;
                const yesterdayEnd = new Date(yesterday);
                yesterdayEnd.setHours(23, 59, 59, 999);
                end = yesterdayEnd;
            } else if (startDate && endDate) {
                // Parse custom date strings (assuming YYYY-MM-DD)
                start = new Date(`${startDate}T00:00:00+07:00`);
                end = new Date(`${endDate}T23:59:59+07:00`);
            }

            const data = await AnalyticsService.getDashboardAnalytics({ start, end });

            res.json({
                success: true,
                data
            });
        } catch (error: any) {
            console.error('[AnalyticsController] Error fetching dashboard diagnostics:', error);
            res.status(500).json({ 
                success: false, 
                message: error.message || 'Gagal memuat data dashboard.' 
            });
        }
    }
}
