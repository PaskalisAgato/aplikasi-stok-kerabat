import { createClient } from '@supabase/supabase-js';

// Load environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials missing. Database functionality may be limited.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, uploadData, {
            upsert: true,
            contentType: (file as any).type || 'image/jpeg'
        });

    if (error) {
        throw new Error(`Upload storage gagal: ${error.message}`);
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
    const { width = 300, height = 300, resize = 'contain' } = options;
    
    // Format: https://project-id.supabase.co/storage/v1/render/image/public/bucket/path?width=300&height=300&resize=contain
    return `${projectUrl}/storage/v1/render/image/public/${path}?width=${width}&height=${height}&resize=${resize}`;
}

export function getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
}
