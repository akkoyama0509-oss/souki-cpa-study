'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { subjects } from '@/data/subjects';
import { topics } from '@/data/topics';
import { getUserStats, getDueTopics, getReviewLogs, getLevelFromXp, getXpForNextLevel, getXpForCurrentLevel, getTopicStatus, getTodayStudyStats } from '@/lib/review-logic';
import { getGabuComment, getKoyamaComment } from '@/data/characters';
import CharacterBubble from '@/components/CharacterBubble';
import ProgressBar from '@/components/ProgressBar';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <HomeLoading />;

  const stats = getUserStats();
  const dueItems = getDueTopics();
  const logs = getReviewLogs();
  const todayStats = getTodayStudyStats();
  const gabuMsg = getGabuComment(stats, dueItems.length);
  const koyamaMsg = getKoyamaComment(stats, dueItems.length);

  const currentLevelXp = getXpForCurrentLevel(stats.level);
  const nextLevelXp = getXpForNextLevel(stats.level);

  const subjectProgress = subjects.map(s => {
    const subjectTopics = topics.filter(t => t.subjectId === s.id);
    const reviewed = subjectTopics.filter(t => getTopicStatus(t.id) !== 'new').length;
    return { ...s, total: subjectTopics.length, reviewed };
  });

  return (
    <div className="pt-[52px] pb-6 space-y-7 animate-fade-in">
      {/* Hero */}
      <div className="text-center space-y-1">
        <h1 className="text-[34px] font-bold text-[#1C1C1E] tracking-tight leading-tight">SOUKI</h1>
        <p className="text-[15px] text-[#8E8E93] font-medium">想起で鍛える論文式対策</p>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="連続学習" value={`${stats.streakDays}日`} accent="#FF9500" icon="flame" />
        <StatCard label="レベル" value={`Lv.${stats.level}`} accent="#5856D6" icon="level" />
        <StatCard label="復習待ち" value={`${dueItems.length}`} accent={dueItems.length > 0 ? '#FF3B30' : '#34C759'} icon="bell" />
      </div>

      {/* XP Progress */}
      <div className="card px-5 py-4">
        <div className="flex justify-between text-[12px] text-[#8E8E93] mb-3">
          <span className="font-medium">XP {stats.totalXp.toLocaleString()}</span>
          <span>あと {(nextLevelXp - stats.totalXp).toLocaleString()}</span>
        </div>
        <ProgressBar value={stats.totalXp - currentLevelXp} max={nextLevelXp - currentLevelXp} />
      </div>

      {/* Today's Training */}
      {(dueItems.length > 0 || todayStats.reviewedToday > 0 || todayStats.weakCount > 0) && (
        <div className="card px-5 py-5">
          <p className="section-header mb-4">今日の修行</p>
          <div className="grid grid-cols-3 gap-3">
            <MiniStat value={todayStats.reviewedToday} label="復習済み" color="#5856D6" />
            <MiniStat value={dueItems.length} label="残り" color="#007AFF" />
            <MiniStat value={todayStats.weakCount} label="苦手" color="#FF3B30" />
          </div>
        </div>
      )}

      {/* Characters */}
      <div className="space-y-3">
        <CharacterBubble character="gabu" message={gabuMsg} />
        <CharacterBubble character="koyama" message={koyamaMsg} />
      </div>

      {/* CTA */}
      {dueItems.length > 0 ? (
        <Link href="/recall" className="btn-primary">
          復習を始める ({Math.min(dueItems.length, 10)}問)
        </Link>
      ) : stats.totalXp === 0 ? (
        <div className="card px-5 py-6 space-y-4">
          <div className="text-center">
            <h2 className="text-[17px] font-bold text-[#1C1C1E]">はじめよう</h2>
            <p className="text-[14px] text-[#8E8E93] mt-1 leading-relaxed">
              「思い出す」ことで記憶を定着させるアプリです。<br />まずは3問から始めましょう。
            </p>
          </div>
          <Link href="/recall" className="btn-primary">最初の3問をやってみる</Link>
          <Link href="/subjects" className="btn-secondary">科目一覧から選ぶ</Link>
        </div>
      ) : (
        <div className="card px-5 py-6 space-y-4 text-center">
          <p className="text-[14px] text-[#8E8E93]">復習待ちの論点はありません</p>
          <Link href="/recall" className="btn-primary">新しい論点に挑戦する</Link>
        </div>
      )}

      {/* Subject Progress */}
      <div className="card px-5 py-5">
        <p className="section-header mb-5">科目別進捗</p>
        <div className="space-y-5">
          {subjectProgress.map(s => (
            <Link key={s.id} href={`/subjects/${s.id}`} className="block pressable">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-[15px] font-medium text-[#1C1C1E]">{s.shortName}</span>
                </div>
                <span className="text-[13px] text-[#8E8E93] tabular-nums">{s.reviewed}/{s.total}</span>
              </div>
              <ProgressBar value={s.reviewed} max={s.total} />
            </Link>
          ))}
        </div>
      </div>

      {/* Titles */}
      {stats.titles.length > 0 && (
        <div className="card px-5 py-5">
          <p className="section-header mb-3">獲得称号</p>
          <div className="flex flex-wrap gap-2">
            {stats.titles.map(t => (
              <span key={t} className="bg-gradient-to-r from-[#FF9500]/[0.12] to-[#FF6B00]/[0.12] text-[#FF9500] text-[12px] font-semibold px-3 py-1.5 rounded-lg">{t}</span>
            ))}
          </div>
        </div>
      )}

      {/* Cumulative Data */}
      <div className="card px-5 py-5">
        <p className="section-header mb-4">累計データ</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="card-inset p-4 text-center">
            <p className="text-[24px] font-bold text-[#1C1C1E] tracking-tight tabular-nums">{logs.length}</p>
            <p className="text-[12px] text-[#8E8E93] mt-0.5">総復習回数</p>
          </div>
          <div className="card-inset p-4 text-center">
            <p className="text-[24px] font-bold text-[#34C759] tracking-tight tabular-nums">
              {logs.length > 0 ? Math.round(logs.filter(l => l.selfRating === 'perfect' || l.selfRating === 'good').length / logs.length * 100) : 0}%
            </p>
            <p className="text-[12px] text-[#8E8E93] mt-0.5">想起成功率</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent, icon }: { label: string; value: string; accent: string; icon: string }) {
  return (
    <div className="card px-3 py-4 text-center">
      <div className="w-8 h-8 mx-auto mb-2 rounded-[10px] flex items-center justify-center" style={{ backgroundColor: `${accent}14` }}>
        {icon === 'flame' && <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill={accent}><path d="M12 23c-4.97 0-9-3.582-9-8 0-3.652 2.35-6.358 4.546-8.838a.5.5 0 01.795.092c.678 1.209 1.907 2.293 2.659 1.746.916-.667 1.143-3.79 1.3-5.691A.5.5 0 0113.107 2c2.258 1.564 5.893 5.257 5.893 9.5 0 .233-.009.464-.027.693C20.255 14.088 21 15.94 21 18c0 2.761-4.03 5-9 5z"/></svg>}
        {icon === 'level' && <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill={accent}><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>}
        {icon === 'bell' && <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill={accent}><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>}
      </div>
      <p className="text-[20px] font-bold tracking-tight tabular-nums" style={{ color: accent }}>{value}</p>
      <p className="text-[11px] text-[#8E8E93] mt-0.5 font-medium">{label}</p>
    </div>
  );
}

function MiniStat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="rounded-xl py-3 text-center" style={{ backgroundColor: `${color}0A` }}>
      <p className="text-[22px] font-bold tracking-tight tabular-nums" style={{ color }}>{value}</p>
      <p className="text-[11px] text-[#8E8E93] mt-0.5">{label}</p>
    </div>
  );
}

function HomeLoading() {
  return (
    <div className="pt-[52px] pb-6 space-y-7">
      <div className="text-center space-y-1">
        <h1 className="text-[34px] font-bold text-[#1C1C1E] tracking-tight">SOUKI</h1>
        <p className="text-[15px] text-[#8E8E93] font-medium">想起で鍛える論文式対策</p>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[1,2,3].map(i => <div key={i} className="card h-[100px] animate-shimmer" />)}
        </div>
        <div className="card h-16 animate-shimmer" />
        <div className="card h-28 animate-shimmer" />
      </div>
    </div>
  );
}
