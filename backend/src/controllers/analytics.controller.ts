import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service.js';

export class AnalyticsController {
    static async getTodayDashboard(req: Request, res: Response) {
        try {
            const summary = await AnalyticsService.getDailySummary();
            const monitoring = await AnalyticsService.getShiftMonitoring();
            const ranking = await AnalyticsService.getCashierPerformance();

            console.log(`[Analytics] Sending Dashboard Data:`, { 
                revenue: summary.revenue, 
                cash: summary.cash, 
                activeShifts: monitoring.activeShifts.length 
            });

            res.json({
                success: true,
                data: {
                    summary,
                    monitoring,
                    ranking
                }
            });
        } catch (error: any) {
            console.error('[AnalyticsController] Error fetching dashboard:', error);
            // Return specific error for debugging on production
            res.status(500).json({ 
                success: false, 
                message: `Gagal memuat data dashboard: ${error.message || 'Unknown Error'}`,
                debug: error.stack?.split('\n')[0]
            });
        }
    }
}
