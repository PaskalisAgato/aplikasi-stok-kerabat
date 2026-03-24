import { Request, Response, NextFunction } from 'express';
import { db } from '../db/index.js';
import { systemLogs } from '../db/schema.js';

// Phase 3: Global System Health State
let recentRequests: boolean[] = []; // true = OK, false = Error
let safeModeUntil = 0;
const SAFE_MODE_WINDOW = 50;
const ERROR_SPIKE_THRESHOLD = 0.2; // 20%
const SAFE_MODE_DURATION = 60_000;

/**
 * Enterprise Monitoring Middleware
 * Tracks: Response Time, Payload Size, Errors, and Usage
 */
export const monitorMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    // 1. Payload Size Guardrail (INBOUND)
    const contentLength = parseInt(req.get('content-length') || '0');
    if (contentLength > 1024 * 1024) { // 1MB
        console.warn(`[Enterprise Guardrail] Rejected large payload (${contentLength} bytes) from ${req.ip} for ${req.path}`);
        return res.status(413).json({
            success: false,
            message: "Ukuran data terlalu besar (maksimal 1MB). Mohon kurangi ukuran data/gambar."
        });
    }

    // 2. Safe Mode Header (Phase 3)
    const isSafeMode = Date.now() < safeModeUntil;
    if (isSafeMode) {
        res.setHeader('X-System-Safe-Mode', 'active');
    }

    // Capture original end/send to calculate outbound size
    const originalSend = res.send;
    let outboundSize = 0;

    res.send = function (body: any) {
        if (body) {
            if (typeof body === 'string') outboundSize = Buffer.byteLength(body);
            else if (Buffer.isBuffer(body)) outboundSize = body.length;
            else outboundSize = Buffer.byteLength(JSON.stringify(body));
        }
        return originalSend.call(this, body);
    };

    // Process request
    res.on('finish', async () => {
        const duration = Date.now() - start;
        const statusCode = res.statusCode;
        const isError = statusCode >= 400;

        // Update Global Health (Phase 3)
        recentRequests.push(!isError);
        if (recentRequests.length > SAFE_MODE_WINDOW) recentRequests.shift();

        if (recentRequests.length >= 20) { // Need at least 20 samples to spike
            const errorCount = recentRequests.filter(ok => !ok).length;
            const errorRate = errorCount / recentRequests.length;

            if (errorRate > ERROR_SPIKE_THRESHOLD && !isSafeMode) {
                console.error(`[ALERT] ERROR SPIKE DETECTED (${(errorRate*100).toFixed(0)}%). Activating Safe Mode.`);
                safeModeUntil = Date.now() + SAFE_MODE_DURATION;
            }
        }

        // Log if it's a slow request (>1s), a large response (>200KB), or an error (>=400)
        // Or just log a sample of healthy requests (e.g. 10%) to keep DB size manageable
        const isSignificant = duration > 1000 || outboundSize > 200 * 1024 || isError;

        // Proactive alerts for performance bottlenecks
        if (outboundSize > 200 * 1024) {
            console.warn(`[Bandwidth Alert] Large payload (${(outboundSize/1024).toFixed(2)} KB) for ${req.method} ${req.path}`);
        }
        if (duration > 1000) {
            console.warn(`[Latency Alert] Slow request (${duration}ms) for ${req.method} ${req.path}`);
        }

        const shouldSample = Math.random() < 0.1;

        if (isSignificant || shouldSample) {
            try {
                const user: any = (req as any).user; // Better-auth user
                await db.insert(systemLogs).values({
                    method: req.method,
                    path: req.path,
                    responseTime: duration,
                    payloadSize: outboundSize,
                    statusCode: statusCode,
                    userId: user?.id || null,
                    errorDetails: isError ? `Status ${statusCode} - Significant: ${isSignificant}` : null,
                    level: isError || duration > 3000 ? 'ERROR' : (isSignificant ? 'WARNING' : 'INFO')
                } as any);
            } catch (err) {
                console.error('[Monitoring] Failed to write log to DB:', err);
            }
        }
    });

    next();
};

/**
 * Enterprise Error Handler
 * Standardizes user-facing error messages while logging internals
 */
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.status || err.statusCode || 500;
    
    // Internal log
    console.error(`[System Error] ${req.method} ${req.path}:`, err);

    // User facing response
    res.status(statusCode).json({
        success: false,
        message: statusCode === 500 ? "Terjadi kesalahan internal pada server. Mohon coba beberapa saat lagi." : (err.message || "Gagal memproses permintaan."),
        hint: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};
