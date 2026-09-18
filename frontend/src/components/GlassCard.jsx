/* Padding steps. `md` is the original `p-4`, kept as the default so the ~17
   existing call sites render exactly as before. */
const SIZES = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
  flush: 'p-0',
};

export default function GlassCard({
  as: Tag = 'div',
  strong = false,
  size = 'md',
  className = '',
  ...rest
}) {
  return (
    <Tag
      className={`${strong ? 'glass-strong' : 'glass'} ${SIZES[size] ?? SIZES.md} ${className}`}
      {...rest}
    />
  );
}
