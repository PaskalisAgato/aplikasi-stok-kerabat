/**
 * apps/shared/supabase.ts
 *
 * Cloudinary-native image URL utility.
 * All Supabase dependencies have been removed.
 * Image uploads are handled by the backend middleware (validateBase64Image).
 */
/**
 * Construct optimized image URL.
 * - Cloudinary URLs: apply transformations (width, height, quality)
 * - Full HTTP URLs (non-Cloudinary): return as-is
 * - Base64 strings: return as-is
 * - Empty/null: return empty string
 */
export declare function getOptimizedImageUrl(path: string, options?: {
    width?: number;
    height?: number;
    resize?: 'cover' | 'contain' | 'fill';
}): string;
