/* Camera photos (DSLR JPEGs, iPhone stills) arrive at 8-25MB and thousands of
   pixels wide — far more than the app, the AI or Cloudinary needs. Every picked
   file is therefore redrawn onto a canvas and shipped as a 1600px JPEG, which is
   what lets gallery uploads work at all instead of bouncing off the size guard. */

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.85;

/* createImageBitmap decodes off the main thread and honours the EXIF rotation
   that phone cameras rely on. The <img> path is the fallback for browsers
   without it, and both paths reject formats the browser cannot decode (HEIC in
   Chrome, for instance) so the caller can fall back to the original file. */
const decode = async (file) => {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      /* fall through to the <img> decoder */
    }
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that image'));
    };
    image.src = url;
  });
};

const encode = (canvas) =>
  new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));

/**
 * Re-encode an image so its longest edge is at most 1600px.
 *
 * Never throws and never grows a file: an image the browser cannot decode, or
 * one that is already smaller than the re-encode, comes back as the original.
 */
export async function compressImage(file) {
  try {
    const source = await decode(file);
    const width = source.width || source.naturalWidth || 0;
    const height = source.height || source.naturalHeight || 0;
    if (!width || !height) return file;

    const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);

    const context = canvas.getContext('2d');
    if (!context) return file;

    /* JPEG has no alpha channel — without a white base, transparent PNGs come
       out with black backgrounds. */
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    source.close?.();

    const blob = await encode(canvas);
    if (!blob || blob.size >= file.size) return file;

    const name = `${file.name.replace(/\.[^.]+$/, '') || 'photo'}.jpg`;
    return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() });
  } catch {
    return file;
  }
}
