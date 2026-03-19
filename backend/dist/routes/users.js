"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRouter = void 0;
const express_1 = require("express");
const crypto_1 = __importDefault(require("crypto"));
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const auth_1 = require("../middleware/auth");
exports.usersRouter = (0, express_1.Router)();
// GET all users (Admin only)
exports.usersRouter.get('/', auth_1.requireAdmin, async (req, res) => {
    try {
        const _users = await db_1.db.select().from(schema_1.users).orderBy((0, drizzle_orm_1.desc)(schema_1.users.createdAt));
        res.json(_users);
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});
// POST new user (Admin only)
exports.usersRouter.post('/', auth_1.requireAdmin, async (req, res) => {
    try {
        const { name, email, role, pin } = req.body;
        if (!name || !email || !role || !pin) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const [newUser] = await db_1.db.insert(schema_1.users).values({
            id: crypto_1.default.randomUUID(), // Use UUID for consistency
            name,
            email,
            emailVerified: true,
            role,
            pin,
            createdAt: new Date(),
            updatedAt: new Date()
        }).returning();
        res.status(201).json(newUser);
    }
    catch (error) {
        console.error('Error adding user:', error);
        res.status(500).json({ error: 'Failed to create user account' });
    }
});
// PUT update user (Admin only)
exports.usersRouter.put('/:id', auth_1.requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, role, pin } = req.body;
        const [updatedUser] = await db_1.db.update(schema_1.users)
            .set({
            name,
            email,
            role,
            pin,
            updatedAt: new Date()
        })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, id))
            .returning();
        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(updatedUser);
    }
    catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user account' });
    }
});
// DELETE user (Admin only)
exports.usersRouter.delete('/:id', auth_1.requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const [deletedUser] = await db_1.db.delete(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, id))
            .returning();
        if (!deletedUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'User deleted successfully', user: deletedUser });
    }
    catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user account' });
    }
});
