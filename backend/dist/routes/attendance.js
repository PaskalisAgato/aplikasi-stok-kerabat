"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.attendanceRouter = void 0;
const express_1 = require("express");
const db_1 = require("../db");
const schema = __importStar(require("../db/schema"));
const drizzle_orm_1 = require("drizzle-orm");
const auth_1 = require("../middleware/auth");
exports.attendanceRouter = (0, express_1.Router)();
// GET current user's attendance status
exports.attendanceRouter.get('/status', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        // Find latest active clock-in (where clockOut is null)
        const activeShift = await db_1.db.select()
            .from(schema.attendance)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.attendance.userId, userId), (0, drizzle_orm_1.isNull)(schema.attendance.clockOut)))
            .limit(1);
        res.json({
            isClockedIn: activeShift.length > 0,
            activeShift: activeShift.length > 0 ? activeShift[0] : null
        });
    }
    catch (error) {
        console.error('Error fetching attendance status:', error);
        res.status(500).json({ error: 'Failed to fetch status' });
    }
});
// POST Clock-in
exports.attendanceRouter.post('/clock-in', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { notes } = req.body;
        // Check if already clocked in
        const existing = await db_1.db.select()
            .from(schema.attendance)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.attendance.userId, userId), (0, drizzle_orm_1.isNull)(schema.attendance.clockOut)))
            .limit(1);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Sudah absen masuk' });
        }
        const [newEntry] = await db_1.db.insert(schema.attendance).values({
            userId,
            clockIn: new Date(),
            notes: notes || null,
            status: 'ON-TIME' // Mock simple status logic
        }).returning();
        res.status(201).json(newEntry);
    }
    catch (error) {
        console.error('Error in clock-in:', error);
        res.status(500).json({ error: 'Gagal absen masuk' });
    }
});
// POST Clock-out
exports.attendanceRouter.post('/clock-out', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const activeShift = await db_1.db.select()
            .from(schema.attendance)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.attendance.userId, userId), (0, drizzle_orm_1.isNull)(schema.attendance.clockOut)))
            .limit(1);
        if (activeShift.length === 0) {
            return res.status(400).json({ error: 'Tidak ada sesei absen masuk yang aktif' });
        }
        const [updated] = await db_1.db.update(schema.attendance)
            .set({ clockOut: new Date() })
            .where((0, drizzle_orm_1.eq)(schema.attendance.id, activeShift[0].id))
            .returning();
        res.json(updated);
    }
    catch (error) {
        console.error('Error in clock-out:', error);
        res.status(500).json({ error: 'Gagal absen keluar' });
    }
});
// GET attendance history (Admin could see all, Employee seeing own)
exports.attendanceRouter.get('/history', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const history = await db_1.db.select()
            .from(schema.attendance)
            .where((0, drizzle_orm_1.eq)(schema.attendance.userId, userId))
            .orderBy((0, drizzle_orm_1.desc)(schema.attendance.clockIn))
            .limit(50);
        res.json(history);
    }
    catch (error) {
        console.error('Error fetching attendance history:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});
