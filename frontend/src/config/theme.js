export const palette = {
  violet: '#A855F7',
  lime: '#C6FF3D',
  cyan: '#22D3EE',
  pink: '#FF4D8D',
  amber: '#FFB020',
  error: '#FF3B5C',
  /* Hero-gradient partner, used once per screen (Today's fit card). */
  indigo: '#5B4CCD',
  ink: { 950: '#000000', 900: '#141618', 800: '#1D2023', 700: '#2A2E32' },
};

/* Semantic surface names — prefer these over the raw ink step so a ramp change
   does not mean hunting hexes. Mirrors the `--color-ink-*` tokens in main.css. */
export const surfaces = {
  app: 'bg-ink-950',
  card: 'bg-ink-900',
  raised: 'bg-ink-800',
  hairline: 'border-ink-700',
};

/* Card/hero/button radii. Cards step to a token rather than every component
   picking its own rounded-* value. */
export const radii = {
  card: '1.25rem',
  hero: '1.75rem',
  full: '9999px',
};

/* Durations and easings measured off the reference. Use these instead of
   ad-hoc ms values so motion stays consistent. */
export const motion = {
  fast: 150,
  base: 260,
  slow: 320,
  ring: 900,
  easeSpring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  easeOutSoft: 'cubic-bezier(0.22, 1, 0.36, 1)',
  stagger: 40,
};

export const breakpoints = { sm: 640, md: 768, lg: 1024, xl: 1280 };

/* Mirrors SCORE_* thresholds in backend/src/utils/outfitScorer.js */
export const scoreBands = [
  { min: 85, label: 'Excellent', note: 'fit check passed', tone: palette.lime, toneName: 'lime' },
  { min: 75, label: 'Strong', note: 'well coordinated', tone: palette.cyan, toneName: 'cyan' },
  { min: 60, label: 'Good', note: 'close, can level up', tone: palette.amber, toneName: 'amber' },
  { min: 0, label: 'Needs work', note: 'let’s rethink this', tone: palette.error, toneName: 'error' },
];

export const bandFor = (score = 0) =>
  scoreBands.find((band) => score >= band.min) ?? scoreBands[scoreBands.length - 1];

/* Closed set — backend throws 400 "Invalid occasion" for anything else.
   `tone` gives each occasion its own accent so the home shelf reads as eight
   different answers rather than one filter row; it never carries meaning
   alone, the label and the active check do that. */
export const OCCASIONS = [
  { key: 'casual', label: 'Casual', emoji: '👟', tone: 'lime' },
  { key: 'daily', label: 'Daily', emoji: '☀️', tone: 'amber' },
  { key: 'office', label: 'Office', emoji: '💼', tone: 'cyan' },
  { key: 'interview', label: 'Interview', emoji: '🤝', tone: 'violet' },
  { key: 'party', label: 'Party', emoji: '🪩', tone: 'pink' },
  { key: 'gym', label: 'Gym', emoji: '🏋️', tone: 'lime' },
  { key: 'traditional', label: 'Traditional', emoji: '🪔', tone: 'amber' },
  { key: 'date', label: 'Date', emoji: '🌹', tone: 'pink' },
];

export const CATEGORIES = [
  'top',
  'bottom',
  'outerwear',
  'footwear',
  'accessory',
  'other',
  'one_piece',
  'traditional',
];

export const CATEGORY_LABELS = {
  top: 'Top',
  bottom: 'Bottom',
  outerwear: 'Outerwear',
  footwear: 'Footwear',
  accessory: 'Accessory',
  other: 'Other',
  one_piece: 'One piece',
  traditional: 'Traditional',
};

export const CATEGORY_EMOJI = {
  top: '👕',
  bottom: '👖',
  outerwear: '🧥',
  footwear: '👟',
  accessory: '💍',
  other: '🧺',
  one_piece: '👗',
  traditional: '🥻',
};

export const FORMALITIES = [
  'casual',
  'smart_casual',
  'formal',
  'business',
  'party',
  'sporty',
  'traditional',
  'unknown',
];

export const FORMALITY_LABELS = {
  casual: 'Casual',
  smart_casual: 'Smart casual',
  formal: 'Formal',
  business: 'Business',
  party: 'Party',
  sporty: 'Sporty',
  traditional: 'Traditional',
  unknown: 'Unknown',
};

export const SKIN_TONES = ['warm', 'cool', 'neutral', 'olive', 'unknown'];

/* Base colour names the harmony rules score on — mirrors COLOR_KEYWORDS in
   backend/src/utils/colorHarmony.js, so the swatches match what was judged. */
export const COLOR_SWATCH = {
  black: '#1B1B20',
  white: '#F4F4F5',
  gray: '#8A8A93',
  navy: '#22315C',
  blue: '#3B82F6',
  red: '#DC2626',
  pink: '#F472B6',
  green: '#22A06B',
  brown: '#7B5230',
  beige: '#D9C7A7',
  orange: '#EA7C2B',
  yellow: '#E9C43B',
  purple: '#8B5CF6',
  gold: '#D4AF37',
};

