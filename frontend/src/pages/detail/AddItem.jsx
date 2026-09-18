import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAddItem } from '../../hooks/useWardrobe';
import { useToast } from '../../context/ToastContext';
import { apiError } from '../../services/api';
import {
  CATEGORIES,
  CATEGORY_EMOJI,
  CATEGORY_LABELS,
  FORMALITIES,
  FORMALITY_LABELS,
} from '../../config/theme';
import Cta from '../../components/Cta';
import Field from '../../components/Field';
import Pill from '../../components/Pill';
import Reveal from '../../components/Reveal';

export default function AddItem() {
  const navigate = useNavigate();
  const { push } = useToast();
  const addItem = useAddItem();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [color, setColor] = useState('');
  const [formality, setFormality] = useState('unknown');
  const [error, setError] = useState('');

  const canSubmit = name.trim().length >= 2 && category && !addItem.isPending;

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await addItem.mutateAsync({
        name: name.trim(),
        category,
        color: color.trim() || 'unknown',
        formality,
      });
      push('+10 pts · added to closet', 'success');
      navigate('/wardrobe', { replace: true });
    } catch (err) {
      setError(apiError(err, 'Could not add that item'));
    }
  };

  return (
    <form onSubmit={submit} className="page-pad">
      <div className="mx-auto w-full max-w-[42rem] space-y-5">
        <Reveal>
          <Field
            label="Item name"
            placeholder="Black linen shirt"
            value={name}
            onChange={(event) => setName(event.target.value)}
            hint="2–100 characters"
          />
        </Reveal>

        <Reveal className="space-y-2" delay={50}>
          <span className="text-[10px] font-bold tracking-[0.16em] text-white/40 uppercase">
            Category <span className="text-brand-error">*</span>
          </span>
          <div className="grid grid-cols-4 gap-2 md:grid-cols-8">
            {CATEGORIES.map((key) => {
              const active = category === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key)}
                  className={`press flex flex-col items-center gap-1.5 rounded-2xl py-3 ring-1 transition-colors ${
                    active
                      ? 'bg-brand-primary/15 ring-brand-primary/50'
                      : 'bg-white/[0.04] ring-white/10 hover:bg-white/[0.06]'
                  }`}
                >
                  <span className="text-xl">{CATEGORY_EMOJI[key]}</span>
                  <span
                    className={`text-[10px] font-bold ${
                      active ? 'text-brand-primary' : 'text-white/50'
                    }`}
                  >
                    {CATEGORY_LABELS[key]}
                  </span>
                </button>
              );
            })}
          </div>
        </Reveal>

        <Reveal delay={100}>
          <Field
            label="Colour"
            placeholder="black"
            value={color}
            onChange={(event) => setColor(event.target.value)}
            hint="Optional — improves colour-harmony scoring"
          />
        </Reveal>

        <Reveal className="space-y-2" delay={150}>
          <span className="text-[10px] font-bold tracking-[0.16em] text-white/40 uppercase">
            Formality
          </span>
          <div className="flex flex-wrap gap-2">
            {FORMALITIES.map((key) => {
              const active = formality === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormality(key)}
                  className={`press rounded-full px-3.5 py-2 text-xs font-bold ring-1 transition-colors ${
                    active
                      ? 'bg-brand-cyan/15 text-brand-cyan ring-brand-cyan/40'
                      : 'bg-white/[0.04] text-white/55 ring-white/10 hover:text-white/80'
                  }`}
                >
                  {FORMALITY_LABELS[key]}
                </button>
              );
            })}
          </div>
        </Reveal>

        {error ? (
          <div className="rounded-2xl bg-brand-error/10 px-4 py-3 text-sm text-brand-error ring-1 ring-brand-error/25">
            {error}
          </div>
        ) : null}

        <Reveal delay={200}>
          <div className="flex items-center gap-3">
            <Pill tone="lime">+10 pts</Pill>
            <span className="text-xs text-white/35">for growing your closet</span>
          </div>

          <Cta
            type="submit"
            disabled={!canSubmit}
            loading={addItem.isPending}
            className="mt-5 w-full"
          >
            {addItem.isPending ? '' : 'Add to closet'}
          </Cta>
        </Reveal>
      </div>
    </form>
  );
}
