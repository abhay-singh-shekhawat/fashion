export default function StepBar({ current, total = 3 }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: total }).map((_, index) => (
        <span
          key={index}
          className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
            index <= current ? 'bg-brand-primary' : 'bg-white/10'
          }`}
        />
      ))}
    </div>
  );
}
