export async function resizeImage(inputPath, maxWidth = 1200, quality = 70) {
    // No-op untuk VPS karena CPU tidak support microarchitecture v2 (sharp)
    return inputPath;
}
export async function resizeBase64(base64, maxWidth = 1200, quality = 70) {
    // No-op untuk VPS karena CPU tidak support microarchitecture v2 (sharp)
    return base64;
}
