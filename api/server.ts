import type { VercelRequest, VercelResponse } from '@vercel/node';

let cachedApp: any = null;
let startupError: any = null;

try {
  // Pre-load the backend app synchronously if possible
  // Using CommonJS require could be tricky in NodeNext, so we can try to use a dynamic import workaround or just keep it simple.
} catch(e) {}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (startupError) throw startupError;
    if (!cachedApp) {
      const backend = await import('../backend/src/app');
      cachedApp = backend.default || backend;
    }
    return cachedApp(req, res);
  } catch (error: any) {
    console.error("Vercel Startup Error:", error);
    res.status(500).json({
      success: false,
      message: "Vercel API Startup Error",
      error: error.message,
      stack: error.stack
    });
  }
}

