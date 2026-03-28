import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to validate the size of a Base64 encoded image in the request body.
 * @param field The field name in req.body containing the base64 string
 * @param maxSizeKB The maximum allowed size in KB (default: 300)
 */
export const validateBase64Image = (field: string, maxSizeKB: number = 300) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const base64String = req.body[field];

        if (!base64String) {
            return next();
        }

        // Base64 string format: "data:image/jpeg;base64,..."
        // We only care about the part after the comma
        const parts = base64String.split(',');
        const data = parts.length > 1 ? parts[1] : parts[0];

        // Approximate size calculation for Base64:
        // (Length of string * 3) / 4
        const sizeInBytes = (data.length * 3) / 4;
        const sizeInKB = sizeInBytes / 1024;

        if (sizeInKB > maxSizeKB) {
            console.warn(`[Validation] Blocked large image in field "${field}": ${sizeInKB.toFixed(1)}KB > ${maxSizeKB}KB`);
            return res.status(413).json({
                success: false,
                message: `Foto terlalu besar (${sizeInKB.toFixed(1)}KB). Maksimal yang diperbolehkan adalah ${maxSizeKB}KB.`
            });
        }

        next();
    };
};
