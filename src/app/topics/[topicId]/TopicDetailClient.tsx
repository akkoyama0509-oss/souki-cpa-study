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
  if (!topic) return <p className="py-6 text-center text-slate-500">論点が見つかりません</p>;

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
    <div className="py-6 space-y-4">
      <div className="flex items-start gap-3">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-slate-600 mt-1">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-500 mb-1">
            {subject?.shortName} &gt; {parentChapter?.title ?? chapter?.title}
          </p>
          <h1 className="text-lg font-bold text-slate-800 leading-snug">{topic.title}</h1>
        </div>
        <button onClick={handleToggleFav} className="shrink-0 p-1">
          <svg className={`w-6 h-6 ${isFav ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <StatusBadge status={status} />
        <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full font-medium">重要度{importanceLabel(topic.importance)}</span>
        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">頻出{frequencyLabel(topic.frequency)}</span>
        <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium">{difficultyLabel(topic.difficulty)}</span>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <h2 className="font-bold text-sm text-slate-700 mb-2">一言要約</h2>
        <p className="text-sm text-slate-700 leading-relaxed">{topic.summary}</p>
      </div>

      <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
        <h2 className="font-bold text-sm text-indigo-800 mb-3">答案骨格</h2>
        <ol className="space-y-2">
          {topic.answerFramework.map((step, i) => (
            <li key={i} className="flex gap-2 text-sm text-indigo-900">
              <span className="shrink-0 w-5 h-5 bg-indigo-200 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold">
                {i + 1}
              </span>
              <span className="leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <h2 className="font-bold text-sm text-slate-700 mb-2">キーワード</h2>
        <div className="flex flex-wrap gap-2">
          {topic.keywords.map(kw => (
            <span key={kw} className="bg-slate-100 text-slate-700 text-xs px-3 py-1 rounded-full">
              {kw}
            </span>
          ))}
        </div>
      </div>

      {relatedTopicsList.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <h2 className="font-bold text-sm text-slate-700 mb-2">関連論点</h2>
          <div className="space-y-2">
            {relatedTopicsList.map(t => t && (
              <Link key={t.id} href={`/topics/${t.id}`} className="block text-sm text-indigo-600 hover:text-indigo-800">
                {t.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      {mounted && logs.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <h2 className="font-bold text-sm text-slate-700 mb-2">学習履歴</h2>
          <p className="text-xs text-slate-500 mb-2">直近{Math.min(logs.length, 5)}件</p>
          <div className="space-y-1">
            {logs.slice(-5).reverse().map(log => {
              const ratingLabels: Record<string, string> = { perfect: '完璧', good: 'だいたい', recognize: '見ればわかる', forgot: '出なかった' };
              const ratingColors: Record<string, string> = { perfect: 'text-emerald-600', good: 'text-blue-600', recognize: 'text-amber-600', forgot: 'text-red-600' };
              return (
                <div key={log.id} className="flex justify-between text-sm">
                  <span className="text-slate-500">{new Date(log.reviewedAt).toLocaleDateString('ja-JP')}</span>
                  <span className={`font-medium ${ratingColors[log.selfRating]}`}>{ratingLabels[log.selfRating]}</span>
                </div>
              );
            })}
          </div>
          {queue && (
            <p className="text-xs text-slate-400 mt-3 pt-2 border-t border-slate-100">
              次回復習: {new Date(queue.dueAt).toLocaleDateString('ja-JP')} (間隔: {queue.intervalDays >= 1 ? `${Math.round(queue.intervalDays)}日` : `${Math.round(queue.intervalDays * 24)}時間`})
            </p>
          )}
        </div>
      )}

      <Link
        href={`/recall?topic=${topic.id}`}
        className="block w-full bg-indigo-600 text-white text-center py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors active:scale-[0.98]"
      >
        この論点を想起する
      </Link>
    </div>
  );
}
