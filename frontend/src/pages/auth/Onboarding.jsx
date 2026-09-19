import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Preloader, Segmented, SegmentedButton } from 'konsta/react';
import { useAuth } from '../../context/AuthContext';
import { useCreateProfile, useProfile } from '../../hooks/useProfile';
import { useToast } from '../../context/ToastContext';
import { apiError } from '../../services/api';
import { GENDERS, GENDER_LABELS, SKIN_TONES, SKIN_TONE_SWATCH } from '../../config/theme';
import Cta from '../../components/Cta';
import Pill from '../../components/Pill';
import SkinToneScanner from '../../components/SkinToneScanner';
import StepBar from '../../components/StepBar';

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

export default function Onboarding() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { push } = useToast();
  const createProfile = useCreateProfile();
  const existingProfile = useProfile();

  const [step, setStep] = useState(0);
  const [heightCm, setHeightCm] = useState(170);
  const [weightKg, setWeightKg] = useState(65);
  const [age, setAge] = useState(22);
  const [gender, setGender] = useState('prefer_not_to_say');
  const [skinTone, setSkinTone] = useState('unknown');
  const [pickedManually, setPickedManually] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');

  /* Registration creates the profile shell, and a scan (here or from the
     profile page) can already have set a real tone — carry that in rather than
     resetting it to unknown on finish. A manual pick outranks it. */
  useEffect(() => {
    if (pickedManually) return;
    if (existingProfile.data?.skinTone) setSkinTone(existingProfile.data.skinTone);
  }, [existingProfile.data?.skinTone, pickedManually]);

  if (!token) return <Navigate to="/auth/login" replace />;

  /* A profile already exists, so there is nothing to onboard — bail out before
     rendering the wizard instead of letting a submit hit a needless 409. */
  if (existingProfile.isLoading) {
    return (
      <div className="grid min-h-[60dvh] place-items-center">
        <Preloader className="h-6 w-6" />
      </div>
    );
  }

  /* Registration creates an empty profile shell, so "loaded" is not the same as
     "filled in" — only a profile with measurements has nothing to onboard. */
  if (existingProfile.data?.heightCm && existingProfile.data?.weightKg && existingProfile.data?.age) {
    return <Navigate to="/" replace />;
  }

  const submit = async () => {
    setError('');
    try {
      await createProfile.mutateAsync({ heightCm, weightKg, age, gender, skinTone });
    } catch (err) {
      /* 409 means the profile already exists — that is a success for us. */
      if (err?.response?.status === 409) {
        push('Profile already set up', 'info');
        navigate('/', { replace: true });
        return;
      }
      setError(apiError(err, 'Could not save your profile'));
      return;
    }
    push('You are all set ✨', 'success');
    navigate('/', { replace: true });
  };

  return (
    <div className="px-5 py-6">
      <StepBar current={step} total={3} />

      <div className="mt-6 mb-6">
        <Pill tone="cyan">Step {step + 2} of 4</Pill>
        <h1 className="font-display mt-3 text-3xl leading-tight font-medium tracking-tight">
          {step === 0 && 'what are we working with?'}
          {step === 1 && 'a bit about you.'}
          {step === 2 && 'last one — your tone.'}
        </h1>
      </div>

      {/* Keyed on the step so each one animates in rather than swapping
          silently — the wizard reads as movement, not a re-render. */}
      <div key={step} className="animate-fade-up space-y-3">
        {step === 0 ? (
          <>
            <Slider label="Height" value={heightCm} min={100} max={250} unit="cm" onChange={setHeightCm} />
            <Slider label="Weight" value={weightKg} min={30} max={200} unit="kg" onChange={setWeightKg} />
          </>
        ) : null}

        {step === 1 ? (
          <>
            <Slider label="Age" value={age} min={12} max={100} unit="yrs" onChange={setAge} />
            <div className="glass space-y-3 p-4">
              <span className="text-[10px] font-bold tracking-[0.16em] text-white/40 uppercase">
                Gender
              </span>
              <Segmented strong rounded>
                {GENDERS.map((option) => (
                  <SegmentedButton
                    key={option}
                    active={gender === option}
                    onClick={() => setGender(option)}
                  >
                    {GENDER_LABELS[option]}
                  </SegmentedButton>
                ))}
              </Segmented>
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            {/* The scan is the accurate path and it lives here, at profile
                creation, not only in the profile panel afterwards. */}
            <SkinToneScanner
              tone={skinTone}
              onResult={(payload) => setSkinTone(payload.skinTone ?? 'unknown')}
              onBusyChange={setScanning}
            />

            <div className="flex items-center gap-3 pt-1">
              <span className="h-px flex-1 bg-white/10" />
              <span className="text-[10px] font-bold tracking-[0.16em] text-white/30 uppercase">
                or pick manually
              </span>
              <span className="h-px flex-1 bg-white/10" />
            </div>

            <div className="glass space-y-4 p-4">
              <div className="flex flex-wrap gap-2">
                {SKIN_TONES.map((option) => {
                  const active = skinTone === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        setSkinTone(option);
                        setPickedManually(true);
                      }}
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
              <p className="text-xs leading-relaxed text-white/35 text-pretty">
                Not sure? Leave it unknown — you can scan or change it any time from your profile.
              </p>
            </div>
          </>
        ) : null}

        {error ? (
          <div className="rounded-2xl bg-brand-error/10 px-4 py-3 text-sm text-brand-error ring-1 ring-brand-error/25">
            {error}
          </div>
        ) : null}
      </div>

      <div className="mt-8 flex gap-3">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep((current) => current - 1)}
            className="press flex-1 rounded-full glass-tile py-3.5 text-sm font-bold ring-1 ring-white/10"
          >
            Back
          </button>
        ) : null}

        {step < 2 ? (
          <Cta tone="cyan" className="flex-1" onClick={() => setStep((current) => current + 1)}>
            Next
          </Cta>
        ) : (
          <Cta
            tone="cyan"
            className="flex-1"
            loading={createProfile.isPending}
            onClick={submit}
            disabled={createProfile.isPending || scanning}
          >
            {createProfile.isPending ? '' : scanning ? 'Scanning your tone…' : 'Finish setup'}
          </Cta>
        )}
      </div>
    </div>
  );
}
