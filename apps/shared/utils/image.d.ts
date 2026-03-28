/**
 * apps/shared/utils/image.ts
 * Unified image compression utility with strict size enforcement.
 */
export interface CompressionOptions {
    maxWidth?: number;
    maxHeight?: number;
    initialQuality?: number;
    maxSizeKB?: number;
    minQuality?: number;
}
/**
 * Compresses an image iteratively until it's below the maxSizeKB.
 */
export declare function compressImage(source: File | Blob | string, options?: CompressionOptions): Promise<Blob>;
/**
 * Validates if a base64 string is within size limits
 * Returns true if valid, false if too large.
 */
export declare function isBase64SizeValid(base64: string, maxSizeKB?: number): boolean;
