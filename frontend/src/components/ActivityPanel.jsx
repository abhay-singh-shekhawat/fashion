import { useState } from 'react';
import GlassCard from './GlassCard';
import Pill from './Pill';
import Disclosure from './Disclosure';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import StatTile from './StatTile';
import { SkeletonCard } from './Skeleton';
import { ClockIcon, ClosetIcon, SparkleIcon, StarIcon } from './Icons';
import { CATEGORY_EMOJI, CATEGORY_LABELS, bandFor, timeAgo } from '../config/theme';
import { useActivityLog } from '../hooks/useActivity';
import { useProgress } from '../hooks/useProgress';
import { apiError } from '../services/api';

/* How many timeline rows the panel shows before it starts counting instead. */
const ACTIVITY_LIMIT = 7;

const EVENT_STYLES = {
  outfit_suggested: {
    Icon: SparkleIcon,
    chip: 'bg-brand-primary/15 text-brand-primary ring-brand-primary/25',
  },
  outfit_rated: {
    Icon: StarIcon,
    chip: 'bg-brand-amber/15 text-brand-amber ring-brand-amber/25',
  },
  item_added: {
    Icon: ClosetIcon,
    chip: 'bg-brand-cyan/15 text-brand-cyan ring-brand-cyan/25',
  },
};

/* One badge per row, whichever detail actually matters for that event. */
const pillFor = (event) => {
  if (event.type === 'outfit_rated') {
    const band = bandFor(event.meta?.score ?? 0);
    return { text: band.label, tone: band.toneName };
  }
  if (event.type === 'outfit_suggested' && typeof event.meta?.temperature === 'number') {
    return { text: `${Math.round(event.meta.temperature)}°C`, tone: 'cyan' };
  }
  if (event.type === 'item_added') {
    const emoji = CATEGORY_EMOJI[event.meta?.category] ?? '🧺';
    return { text: `${emoji} ${CATEGORY_LABELS[event.meta?.category] ?? 'Piece'}`, tone: 'neutral' };
  }
  return null;
};

/**
 * The log the app never showed anywhere: suggested fits, rated fits and
 * closet additions in one timeline, plus the counters behind them.
 *
 * The four counters are the headline and stay visible; the timeline is the
 * detail and folds away.
 */
export default function ActivityPanel() {
  const activity = useActivityLog();
  const progress = useProgress();
  const [showAll, setShowAll] = useState(false);

  const all = activity.data ?? [];
  /* The panel is a glance, not an archive: the latest seven rows, with the rest
     one tap away so capping it never puts anything out of reach. */
  const events = showAll ? all : all.slice(0, ACTIVITY_LIMIT);
  const stats = [
    { label: 'Points', value: progress.data?.totalPoints ?? 0, tone: 'lime' },
    { label: 'Level', value: progress.data?.level ?? 1, tone: 'violet' },
    { label: 'Streak', value: progress.data?.currentStreak ?? 0, tone: 'amber' },
    { label: 'Pieces', value: progress.data?.totalWardrobeItems ?? 0, tone: 'cyan' },
  ];

  return (
    <GlassCard className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-[10px] font-bold tracking-[0.18em] text-white/40 uppercase">
          <ClockIcon className="h-4 w-4" />
          Activity
        </span>
        {progress.data?.badge ? <Pill tone="pink">{progress.data.badge}</Pill> : null}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="min-w-0 rounded-2xl glass-tile px-1.5 py-2 text-center ring-1 ring-white/10"
          >
            <StatTile value={stat.value} label={stat.label} tone={stat.tone} className="text-center" />
          </div>
        ))}
      </div>

      <Disclosure
        label="Recent activity"
        summary={
          all.length
            ? `${all.length > ACTIVITY_LIMIT ? `latest ${ACTIVITY_LIMIT} of ` : ''}${all.length} event${all.length === 1 ? '' : 's'}`
            : undefined
        }
      >
        <div className="pt-3">
          {activity.isLoading ? (
            <SkeletonCard lines={4} />
          ) : activity.isError ? (
            <ErrorState
              message={apiError(activity.error, 'Could not load your activity')}
              onRetry={() => activity.refetch()}
            />
          ) : events.length === 0 ? (
            <EmptyState
              icon={<ClockIcon className="h-7 w-7" />}
              title="Nothing logged yet"
              body="Ask for a fit, rate one, or scan a piece — it all shows up here."
            />
          ) : (
            <ol className="space-y-3">
              {events.map((event) => {
                const { Icon, chip } = EVENT_STYLES[event.type] ?? EVENT_STYLES.item_added;
                const pill = pillFor(event);

                return (
                  <li key={event.id} className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl ring-1 ${chip}`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-white/85">
                          {event.title}
                        </p>
                        {pill ? (
                          <Pill tone={pill.tone} className="shrink-0">
                            {pill.text}
                          </Pill>
                        ) : null}
                      </div>
                      <p className="truncate text-xs text-white/45">
                        {[event.detail, timeAgo(event.createdAt)].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          {all.length > ACTIVITY_LIMIT ? (
            <button
              type="button"
              onClick={() => setShowAll((value) => !value)}
              className="press mt-3 w-full text-center text-[11px] font-semibold text-brand-lime"
            >
              {showAll ? `Show latest ${ACTIVITY_LIMIT}` : `Show all ${all.length}`}
            </button>
          ) : null}

          {progress.data?.lastSuggestionDate ? (
            <p className="mt-3 text-[10px] text-white/30">
              Last fit suggested {timeAgo(progress.data.lastSuggestionDate)}
            </p>
          ) : null}
        </div>
      </Disclosure>
    </GlassCard>
  );
}
