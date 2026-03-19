import { auth } from './src/config/auth';

async function captureCookies() {
    const testEmail = 'capture-' + Date.now() + '@example.com';
    const password = 'Password123!';

    try {
        console.log("Signing up...");
        await auth.api.signUpEmail({
            body: { email: testEmail, password, name: 'Capturer' }
        });

        console.log("Signing in...");
        const response = await auth.api.signInEmail({
            body: { email: testEmail, password },
            asResponse: true // PENTING: Minta response object asli
        });

        console.log("Headers:");
        const headers: any = {};
        response.headers.forEach((v, k) => {
            headers[k] = v;
        });
        console.log(JSON.stringify(headers, null, 2));

        const setCookie = response.headers.get('set-cookie');
        console.log("\nSET-COOKIE VALUE:");
        console.log(setCookie);

    } catch (e) {
        console.error("Capture failed:", e);
    }
    process.exit(0);
}

captureCookies();
