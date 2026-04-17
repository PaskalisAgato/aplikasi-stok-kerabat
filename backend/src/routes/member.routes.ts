import { Router, Request, Response } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { MemberService } from '../services/member.service.js';

const router = Router();

// GET /api/members?search=...
router.get('/', requireAuth, async (req: Request, res: Response) => {
    try {
        const search = (req.query.search as string) || '';
        const members = await MemberService.getAllMembers(search);
        res.json({ success: true, data: members });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// GET /api/members/:id
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
    try {
        const member = await MemberService.getMemberById(parseInt(req.params.id as string));
        if (!member) return res.status(404).json({ success: false, message: 'Member tidak ditemukan' });
        res.json({ success: true, data: member });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// GET /api/members/phone/:phone
router.get('/phone/:phone', requireAuth, async (req: Request, res: Response) => {
    try {
        const member = await MemberService.getMemberByPhone(req.params.phone as string);
        if (!member) return res.status(404).json({ success: false, message: 'Member tidak ditemukan' });
        res.json({ success: true, data: member });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// POST /api/members
router.post('/', requireAuth, async (req: Request, res: Response) => {
    try {
        const { name, phone, email } = req.body;
        if (!name || !phone) return res.status(400).json({ success: false, message: 'Nama dan No HP wajib diisi' });
        const member = await MemberService.createMember({ name, phone, email });
        res.status(201).json({ success: true, data: member });
    } catch (e: any) {
        res.status(400).json({ success: false, message: e.message });
    }
});

// PUT /api/members/:id
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
    try {
        const member = await MemberService.updateMember(parseInt(req.params.id as string), req.body);
        res.json({ success: true, data: member });
    } catch (e: any) {
        res.status(400).json({ success: false, message: e.message });
    }
});

// POST /api/members/:id/adjust-points
router.post('/:id/adjust-points', requireAdmin, async (req: Request, res: Response) => {
    try {
        const { delta, reason } = req.body;
        if (delta === undefined) return res.status(400).json({ success: false, message: 'Delta poin wajib diisi' });
        const result = await MemberService.adjustPoints(parseInt(req.params.id as string), parseInt(delta), reason);
        res.json({ success: true, data: result });
    } catch (e: any) {
        res.status(400).json({ success: false, message: e.message });
    }
});

// DELETE /api/members/:id
router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
        await MemberService.deleteMember(parseInt(req.params.id as string));
        res.json({ success: true, message: 'Member berhasil dihapus' });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
});

export { router as memberRoutes };
