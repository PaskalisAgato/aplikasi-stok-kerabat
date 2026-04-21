import { v2 as cloudinary } from 'cloudinary';
import 'dotenv/config';

// Initialize Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Uploads an image to Cloudinary.
 * @param input Local file path OR Base64 string
 * @param folder Cloudinary folder name
 * @returns The secure URL of the uploaded image
 */
export async function uploadToCloudinary(input: string, folder: string = 'kerabat_pos'): Promise<string | null> {
    try {
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
             console.warn('[Cloudinary] Missing credentials! Returning original input.');
             return null;
        }

        const result = await cloudinary.uploader.upload(input, {
            folder,
            resource_type: 'auto',
            transformation: [
                { width: 1200, crop: 'limit', quality: 'auto', fetch_format: 'webp' }
            ]
        });

        console.log(`[Cloudinary] Successfully uploaded image to ${folder}: ${result.secure_url}`);
        return result.secure_url;
    } catch (error) {
        console.error('[Cloudinary] Upload failed:', error);
        return null;
    }
}

/**
 * Deletes an image from Cloudinary.
 * @param url Full secure URL of the image
 */
export async function deleteFromCloudinary(url: string): Promise<boolean> {
    try {
        if (!url || !url.includes('cloudinary.com')) return false;

        // URL format: https://res.cloudinary.com/[cloud_name]/image/upload/v[version]/[folder]/[public_id].[ext]
        // We need "[folder]/[public_id]"
        const parts = url.split('/');
        const lastPart = parts.pop() || ''; // [public_id].[ext]
        const folderPart = parts.pop() || ''; // [folder]
        const publicId = `${folderPart}/${lastPart.split('.')[0]}`;

        const result = await cloudinary.uploader.destroy(publicId);
        console.log(`[Cloudinary] Delete result for ${publicId}:`, result.result);
        return result.result === 'ok';
    } catch (error) {
        console.error('[Cloudinary] Delete failed:', error);
        return false;
    }
}

/**
 * Uploads a raw file (e.g. database backup) to Cloudinary.
 * @param filePath Local file path 
 * @param folder Cloudinary folder name
 * @returns The secure URL of the uploaded file
 */
export async function uploadRawToCloudinary(filePath: string, folder: string = 'kerabat_backups'): Promise<string | null> {
    try {
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
             console.warn('[Cloudinary] Missing credentials! Cannot upload raw file.');
             return null;
        }

        const result = await cloudinary.uploader.upload(filePath, {
            folder,
            resource_type: 'raw',
        });

        console.log(`[Cloudinary] Successfully uploaded raw file to ${folder}: ${result.secure_url}`);
        return result.secure_url;
    } catch (error) {
        console.error('[Cloudinary] Raw Upload failed:', error);
        return null;
    }
}
