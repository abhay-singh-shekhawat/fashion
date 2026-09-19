import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRatingHistory } from '../../hooks/useRatingHistory';
import { apiError } from '../../services/api';
import {
  OCCASIONS,
  RATING_RETENTION_DAYS,
  bandFor,
  retentionDaysLeft,
  typeEmoji,
} from '../../config/theme';
import Disclosure from '../../components/Disclosure';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import GlassCard from '../../components/GlassCard';
import Pill from '../../components/Pill';
import PullToRefresh from '../../components/PullToRefresh';
import RatingActions from '../../components/RatingActions';
import Reveal from '../../components/Reveal';
import { CameraIcon, ClosetIcon } from '../../components/Icons';
import { SkeletonCard } from '../../components/Skeleton';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'starred', label: 'Starred' },
];

export default function RatingHistory() {
  const navigate = useNavigate();
  const { data: items = [], isLoading, isError, error, refetch } = useRatingHistory();
  const [filter, setFilter] = useState('all');

  const shown = filter === 'starred' ? items.filter((item) => item.isFavourite) : items;
  const starredCount = items.filter((item) => item.isFavourite).length;

  return (
    <PullToRefresh onRefresh={refetch}>
      <div className="page-pad">
        <div className="mx-auto w-full max-w-[48rem] page-stack">
          {/* Reference material rather than something to act on, so it folds. */}
          <Reveal className="glass p-4">
            <Disclosure
              label="How long fits stick around"
              summary={`${RATING_RETENTION_DAYS} days, or forever if starred`}
            >
              <ul className="space-y-1.5 pt-3 text-xs leading-relaxed text-white/50">
                <li>· Star a fit and it stays in your history for good</li>
                <li>
                  · Everything else clears out {RATING_RETENTION_DAYS} days after you rated it
                </li>
                <li>· Deleting removes the score and its photo right away</li>
              </ul>
            </Disclosure>
          </Reveal>

          {items.length ? (
            <Reveal className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
              {FILTERS.map((entry) => {
                const active = filter === entry.key;
                return (
                  <button
                    key={entry.key}
                    type="button"
                    onClick={() => setFilter(entry.key)}
                    className={`press shrink-0 rounded-full px-3.5 py-2 text-xs font-bold tracking-tight ring-1 transition-colors ${
                      active
                        ? 'bg-brand-lime/20 text-brand-lime ring-brand-lime/40'
                        : 'glass-tile text-white/55 ring-white/10 hover:text-white/80'
                    }`}
                  >
                    {entry.label}
                    {entry.key === 'starred' && starredCount ? ` · ${starredCount}` : ''}
                  </button>
                );
              })}
            </Reveal>
          ) : null}

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <SkeletonCard key={index} lines={3} />
              ))}
            </div>
          ) : isError ? (
            <ErrorState
              message={apiError(error, 'Could not load your saved fits')}
              onRetry={refetch}
            />
          ) : !items.length ? (
            <EmptyState
              icon={<CameraIcon className="h-7 w-7" />}
              title="No saved fits yet"
              body="Every fit you rate lands here — star the ones worth remembering."
            >
              <button
                type="button"
                onClick={() => navigate('/rate/photo')}
                className="press flex items-center gap-2 rounded-full bg-brand-lime px-5 py-3 text-sm font-bold text-black"
              >
                <CameraIcon className="h-4 w-4" /> Rate a fit
              </button>
              <button
                type="button"
                onClick={() => navigate('/rate/saved')}
                className="press flex items-center gap-1.5 text-xs font-bold text-white/50"
              >
                <ClosetIcon className="h-3.5 w-3.5" /> or score a closet combo
              </button>
            </EmptyState>
          ) : !shown.length ? (
            <EmptyState
              title="Nothing starred yet"
              body="Star a fit and it moves here — kept no matter what."
            />
          ) : (
            <div className="space-y-3">
              {shown.map((rating, index) => (
                <Reveal key={rating._id} delay={Math.min(index, 6) * 45}>
                  <RatingRow
                    rating={rating}
                    onOpen={() => navigate(`/rate/history/${rating._id}`)}
                  />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </div>
    </PullToRefresh>
  );
}

function RatingRow({ rating, onOpen }) {
  const band = bandFor(rating.score ?? 0);
  const occasion = OCCASIONS.find((entry) => entry.key === rating.occasion);
  const pieces = rating.outfit?.items ?? [];
  const itemCount = rating.outfit?.itemCount ?? pieces.length;
  const firstLabel = pieces[0]?.type ?? pieces[0]?.category ?? pieces[0]?.name;
  const daysLeft = retentionDaysLeft(rating.createdAt);
  const expiringSoon = daysLeft <= 3;

  return (
    <GlassCard className="flex items-start gap-3">
      {/* The whole left side opens the detail screen; the star and bin stay
          siblings so one tap can't be mistaken for the other. */}
      <button
        type="button"
        onClick={onOpen}
        className="press flex min-w-0 flex-1 items-start gap-3 text-left"
      >
        <span className="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl glass-tile ring-1 ring-white/10">
          {rating.imageUrl ? (
            <img src={rating.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-2xl">{firstLabel ? typeEmoji(firstLabel) : '🧺'}</span>
          )}
          {/* Piece count rides on the thumbnail instead of taking a pill slot. */}
          {itemCount ? (
            <span className="absolute right-1 bottom-1 rounded-full bg-black/70 px-1.5 py-0.5 text-[9px] font-bold text-white/80 backdrop-blur-md">
              {itemCount}
            </span>
          ) : null}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="font-display text-lg font-bold tabular-nums">
              {rating.score ?? 0}
            </span>
            <span className="text-[11px] text-white/30">/100</span>
            <Pill tone={band.toneName}>{band.label}</Pill>
          </span>

          <span className="mt-1 block truncate text-xs text-white/45">
            {rating.message || band.note}
          </span>

          <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {occasion ? (
              <Pill>
                {occasion.emoji} {occasion.label}
              </Pill>
            ) : null}
            <Pill>{new Date(rating.createdAt).toLocaleDateString()}</Pill>
          </span>

          <span
            className={`mt-1.5 block text-[10px] ${
              rating.isFavourite
                ? 'text-brand-lime/70'
                : expiringSoon
                  ? 'text-brand-amber/80'
                  : 'text-white/30'
            }`}
          >
            {rating.isFavourite
              ? 'Kept forever'
              : `Clears in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`}
          </span>
        </span>
      </button>

      <RatingActions rating={rating} className="shrink-0" />
    </GlassCard>
  );
}
