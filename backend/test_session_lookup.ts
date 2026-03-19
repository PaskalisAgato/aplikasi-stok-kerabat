import { auth } from './src/config/auth';
import { db } from './src/db';
import { sessions } from './src/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

async function testSessionLookup() {
    const sessionId = 'test_' + Date.now();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const userId = 'admin_1773541986611'; 

    console.log(`\n--- PHASE 1: PLAIN TOKEN ---`);
    await db.insert(sessions).values({
        id: sessionId,
        token: sessionId,
        userId: userId,
        expiresAt: expiresAt,
        createdAt: now,
        updatedAt: now
    });

    const headers = new Headers();
    headers.set('cookie', `better-auth.session_token=${sessionId}`);
    const sessionPlain = await auth.api.getSession({ headers });
    console.log("Plain Lookup:", sessionPlain ? "✅ FOUND" : "❌ NOT FOUND");

    console.log(`\n--- PHASE 2: HEX HASHED ---`);
    const hashedHex = crypto.createHash('sha256').update(sessionId).digest('hex');
    await db.update(sessions).set({ token: hashedHex }).where(eq(sessions.id, sessionId));
    const sessionHex = await auth.api.getSession({ headers });
    console.log("Hex Lookup:", sessionHex ? "✅ FOUND" : "❌ NOT FOUND");

    console.log(`\n--- PHASE 3: BASE64 HASHED ---`);
    const hashedB64 = crypto.createHash('sha256').update(sessionId).digest('base64');
    await db.update(sessions).set({ token: hashedB64 }).where(eq(sessions.id, sessionId));
    const sessionB64 = await auth.api.getSession({ headers });
    console.log("Base64 Lookup:", sessionB64 ? "✅ FOUND" : "❌ NOT FOUND");

    console.log(`\n--- PHASE 4: BASE64URL HASHED ---`);
    const hashedB64Url = hashedB64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    await db.update(sessions).set({ token: hashedB64Url }).where(eq(sessions.id, sessionId));
    const sessionB64Url = await auth.api.getSession({ headers });
    console.log("Base64Url Lookup:", sessionB64Url ? "✅ FOUND" : "❌ NOT FOUND");

    await db.delete(sessions).where(eq(sessions.id, sessionId));
    process.exit(0);
}

testSessionLookup();
