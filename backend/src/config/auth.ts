import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import * as schema from "../db/schema";
import 'dotenv/config';

export const auth = betterAuth({
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
        // Optional configuration for password reset
    },
    // Optional: Add OAuth providers like Google here in the future
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
