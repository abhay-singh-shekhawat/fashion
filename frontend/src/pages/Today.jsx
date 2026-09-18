import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProgress } from '../hooks/useProgress';
import { useDailyOutfit, useOccasionOutfit } from '../hooks/useSuggestions';
import { useWardrobe } from '../hooks/useWardrobe';
import { apiError } from '../services/api';
import { CATEGORY_EMOJI, OCCASIONS } from '../config/theme';
import GlassCard from '../components/GlassCard';
import Pill from '../components/Pill';
import Cta from '../components/Cta';
import Disclosure from '../components/Disclosure';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import OccasionRail from '../components/OccasionRail';
import OutfitPieces from '../components/OutfitPieces';
import ResponsiveSheet from '../components/ResponsiveSheet';
import ShoppingPanel from '../components/ShoppingPanel';
import ActivityPanel from '../components/ActivityPanel';
import PullToRefresh from '../components/PullToRefresh';
import Reveal from '../components/Reveal';
import { SkeletonCard } from '../components/Skeleton';
import { ClosetIcon, SparkleIcon } from '../components/Icons';

/* Slot order matches what the suggestion endpoints return. */
const SLOTS = ['top', 'bottom', 'layer', 'piece'];

/** Compact summary of an outfit: the first few pieces plus an overflow count.
 *  The full set is revealed by the card's Disclosure. */
