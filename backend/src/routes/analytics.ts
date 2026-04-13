import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller.js';
import { requireAuth } from '../middleware/auth.js';

export const analyticsRouter = Router();

// Owner Dashboard Endpoint (Owner/Admin Only)
analyticsRouter.get('/dashboard', requireAuth, AnalyticsController.getTodayDashboard);
