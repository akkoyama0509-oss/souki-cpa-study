'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { topics } from '@/data/topics';
import { subjects } from '@/data/subjects';
import { getDueTopics, getTopicStatus } from '@/lib/review-logic';
import { getItem } from '@/lib/storage';
import { StudyQueue, Topic } from '@/types';
import StatusBadge from '@/components/StatusBadge';

type Tab = 'due' | 'weak' | 'random';

export default function ReviewPage() {
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>('due');

  useEffect(() => setMounted(true), []);

  const dueItems = mounted ? getDueTopics() : [];
  const allQueue = mounted ? getItem<StudyQueue[]>('studyQueue', []) : [];

  const dueTopics = dueItems
    .map(d => topics.find(t => t.id === d.topicId))
    .filter((t): t is Topic => t !== undefined);

  const weakTopics = mounted
    ? topics.filter(t => getTopicStatus(t.id) === 'weak')
    : [];

  const [randomTopics, setRandomTopics] = useState<Topic[]>([]);

  useEffect(() => {
    if (mounted) {
      const shuffled = [...topics].sort(() => Math.random() - 0.5);
      setRandomTopics(shuffled.slice(0, 10));
    }
  }, [mounted]);

  const displayTopics = tab === 'due' ? dueTopics : tab === 'weak' ? weakTopics : randomTopics;

  return (
    <div className="py-6 space-y-4">
      <h1 className="text-xl font-bold text-slate-800">復習一覧</h1>

      {/* Tabs */}
      <div className="flex gap-2">
        {([
          ['due', `今日の復習 (${dueTopics.length})`],
          ['weak', `苦手 (${weakTopics.length})`],
          ['random', 'ランダム'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === key ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Start button */}
      {displayTopics.length > 0 && (
        <Link
          href={`/recall?${tab === 'due' ? '' : tab === 'weak' ? 'mode=weak' : 'mode=random'}`}
          className="block w-full bg-indigo-600 text-white text-center py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors active:scale-[0.98]"
        >
          {tab === 'due' ? '復習を開始' : tab === 'weak' ? '苦手を克服' : 'ランダム学習'} ({displayTopics.length}件)
        </Link>
      )}

      {/* List */}
      <div className="space-y-2">
        {displayTopics.map(t => {
          const subject = subjects.find(s => s.id === t.subjectId);
          const status = mounted ? getTopicStatus(t.id) : 'new' as const;
          const queueItem = allQueue.find(q => q.topicId === t.id);

          return (
            <Link
              key={t.id}
              href={`/topics/${t.id}`}
              className="block bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: subject?.color }}>
                  {subject?.shortName}
                </span>
                <StatusBadge status={status} />
              </div>
              <p className="font-medium text-sm text-slate-800 mt-1">{t.title}</p>
              {queueItem && (
                <p className="text-xs text-slate-400 mt-1">
                  期限: {new Date(queueItem.dueAt).toLocaleDateString('ja-JP')}
                  {queueItem.intervalDays >= 1
                    ? ` (${Math.round(queueItem.intervalDays)}日間隔)`
                    : ` (${Math.round(queueItem.intervalDays * 24)}h間隔)`
                  }
                </p>
              )}
            </Link>
          );
        })}
        {displayTopics.length === 0 && (
          <div className="text-center py-12">
            <p className="text-2xl mb-2">{tab === 'due' ? '🎉' : '📚'}</p>
            <p className="text-sm text-slate-500">
              {tab === 'due' ? '今日の復習はすべて完了しました！' : tab === 'weak' ? '苦手な論点はありません！' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
