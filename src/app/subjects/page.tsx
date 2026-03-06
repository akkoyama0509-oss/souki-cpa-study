'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { subjects } from '@/data/subjects';
import { topics } from '@/data/topics';
import { getTopicStatus } from '@/lib/review-logic';
import ProgressBar from '@/components/ProgressBar';

export default function SubjectsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const subjectData = subjects.map(s => {
    const subjectTopics = topics.filter(t => t.subjectId === s.id);
    const statuses = mounted ? subjectTopics.map(t => getTopicStatus(t.id)) : [];
    const reviewed = statuses.filter(st => st !== 'new').length;
    const weak = statuses.filter(st => st === 'weak').length;
    const mastered = statuses.filter(st => st === 'mastered').length;
    return { ...s, total: subjectTopics.length, reviewed, weak, mastered };
  });

  return (
    <div className="py-6 space-y-4">
      <h1 className="text-xl font-bold text-slate-800">科目一覧</h1>
      <div className="space-y-3">
        {subjectData.map((s, i) => (
          <Link
            key={s.id}
            href={`/subjects/${s.id}`}
            className="block bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow animate-fade-in"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: s.color }}>
                {s.shortName}
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm text-slate-800">{s.name}</p>
                <p className="text-xs text-slate-500">{s.total}論点</p>
              </div>
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>
            {mounted && (
              <>
                <ProgressBar value={s.reviewed} max={s.total} color="bg-indigo-400" />
                <div className="flex gap-4 mt-2 text-xs text-slate-500">
                  <span>進捗 {s.total > 0 ? Math.round(s.reviewed / s.total * 100) : 0}%</span>
                  {s.weak > 0 && <span className="text-red-500">苦手 {s.weak}</span>}
                  {s.mastered > 0 && <span className="text-emerald-600">習得 {s.mastered}</span>}
                </div>
              </>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
