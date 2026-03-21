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
exports.auth = void 0;
const better_auth_1 = require("better-auth");
const plugins_1 = require("better-auth/plugins");
const drizzle_1 = require("better-auth/adapters/drizzle");
const db_1 = require("./db");
const schema = __importStar(require("../db/schema"));
require("dotenv/config");
console.log('--- Auth Module: Initializing betterAuth ---');
let auth;
try {
    exports.auth = auth = (0, better_auth_1.betterAuth)({
        database: (0, drizzle_1.drizzleAdapter)(db_1.db, {
            provider: "pg", // PostgreSQL
            schema: {
                user: schema.users,
                session: schema.sessions,
                account: schema.accounts,
                verification: schema.verifications
            }
        }),
        emailAndPassword: {
            enabled: true,
        },
        secret: process.env.BETTER_AUTH_SECRET,
        baseURL: process.env.BETTER_AUTH_URL ?
            (process.env.BETTER_AUTH_URL.endsWith('/api/auth') ? process.env.BETTER_AUTH_URL : `${process.env.BETTER_AUTH_URL.replace(/\/$/, '')}/api/auth`) :
            "http://localhost:5000/api/auth",
        trustedOrigins: (process.env.FRONTEND_URL || '').split(',').map(o => o.trim()).concat([
            "http://localhost:5173",
            "https://paskalisagato.github.io"
        ]),
        advanced: {
            crossSubDomainCookies: {
                enabled: true
            }
        },
        plugins: [
            (0, plugins_1.admin)()
        ]
    });
    console.log('--- Auth Module: Successfully initialized ---');
}
catch (error) {
    console.error('!!! FATAL AUTH INIT ERROR:', error.message);
    throw error;
}
