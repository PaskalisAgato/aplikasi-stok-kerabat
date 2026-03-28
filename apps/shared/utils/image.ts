/**
 * apps/shared/utils/image.ts
 * Unified image compression utility with strict size enforcement.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  initialQuality?: number;
  maxSizeKB?: number;
  minQuality?: number;
}

/**
 * Compresses an image iteratively until it's below the maxSizeKB.
 */
export async function compressImage(
  source: File | Blob | string,
  options: CompressionOptions = {}
): Promise<Blob> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    initialQuality = 0.8,
    maxSizeKB = 300,
    minQuality = 0.1,
  } = options;

  const maxSizeBytes = maxSizeKB * 1024;

  // Convert string (base64) to Blob if necessary
  let blob: Blob;
  if (typeof source === 'string') {
    blob = await base64ToBlob(source);
  } else {
    blob = source;
  }

  // If already small enough, just return
  if (blob.size <= maxSizeBytes) return blob;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Resize if needed
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context failed'));

        ctx.drawImage(img, 0, 0, width, height);

        let currentQuality = initialQuality;
        
        const attemptCompression = () => {
          canvas.toBlob(
            (resultBlob) => {
              if (!resultBlob) return reject(new Error('Compression failed'));

              if (resultBlob.size <= maxSizeBytes || currentQuality <= minQuality) {
                console.log(`[ImageUtil] Final Size: ${(resultBlob.size / 1024).toFixed(1)}KB at Q=${currentQuality.toFixed(2)}`);
                resolve(resultBlob);
              } else {
                // Reduce quality and try again
                currentQuality -= 0.1;
                attemptCompression();
              }
            },
            'image/jpeg',
            currentQuality
          );
        };

        attemptCompression();
      };
      img.onerror = () => reject(new Error('Image load failed'));
    };
    reader.onerror = () => reject(new Error('File read failed'));
  });
}

/**
 * Helper to convert Base64 string to Blob
 */
async function base64ToBlob(base64: string): Promise<Blob> {
  const response = await fetch(base64);
  return await response.blob();
}

/**
 * Validates if a base64 string is within size limits
 * Returns true if valid, false if too large.
 */
export function isBase64SizeValid(base64: string, maxSizeKB: number = 300): boolean {
  // Base64 is ~33% larger than binary. Approximate binary size:
  const stringLength = base64.split(',')[1]?.length || base64.length;
  const sizeInBytes = (stringLength * 3) / 4;
  return sizeInBytes <= maxSizeKB * 1024;
}
