'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { subjects } from '@/data/subjects';
import { chapters } from '@/data/chapters';
import { topics } from '@/data/topics';
import { getTopicStatus } from '@/lib/review-logic';
import StatusBadge from '@/components/StatusBadge';
import type { Chapter, Topic } from '@/types';

export default function TreeClient() {
  const params = useParams();
  const subjectId = params.subjectId as string;
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => setMounted(true), []);

  const subject = subjects.find(s => s.id === subjectId);
  if (!subject) return <p className="py-6 text-center text-[#8E8E93]">科目が見つかりません</p>;

  const subjectChapters = chapters.filter(c => c.subjectId === subjectId);
  const rootChapters = subjectChapters.filter(c => c.parentId === null).sort((a, b) => a.displayOrder - b.displayOrder);

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpanded(new Set(subjectChapters.map(c => c.id)));
  const collapseAll = () => setExpanded(new Set());

  const getChildChapters = (parentId: string) =>
    subjectChapters.filter(c => c.parentId === parentId).sort((a, b) => a.displayOrder - b.displayOrder);
  const getChapterTopics = (chapterId: string) =>
    topics.filter(t => t.chapterId === chapterId);

  const statusColor = (status: string) => {
    switch (status) {
      case 'mastered': return 'bg-[#34C759]';
      case 'weak': return 'bg-[#FF3B30]';
      case 'due': return 'bg-[#007AFF]';
      default: return 'bg-[#C7C7CC]';
    }
  };

  return (
    <div className="pt-4 pb-4 space-y-4">
      <div className="flex items-center gap-3">
        <Link href={`/subjects/${subjectId}`} className="text-[#5856D6]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <div>
          <h1 className="text-[20px] font-bold text-[#1C1C1E] tracking-tight">{subject.name}</h1>
          <p className="text-[12px] text-[#8E8E93]">目次ツリー</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={expandAll} className="text-[13px] bg-white px-3.5 py-[6px] rounded-lg text-[#8E8E93] active:opacity-80" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
          すべて展開
        </button>
        <button onClick={collapseAll} className="text-[13px] bg-white px-3.5 py-[6px] rounded-lg text-[#8E8E93] active:opacity-80" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
          すべて折りたたみ
        </button>
      </div>

      <div className="space-y-1">
        {rootChapters.map(ch => (
          <ChapterNode key={ch.id} chapter={ch} expanded={expanded} toggleExpand={toggleExpand} getChildChapters={getChildChapters} getChapterTopics={getChapterTopics} statusColor={statusColor} mounted={mounted} />
        ))}
      </div>
    </div>
  );
}

function ChapterNode({ chapter, expanded, toggleExpand, getChildChapters, getChapterTopics, statusColor, mounted }: {
  chapter: Chapter; expanded: Set<string>; toggleExpand: (id: string) => void;
  getChildChapters: (id: string) => Chapter[]; getChapterTopics: (id: string) => Topic[];
  statusColor: (s: string) => string; mounted: boolean;
}) {
  const isExpanded = expanded.has(chapter.id);
  const children = getChildChapters(chapter.id);
  const chapterTopics = getChapterTopics(chapter.id);
  const hasContent = children.length > 0 || chapterTopics.length > 0;

  return (
    <div className="overflow-hidden" style={{ paddingLeft: `${chapter.depth * 12}px` }}>
      <button
        onClick={() => hasContent && toggleExpand(chapter.id)}
        className={`w-full flex items-center gap-2 p-3 rounded-xl text-left transition-colors ${
          chapter.depth === 0 ? 'card font-semibold text-[14px]' : 'bg-[#F2F2F7] text-[13px] font-medium'
        }`}
      >
        {hasContent && (
          <svg className={`w-3.5 h-3.5 shrink-0 text-[#C7C7CC] transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        )}
        {!hasContent && <span className="w-3.5" />}
        <span className="flex-1 text-[#1C1C1E]">{chapter.title}</span>
        {mounted && chapterTopics.length > 0 && (() => {
          const masteredCount = chapterTopics.filter(t => getTopicStatus(t.id) === 'mastered').length;
          return <span className="text-[11px] text-[#AEAEB2]">{masteredCount}/{chapterTopics.length}</span>;
        })()}
      </button>

      {isExpanded && (
        <div className="mt-1 space-y-1">
          {children.map(child => (
            <ChapterNode key={child.id} chapter={child} expanded={expanded} toggleExpand={toggleExpand} getChildChapters={getChildChapters} getChapterTopics={getChapterTopics} statusColor={statusColor} mounted={mounted} />
          ))}
          {chapterTopics.map(t => {
            const status = mounted ? getTopicStatus(t.id) : 'new' as const;
            return (
              <div key={t.id} className="flex items-center gap-1 ml-4">
                <Link href={`/topics/${t.id}`} className="flex items-center gap-2 py-2 px-3 rounded-lg active:bg-[#5856D6]/[0.06] transition-colors flex-1 min-w-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${statusColor(status)}`} />
                  <span className="text-[13px] text-[#1C1C1E] flex-1 truncate">{t.title}</span>
                  <StatusBadge status={status} />
                </Link>
                <Link href={`/recall?topic=${t.id}`} className="shrink-0 p-2 rounded-lg text-[#5856D6] active:bg-[#5856D6]/[0.06]" title="想起">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                  </svg>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
