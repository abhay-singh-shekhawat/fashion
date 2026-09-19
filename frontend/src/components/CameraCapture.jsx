import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import ImagePicker from './ImagePicker';
import { AlertIcon } from './Icons';

/* Desktop browsers ignore the file input's `capture` hint, so "Take a photo"
   opened the gallery there. This modal streams the camera with getUserMedia
   instead, and phones keep the native camera app (which also works over plain
   http, where getUserMedia is blocked). */

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.9;

export default function CameraCapture({ open, onClose, onPick, onError }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState('starting');
  const [error, setError] = useState('');

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    let cancelled = false;
    setStatus('starting');
    setError('');

    const media = navigator.mediaDevices;
    if (!media?.getUserMedia) {
      setStatus('error');
      setError('This browser cannot open the camera.');
      return undefined;
    }

    media
      .getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 } }, audio: false })
      .then(async (stream) => {
        /* The permission prompt can outlive the modal — never leave the camera
           running behind a closed sheet. */
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => {});
        }
        setStatus('live');
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err?.name === 'NotAllowedError'
            ? 'Camera access is blocked. Allow it in your browser, or pick a file instead.'
            : 'No camera available on this device.',
        );
        setStatus('error');
      });

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [open, stopStream]);

  const shutter = () => {
    const video = videoRef.current;
    if (!video?.videoWidth) return;

    const scale = Math.min(1, MAX_DIMENSION / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          onError?.('Could not capture the photo');
          return;
        }
        onPick?.(new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' }));
      },
      'image/jpeg',
      JPEG_QUALITY,
    );
  };

  if (!open) return null;

  const overlay = (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-[10px] font-bold tracking-[0.18em] text-white/50 uppercase">
          Take a photo
        </span>
        <button
          type="button"
          onClick={onClose}
          className="press grid h-9 w-9 place-items-center rounded-full glass-tile text-lg leading-none font-bold text-white/70 ring-1 ring-white/10"
        >
          ×
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden bg-white/[0.03]">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`h-full w-full object-cover ${status === 'live' ? '' : 'opacity-0'}`}
        />

        {status === 'starting' ? (
          <div className="absolute inset-0 grid place-items-center">
            <p className="text-sm text-white/50">Starting camera…</p>
          </div>
        ) : null}

        {status === 'error' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
            <span className="text-brand-error">
              <AlertIcon className="h-7 w-7" />
            </span>
            <p className="text-sm text-white/70">{error}</p>
            <ImagePicker
              onPick={(file) => {
                onClose?.();
                onPick?.(file);
              }}
              onError={onError}
            >
              <button
                type="button"
                className="press rounded-full glass-tile px-4 py-2 text-xs font-bold tracking-wide uppercase ring-1 ring-white/10"
              >
                Choose a file instead
              </button>
            </ImagePicker>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col items-center gap-2 px-4 py-6 pb-safe">
        <button
          type="button"
          onClick={shutter}
          disabled={status !== 'live'}
          aria-label="Capture photo"
          className="press grid h-16 w-16 place-items-center rounded-full ring-4 ring-white/30 disabled:opacity-40"
        >
          <span className="h-12 w-12 rounded-full bg-white" />
        </button>
        <span className="text-[11px] text-white/35">
          {status === 'live' ? 'Frame your fit, then tap to capture' : 'Camera unavailable'}
        </span>
      </div>
    </div>
  );

  /* The view must escape the card that triggered it: `backdrop-blur` on the
     .glass cards (and the Stylist sheet) makes them the containing block for
     fixed children, which would pin the camera to the card instead of the
     viewport. */
  return typeof document === 'undefined' ? overlay : createPortal(overlay, document.body);
}
