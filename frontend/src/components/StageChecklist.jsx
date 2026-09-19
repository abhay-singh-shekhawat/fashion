import { CheckIcon } from './Icons';

/**
 * Vertical stage list that lights up as socket events arrive.
 * `stages` is [{ key, label }], `done` is a { [key]: boolean } map.
 */
export default function StageChecklist({ stages, done = {}, error = null }) {
  const activeIndex = stages.findIndex((stage) => !done[stage.key]);

  return (
    <div className="space-y-1">
      {stages.map((stage, index) => {
        const complete = Boolean(done[stage.key]);
        const isActive = index === activeIndex && !error;

        return (
          <div
            key={stage.key}
            className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors duration-300 ${
              isActive ? 'glass-tile' : ''
            }`}
          >
            <span
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ring-1 transition-all duration-300 ${
                complete
                  ? 'bg-brand-lime/20 text-brand-lime ring-brand-lime/40'
                  : isActive
                    ? 'bg-brand-primary/20 text-brand-primary ring-brand-primary/40'
                    : 'glass-tile text-white/25 ring-white/10'
              }`}
            >
              {complete ? (
                <CheckIcon className="h-3.5 w-3.5" strokeWidth={2.6} />
              ) : (
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isActive ? 'animate-ping bg-brand-primary' : 'bg-white/25'
                  }`}
                />
              )}
            </span>
            <span
              className={`text-sm font-medium transition-colors duration-300 ${
                complete ? 'text-white/70' : isActive ? 'text-white' : 'text-white/35'
              }`}
            >
              {stage.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
