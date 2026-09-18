import { useEffect, useRef, useState } from 'react';
import { api, ENDPOINTS, apiError } from '../../services/api';
import { RATING_STAGES, useRatingPipeline } from '../../hooks/useRatingPipeline';
import Cta from '../../components/Cta';
import ErrorState from '../../components/ErrorState';
import Field from '../../components/Field';
import GlassCard from '../../components/GlassCard';
import Pill from '../../components/Pill';
import PhotoSourceButtons from '../../components/PhotoSourceButtons';
import RateOptions from '../../components/RateOptions';
import ScoreCard from '../../components/ScoreCard';
import StageChecklist from '../../components/StageChecklist';

export default function RatePhoto() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [linkMode, setLinkMode] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [occasion, setOccasion] = useState('casual');
  const [detailed, setDetailed] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const previewRef = useRef('');
  const pipeline = useRatingPipeline();

  const running = pipeline.status === 'running';
  const ready = Boolean(file) || Boolean(imageUrl.trim());

  /* Object URLs pin the blob in memory until revoked, so drop the previous
     one whenever the picked photo changes and when the screen unmounts. */
  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    [],
  );

  const pick = (picked) => {
    setSubmitError('');
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = URL.createObjectURL(picked);
    setPreview(previewRef.current);
    setFile(picked);
  };

  const clearPick = () => {
    setSubmitError('');
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = '';
    setPreview('');
    setFile(null);
  };

  const start = async () => {
    if (!ready) return;
    setSubmitError('');
    pipeline.begin();
    try {
      const form = new FormData();
      if (file) form.append('image', file);
      else form.append('imageUrl', imageUrl.trim());
      form.append('occasion', occasion);
      form.append('detailedFeedback', String(detailed));

      /* Returns 202 + jobId only — the score arrives over socket events. */
      await api.post(ENDPOINTS.ratePhoto, form);
    } catch (error) {
      const message = apiError(error, 'Could not start the rating');
      setSubmitError(message);
      pipeline.fail(message);
    }
  };

  const reset = () => {
    pipeline.reset();
    clearPick();
    setImageUrl('');
    setLinkMode(false);
  };

  const result = pipeline.result;
  const score = pipeline.score ?? result?.score ?? 0;
  const message = pipeline.message || result?.message;
  const breakdown = pipeline.breakdown ?? result?.breakdown;
  const tips = pipeline.tips?.length ? pipeline.tips : result?.improvementTips?.tips;
  const feedback = pipeline.feedback ?? result?.improvementTips?.feedback;
  /* The completed rating carries the full weather object (condition text,
     feels-like, location); the socket event is the earlier, thinner copy. */
  const weather = result?.weather ?? pipeline.weather;
  const colorHarmony = result?.colorHarmony;
  const formality = result?.formality;
  const items = result?.scannedOutfit?.items;

  return (
    <div className="page-pad">
      <div className="mx-auto w-full max-w-[42rem] space-y-4">
        {pipeline.status === 'idle' ? (
          <div className="animate-fade-up space-y-4">
            <GlassCard strong className="space-y-4">
              <div>
                <p className="font-display text-lg font-bold tracking-tight">Rate your fit</p>
                <p className="mt-1 text-sm text-white/45 text-pretty">
                  Add an outfit photo and I'll score it — colours, weather, skin tone and exactly
                  what to change.
                </p>
              </div>

              {file ? (
                <div className="space-y-2">
                  <img
                    src={preview}
                    alt="Your outfit"
                    className="max-h-64 w-full rounded-2xl object-cover"
                  />
                  <div className="flex items-center justify-between">
                    <Pill tone="lime">{file.name.slice(0, 24)}</Pill>
                    <button
                      type="button"
                      onClick={clearPick}
                      className="text-xs font-bold text-white/40"
                    >
                      remove
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <PhotoSourceButtons onPick={pick} onError={setSubmitError} />

                  {linkMode ? (
                    <Field
                      label="Image link"
                      placeholder="https://…/fit.jpg"
                      value={imageUrl}
                      onChange={(event) => setImageUrl(event.target.value)}
                      hint="Works with any public image link"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setLinkMode(true)}
                      className="w-full text-center text-xs font-semibold text-white/35"
                    >
                      or paste an image link
                    </button>
                  )}
                </>
              )}
            </GlassCard>

            <RateOptions
              occasion={occasion}
              onOccasion={setOccasion}
              detailed={detailed}
              onDetailed={setDetailed}
              tone="lime"
            />

            {submitError ? (
              <ErrorState message={submitError} onRetry={() => setSubmitError('')} />
            ) : null}

            <Cta tone="lime" className="w-full" disabled={!ready} onClick={start}>
              Rate my fit
            </Cta>
          </div>
        ) : null}

        {running ? (
          <GlassCard strong className="animate-fade-up space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-[0.18em] text-white/40 uppercase">
                Scoring your fit
              </span>
              {pipeline.stalled ? (
                <Pill tone="amber">taking a while</Pill>
              ) : (
                <Pill tone="lime">live</Pill>
              )}
            </div>

            <StageChecklist stages={RATING_STAGES} done={pipeline.stages} />

            {pipeline.streamingTip ? (
              <div className="border-t border-white/10 pt-3">
                <span className="text-[10px] font-bold tracking-[0.18em] text-white/40 uppercase">
                  Stylist notes
                </span>
                <p className="mt-1.5 text-sm leading-relaxed text-white/70">
                  {pipeline.streamingTip}
                </p>
              </div>
            ) : null}

            {pipeline.stalled ? (
              <div className="rounded-2xl bg-brand-amber/10 px-4 py-3 text-xs leading-relaxed text-brand-amber ring-1 ring-brand-amber/25">
                Still working in the background. You'll get the score the moment it lands — or
                start over.
              </div>
            ) : null}

            <button
              type="button"
              onClick={reset}
              className="press w-full rounded-full bg-white/[0.06] py-3 text-sm font-bold ring-1 ring-white/10"
            >
              Start over
            </button>
          </GlassCard>
        ) : null}

        {pipeline.status === 'done' ? (
          <div className="animate-fade-up space-y-4">
            <ScoreCard
              score={score}
              message={message}
              breakdown={breakdown}
              tips={tips}
              feedback={feedback}
              weather={weather}
              colorHarmony={colorHarmony}
              formality={formality}
              /* The local preview renders instantly; the hosted URL arrives with
                 the rating itself for link-mode and history. */
              imageUrl={preview || result?.imageUrl}
              items={items}
              itemCount={result?.scannedOutfit?.itemCount}
              pointsAwarded={pipeline.pointsAwarded}
              mode={result?.improvementTips?.mode}
            />
            <button
              type="button"
              onClick={reset}
              className="press w-full rounded-full bg-white/[0.06] py-3.5 text-sm font-bold ring-1 ring-white/10"
            >
              Rate another
            </button>
          </div>
        ) : null}

        {pipeline.status === 'error' ? (
          <div className="animate-fade-up">
            <ErrorState message={pipeline.error} onRetry={reset} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
