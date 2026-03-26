/**
 * apps/shared/imageUtils.ts
 * Utility for client-side image compression to save Supabase bandwidth (egress).
 */
interface CompressionOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
}
/**
 * Compresses an image (File or Blob) using Canvas.
 * Returns a new Blob with the compressed data.
 */
export declare function compressImage(file: File | Blob, options?: CompressionOptions): Promise<Blob>;
export {};
