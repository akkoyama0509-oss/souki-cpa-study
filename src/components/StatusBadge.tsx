import { TopicStatus } from '@/types';

const statusConfig: Record<TopicStatus, { label: string; className: string }> = {
  new: { label: '未学習', className: 'bg-slate-100 text-slate-600' },
  due: { label: '復習待ち', className: 'bg-blue-100 text-blue-700' },
  weak: { label: '苦手', className: 'bg-red-100 text-red-700' },
  mastered: { label: '習得', className: 'bg-emerald-100 text-emerald-700' },
};

export default function StatusBadge({ status }: { status: TopicStatus }) {
  const config = statusConfig[status];
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
}
