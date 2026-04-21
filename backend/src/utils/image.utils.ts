import fs from 'fs/promises';
import path from 'path';

/**
 * Resizes and compresses an image file on disk.
 * @param inputPath Path to the input image file
 * @param maxWidth Maximum width in pixels
 * @param quality JPEG/WebP quality (0-100)
 * @returns The path to the resized image
 */
export async function resizeImage(inputPath: string, maxWidth: number = 1200, quality: number = 70): Promise<string> {
    const ext = path.extname(inputPath).toLowerCase();
    const dir = path.dirname(inputPath);
    const name = path.basename(inputPath, ext);
    const outputPath = path.join(dir, `${name}_resized${ext}`);

    try {
        // Dynamic import to prevent crash if sharp is not compatible
        const { default: sharp } = await import('sharp');
        
        let pipeline = sharp(inputPath).resize({ width: maxWidth, withoutEnlargement: true });

        if (ext === '.jpg' || ext === '.jpeg') {
            pipeline = pipeline.jpeg({ quality, mozjpeg: true });
        } else if (ext === '.png') {
            pipeline = pipeline.png({ quality: Math.min(quality, 80), compressionLevel: 9 });
        } else if (ext === '.webp') {
            pipeline = pipeline.webp({ quality });
        }

        await pipeline.toFile(outputPath);
        
        // Replace original with resized
        await fs.unlink(inputPath);
        await fs.rename(outputPath, inputPath);

        return inputPath;
    } catch (error) {
        console.warn('[ImageUtils] Resize failed or sharp not compatible:', error);
        // If resize fails, we just keep the original as a backup
        return inputPath;
    }
}

/**
 * Normalizes a base64 image string by resizing it.
 * @param base64 Base64 encoded image
 * @returns Resized base64 string
 */
export async function resizeBase64(base64: string, maxWidth: number = 1200, quality: number = 70): Promise<string> {
    if (!base64.startsWith('data:image')) return base64;

    try {
        // Dynamic import to prevent crash if sharp is not compatible
        const { default: sharp } = await import('sharp');

        const parts = base64.split(',');
        if (parts.length < 2) return base64;

        const header = parts[0];
        const buffer = Buffer.from(parts[1], 'base64');

        const resizedBuffer = await sharp(buffer)
            .resize({ width: maxWidth, withoutEnlargement: true })
            .jpeg({ quality, mozjpeg: true }) // Normalize to JPEG for consensus
            .toBuffer();

        return `data:image/jpeg;base64,${resizedBuffer.toString('base64')}`;
    } catch (error) {
        console.warn('[ImageUtils] Base64 resize failed or sharp not compatible:', error);
        return base64;
    }
}
