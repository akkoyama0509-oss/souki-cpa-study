interface ProgressBarProps {
  value: number;
  max: number;
  color?: string;
  size?: 'sm' | 'md';
}

export default function ProgressBar({ value, max, color = 'bg-[#5856D6]', size = 'sm' }: ProgressBarProps) {
  const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const height = size === 'sm' ? 'h-[5px]' : 'h-2';

  return (
    <div className={`w-full bg-black/[0.04] rounded-full ${height} overflow-hidden`}>
      <div
        className={`${height} ${color} rounded-full transition-all duration-700 ease-out`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
