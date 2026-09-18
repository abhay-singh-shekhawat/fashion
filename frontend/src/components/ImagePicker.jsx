import { useRef } from 'react';
import { compressImage } from '../utils/compressImage';

/* The server's multer cap and Cloudinary's free-plan ceiling are both 10MB, so
   the pre-flight check matches what the API can actually accept. Anything under
   the compress threshold is already light enough to upload untouched. */
const MAX_UPLOAD_MB = 10;
const MAX_BYTES = MAX_UPLOAD_MB * 1024 * 1024;
const COMPRESS_ABOVE_BYTES = 1.5 * 1024 * 1024;

/**
 * Hidden file input wrapper.
 *
 * Picked photos are resized in the browser before they leave the device, so a
 * 12MB DSLR shot or iPhone still uploads like a ~500KB one — the size limit is
 * a backstop for undecodable files (HEIC on desktop), not the normal path.
 *
 * `capture` omitted => the OS shows the gallery/file picker.
 * `capture="environment"` => the OS jumps straight to the rear camera.
 */
export default function ImagePicker({ onPick, onError, capture, children }) {
  const inputRef = useRef(null);

  const handleChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onError?.('Only image files are allowed');
      return;
    }

    const prepared =
      file.size > COMPRESS_ABOVE_BYTES ? await compressImage(file) : file;

    if (prepared.size > MAX_BYTES) {
      const size = Math.round(prepared.size / (1024 * 1024));
      onError?.(`That photo is ${size}MB — the limit is ${MAX_UPLOAD_MB}MB`);
      return;
    }
    onPick?.(prepared);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture={capture}
        className="hidden"
        onChange={handleChange}
      />
      <div onClick={() => inputRef.current?.click()} className="contents">
        {children}
      </div>
    </>
  );
}
