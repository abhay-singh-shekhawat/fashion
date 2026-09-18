import { useRef } from 'react';

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Hidden file input wrapper. Mirrors the server's multer guard
 * (image/* only, 5MB max) so the user gets feedback before uploading.
 *
 * `capture` omitted => the OS shows the gallery/file picker.
 * `capture="environment"` => the OS jumps straight to the rear camera.
 */
export default function ImagePicker({ onPick, onError, capture, children }) {
  const inputRef = useRef(null);

  const handleChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onError?.('Only image files are allowed');
      return;
    }
    if (file.size > MAX_BYTES) {
      onError?.('Image must be under 5MB');
      return;
    }
    onPick?.(file);
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
