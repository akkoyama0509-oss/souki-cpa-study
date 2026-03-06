import { TopicStatus } from '@/types';

const statusConfig: Record<TopicStatus, { label: string; className: string }> = {
  new: { label: '未学習', className: 'bg-[#F2F2F7] text-[#8E8E93]' },
  due: { label: '復習待ち', className: 'bg-[#007AFF]/10 text-[#007AFF]' },
  weak: { label: '苦手', className: 'bg-[#FF3B30]/10 text-[#FF3B30]' },
  mastered: { label: '習得', className: 'bg-[#34C759]/10 text-[#34C759]' },
};

export default function StatusBadge({ status }: { status: TopicStatus }) {
  const config = statusConfig[status];
  return (
    <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
}
