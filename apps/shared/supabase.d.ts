/**
 * Construct optimized image URL.
 * Supports Cloudinary transformations, full URLs, and Base64 data URLs.
 */
export declare function getOptimizedImageUrl(path: string, options?: {
    width?: number;
    height?: number;
    resize?: 'cover' | 'contain' | 'fill';
}): string;
