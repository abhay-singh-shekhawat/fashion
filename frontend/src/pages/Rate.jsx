import { useNavigate } from 'react-router-dom';
import { useRatingHistory } from '../hooks/useRatingHistory';
import { RATING_RETENTION_DAYS } from '../config/theme';
import { apiError } from '../services/api';
import Disclosure from '../components/Disclosure';
import ErrorState from '../components/ErrorState';
import Pill from '../components/Pill';
import Reveal from '../components/Reveal';
import { CameraIcon, ClockIcon, ClosetIcon } from '../components/Icons';

/* One accent per destination so the three tiles read as different answers
   rather than a repeated list row. */
const DESTINATIONS = [
  {
    path: '/rate/photo',
    title: 'Rate a photo',
    body: 'Paste an image link — the AI scores it live',
    Icon: CameraIcon,
    chip: 'bg-brand-cyan/15 text-brand-cyan ring-brand-cyan/25',
  },
  {
    path: '/rate/saved',
    title: 'Rate from your closet',
    body: 'Pick pieces you own — instant score',
    Icon: ClosetIcon,
    chip: 'bg-brand-lime/15 text-brand-lime ring-brand-lime/25',
  },
];

export default function Rate() {
  const navigate = useNavigate();
  const { data: saved = [], isLoading, isError, error, refetch } = useRatingHistory();

  const starredCount = saved.filter((entry) => entry.isFavourite).length;

  return (
    <div className="page-pad">
      <div className="page-stack">
        <Reveal>
          <h1 className="font-display text-3xl leading-tight font-bold tracking-tighter md:text-4xl">
            get a<br />
            <span className="text-brand-lime">second opinion.</span>
          </h1>
          <p className="mt-2 max-w-xs text-sm text-white/45 text-pretty">
            Score a fit against weather, colour harmony, formality and your skin tone.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {DESTINATIONS.map(({ path, title, body, Icon, chip }, index) => (
            <Reveal key={path} delay={index * 60}>
              <button
                type="button"
                onClick={() => navigate(path)}
                className="glass press hover-lift flex h-full w-full items-center gap-4 p-5 text-left md:flex-col md:items-start md:gap-3"
              >
                <span
                  className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ring-1 ${chip}`}
                >
                  <Icon className="h-6 w-6" />
                </span>
                <span className="min-w-0">
                  <span className="font-display block text-base font-bold tracking-tight">
                    {title}
                  </span>
                  <span className="mt-0.5 block text-xs text-white/45 text-pretty">{body}</span>
                </span>
              </button>
            </Reveal>
          ))}

          {/* Saved ratings carries the counts, so it is the one tile with a
              live figure — including while it is still loading. */}
          <Reveal delay={120}>
            <button
              type="button"
              onClick={() => navigate('/rate/history')}
              className="glass press hover-lift flex h-full w-full items-center gap-4 p-5 text-left md:flex-col md:items-start md:gap-3"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-pink/15 text-brand-pink ring-1 ring-brand-pink/25">
                <ClockIcon className="h-6 w-6" />
              </span>
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="font-display text-base font-bold tracking-tight">
                    Saved ratings
                  </span>
                  {isLoading ? (
                    <Pill className="animate-pulse">…</Pill>
                  ) : (
                    <>
                      {saved.length ? <Pill>{saved.length}</Pill> : null}
                      {starredCount ? <Pill tone="lime">★ {starredCount}</Pill> : null}
                    </>
                  )}
                </span>

                <span className="mt-0.5 block text-xs text-white/45 text-pretty">
                  Starred fits stay for good — the rest clear {RATING_RETENTION_DAYS} days after
                  rating
                </span>
              </span>
            </button>
          </Reveal>
        </div>

        {/* A failed history fetch leaves the tile counts blank, so the reason
            and a way out are surfaced explicitly rather than silently. */}
        {isError ? (
          <Reveal>
            <ErrorState
              message={apiError(error, 'Could not load your saved ratings')}
              onRetry={refetch}
            />
          </Reveal>
        ) : null}

        <Reveal className="glass p-4" delay={60}>
          <Disclosure label="How scoring works" summary="The four things every fit is judged on">
            <ul className="space-y-1.5 pt-3 text-xs leading-relaxed text-white/50">
              <li>· Colour harmony across the pieces you're wearing</li>
              <li>· How well the fit suits today's weather</li>
              <li>· Whether the palette flatters your skin tone</li>
              <li>· Formality match for the occasion you pick</li>
            </ul>
          </Disclosure>
        </Reveal>
      </div>
    </div>
  );
}
