import { useId, useState } from 'react';
import { ChevronRightIcon } from './Icons';

/**
 * The app's progressive-disclosure primitive: a summary row that reveals its
 * children in place.
 *
 * The reveal animates by transitioning `grid-template-rows` from `0fr` to
 * `1fr`, which lets the browser interpolate to the content's natural height
 * without measuring it — no refs, no `scrollHeight`, so it is safe to
 * server-render (the smoke test renders every route that way).
 *
 * Uncontrolled by default; pass `open` to drive it from outside.
 */
export default function Disclosure({
  label,
  summary,
  icon = null,
  defaultOpen = false,
  open: openProp,
  onToggle,
  variant = 'row',
  className = '',
  children,
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = openProp ?? internalOpen;
  const panelId = useId();

  const toggle = () => {
    if (onToggle) onToggle(!open);
    if (openProp === undefined) setInternalOpen((value) => !value);
  };

  const isInline = variant === 'inline';

  return (
    <div className={className}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={panelId}
        className={
          isInline
            ? 'press inline-flex items-center gap-1 text-xs font-bold tracking-wide text-brand-lime uppercase'
            : 'press flex w-full items-center gap-2.5 rounded-2xl py-2.5 text-left'
        }
      >
        {icon ? (
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full glass-tile text-white/50 ring-1 ring-white/10">
            {icon}
          </span>
        ) : null}

        <span className={isInline ? '' : 'min-w-0 flex-1'}>
          <span
            className={
              isInline
                ? ''
                : 'block truncate text-xs font-bold tracking-wide text-white/55'
            }
          >
            {label}
          </span>
          {summary && !isInline ? (
            <span className="mt-0.5 block truncate text-[11px] text-white/35">{summary}</span>
          ) : null}
          {summary && isInline ? <span className="sr-only">{summary}</span> : null}
        </span>

        <ChevronRightIcon
          className={`h-4 w-4 shrink-0 text-white/30 transition-transform duration-200 ${
            open ? 'rotate-90' : ''
          }`}
        />
      </button>

      <div
        id={panelId}
        inert={!open}
        className={`grid transition-[grid-template-rows] duration-300 ease-out-soft ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="min-h-0 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
