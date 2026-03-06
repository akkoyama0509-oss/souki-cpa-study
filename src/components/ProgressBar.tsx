interface ProgressBarProps {
  value: number;
  max: number;
  color?: string;
  size?: 'sm' | 'md';
}

export default function ProgressBar({ value, max, color, size = 'sm' }: ProgressBarProps) {
  const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const height = size === 'sm' ? 'h-[4px]' : 'h-[6px]';
  const barColor = color || 'bg-[#5856D6]';

  return (
    <div className={`w-full bg-black/[0.05] rounded-full ${height} overflow-hidden`}>
      <div
        className={`${height} ${barColor} rounded-full transition-all duration-700 ease-out`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
