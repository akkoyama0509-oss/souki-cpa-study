'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { subjects } from '@/data/subjects';
import { topics } from '@/data/topics';
import { getTopicStatus, getFavorites, toggleFavorite } from '@/lib/review-logic';
import StatusBadge from '@/components/StatusBadge';

export default function SubjectTopicsClient() {
  const params = useParams();
  const subjectId = params.subjectId as string;
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'weak' | 'favorite' | 'new'>('all');
  const [, setTick] = useState(0);

  useEffect(() => setMounted(true), []);

  const subject = subjects.find(s => s.id === subjectId);
  if (!subject) return <p className="py-6 text-center text-[#8E8E93]">科目が見つかりません</p>;

  const subjectTopics = topics.filter(t => t.subjectId === subjectId);
  const favorites = mounted ? getFavorites() : [];

  const filtered = subjectTopics.filter(t => {
    if (search && !t.title.includes(search) && !t.keywords.some(k => k.includes(search))) return false;
    if (!mounted) return true;
    const status = getTopicStatus(t.id);
    if (filter === 'weak' && status !== 'weak') return false;
    if (filter === 'new' && status !== 'new') return false;
    if (filter === 'favorite' && !favorites.includes(t.id)) return false;
    return true;
  });

  const handleToggleFav = (topicId: string) => {
    toggleFavorite(topicId);
    setTick(t => t + 1);
  };

  const importanceLabel = (v: number) => v === 3 ? 'A' : v === 2 ? 'B' : 'C';
  const importanceColor = (v: number) => v === 3 ? 'text-[#FF3B30]' : v === 2 ? 'text-[#FF9500]' : 'text-[#8E8E93]';

  return (
    <div className="pt-4 pb-4 space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/subjects" className="text-[#5856D6] flex items-center gap-0.5 text-[15px]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-[20px] font-bold text-[#1C1C1E] tracking-tight">{subject.name}</h1>
          <p className="text-[12px] text-[#8E8E93]">{subjectTopics.length}論点</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Link href={`/subjects/${subjectId}/tree`} className="flex-1 bg-[#5856D6]/[0.08] text-[#5856D6] text-center py-2.5 rounded-xl text-[14px] font-medium active:opacity-80 transition-opacity">
          目次ツリー
        </Link>
        <Link href={`/recall?subject=${subjectId}`} className="flex-1 bg-[#34C759]/[0.08] text-[#34C759] text-center py-2.5 rounded-xl text-[14px] font-medium active:opacity-80 transition-opacity">
          想起学習
        </Link>
      </div>

      <input
        type="text"
        placeholder="論点名・キーワードで検索..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full card px-4 py-3 text-[15px] text-[#1C1C1E] placeholder-[#C7C7CC] focus:outline-none focus:ring-2 focus:ring-[#5856D6]/30"
        style={{ borderRadius: 12 }}
      />

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {([['all', 'すべて'], ['weak', '苦手'], ['favorite', 'お気に入り'], ['new', '未学習']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`shrink-0 px-3.5 py-[6px] rounded-full text-[13px] font-medium transition-colors ${
              filter === key ? 'bg-[#5856D6] text-white' : 'bg-white text-[#8E8E93]'
            }`}
            style={{ boxShadow: filter !== key ? '0 1px 2px rgba(0,0,0,0.04)' : 'none' }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(t => {
          const status = mounted ? getTopicStatus(t.id) : 'new' as const;
          const isFav = favorites.includes(t.id);
          return (
            <div key={t.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <Link href={`/topics/${t.id}`} className="flex-1 min-w-0">
                  <p className="font-medium text-[14px] text-[#1C1C1E] leading-snug">{t.title}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <StatusBadge status={status} />
                    <span className={`text-[11px] font-semibold ${importanceColor(t.importance)}`}>
                      重要度{importanceLabel(t.importance)}
                    </span>
                    <span className="text-[11px] text-[#AEAEB2]">頻出{importanceLabel(t.frequency)}</span>
                  </div>
                </Link>
                <button onClick={() => handleToggleFav(t.id)} className="shrink-0 p-1.5 -mr-1">
                  <svg className={`w-[18px] h-[18px] ${isFav ? 'text-[#FF9500]' : 'text-[#C7C7CC]'}`} fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-center text-[#AEAEB2] py-10 text-[14px]">該当する論点がありません</p>
        )}
      </div>
    </div>
  );
}
