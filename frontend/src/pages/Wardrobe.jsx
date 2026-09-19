import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWardrobe } from '../hooks/useWardrobe';
import { apiError } from '../services/api';
import {
  CATEGORIES,
  CATEGORY_EMOJI,
  CATEGORY_LABELS,
  DETECTED_BY_LABELS,
  FORMALITY_LABELS,
} from '../config/theme';
import ClosetInsights from '../components/ClosetInsights';
import Disclosure from '../components/Disclosure';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import Fab from '../components/Fab';
import GlassCard from '../components/GlassCard';
import ItemCard from '../components/ItemCard';
import Pill from '../components/Pill';
import ResponsiveSheet from '../components/ResponsiveSheet';
import Reveal from '../components/Reveal';
import RemoveItemButton from '../components/RemoveItemButton';
import { SkeletonGrid } from '../components/Skeleton';
import { CameraIcon, ClosetIcon, PlusIcon, StarIcon, TrashIcon } from '../components/Icons';

const FILTERS = [
  { key: 'all', label: 'All' },
  ...CATEGORIES.map((key) => ({ key, label: CATEGORY_LABELS[key] })),
];

export default function Wardrobe() {
  const navigate = useNavigate();
  const { data: items = [], isLoading, isError, error, refetch, isFetching } = useWardrobe();

  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState([]);
  const [detail, setDetail] = useState(null);
  const [addSheet, setAddSheet] = useState(false);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesFilter = filter === 'all' || item.category === filter;
      const matchesQuery = !needle || item.name?.toLowerCase().includes(needle);
      return matchesFilter && matchesQuery;
    });
  }, [items, filter, query]);

  /* Live counts per category, so the filter row states what each chip would
     show before it is tapped. */
  const counts = useMemo(() => {
    const map = { all: items.length };
    for (const item of items) {
      map[item.category] = (map[item.category] ?? 0) + 1;
    }
    return map;
  }, [items]);

  const toggleSelect = (id) => {
    setSelected((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    );
  };

  const exitSelecting = () => {
    setSelecting(false);
    setSelected([]);
  };

  return (
    <div className="page-pad">
      <div className="page-stack">
        {isFetching && !isLoading ? (
          <div className="fixed inset-x-0 top-0 z-30 h-0.5 overflow-hidden">
            <div className="h-full w-1/3 animate-shimmer bg-brand-primary" />
          </div>
        ) : null}

        {/* The vault capsule: what is in the closet, stated once, before the
            controls that filter it. */}
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full glass-tile px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-primary" />
            <span className="text-[10px] font-bold tracking-[0.18em] text-brand-primary uppercase">
              Vault live
            </span>
            <span className="text-white/20">•</span>
            <span className="text-[10px] font-medium text-white/50">
              {items.length} piece{items.length === 1 ? '' : 's'}
            </span>
          </span>
        </Reveal>

        <Reveal className="flex items-center gap-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search your closet"
            className="w-full rounded-2xl border border-white/[0.08] bg-ink-900/70 px-5 py-3 text-base text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_0_20px_-12px_rgba(223,195,169,0.35)] outline-none backdrop-blur-md transition-colors placeholder:text-white/25 focus:border-brand-primary/60"
          />
          <button
            type="button"
            onClick={() => (selecting ? exitSelecting() : setSelecting(true))}
            disabled={!items.length}
            className={`press shrink-0 rounded-full px-4 py-3 text-xs font-bold ring-1 transition-colors disabled:opacity-40 ${
              selecting
                ? 'bg-brand-primary/20 text-brand-primary ring-brand-primary/40'
                : 'glass-tile text-white/60 ring-white/10'
            }`}
          >
            {selecting ? 'Cancel' : 'Select'}
          </button>
        </Reveal>

        <Reveal
          className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8"
          delay={40}
        >
          {FILTERS.map((entry) => {
            const active = filter === entry.key;
            const count = counts[entry.key] ?? 0;
            return (
              <button
                key={entry.key}
                type="button"
                onClick={() => setFilter(entry.key)}
                disabled={items.length > 0 && count === 0 && entry.key !== 'all'}
                className={`press shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold tracking-tight transition-colors disabled:opacity-30 ${
                  active
                    ? 'bg-brand-lime text-ink-950'
                    : 'glass-tile text-white/60 hover:text-white/85'
                }`}
              >
                {entry.label} ({count})
              </button>
            );
          })}
        </Reveal>

        {isLoading ? (
          <SkeletonGrid />
        ) : isError ? (
          <ErrorState message={apiError(error, 'Could not load your closet')} onRetry={refetch} />
        ) : !items.length ? (
          <EmptyState
            icon={<ClosetIcon className="h-7 w-7" />}
            title="Nothing hanging here yet"
            body="Scan an outfit photo and I'll pull the pieces out automatically."
          >
            <button
              type="button"
              onClick={() => navigate('/scan')}
              className="press flex items-center gap-2 rounded-full bg-brand-lime px-5 py-3 text-sm font-bold text-black"
            >
              <CameraIcon className="h-4 w-4" /> Scan a fit
            </button>
            <button
              type="button"
              onClick={() => navigate('/wardrobe/add')}
              className="press text-xs font-bold text-white/50"
            >
              or add manually
            </button>
          </EmptyState>
        ) : !filtered.length ? (
          <EmptyState title="No matches" body="Nothing here fits that filter." />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {/* Each tile rises in turn. The stagger is capped so a 60-piece
                closet doesn't leave the last row waiting. */}
            {filtered.map((item, index) => (
              <Reveal key={item._id} delay={Math.min(index, 6) * 35} className="relative">
                <ItemCard
                  item={item}
                  selectable={selecting}
                  selected={selected.includes(item._id)}
                  onClick={() => (selecting ? toggleSelect(item._id) : setDetail(item))}
                />
                {/* A sibling of the tile, not a child: a button nested inside
                    another button is invalid HTML and swallows the tap. The
                    selection tick owns this corner while picking items to rate. */}
                {!selecting ? (
                  <RemoveItemButton
                    item={item}
                    className="press absolute top-2 right-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-black/50 text-white/70 ring-1 ring-white/15 backdrop-blur-md transition-colors hover:text-white"
                  />
                ) : null}
              </Reveal>
            ))}
          </div>
        )}

        {/* What the closet is made of, once the browsing is done. Folds away
            while picking pieces so the grid keeps the screen. */}
        {!selecting && items.length ? (
          <ClosetInsights items={items} onAdd={() => navigate('/wardrobe/add')} />
        ) : null}
      </div>

      {!selecting ? (
        <Fab
          onClick={() => setAddSheet(true)}
          icon={<PlusIcon className="h-5 w-5" strokeWidth={2.6} />}
          label="Add"
        />
      ) : (
        <button
          type="button"
          onClick={() => navigate('/rate/saved', { state: { ids: selected } })}
          disabled={selected.length < 2}
          className="press fixed right-4 bottom-safe-24 z-20 flex items-center gap-2 rounded-full bg-brand-lime px-5 py-4 text-sm font-bold text-black disabled:opacity-40 lg:right-8 lg:bottom-8"
        >
          <StarIcon className="h-4 w-4" /> Rate {selected.length} item
          {selected.length === 1 ? '' : 's'}
        </button>
      )}

      {/* Add source sheet */}
      <ResponsiveSheet
        opened={addSheet}
        onBackdropClick={() => setAddSheet(false)}
        className="pb-safe"
      >
        <div className="space-y-3 p-5">
          <p className="font-display text-lg font-bold tracking-tight">Add to closet</p>
          <button
            type="button"
            onClick={() => {
              setAddSheet(false);
              navigate('/scan');
            }}
            className="glass press hover-lift flex w-full items-center gap-3 p-4 text-left"
          >
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-cyan/15 text-brand-cyan ring-1 ring-brand-cyan/25">
              <CameraIcon className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-bold">Scan a photo</span>
              <span className="block text-xs text-white/40">Auto-detects every piece</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAddSheet(false);
              navigate('/wardrobe/add');
            }}
            className="glass press hover-lift flex w-full items-center gap-3 p-4 text-left"
          >
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-primary/15 text-brand-primary ring-1 ring-brand-primary/25">
              <PlusIcon className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-bold">Add manually</span>
              <span className="block text-xs text-white/40">Name it and tag it yourself</span>
            </span>
          </button>
        </div>
      </ResponsiveSheet>

      {/* Item detail sheet — the item and its tags lead, provenance folds away. */}
      <ResponsiveSheet
        opened={Boolean(detail)}
        onBackdropClick={() => setDetail(null)}
        className="pb-safe"
      >
        {detail ? (
          <div className="space-y-4 p-5">
            <div className="grid aspect-[4/5] max-h-[45vh] w-full place-items-center overflow-hidden rounded-3xl bg-gradient-to-br from-white/[0.08] to-transparent ring-1 ring-white/10">
              {detail.imageUrl ? (
                <img
                  src={detail.imageUrl}
                  alt={detail.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-6xl opacity-60">
                  {CATEGORY_EMOJI[detail.category] ?? '🧺'}
                </span>
              )}
            </div>

            <div>
              <p className="font-display text-xl font-bold tracking-tight">{detail.name}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Pill tone="violet">{CATEGORY_LABELS[detail.category] ?? detail.category}</Pill>
                {detail.formality ? (
                  <Pill>{FORMALITY_LABELS[detail.formality] ?? detail.formality}</Pill>
                ) : null}
                {detail.color && detail.color !== 'unknown' ? (
                  <Pill tone="cyan">{detail.color}</Pill>
                ) : null}
              </div>
            </div>

            <Disclosure
              label="Details"
              summary={
                detail.createdAt
                  ? `Added ${new Date(detail.createdAt).toLocaleDateString()}`
                  : undefined
              }
            >
              <GlassCard className="mt-3 space-y-2.5">
                <Row
                  label="Detected by"
                  value={DETECTED_BY_LABELS[detail.detectedBy] ?? detail.detectedBy}
                />
                {typeof detail.confidence === 'number' ? (
                  <Row label="Confidence" value={`${Math.round(detail.confidence * 100)}%`} />
                ) : null}
                {detail.createdAt ? (
                  <Row label="Added" value={new Date(detail.createdAt).toLocaleDateString()} />
                ) : null}
              </GlassCard>
            </Disclosure>

            <RemoveItemButton
              item={detail}
              onRemoved={() => setDetail(null)}
              className="press flex w-full items-center justify-center gap-2 rounded-full bg-brand-error/10 py-3.5 text-sm font-bold text-brand-error ring-1 ring-brand-error/25"
            >
              <TrashIcon className="h-4 w-4" /> Remove from closet
            </RemoveItemButton>

            <button
              type="button"
              onClick={() => setDetail(null)}
              className="press w-full rounded-full glass-tile py-3.5 text-sm font-bold ring-1 ring-white/10"
            >
              Close
            </button>
          </div>
        ) : null}
      </ResponsiveSheet>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-white/40">{label}</span>
      <span className="text-xs font-semibold text-white/80">{value ?? '—'}</span>
    </div>
  );
}
