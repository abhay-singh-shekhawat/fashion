import { useProgress } from '../../hooks/useProgress';
import { useSkinTone } from '../../hooks/useSkinTone';
import { badgeForLevel, palette } from '../../config/theme';
import Disclosure from '../../components/Disclosure';
import ErrorState from '../../components/ErrorState';
import GlassCard from '../../components/GlassCard';
import Pill from '../../components/Pill';
import Reveal from '../../components/Reveal';
import ScoreRing from '../../components/ScoreRing';
import StatTile from '../../components/StatTile';
import { SkeletonCard } from '../../components/Skeleton';
import { FlameIcon } from '../../components/Icons';

const TIERS = [
  { level: 1, name: 'Beginner Stylist', blurb: 'Just getting started' },
  { level: 3, name: 'Style Enthusiast', blurb: 'Finding your lane' },
  { level: 5, name: 'Style Sensei', blurb: 'Certified fit wizard' },
];

export default function ProgressPage() {
  const progress = useProgress();
  const skinTone = useSkinTone();

  if (progress.isLoading) {
    return (
      <div className="page-pad">
        <div className="mx-auto w-full max-w-[48rem]">
          <SkeletonCard lines={4} />
        </div>
      </div>
    );
  }

  if (progress.isError) {
    return (
      <div className="page-pad">
        <div className="mx-auto w-full max-w-[48rem]">
          <ErrorState
            message="Could not load your progress"
            onRetry={progress.refetch}
          />
        </div>
      </div>
    );
  }

  const data = progress.data ?? {};
  const level = data.level ?? 1;
  const toNext = data.pointsToNextLevel ?? 100;
  const levelFill = Math.max(3, Math.round(((100 - toNext) / 100) * 100));

  const stats = [
    { label: 'Outfits suggested', value: data.totalOutfitsSuggested ?? 0, tone: 'violet' },
    { label: 'Wardrobe pieces', value: data.totalWardrobeItems ?? 0, tone: 'cyan' },
    { label: 'Current streak', value: data.currentStreak ?? 0, tone: 'amber' },
  ];

  const nextTier = TIERS.find((tier) => level < tier.level);

  return (
    <div className="page-pad">
      <div className="mx-auto w-full max-w-[48rem] space-y-4">
        <Reveal>
          <GlassCard strong className="flex flex-col items-center gap-4 py-6">
            <ScoreRing
              score={level}
              value={levelFill}
              tone={palette.violet}
              size={168}
              caption={`level ${level}`}
            />
            <Pill tone="pink">{data.badge ?? badgeForLevel(level)}</Pill>
            <p className="max-w-xs text-center text-sm leading-relaxed text-white/50 text-pretty">
              {data.motivationalMessage ?? 'Keep building your wardrobe!'}
            </p>
            <div className="w-full">
              <div className="mb-1.5 flex items-center justify-between text-[11px] text-white/40">
                <span>{data.totalPoints ?? 0} pts</span>
                <span>{toNext} to next</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-pink transition-[width] duration-700"
                  style={{ width: `${levelFill}%` }}
                />
              </div>
            </div>
          </GlassCard>
        </Reveal>

        <div className="grid grid-cols-3 gap-2">
          {stats.map((stat, index) => (
            <Reveal key={stat.label} delay={index * 60}>
              <div className="glass px-2 py-3.5 text-center">
                <StatTile
                  value={stat.value}
                  label={stat.label}
                  tone={stat.tone}
                  className="text-center"
                />
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={60}>
          <GlassCard className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand-amber/15 text-brand-amber ring-1 ring-brand-amber/25">
              <FlameIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold">
                {data.currentStreak ? `${data.currentStreak} day streak` : 'No streak yet'}
              </p>
              <p className="text-xs text-white/40">
                {data.lastSuggestionDate
                  ? `Last styled ${new Date(data.lastSuggestionDate).toLocaleDateString()}`
                  : 'Ask for a daily fit to start one'}
              </p>
            </div>
          </GlassCard>
        </Reveal>

        {/* The next unlock is the useful line; the whole ladder is reference. */}
        <Reveal delay={80}>
          <GlassCard>
            <Disclosure
              label="Badges"
              summary={
                nextTier ? `Next: ${nextTier.name} at level ${nextTier.level}` : 'All tiers unlocked'
              }
            >
              <div className="space-y-2 pt-3">
                {TIERS.map((tier) => {
                  const unlocked = level >= tier.level;
                  return (
                    <div
                      key={tier.name}
                      className={`glass flex items-center gap-3 p-4 ${
                        unlocked ? '' : 'opacity-45'
                      }`}
                    >
                      <span
                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ring-1 ${
                          unlocked
                            ? 'bg-brand-primary/15 text-brand-primary ring-brand-primary/30'
                            : 'bg-white/[0.04] text-white/30 ring-white/10'
                        }`}
                      >
                        {unlocked ? '★' : '🔒'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold">{tier.name}</p>
                        <p className="text-xs text-white/40">{tier.blurb}</p>
                      </div>
                      <Pill tone={unlocked ? 'lime' : 'neutral'}>Lv {tier.level}</Pill>
                    </div>
                  );
                })}
              </div>
            </Disclosure>
          </GlassCard>
        </Reveal>

        {skinTone.data?.skinTone && skinTone.data.skinTone !== 'unknown' ? (
          <Reveal delay={100}>
            <GlassCard className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold capitalize">
                  {skinTone.data.skinTone} skin tone
                </p>
                <p className="text-xs text-white/40">Tuned into your colour scoring</p>
              </div>
              <Pill tone="cyan">on file</Pill>
            </GlassCard>
          </Reveal>
        ) : null}
      </div>
    </div>
  );
}
