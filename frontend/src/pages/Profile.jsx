import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProgress } from '../hooks/useProgress';
import { useProfile } from '../hooks/useProfile';
import { useRatingHistory } from '../hooks/useRatingHistory';
import { useSkinTone } from '../hooks/useSkinTone';
import { useWardrobe } from '../hooks/useWardrobe';
import { apiError } from '../services/api';
import { COLOR_SWATCH, badgeForLevel, SKIN_TONE_SWATCH } from '../config/theme';
import Achievements from '../components/Achievements';
import ConfirmDialog from '../components/ConfirmDialog';
import ErrorState from '../components/ErrorState';
import Pill from '../components/Pill';
import Reveal from '../components/Reveal';
import { SkeletonCard } from '../components/Skeleton';
import {
  CheckIcon,
  ChevronRightIcon,
  FlameIcon,
  LogoutIcon,
  PaletteIcon,
  UserIcon,
} from '../components/Icons';

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const progress = useProgress();
  const profile = useProfile();
  const skinTone = useSkinTone();
  const wardrobe = useWardrobe();
  const ratings = useRatingHistory();
  const [confirmLogout, setConfirmLogout] = useState(false);

  const level = progress.data?.level ?? 1;
  const toNext = progress.data?.pointsToNextLevel ?? 100;
  const totalPoints = progress.data?.totalPoints ?? 0;
  const streak = progress.data?.currentStreak ?? 0;
  const levelFill = Math.max(4, Math.round(((100 - toNext) / 100) * 100));
  const tone = skinTone.data?.skinTone ?? profile.data?.skinTone ?? 'unknown';
  const badge = progress.data?.badge ?? badgeForLevel(level);

  /* The average of what the stylist has actually scored, so the figure on this
     screen is a record rather than a claim. */
  const savedRatings = ratings.data ?? [];
  const averageScore = useMemo(() => {
    const scores = savedRatings
      .map((entry) => entry?.score)
      .filter((score) => typeof score === 'number');
    if (!scores.length) return null;
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }, [savedRatings]);

  /* The colours the closet is actually built from — the taste signature, read
     off the wardrobe instead of guessed at. */
  const palette = useMemo(() => {
    const tally = new Map();
    for (const item of wardrobe.data ?? []) {
      const color = item?.color;
      if (!color || color === 'unknown') continue;
      tally.set(color, (tally.get(color) ?? 0) + 1);
    }
    return [...tally.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([color, count]) => ({ color, count }));
  }, [wardrobe.data]);

  const stats = [
    { label: 'Outfits styled', value: progress.data?.totalOutfitsSuggested ?? 0, note: 'curated looks' },
    { label: 'Closet pieces', value: progress.data?.totalWardrobeItems ?? 0, note: 'in your vault' },
    { label: 'Fit streak', value: streak, note: streak === 1 ? 'day hot' : 'days hot' },
    {
      label: 'Avg fit score',
      value: averageScore ?? '—',
      note: averageScore ? `of ${savedRatings.length} rated` : 'rate a fit',
      accent: true,
    },
  ];

  const handleLogout = () => {
    setConfirmLogout(false);
    logout();
    navigate('/auth/login', { replace: true });
  };

  return (
    <div className="page-pad">
      <div className="page-stack">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-start lg:gap-6">
          <div className="page-stack">
            {/* ── Identity ────────────────────────────────────────────────── */}
            <Reveal>
              <div className="glass-strong flex items-center gap-4 p-4">
                <div className="relative shrink-0">
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-brand-primary/30 to-brand-lime/20 p-0.5 ring-1 ring-brand-primary/40">
                    <span className="grid h-full w-full place-items-center rounded-full bg-ink-900 font-display text-xl font-medium">
                      {user?.name?.charAt(0)?.toUpperCase() ?? 'S'}
                    </span>
                  </span>
                  <span className="absolute -right-0.5 -bottom-0.5 grid h-6 w-6 place-items-center rounded-full bg-brand-primary text-ink-950 ring-2 ring-ink-900">
                    <CheckIcon className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-display truncate text-xl font-medium tracking-tight">
                      {user?.name ?? 'StyleSense user'}
                    </p>
                    <Pill tone="violet">Lv {level}</Pill>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-white/40">{user?.email}</p>
                  <p className="mt-1.5 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-primary" />
                    <span className="text-[10px] font-bold tracking-[0.18em] text-brand-lime uppercase">
                      {badge}
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/profile/edit')}
                  aria-label="Edit your profile"
                  className="press grid h-9 w-9 shrink-0 place-items-center rounded-full glass-tile text-white/55 hover:text-brand-primary"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            </Reveal>

            {/* ── Level & XP ──────────────────────────────────────────────── */}
            <Reveal delay={50}>
              {progress.isLoading ? (
                <SkeletonCard lines={3} />
              ) : progress.isError ? (
                <ErrorState
                  message={apiError(progress.error, 'Could not load your progress')}
                  onRetry={() => progress.refetch()}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/profile/progress')}
                  className="glass press hover-lift w-full p-4 text-left"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-9 w-9 place-items-center rounded-xl glass-tile font-display text-sm font-medium text-brand-primary">
                        {level}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[10px] font-bold tracking-[0.18em] text-white/40 uppercase">
                          Current rank
                        </span>
                        <span className="font-display block text-base font-medium tracking-tight">
                          Level {level}
                        </span>
                      </span>
                    </div>
                    <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-semibold text-brand-primary">
                      {badge}
                      <ChevronRightIcon className="h-4 w-4 text-white/30" />
                    </span>
                  </div>

                  <div className="mt-3 h-1.5 overflow-hidden rounded-full glass-tile">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-lime to-brand-primary transition-[width] duration-700"
                      style={{ width: `${levelFill}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] tracking-wider text-white/35 uppercase">
                    <span className="tabular-nums">{totalPoints} xp</span>
                    <span className="font-semibold text-brand-primary">
                      {toNext} to level {level + 1}
                    </span>
                    <span className="tabular-nums">{level * 100} xp</span>
                  </div>
                </button>
              )}
            </Reveal>

            {/* ── Figures ─────────────────────────────────────────────────── */}
            <Reveal delay={90}>
              <div className="grid grid-cols-2 gap-2.5">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl glass-tile p-3.5"
                  >
                    <span className="block text-[10px] font-bold tracking-wider text-white/40 uppercase">
                      {stat.label}
                    </span>
                    <span className="mt-2 flex items-baseline gap-1.5">
                      <span
                        className={`font-display text-2xl leading-none font-medium tabular-nums ${
                          stat.accent ? 'text-brand-primary' : 'text-white'
                        }`}
                      >
                        {stat.value}
                      </span>
                    </span>
                    <span className="mt-1 block truncate text-[11px] text-white/35">
                      {stat.note}
                    </span>
                  </div>
                ))}
              </div>
            </Reveal>

            {/* ── Streak ──────────────────────────────────────────────────── */}
            <Reveal delay={120}>
              <button
                type="button"
                onClick={() => navigate('/scan')}
                className="glass press hover-lift flex w-full items-center justify-between gap-3 p-3.5 text-left"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-brand-primary/25 bg-brand-primary/10 text-brand-primary">
                    <FlameIcon className="h-4.5 w-4.5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[10px] font-bold tracking-[0.16em] text-white/40 uppercase">
                      Log today's fit
                    </span>
                    <span className="block truncate text-[13px] text-white/70">
                      {streak > 0
                        ? `Keep your ${streak}-day streak alive`
                        : 'Start a streak with one photo'}
                    </span>
                  </span>
                </span>
                <span className="press shrink-0 rounded-full bg-gradient-to-r from-brand-primary to-brand-lime px-4 py-2 text-xs font-semibold text-ink-950">
                  Snap fit
                </span>
              </button>
            </Reveal>

            {/* ── Closet palette ──────────────────────────────────────────── */}
            {palette.length ? (
              <Reveal delay={150} className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <span className="flex items-center gap-2">
                    <PaletteIcon className="h-4 w-4 text-brand-primary" />
                    <span className="font-display text-base font-medium tracking-tight">
                      Your palette
                    </span>
                  </span>
                  <span className="text-[10px] font-bold tracking-wider text-white/35 uppercase">
                    from {wardrobe.data?.length ?? 0} pieces
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {palette.map(({ color, count }) => (
                    <div key={color} className="flex flex-col items-center gap-1.5">
                      <span
                        className="h-9 w-full rounded-xl border border-white/[0.1]"
                        style={{ background: COLOR_SWATCH[color] ?? '#6B6B76' }}
                      />
                      <span className="truncate text-[10px] text-white/45 capitalize">{color}</span>
                      <span className="-mt-1 text-[10px] font-semibold text-brand-primary tabular-nums">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </Reveal>
            ) : null}
          </div>

          <div className="page-stack">
            {/* One details list rather than a "details" plus a one-row
                "preferences" section — they are the same kind of thing. */}
            <Reveal className="space-y-2" delay={80}>
              <span className="text-[10px] font-bold tracking-[0.18em] text-white/40 uppercase">
                Your details
              </span>
              <div className="glass divide-y divide-white/[0.06] p-0">
                <NavRow
                  icon={<UserIcon className="h-5 w-5" />}
                  title="Body profile"
                  /* Registration creates an empty profile shell, so a loaded
                     profile is not the same as a filled-in one — checking only
                     `profile.data` rendered "undefinedcm · undefinedkg ·
                     undefined". Same three-field test Onboarding uses. */
                  value={
                    profile.data?.heightCm && profile.data?.weightKg && profile.data?.age
                      ? `${profile.data.heightCm}cm · ${profile.data.weightKg}kg · ${profile.data.age}`
                      : 'Not set'
                  }
                  onClick={() => navigate('/profile/edit')}
                />
                <NavRow
                  icon={<PaletteIcon className="h-5 w-5" />}
                  title="Skin tone"
                  value={tone === 'unknown' ? 'Run a scan' : tone}
                  swatch={SKIN_TONE_SWATCH[tone]}
                  onClick={() => navigate('/profile/skin')}
                />
              </div>
            </Reveal>

            <Reveal delay={140}>
              <Achievements
                progress={progress.data}
                ratings={savedRatings}
                items={wardrobe.data ?? []}
                tone={tone}
              />
            </Reveal>

            <Reveal delay={120}>
              <button
                type="button"
                onClick={() => setConfirmLogout(true)}
                className="glass press flex w-full items-center gap-3 p-4 text-left text-brand-error"
              >
                <LogoutIcon className="h-5 w-5" />
                <span className="text-sm font-bold">Log out</span>
              </button>
            </Reveal>
          </div>
        </div>
      </div>

      <ConfirmDialog
        opened={confirmLogout}
        onCancel={() => setConfirmLogout(false)}
        title="Log out?"
        content="You'll need to sign in again to reach your closet."
        confirmLabel="Log out"
        onConfirm={handleLogout}
      />
    </div>
  );
}

function NavRow({ icon, title, value, swatch, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="press flex w-full items-center gap-3 p-4 text-left"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl glass-tile text-white/60 ring-1 ring-white/10">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-0.5 flex items-center gap-1.5 text-xs text-white/40">
          {swatch ? (
            <span
              className="h-3 w-3 shrink-0 rounded-full ring-1 ring-white/20"
              style={{ background: swatch }}
            />
          ) : null}
          {value}
        </span>
      </span>
      <ChevronRightIcon className="h-4 w-4 shrink-0 text-white/25" />
    </button>
  );
}
