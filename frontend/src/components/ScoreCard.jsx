import {
  FORMALITY_LABELS,
  OCCASIONS,
  SCORE_DIMENSIONS,
  bandFor,
  conditionEmoji,
  typeEmoji,
  verdictFor,
} from '../config/theme';
import Disclosure from './Disclosure';
import GlassCard from './GlassCard';
import Pill from './Pill';
import ScoreRing from './ScoreRing';
import ScoreSection from './ScoreSection';

function flattenTips(value) {
  if (!value) return [];
  if (typeof value === 'string') return value.trim() ? [value] : [];
  if (Array.isArray(value)) {
    return value.flat(Infinity).filter((tip) => typeof tip === 'string' && tip.trim());
  }
  return [];
}

/* Every prop is unchanged — three screens pass these by name. What changed is
   that only the score itself leads; the evidence behind it folds away. */
export default function ScoreCard({
  score,
  message,
  breakdown = {},
  tips,
  feedback,
  weather,
  colorHarmony,
  formality,
  imageUrl,
  items,
  itemCount,
  pointsAwarded,
  mode,
}) {
  const band = bandFor(score ?? 0);
  const sections = Array.isArray(feedback?.sections) ? feedback.sections : [];
  const sectionFor = (key) => sections.find((section) => section.key === key);

  /* Dimensions are driven by the backend breakdown, so a missing skin tone
     scan simply drops that row instead of promising a score that never came. */
  const dimensions = Object.entries(breakdown ?? {}).filter(
    ([key, value]) => typeof value === 'number' && value > 0 && key !== 'scanBonus',
  );
  const quickWins = Array.isArray(feedback?.quickWins) ? feedback.quickWins.filter(Boolean) : [];
  const fallbackTips = flattenTips(tips);
  const scanBonus = breakdown?.scanBonus;

  const hasWeather = typeof weather?.temperature === 'number';
  const feelsDifferent =
    typeof weather?.feelsLike === 'number' &&
    Math.round(weather.feelsLike) !== Math.round(weather.temperature);

  const weatherFacts = [
    weather?.location,
    feelsDifferent ? `feels like ${Math.round(weather.feelsLike)}°C` : null,
    weather?.isDay === false ? 'night' : weather?.isDay === true ? 'daytime' : null,
  ].filter(Boolean);

  /* What colour harmony and formality match were actually judged on, so those
     rows carry the same evidence the weather card does. */
  const harmonyColors = Array.isArray(colorHarmony?.colors) ? colorHarmony.colors : [];
  const occasionLabel = OCCASIONS.find((entry) => entry.key === formality?.occasion)?.label;
  const wantedLabels = (formality?.wanted ?? []).map(
    (level) => FORMALITY_LABELS[level] ?? String(level).replace(/_/g, ' '),
  );

  const factsFor = (key) => {
    if (key === 'colorHarmony') return colorHarmony?.note ? [colorHarmony.note] : [];
    if (key === 'formalityMatch') {
      if (!formality?.detected) return formality?.note ? [formality.note] : [];
      return [
        `reads ${FORMALITY_LABELS[formality.detected] ?? formality.detected}`,
        wantedLabels.length
          ? `${occasionLabel ?? formality.occasion} wants ${wantedLabels.join(' or ')}`
          : null,
      ].filter(Boolean);
    }
    return [];
  };

  const detailCount = dimensions.length + (Array.isArray(items) ? items.length : 0);
  const summary = [
    hasWeather ? `${Math.round(weather.temperature)}°C` : null,
    detailCount ? `${detailCount} detail${detailCount === 1 ? '' : 's'}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <GlassCard strong className="space-y-5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-[0.18em] text-white/40 uppercase">
          Fit check
        </span>
        <div className="flex items-center gap-1.5">
          {mode ? <Pill>{mode}</Pill> : null}
          <Pill tone={band.toneName}>{band.label}</Pill>
        </div>
      </div>

      {/* The reveal: image, ring, verdict. Everything else is supporting
          evidence and starts folded. */}
      <div className="animate-fade-up flex flex-col items-center">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="The fit that was rated"
            className="mb-5 max-h-56 w-full rounded-2xl object-cover ring-1 ring-white/10"
          />
        ) : null}
        <ScoreRing score={score ?? 0} tone={band.tone} caption="out of 100" />
        <p className="font-display mt-4 text-center text-lg leading-snug font-bold tracking-tight text-pretty">
          {feedback?.headline || message || band.note}
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
          {typeof weather?.temperature === 'number' ? (
            <Pill tone="cyan">
              {conditionEmoji(weather.condition)} {Math.round(weather.temperature)}°C
            </Pill>
          ) : null}
          {itemCount ? <Pill>{itemCount} pieces</Pill> : null}
          {pointsAwarded ? <Pill tone="lime">+{pointsAwarded} pts</Pill> : null}
        </div>
      </div>

      {dimensions.length || hasWeather || (items ?? []).length || quickWins.length || fallbackTips.length ? (
        <div className="border-t border-white/10 pt-1">
          <Disclosure
            label="See the full breakdown"
            summary={summary || 'Weather, scoring dimensions and tips'}
          >
            <div className="grid grid-cols-1 gap-5 pt-3 lg:grid-cols-2 lg:items-start">
              <div className="space-y-5">
                {hasWeather ? (
                  <div className="flex items-center gap-3 rounded-2xl bg-brand-cyan/[0.07] px-3.5 py-3 ring-1 ring-brand-cyan/20">
                    <span className="text-2xl">{conditionEmoji(weather.condition)}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold">
                        {Math.round(weather.temperature)}°C · {weather.condition || 'Clear sky'}
                      </p>
                      {weatherFacts.length ? (
                        <p className="text-[11px] text-white/40">{weatherFacts.join(' · ')}</p>
                      ) : null}
                    </div>
                    {weather.band ? (
                      <Pill tone="cyan" className="ml-auto shrink-0">
                        {weather.band} weather
                      </Pill>
                    ) : null}
                  </div>
                ) : null}

                {dimensions.length ? (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold tracking-[0.18em] text-white/40 uppercase">
                      Why this score {sections.length ? '· tap a row' : ''}
                    </span>

                    {dimensions.map(([key, value]) => {
                      const section = sectionFor(key);
                      const max = SCORE_DIMENSIONS[key]?.max ?? 25;
                      return (
                        <ScoreSection
                          key={key}
                          dimension={key}
                          value={value}
                          verdict={section?.verdict ?? verdictFor(value, max)}
                          why={section?.why}
                          fix={section?.fix}
                          facts={factsFor(key)}
                          swatches={key === 'colorHarmony' ? harmonyColors : []}
                          /* The weather row opens itself: "it didn't match" is
                             the question users actually have. */
                          defaultOpen={key === 'weatherSuitability' && Boolean(section?.why)}
                        />
                      );
                    })}

                    {!dimensions.some(([key]) => key === 'skinToneFit') ? (
                      <p className="px-1 text-[11px] leading-relaxed text-white/30">
                        Skin tone fit isn't scored yet — scan your tone from your profile and it
                        joins the breakdown.
                      </p>
                    ) : null}

                    {typeof scanBonus === 'number' && scanBonus > 0 ? (
                      <p className="px-1 text-[11px] text-white/30">
                        Includes +{scanBonus} from scan confidence.
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="space-y-5">
                {Array.isArray(items) && items.length ? (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold tracking-[0.18em] text-white/40 uppercase">
                      What I saw ({items.length})
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {items.map((item, index) => {
                        /* Closet pieces carry a name and a photo; photo-rating
                           items only carry a type. Closet chips drop the colour
                           prefix because the name already reads "blue jeans". */
                        const label = item?.name ?? item?.type ?? item?.category ?? 'item';
                        const image = item?.imageUrl ?? item?.image;
                        return (
                          <span
                            key={`${label}-${index}`}
                            className="glass flex items-center gap-2 p-1.5 pr-3"
                          >
                            {image ? (
                              <img
                                src={image}
                                alt={label}
                                className="h-9 w-9 shrink-0 rounded-xl object-cover ring-1 ring-white/10"
                              />
                            ) : (
                              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.05] text-base ring-1 ring-white/10">
                                {typeEmoji(label)}
                              </span>
                            )}
                            <span className="text-xs font-semibold text-white/75 capitalize">
                              {item?.color && !item?.name ? `${item.color} ` : ''}
                              {label}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {quickWins.length || fallbackTips.length ? (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold tracking-[0.18em] text-white/40 uppercase">
                      {quickWins.length ? 'Quick wins' : 'How to level it up'}
                    </span>
                    {(quickWins.length ? quickWins : fallbackTips).map((tip, index) => (
                      <div key={index} className="flex gap-2.5">
                        <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-lime/15 text-[10px] font-bold text-brand-lime ring-1 ring-brand-lime/25">
                          {index + 1}
                        </span>
                        <p className="text-sm leading-relaxed text-white/70 text-pretty">{tip}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </Disclosure>
        </div>
      ) : null}
    </GlassCard>
  );
}
