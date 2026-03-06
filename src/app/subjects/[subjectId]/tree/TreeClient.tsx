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
  if (!subject) return <p className="py-6 text-center text-slate-500">科目が見つかりません</p>;

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
      case 'mastered': return 'bg-emerald-400';
      case 'weak': return 'bg-red-400';
      case 'due': return 'bg-blue-400';
      default: return 'bg-slate-300';
    }
  };

  return (
    <div className="py-6 space-y-4">
      <div className="flex items-center gap-3">
        <Link href={`/subjects/${subjectId}`} className="text-slate-400 hover:text-slate-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-800">{subject.name}</h1>
          <p className="text-xs text-slate-500">目次ツリー</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={expandAll} className="text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-50">
          すべて展開
        </button>
        <button onClick={collapseAll} className="text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-50">
          すべて折りたたみ
        </button>
      </div>

      <div className="space-y-1">
        {rootChapters.map(ch => (
          <ChapterNode
            key={ch.id}
            chapter={ch}
            expanded={expanded}
            toggleExpand={toggleExpand}
            getChildChapters={getChildChapters}
            getChapterTopics={getChapterTopics}
            statusColor={statusColor}
            mounted={mounted}
          />
        ))}
      </div>
    </div>
  );
}

function ChapterNode({
  chapter, expanded, toggleExpand, getChildChapters, getChapterTopics, statusColor, mounted,
}: {
  chapter: Chapter;
  expanded: Set<string>;
  toggleExpand: (id: string) => void;
  getChildChapters: (id: string) => Chapter[];
  getChapterTopics: (id: string) => Topic[];
  statusColor: (s: string) => string;
  mounted: boolean;
}) {
  const isExpanded = expanded.has(chapter.id);
  const children = getChildChapters(chapter.id);
  const chapterTopics = getChapterTopics(chapter.id);
  const hasContent = children.length > 0 || chapterTopics.length > 0;

  return (
    <div style={{ paddingLeft: `${chapter.depth * 16}px` }}>
      <button
        onClick={() => hasContent && toggleExpand(chapter.id)}
        className={`w-full flex items-center gap-2 p-3 rounded-xl text-left transition-colors ${
          chapter.depth === 0
            ? 'bg-white shadow-sm border border-slate-100 font-bold text-sm'
            : 'bg-slate-50 text-sm font-medium hover:bg-slate-100'
        }`}
      >
        {hasContent && (
          <svg className={`w-4 h-4 shrink-0 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        )}
        {!hasContent && <span className="w-4" />}
        <span className="flex-1 text-slate-800">{chapter.title}</span>
        {mounted && chapterTopics.length > 0 && (() => {
          const masteredCount = chapterTopics.filter(t => getTopicStatus(t.id) === 'mastered').length;
          return (
            <span className="text-xs text-slate-400">
              {masteredCount}/{chapterTopics.length} 習得
            </span>
          );
        })()}
        {!mounted && chapterTopics.length > 0 && (
          <span className="text-xs text-slate-400">{chapterTopics.length}論点</span>
        )}
      </button>

      {isExpanded && (
        <div className="mt-1 space-y-1">
          {children.map(child => (
            <ChapterNode
              key={child.id}
              chapter={child}
              expanded={expanded}
              toggleExpand={toggleExpand}
              getChildChapters={getChildChapters}
              getChapterTopics={getChapterTopics}
              statusColor={statusColor}
              mounted={mounted}
            />
          ))}
          {chapterTopics.map(t => {
            const status = mounted ? getTopicStatus(t.id) : 'new' as const;
            return (
              <div key={t.id} className="flex items-center gap-1 ml-6">
                <Link
                  href={`/topics/${t.id}`}
                  className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-indigo-50 transition-colors flex-1 min-w-0"
                >
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${statusColor(status)}`} />
                  <span className="text-sm text-slate-700 flex-1 truncate">{t.title}</span>
                  <StatusBadge status={status} />
                </Link>
                <Link
                  href={`/recall?topic=${t.id}`}
                  className="shrink-0 p-2 rounded-lg text-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                  title="この論点を想起する"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
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
