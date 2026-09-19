import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { api, ENDPOINTS, apiError } from '../../services/api';
import Cta from '../../components/Cta';
import Field from '../../components/Field';
import GlassCard from '../../components/GlassCard';
import Pill from '../../components/Pill';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { data } = await api.post(ENDPOINTS.forgotPassword, { email: email.trim() });
      setSent(data);
    } catch (err) {
      setError(apiError(err, 'Could not start the reset'));
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    /* The API hands back an absolute link; the app route is what is left once
       the origin is dropped. */
    const devPath = sent.devResetLink?.replace(/^https?:\/\/[^/]+/, '');

    return (
      <div className="animate-fade-up px-5 py-8">
        <div className="mb-8">
          <Pill tone="violet">Check your inbox</Pill>
          <h1 className="font-display mt-4 text-3xl leading-tight font-bold tracking-tighter">
            reset link sent.
          </h1>
        </div>

        <GlassCard className="space-y-2">
          <p className="text-sm leading-relaxed text-white/60">{sent.message}</p>
          <p className="text-xs leading-relaxed text-white/35">
            The link works once and expires in an hour.
          </p>
        </GlassCard>

        {devPath ? (
          <div className="mt-3 space-y-2 rounded-2xl bg-brand-amber/10 p-4 ring-1 ring-brand-amber/25">
            <p className="text-[10px] font-bold tracking-[0.16em] text-brand-amber uppercase">
              No mail provider set up
            </p>
            <p className="text-xs leading-relaxed text-white/60">
              Set RESEND_API_KEY on the server to send this by email. Until then, use the link
              directly:
            </p>
            <RouterLink
              to={devPath}
              className="press mt-1 inline-flex rounded-full bg-brand-amber px-4 py-2 text-xs font-bold text-black"
            >
              Open reset link
            </RouterLink>
          </div>
        ) : null}

        <p className="mt-6 text-center text-sm text-white/40">
          <RouterLink to="/auth/login" className="font-bold text-brand-primary">
            Back to log in
          </RouterLink>
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-up px-5 py-8">
      <div className="mb-8">
        <Pill tone="violet">Forgot password</Pill>
        <h1 className="font-display mt-4 text-4xl leading-[1.05] font-medium tracking-tight">
          let's get you
          <br />
          <span className="text-brand-primary">back in.</span>
        </h1>
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/45">
          Tell me the email you signed up with and I'll send a link to choose a new password.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@mail.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        {error ? (
          <div className="rounded-2xl bg-brand-error/10 px-4 py-3 text-sm text-brand-error ring-1 ring-brand-error/25">
            {error}
          </div>
        ) : null}

        <Cta type="submit" disabled={!email.trim() || busy} loading={busy} className="mt-2 w-full">
          {busy ? '' : 'Send reset link'}
        </Cta>
      </form>

      <p className="mt-6 text-center text-sm text-white/40">
        Remembered it?{' '}
        <RouterLink to="/auth/login" className="font-bold text-brand-primary">
          Log in
        </RouterLink>
      </p>
    </div>
  );
}
