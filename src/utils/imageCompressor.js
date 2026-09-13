/**
 * WebP Image Compressor
 * Converts any image file (PNG, JPG, HEIC, JPEG) into compressed WebP format using HTML5 Canvas.
 * @param {File} file - The original image file selected by the user.
 * @param {number} maxWidth - Maximum target width (default 512px for avatars).
 * @param {number} maxHeight - Maximum target height (default 512px for avatars).
 * @param {number} quality - WebP compression quality (0.0 to 1.0, default 0.85).
 * @returns {Promise<{ file: File, dataUrl: string, blob: Blob }>}
 */
export function compressImageToWebP(file, maxWidth = 512, maxHeight = 512, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('Selected file is not a valid image.'));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio aspect-fit max boundaries
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Failed to get 2d context for canvas'));
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP Data URL
        const dataUrl = canvas.toDataURL('image/webp', quality);

        // Convert to WebP Blob & File object
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error('Canvas WebP encoding failed'));
            }
            const cleanName = (file.name || 'avatar').replace(/\.[^/.]+$/, '') + '.webp';
            const webpFile = new File([blob], cleanName, { type: 'image/webp' });

            resolve({
              file: webpFile,
              dataUrl,
              blob
            });
          },
          'image/webp',
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image file into canvas.'));
      img.src = event.target.result;
    };

    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}
