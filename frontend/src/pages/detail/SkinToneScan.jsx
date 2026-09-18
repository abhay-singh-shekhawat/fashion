import { useState } from 'react';
import { useSkinTone } from '../../hooks/useSkinTone';
import { SKIN_TONE_SWATCH } from '../../config/theme';
import { apiError } from '../../services/api';
import ErrorState from '../../components/ErrorState';
import GlassCard from '../../components/GlassCard';
import Reveal from '../../components/Reveal';
import SkinToneScanner from '../../components/SkinToneScanner';
import { SkeletonCard } from '../../components/Skeleton';

export default function SkinToneScan() {
  const { data: current, isLoading, isError, error, refetch } = useSkinTone();
  const [result, setResult] = useState(null);

  const tone = result?.skinTone ?? current?.skinTone ?? 'unknown';

  /* The endpoint 404s when nothing has been scanned yet. That is the normal
     empty case, not a failure — only show an error for anything else. */
  const notFoundYet = error?.response?.status === 404;

  return (
    <div className="page-pad">
      <div className="mx-auto w-full max-w-[42rem] space-y-4">
        {isLoading ? (
          <SkeletonCard lines={2} />
        ) : isError && !notFoundYet ? (
          <ErrorState
            message={apiError(error, 'Could not load your skin tone')}
            onRetry={refetch}
          />
        ) : (
          <Reveal>
            <GlassCard strong className="flex items-center gap-4">
              <span
                className="h-14 w-14 shrink-0 rounded-2xl ring-1 ring-white/20"
                style={{ background: SKIN_TONE_SWATCH[tone] }}
              />
              <div className="min-w-0">
                <p className="text-[10px] font-bold tracking-[0.18em] text-white/40 uppercase">
                  Current tone
                </p>
                <p className="font-display text-lg font-bold tracking-tight capitalize">
                  {tone === 'unknown' ? 'Not scanned yet' : tone}
                </p>
                {result?.confidence ? (
                  <p className="text-xs text-white/40">
                    {Math.round(result.confidence * 100)}% confidence
                  </p>
                ) : null}
              </div>
            </GlassCard>
          </Reveal>
        )}

        <Reveal delay={80}>
          <SkinToneScanner tone={tone} onResult={setResult} />
        </Reveal>
      </div>
    </div>
  );
}
