import { Request, Response, NextFunction } from 'express';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { resizeBase64 } from '../utils/image.utils.js';

/**
 * Middleware to auto-compress and validate the size of a Base64 encoded image in the request body.
 * If valid, it automatically uploads the image to Cloudinary and replaces the field in req.body with the URL.
 * @param field The field name in req.body containing the base64 string
 * @param maxSizeKB The maximum allowed size in KB (default: 300)
 */
export const validateBase64Image = (field: string, maxSizeKB: number = 300) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        let base64String = req.body[field];

        if (!base64String) {
            return next();
        }

        // If it's already a URL, bypass validation and upload
        if (typeof base64String === 'string' && !base64String.startsWith('data:image')) {
            return next();
        }

        // 1. Size Validation & Auto Compression
        let parts = base64String.split(',');
        let data = parts.length > 1 ? parts[1] : parts[0];
        let sizeInBytes = (data.length * 3) / 4;
        let sizeInKB = sizeInBytes / 1024;

        if (sizeInKB > maxSizeKB) {
            console.warn(`[Validation] Auto-compressing large image in field "${field}": ${sizeInKB.toFixed(1)}KB`);
            base64String = await resizeBase64(base64String, 1000, 60); // Compress strictly
            
            parts = base64String.split(',');
            data = parts.length > 1 ? parts[1] : parts[0];
            sizeInBytes = (data.length * 3) / 4;
            sizeInKB = sizeInBytes / 1024;

            if (sizeInKB > maxSizeKB) {
                return res.status(413).json({
                    success: false,
                    message: `Foto terlalu besar (${sizeInKB.toFixed(1)}KB) dan kompresi gagal memenuhi batas ${maxSizeKB}KB.`
                });
            }
        }

        // 2. Automatic Cloudinary Upload
        try {
            const folderMap: Record<string, string> = {
                receiptUrl: 'expenses',
                imageUrl: 'products',
                photoProof: 'todos',
                photo: 'attendance',
            };
            const cloudinaryUrl = await uploadToCloudinary(base64String, folderMap[field] || 'general');
            if (cloudinaryUrl) {
                console.log(`[Cloudinary] Automatic upload successful for ${field}: ${cloudinaryUrl}`);
                req.body[field] = cloudinaryUrl;
            } else {
                 console.warn(`[Cloudinary] Fallback: Upload failed for ${field}, keeping original Base64/path.`);
            }
        } catch (error: any) {
            console.error(`[Cloudinary] Middleware error for ${field}:`, error.message);
        }

        next();
    };
};
