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
exports.UserService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const db_1 = require("../config/db");
const schema_1 = require("../db/schema");
const schema = __importStar(require("../db/schema"));
const drizzle_orm_1 = require("drizzle-orm");
class UserService {
    static async getAllUsers() {
        return await db_1.db.select().from(schema_1.users).orderBy((0, drizzle_orm_1.desc)(schema_1.users.createdAt));
    }
    static async createUser(data, currentUserId) {
        const { name, email, role, pin } = data;
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
        await db_1.db.insert(schema.auditLogs).values({
            userId: currentUserId,
            action: `CREATE_USER: ${newUser.name} (${newUser.role})`,
            tableName: 'user',
            newData: JSON.stringify(newUser),
            createdAt: new Date()
        });
        return newUser;
    }
    static async updateUser(id, data, currentUserId) {
        const { name, email, role, pin } = data;
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
        if (updatedUser) {
            await db_1.db.insert(schema.auditLogs).values({
                userId: currentUserId,
                action: `UPDATE_USER: ${updatedUser.name}`,
                tableName: 'user',
                oldData: JSON.stringify(oldUser[0]),
                newData: JSON.stringify(updatedUser),
                createdAt: new Date()
            });
        }
        return updatedUser;
    }
    static async deleteUser(id, currentUserId) {
        const [deletedUser] = await db_1.db.delete(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, id))
            .returning();
        if (deletedUser) {
            await db_1.db.insert(schema.auditLogs).values({
                userId: currentUserId,
                action: `DELETE_USER: ${deletedUser.name}`,
                tableName: 'user',
                oldData: JSON.stringify(deletedUser),
                createdAt: new Date()
            });
        }
        return deletedUser;
    }
}
exports.UserService = UserService;
