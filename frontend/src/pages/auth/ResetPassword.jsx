import { useState } from 'react';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import { api, ENDPOINTS, apiError } from '../../services/api';
import Cta from '../../components/Cta';
import Field from '../../components/Field';
import GlassCard from '../../components/GlassCard';
import Pill from '../../components/Pill';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const canSubmit = password.length >= 6 && password === confirm && !busy;

  const submit = async (event) => {
    event.preventDefault();
    if (password !== confirm) {
      setError('Those passwords don’t match');
      return;
    }

    setError('');
    setBusy(true);
    try {
      await api.post(ENDPOINTS.resetPassword, { token, password });
      setDone(true);
    } catch (err) {
      setError(apiError(err, 'Could not reset your password'));
    } finally {
      setBusy(false);
    }
  };

  /* A link without its token can only have come from a mangled email or an
     expired share — there is nothing to fill in, so point at a fresh one. */
  if (!token) {
    return (
      <div className="animate-fade-up px-5 py-8">
        <div className="mb-8">
          <Pill tone="error">Link incomplete</Pill>
          <h1 className="font-display mt-4 text-3xl leading-tight font-bold tracking-tighter">
            that link is missing its token.
          </h1>
        </div>
        <GlassCard>
          <p className="text-sm leading-relaxed text-white/60">
            Request a new link and open it from the same device.
          </p>
        </GlassCard>
        <Cta className="mt-4 w-full" onClick={() => navigate('/auth/forgot')}>
          Request a new link
        </Cta>
      </div>
    );
  }

  if (done) {
    return (
      <div className="animate-fade-up px-5 py-8">
        <div className="mb-8">
          <Pill tone="lime">All set</Pill>
          <h1 className="font-display mt-4 text-3xl leading-tight font-bold tracking-tighter">
            password updated.
          </h1>
        </div>
        <GlassCard>
          <p className="text-sm leading-relaxed text-white/60">
            Sign in with your new password. Any other device that was still signed in has been
            logged out.
          </p>
        </GlassCard>
        <Cta className="mt-4 w-full" onClick={() => navigate('/auth/login', { replace: true })}>
          Go to log in
        </Cta>
      </div>
    );
  }

  return (
    <div className="animate-fade-up px-5 py-8">
      <div className="mb-8">
        <Pill tone="violet">New password</Pill>
        <h1 className="font-display mt-4 text-4xl leading-[1.05] font-bold tracking-tighter">
          pick something
          <br />
          <span className="text-brand-primary">you'll remember.</span>
        </h1>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <Field
          label="New password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          hint="At least 6 characters"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Field
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
        />

        {error ? (
          <div className="rounded-2xl bg-brand-error/10 px-4 py-3 text-sm text-brand-error ring-1 ring-brand-error/25">
            {error}
          </div>
        ) : null}

        {confirm && password !== confirm ? (
          <p className="text-xs text-white/40">Both passwords need to match.</p>
        ) : null}

        <Cta type="submit" disabled={!canSubmit} loading={busy} className="mt-2 w-full">
          {busy ? '' : 'Update password'}
        </Cta>
      </form>

      <p className="mt-6 text-center text-sm text-white/40">
        <RouterLink to="/auth/login" className="font-bold text-brand-primary">
          Back to log in
        </RouterLink>
      </p>
    </div>
  );
}
