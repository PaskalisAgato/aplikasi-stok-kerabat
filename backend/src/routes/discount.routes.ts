import { Router, Request, Response } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { DiscountService } from '../services/discount.service.js';

const router = Router();

// GET /api/discounts?active=true
router.get('/', requireAuth, async (req: Request, res: Response) => {
    try {
        const activeOnly = req.query.active === 'true';
        const discounts = await DiscountService.getAllDiscounts(activeOnly);
        res.json({ success: true, data: discounts });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// GET /api/discounts/:id
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
    try {
        const d = await DiscountService.getDiscountById(parseInt(req.params.id as string));
        if (!d) return res.status(404).json({ success: false, message: 'Diskon tidak ditemukan' });
        res.json({ success: true, data: d });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// GET /api/discounts/:id/stats — analytics for a single promo
router.get('/:id/stats', requireAdmin, async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id as string);
        const stats = await DiscountService.getDiscountStats(id);
        res.json({ success: true, data: stats });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// POST /api/discounts (admin only)
router.post('/', requireAdmin, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const discount = await DiscountService.createDiscount(req.body, userId);
        res.status(201).json({ success: true, data: discount });
    } catch (e: any) {
        res.status(400).json({ success: false, message: e.message });
    }
});

// PUT /api/discounts/:id (admin only)
router.put('/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const discount = await DiscountService.updateDiscount(parseInt(req.params.id as string), req.body, userId);
        res.json({ success: true, data: discount });
    } catch (e: any) {
        res.status(400).json({ success: false, message: e.message });
    }
});

// DELETE /api/discounts/:id (admin only)
router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
        await DiscountService.deleteDiscount(parseInt(req.params.id as string));
        res.json({ success: true, message: 'Diskon berhasil dihapus' });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// POST /api/discounts/evaluate — evaluate applicable discounts for cart (used by POS)
// Body: { items: [...], memberLevel?: string, memberId?: number, voucherCode?: string }
router.post('/evaluate', requireAuth, async (req: Request, res: Response) => {
    try {
        const { items, memberLevel, memberId, voucherCode, orderSource } = req.body;
        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ success: false, message: 'items array required' });
        }
        const applicable = await DiscountService.evaluateDiscounts(items, memberLevel, memberId, voucherCode, orderSource);
        res.json({ success: true, data: applicable });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
});

export { router as discountRoutes };