function PieceStrip({ outfit, max = 3 }) {
  const pieces = SLOTS.map((slot) => outfit?.[slot]).filter(
    (item) => item?.name || item?.category,
  );
  if (!pieces.length) return null;

  const shown = pieces.slice(0, max);
  const overflow = pieces.length - shown.length;

  return (
    <div className="flex items-center gap-2">
      {shown.map((item, index) => (
        <span
          key={`${item.name ?? item.category}-${index}`}
          className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white/[0.05] ring-1 ring-white/10"
        >
          {item.image ? (
            <img src={item.image} alt={item.name ?? ''} className="h-full w-full object-cover" />
          ) : (
            <span className="text-xl">{CATEGORY_EMOJI[item.category] ?? '👕'}</span>
          )}
        </span>
      ))}
      {overflow > 0 ? (
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/[0.05] text-xs font-bold text-white/50 ring-1 ring-white/10">
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}

export default function Today() {
  const navigate = useNavigate();
  const progress = useProgress();
  const daily = useDailyOutfit();
  const wardrobe = useWardrobe();
  const [occasion, setOccasion] = useState(null);

  const occasionQuery = useOccasionOutfit(occasion);

  const refresh = useCallback(
    () => Promise.all([progress.refetch(), daily.refetch(), wardrobe.refetch()]),
    [progress, daily, wardrobe],
  );

  const level = progress.data?.level ?? 1;
  const toNext = progress.data?.pointsToNextLevel ?? 100;
  const levelFill = Math.max(4, Math.round(((100 - toNext) / 100) * 100));
  const wardrobeCount = wardrobe.data?.length ?? daily.data?.wardrobeCount ?? 0;
  const suggestion = daily.data?.suggestion ?? null;

  const activeOccasion = OCCASIONS.find((entry) => entry.key === occasion) ?? null;
  const occasionOutfit = occasionQuery.data?.fullOutfit ?? null;
  const occasionHasPieces = Boolean(
    occasionOutfit && Object.values(occasionOutfit).some(Boolean),
  );

  /* Level is the highest-level signal on the screen, so it keeps its own slot
     above the fit on phones. On desktop it moves to the right-hand column. */
  const levelCard = (
    <GlassCard strong className="flex items-center gap-4">
      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-primary/15 ring-1 ring-brand-primary/30">
        <span className="font-display text-xl font-bold text-brand-primary">{level}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-white/45">
          {progress.data?.motivationalMessage ?? 'Building your wardrobe…'}
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-pink transition-[width] duration-700"
            style={{ width: `${levelFill}%` }}
          />
        </div>
        <p className="mt-1.5 text-[11px] text-white/35">
          {toNext} pts to level {level + 1}
        </p>
      </div>
      {progress.data?.badge ? <Pill tone="pink">{progress.data.badge}</Pill> : null}
    </GlassCard>
  );

  return (
    <PullToRefresh onRefresh={refresh}>
      <div className="page-pad">
        <div className="page-stack">
          <Reveal>
            <p className="text-[10px] font-bold tracking-[0.2em] text-white/35 uppercase">
              {new Date().toLocaleDateString(undefined, {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
              })}
            </p>
          </Reveal>

          {/* Phones stack in reading order; from lg the fit leads a wide column
              with progress, shopping and activity alongside it.
              The explicit `grid-cols-1` matters: a bare `grid` would size its
              implicit track to max-content, and the occasion rail's max-content
              is far wider than a phone — which pushed the whole column off
              screen. `minmax(0,1fr)` caps the track at the container. */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start lg:gap-6">
            <Reveal className="lg:col-start-2 lg:row-start-1" delay={40}>
              {levelCard}
            </Reveal>

            {/* ── Daily AI outfit ─────────────────────────────────────────── */}
            <Reveal className="lg:col-start-1 lg:row-start-1">
              {daily.isLoading ? (
                <SkeletonCard lines={3} />
              ) : daily.isError ? (
                <ErrorState
                  message={apiError(daily.error, 'Could not load today’s fit')}
                  onRetry={() => daily.refetch()}
                />
              ) : (
                <GlassCard strong size="lg" className="relative overflow-hidden">
                  {/* The one gradient on the screen, borrowed from the
                      reference's lime→indigo hero. Kept near-transparent so the
                      piece thumbnails and copy stay legible. */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-lime/[0.09] via-transparent to-brand-indigo/[0.16]"
                  />

                  <div className="relative">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold tracking-[0.18em] text-white/40 uppercase">
                        Today's fit ·{' '}
                        {new Date().toLocaleDateString(undefined, {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                      {typeof daily.data?.temperature === 'number' ? (
                        <Pill tone="cyan">{Math.round(daily.data.temperature)}°C</Pill>
                      ) : null}
                    </div>

                    {suggestion ? (
                      <div className="mt-3.5 space-y-3.5">
                        <p className="font-display text-2xl leading-tight font-bold tracking-tight">
                          {suggestion.outfit ?? 'Outfit ready'}
                        </p>

                        <PieceStrip outfit={daily.data?.fullOutfit} />

                        {/* Everything below the headline is secondary, so it
                            starts folded away. */}
                        <Disclosure
                          label="Why this works"
                          summary={
                            suggestion.weatherFit
                              ? `Weather fit: ${suggestion.weatherFit}`
                              : undefined
                          }
                        >
                          <div className="space-y-3 pt-3">
                            {suggestion.freshnessNote ? (
                              <div
                                className={`flex items-start gap-2 rounded-2xl p-2.5 ring-1 ${
                                  suggestion.isRepeat
                                    ? 'bg-brand-amber/10 ring-brand-amber/25'
                                    : 'bg-brand-lime/10 ring-brand-lime/25'
                                }`}
                              >
                                <SparkleIcon
                                  className={`mt-px h-3.5 w-3.5 shrink-0 ${
                                    suggestion.isRepeat ? 'text-brand-amber' : 'text-brand-lime'
                                  }`}
                                />
                                <p className="text-xs leading-relaxed text-white/70">
                                  {suggestion.freshnessNote}
                                </p>
                              </div>
                            ) : null}

                            <div className="flex flex-wrap gap-1.5">
                              {suggestion.weatherFit ? (
                                <Pill tone="lime">{suggestion.weatherFit}</Pill>
                              ) : null}
                              {daily.data?.profileSkinTone &&
                              daily.data.profileSkinTone !== 'unknown' ? (
                                <Pill>{daily.data.profileSkinTone} tone</Pill>
                              ) : null}
                            </div>

                            <OutfitPieces outfit={daily.data?.fullOutfit} />

                            {suggestion.note ? (
                              <p className="text-sm leading-relaxed text-white/50">
                                {suggestion.note}
                              </p>
                            ) : null}
                          </div>
                        </Disclosure>
                      </div>
                    ) : wardrobeCount === 0 ? (
                      <EmptyState
                        icon={<ClosetIcon className="h-7 w-7" />}
                        title="Your closet is empty"
                        body="Add a few pieces and I'll start building fits around them."
                      >
                        <Cta tone="lime" onClick={() => navigate('/scan')}>
                          Scan an outfit
                        </Cta>
                        <button
                          type="button"
                          onClick={() => navigate('/wardrobe/add')}
                          className="press text-xs font-bold text-white/50"
                        >
                          or add one manually
                        </button>
                      </EmptyState>
                    ) : (
                      <EmptyState
                        icon={<SparkleIcon className="h-7 w-7" />}
                        title="No fit today"
                        body={
                          daily.data?.message ?? 'The stylist came up short. Try again in a moment.'
                        }
                      >
                        <Cta tone="lime" onClick={() => navigate('/wardrobe/add')}>
                          Add pieces
                        </Cta>
                        <button
                          type="button"
                          onClick={() => daily.refetch()}
                          className="press text-xs font-bold text-white/50"
                        >
                          or retry
                        </button>
                      </EmptyState>
                    )}
                  </div>
                </GlassCard>
              )}
            </Reveal>

            {/* ── Occasion shelf ──────────────────────────────────────────── */}
            {/* A tap builds a one-off fit for that occasion from the closet. It
                is not a filter, and the line above says so. */}
            <Reveal className="space-y-2.5 lg:col-start-1 lg:row-start-2" delay={80}>
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold tracking-[0.18em] text-white/40 uppercase">
                    Style me for…
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-white/50">
                    {wardrobeCount > 0
                      ? 'Pick an occasion and I’ll build a fit from your closet.'
                      : 'Add a few pieces and I’ll style them for any occasion.'}
                  </p>
                </div>
                {wardrobeCount > 0 ? (
                  <span className="shrink-0 pb-0.5 text-[11px] font-semibold text-white/35">
                    {wardrobeCount} piece{wardrobeCount === 1 ? '' : 's'}
                  </span>
                ) : null}
              </div>
              <OccasionRail
                active={occasion}
                loadingKey={occasionQuery.isFetching ? occasion : null}
                onSelect={setOccasion}
              />
            </Reveal>

            <Reveal className="lg:col-start-2 lg:row-start-2" delay={120}>
              <ShoppingPanel />
            </Reveal>

            <Reveal className="lg:col-start-2 lg:row-start-3" delay={160}>
              <ActivityPanel />
            </Reveal>
          </div>
        </div>
      </div>

      {/* Occasion result — bottom sheet on phones, centred modal on desktop. */}
      <ResponsiveSheet
        opened={Boolean(occasion)}
        onBackdropClick={() => setOccasion(null)}
        className="pb-safe"
      >
        <div className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-primary/15 text-xl ring-1 ring-brand-primary/25">
                {activeOccasion?.emoji ?? '✨'}
              </span>
              <div>
                <p className="font-display text-lg font-bold tracking-tight">
                  {activeOccasion ? `${activeOccasion.label} fit` : 'Your fit'}
                </p>
                <p className="text-[11px] text-white/40">
                  {wardrobeCount > 0
                    ? `Styled from your ${wardrobeCount} piece${wardrobeCount === 1 ? '' : 's'}`
                    : 'Styled from your closet'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOccasion(null)}
              className="press shrink-0 rounded-full bg-white/[0.06] px-3 py-1.5 text-xs font-bold text-white/60 ring-1 ring-white/10"
            >
              Close
            </button>
          </div>

          {occasionQuery.isLoading ? (
            <div className="space-y-3">
              <p className="text-sm text-white/55">
                {activeOccasion
                  ? `Building your ${activeOccasion.label.toLowerCase()} fit…`
                  : 'Building your fit…'}
              </p>
              <SkeletonCard lines={3} />
            </div>
          ) : occasionQuery.isError ? (
            <ErrorState
              message={apiError(occasionQuery.error, 'Could not style this occasion')}
              onRetry={() => occasionQuery.refetch()}
            />
          ) : occasionQuery.data?.suggestion ? (
            <>
              <OutfitPieces outfit={occasionOutfit} />

              {/* The joined piece string is only the fallback for a response
                  with no structured slots — otherwise it repeats the cards. */}
              {!occasionHasPieces ? (
                <p className="text-sm leading-relaxed text-white/60">
                  {typeof occasionQuery.data.suggestion === 'string'
                    ? occasionQuery.data.suggestion
                    : 'Outfit ready'}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-1.5">
                {occasionQuery.data.weatherNote ? (
                  <Pill tone="cyan">{occasionQuery.data.weatherNote}</Pill>
                ) : null}
                {occasionQuery.data.formalityMatch ? (
                  <Pill tone="lime">{occasionQuery.data.formalityMatch}</Pill>
                ) : null}
              </div>

              {occasionQuery.data.aiReason ? (
                <div className="flex items-start gap-2 rounded-2xl bg-brand-primary/10 p-2.5 ring-1 ring-brand-primary/25">
                  <SparkleIcon className="mt-px h-3.5 w-3.5 shrink-0 text-brand-primary" />
                  <p className="text-xs leading-relaxed text-white/70">
                    {occasionQuery.data.aiReason}
                  </p>
                </div>
              ) : null}
            </>
          ) : (
            <EmptyState
              icon={<ClosetIcon className="h-7 w-7" />}
              title="Can’t build this fit yet"
              body={occasionQuery.data?.message ?? 'Add more pieces to your closet for this one.'}
            >
              <Cta tone="lime" onClick={() => navigate('/wardrobe/add')}>
                Add pieces
              </Cta>
            </EmptyState>
          )}
        </div>
      </ResponsiveSheet>
    </PullToRefresh>
  );
}
