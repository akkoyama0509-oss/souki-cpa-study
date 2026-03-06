'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { topics } from '@/data/topics';
import { subjects } from '@/data/subjects';
import { getDueTopics, recordReview, getTopicStatus, getSmartQueue, getTodayStudyStats, getNextDueTime } from '@/lib/review-logic';
import { getGabuComment, getKoyamaComment } from '@/data/characters';
import { getUserStats } from '@/lib/review-logic';
import { SelfRating, Topic } from '@/types';
import CharacterBubble from '@/components/CharacterBubble';

const SESSION_SIZE = 10;

function RecallContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [queue, setQueue] = useState<Topic[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<'thinking' | 'revealed' | 'done'>('thinking');
  const [startTime, setStartTime] = useState(Date.now());
  const [elapsedSec, setElapsedSec] = useState(0);
  const [sessionStats, setSessionStats] = useState({ total: 0, perfect: 0, good: 0, recognize: 0, forgot: 0 });

  const buildQueue = useCallback(() => {
    const topicId = searchParams.get('topic');
    const subjectId = searchParams.get('subject');

    if (topicId) {
      const t = topics.find(tp => tp.id === topicId);
      return t ? [t] : [];
    }

    const dueItems = getDueTopics();
    let dueTopics = dueItems
      .map(d => topics.find(t => t.id === d.topicId))
      .filter((t): t is Topic => t !== undefined);

    if (subjectId) {
      dueTopics = dueTopics.filter(t => t.subjectId === subjectId);
    }

    if (dueTopics.length === 0) {
      return getSmartQueue(topics, subjectId ?? undefined);
    }

    return dueTopics.slice(0, SESSION_SIZE);
  }, [searchParams]);

  useEffect(() => {
    setMounted(true);
    setQueue(buildQueue());
  }, [buildQueue]);

  useEffect(() => {
    if (phase !== 'thinking') return;
    setElapsedSec(0);
    const interval = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, startTime]);

  const currentTopic = queue[currentIndex];
  const subject = currentTopic ? subjects.find(s => s.id === currentTopic.subjectId) : null;

  const handleReveal = () => {
    setPhase('revealed');
  };

  const handleRate = (rating: SelfRating) => {
    if (!currentTopic) return;
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    recordReview(currentTopic.id, rating, elapsed);
    setSessionStats(prev => ({
      ...prev,
      total: prev.total + 1,
      [rating]: prev[rating] + 1,
    }));

    if (currentIndex < queue.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setPhase('thinking');
      setStartTime(Date.now());
    } else {
      setPhase('done');
    }
  };

  if (!mounted) {
    return (
      <div className="py-6">
        <div className="animate-pulse space-y-4">
          <div className="bg-slate-200 rounded-2xl h-48" />
          <div className="bg-slate-200 rounded-2xl h-16" />
        </div>
      </div>
    );
  }

  if (queue.length === 0) {
    const stats = getUserStats();
    return (
      <div className="py-6 space-y-4 text-center">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
          <p className="text-2xl mb-3">🎉</p>
          <h2 className="text-xl font-bold text-slate-800 mb-2">復習待ちの論点がありません</h2>
          <p className="text-sm text-slate-500 mb-6">科目一覧から新しい論点を学習しましょう</p>
          <Link
            href="/subjects"
            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            科目一覧へ
          </Link>
        </div>
        <CharacterBubble character="gabu" message={getGabuComment(stats, 0)} />
      </div>
    );
  }

  if (phase === 'done') {
    const stats = getUserStats();
    const todayStats = getTodayStudyStats();
    const nextDue = getNextDueTime();
    const successRate = sessionStats.total > 0
      ? Math.round((sessionStats.perfect + sessionStats.good) / sessionStats.total * 100)
      : 0;

    const formatNextDue = (dueAt: string) => {
      const diff = new Date(dueAt).getTime() - Date.now();
      if (diff <= 0) return '今すぐ';
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours < 1) return `${Math.ceil(diff / (1000 * 60))}分後`;
      if (hours < 24) return `${hours}時間後`;
      return `${Math.floor(hours / 24)}日後`;
    };

    return (
      <div className="py-6 space-y-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center animate-slide-up">
          <p className="text-2xl mb-3">🏆</p>
          <h2 className="text-xl font-bold text-slate-800 mb-2">セッション完了！</h2>

          {/* Today's total */}
          <p className="text-sm text-slate-500 mb-4">
            今日の復習: <span className="font-bold text-indigo-600">{todayStats.reviewedToday}問</span>
            {todayStats.dueCount > 0 && <span> / あと<span className="font-bold text-blue-600">{todayStats.dueCount}問</span></span>}
          </p>

          {/* Rating breakdown */}
          <div className="grid grid-cols-4 gap-2 mt-3">
            <div className="bg-emerald-50 rounded-xl p-2">
              <p className="text-lg font-bold text-emerald-700">{sessionStats.perfect}</p>
              <p className="text-[10px] text-slate-500">完璧</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-2">
              <p className="text-lg font-bold text-blue-700">{sessionStats.good}</p>
              <p className="text-[10px] text-slate-500">だいたい</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-2">
              <p className="text-lg font-bold text-amber-700">{sessionStats.recognize}</p>
              <p className="text-[10px] text-slate-500">見れば分かる</p>
            </div>
            <div className="bg-red-50 rounded-xl p-2">
              <p className="text-lg font-bold text-red-600">{sessionStats.forgot}</p>
              <p className="text-[10px] text-slate-500">出ない</p>
            </div>
          </div>

          {/* Success rate bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>想起成功率</span>
              <span className="font-bold text-indigo-600">{successRate}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${successRate}%` }} />
            </div>
          </div>

          {/* Next review estimate */}
          {nextDue && (
            <div className="mt-4 bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-500">次の復習予定</p>
              <p className="text-sm font-bold text-slate-700">{formatNextDue(nextDue)}</p>
            </div>
          )}
        </div>

        <CharacterBubble character="gabu" message={getGabuComment(stats, todayStats.dueCount)} />
        <CharacterBubble character="koyama" message={getKoyamaComment(stats, todayStats.dueCount)} />

        {todayStats.dueCount > 0 && (
          <div className="bg-blue-50 rounded-xl p-3 text-center">
            <p className="text-xs text-blue-700">
              今日あと <span className="font-bold">{todayStats.dueCount}問</span> 残っています
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <Link href="/" className="flex-1 bg-white text-slate-700 text-center py-3 rounded-xl font-medium border border-slate-200 hover:bg-slate-50">
            ホームへ
          </Link>
          <button
            onClick={() => {
              setQueue(buildQueue());
              setCurrentIndex(0);
              setPhase('thinking');
              setStartTime(Date.now());
              setSessionStats({ total: 0, perfect: 0, good: 0, recognize: 0, forgot: 0 });
            }}
            className="flex-1 bg-indigo-600 text-white text-center py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            もう10問やる
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-slate-500">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-slate-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <span>{currentIndex + 1} / {queue.length}</span>
      </div>

      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
        <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${((currentIndex + 1) / queue.length) * 100}%` }} />
      </div>

      {/* Topic Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in" key={currentTopic.id}>
        {/* Subject tag */}
        <div className="px-4 pt-4">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: subject?.color }}>
            {subject?.shortName}
          </span>
        </div>

        {/* Prompt (main) + Title (supplementary) */}
        <div className="p-6 text-center">
          <p className="text-xs text-slate-400 mb-2">{currentTopic.title}</p>
          <div className="text-left">
            {currentTopic.prompt.split('\n').map((line, i) => (
              <p key={i} className="text-[15px] font-bold text-slate-800 leading-relaxed">{line}</p>
            ))}
          </div>
          {phase === 'thinking' && (
            <>
              <p className="text-xl font-mono font-bold text-indigo-500 mt-4">
                {Math.floor(elapsedSec / 60).toString().padStart(2, '0')}:{(elapsedSec % 60).toString().padStart(2, '0')}
              </p>

              {/* Hint after 30 seconds */}
              {elapsedSec >= 30 && (
                <div className="mt-4 text-left bg-amber-50 rounded-xl p-3 border border-amber-100 animate-fade-in">
                  <p className="text-[10px] font-semibold text-amber-600 mb-1">ヒント</p>
                  <p className="text-xs text-amber-800">{currentTopic.gabuComment}</p>
                  {elapsedSec >= 45 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {currentTopic.keywords.slice(0, 2).map(kw => (
                        <span key={kw} className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full">{kw}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {elapsedSec < 30 && (
                <p className="text-xs text-slate-400 mt-2">頭の中で答案骨格を組み立ててください...</p>
              )}
            </>
          )}
        </div>

        {/* Reveal */}
        {phase === 'thinking' && (
          <div className="px-6 pb-6">
            <button
              onClick={handleReveal}
              className="w-full bg-slate-100 text-slate-700 py-4 rounded-xl font-medium hover:bg-slate-200 transition-colors text-sm"
            >
              答えを見る
            </button>
          </div>
        )}

        {/* Answer */}
        {phase === 'revealed' && (
          <div className="px-6 pb-6 space-y-4 animate-slide-up">
            {/* Summary */}
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-500 mb-1">要約</p>
              <p className="text-sm text-slate-700 leading-relaxed">{currentTopic.summary}</p>
            </div>

            {/* Answer Framework */}
            <div className="bg-indigo-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-indigo-700 mb-2">答案骨格</p>
              <ol className="space-y-1.5">
                {currentTopic.answerFramework.map((step, i) => (
                  <li key={i} className="flex gap-2 text-sm text-indigo-900">
                    <span className="shrink-0 text-xs text-indigo-500 font-bold mt-0.5">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Keywords */}
            <div className="flex flex-wrap gap-1.5">
              {currentTopic.keywords.map(kw => (
                <span key={kw} className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">{kw}</span>
              ))}
            </div>

            {/* Character comments */}
            <div className="flex gap-2">
              <div className="flex-1 bg-amber-50 rounded-xl p-3 border border-amber-100">
                <p className="text-[10px] font-semibold text-amber-700 mb-0.5">ガブ</p>
                <p className="text-xs text-amber-900 leading-relaxed">{currentTopic.gabuComment}</p>
              </div>
              <div className="flex-1 bg-slate-50 rounded-xl p-3 border border-slate-200">
                <p className="text-[10px] font-semibold text-slate-600 mb-0.5">小山</p>
                <p className="text-xs text-slate-800 leading-relaxed">{currentTopic.koyamaComment}</p>
              </div>
            </div>

            {/* Rating buttons */}
            <div className="space-y-2 pt-2">
              <p className="text-xs text-slate-500 text-center">想起できましたか？</p>
              <div className="grid grid-cols-2 gap-2">
                <RatingButton rating="perfect" label="完璧に言えた" color="bg-emerald-500" onClick={handleRate} />
                <RatingButton rating="good" label="だいたい言えた" color="bg-blue-500" onClick={handleRate} />
                <RatingButton rating="recognize" label="見ればわかる" color="bg-amber-500" onClick={handleRate} />
                <RatingButton rating="forgot" label="全然出ない" color="bg-red-500" onClick={handleRate} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-center text-[10px] text-slate-400 -mt-1">
                <span>+20 XP / 7日後</span>
                <span>+10 XP / 3日後</span>
                <span>+5 XP / 1日後</span>
                <span>+2 XP / 6時間後</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RatingButton({ rating, label, color, onClick }: { rating: SelfRating; label: string; color: string; onClick: (r: SelfRating) => void }) {
  return (
    <button
      onClick={() => onClick(rating)}
      className={`${color} text-white py-3 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity active:scale-[0.97]`}
    >
      {label}
    </button>
  );
}

export default function RecallPage() {
  return (
    <Suspense fallback={<div className="py-6"><div className="animate-pulse bg-slate-200 rounded-2xl h-48" /></div>}>
      <RecallContent />
    </Suspense>
  );
}