export const SKIN_TONE_SWATCH = {
  warm: '#E8B48A',
  cool: '#D9A3A3',
  neutral: '#D9BFA6',
  olive: '#B9946B',
  unknown: '#6B6B76',
};

export const GENDERS = ['male', 'female', 'other', 'prefer_not_to_say'];

export const GENDER_LABELS = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
  prefer_not_to_say: 'Skip',
};

export const DETECTED_BY_LABELS = {
  manual: 'Added by you',
  scanner: 'Scanned',
  ai: 'AI detected',
};

export const levelFor = (points = 0) => Math.floor(points / 100) + 1;

export const badgeForLevel = (level) =>
  level >= 5 ? 'Style Sensei' : level >= 3 ? 'Style Enthusiast' : 'Beginner Stylist';

export const SCORE_BREAKDOWN_LABELS = {
  colorHarmony: 'Colour harmony',
  skinToneFit: 'Skin tone fit',
  weatherSuitability: 'Weather fit',
  formalityMatch: 'Formality match',
  scanBonus: 'Scan accuracy',
};

/* Max points each dimension can contribute — mirrors the weights in
   backend/src/utils/outfitScorer.js. Needed to show "18/30" and to derive the
   verdict the backend asks the model to explain. */
export const SCORE_DIMENSIONS = {
  colorHarmony: { max: 30, emoji: '🎨' },
  skinToneFit: { max: 25, emoji: '✨' },
  weatherSuitability: { max: 20, emoji: '🌤️' },
  formalityMatch: { max: 25, emoji: '👔' },
};

/* Mirrors RETENTION_DAYS in backend/src/utils/ratingRetention.js — unstarred
   fits are swept two weeks after they were rated, starred ones stay for good. */
export const RATING_RETENTION_DAYS = 14;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days until an unstarred rating is swept, floored at 0. */
export const retentionDaysLeft = (createdAt, now = Date.now()) => {
  const savedAt = new Date(createdAt).getTime();
  if (Number.isNaN(savedAt)) return RATING_RETENTION_DAYS;
  return Math.max(0, Math.ceil((savedAt + RATING_RETENTION_DAYS * DAY_MS - now) / DAY_MS));
};

/* Log rows read better relative while an event is still fresh, and absolute
   once it is old enough that "9d ago" stops meaning anything. */
export const timeAgo = (value, now = Date.now()) => {
  const at = new Date(value).getTime();
  if (Number.isNaN(at)) return '';

  const minutes = Math.floor((now - at) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;

  return new Date(at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};

export const verdictFor = (value = 0, max = 1) => {
  const ratio = max ? value / max : 0;
  if (ratio >= 0.7) return 'great';
  if (ratio >= 0.4) return 'good';
  return 'off';
};

export const VERDICTS = {
  great: { label: 'Great', tone: 'lime', bar: 'bg-brand-lime' },
  good: { label: 'Solid', tone: 'amber', bar: 'bg-brand-amber' },
  off: { label: 'Off', tone: 'error', bar: 'bg-brand-error' },
};

export function conditionEmoji(condition = '') {
  const text = condition.toLowerCase();
  if (text.includes('thunder')) return '⛈️';
  if (text.includes('snow') || text.includes('rime') || text.includes('sleet')) return '❄️';
  if (text.includes('rain') || text.includes('drizzle') || text.includes('shower')) return '🌧️';
  if (text.includes('fog')) return '🌫️';
  if (text.includes('overcast')) return '☁️';
  if (text.includes('cloud')) return '⛅';
  return '☀️';
}

/* The vision model returns free-text types ("t-shirt", "denim jacket"), so map
   a few keywords onto emoji rather than requiring a category. */
export function typeEmoji(type = '') {
  const text = String(type).toLowerCase();
  const rules = [
    [['saree', 'sari', 'lehenga'], '🥻'],
    [['kurti', 'kurta', 'salwar', 'sherwani'], '🪔'],
    [['shirt', 'tee', 'top', 'blouse', 'polo'], '👕'],
    [['jacket', 'coat', 'blazer', 'hoodie', 'sweater'], '🧥'],
    [['jeans', 'trouser', 'pant', 'short', 'skirt', 'bottom', 'chino'], '👖'],
    [['dress', 'gown', 'jumpsuit'], '👗'],
    [['shoe', 'sneaker', 'boot', 'sandal', 'heel', 'footwear'], '👟'],
    [['bag', 'belt', 'watch', 'jewel', 'cap', 'hat', 'scarf', 'glass'], '🕶️'],
  ];
  const match = rules.find(([words]) => words.some((word) => text.includes(word)));
  return match ? match[1] : '🧺';
}
