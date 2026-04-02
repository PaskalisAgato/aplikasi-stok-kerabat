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
export function getOptimizedImageUrl(
    path: string, 
    options: { width?: number; height?: number; resize?: 'cover' | 'contain' | 'fill' } = {}
): string {
    if (!path) return '';
    
    // 1. Base64 data URLs — return as-is
    if (path.startsWith('data:')) return path;

    // 2. Cloudinary URLs — apply transformations via URL manipulation
    if (path.includes('cloudinary.com')) {
        const { width, height } = options;
        if (width || height) {
            // Cloudinary URL format: .../upload/v123/folder/image.jpg
            // Insert transformation after /upload/
            const parts: string[] = [];
            if (width) parts.push(`w_${width}`);
            if (height) parts.push(`h_${height}`);
            parts.push('c_limit');
            parts.push('q_auto');
            parts.push('f_auto');
            const transformation = parts.join(',');
            
            return path.replace('/upload/', `/upload/${transformation}/`);
        }
        return path;
    }

    // 3. Any other full URL — return as-is
    if (path.startsWith('http')) return path;

    // 4. Legacy Supabase relative paths (e.g. "products/image.jpg") — best effort
    // These old paths won't resolve anymore, but return them for debugging
    return path;
}
