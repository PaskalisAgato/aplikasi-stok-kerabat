import { auth } from './src/config/auth';
import { db } from './src/db';
import { users, sessions } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function diagnoseRealSession() {
    const testEmail = 'test-' + Date.now() + '@example.com';
    const testPassword = 'Password123!';
    
    try {
        console.log("Creating test user...");
        await auth.api.signUpEmail({
            body: {
                email: testEmail,
                password: testPassword,
                name: 'Test User'
            }
        });

        console.log("Signing in...");
        const result = await auth.api.signInEmail({
            body: {
                email: testEmail,
                password: testPassword
            }
        });

        console.log("Sign in result:", JSON.stringify(result, null, 2));

        // Cek apa yang ada di DB
        const user = await db.query.users.findFirst({
            where: eq(users.email, testEmail)
        });

        if (user) {
            const userSessions = await db.select().from(sessions).where(eq(sessions.userId, user.id));
            console.log("\nSessions in DB for this user:");
            console.log(JSON.stringify(userSessions, null, 2));
        }

    } catch (e) {
        console.error("Diagnosis failed:", e);
    } finally {
        // Cleanup if needed
        process.exit(0);
    }
}

diagnoseRealSession();
