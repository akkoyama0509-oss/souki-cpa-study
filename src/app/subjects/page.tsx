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
    <div className="pt-8 pb-4 space-y-5">
      <h1 className="text-[28px] font-bold text-[#1C1C1E] tracking-tight">科目一覧</h1>
      <div className="space-y-3">
        {subjectData.map((s, i) => (
          <Link
            key={s.id}
            href={`/subjects/${s.id}`}
            className="block card p-4 active:opacity-80 transition-opacity animate-fade-in"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-white font-semibold text-[13px]" style={{ backgroundColor: s.color }}>
                {s.shortName}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-[15px] text-[#1C1C1E]">{s.name}</p>
                <p className="text-[12px] text-[#8E8E93]">{s.total}論点</p>
              </div>
              <svg className="w-4 h-4 text-[#C7C7CC]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>
            {mounted && (
              <>
                <ProgressBar value={s.reviewed} max={s.total} />
                <div className="flex gap-4 mt-2 text-[12px] text-[#8E8E93]">
                  <span>{s.total > 0 ? Math.round(s.reviewed / s.total * 100) : 0}%</span>
                  {s.weak > 0 && <span className="text-[#FF3B30]">苦手 {s.weak}</span>}
                  {s.mastered > 0 && <span className="text-[#34C759]">習得 {s.mastered}</span>}
                </div>
              </>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
