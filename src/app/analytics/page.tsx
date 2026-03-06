'use client';

import { useEffect, useState } from 'react';
import { subjects } from '@/data/subjects';
import { topics } from '@/data/topics';
import { getUserStats, getReviewLogs, getTopicStatus } from '@/lib/review-logic';
import { ReviewLog } from '@/types';
import ProgressBar from '@/components/ProgressBar';
import CharacterBubble from '@/components/CharacterBubble';
import { getKoyamaComment } from '@/data/characters';

export default function AnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="py-6 space-y-4">
        <h1 className="text-xl font-bold text-slate-800">学習分析</h1>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="bg-slate-200 rounded-2xl h-32" />)}
        </div>
      </div>
    );
  }

  const stats = getUserStats();
  const logs = getReviewLogs();

  // Subject progress
  const subjectAnalytics = subjects.map(s => {
    const subjectTopics = topics.filter(t => t.subjectId === s.id);
    const statuses = subjectTopics.map(t => getTopicStatus(t.id));
    const subjectLogs = logs.filter(l => {
      const topic = topics.find(t => t.id === l.topicId);
      return topic?.subjectId === s.id;
    });
    const successLogs = subjectLogs.filter(l => l.selfRating === 'perfect' || l.selfRating === 'good');
    const successRate = subjectLogs.length > 0 ? Math.round(successLogs.length / subjectLogs.length * 100) : 0;

    return {
      ...s,
      total: subjectTopics.length,
      new: statuses.filter(st => st === 'new').length,
      due: statuses.filter(st => st === 'due').length,
      weak: statuses.filter(st => st === 'weak').length,
      mastered: statuses.filter(st => st === 'mastered').length,
      reviewCount: subjectLogs.length,
      successRate,
    };
  });

  // Weak topics ranking
  const weakTopics = topics
    .map(t => {
      const topicLogs = logs.filter(l => l.topicId === t.id);
      const forgotCount = topicLogs.filter(l => l.selfRating === 'forgot').length;
      return { topic: t, forgotCount, totalReviews: topicLogs.length };
    })
    .filter(x => x.forgotCount > 0)
    .sort((a, b) => b.forgotCount - a.forgotCount)
    .slice(0, 10);

  // Rating distribution
  const ratingDist = {
    perfect: logs.filter(l => l.selfRating === 'perfect').length,
    good: logs.filter(l => l.selfRating === 'good').length,
    recognize: logs.filter(l => l.selfRating === 'recognize').length,
    forgot: logs.filter(l => l.selfRating === 'forgot').length,
  };

  // Heatmap - last 12 weeks
  const heatmapData = buildHeatmap(logs);

  return (
    <div className="py-6 space-y-4">
      <h1 className="text-xl font-bold text-slate-800">学習分析</h1>

      {/* Overview */}
      <div className="grid grid-cols-2 gap-3">
        <AnalyticsCard label="総復習回数" value={logs.length.toString()} />
        <AnalyticsCard label="連続学習" value={`${stats.streakDays}日`} />
        <AnalyticsCard
          label="想起成功率"
          value={`${logs.length > 0 ? Math.round((ratingDist.perfect + ratingDist.good) / logs.length * 100) : 0}%`}
        />
        <AnalyticsCard label="レベル" value={`Lv.${stats.level}`} />
      </div>

      {/* Heatmap */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <h2 className="font-bold text-sm text-slate-700 mb-3">学習ヒートマップ（12週間）</h2>
        <div className="flex gap-0.5 overflow-x-auto pb-1">
          {heatmapData.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {week.map((day, di) => (
                <div
                  key={di}
                  className={`w-3.5 h-3.5 rounded-sm ${getHeatColor(day.count)}`}
                  title={`${day.date}: ${day.count}回`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
          <span>少ない</span>
          <div className="w-3 h-3 rounded-sm bg-slate-100" />
          <div className="w-3 h-3 rounded-sm bg-emerald-200" />
          <div className="w-3 h-3 rounded-sm bg-emerald-400" />
          <div className="w-3 h-3 rounded-sm bg-emerald-600" />
          <span>多い</span>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <h2 className="font-bold text-sm text-slate-700 mb-3">評価分布</h2>
        <div className="space-y-2">
          {[
            { label: '完璧に言えた', count: ratingDist.perfect, color: 'bg-emerald-500' },
            { label: 'だいたい言えた', count: ratingDist.good, color: 'bg-blue-500' },
            { label: '見ればわかる', count: ratingDist.recognize, color: 'bg-amber-500' },
            { label: '全然出ない', count: ratingDist.forgot, color: 'bg-red-500' },
          ].map(item => (
            <div key={item.label}>
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>{item.label}</span>
                <span>{item.count}回</span>
              </div>
              <ProgressBar value={item.count} max={Math.max(logs.length, 1)} color={item.color} />
            </div>
          ))}
        </div>
      </div>

      {/* Subject Progress */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <h2 className="font-bold text-sm text-slate-700 mb-3">科目別分析</h2>
        <div className="space-y-4">
          {subjectAnalytics.map(s => (
            <div key={s.id}>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-sm font-medium text-slate-800">{s.shortName}</span>
                <span className="text-xs text-slate-400 ml-auto">成功率 {s.successRate}%</span>
              </div>
              <ProgressBar value={s.total - s.new} max={s.total} color="bg-indigo-400" />
              <div className="flex gap-3 text-xs text-slate-500 mt-1">
                <span>習得 {s.mastered}</span>
                <span className="text-red-500">苦手 {s.weak}</span>
                <span>未学習 {s.new}</span>
                <span>復習 {s.reviewCount}回</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weak Topics */}
      {weakTopics.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <h2 className="font-bold text-sm text-slate-700 mb-3">苦手論点ランキング</h2>
          <div className="space-y-2">
            {weakTopics.map((item, i) => {
              const subject = subjects.find(s => s.id === item.topic.subjectId);
              return (
                <div key={item.topic.id} className="flex items-center gap-3 text-sm">
                  <span className="w-5 h-5 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-slate-700 truncate">{item.topic.title}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full text-white shrink-0" style={{ backgroundColor: subject?.color }}>
                    {subject?.shortName}
                  </span>
                  <span className="text-xs text-red-600 shrink-0">{item.forgotCount}回</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <CharacterBubble character="koyama" message={getKoyamaComment(stats, 0)} />
    </div>
  );
}

function AnalyticsCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
      <p className="text-xl font-bold text-indigo-600">{value}</p>
      <p className="text-[11px] text-slate-500 mt-1">{label}</p>
    </div>
  );
}

function buildHeatmap(logs: ReviewLog[]): { date: string; count: number }[][] {
  const weeks: { date: string; count: number }[][] = [];
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 83); // 12 weeks

  const logsByDate: Record<string, number> = {};
  logs.forEach(l => {
    const date = l.reviewedAt.split('T')[0];
    logsByDate[date] = (logsByDate[date] || 0) + 1;
  });

  let currentWeek: { date: string; count: number }[] = [];
  for (let i = 0; i < 84; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    currentWeek.push({ date: dateStr, count: logsByDate[dateStr] || 0 });
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);

  return weeks;
}

function getHeatColor(count: number): string {
  if (count === 0) return 'bg-slate-100';
  if (count <= 3) return 'bg-emerald-200';
  if (count <= 8) return 'bg-emerald-400';
  return 'bg-emerald-600';
}
