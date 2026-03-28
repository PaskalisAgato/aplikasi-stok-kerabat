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
 * Returns the path of the uploaded file.
 */
export async function uploadFile(
    bucket: string,
    path: string,
    file: File | Blob | string
): Promise<string> {
    let uploadData: File | Blob | ArrayBuffer = file as any;

    // If it's a base64 string (common in this app), convert to Blob
    if (typeof file === 'string' && file.startsWith('data:')) {
        const res = await fetch(file);
        uploadData = await res.blob();
    }

    // BANDWIDTH OPTIMIZATION: Auto-compress if it's an image
    if (uploadData instanceof Blob && uploadData.type.startsWith('image/')) {
        try {
            uploadData = await compressImage(uploadData, { maxWidth: 1200, maxHeight: 1200, quality: 0.7 });
        } catch (e) {
            console.warn('[Supabase] Compression failed, uploading original:', e);
        }
    }

    if (!supabase) {
        throw new Error('Supabase not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to environment variables.');
    }

    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, uploadData, {
            upsert: true,
            contentType: (file as any).type || 'image/jpeg'
        });

    if (error) {
        console.error(`[Supabase] Upload failed for bucket "${bucket}":`, error);
        throw new Error(`Upload storage gagal: ${error.message} (Bucket: ${bucket})`);
    }

    return data.path;
}

/**
 * Construct optimized public URL with Supabase Image Transformations
 */
export function getOptimizedImageUrl(path: string, options: { width?: number; height?: number; resize?: 'cover' | 'contain' | 'fill' } = {}) {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:')) return path;

    const projectUrl = import.meta.env.VITE_SUPABASE_URL; // e.g. https://lvfqfynqzgxjbkotlccp.supabase.co
    if (!projectUrl) {
        console.warn('[Supabase] getOptimizedImageUrl: VITE_SUPABASE_URL missing, returning raw path.');
        return path;
    }
    const { width = 300, height = 300, resize = 'contain' } = options;
    
    // Format: https://project-id.supabase.co/storage/v1/render/image/public/bucket/path?width=300&height=300&resize=contain
    return `${projectUrl}/storage/v1/render/image/public/${path}?width=${width}&height=${height}&resize=${resize}`;
}

export function getPublicUrl(bucket: string, path: string) {
    if (!supabase) return '';
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
}
