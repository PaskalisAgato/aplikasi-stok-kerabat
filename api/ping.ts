import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    success: true,
    message: "DIAGNOSTIC PING SUCCESS",
    time: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
}
