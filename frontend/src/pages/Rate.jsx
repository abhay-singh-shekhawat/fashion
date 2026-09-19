import { useNavigate } from 'react-router-dom';
import { useRatingHistory } from '../hooks/useRatingHistory';
import { RATING_RETENTION_DAYS, SCORE_BREAKDOWN_LABELS, bandFor, timeAgo } from '../config/theme';
import { apiError } from '../services/api';
import Disclosure from '../components/Disclosure';
import ErrorState from '../components/ErrorState';
import Pill from '../components/Pill';
import RatingInsights from '../components/RatingInsights';
import Reveal from '../components/Reveal';
import {
  CameraIcon,
  ChevronRightIcon,
  ClockIcon,
  ClosetIcon,
  SparkleIcon,
} from '../components/Icons';

/* One accent per destination so the tiles read as different answers rather
   than a repeated list row — the reference does the same with its icon tiles. */
const DESTINATIONS = [
  {
    path: '/rate/photo',
    title: 'Snap & rate a fit',
    body: 'Capture it or upload a full-body photo',
    Icon: CameraIcon,
    badge: 'Instant',
  },
  {
    path: '/rate/saved',
    title: 'Rate from your closet',
    body: 'Mix pieces you own before styling',
    Icon: ClosetIcon,
  },
];

/* The four things the backend actually scores
   (backend/src/utils/outfitScorer.js). One clause each — the accordion is a
   legend for the meters above it, not an essay. */
const PILLARS = [
  {
    key: 'colorHarmony',
    emoji: '🎨',
    label: 'Colour harmony',
    body: 'How the pieces’ colours sit together.',
  },
  {
    key: 'weatherSuitability',
    emoji: '🌤️',
    label: 'Weather fit',
    body: 'Checked against today’s real weather.',
  },
  {
    key: 'formalityMatch',
    emoji: '👔',
    label: 'Occasion formality',
    body: 'How far the outfit sits from the occasion.',
  },
  {
    key: 'skinToneFit',
    emoji: '✨',
    label: 'Skin tone fit',
    body: 'How well the palette flatters your tone.',
  },
];

