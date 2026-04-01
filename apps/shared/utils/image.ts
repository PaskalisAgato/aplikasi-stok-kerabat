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
 * Adds a watermark overlay to an image.
 */
export async function addWatermarkToImage(
    source: Blob | string,
    userName?: string,
    location?: string
): Promise<Blob> {
    // Convert string (base64) to Blob if necessary
    let blob: Blob;
    if (typeof source === 'string') {
        blob = await base64ToBlob(source);
    } else {
        blob = source;
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const context = canvas.getContext('2d');
                if (!context) return reject(new Error('Canvas context failed'));

                context.drawImage(img, 0, 0);

                // Add Timestamp Overlay
                const now = new Date();
                const timestamp = now.toLocaleString('id-ID', { 
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit', second: '2-digit' 
                });

                const padding = canvas.width * 0.04;
                const fontSize = Math.max(16, canvas.width * 0.04);
                const lineHeight = fontSize + 8;
                
                const locationText = location ? (location.length > 50 ? location.substring(0, 47) + '...' : location) : '';
                
                context.font = `bold ${fontSize}px sans-serif`;
                const boxWidth = Math.max(
                    context.measureText(timestamp).width,
                    userName ? context.measureText(`USER: ${userName.toUpperCase()}`).width : 0,
                    location ? context.measureText(locationText).width : 0
                ) + (padding * 2);
                
                const lines = 1 + (userName ? 1 : 0) + (location ? 1 : 0);
                const boxHeight = lines * lineHeight + padding;

                context.fillStyle = 'rgba(0, 0, 0, 0.6)';
                context.fillRect(0, canvas.height - boxHeight, boxWidth, boxHeight);

                context.fillStyle = 'white';
                
                // Draw lines from bottom up
                let currentY = canvas.height - padding;
                
                // Row 1: Timestamp
                context.fillText(timestamp, padding, currentY);
                
                // Row 2: User
                if (userName) {
                    currentY -= lineHeight;
                    context.font = `bold ${fontSize - 4}px sans-serif`;
                    context.fillText(`USER: ${userName.toUpperCase()}`, padding, currentY);
                }

                // Row 3: Location
                if (location) {
                    currentY -= lineHeight;
                    context.font = `bold ${fontSize - 6}px sans-serif`;
                    context.fillText(locationText, padding, currentY);
                }

                canvas.toBlob((resultBlob) => {
                    if (resultBlob) resolve(resultBlob);
                    else reject(new Error('Watermark blob creation failed'));
                }, 'image/jpeg', 0.9);
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
