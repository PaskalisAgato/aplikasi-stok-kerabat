import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";

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
        baseURL: "http://localhost:5000",
        plugins: [ admin() ]
    });
    console.log('Auth keys:', Object.keys(auth));
    if (auth.$context && (auth.$context as any).internalAdapter) {
        const adapter = (auth.$context as any).internalAdapter;
        console.log('InternalAdapter keys:', Object.keys(adapter));
        if (adapter.createSession) {
            console.log('internalAdapter.createSession IS A FUNCTION');
        }
    }
} catch (e) {
    console.log('Init error:', e);
}
process.exit(0);
