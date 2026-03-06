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
    if (topicId) { const t = topics.find(tp => tp.id === topicId); return t ? [t] : []; }
    const dueItems = getDueTopics();
    let dueTopics = dueItems.map(d => topics.find(t => t.id === d.topicId)).filter((t): t is Topic => t !== undefined);
    if (subjectId) dueTopics = dueTopics.filter(t => t.subjectId === subjectId);
    if (dueTopics.length === 0) return getSmartQueue(topics, subjectId ?? undefined);
    return dueTopics.slice(0, SESSION_SIZE);
  }, [searchParams]);

  useEffect(() => { setMounted(true); setQueue(buildQueue()); }, [buildQueue]);
  useEffect(() => {
    if (phase !== 'thinking') return;
    setElapsedSec(0);
    const interval = setInterval(() => setElapsedSec(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [phase, startTime]);

  const currentTopic = queue[currentIndex];
  const subject = currentTopic ? subjects.find(s => s.id === currentTopic.subjectId) : null;

  const handleReveal = () => setPhase('revealed');
  const handleRate = (rating: SelfRating) => {
    if (!currentTopic) return;
    recordReview(currentTopic.id, rating, Math.round((Date.now() - startTime) / 1000));
    setSessionStats(prev => ({ ...prev, total: prev.total + 1, [rating]: prev[rating] + 1 }));
    if (currentIndex < queue.length - 1) { setCurrentIndex(prev => prev + 1); setPhase('thinking'); setStartTime(Date.now()); }
    else setPhase('done');
  };

  if (!mounted) return (
    <div className="pt-8 space-y-4">
      <div className="card h-48 animate-shimmer rounded-2xl" />
      <div className="card h-16 animate-shimmer rounded-2xl" />
    </div>
  );

  if (queue.length === 0) {
    const stats = getUserStats();
    return (
      <div className="pt-[52px] space-y-6 text-center">
        <div className="card px-6 py-10 animate-scale-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#34C759]/[0.1] flex items-center justify-center">
            <span className="text-[32px]">🎉</span>
          </div>
          <h2 className="text-[22px] font-bold text-[#1C1C1E] tracking-tight">お疲れさまでした</h2>
          <p className="text-[15px] text-[#8E8E93] mt-2 mb-6">科目一覧から新しい論点を学習しましょう</p>
          <Link href="/subjects" className="btn-primary">科目一覧へ</Link>
        </div>
        <CharacterBubble character="gabu" message={getGabuComment(stats, 0)} />
      </div>
    );
  }

  if (phase === 'done') {
    const stats = getUserStats();
    const todayStats = getTodayStudyStats();
    const nextDue = getNextDueTime();
    const successRate = sessionStats.total > 0 ? Math.round((sessionStats.perfect + sessionStats.good) / sessionStats.total * 100) : 0;
    const formatNextDue = (dueAt: string) => {
      const diff = new Date(dueAt).getTime() - Date.now();
      if (diff <= 0) return '今すぐ';
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours < 1) return `${Math.ceil(diff / (1000 * 60))}分後`;
      if (hours < 24) return `${hours}時間後`;
      return `${Math.floor(hours / 24)}日後`;
    };

    return (
      <div className="pt-8 space-y-5">
        <div className="card px-5 py-7 text-center animate-scale-in">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[#FFD60A]/[0.15] flex items-center justify-center">
            <span className="text-[28px]">🏆</span>
          </div>
          <h2 className="text-[22px] font-bold text-[#1C1C1E] tracking-tight">セッション完了</h2>
          <p className="text-[14px] text-[#8E8E93] mt-1.5">
            今日の復習: <span className="font-bold text-[#5856D6]">{todayStats.reviewedToday}問</span>
            {todayStats.dueCount > 0 && <span> / 残り<span className="font-bold text-[#007AFF]">{todayStats.dueCount}問</span></span>}
          </p>

          <div className="grid grid-cols-4 gap-2 mt-5">
            {[
              { count: sessionStats.perfect, label: '完璧', color: '#34C759' },
              { count: sessionStats.good, label: 'だいたい', color: '#007AFF' },
              { count: sessionStats.recognize, label: '見れば', color: '#FF9500' },
              { count: sessionStats.forgot, label: '出ない', color: '#FF3B30' },
            ].map(item => (
              <div key={item.label} className="rounded-xl py-2.5" style={{ backgroundColor: `${item.color}0A` }}>
                <p className="text-[20px] font-bold tabular-nums" style={{ color: item.color }}>{item.count}</p>
                <p className="text-[10px] text-[#8E8E93] mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <div className="flex justify-between text-[12px] text-[#8E8E93] mb-2">
              <span>想起成功率</span>
              <span className="font-bold text-[#5856D6] tabular-nums">{successRate}%</span>
            </div>
            <div className="w-full bg-black/[0.05] rounded-full h-[4px] overflow-hidden">
              <div className="h-full bg-[#5856D6] rounded-full transition-all duration-700" style={{ width: `${successRate}%` }} />
            </div>
          </div>

          {nextDue && (
            <div className="mt-5 card-inset p-3.5 text-center">
              <p className="text-[11px] text-[#8E8E93] font-medium">次の復習予定</p>
              <p className="text-[15px] font-bold text-[#1C1C1E] mt-0.5">{formatNextDue(nextDue)}</p>
            </div>
          )}
        </div>

        <CharacterBubble character="gabu" message={getGabuComment(stats, todayStats.dueCount)} />
        <CharacterBubble character="koyama" message={getKoyamaComment(stats, todayStats.dueCount)} />

        <div className="flex gap-3">
          <Link href="/" className="flex-1 card text-[#1C1C1E] text-center py-3.5 rounded-[14px] font-semibold text-[15px] pressable">ホームへ</Link>
          <button onClick={() => { setQueue(buildQueue()); setCurrentIndex(0); setPhase('thinking'); setStartTime(Date.now()); setSessionStats({ total: 0, perfect: 0, good: 0, recognize: 0, forgot: 0 }); }} className="flex-1 btn-primary !rounded-[14px]">
            もう10問やる
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="text-[#5856D6] p-1 pressable">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <span className="text-[14px] font-semibold text-[#8E8E93] tabular-nums">{currentIndex + 1} / {queue.length}</span>
      </div>

      {/* Progress */}
      <div className="w-full bg-black/[0.05] rounded-full h-[3px] overflow-hidden">
        <div className="h-full bg-[#5856D6] rounded-full transition-all duration-500 ease-out" style={{ width: `${((currentIndex + 1) / queue.length) * 100}%` }} />
      </div>

      {/* Question Card */}
      <div className="card overflow-hidden animate-fade-in" key={currentTopic.id}>
        <div className="px-5 pt-5 pb-1">
          <span className="inline-flex text-[11px] font-bold px-2.5 py-[3px] rounded-md text-white" style={{ backgroundColor: subject?.color }}>{subject?.shortName}</span>
        </div>

        <div className="px-5 py-4">
          <p className="text-[12px] text-[#AEAEB2] mb-2 font-medium">{currentTopic.title}</p>
          <div>
            {currentTopic.prompt.split('\n').map((line, i) => (
              <p key={i} className="text-[16px] font-semibold text-[#1C1C1E] leading-[1.6]">{line}</p>
            ))}
          </div>

          {phase === 'thinking' && (
            <div className="mt-6 text-center">
              <p className="text-[28px] font-mono font-bold text-[#5856D6] tabular-nums tracking-tight">
                {Math.floor(elapsedSec / 60).toString().padStart(2, '0')}:{(elapsedSec % 60).toString().padStart(2, '0')}
              </p>

              {elapsedSec >= 30 && (
                <div className="mt-5 text-left bg-[#FF9500]/[0.06] rounded-2xl p-4 animate-fade-in">
                  <p className="text-[11px] font-bold text-[#FF9500] mb-1.5 uppercase tracking-wider">ヒント</p>
                  <p className="text-[14px] text-[#1C1C1E]/70 leading-relaxed">{currentTopic.gabuComment}</p>
                  {elapsedSec >= 45 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {currentTopic.keywords.slice(0, 2).map(kw => (
                        <span key={kw} className="bg-[#FF9500]/[0.12] text-[#FF9500] text-[11px] px-2.5 py-0.5 rounded-md font-semibold">{kw}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {elapsedSec < 30 && <p className="text-[14px] text-[#AEAEB2] mt-2.5">答案骨格を組み立てましょう...</p>}
            </div>
          )}
        </div>

        {phase === 'thinking' && (
          <div className="px-5 pb-5">
            <button onClick={handleReveal} className="w-full card-inset text-[#1C1C1E] py-[14px] rounded-[12px] font-semibold text-[15px] pressable">答えを見る</button>
          </div>
        )}

        {phase === 'revealed' && (
          <div className="px-5 pb-5 space-y-4 animate-slide-up">
            <div className="card-inset p-4">
              <p className="section-header mb-1.5">要約</p>
              <p className="text-[14px] text-[#1C1C1E] leading-[1.6]">{currentTopic.summary}</p>
            </div>

            <div className="bg-[#5856D6]/[0.05] rounded-2xl p-4">
              <p className="text-[11px] font-bold text-[#5856D6] uppercase tracking-wider mb-2.5">答案骨格</p>
              <ol className="space-y-2.5">
                {currentTopic.answerFramework.map((step, i) => (
                  <li key={i} className="flex gap-2.5 text-[14px] text-[#1C1C1E]">
                    <span className="shrink-0 w-5 h-5 bg-[#5856D6]/[0.15] text-[#5856D6] rounded-full flex items-center justify-center text-[11px] font-bold mt-0.5">{i + 1}</span>
                    <span className="leading-[1.6]">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {currentTopic.keywords.map(kw => (
                <span key={kw} className="bg-[#F2F2F7] text-[#636366] text-[12px] px-2.5 py-1 rounded-lg font-medium">{kw}</span>
              ))}
            </div>

            <div className="flex gap-2.5">
              <div className="flex-1 bg-[#FF9500]/[0.06] rounded-xl p-3.5">
                <p className="text-[10px] font-bold text-[#FF9500] mb-1">ガブ</p>
                <p className="text-[12px] text-[#1C1C1E]/70 leading-relaxed">{currentTopic.gabuComment}</p>
              </div>
              <div className="flex-1 bg-black/[0.025] rounded-xl p-3.5">
                <p className="text-[10px] font-bold text-[#636366] mb-1">小山</p>
                <p className="text-[12px] text-[#1C1C1E]/70 leading-relaxed">{currentTopic.koyamaComment}</p>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-[13px] text-[#8E8E93] text-center mb-3 font-medium">想起できましたか？</p>
              <div className="grid grid-cols-2 gap-2.5">
                <RatingButton rating="perfect" label="完璧に言えた" color="#34C759" sub="+20 XP" onClick={handleRate} />
                <RatingButton rating="good" label="だいたい言えた" color="#007AFF" sub="+10 XP" onClick={handleRate} />
                <RatingButton rating="recognize" label="見ればわかる" color="#FF9500" sub="+5 XP" onClick={handleRate} />
                <RatingButton rating="forgot" label="全然出ない" color="#FF3B30" sub="+2 XP" onClick={handleRate} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RatingButton({ rating, label, color, sub, onClick }: { rating: SelfRating; label: string; color: string; sub: string; onClick: (r: SelfRating) => void }) {
  return (
    <button
      onClick={() => onClick(rating)}
      className="py-3.5 rounded-[12px] font-semibold text-[14px] text-white pressable"
      style={{ backgroundColor: color }}
    >
      <span className="block">{label}</span>
      <span className="block text-[10px] opacity-70 mt-0.5 font-medium">{sub}</span>
    </button>
  );
}

export default function RecallPage() {
  return (
    <Suspense fallback={<div className="pt-8"><div className="card h-48 animate-shimmer rounded-2xl" /></div>}>
      <RecallContent />
    </Suspense>
  );
}
