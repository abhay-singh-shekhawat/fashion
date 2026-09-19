import { useState } from 'react';
import CameraCapture from './CameraCapture';
import ImagePicker from './ImagePicker';
import { CameraIcon, ImageIcon } from './Icons';

const BASE =
  'press flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold';

/* Phones open the native camera app through the input's `capture` hint, which
   is also the only option that works over plain http (getUserMedia needs a
   secure context). Everywhere else the hint is ignored and the OS showed the
   gallery, so desktop and tablets get an in-page camera view instead. */
const isPhone = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(ua)) return true;
  /* iPadOS 13+ reports a Mac user agent, but only iPads have a touch screen there. */
  return /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
};

export default function PhotoSourceButtons({ onPick, onError, primaryTone = 'brand-cyan' }) {
  const [cameraOpen, setCameraOpen] = useState(false);
  const inPageCamera =
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    !isPhone();

  const primaryClass =
    primaryTone === 'brand-primary'
      ? 'bg-gradient-to-r from-brand-primary to-brand-lime text-ink-950 shadow-[0_16px_36px_-16px_rgba(223,195,169,0.5)]'
      : 'bg-brand-primary text-ink-950 shadow-[0_16px_36px_-18px_rgba(223,195,169,0.45)]';

  return (
    <div className="flex w-full flex-col gap-2">
      {inPageCamera ? (
        <>
          <button
            type="button"
            onClick={() => setCameraOpen(true)}
            className={`${BASE} ${primaryClass}`}
          >
            <CameraIcon className="h-4 w-4" />
            Take a photo
          </button>

          <CameraCapture
            open={cameraOpen}
            onClose={() => setCameraOpen(false)}
            onPick={(file) => {
              setCameraOpen(false);
              onPick?.(file);
            }}
            onError={(message) => {
              setCameraOpen(false);
              onError?.(message);
            }}
          />
        </>
      ) : (
        <ImagePicker capture="environment" onPick={onPick} onError={onError}>
          <button type="button" className={`${BASE} ${primaryClass}`}>
            <CameraIcon className="h-4 w-4" />
            Take a photo
          </button>
        </ImagePicker>
      )}

      <ImagePicker onPick={onPick} onError={onError}>
        <button
          type="button"
          className={`${BASE} glass-tile text-white/80 ring-1 ring-white/10`}
        >
          <ImageIcon className="h-4 w-4" />
          Upload from gallery
        </button>
      </ImagePicker>
    </div>
  );
}
