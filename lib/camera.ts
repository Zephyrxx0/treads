/**
 * Image processing utilities for client-side EXIF/GPS stripping and thumbnail generation.
 * Per CAPT-01, CAPT-02, and Decisions D-01, D-02, D-03.
 */

export interface ProcessedImage {
  photoBlob: Blob;
  thumbnailBlob: Blob;
  width: number;
  height: number;
  sizeBytes: number;
}

/**
 * Calculates new dimensions scaled to maxDim while strictly preserving aspect ratio.
 */
export function calculateDimensions(
  srcWidth: number,
  srcHeight: number,
  maxDim: number
): { width: number; height: number } {
  if (srcWidth <= 0 || srcHeight <= 0 || maxDim <= 0) {
    return { width: Math.max(1, srcWidth), height: Math.max(1, srcHeight) };
  }

  if (srcWidth <= maxDim && srcHeight <= maxDim) {
    return { width: Math.round(srcWidth), height: Math.round(srcHeight) };
  }

  if (srcWidth > srcHeight) {
    const height = Math.round((srcHeight * maxDim) / srcWidth);
    return { width: maxDim, height: Math.max(1, height) };
  } else {
    const width = Math.round((srcWidth * maxDim) / srcHeight);
    return { width: Math.max(1, width), height: maxDim };
  }
}

/**
 * Strips 100% of EXIF, GPS, and hardware tags by rasterizing image pixels to an HTML5 Canvas,
 * resizing the primary photo to max 1024px JPEG (quality 0.82) and generating a 160px thumbnail (quality 0.80).
 */
export async function processCapturedImage(file: File | Blob): Promise<ProcessedImage> {
  if (typeof window === 'undefined') {
    throw new Error('processCapturedImage must be called in a browser environment');
  }

  // createImageBitmap natively applies EXIF orientation in modern browsers
  let imageSource: ImageBitmap | HTMLImageElement;
  let srcWidth: number;
  let srcHeight: number;

  if (typeof createImageBitmap === 'function') {
    imageSource = await createImageBitmap(file);
    srcWidth = imageSource.width;
    srcHeight = imageSource.height;
  } else {
    // Fallback using HTMLImageElement
    imageSource = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image for canvas rasterization'));
      };
      img.src = url;
    });
    srcWidth = imageSource.naturalWidth;
    srcHeight = imageSource.naturalHeight;
  }

  // 1. Primary photo: downscale to max 1024px
  const photoDims = calculateDimensions(srcWidth, srcHeight, 1024);
  const photoCanvas = document.createElement('canvas');
  photoCanvas.width = photoDims.width;
  photoCanvas.height = photoDims.height;
  const photoCtx = photoCanvas.getContext('2d');
  if (!photoCtx) {
    throw new Error('Failed to get 2D rendering context for photo canvas');
  }

  // High-quality image smoothing
  photoCtx.imageSmoothingEnabled = true;
  photoCtx.imageSmoothingQuality = 'high';
  photoCtx.drawImage(imageSource, 0, 0, photoDims.width, photoDims.height);

  const photoBlob = await new Promise<Blob>((resolve, reject) => {
    photoCanvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Photo canvas toBlob failed'))),
      'image/jpeg',
      0.82
    );
  });

  // 2. Thumbnail: downscale to max 160px
  const thumbDims = calculateDimensions(srcWidth, srcHeight, 160);
  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = thumbDims.width;
  thumbCanvas.height = thumbDims.height;
  const thumbCtx = thumbCanvas.getContext('2d');
  if (!thumbCtx) {
    throw new Error('Failed to get 2D rendering context for thumbnail canvas');
  }

  thumbCtx.imageSmoothingEnabled = true;
  thumbCtx.imageSmoothingQuality = 'medium';
  thumbCtx.drawImage(photoCanvas, 0, 0, thumbDims.width, thumbDims.height);

  const thumbnailBlob = await new Promise<Blob>((resolve, reject) => {
    thumbCanvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Thumbnail canvas toBlob failed'))),
      'image/jpeg',
      0.80
    );
  });

  // Clean up ImageBitmap if applicable
  if ('close' in imageSource && typeof imageSource.close === 'function') {
    imageSource.close();
  }

  return {
    photoBlob,
    thumbnailBlob,
    width: photoDims.width,
    height: photoDims.height,
    sizeBytes: photoBlob.size,
  };
}

/**
 * Converts a Blob to a base64 string (pure base64 data without data-URL prefix).
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result as string;
      if (!res) {
        resolve('');
        return;
      }
      const base64 = res.includes(',') ? res.split(',')[1] : res;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

