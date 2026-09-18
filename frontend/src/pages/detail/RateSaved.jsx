import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api, ENDPOINTS, apiError } from '../../services/api';
import { useWardrobe } from '../../hooks/useWardrobe';
import { useToast } from '../../context/ToastContext';
import Cta from '../../components/Cta';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import ItemCard from '../../components/ItemCard';
import RateOptions from '../../components/RateOptions';
import Reveal from '../../components/Reveal';
import ScoreCard from '../../components/ScoreCard';
import { SkeletonGrid } from '../../components/Skeleton';
import { ClosetIcon } from '../../components/Icons';

export default function RateSaved() {
  const location = useLocation();
  const { push } = useToast();
  const { data: items = [], isLoading, isError, error, refetch } = useWardrobe();

  const [selected, setSelected] = useState(() => location.state?.ids ?? []);
  const [occasion, setOccasion] = useState('casual');
  const [detailed, setDetailed] = useState(false);

  const rate = useMutation({
    mutationFn: async (payload) => (await api.post(ENDPOINTS.rateSaved, payload)).data.data,
    onSuccess: () => push('Fit scored 💚', 'success'),
  });

  const toggle = (id) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    );

  const submit = () =>
    rate.mutateAsync({
      clothingItemIds: selected,
      occasion,
      detailedFeedback: detailed,
    });

  if (rate.data) {
    return (
      <div className="page-pad">
        <div className="mx-auto w-full max-w-[48rem] animate-fade-up space-y-4">
          <ScoreCard
            score={rate.data.score}
            message={rate.data.message}
            breakdown={rate.data.breakdown}
            tips={rate.data.improvementTips?.tips}
            feedback={rate.data.improvementTips?.feedback}
            weather={rate.data.weather}
            colorHarmony={rate.data.colorHarmony}
            formality={rate.data.formality}
            items={rate.data.outfit?.items}
            itemCount={rate.data.outfit?.itemCount}
            mode={rate.data.improvementTips?.mode}
          />
          <button
            type="button"
            onClick={() => rate.reset()}
            className="press w-full rounded-full bg-white/[0.06] py-3.5 text-sm font-bold ring-1 ring-white/10"
          >
            Rate another combo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-pad">
      <div className="mx-auto w-full max-w-[48rem] space-y-4">
        <Reveal>
          <p className="font-display text-xl font-bold tracking-tight">Pick your pieces</p>
          <p className="mt-1 text-xs text-white/45">
            Choose at least two items and I'll score the combination.
          </p>
        </Reveal>

        {isLoading ? (
          <SkeletonGrid count={4} />
        ) : isError ? (
          <ErrorState message={apiError(error, 'Could not load your closet')} onRetry={refetch} />
        ) : !items.length ? (
          <EmptyState
            icon={<ClosetIcon className="h-7 w-7" />}
            title="Empty closet"
            body="Add pieces before rating a combination."
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item, index) => (
              <Reveal key={item._id} delay={Math.min(index, 8) * 35}>
                <ItemCard
                  item={item}
                  selectable
                  selected={selected.includes(item._id)}
                  onClick={() => toggle(item._id)}
                />
              </Reveal>
            ))}
          </div>
        )}

        {items.length ? (
          <>
            <RateOptions
              occasion={occasion}
              onOccasion={setOccasion}
              detailed={detailed}
              onDetailed={setDetailed}
              hint="Unlock deeper styling notes"
            />

            {rate.isError ? (
              <ErrorState message={apiError(rate.error, 'Could not score that combo')} />
            ) : null}

            <Cta
              className="w-full"
              disabled={selected.length < 2 || rate.isPending}
              loading={rate.isPending}
              onClick={submit}
            >
              {rate.isPending
                ? ''
                : `Score ${selected.length || ''} piece${selected.length === 1 ? '' : 's'}`}
            </Cta>
          </>
        ) : null}
      </div>
    </div>
  );
}
