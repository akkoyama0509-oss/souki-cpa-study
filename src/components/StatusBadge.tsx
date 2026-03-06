import { TopicStatus } from '@/types';

const statusConfig: Record<TopicStatus, { label: string; bg: string; text: string }> = {
  new: { label: '未学習', bg: 'bg-[#F2F2F7]', text: 'text-[#8E8E93]' },
  due: { label: '復習待ち', bg: 'bg-[#007AFF]/[0.1]', text: 'text-[#007AFF]' },
  weak: { label: '苦手', bg: 'bg-[#FF3B30]/[0.1]', text: 'text-[#FF3B30]' },
  mastered: { label: '習得', bg: 'bg-[#34C759]/[0.1]', text: 'text-[#34C759]' },
};

export default function StatusBadge({ status }: { status: TopicStatus }) {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-[2px] rounded-md ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}
