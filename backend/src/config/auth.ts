import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "../db/schema";
import 'dotenv/config';

console.log('--- Auth Module: Initializing betterAuth ---');
let auth: any;
try {
    auth = betterAuth({
        database: drizzleAdapter(db, {
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
        baseURL: process.env.BETTER_AUTH_URL || "http://localhost:5000",
        trustedOrigins: [
            process.env.FRONTEND_URL || "http://localhost:5173",
            "https://paskalisagato.github.io"
        ],
        advanced: {
            crossSubDomainCookies: {
                enabled: true
            }
        }
    });
    console.log('--- Auth Module: Successfully initialized ---');
} catch (error: any) {
    console.error('!!! FATAL AUTH INIT ERROR:', error.message);
    throw error;
}

export { auth };
