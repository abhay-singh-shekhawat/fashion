import { useState } from 'react';
import { Dialog, DialogButton } from 'konsta/react';
import { useDeleteRating, useFavouriteRating } from '../hooks/useRatingHistory';
import { StarIcon, TrashIcon } from './Icons';

/**
 * The two things a stored fit can do: earn a permanent place in the history, or
 * go away. Shared by the list and the detail screen so both drive the same
 * optimistic writes and can never disagree about the star.
 */
export default function RatingActions({ rating, onDeleted, className = '' }) {
  const [confirming, setConfirming] = useState(false);
  const favourite = useFavouriteRating();
  const remove = useDeleteRating();
  const busy = favourite.isPending || remove.isPending;
  const starred = Boolean(rating.isFavourite);

  const confirmDelete = () => {
    setConfirming(false);
    remove.mutate(rating._id, { onSuccess: () => onDeleted?.(rating._id) });
  };

  return (
    <>
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          type="button"
          onClick={() => favourite.mutate({ id: rating._id, isFavourite: !starred })}
          disabled={busy}
          aria-pressed={starred}
          aria-label={starred ? 'Remove from favourites' : 'Keep this fit forever'}
          className={`press grid h-9 w-9 place-items-center rounded-full ring-1 transition-colors disabled:opacity-50 ${
            starred
              ? 'bg-brand-lime/15 text-brand-lime ring-brand-lime/35'
              : 'bg-white/[0.05] text-white/40 ring-white/10'
          }`}
        >
          {/* Filled star reads as "kept"; the outline is the untouched state. */}
          <StarIcon className="h-4 w-4" fill={starred ? 'currentColor' : 'none'} />
        </button>

        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={busy}
          aria-label="Delete this rating"
          className="press grid h-9 w-9 place-items-center rounded-full bg-white/[0.05] text-white/40 ring-1 ring-white/10 transition-colors disabled:opacity-50"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>

      <Dialog
        opened={confirming}
        onBackdropClick={() => setConfirming(false)}
        title="Delete this fit?"
        content="The score and its photo go away for good. Star it instead to keep it around."
        buttons={
          <>
            <DialogButton onClick={() => setConfirming(false)}>Cancel</DialogButton>
            <DialogButton strong onClick={confirmDelete}>
              Delete
            </DialogButton>
          </>
        }
      />
    </>
  );
}
