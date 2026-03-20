import { betterAuth } from "better-auth";

try {
    const auth = betterAuth({
        database: { 
            get: () => {}, 
            set: () => {},
            create: () => {},
            update: () => {},
            delete: () => {},
            findOne: () => {},
            findMany: () => {}
        } as any,
        secret: "test",
        baseURL: "http://localhost:5000"
    });
    console.log('Auth keys:', Object.keys(auth));
    if (auth.api) {
        console.log('API keys:', Object.keys(auth.api));
    }
} catch (e) {
    console.log('Init error (expected):', e);
}
process.exit(0);
