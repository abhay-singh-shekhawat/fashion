import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProgress } from '../hooks/useProgress';
import { useRatingHistory } from '../hooks/useRatingHistory';
import { useDailyOutfit, useOccasionIdeas, useOccasionOutfit } from '../hooks/useSuggestions';
import { useWardrobe } from '../hooks/useWardrobe';
import { apiError } from '../services/api';
import { CATEGORY_EMOJI, OCCASIONS, badgeForLevel, weatherBand } from '../config/theme';
import ClosetCoverage from '../components/ClosetCoverage';
import FitCalendar from '../components/FitCalendar';
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
import TopFits from '../components/TopFits';
import { SkeletonCard } from '../components/Skeleton';
import { CheckIcon, ChevronRightIcon, ClosetIcon, RefreshIcon, SparkleIcon } from '../components/Icons';

/* Slot order matches what the suggestion endpoints return. */
const SLOTS = ['top', 'bottom', 'layer', 'piece'];

/* The two ways an occasion fit can be built. Both read the same closet — the
   difference is whether the stylist may hand back the combination it already
   gave, which the backend controls with `refresh=1`. */
const BUILD_MODES = [
  {
    key: 'closet',
    Icon: ClosetIcon,
    title: 'From my closet',
    body: 'The best match from the pieces you own',
  },
  {
    key: 'ideas',
    Icon: SparkleIcon,
    title: 'Ideas for me',
    body: 'Written from your profile, not limited to what you own',
  },
];

/** The reference's piece grid: a portrait crop per slot with the name scrimmed
 *  over the bottom edge, so the look reads as an outfit rather than a row of
 *  thumbnails. A fourth piece collapses into a count tile — the full list is
 *  one tap away in the card's Disclosure. */
function PieceStrip({ outfit, max = 3 }) {
  const pieces = SLOTS.map((slot) => outfit?.[slot]).filter(
    (item) => item?.name || item?.category,
  );
  if (!pieces.length) return null;

  const overflow = pieces.length - max;
  const shown = overflow > 0 ? pieces.slice(0, max - 1) : pieces.slice(0, max);

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {shown.map((item, index) => (
        <div
          key={`${item.name ?? item.category}-${index}`}
          className="relative overflow-hidden rounded-2xl glass-tile"
        >
          <div className="grid aspect-[3/4] place-items-center overflow-hidden">
            {item.image ? (
              <img
                src={item.image}
                alt={item.name ?? ''}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-2xl">{CATEGORY_EMOJI[item.category] ?? '👕'}</span>
            )}
          </div>
          {item.name ? (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/95 via-ink-950/55 to-transparent px-1.5 pt-6 pb-1.5">
              <span className="block truncate text-center text-[11px] font-medium">
                {item.name}
              </span>
            </div>
          ) : null}
        </div>
      ))}

      {overflow > 0 ? (
        <div className="grid aspect-[3/4] place-items-center rounded-2xl glass-tile">
          <span className="text-center">
            <span className="font-display block text-xl font-medium text-brand-primary tabular-nums">
              +{overflow}
            </span>
            <span className="mt-0.5 block text-[10px] tracking-wider text-white/40 uppercase">
              more
            </span>
          </span>
        </div>
      ) : null}
    </div>
  );
}

