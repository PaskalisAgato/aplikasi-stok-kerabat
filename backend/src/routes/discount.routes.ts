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

// POST /api/discounts (admin only)
router.post('/', requireAdmin, async (req: Request, res: Response) => {
    try {
        const discount = await DiscountService.createDiscount(req.body);
        res.status(201).json({ success: true, data: discount });
    } catch (e: any) {
        res.status(400).json({ success: false, message: e.message });
    }
});

// PUT /api/discounts/:id (admin only)
router.put('/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
        const discount = await DiscountService.updateDiscount(parseInt(req.params.id as string), req.body);
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
router.post('/evaluate', requireAuth, async (req: Request, res: Response) => {
    try {
        const { items, memberLevel } = req.body;
        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ success: false, message: 'items array required' });
        }
        const applicable = await DiscountService.evaluateDiscounts(items, memberLevel);
        res.json({ success: true, data: applicable });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
});

export { router as discountRoutes };