export default function Rate() {
  const navigate = useNavigate();
  const { data: saved = [], isLoading, isError, error, refetch } = useRatingHistory();

  const starredCount = saved.filter((entry) => entry.isFavourite).length;
  const latest = saved[0] ?? null;
  const band = latest ? bandFor(latest.score ?? 0) : null;

  /* The three dimensions the showcase card can speak to, taken straight from
     the stored breakdown — nothing here is estimated for display. */
  const breakdown = latest?.breakdown ?? {};
  const highlights = ['colorHarmony', 'weatherSuitability', 'formalityMatch']
    .filter((key) => typeof breakdown[key] === 'number')
    .map((key) => ({
      key,
      label: SCORE_BREAKDOWN_LABELS[key],
      value: Math.round(breakdown[key]),
    }));

  /* `tips` is a paragraph string on some stored ratings and an array on
     others — indexing a string would render a single letter as the note. */
  const tips = latest?.improvementTips?.tips;
  const firstTip = Array.isArray(tips) ? tips.filter(Boolean)[0] : typeof tips === 'string' ? tips : null;
  const quickWins = latest?.improvementTips?.feedback?.quickWins;
  const stylistNote =
    (Array.isArray(quickWins) ? quickWins.filter(Boolean)[0] : null) ??
    firstTip ??
    latest?.colorHarmony?.note ??
    null;

  return (
    <div className="page-pad">
      <div className="page-stack">
        {/* ── Ambient header ─────────────────────────────────────────────── */}
        <Reveal>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-2.5 py-1 ring-1 ring-white/[0.07]">
            <SparkleIcon className="h-3.5 w-3.5 text-brand-primary" />
            <span className="text-[10px] font-bold tracking-[0.18em] text-white/55 uppercase">
              Fit analysis engine
            </span>
          </span>
          <h1 className="font-display mt-3 text-4xl leading-[1.05] font-medium tracking-tight">
            Rate.
            <br />
            <span className="text-white/45 italic">a precise, ruthless critique.</span>
          </h1>
        </Reveal>

        {/* ── Action cards ───────────────────────────────────────────────── */}
        <div className="space-y-2.5">
          {DESTINATIONS.map(({ path, title, body, Icon, badge }, index) => (
            <Reveal key={path} delay={index * 50}>
              <button
                type="button"
                onClick={() => navigate(path)}
                className="press group flex w-full items-center justify-between gap-4 rounded-2xl glass-tile p-4 text-left transition-colors duration-200 glass-hover"
              >
                <span className="flex min-w-0 items-center gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl glass-tile text-brand-primary transition-colors group-hover:bg-brand-primary group-hover:text-ink-950">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-semibold">{title}</span>
                    <span className="mt-0.5 block truncate text-xs text-white/45">{body}</span>
                  </span>
                </span>

                <span className="flex shrink-0 items-center gap-2">
                  {badge ? (
                    <Pill tone="violet" className="hidden sm:inline-flex">
                      {badge}
                    </Pill>
                  ) : null}
                  <ChevronRightIcon className="h-4 w-4 text-white/30 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-brand-primary" />
                </span>
              </button>
            </Reveal>
          ))}

          {/* Saved ratings is the one destination with a live figure. */}
          <Reveal delay={100}>
            <button
              type="button"
              onClick={() => navigate('/rate/history')}
              className="press group flex w-full items-center justify-between gap-4 rounded-2xl glass-tile p-4 text-left transition-colors duration-200 glass-hover"
            >
              <span className="flex min-w-0 items-center gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl glass-tile text-brand-lime transition-colors group-hover:bg-brand-lime group-hover:text-ink-950">
                  <ClockIcon className="h-6 w-6" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-semibold">Saved ratings</span>
                  <span className="mt-0.5 block truncate text-xs text-white/45">
                    {isLoading ? 'Loading…' : `${saved.length} kept`}
                  </span>
                </span>
              </span>

              <span className="flex shrink-0 items-center gap-2">
                {isLoading ? (
                  <Pill className="animate-pulse">…</Pill>
                ) : (
                  <>
                    {saved.length ? <Pill>{saved.length}</Pill> : null}
                    {starredCount ? <Pill tone="lime">★ {starredCount}</Pill> : null}
                  </>
                )}
                <ChevronRightIcon className="h-4 w-4 text-white/30 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-brand-primary" />
              </span>
            </button>
          </Reveal>
        </div>

        {/* ── Recent verdict showcase ────────────────────────────────────── */}
        {latest ? (
          <Reveal delay={60}>
            <div className="glass-strong p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold tracking-[0.18em] text-white/40 uppercase">
                  Recent fit verdict
                </span>
                <Pill tone={band.toneName}>{band.label}</Pill>
              </div>

              {/* The card is not one big button: the More row below has to be
                  its own, and a button inside a button is invalid. */}
              <button
                type="button"
                onClick={() => navigate(`/rate/history/${latest._id}`)}
                className="press mt-3.5 flex w-full gap-3.5 text-left"
              >
                <span className="relative block h-36 w-28 shrink-0 overflow-hidden rounded-2xl bg-ink-950 ring-1 ring-white/[0.07]">
                  {latest.imageUrl ? (
                    <img
                      src={latest.imageUrl}
                      alt="Your most recent rated fit"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-3xl opacity-60">
                      🧺
                    </span>
                  )}
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/90 to-transparent pt-6" />
                  <span className="absolute bottom-1.5 left-1.5 rounded bg-ink-950/85 px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-white/60 uppercase">
                    {timeAgo(latest.createdAt)}
                  </span>
                </span>

                <span className="flex min-w-0 flex-1 flex-col justify-between">
                  <span className="block">
                    <span className="flex items-baseline gap-1.5">
                      <span className="font-display text-4xl leading-none font-medium tracking-tight text-brand-primary tabular-nums">
                        {Math.round(latest.score ?? 0)}
                      </span>
                      <span className="text-xs text-white/35">/ 100</span>
                    </span>
                    <span className="mt-2 line-clamp-2 block text-xs leading-relaxed text-white/55 italic">
                      “
                      {latest.improvementTips?.feedback?.headline ||
                        latest.message ||
                        band.note}
                      ”
                    </span>
                  </span>

                  {highlights.length ? (
                    <span className="mt-3 grid grid-cols-3 gap-1.5">
                      {highlights.map(({ key, label, value }) => (
                        <span
                          key={key}
                          className="rounded-xl border border-white/[0.06] bg-ink-950/60 p-2 text-center"
                        >
                          <span className="block truncate text-[9px] font-bold tracking-wider text-white/40 uppercase">
                            {label}
                          </span>
                          <span className="font-display mt-0.5 block text-lg leading-none font-medium text-brand-primary tabular-nums">
                            {value}
                          </span>
                        </span>
                      ))}
                    </span>
                  ) : null}
                </span>
              </button>

              {/* Only the note the stylist wrote folds away. The score, the
                  verdict line and the dimension tiles stay on the card face —
                  the note is the one part that reads rather than scans. */}
              {stylistNote ? (
                <Disclosure label="More" className="mt-1">
                  <div className="flex items-start gap-2 pt-3">
                    <SparkleIcon className="mt-px h-3.5 w-3.5 shrink-0 text-brand-primary" />
                    <p className="text-[11px] leading-snug text-white/60 text-pretty">
                      <strong className="font-semibold text-white/85">Stylist note:</strong>{' '}
                      {stylistNote}
                    </p>
                  </div>
                </Disclosure>
              ) : null}
            </div>
          </Reveal>
        ) : null}

        {/* A failed history fetch leaves both the vault card and the showcase
            blank, so the reason and a way out are surfaced explicitly. */}
        {isError ? (
          <Reveal>
            <ErrorState
              message={apiError(error, 'Could not load your saved ratings')}
              onRetry={refetch}
            />
          </Reveal>
        ) : null}

        {/* ── What the history says ──────────────────────────────────────── */}
        <Reveal delay={70}>
          <RatingInsights entries={saved} />
        </Reveal>

        {/* ── The scoring formula ────────────────────────────────────────── */}
        <Reveal delay={80}>
          <div className="rounded-2xl glass-tile p-4">
            <Disclosure label="The 4-pillar score formula">
              <div className="space-y-2 pt-3">
                {PILLARS.map((pillar) => (
                  <div
                    key={pillar.key}
                    className="flex items-start gap-2.5 rounded-xl glass-tile p-2.5"
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-ink-950 text-sm">
                      {pillar.emoji}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold text-white/90">
                        {pillar.label}
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-snug text-white/45 text-pretty">
                        {pillar.body}
                      </span>
                    </span>
                  </div>
                ))}
                <p className="px-1 pt-1 text-[11px] text-white/30">
                  Unstarred ratings clear after {RATING_RETENTION_DAYS} days.
                </p>
              </div>
            </Disclosure>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
