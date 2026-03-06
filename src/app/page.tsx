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
    const reviewed = subjectTopics.filter(t => {
      const status = getTopicStatus(t.id);
      return status !== 'new';
    }).length;
    return { ...s, total: subjectTopics.length, reviewed };
  });

  return (
    <div className="pt-8 pb-4 space-y-6">
      <div className="text-center">
        <h1 className="text-[28px] font-bold text-[#1C1C1E] tracking-tight">SOUKI</h1>
        <p className="text-[13px] text-[#8E8E93] mt-0.5">想起で鍛える論文式対策</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="連続学習" value={`${stats.streakDays}日`} accent="#FF9500" />
        <StatCard label="レベル" value={`Lv.${stats.level}`} accent="#5856D6" />
        <StatCard label="復習待ち" value={`${dueItems.length}件`} accent="#FF3B30" />
      </div>

      <div className="card p-4">
        <div className="flex justify-between text-[12px] text-[#8E8E93] mb-2.5">
          <span>XP {stats.totalXp}</span>
          <span>次のレベルまで {nextLevelXp - stats.totalXp}</span>
        </div>
        <ProgressBar value={stats.totalXp - currentLevelXp} max={nextLevelXp - currentLevelXp} />
      </div>

      {(dueItems.length > 0 || todayStats.reviewedToday > 0 || todayStats.weakCount > 0) && (
        <div className="card p-5">
          <h2 className="text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wider mb-4">今日の修行</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-[#5856D6]/[0.06] rounded-xl py-3">
              <p className="text-[22px] font-bold text-[#5856D6] tracking-tight">{todayStats.reviewedToday}</p>
              <p className="text-[11px] text-[#8E8E93] mt-0.5">復習済み</p>
            </div>
            <div className="bg-[#007AFF]/[0.06] rounded-xl py-3">
              <p className="text-[22px] font-bold text-[#007AFF] tracking-tight">{dueItems.length}</p>
              <p className="text-[11px] text-[#8E8E93] mt-0.5">残り</p>
            </div>
            <div className="bg-[#FF3B30]/[0.06] rounded-xl py-3">
              <p className="text-[22px] font-bold text-[#FF3B30] tracking-tight">{todayStats.weakCount}</p>
              <p className="text-[11px] text-[#8E8E93] mt-0.5">苦手</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <CharacterBubble character="gabu" message={gabuMsg} />
        <CharacterBubble character="koyama" message={koyamaMsg} />
      </div>

      {dueItems.length > 0 ? (
        <Link href="/recall" className="block w-full bg-[#5856D6] text-white text-center py-[14px] rounded-[14px] font-semibold text-[16px] tracking-tight active:opacity-80 transition-opacity">
          復習を始める ({Math.min(dueItems.length, 10)}問)
        </Link>
      ) : stats.totalXp === 0 ? (
        <div className="card p-5 space-y-3">
          <h2 className="text-[15px] font-semibold text-[#1C1C1E]">はじめよう</h2>
          <p className="text-[13px] text-[#8E8E93] leading-relaxed">「思い出す」ことで記憶を定着させるアプリです。まずは3問から始めましょう。</p>
          <Link href="/recall" className="block w-full bg-[#5856D6] text-white text-center py-[14px] rounded-[14px] font-semibold text-[15px] active:opacity-80 transition-opacity">
            最初の3問をやってみる
          </Link>
          <Link href="/subjects" className="block w-full text-[#5856D6] text-center py-[12px] rounded-[14px] font-medium text-[15px] bg-[#5856D6]/[0.06] active:opacity-80 transition-opacity">
            科目一覧から選ぶ
          </Link>
        </div>
      ) : (
        <div className="card p-5 space-y-3">
          <p className="text-[13px] text-[#8E8E93] text-center">復習待ちの論点はありません</p>
          <Link href="/recall" className="block w-full bg-[#5856D6] text-white text-center py-[14px] rounded-[14px] font-semibold text-[15px] active:opacity-80 transition-opacity">
            新しい論点に挑戦する
          </Link>
        </div>
      )}

      <div className="card p-5">
        <h2 className="text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wider mb-4">科目別進捗</h2>
        <div className="space-y-4">
          {subjectProgress.map(s => (
            <Link key={s.id} href={`/subjects/${s.id}`} className="block">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-[14px] font-medium text-[#1C1C1E]">{s.shortName}</span>
                </div>
                <span className="text-[12px] text-[#8E8E93]">{s.reviewed}/{s.total}</span>
              </div>
              <ProgressBar value={s.reviewed} max={s.total} />
            </Link>
          ))}
        </div>
      </div>

      {stats.titles.length > 0 && (
        <div className="card p-5">
          <h2 className="text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wider mb-3">獲得称号</h2>
          <div className="flex flex-wrap gap-2">
            {stats.titles.map(t => (
              <span key={t} className="bg-[#FF9500]/[0.1] text-[#FF9500] text-[12px] font-medium px-3 py-1 rounded-full">{t}</span>
            ))}
          </div>
        </div>
      )}

      <div className="card p-5">
        <h2 className="text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wider mb-4">累計データ</h2>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-[#F2F2F7] rounded-xl py-3.5">
            <p className="text-[22px] font-bold text-[#1C1C1E] tracking-tight">{logs.length}</p>
            <p className="text-[11px] text-[#8E8E93] mt-0.5">総復習回数</p>
          </div>
          <div className="bg-[#F2F2F7] rounded-xl py-3.5">
            <p className="text-[22px] font-bold text-[#34C759] tracking-tight">
              {logs.length > 0 ? Math.round(logs.filter(l => l.selfRating === 'perfect' || l.selfRating === 'good').length / logs.length * 100) : 0}%
            </p>
            <p className="text-[11px] text-[#8E8E93] mt-0.5">想起成功率</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="card p-3.5 text-center">
      <p className="text-[18px] font-bold tracking-tight" style={{ color: accent }}>{value}</p>
      <p className="text-[11px] text-[#8E8E93] mt-0.5">{label}</p>
    </div>
  );
}

function HomeLoading() {
  return (
    <div className="pt-8 pb-4 space-y-6">
      <div className="text-center">
        <h1 className="text-[28px] font-bold text-[#1C1C1E] tracking-tight">SOUKI</h1>
        <p className="text-[13px] text-[#8E8E93] mt-0.5">想起で鍛える論文式対策</p>
      </div>
      <div className="animate-pulse space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[1,2,3].map(i => <div key={i} className="card h-[72px]" />)}
        </div>
        <div className="card h-16" />
        <div className="card h-24" />
      </div>
    </div>
  );
}
