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
  const dueTopics = dueItems.map(d => topics.find(t => t.id === d.topicId)).filter((t): t is Topic => t !== undefined);
  const weakTopics = mounted ? topics.filter(t => getTopicStatus(t.id) === 'weak') : [];
  const [randomTopics, setRandomTopics] = useState<Topic[]>([]);
  useEffect(() => { if (mounted) setRandomTopics([...topics].sort(() => Math.random() - 0.5).slice(0, 10)); }, [mounted]);

  const displayTopics = tab === 'due' ? dueTopics : tab === 'weak' ? weakTopics : randomTopics;

  return (
    <div className="pt-8 pb-4 space-y-5">
      <h1 className="text-[28px] font-bold text-[#1C1C1E] tracking-tight">復習一覧</h1>

      <div className="flex gap-2">
        {([
          ['due', `今日の復習 (${dueTopics.length})`],
          ['weak', `苦手 (${weakTopics.length})`],
          ['random', 'ランダム'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-[7px] rounded-full text-[13px] font-medium transition-colors ${
              tab === key ? 'bg-[#5856D6] text-white' : 'bg-white text-[#8E8E93]'
            }`}
            style={{ boxShadow: tab !== key ? '0 1px 2px rgba(0,0,0,0.04)' : 'none' }}
          >
            {label}
          </button>
        ))}
      </div>

      {displayTopics.length > 0 && (
        <Link href={`/recall?${tab === 'due' ? '' : tab === 'weak' ? 'mode=weak' : 'mode=random'}`} className="block w-full bg-[#5856D6] text-white text-center py-[14px] rounded-[14px] font-semibold text-[16px] tracking-tight active:opacity-80 transition-opacity">
          {tab === 'due' ? '復習を開始' : tab === 'weak' ? '苦手を克服' : 'ランダム学習'} ({displayTopics.length}件)
        </Link>
      )}

      <div className="space-y-2">
        {displayTopics.map(t => {
          const subject = subjects.find(s => s.id === t.subjectId);
          const status = mounted ? getTopicStatus(t.id) : 'new' as const;
          const queueItem = allQueue.find(q => q.topicId === t.id);
          return (
            <Link key={t.id} href={`/topics/${t.id}`} className="block card p-4 active:opacity-80 transition-opacity">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: subject?.color }}>{subject?.shortName}</span>
                <StatusBadge status={status} />
              </div>
              <p className="font-medium text-[14px] text-[#1C1C1E]">{t.title}</p>
              {queueItem && (
                <p className="text-[12px] text-[#AEAEB2] mt-1">
                  {new Date(queueItem.dueAt).toLocaleDateString('ja-JP')}
                  {queueItem.intervalDays >= 1 ? ` (${Math.round(queueItem.intervalDays)}日)` : ` (${Math.round(queueItem.intervalDays * 24)}h)`}
                </p>
              )}
            </Link>
          );
        })}
        {displayTopics.length === 0 && (
          <div className="text-center py-14">
            <p className="text-[28px] mb-2">{tab === 'due' ? '🎉' : '📚'}</p>
            <p className="text-[14px] text-[#8E8E93]">
              {tab === 'due' ? '今日の復習はすべて完了しました' : tab === 'weak' ? '苦手な論点はありません' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
