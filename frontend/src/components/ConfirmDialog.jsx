import { Dialog, DialogButton } from 'konsta/react';

/**
 * The confirmation dialog, with the same blurred scrim the sheets use.
 *
 * Konsta draws its own backdrop as a flat 50% black and gives no hook to style
 * it, so `backdrop={false}` plus our own scrim is the only way to get the rest
 * of the screen to go soft behind the question.
 */
export default function ConfirmDialog({
  opened,
  title,
  content,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) {
  return (
    <>
      <div
        aria-hidden="true"
        onClick={onCancel}
        className={`fixed inset-0 z-40 bg-ink-950/55 backdrop-blur-xl transition-opacity duration-300 ${
          opened ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <Dialog
        opened={opened}
        backdrop={false}
        onBackdropClick={onCancel}
        title={title}
        content={content}
        buttons={
          <>
            <DialogButton onClick={onCancel}>{cancelLabel}</DialogButton>
            <DialogButton strong onClick={onConfirm}>
              {confirmLabel}
            </DialogButton>
          </>
        }
      />
    </>
  );
}
