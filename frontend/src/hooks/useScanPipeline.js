import { useCallback, useState } from 'react';
import { useSocketEvent } from './useSocketEvent';

const INITIAL = {
  status: 'idle',
  percent: null,
  message: '',
  items: [],
  result: null,
  error: null,
};

function finitePercent(...candidates) {
  for (const value of candidates) {
    const num = Number(value);
    if (Number.isFinite(num)) return Math.max(0, Math.min(100, Math.round(num)));
  }
  return null;
}

/**
 * Callers pass an object where `percent` is expected (see backend
 * emitScanProgress arity mismatch), so the numeric field arrives as NaN and
 * this reads `progress`/`percent` out of the object instead.
 */
function readProgress(payload) {
  if (payload && typeof payload === 'object') {
    return {
      percent: finitePercent(payload.progress, payload.percent),
      message: payload.message ?? payload.status ?? '',
    };
  }
  return { percent: finitePercent(payload), message: '' };
}

export function useScanPipeline() {
  const [state, setState] = useState(INITIAL);

  const reset = useCallback(() => setState(INITIAL), []);

  /* The bar starts moving before the server says anything, so the upload never
     looks frozen while the file is in flight. */
  const begin = useCallback(
    () => setState({ ...INITIAL, status: 'queued', percent: 5, message: 'Uploading your photo…' }),
    [],
  );

  /** Terminal success — used by the socket event and by the page's poll fallback. */
  const finish = useCallback((payload = {}) => {
    setState((prev) => {
      if (prev.status === 'done') return prev;
      return {
        ...prev,
        status: 'done',
        percent: 100,
        message: 'Done',
        result: { ...(prev.result ?? {}), ...payload },
        items: Array.isArray(payload.items) ? payload.items : prev.items,
      };
    });
  }, []);

  /* No completion arrived and nothing showed up in the closet either — stop
     pretending to work instead of spinning forever. */
  const stall = useCallback(() => {
    setState((prev) =>
      ['done', 'error', 'stalled'].includes(prev.status)
        ? prev
        : { ...prev, status: 'stalled', message: 'Still working on this one…' },
    );
  }, []);

  const fail = useCallback((error) => {
    setState((prev) => ({ ...prev, status: 'error', error: error ?? 'Scan failed' }));
  }, []);

  useSocketEvent('scan:start', () => {
    setState((prev) => ({
      ...prev,
      status: 'processing',
      percent: prev.percent ?? 10,
      message: 'Starting scan…',
    }));
  });

  useSocketEvent('scan:queued', ({ jobId, position, estimatedWait } = {}) => {
    setState((prev) => ({
      ...prev,
      status: 'queued',
      jobId,
      message: position ? `Queued — ${position} ahead` : 'Queued for processing…',
      estimatedWait,
    }));
  });

  useSocketEvent('scan:progress', (payload) => {
    const { percent, message } = readProgress(payload);
    setState((prev) => ({
      ...prev,
      status: 'processing',
      percent: percent ?? prev.percent,
      message: message || prev.message,
    }));
  });

  useSocketEvent('scan:items:detected', ({ items, itemCount } = {}) => {
    setState((prev) => ({
      ...prev,
      items: Array.isArray(items) ? items : prev.items,
      percent: Math.max(prev.percent ?? 0, 85),
      message: `Found ${itemCount ?? items?.length ?? 0} piece(s) — saving to your closet…`,
    }));
  });

  useSocketEvent('scan:complete', (payload = {}) => {
    finish({
      ...payload,
      items: Array.isArray(payload.items) ? payload.items : undefined,
    });
  });

  useSocketEvent('scan:error', ({ error } = {}) => {
    setState((prev) => ({ ...prev, status: 'error', error: error ?? 'Scan failed' }));
  });

  return { ...state, begin, reset, finish, stall, fail };
}
