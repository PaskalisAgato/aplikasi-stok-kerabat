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
exports.auditRouter = void 0;
const express_1 = require("express");
const db_1 = require("../db");
const schema = __importStar(require("../db/schema"));
const drizzle_orm_1 = require("drizzle-orm");
const auth_1 = require("../middleware/auth");
exports.auditRouter = (0, express_1.Router)();
// GET all audit logs (Admin only)
exports.auditRouter.get('/', auth_1.requireAdmin, async (req, res) => {
    try {
        const logs = await db_1.db.select({
            id: schema.auditLogs.id,
            userId: schema.auditLogs.userId,
            userName: schema.users.name,
            action: schema.auditLogs.action,
            tableName: schema.auditLogs.tableName,
            oldData: schema.auditLogs.oldData,
            newData: schema.auditLogs.newData,
            createdAt: schema.auditLogs.createdAt,
        })
            .from(schema.auditLogs)
            .leftJoin(schema.users, (0, drizzle_orm_1.eq)(schema.auditLogs.userId, schema.users.id))
            .orderBy((0, drizzle_orm_1.desc)(schema.auditLogs.createdAt))
            .limit(100);
        res.json(logs);
    }
    catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ error: 'Failed to fetch activity history' });
    }
});
