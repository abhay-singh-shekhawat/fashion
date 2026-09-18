import { useCallback, useRef, useState } from 'react';
import { useSocketEvent } from './useSocketEvent';

const STALL_MS = 60_000;

/* Events are opportunistic — the backend skips skin-tone scoring when the
   profile tone is `unknown`, and weather can fail silently. Stages light up
   as they arrive rather than gating on a fixed sequence. */
export const RATING_STAGES = [
  { key: 'analyzing', label: 'Reading the fit' },
  { key: 'weather', label: 'Checking weather' },
  { key: 'skintone', label: 'Matching your skin tone' },
  { key: 'harmony', label: 'Scoring colour harmony' },
  { key: 'score', label: 'Calculating score' },
  { key: 'tips', label: 'Writing tips' },
];

const INITIAL = {
  status: 'idle',
  stages: {},
  score: null,
  message: '',
  breakdown: null,
  chunks: [],
  finalTips: [],
  feedback: null,
  pointsAwarded: null,
  result: null,
  weather: null,
  error: null,
  stalled: false,
};

function flattenTips(value) {
  if (!value) return [];
  if (typeof value === 'string') return value.trim() ? [value] : [];
  if (Array.isArray(value)) {
    return value.flat(Infinity).filter((tip) => typeof tip === 'string' && tip.trim());
  }
  return [];
}

export function useRatingPipeline() {
  const [state, setState] = useState(INITIAL);
  const stallTimer = useRef(null);

  const armStall = useCallback(() => {
    clearTimeout(stallTimer.current);
    stallTimer.current = setTimeout(() => {
      setState((prev) => (prev.status === 'running' ? { ...prev, stalled: true } : prev));
    }, STALL_MS);
  }, []);

  const markStage = useCallback((key, extra = {}) => {
    setState((prev) => ({ ...prev, ...extra, stages: { ...prev.stages, [key]: true } }));
  }, []);

  const reset = useCallback(() => {
    clearTimeout(stallTimer.current);
    setState(INITIAL);
  }, []);

  const begin = useCallback(() => {
    clearTimeout(stallTimer.current);
    setState({ ...INITIAL, status: 'running' });
    armStall();
  }, [armStall]);

  const fail = useCallback((message) => {
    clearTimeout(stallTimer.current);
    setState((prev) => ({ ...prev, status: 'error', error: message }));
  }, []);

  /* POST /outfit/rate only ever returns 202 — the result is socket-only. */
  useSocketEvent('rating:calculating', () => {
    armStall();
    markStage('analyzing');
  });

  useSocketEvent(
    'rating:weather:done',
    ({ score, temperature, condition, feelsLike, isDay, location, band } = {}) => {
      armStall();
      markStage('weather', {
        weather: { score, temperature, condition, feelsLike, isDay, location, band },
      });
    },
  );

  useSocketEvent('rating:skintone:done', ({ score, skinTone } = {}) => {
    armStall();
    markStage('skintone', { skinTone });
  });

  useSocketEvent('rating:harmony:done', ({ score, explanation } = {}) => {
    armStall();
    markStage('harmony', { harmony: { score, explanation } });
  });

  useSocketEvent('rating:score:done', ({ score, message, breakdown } = {}) => {
    armStall();
    markStage('score', { score, message: message ?? '', breakdown });
  });

  useSocketEvent('rating:tips:start', () => {
    armStall();
    setState((prev) => ({ ...prev, stages: { ...prev.stages, tips: true } }));
  });

  useSocketEvent('rating:tips:chunk', ({ tip, index } = {}) => {
    armStall();
    setState((prev) => ({ ...prev, chunks: [...prev.chunks, { tip, index }] }));
  });

  useSocketEvent('rating:tips:complete', ({ allTips, feedback } = {}) => {
    armStall();
    const tips = flattenTips(allTips);
    setState((prev) => ({
      ...prev,
      stages: { ...prev.stages, tips: true },
      feedback: feedback ?? prev.feedback,
      finalTips: tips.length ? tips : prev.finalTips,
    }));
  });

  useSocketEvent('rating:points:awarded', ({ pointsAwarded } = {}) => {
    setState((prev) => ({ ...prev, pointsAwarded }));
  });

  useSocketEvent('rating:complete', (payload = {}) => {
    clearTimeout(stallTimer.current);
    const rating = payload.rating ?? payload;
    setState((prev) => ({
      ...prev,
      status: 'done',
      stalled: false,
      result: rating,
      score: rating?.score ?? prev.score,
      message: rating?.message ?? prev.message,
      breakdown: rating?.breakdown ?? prev.breakdown,
      feedback: rating?.improvementTips?.feedback ?? prev.feedback,
      weather: rating?.weather ?? prev.weather,
      finalTips:
        flattenTips(rating?.improvementTips?.tips).length > 0
          ? flattenTips(rating.improvementTips.tips)
          : prev.finalTips,
    }));
  });

  useSocketEvent('rating:error', ({ error } = {}) => {
    fail(error ?? 'Rating failed');
  });

  const streamingTip = state.chunks
    .map((chunk) => (typeof chunk.tip === 'string' ? chunk.tip : ''))
    .join('')
    .trim();

  return {
    ...state,
    tips: state.finalTips.length ? state.finalTips : [],
    streamingTip,
    begin,
    reset,
    fail,
  };
}
