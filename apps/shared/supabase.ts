import { createClient } from '@supabase/supabase-js';
import { compressImage } from './utils/image';

// Load environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// ARCHITECT SAFEGUARD: Prevent top-level crash if env vars are missing
let supabaseInstance: any = null;

if (supabaseUrl && supabaseAnonKey) {
    try {
        supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    } catch (e) {
        console.error('[Supabase] CRITICAL: Failed to initialize client:', e);
    }
} else {
    console.error('%c[Supabase] CRITICAL CONFIG ERROR: VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY tidak ditemukan!', 'color: white; background: red; font-size: 16px; font-weight: bold; padding: 10px;');
    console.warn('[Supabase] Hubungkan aplikasi ke Supabase dengan menambahkan environment variables di Dashboard Vercel/Render.');
}

// Export a safe proxy or the instance
export const supabase = supabaseInstance;
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

/**
 * Uploads a file (File, Blob, or base64 string) to a Supabase bucket.
 * Returns the path/URL of the uploaded file.
 * 
 * NOTE: We are migrating to Cloudinary. This function now bypasses Supabase
 * and returns the Base64 string directly so the backend middleware can handle it.
 */
export async function uploadFile(
    bucket: string,
    path: string,
    file: File | Blob | string
): Promise<string> {
    // If it's already a base64 string, just return it.
    // The backend middleware validateBase64Image will detect this and upload to Cloudinary.
    if (typeof file === 'string' && file.startsWith('data:image')) {
        console.log(`[StorageRedirect] Bypassing Supabase for bucket "${bucket}". Returning Base64 for backend processing.`);
        return file;
    }

    // For non-base64 files, we attempt a minimal bypass or throw a helpful error
    // since the user wants to get away from Supabase entirely.
    if (!supabase) {
        throw new Error('Supabase not configured and direct upload failed.');
    }

    console.warn(`[StorageLegacy] Attempting legacy upload to Supabase bucket "${bucket}". This may fail due to quota limits.`);
    
    let uploadData: File | Blob | ArrayBuffer = file as any;
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, uploadData, {
            upsert: true,
            contentType: (file as any).type || 'image/jpeg'
        });

    if (error) {
        console.error(`[Supabase] Upload failed for bucket "${bucket}":`, error);
        // If it's a base64 that wasn't caught above, return it anyway as a last resort
        if (typeof file === 'string') return file;
        throw new Error(`Upload storage gagal: ${error.message} (Bucket: ${bucket})`);
    }

    return `${bucket}/${data.path}`;
}

/**
 * Construct optimized public URL. 
 * Prioritizes absolute URLs (Cloudinary) and fallbacks to Supabase public URLs.
 */
export function getOptimizedImageUrl(path: string, _options: { width?: number; height?: number; resize?: 'cover' | 'contain' | 'fill' } = {}) {
    if (!path) return '';
    
    // 1. If it's already a full URL or Base64, return as-is
    if (path.startsWith('http') || path.startsWith('data:')) return path;

    // 2. Handle Supabase paths (e.g. "products/image.jpg")
    const projectUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!projectUrl) return path;

    // Use standard object/public instead of render/image to avoid Pro Plan requirements
    return `${projectUrl}/storage/v1/object/public/${path}`;
}

export function getPublicUrl(bucket: string, path: string) {
    if (!supabase) return '';
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
}
