import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service.js';

export class AnalyticsController {
    static async getTodayDashboard(req: Request, res: Response) {
        try {
            const summary = await AnalyticsService.getDailySummary();
            const monitoring = await AnalyticsService.getShiftMonitoring();
            const ranking = await AnalyticsService.getCashierPerformance();
            const recentSales = await AnalyticsService.getTodayRecentSales(20);

            res.json({
                success: true,
                data: {
                    summary,
                    monitoring,
                    ranking,
                    recentSales
                }
            });
        } catch (error: any) {
            console.error('[AnalyticsController] Error fetching dashboard:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Gagal memuat data dashboard. Silakan coba beberapa saat lagi.' 
            });
        }
    }
}
