'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { subjects } from '@/data/subjects';
import { chapters } from '@/data/chapters';
import { topics } from '@/data/topics';
import { getTopicStatus, getReviewLogsForTopic, getQueueForTopic, getFavorites, toggleFavorite } from '@/lib/review-logic';
import StatusBadge from '@/components/StatusBadge';

export default function TopicDetailClient() {
  const params = useParams();
  const router = useRouter();
  const topicId = params.topicId as string;
  const [mounted, setMounted] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => setMounted(true), []);

  const topic = topics.find(t => t.id === topicId);
  if (!topic) return <p className="py-6 text-center text-[#8E8E93]">論点が見つかりません</p>;

  const subject = subjects.find(s => s.id === topic.subjectId);
  const chapter = chapters.find(c => c.id === topic.chapterId);
  const parentChapter = chapter?.parentId ? chapters.find(c => c.id === chapter.parentId) : null;

  const status = mounted ? getTopicStatus(topic.id) : 'new' as const;
  const logs = mounted ? getReviewLogsForTopic(topic.id) : [];
  const queue = mounted ? getQueueForTopic(topic.id) : undefined;
  const favorites = mounted ? getFavorites() : [];
  const isFav = favorites.includes(topic.id);

  const relatedTopicsList = topic.relatedTopics.map(id => topics.find(t => t.id === id)).filter(Boolean);
  const importanceLabel = (v: number) => ['', 'C', 'B', 'A'][v];
  const frequencyLabel = (v: number) => ['', '低', '中', '高'][v];
  const difficultyLabel = (v: number) => ['', '基礎', '標準', '発展'][v];

  const handleToggleFav = () => {
    toggleFavorite(topic.id);
    setTick(t => t + 1);
  };

  return (
    <div className="pt-4 pb-4 space-y-4">
      <div className="flex items-start gap-3">
        <button onClick={() => router.back()} className="text-[#5856D6] mt-0.5">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] text-[#8E8E93] mb-0.5">
            {subject?.shortName} &gt; {parentChapter?.title ?? chapter?.title}
          </p>
          <h1 className="text-[18px] font-bold text-[#1C1C1E] leading-snug tracking-tight">{topic.title}</h1>
        </div>
        <button onClick={handleToggleFav} className="shrink-0 p-1.5">
          <svg className={`w-[20px] h-[20px] ${isFav ? 'text-[#FF9500]' : 'text-[#C7C7CC]'}`} fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <StatusBadge status={status} />
        <span className="text-[11px] bg-[#FF3B30]/[0.08] text-[#FF3B30] px-2.5 py-0.5 rounded-full font-medium">重要度{importanceLabel(topic.importance)}</span>
        <span className="text-[11px] bg-[#007AFF]/[0.08] text-[#007AFF] px-2.5 py-0.5 rounded-full font-medium">頻出{frequencyLabel(topic.frequency)}</span>
        <span className="text-[11px] bg-[#AF52DE]/[0.08] text-[#AF52DE] px-2.5 py-0.5 rounded-full font-medium">{difficultyLabel(topic.difficulty)}</span>
      </div>

      <div className="card p-4">
        <h2 className="text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wider mb-2">一言要約</h2>
        <p className="text-[14px] text-[#1C1C1E] leading-relaxed">{topic.summary}</p>
      </div>

      <div className="bg-[#5856D6]/[0.05] rounded-2xl p-4">
        <h2 className="text-[13px] font-semibold text-[#5856D6] uppercase tracking-wider mb-3">答案骨格</h2>
        <ol className="space-y-2.5">
          {topic.answerFramework.map((step, i) => (
            <li key={i} className="flex gap-2.5 text-[14px] text-[#1C1C1E]">
              <span className="shrink-0 w-5 h-5 bg-[#5856D6]/20 text-[#5856D6] rounded-full flex items-center justify-center text-[11px] font-bold mt-0.5">
                {i + 1}
              </span>
              <span className="leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="card p-4">
        <h2 className="text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wider mb-2.5">キーワード</h2>
        <div className="flex flex-wrap gap-2">
          {topic.keywords.map(kw => (
            <span key={kw} className="bg-[#F2F2F7] text-[#636366] text-[12px] px-3 py-1 rounded-full font-medium">{kw}</span>
          ))}
        </div>
      </div>

      {relatedTopicsList.length > 0 && (
        <div className="card p-4">
          <h2 className="text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wider mb-2">関連論点</h2>
          <div className="space-y-2">
            {relatedTopicsList.map(t => t && (
              <Link key={t.id} href={`/topics/${t.id}`} className="block text-[14px] text-[#5856D6]">{t.title}</Link>
            ))}
          </div>
        </div>
      )}

      {mounted && logs.length > 0 && (
        <div className="card p-4">
          <h2 className="text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wider mb-2.5">学習履歴</h2>
          <div className="space-y-1.5">
            {logs.slice(-5).reverse().map(log => {
              const ratingLabels: Record<string, string> = { perfect: '完璧', good: 'だいたい', recognize: '見ればわかる', forgot: '出なかった' };
              const ratingColors: Record<string, string> = { perfect: 'text-[#34C759]', good: 'text-[#007AFF]', recognize: 'text-[#FF9500]', forgot: 'text-[#FF3B30]' };
              return (
                <div key={log.id} className="flex justify-between text-[13px]">
                  <span className="text-[#8E8E93]">{new Date(log.reviewedAt).toLocaleDateString('ja-JP')}</span>
                  <span className={`font-medium ${ratingColors[log.selfRating]}`}>{ratingLabels[log.selfRating]}</span>
                </div>
              );
            })}
          </div>
          {queue && (
            <div className="separator my-3" />
          )}
          {queue && (
            <p className="text-[12px] text-[#AEAEB2]">
              次回: {new Date(queue.dueAt).toLocaleDateString('ja-JP')} ({queue.intervalDays >= 1 ? `${Math.round(queue.intervalDays)}日` : `${Math.round(queue.intervalDays * 24)}h`}間隔)
            </p>
          )}
        </div>
      )}

      <Link
        href={`/recall?topic=${topic.id}`}
        className="block w-full bg-[#5856D6] text-white text-center py-[14px] rounded-[14px] font-semibold text-[16px] tracking-tight active:opacity-80 transition-opacity"
      >
        この論点を想起する
      </Link>
    </div>
  );
}
