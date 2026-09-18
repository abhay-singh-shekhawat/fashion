import GlassCard from './GlassCard';
import Pill from './Pill';
import Cta from './Cta';
import Disclosure from './Disclosure';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import { SkeletonCard } from './Skeleton';
import { BagIcon, RefreshIcon, SparkleIcon } from './Icons';
import { timeAgo } from '../config/theme';
import { useShoppingSuggestions } from '../hooks/useShopping';
import { apiError } from '../services/api';

/* How many product thumbnails the collapsed summary shows before it starts
   counting instead. */
const PREVIEW_COUNT = 3;

/**
 * What to buy next. Each request can spend SerpAPI searches, so nothing is
 * fetched until a button is pressed — the refresh button therefore stays
 * visible whether or not the detail is folded open.
 */
export default function ShoppingPanel() {
  const shopping = useShoppingSuggestions();

  const suggestions = shopping.data?.suggestions ?? [];
  const idle = !shopping.data && !shopping.isFetching && !shopping.isError;
  /* Refreshing keeps the current ideas on screen; only the first load is blank. */
  const firstLoad = shopping.isFetching && !shopping.data;

  const findIdeas = (options) => shopping.fetchIdeas(options);

  const products = suggestions.flatMap((suggestion) => suggestion.products ?? []);
  const preview = products.slice(0, PREVIEW_COUNT);
  const gapCount = suggestions.length;

  const refreshLabel = shopping.isFetching ? 'Finding new pieces…' : 'Find new ideas';

  return (
    <GlassCard className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-[10px] font-bold tracking-[0.18em] text-white/40 uppercase">
          <BagIcon className="h-4 w-4" />
          Shop your gaps
        </span>
        {gapCount > 0 ? (
          <Pill tone="cyan">
            {gapCount} gap{gapCount === 1 ? '' : 's'}
          </Pill>
        ) : shopping.data?.generatedAt ? (
          <span className="text-[10px] text-white/35">
            ideas {timeAgo(shopping.data.generatedAt)}
          </span>
        ) : null}
      </div>

      {idle ? (
        <>
          <p className="text-sm leading-relaxed text-white/50">
            I'll read your closet, spot what's missing and pull real pieces you can buy.
          </p>
          <Cta tone="cyan" onClick={() => findIdeas()}>
            <span className="inline-flex items-center gap-2">
              <SparkleIcon className="h-4 w-4" />
              Find products for me to wear
            </span>
          </Cta>
        </>
      ) : firstLoad ? (
        <SkeletonCard lines={3} />
      ) : shopping.isError && !shopping.data ? (
        <ErrorState
          message={apiError(shopping.error, 'Could not look for products')}
          onRetry={() => findIdeas({ fresh: true })}
        />
      ) : suggestions.length === 0 ? (
        <div className="space-y-3">
          <EmptyState
            icon={<BagIcon className="h-7 w-7" />}
            title="Nothing to shop for yet"
            body={
              shopping.data?.message ?? "Add a few pieces to your closet and I'll spot the gaps."
            }
          />
          <button
            type="button"
            onClick={() => findIdeas({ fresh: true })}
            disabled={shopping.isFetching}
            className="press flex w-full items-center justify-center gap-2 rounded-full bg-white/[0.06] py-3 text-xs font-bold ring-1 ring-white/10 disabled:opacity-60"
          >
            <RefreshIcon className={`h-3.5 w-3.5 ${shopping.isFetching ? 'animate-spin' : ''}`} />
            {shopping.isFetching ? 'Looking again…' : 'Look again'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Collapsed summary: proof there is something worth opening. */}
          {preview.length ? (
            <div className="flex items-center gap-2">
              {preview.map((product) => (
                <a
                  key={product.link ?? product.title}
                  href={product.link}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={product.title ?? 'Product'}
                  className="press grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white/[0.04] ring-1 ring-white/10"
                >
                  {product.image ? (
                    <img
                      src={product.image}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <BagIcon className="h-5 w-5 text-white/25" />
                  )}
                </a>
              ))}
              {products.length > preview.length ? (
                <span className="text-[11px] font-semibold text-white/35">
                  +{products.length - preview.length} more
                </span>
              ) : null}
            </div>
          ) : null}

          <Disclosure
            label={`What to buy · ${gapCount} gap${gapCount === 1 ? '' : 's'}`}
            summary="Gaps and the pieces that fill them"
          >
            <div className="space-y-4 pt-3">
              {suggestions.map((suggestion) => (
                <div key={suggestion.item} className="space-y-2">
                  <div>
                    <p className="text-sm font-bold tracking-tight capitalize">
                      {suggestion.item}
                    </p>
                    {suggestion.reason ? (
                      <p className="text-xs leading-relaxed text-white/45">
                        {suggestion.reason}
                      </p>
                    ) : null}
                  </div>

                  {suggestion.products?.length ? (
                    /* Bleeds to the card edges so the rail reads as scrollable. */
                    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
                      {suggestion.products.map((product) => (
                        <a
                          key={product.link ?? product.title}
                          href={product.link}
                          target="_blank"
                          rel="noreferrer"
                          className="press hover-lift w-32 shrink-0 overflow-hidden rounded-2xl bg-white/[0.04] ring-1 ring-white/10"
                        >
                          <span className="grid aspect-[4/5] w-full place-items-center overflow-hidden bg-white/[0.03]">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.title ?? ''}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <BagIcon className="h-6 w-6 text-white/25" />
                            )}
                          </span>
                          <span className="block space-y-1.5 p-2">
                            <span className="line-clamp-2 block text-[11px] leading-snug font-semibold text-white/75">
                              {product.title}
                            </span>
                            <span className="flex flex-wrap items-center gap-1">
                              {product.price ? <Pill tone="lime">{product.price}</Pill> : null}
                              {product.source ? (
                                <span className="text-[9px] text-white/35">{product.source}</span>
                              ) : null}
                            </span>
                          </span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-white/30">No products found for this one yet.</p>
                  )}
                </div>
              ))}

              {shopping.data?.message ? (
                <p className="text-[10px] text-white/30">{shopping.data.message}</p>
              ) : null}

              {shopping.isError ? (
                <p className="text-[11px] text-brand-error">
                  {apiError(shopping.error, 'Could not fetch new ideas')}
                </p>
              ) : null}
            </div>
          </Disclosure>

          <button
            type="button"
            onClick={() => findIdeas({ fresh: true })}
            disabled={shopping.isFetching}
            className="press flex w-full items-center justify-center gap-2 rounded-full bg-white/[0.06] py-3 text-xs font-bold ring-1 ring-white/10 disabled:opacity-60"
          >
            <RefreshIcon className={`h-3.5 w-3.5 ${shopping.isFetching ? 'animate-spin' : ''}`} />
            {refreshLabel}
          </button>
        </div>
      )}
    </GlassCard>
  );
}
