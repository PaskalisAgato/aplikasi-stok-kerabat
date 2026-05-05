import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller.js';
import { requireAuth } from '../middleware/auth.js';

export const analyticsRouter = Router();

// Owner Dashboard Endpoints (Owner/Admin Only)
analyticsRouter.get('/dashboard', requireAuth, AnalyticsController.getDashboardAnalytics);
analyticsRouter.get('/reports', requireAuth, AnalyticsController.getShiftReports);
analyticsRouter.get('/dead-menu', requireAuth, AnalyticsController.getDeadMenus);
analyticsRouter.get('/variance', requireAuth, AnalyticsController.getInventoryVariance);
analyticsRouter.get('/cross-outlet', requireAuth, AnalyticsController.getCrossOutletSummary);

export default analyticsRouter;
