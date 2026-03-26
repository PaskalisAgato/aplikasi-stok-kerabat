export declare const supabase: any;
export declare const isSupabaseConfigured: boolean;
/**
 * Uploads a file (File, Blob, or base64 string) to a Supabase bucket.
 * Returns the path of the uploaded file.
 */
export declare function uploadFile(bucket: string, path: string, file: File | Blob | string): Promise<string>;
/**
 * Construct optimized public URL with Supabase Image Transformations
 */
export declare function getOptimizedImageUrl(path: string, options?: {
    width?: number;
    height?: number;
    resize?: 'cover' | 'contain' | 'fill';
}): string;
export declare function getPublicUrl(bucket: string, path: string): any;
