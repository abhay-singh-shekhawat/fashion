import { useState } from 'react';
import { useRemoveItem } from '../hooks/useWardrobe';
import ConfirmDialog from './ConfirmDialog';
import { TrashIcon } from './Icons';

/**
 * Drops one piece from the closet. The confirmation lives here rather than at
 * each call site so the tile button and the detail sheet can never disagree
 * about what a tap does — and so an accidental tap can always be undone before
 * anything is deleted.
 */
export default function RemoveItemButton({ item, onRemoved, className = '', children }) {
  const [confirming, setConfirming] = useState(false);
  const remove = useRemoveItem();

  const confirmRemove = () => {
    setConfirming(false);
    remove.mutate(item._id, { onSuccess: () => onRemoved?.(item._id) });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={remove.isPending}
        aria-label={`Remove from closet: ${item.name}`}
        className={className}
      >
        {children ?? <TrashIcon className="h-4 w-4" />}
      </button>

      <ConfirmDialog
        opened={confirming}
        onCancel={() => setConfirming(false)}
        title="Remove this piece?"
        content={`"${item.name}" leaves your closet for good.`}
        confirmLabel="Remove"
        onConfirm={confirmRemove}
      />
    </>
  );
}
