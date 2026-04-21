import fs from 'fs/promises';
import path from 'path';

export async function resizeImage(inputPath: string, maxWidth: number = 1200, quality: number = 70): Promise<string> {
    // No-op untuk VPS karena CPU tidak support microarchitecture v2 (sharp)
    return inputPath;
}

export async function resizeBase64(base64: string, maxWidth: number = 1200, quality: number = 70): Promise<string> {
    // No-op untuk VPS karena CPU tidak support microarchitecture v2 (sharp)
    return base64;
}