export default function Today() {
  const navigate = useNavigate();
  const progress = useProgress();
  const daily = useDailyOutfit();
  const wardrobe = useWardrobe();
  /* Tapping an occasion asks how it should be built, so `pending` holds the tap
     and `occasion` holds the fit being shown. `mode` is which of the two ways
     that was chosen; the nonce makes each re-roll its own request. */
  const [pending, setPending] = useState(null);
  const [occasion, setOccasion] = useState(null);
  const [mode, setMode] = useState('closet');
  const [nonce, setNonce] = useState(0);

  /* Only the mode in play fetches — the other stays disabled until it is
     chosen, so tapping an occasion never costs two requests. A nonce past the
     first is a re-roll, which is what `refresh` means on the closet route. */
  const occasionQuery = useOccasionOutfit(mode === 'closet' ? occasion : null, {
    refresh: nonce > 0,
    nonce,
  });
  const ideasQuery = useOccasionIdeas(mode === 'ideas' ? occasion : null, { nonce });
  const ideas = ideasQuery.data?.ideas ?? [];
  /* A server that answers without an `ideas` array predates this endpoint —
     it is still serving the old placeholder. Saying "no ideas" there would
     blame the stylist for a build the server has not received yet. */
  const ideasUnsupported = Boolean(ideasQuery.data) && !Array.isArray(ideasQuery.data.ideas);

  const closeSheet = () => {
    setPending(null);
    setOccasion(null);
  };

  const chooseMode = (next) => {
    setMode(next);
    setNonce((value) => value + 1);
    setOccasion(pending);
    setPending(null);
  };

  const refresh = useCallback(
    () => Promise.all([progress.refetch(), daily.refetch(), wardrobe.refetch()]),
    [progress, daily, wardrobe],
  );

  const level = progress.data?.level ?? 1;
  const toNext = progress.data?.pointsToNextLevel ?? 100;
  const levelFill = Math.max(4, Math.round(((100 - toNext) / 100) * 100));
  const wardrobeCount = wardrobe.data?.length ?? daily.data?.wardrobeCount ?? 0;
  const suggestion = daily.data?.suggestion ?? null;

  /* The last seven days, read off the same records the rest of the app uses —
     rated fits and pieces added, not an estimate of either. */
  const ratings = useRatingHistory();
  const week = useMemo(() => {
    const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const fits = (ratings.data ?? []).filter(
      (entry) => new Date(entry?.createdAt).getTime() >= since,
    ).length;
    const added = (wardrobe.data ?? []).filter(
      (item) => new Date(item?.createdAt).getTime() >= since,
    ).length;
    return { fits, added };
  }, [ratings.data, wardrobe.data]);

  const activeOccasion = OCCASIONS.find((entry) => entry.key === occasion) ?? null;
  const pendingOccasion = OCCASIONS.find((entry) => entry.key === pending) ?? null;
  const occasionOutfit = occasionQuery.data?.fullOutfit ?? null;
  const occasionHasPieces = Boolean(
    occasionOutfit && Object.values(occasionOutfit).some(Boolean),
  );

  /* Level is the highest-level signal on the screen, so it keeps its own slot
     above the fit on phones. On desktop it moves to the right-hand column.
     The reference's status bar: rank medallion, verified badge, the run to the
     next level, and the points already banked. */
  const levelCard = (
    <GlassCard strong className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full glass-tile">
            <span className="font-display text-lg leading-none font-medium text-brand-primary tabular-nums">
              {level}
            </span>
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5">
              <span className="truncate text-[13px] font-semibold">
                {progress.data?.badge ?? badgeForLevel(level)}
              </span>
              <CheckIcon className="h-3.5 w-3.5 shrink-0 text-brand-primary" strokeWidth={2.6} />
            </p>
            <p className="mt-0.5 truncate text-xs text-white/45">
              {toNext} pts to level {level + 1}
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full border border-brand-primary/30 bg-brand-primary/10 px-3 py-1 text-[10px] font-bold tracking-wider text-brand-primary tabular-nums uppercase">
          {progress.data?.totalPoints ?? 0} pts
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full glass-tile">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-lime to-brand-primary transition-[width] duration-700"
          style={{ width: `${levelFill}%` }}
        />
      </div>
    </GlassCard>
  );

  return (
    <PullToRefresh onRefresh={refresh}>
      <div className="page-pad">
        <div className="page-stack">
          <Reveal className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-bold tracking-[0.2em] text-white/35 uppercase">
              {new Date().toLocaleDateString(undefined, {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
              })}
            </p>
            {/* The day's real temperature, binned the same way the scorer bins
                it, so the badge and the fit's weather score agree. */}
            {typeof daily.data?.temperature === 'number' ? (
              <span className="inline-flex items-center gap-1.5 rounded-full glass-tile px-3 py-1.5">
                <span className="font-display text-[13px] font-medium text-brand-primary tabular-nums">
                  {Math.round(daily.data.temperature)}°C
                </span>
                <span className="text-[10px] tracking-wider text-white/40 uppercase">
                  {weatherBand(daily.data.temperature)}
                </span>
              </span>
            ) : null}
          </Reveal>

          {/* The week at a glance, before the day's fit: what has been rated,
              what has been added, and the run that is still alive. */}
          <Reveal delay={20}>
            <div className="glass grid grid-cols-3 divide-x divide-white/[0.07] p-0">
              {[
                { label: 'Fits rated', value: week.fits },
                { label: 'Pieces added', value: week.added },
                { label: 'Day streak', value: progress.data?.currentStreak ?? 0 },
              ].map((stat) => (
                <div key={stat.label} className="px-3 py-3 text-center">
                  <span className="font-display block text-xl leading-none font-medium text-brand-primary tabular-nums">
                    {stat.value}
                  </span>
                  <span className="mt-1.5 block truncate text-[10px] font-medium tracking-wider text-white/40 uppercase">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>

          {/* Two weeks of fits as a shape — the week strip counts, this shows. */}
          <Reveal delay={30}>
            <FitCalendar entries={ratings.data ?? []} />
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
              <ClosetCoverage items={wardrobe.data ?? []} className="mt-4" />
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
                        <p className="font-display text-2xl leading-tight font-medium tracking-tight">
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

                        {/* The two things you can do with a finished look: have
                            it judged, or ask the stylist for another one. */}
                        <div className="flex items-center gap-2.5 pt-0.5">
                          <Cta
                            tone="lime"
                            className="flex-1"
                            onClick={() => navigate('/rate/photo')}
                          >
                            Rate this look
                          </Cta>
                          <button
                            type="button"
                            onClick={() => daily.refetch()}
                            disabled={daily.isFetching}
                            aria-label="Shuffle today's fit"
                            className="press grid h-12 w-12 shrink-0 place-items-center rounded-full glass-tile text-brand-primary disabled:opacity-40"
                          >
                            <RefreshIcon
                              className={`h-4.5 w-4.5 ${daily.isFetching ? 'animate-spin' : ''}`}
                            />
                          </button>
                        </div>
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
            {/* The app's headline feature, so it gets the one raised, glowing
                panel on this screen. Tapping an occasion asks how to build the
                fit before anything is fetched. */}
            <Reveal className="lg:col-start-1 lg:row-start-2" delay={80}>
              <div className="relative overflow-hidden rounded-3xl border border-brand-primary/25 bg-gradient-to-br from-brand-primary/[0.14] via-ink-900/70 to-brand-indigo/[0.16] p-4 shadow-[0_20px_48px_-26px_rgba(223,195,169,0.4)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-primary/30 bg-brand-primary/10 py-1 pr-2.5 pl-2">
                      <SparkleIcon className="h-3.5 w-3.5 text-brand-primary" />
                      <span className="text-[10px] font-bold tracking-[0.18em] text-brand-primary uppercase">
                        Style me for…
                      </span>
                    </span>
                    <p className="mt-2 text-xs leading-relaxed text-white/50">
                      {wardrobeCount > 0
                        ? 'Pick an occasion, then how I build it.'
                        : 'Add a few pieces and I’ll style them for any occasion.'}
                    </p>
                  </div>
                  {wardrobeCount > 0 ? (
                    <span className="shrink-0 rounded-full border border-white/[0.07] bg-ink-950/50 px-2.5 py-1 text-[11px] font-semibold text-white/50 tabular-nums">
                      {wardrobeCount}
                    </span>
                  ) : null}
                </div>

                <OccasionRail
                  bleed={false}
                  className="mt-3"
                  active={occasion}
                  loadingKey={occasionQuery.isFetching ? occasion : null}
                  onSelect={(key) => setPending(key)}
                />
              </div>
            </Reveal>

            <Reveal className="lg:col-start-2 lg:row-start-2" delay={120}>
              <ShoppingPanel />
            </Reveal>

            <Reveal className="lg:col-start-2 lg:row-start-3" delay={160}>
              <ActivityPanel />
            </Reveal>
          </div>

          {/* Below the grid: the proof the scoring means anything — the fits
              that scored best, as photographs. */}
          <Reveal delay={180}>
            <TopFits
              entries={ratings.data ?? []}
              onOpen={(entry) =>
                navigate(entry ? `/rate/history/${entry._id}` : '/rate/history')
              }
            />
          </Reveal>
        </div>
      </div>

      {/* Occasion result — bottom sheet on phones, centred modal on desktop. */}
      <ResponsiveSheet
        opened={Boolean(pending || occasion)}
        onBackdropClick={closeSheet}
        className="pb-safe"
      >
        {pending && !occasion ? (
          /* ── How should it be built? ─────────────────────────────────── */
          <div className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-primary/15 text-xl ring-1 ring-brand-primary/25">
                  {pendingOccasion?.emoji ?? '✨'}
                </span>
                <div>
                  <p className="font-display text-lg font-medium tracking-tight">
                    {pendingOccasion ? `${pendingOccasion.label} fit` : 'Your fit'}
                  </p>
                  <p className="text-[11px] text-white/40">How should I build it?</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeSheet}
                className="press shrink-0 rounded-full glass-tile px-3 py-1.5 text-xs font-bold text-white/60 ring-1 ring-white/10"
              >
                Close
              </button>
            </div>

            <div className="space-y-2.5">
              {BUILD_MODES.map(({ key, Icon, title, body }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => chooseMode(key)}
                  className="press group flex w-full items-center justify-between gap-4 rounded-2xl glass-tile p-4 text-left transition-colors glass-hover"
                >
                  <span className="flex min-w-0 items-center gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl glass-tile text-brand-primary transition-colors group-hover:bg-brand-primary group-hover:text-ink-950">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[15px] font-semibold">{title}</span>
                      <span className="mt-0.5 block text-xs text-white/45">{body}</span>
                    </span>
                  </span>
                  <ChevronRightIcon className="h-4 w-4 shrink-0 text-white/30 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-brand-primary" />
                </button>
              ))}
            </div>
          </div>
        ) : (
        <div className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-primary/15 text-xl ring-1 ring-brand-primary/25">
                {activeOccasion?.emoji ?? '✨'}
              </span>
              <div>
                <p className="font-display text-lg font-medium tracking-tight">
                  {activeOccasion ? `${activeOccasion.label} fit` : 'Your fit'}
                </p>
                <p className="text-[11px] text-white/40">
                  {mode === 'ideas'
                    ? 'Written from your profile'
                    : wardrobeCount > 0
                      ? `Styled from your ${wardrobeCount} piece${wardrobeCount === 1 ? '' : 's'}`
                      : 'Styled from your closet'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeSheet}
              className="press shrink-0 rounded-full glass-tile px-3 py-1.5 text-xs font-bold text-white/60 ring-1 ring-white/10"
            >
              Close
            </button>
          </div>

          {mode === 'ideas' ? (
            /* Ideas mode: written from the profile, the occasion and today's
               weather — deliberately not assembled from the closet. */
            ideasQuery.isLoading ? (
              <div className="space-y-3">
                <p className="text-sm text-white/55">
                  {activeOccasion
                    ? `Writing ${activeOccasion.label.toLowerCase()} ideas…`
                    : 'Writing ideas…'}
                </p>
                <SkeletonCard lines={3} />
              </div>
            ) : ideasQuery.isError ? (
              <ErrorState
                message={apiError(ideasQuery.error, 'Could not write ideas right now')}
                onRetry={() => ideasQuery.refetch()}
              />
            ) : ideas.length ? (
              <div className="space-y-2.5">
                {ideasQuery.data?.weatherNote ? (
                  <div className="flex flex-wrap gap-1.5">
                    <Pill tone="cyan">{ideasQuery.data.weatherNote}</Pill>
                    <Pill>Not from your closet</Pill>
                  </div>
                ) : null}

                {ideas.map((idea, index) => (
                  <div
                    key={idea?.title ?? index}
                    className="rounded-2xl glass-tile p-3.5"
                  >
                    <p className="font-display text-[15px] font-medium tracking-tight">
                      {idea?.title}
                    </p>
                    {idea?.pieces?.length ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {idea.pieces.map((piece) => (
                          <span
                            key={piece}
                            className="rounded-full border border-white/[0.07] bg-ink-950/50 px-2.5 py-1 text-[11px] text-white/70"
                          >
                            {piece}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {idea?.why ? (
                      <p className="mt-2 text-[11px] leading-relaxed text-white/45 text-pretty">
                        {idea.why}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<SparkleIcon className="h-7 w-7" />}
                title={ideasUnsupported ? 'Ideas need the newer backend' : 'No ideas yet'}
                body={
                  ideasUnsupported
                    ? 'The server answered without an ideas list, which means its build is older than this feature. Deploy the latest backend and this fills in.'
                    : (ideasQuery.data?.message ?? 'Give it a moment and try again.')
                }
              />
            )
          ) : occasionQuery.isLoading ? (
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

          {/* Rebuild, or switch where the answer comes from: the closet, or the
              stylist writing from the profile. */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setNonce((value) => value + 1)}
              disabled={mode === 'ideas' ? ideasQuery.isFetching : occasionQuery.isFetching}
              className="press flex flex-1 items-center justify-center gap-2 rounded-full glass-tile py-3 text-xs font-semibold text-brand-primary disabled:opacity-50"
            >
              <RefreshIcon
                className={`h-3.5 w-3.5 ${
                  (mode === 'ideas' ? ideasQuery.isFetching : occasionQuery.isFetching)
                    ? 'animate-spin'
                    : ''
                }`}
              />
              Another one
            </button>
            <button
              type="button"
              onClick={() => {
                setMode((current) => (current === 'ideas' ? 'closet' : 'ideas'));
                setNonce((value) => value + 1);
              }}
              className="press flex-1 rounded-full glass-tile py-3 text-xs font-semibold text-white/60"
            >
              {mode === 'ideas' ? 'Use my closet' : 'Ideas for me'}
            </button>
          </div>
        </div>
        )}
      </ResponsiveSheet>
    </PullToRefresh>
  );
}
