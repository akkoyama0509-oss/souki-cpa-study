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
    <div className="pt-5 pb-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/subjects" className="text-[#5856D6] pressable p-1">
          <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-[22px] font-bold text-[#1C1C1E] tracking-tight">{subject.name}</h1>
          <p className="text-[13px] text-[#8E8E93] font-medium">{subjectTopics.length}論点</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2.5">
        <Link href={`/subjects/${subjectId}/tree`} className="flex-1 btn-secondary !py-3 !rounded-xl !text-[14px]">
          目次ツリー
        </Link>
        <Link href={`/recall?subject=${subjectId}`} className="flex-1 !py-3 !rounded-xl !text-[14px] block w-full bg-[#34C759]/[0.1] text-[#34C759] text-center font-semibold text-[15px] pressable">
          想起学習
        </Link>
      </div>

      {/* Search */}
      <div className="card overflow-hidden">
        <input
          type="text"
          placeholder="論点名・キーワードで検索..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-4 py-3.5 text-[15px] text-[#1C1C1E] placeholder-[#C7C7CC] focus:outline-none bg-transparent"
        />
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {([['all', 'すべて'], ['weak', '苦手'], ['favorite', 'お気に入り'], ['new', '未学習']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`shrink-0 pill ${filter === key ? 'pill-active' : 'pill-inactive'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Topic List */}
      <div className="space-y-2">
        {filtered.map((t, i) => {
          const status = mounted ? getTopicStatus(t.id) : 'new' as const;
          const isFav = favorites.includes(t.id);
          return (
            <div
              key={t.id}
              className="card p-4 animate-fade-in"
              style={{ animationDelay: `${i * 25}ms` }}
            >
              <div className="flex items-start justify-between gap-2">
                <Link href={`/topics/${t.id}`} className="flex-1 min-w-0 pressable">
                  <p className="font-semibold text-[15px] text-[#1C1C1E] leading-snug">{t.title}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <StatusBadge status={status} />
                    <span className={`text-[11px] font-semibold ${importanceColor(t.importance)}`}>
                      重要度{importanceLabel(t.importance)}
                    </span>
                    <span className="text-[11px] text-[#AEAEB2] font-medium">頻出{importanceLabel(t.frequency)}</span>
                  </div>
                </Link>
                <button onClick={() => handleToggleFav(t.id)} className="shrink-0 p-1.5 -mr-1 pressable">
                  <svg className={`w-[18px] h-[18px] ${isFav ? 'text-[#FF9500]' : 'text-[#C7C7CC]'}`} fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[#F2F2F7] flex items-center justify-center">
              <svg className="w-6 h-6 text-[#C7C7CC]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <p className="text-[15px] text-[#8E8E93] font-medium">該当する論点がありません</p>
          </div>
        )}
      </div>
    </div>
  );
}
