import { useState } from 'react';
import { useLocation, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiError } from '../../services/api';
import Field from '../../components/Field';
import Cta from '../../components/Cta';
import Pill from '../../components/Pill';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { push } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const canSubmit = email.trim() && password && !busy;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email.trim(), password);
      push('Welcome back 🔥', 'success');
      navigate(location.state?.from ?? '/', { replace: true });
    } catch (err) {
      setError(apiError(err, 'Could not log you in'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="animate-fade-up px-5 py-8">
      <div className="mb-10">
        <Pill tone="violet">StyleSense</Pill>
        <h1 className="font-display mt-4 text-4xl leading-[1.05] font-bold tracking-tighter">
          your closet,
          <br />
          <span className="text-brand-primary">leveled up.</span>
        </h1>
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/45 text-pretty">
          AI styling, fit checks and a wardrobe that actually knows you.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@mail.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Field
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        {error ? (
          <div className="rounded-2xl bg-brand-error/10 px-4 py-3 text-sm text-brand-error ring-1 ring-brand-error/25">
            {error}
          </div>
        ) : null}

        <Cta type="submit" disabled={!canSubmit} loading={busy} className="mt-2 w-full">
          {busy ? '' : 'Log in'}
        </Cta>
      </form>

      <p className="mt-6 text-center text-sm">
        <RouterLink to="/auth/forgot" className="font-bold text-white/50 hover:text-white/80">
          Forgot password?
        </RouterLink>
      </p>

      <p className="mt-3 text-center text-sm text-white/40">
        New here?{' '}
        <RouterLink
          to="/auth/register"
          className="font-bold text-brand-primary hover:text-brand-primary/80"
        >
          Create an account
        </RouterLink>
      </p>
    </div>
  );
}
