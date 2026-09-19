import { AlertIcon } from './Icons';

export default function ErrorState({ message, onRetry, className = '' }) {
  return (
    <div className={`glass flex flex-col items-center gap-3 p-6 text-center ${className}`}>
      <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-error/10 text-brand-error ring-1 ring-brand-error/25">
        <AlertIcon className="h-6 w-6" />
      </span>
      <p className="max-w-xs text-sm text-white/70 text-pretty">
        {message ?? 'Something went wrong.'}
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="press rounded-full glass-tile px-4 py-2 text-xs font-bold tracking-wide uppercase ring-1 ring-white/10"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
