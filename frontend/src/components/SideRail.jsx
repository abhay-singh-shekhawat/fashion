import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NAV_ITEMS, SCAN_ACTION } from '../config/nav';

/* Desktop counterpart to the phone tab bar. Fixed to the left edge and hidden
   below `lg`, where `MobileShell` hides the Tabbar and clears the pl-* offset
   that this occupies instead. */
export default function SideRail({ pathname }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const initial = user?.name?.trim().charAt(0).toUpperCase() || 'S';
  const { Icon: ScanIcon } = SCAN_ACTION;

  return (
    <nav
      aria-label="Primary"
      className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-[88px] lg:flex-col lg:items-center lg:gap-2 lg:border-r lg:border-white/10 lg:bg-ink-950/80 lg:py-5 lg:shadow-[12px_0_34px_-28px_rgba(223,195,169,0.45)] lg:backdrop-blur-xl"
    >
      <button
        type="button"
        onClick={() => navigate('/profile')}
        aria-label="Your profile"
        className="press grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-primary/30 to-brand-cyan/20 ring-1 ring-white/15"
      >
        <span className="font-display text-sm font-bold">{initial}</span>
      </button>

      <div className="mt-3 flex w-full flex-1 flex-col items-center gap-1">
        {NAV_ITEMS.map((item) => (
          <RailItem
            key={item.path}
            item={item}
            active={pathname === item.path}
            onClick={() => navigate(item.path)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => navigate(SCAN_ACTION.path)}
        aria-label={SCAN_ACTION.label}
        className="press flex w-16 flex-col items-center gap-1.5 rounded-2xl border border-brand-primary/25 bg-gradient-to-br from-brand-primary/[0.22] via-ink-900/80 to-brand-indigo/[0.24] py-2.5 font-semibold text-brand-primary shadow-[0_16px_36px_-20px_rgba(223,195,169,0.6)]"
      >
        <ScanIcon className="h-6 w-6" strokeWidth={2.4} />
        <span className="text-[10px] tracking-tight">{SCAN_ACTION.label}</span>
      </button>
    </nav>
  );
}

function RailItem({ item, active, onClick }) {
  const { Icon, label } = item;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`press relative flex w-16 flex-col items-center gap-1.5 rounded-2xl py-2.5 transition-colors duration-200 ${
        active
          ? 'bg-brand-primary/15 text-brand-primary ring-1 ring-brand-primary/25'
          : 'text-white/45 hover:bg-ink-700/50 hover:text-white/80'
      }`}
    >
      {active ? (
        <span className="absolute top-1/2 -left-3 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-primary" />
      ) : null}
      <Icon className="h-6 w-6" strokeWidth={active ? 2.4 : 1.8} />
      <span className="text-[10px] font-bold tracking-tight">{label}</span>
    </button>
  );
}
