import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Segmented, SegmentedButton } from 'konsta/react';
import { useAuth } from '../../context/AuthContext';
import { useProfile, useUpdateProfile } from '../../hooks/useProfile';
import { useToast } from '../../context/ToastContext';
import { apiError } from '../../services/api';
import { GENDERS, GENDER_LABELS, SKIN_TONES, SKIN_TONE_SWATCH } from '../../config/theme';
import Cta from '../../components/Cta';
import Disclosure from '../../components/Disclosure';
import ErrorState from '../../components/ErrorState';
import Field from '../../components/Field';
import GlassCard from '../../components/GlassCard';
import Reveal from '../../components/Reveal';
import { SkeletonCard } from '../../components/Skeleton';

function Slider({ label, value, min, max, unit, onChange }) {
  return (
    <div className="glass p-4">
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] font-bold tracking-[0.16em] text-white/40 uppercase">
          {label}
        </span>
        <span className="font-display text-xl font-bold tracking-tight tabular-nums">
          {value}
          <span className="ml-1 text-xs font-medium text-white/40">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-brand-primary"
      />
    </div>
  );
}

export default function EditProfile() {
  const navigate = useNavigate();
  const { push } = useToast();
  const { user, updateName } = useAuth();
  const { data: profile, isLoading, isError, error } = useProfile();
  const update = useUpdateProfile();
  const [draft, setDraft] = useState(null);
  const [name, setName] = useState(user?.name ?? '');
  const [savingName, setSavingName] = useState(false);
  const busy = update.isPending || savingName;

  if (isLoading) {
    return (
      <div className="page-pad">
        <div className="mx-auto w-full max-w-[42rem] space-y-4">
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
        </div>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="page-pad">
        <div className="mx-auto w-full max-w-[42rem]">
          <ErrorState message={apiError(error, 'Could not load your profile')} />
        </div>
      </div>
    );
  }

  const values = draft ?? {
    heightCm: profile.heightCm,
    weightKg: profile.weightKg,
    age: profile.age,
    gender: profile.gender ?? 'prefer_not_to_say',
    skinTone: profile.skinTone ?? 'unknown',
  };

  const set = (patch) => setDraft({ ...values, ...patch });

  const submit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      push('Your name can’t be empty', 'error');
      return;
    }

    setSavingName(true);
    try {
      /* The name is stored on the user account, the rest on the body profile —
         one Save covers both so the screen stays a single form. */
      if (trimmedName !== user?.name) {
        await updateName(trimmedName);
      }
      await update.mutateAsync(values);
      push('Profile updated', 'success');
      navigate('/profile', { replace: true });
    } catch (err) {
      push(apiError(err, 'Could not save'), 'error');
    } finally {
      setSavingName(false);
    }
  };

  return (
    <div className="page-pad">
      <div className="mx-auto w-full max-w-[42rem] space-y-3">
        <Reveal>
          <Field
            label="Name"
            autoComplete="name"
            placeholder="Ayo"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Reveal>

        <Reveal delay={50}>
          <Slider
            label="Height"
            value={values.heightCm}
            min={100}
            max={250}
            unit="cm"
            onChange={(heightCm) => set({ heightCm })}
          />
        </Reveal>
        <Reveal delay={90}>
          <Slider
            label="Weight"
            value={values.weightKg}
            min={30}
            max={200}
            unit="kg"
            onChange={(weightKg) => set({ weightKg })}
          />
        </Reveal>
        <Reveal delay={130}>
          <Slider
            label="Age"
            value={values.age}
            min={12}
            max={100}
            unit="yrs"
            onChange={(age) => set({ age })}
          />
        </Reveal>

        {/* The three sliders are what people come here for; the tuning below is
            optional, so it stays folded with its current values on the header. */}
        <Reveal delay={170}>
          <GlassCard>
          <Disclosure
            label="Styling preferences"
            summary={`${GENDER_LABELS[values.gender] ?? 'Not set'} · ${values.skinTone} tone`}
          >
            <div className="space-y-4 pt-4">
              <div className="space-y-3">
                <span className="text-[10px] font-bold tracking-[0.16em] text-white/40 uppercase">
                  Gender
                </span>
                <Segmented strong rounded>
                  {GENDERS.map((option) => (
                    <SegmentedButton
                      key={option}
                      active={values.gender === option}
                      onClick={() => set({ gender: option })}
                    >
                      {GENDER_LABELS[option]}
                    </SegmentedButton>
                  ))}
                </Segmented>
              </div>

              <div className="space-y-3">
                <span className="text-[10px] font-bold tracking-[0.16em] text-white/40 uppercase">
                  Skin tone
                </span>
                <div className="flex flex-wrap gap-2">
                  {SKIN_TONES.map((option) => {
                    const active = values.skinTone === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => set({ skinTone: option })}
                        className={`press flex items-center gap-2 rounded-full py-2 pr-4 pl-2 ring-1 transition-colors ${
                          active ? 'glass-tile ring-brand-primary/60' : 'ring-white/10'
                        }`}
                      >
                        <span
                          className="h-6 w-6 rounded-full ring-1 ring-white/20"
                          style={{ background: SKIN_TONE_SWATCH[option] }}
                        />
                        <span
                          className={`text-xs font-bold capitalize ${
                            active ? 'text-white' : 'text-white/60'
                          }`}
                        >
                          {option}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Disclosure>
          </GlassCard>
        </Reveal>

        <Reveal delay={210}>
          <Cta className="w-full" loading={busy} disabled={busy} onClick={submit}>
            {busy ? '' : 'Save changes'}
          </Cta>
        </Reveal>
      </div>
    </div>
  );
}
