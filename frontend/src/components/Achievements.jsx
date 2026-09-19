/* Ten milestones, every one of them a threshold over numbers the app already
   counts. Nothing here is awarded by a rule the user cannot see coming, and a
   locked tile says what it takes to unlock it. */
const MILESTONES = [
  { key: 'first-fit', emoji: '📸', label: 'First fit rated', hint: 'Rate a photo', done: ({ ratings }) => ratings >= 1 },
  { key: 'first-piece', emoji: '🧺', label: 'Closet started', hint: 'Add a piece', done: ({ items }) => items >= 1 },
  { key: 'ten-pieces', emoji: '🚪', label: 'Ten pieces deep', hint: 'Reach 10 items', done: ({ items }) => items >= 10 },
  { key: 'twentyfive-pieces', emoji: '🗄️', label: 'Full rail', hint: 'Reach 25 items', done: ({ items }) => items >= 25 },
  { key: 'scanned', emoji: '🤖', label: 'First scan', hint: 'Scan an outfit', done: ({ scanned }) => scanned },
  { key: 'ten-fits', emoji: '🎯', label: 'Ten fits rated', hint: 'Rate 10 fits', done: ({ ratings }) => ratings >= 10 },
  { key: 'streak-3', emoji: '🔥', label: 'Three-day streak', hint: '3 days running', done: ({ streak }) => streak >= 3 },
  { key: 'streak-7', emoji: '⚡', label: 'Week-long streak', hint: '7 days running', done: ({ streak }) => streak >= 7 },
  { key: 'toned', emoji: '🎨', label: 'Tone scanned', hint: 'Scan your skin tone', done: ({ toned }) => toned },
  { key: 'level-5', emoji: '🏅', label: 'Style Sensei', hint: 'Reach level 5', done: ({ level }) => level >= 5 },
];

export default function Achievements({ progress, ratings = [], items = [], tone = 'unknown', className = '' }) {
  const facts = {
    ratings: ratings.length,
    items: items.length,
    scanned: items.some((item) => item?.detectedBy === 'scanner' || item?.detectedBy === 'ai'),
    streak: progress?.currentStreak ?? 0,
    level: progress?.level ?? 1,
    toned: tone !== 'unknown',
  };

  const tiles = MILESTONES.map((milestone) => ({
    ...milestone,
    unlocked: Boolean(milestone.done(facts)),
  }));
  const unlocked = tiles.filter((tile) => tile.unlocked).length;

  return (
    <div className={`glass space-y-3 p-4 ${className}`}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[10px] font-bold tracking-[0.18em] text-white/40 uppercase">
          Milestones
        </span>
        <span className="text-[11px] text-white/40 tabular-nums">
          {unlocked} of {tiles.length}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {tiles.map((tile) => (
          <div
            key={tile.key}
            className={`rounded-xl border p-2.5 ${
              tile.unlocked
                ? 'border-brand-primary/25 bg-brand-primary/[0.07]'
                : 'border-white/[0.06] bg-ink-950/40'
            }`}
          >
            <span
              aria-hidden="true"
              className={`text-base ${tile.unlocked ? '' : 'opacity-30 grayscale'}`}
            >
              {tile.emoji}
            </span>
            <span
              className={`mt-1 block text-[12px] leading-snug font-semibold ${
                tile.unlocked ? 'text-white/85' : 'text-white/35'
              }`}
            >
              {tile.label}
            </span>
            <span className="mt-0.5 block truncate text-[10px] text-white/30">
              {tile.unlocked ? 'Unlocked' : tile.hint}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
