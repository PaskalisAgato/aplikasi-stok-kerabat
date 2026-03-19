import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(`[ERROR] ${err.message}`);
    if (err.stack) console.error(err.stack);
    
    res.status(err.status || 500).json({
        error: err.message || "Internal Server Error",
        detail: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};
