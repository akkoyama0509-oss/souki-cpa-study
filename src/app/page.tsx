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
    <div className="py-6 space-y-5">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-indigo-600 tracking-wider">SOUKI</h1>
        <p className="text-xs text-slate-500 mt-1">想起で鍛える論文式対策</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="連続学習" value={`${stats.streakDays}日`} icon="flame" />
        <StatCard label="レベル" value={`Lv.${stats.level}`} icon="star" />
        <StatCard label="復習待ち" value={`${dueItems.length}件`} icon="bell" />
      </div>

      {/* XP Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex justify-between text-xs text-slate-500 mb-2">
          <span>XP: {stats.totalXp}</span>
          <span>次のレベルまで {nextLevelXp - stats.totalXp} XP</span>
        </div>
        <ProgressBar value={stats.totalXp - currentLevelXp} max={nextLevelXp - currentLevelXp} color="bg-indigo-500" />
      </div>

      {/* Today's Goal */}
      {(dueItems.length > 0 || todayStats.reviewedToday > 0 || todayStats.weakCount > 0) && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <h2 className="font-bold text-sm text-slate-700 mb-3">今日の修行</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-indigo-50 rounded-xl p-3">
              <p className="text-xl font-bold text-indigo-600">{todayStats.reviewedToday}</p>
              <p className="text-[11px] text-slate-500">今日の復習</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3">
              <p className="text-xl font-bold text-blue-600">{dueItems.length}</p>
              <p className="text-[11px] text-slate-500">あと残り</p>
            </div>
            <div className="bg-red-50 rounded-xl p-3">
              <p className="text-xl font-bold text-red-500">{todayStats.weakCount}</p>
              <p className="text-[11px] text-slate-500">苦手論点</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 text-center mt-2">
            1セッション10問・約10分で一区切り
          </p>
        </div>
      )}

      {/* Characters */}
      <CharacterBubble character="gabu" message={gabuMsg} />
      <CharacterBubble character="koyama" message={koyamaMsg} />

      {/* Quick Actions */}
      {dueItems.length > 0 ? (
        <Link
          href="/recall"
          className="block w-full bg-indigo-600 text-white text-center py-4 rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors active:scale-[0.98]"
        >
          今日の復習を始める ({Math.min(dueItems.length, 10)}問)
        </Link>
      ) : stats.totalXp === 0 ? (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-3">
          <h2 className="font-bold text-sm text-slate-700">はじめよう！</h2>
          <p className="text-sm text-slate-500">ソウキは「思い出す」ことで記憶を定着させるアプリです。まずはおすすめの3問から始めましょう。</p>
          <Link
            href="/recall"
            className="block w-full bg-indigo-600 text-white text-center py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors active:scale-[0.98]"
          >
            最初の3問をやってみる
          </Link>
          <Link
            href="/subjects"
            className="block w-full bg-white text-slate-600 text-center py-3 rounded-xl font-medium border border-slate-200 hover:bg-slate-50"
          >
            科目一覧から選ぶ
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-3">
          <p className="text-sm text-slate-500 text-center">復習待ちの論点はありません</p>
          <Link
            href="/recall"
            className="block w-full bg-indigo-500 text-white text-center py-3.5 rounded-xl font-bold hover:bg-indigo-600 transition-colors active:scale-[0.98]"
          >
            新しい論点に挑戦する
          </Link>
        </div>
      )}

      {/* Subject Progress */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <h2 className="font-bold text-sm text-slate-700 mb-3">科目別進捗</h2>
        <div className="space-y-3">
          {subjectProgress.map(s => (
            <Link key={s.id} href={`/subjects/${s.id}`} className="block">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-sm font-medium">{s.shortName}</span>
                </div>
                <span className="text-xs text-slate-500">{s.reviewed}/{s.total}</span>
              </div>
              <ProgressBar value={s.reviewed} max={s.total} color="bg-indigo-400" />
            </Link>
          ))}
        </div>
      </div>

      {/* Titles */}
      {stats.titles.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <h2 className="font-bold text-sm text-slate-700 mb-2">獲得称号</h2>
          <div className="flex flex-wrap gap-2">
            {stats.titles.map(t => (
              <span key={t} className="bg-amber-100 text-amber-800 text-xs font-medium px-3 py-1 rounded-full">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Today Stats */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <h2 className="font-bold text-sm text-slate-700 mb-2">累計学習データ</h2>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xl font-bold text-indigo-600">{logs.length}</p>
            <p className="text-[11px] text-slate-500">総復習回数</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xl font-bold text-emerald-600">
              {logs.length > 0
                ? Math.round(logs.filter(l => l.selfRating === 'perfect' || l.selfRating === 'good').length / logs.length * 100)
                : 0}%
            </p>
            <p className="text-[11px] text-slate-500">想起成功率</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  const icons: Record<string, string> = { flame: '🔥', star: '⭐', bell: '🔔' };
  return (
    <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-slate-100">
      <p className="text-sm mb-0.5">{icons[icon]}</p>
      <p className="text-base font-bold text-slate-800">{value}</p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  );
}

function HomeLoading() {
  return (
    <div className="py-6 space-y-5">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-indigo-600 tracking-wider">SOUKI</h1>
        <p className="text-xs text-slate-500 mt-1">想起で鍛える論文式対策</p>
      </div>
      <div className="animate-pulse space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[1,2,3].map(i => <div key={i} className="bg-slate-200 rounded-2xl h-24" />)}
        </div>
        <div className="bg-slate-200 rounded-2xl h-16" />
        <div className="bg-slate-200 rounded-2xl h-20" />
      </div>
    </div>
  );
}
