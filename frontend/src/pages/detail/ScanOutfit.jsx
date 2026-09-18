import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { CameraIcon } from '../../components/Icons';
import { useScanOutfit } from '../../hooks/useScan';
import { useScanPipeline } from '../../hooks/useScanPipeline';
import { wardrobeKey } from '../../hooks/useWardrobe';
import { useToast } from '../../context/ToastContext';
import { api, apiError, ENDPOINTS } from '../../services/api';
import { CATEGORY_EMOJI } from '../../config/theme';
import Cta from '../../components/Cta';
import Disclosure from '../../components/Disclosure';
import ErrorState from '../../components/ErrorState';
import GlassCard from '../../components/GlassCard';
import PhotoSourceButtons from '../../components/PhotoSourceButtons';
import Pill from '../../components/Pill';
import StageChecklist from '../../components/StageChecklist';

const SCAN_STAGES = [
  { key: 'uploaded', label: 'Photo uploaded' },
  { key: 'queued', label: 'Queued for scanning' },
  { key: 'processing', label: 'Detecting pieces' },
  { key: 'saved', label: 'Saved to your closet' },
];

export default function ScanOutfit() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { push } = useToast();
  const scan = useScanOutfit();
  const pipeline = useScanPipeline();
  const [uploadError, setUploadError] = useState('');
  const startedAtRef = useRef(null);
  const { finish, stall } = pipeline;

  const running = ['queued', 'processing'].includes(pipeline.status);
  const percent = pipeline.percent ?? 0;

  useEffect(() => {
    if (pipeline.status !== 'done') return;
    queryClient.invalidateQueries({ queryKey: ['wardrobe'] });
    queryClient.invalidateQueries({ queryKey: ['progress'] });
    queryClient.invalidateQueries({ queryKey: ['dailyOutfit'] });
    push('+15 pts · outfit scanned', 'success');
  }, [pipeline.status, queryClient, push]);

  /* Socket events are the primary signal, but a backgrounded tab or a dropped
     connection can miss scan:complete — without this the screen sat on
     "Saving to your closet" forever even though the items were saved. */
  useEffect(() => {
    if (!running) return undefined;

    const timer = setInterval(async () => {
      try {
        const items = await queryClient.fetchQuery({
          queryKey: wardrobeKey,
          queryFn: async () => (await api.get(ENDPOINTS.wardrobe)).data.items ?? [],
          staleTime: 0,
        });
        const fresh = (items ?? []).filter(
          (item) =>
            item.detectedBy === 'scanner' &&
            new Date(item.createdAt).getTime() >= (startedAtRef.current ?? 0),
        );
        if (fresh.length) finish({ itemsAdded: fresh.length, items: fresh });
      } catch {
        /* best effort — the socket path is still live */
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [running, queryClient, finish]);

  /* Nothing arrived and the closet stayed empty: stop spinning and hand the
     user a way out instead. */
  useEffect(() => {
    if (!running) return undefined;
    const timer = setTimeout(stall, 75000);
    return () => clearTimeout(timer);
  }, [running, stall]);

  const handlePick = async (file) => {
    setUploadError('');
    startedAtRef.current = Date.now();
    pipeline.reset();
    pipeline.begin();
    try {
      await scan.mutateAsync(file);
    } catch (error) {
      const message = apiError(error, 'Upload failed');
      /* The backend refuses to scan before a profile exists. */
      if (error?.response?.status === 404) {
        setUploadError('Finish your profile setup first — then I can scan.');
      } else {
        setUploadError(message);
      }
      pipeline.fail(message);
    }
  };

  const restart = () => {
    pipeline.reset();
    setUploadError('');
  };

  const addedCount = pipeline.result?.itemsAdded ?? pipeline.items?.length ?? 0;
  const detected = pipeline.items ?? [];

  /* Stage ticks follow the reported percentage so the checklist and the bar
     always agree on how far along the scan is. */
  const stagesDone = {
    uploaded: percent >= 25 || pipeline.status === 'done',
    queued: percent >= 45 || pipeline.status === 'done',
    processing: percent >= 85 || pipeline.status === 'done' || detected.length > 0,
    saved: pipeline.status === 'done',
  };

  return (
    <div className="page-pad">
      <div className="mx-auto w-full max-w-[42rem] space-y-5">
        {pipeline.status === 'idle' && !uploadError ? (
          <div className="glass flex flex-col items-center gap-4 p-8 text-center">
            <span className="grid h-20 w-20 place-items-center rounded-full bg-brand-cyan/15 text-brand-cyan ring-1 ring-brand-cyan/25">
              <CameraIcon className="h-8 w-8" />
            </span>
            <div>
              <p className="font-display text-lg font-bold tracking-tight">Add your fit</p>
              <p className="mt-1 text-sm text-white/45 text-pretty">
                Full-body, good light, one outfit. I'll pull out every piece.
              </p>
            </div>
            <PhotoSourceButtons onPick={handlePick} onError={setUploadError} />
            <span className="text-[11px] text-white/30">JPG or PNG · up to 5MB</span>
          </div>
        ) : null}

        {uploadError ? <ErrorState message={uploadError} onRetry={restart} /> : null}

        {running || pipeline.status === 'done' || pipeline.status === 'stalled' ? (
          <GlassCard strong className="animate-fade-up space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-[0.18em] text-white/40 uppercase">
                Scanning
              </span>
              {typeof pipeline.percent === 'number' ? (
                <Pill tone="cyan">{pipeline.percent}%</Pill>
              ) : (
                <Pill tone="cyan">working</Pill>
              )}
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
              {typeof pipeline.percent === 'number' ? (
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-cyan to-brand-primary transition-[width] duration-500"
                  style={{ width: `${Math.max(6, pipeline.percent)}%` }}
                />
              ) : (
                <div className="animate-shimmer h-full w-1/3 rounded-full bg-gradient-to-r from-brand-cyan to-brand-primary" />
              )}
            </div>

            <p className="text-sm text-white/55">
              {pipeline.message || 'Processing your photo…'}
            </p>

            {/* The stages are the live feedback the user is watching, so they
                stay out; the detected pieces accumulate and fold away. */}
            <StageChecklist
              stages={SCAN_STAGES}
              done={stagesDone}
              error={pipeline.status === 'error' ? pipeline.error : null}
            />

            {detected.length ? (
              <div className="border-t border-white/10 pt-1">
                <Disclosure
                  label={`Detected pieces · ${detected.length}`}
                  summary="What I pulled out of the photo"
                >
                  <div className="flex flex-wrap gap-2 pt-3">
                    {detected.map((item, index) => (
                      <span
                        key={`${item?.type ?? item?.category ?? index}-${index}`}
                        className="glass flex items-center gap-2 px-3 py-2"
                      >
                        <span className="text-base">
                          {CATEGORY_EMOJI[item?.category ?? item?.type] ?? '🧺'}
                        </span>
                        <span className="text-xs font-semibold text-white/75 capitalize">
                          {item?.color ? `${item.color} ` : ''}
                          {item?.type ?? item?.category ?? 'item'}
                        </span>
                      </span>
                    ))}
                  </div>
                </Disclosure>
              </div>
            ) : null}
          </GlassCard>
        ) : null}

        {pipeline.status === 'error' && !uploadError ? (
          <ErrorState message={pipeline.error ?? 'Scan failed'} onRetry={restart} />
        ) : null}

        {pipeline.status === 'stalled' ? (
          <div className="animate-fade-up space-y-3">
            <GlassCard strong className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-cyan/15 text-xl ring-1 ring-brand-cyan/25">
                ⏳
              </span>
              <div>
                <p className="text-sm font-bold">Taking longer than usual</p>
                <p className="mt-0.5 text-xs text-white/45 text-pretty">
                  Your photo is still being processed. Check your closet in a minute — if it's not
                  there, scan it again.
                </p>
              </div>
            </GlassCard>
            <div className="flex gap-3">
              <Cta tone="lime" className="flex-1" onClick={() => navigate('/wardrobe')}>
                See closet
              </Cta>
              <button
                type="button"
                onClick={restart}
                className="press flex-1 rounded-full bg-white/[0.06] py-3.5 text-sm font-bold ring-1 ring-white/10"
              >
                Try again
              </button>
            </div>
          </div>
        ) : null}

        {pipeline.status === 'done' ? (
          <div className="animate-fade-up space-y-3">
            <GlassCard strong className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-lime/15 text-xl ring-1 ring-brand-lime/25">
                ✓
              </span>
              <div>
                <p className="text-sm font-bold">Fit scanned</p>
                <p className="text-xs text-white/45">
                  {addedCount > 0
                    ? `${addedCount} piece${addedCount === 1 ? '' : 's'} added to your closet`
                    : (pipeline.result?.message ?? 'Nothing new to add from this photo')}
                </p>
              </div>
            </GlassCard>
            <div className="flex gap-3">
              <Cta tone="lime" className="flex-1" onClick={() => navigate('/wardrobe')}>
                See closet
              </Cta>
              <button
                type="button"
                onClick={restart}
                className="press flex-1 rounded-full bg-white/[0.06] py-3.5 text-sm font-bold ring-1 ring-white/10"
              >
                Scan another
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
