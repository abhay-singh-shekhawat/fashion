import { useNavigate, useParams } from 'react-router-dom';
import { useRating, useRatingHistory } from '../../hooks/useRatingHistory';
import { apiError } from '../../services/api';
import { bandFor, retentionDaysLeft } from '../../config/theme';
import ErrorState from '../../components/ErrorState';
import GlassCard from '../../components/GlassCard';
import RatingActions from '../../components/RatingActions';
import Reveal from '../../components/Reveal';
import ScoreCard from '../../components/ScoreCard';
import { SkeletonCard } from '../../components/Skeleton';

export default function RatingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const list = useRatingHistory();

  /* Opened from the list the row is already in hand; only a direct link (or a
     cold start) needs the single-item fetch — and it waits for the list to
     settle first so a row that is about to arrive isn't fetched twice. */
  const cached = list.data?.find((entry) => entry._id === id);
  const detail = useRating(id, { enabled: !list.isLoading && !cached });
  const rating = cached ?? detail.data;

  const backToList = () => navigate('/rate/history', { replace: true });

  if (!rating) {
    if (list.isLoading || detail.isLoading) {
      return (
        <div className="page-pad">
          <div className="mx-auto w-full max-w-[48rem]">
            <SkeletonCard lines={5} />
          </div>
        </div>
      );
    }

    if (list.isError || detail.isError) {
      const error = detail.error ?? list.error;
      return (
        <div className="page-pad">
          <div className="mx-auto w-full max-w-[48rem]">
            <ErrorState
              message={apiError(error, 'Could not load that fit')}
              onRetry={() => (cached ? list.refetch() : detail.refetch())}
            />
          </div>
        </div>
      );
    }

    /* Deleted here or swept on the server — either way it isn't coming back. */
    return (
      <div className="page-pad">
        <div className="mx-auto w-full max-w-[48rem]">
          <ErrorState message="That fit is no longer saved." onRetry={backToList} />
        </div>
      </div>
    );
  }

  const band = bandFor(rating.score ?? 0);
  const daysLeft = retentionDaysLeft(rating.createdAt);

  return (
    <div className="page-pad">
      <div className="mx-auto w-full max-w-[48rem] space-y-4">
        <Reveal>
          <ScoreCard
            score={rating.score}
            message={rating.message}
            breakdown={rating.breakdown}
            tips={rating.improvementTips?.tips}
            feedback={rating.improvementTips?.feedback}
            weather={rating.weather}
            colorHarmony={rating.colorHarmony}
            formality={rating.formality}
            imageUrl={rating.imageUrl}
            items={rating.outfit?.items}
            itemCount={rating.outfit?.itemCount}
            mode={rating.improvementTips?.mode ?? (rating.mode === 'closet' ? 'closet' : 'photo')}
          />
        </Reveal>

        <Reveal delay={80}>
          <GlassCard className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold">
                Rated {new Date(rating.createdAt).toLocaleDateString()} · {band.label}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-white/40 text-pretty">
                {rating.isFavourite
                  ? 'Starred — this one stays for good'
                  : `Clears in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} unless you star it`}
              </p>
            </div>
            <RatingActions rating={rating} onDeleted={backToList} className="shrink-0" />
          </GlassCard>
        </Reveal>

        <Reveal delay={120}>
          <button
            type="button"
            onClick={backToList}
            className="press w-full rounded-full glass-tile py-3.5 text-sm font-bold ring-1 ring-white/10"
          >
            All saved fits
          </button>
        </Reveal>
      </div>
    </div>
  );
}
