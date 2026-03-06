interface ProgressBarProps {
  value: number;
  max: number;
  color?: string;
  size?: 'sm' | 'md';
}

export default function ProgressBar({ value, max, color = 'bg-indigo-500', size = 'sm' }: ProgressBarProps) {
  const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const height = size === 'sm' ? 'h-2' : 'h-3';

  return (
    <div className={`w-full bg-slate-200 rounded-full ${height} overflow-hidden`}>
      <div
        className={`${height} ${color} rounded-full transition-all duration-500 ease-out`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
