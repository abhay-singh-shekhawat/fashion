import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogButton } from 'konsta/react';
import { useAuth } from '../context/AuthContext';
import { useProgress } from '../hooks/useProgress';
import { useProfile } from '../hooks/useProfile';
import { useSkinTone } from '../hooks/useSkinTone';
import { apiError } from '../services/api';
import { badgeForLevel, SKIN_TONE_SWATCH } from '../config/theme';
import ErrorState from '../components/ErrorState';
import GlassCard from '../components/GlassCard';
import Pill from '../components/Pill';
import Reveal from '../components/Reveal';
import StatTile from '../components/StatTile';
import { SkeletonCard } from '../components/Skeleton';
import { ChevronRightIcon, LogoutIcon, PaletteIcon, UserIcon } from '../components/Icons';

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const progress = useProgress();
  const profile = useProfile();
  const skinTone = useSkinTone();
  const [confirmLogout, setConfirmLogout] = useState(false);

  const level = progress.data?.level ?? 1;
  const toNext = progress.data?.pointsToNextLevel ?? 100;
  const levelFill = Math.max(4, Math.round(((100 - toNext) / 100) * 100));
  const tone = skinTone.data?.skinTone ?? profile.data?.skinTone ?? 'unknown';

  const stats = [
    { label: 'Outfits', value: progress.data?.totalOutfitsSuggested ?? 0 },
    { label: 'Pieces', value: progress.data?.totalWardrobeItems ?? 0 },
    { label: 'Streak', value: progress.data?.currentStreak ?? 0 },
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
            {/* Identity — read-only. Renaming happens on the edit screen, which
                Body profile already opens, so this card is not itself a target. */}
            <Reveal>
              <GlassCard strong className="flex items-center gap-4">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-primary/30 to-brand-cyan/20 ring-1 ring-white/15">
                  <span className="font-display text-xl font-bold">
                    {user?.name?.charAt(0)?.toUpperCase() ?? 'S'}
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display truncate text-lg font-bold tracking-tight">
                    {user?.name ?? 'StyleSense user'}
                  </p>
                  <p className="truncate text-xs text-white/40">{user?.email}</p>
                </div>
              </GlassCard>
            </Reveal>

            <Reveal delay={60}>
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
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-[0.18em] text-white/40 uppercase">
                    Level {level}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Pill tone="pink">{progress.data?.badge ?? badgeForLevel(level)}</Pill>
                    <ChevronRightIcon className="h-4 w-4 text-white/30" />
                  </div>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-pink transition-[width] duration-700"
                    style={{ width: `${levelFill}%` }}
                  />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-2xl bg-white/[0.04] py-2.5 text-center ring-1 ring-white/10"
                    >
                      <StatTile
                        value={stat.value}
                        label={stat.label}
                        className="text-center"
                      />
                    </div>
                  ))}
                </div>
              </button>
              )}
            </Reveal>
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

      <Dialog
        opened={confirmLogout}
        onBackdropClick={() => setConfirmLogout(false)}
        title="Log out?"
        content="You'll need to sign in again to reach your closet."
        buttons={
          <>
            <DialogButton onClick={() => setConfirmLogout(false)}>Cancel</DialogButton>
            <DialogButton strong onClick={handleLogout}>
              Log out
            </DialogButton>
          </>
        }
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
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-white/[0.05] text-white/60 ring-1 ring-white/10">
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
