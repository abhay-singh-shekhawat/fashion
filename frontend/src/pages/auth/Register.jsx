import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiError } from '../../services/api';
import Field from '../../components/Field';
import Cta from '../../components/Cta';
import Pill from '../../components/Pill';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const canSubmit = name.trim() && email.trim() && password.length >= 6 && !busy;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(name.trim(), email.trim(), password);
      /* Registration creates the user but not the profile — onboarding does. */
      navigate('/auth/onboarding', { replace: true });
    } catch (err) {
      setError(apiError(err, 'Could not create your account'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="animate-fade-up px-5 py-8">
      <div className="mb-10">
        <Pill tone="lime">Step 1 of 4</Pill>
        <h1 className="font-display mt-4 text-4xl leading-[1.05] font-bold tracking-tighter">
          let's get you
          <br />
          <span className="text-brand-lime">styled.</span>
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Field
          label="Name"
          autoComplete="name"
          placeholder="Ayo"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
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
          autoComplete="new-password"
          placeholder="••••••••"
          hint="At least 6 characters"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        {error ? (
          <div className="rounded-2xl bg-brand-error/10 px-4 py-3 text-sm text-brand-error ring-1 ring-brand-error/25">
            {error}
          </div>
        ) : null}

        <Cta type="submit" tone="lime" disabled={!canSubmit} loading={busy} className="mt-2 w-full">
          {busy ? '' : 'Create account'}
        </Cta>
      </form>

      <p className="mt-6 text-center text-sm text-white/40">
        Already have one?{' '}
        <RouterLink to="/auth/login" className="font-bold text-brand-lime hover:text-brand-lime/80">
          Log in
        </RouterLink>
      </p>
    </div>
  );
}
