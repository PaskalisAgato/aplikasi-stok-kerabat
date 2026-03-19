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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRouter = void 0;
const express_1 = require("express");
const crypto_1 = __importDefault(require("crypto"));
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const schema = __importStar(require("../db/schema"));
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
        const currentUser = req.user;
        if (!name || !email || !role || !pin) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const [newUser] = await db_1.db.insert(schema_1.users).values({
            id: crypto_1.default.randomUUID(),
            name,
            email,
            emailVerified: true,
            role,
            pin,
            createdAt: new Date(),
            updatedAt: new Date()
        }).returning();
        // Log to Audit
        await db_1.db.insert(schema.auditLogs).values({
            userId: currentUser.id,
            action: `CREATE_USER: ${newUser.name} (${newUser.role})`,
            tableName: 'user',
            newData: JSON.stringify(newUser),
            createdAt: new Date()
        });
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
        const currentUser = req.user;
        const oldUser = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, id)).limit(1);
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
        // Log to Audit
        await db_1.db.insert(schema.auditLogs).values({
            userId: currentUser.id,
            action: `UPDATE_USER: ${updatedUser.name}`,
            tableName: 'user',
            oldData: JSON.stringify(oldUser[0]),
            newData: JSON.stringify(updatedUser),
            createdAt: new Date()
        });
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
        const currentUser = req.user;
        const [deletedUser] = await db_1.db.delete(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, id))
            .returning();
        if (!deletedUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Log to Audit
        await db_1.db.insert(schema.auditLogs).values({
            userId: currentUser.id,
            action: `DELETE_USER: ${deletedUser.name}`,
            tableName: 'user',
            oldData: JSON.stringify(deletedUser),
            createdAt: new Date()
        });
        res.json({ message: 'User deleted successfully', user: deletedUser });
    }
    catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user account' });
    }
});
