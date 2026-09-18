import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CameraIcon, RefreshIcon } from './Icons';
import { useScanSkinTone } from '../hooks/useSkinTone';
import { useSocketEvent } from '../hooks/useSocketEvent';
import { apiError } from '../services/api';
import ErrorState from './ErrorState';
import GlassCard from './GlassCard';
import PhotoSourceButtons from './PhotoSourceButtons';
import Pill from './Pill';
import StageChecklist from './StageChecklist';

const STAGES = [
  { key: 'uploaded', label: 'Portrait uploaded' },
  { key: 'processing', label: 'Analysing your tone' },
  { key: 'saved', label: 'Saved to your profile' },
];

/**
 * The full skin-tone scan: pick a portrait, watch the stages, get the tone.
 * Shared by the profile page and the signup wizard so a scan started at either
 * end behaves the same. `onResult` hands the finished scan to the caller (the
 * wizard mirrors it into its own state); `onBusyChange` lets a caller with a
 * submit button hold it while a scan is in flight.
 */
export default function SkinToneScanner({ tone = 'unknown', onResult, onBusyChange, className = '' }) {
  const queryClient = useQueryClient();
  const scan = useScanSkinTone();

  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const running = status === 'queued' || status === 'processing';

  const goTo = (next) => {
    setStatus(next);
    onBusyChange?.(next === 'queued' || next === 'processing');
  };

  useSocketEvent('skintone:queued', () => goTo('queued'));

  useSocketEvent('skintone:progress', () => goTo('processing'));

  useSocketEvent('skintone:complete', (payload = {}) => {
    setResult(payload);
    goTo('done');
    queryClient.invalidateQueries({ queryKey: ['skinTone'] });
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    onResult?.(payload);
  });

  useSocketEvent('skintone:error', ({ error: message } = {}) => {
    setError(message ?? 'Skin tone scan failed');
    goTo('error');
  });

  const handlePick = async (file) => {
    setError('');
    setResult(null);
    goTo('queued');
    try {
      await scan.mutateAsync(file);
    } catch (err) {
      setError(apiError(err, 'Upload failed'));
      goTo('error');
    }
  };

  const reset = () => {
    setResult(null);
    setError('');
    goTo('idle');
  };

  const stagesDone = {
    uploaded: status !== 'idle' && status !== 'error',
    processing: status === 'processing' || status === 'done',
    saved: status === 'done',
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {status === 'idle' || status === 'error' ? (
        <>
          <div className="glass flex flex-col items-center gap-3 p-7 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-brand-primary/15 text-brand-primary ring-1 ring-brand-primary/25">
              <CameraIcon className="h-7 w-7" />
            </span>
            <p className="font-display text-base font-bold tracking-tight">
              {tone === 'unknown' ? 'Scan your skin tone' : 'Rescan your tone'}
            </p>
            <p className="max-w-xs text-xs leading-relaxed text-white/45">
              Face the camera in even, natural light — no filters, no heavy makeup. A selfie also
              works.
            </p>
            <PhotoSourceButtons
              onPick={handlePick}
              onError={setError}
              primaryTone="brand-primary"
            />
          </div>

          {error ? <ErrorState message={error} onRetry={reset} /> : null}
        </>
      ) : null}

      {running || status === 'done' ? (
        <GlassCard strong className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-[0.18em] text-white/40 uppercase">
              Skin tone scan
            </span>
            <Pill tone={status === 'done' ? 'lime' : 'cyan'}>
              {status === 'done' ? 'complete' : 'working'}
            </Pill>
          </div>

          {running ? (
            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
              <div className="h-full w-1/3 animate-[shimmer_1.1s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-brand-primary to-brand-cyan" />
            </div>
          ) : null}

          <StageChecklist stages={STAGES} done={stagesDone} />
        </GlassCard>
      ) : null}

      {status === 'done' ? (
        <div className="space-y-3">
          {result?.description ? (
            <GlassCard className="space-y-1.5">
              <span className="text-[10px] font-bold tracking-[0.18em] text-white/40 uppercase">
                What this means
              </span>
              <p className="text-sm leading-relaxed text-white/70">{result.description}</p>
            </GlassCard>
          ) : null}

          <button
            type="button"
            onClick={reset}
            className="press flex w-full items-center justify-center gap-2 rounded-full bg-white/[0.06] py-3.5 text-sm font-bold ring-1 ring-white/10"
          >
            <RefreshIcon className="h-4 w-4" /> Scan again
          </button>
        </div>
      ) : null}
    </div>
  );
}
