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

  if (!mounted) return (
    <div className="pt-[52px] space-y-5">
      <h1 className="text-[34px] font-bold text-[#1C1C1E] tracking-tight">分析</h1>
      <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="card h-32 animate-shimmer rounded-2xl" />)}</div>
    </div>
  );

  const stats = getUserStats();
  const logs = getReviewLogs();
  const subjectAnalytics = subjects.map(s => {
    const st = topics.filter(t => t.subjectId === s.id);
    const statuses = st.map(t => getTopicStatus(t.id));
    const sl = logs.filter(l => { const topic = topics.find(t => t.id === l.topicId); return topic?.subjectId === s.id; });
    const sr = sl.length > 0 ? Math.round(sl.filter(l => l.selfRating === 'perfect' || l.selfRating === 'good').length / sl.length * 100) : 0;
    return { ...s, total: st.length, new: statuses.filter(x => x === 'new').length, weak: statuses.filter(x => x === 'weak').length, mastered: statuses.filter(x => x === 'mastered').length, reviewCount: sl.length, successRate: sr };
  });

  const weakTopics = topics.map(t => {
    const tl = logs.filter(l => l.topicId === t.id);
    return { topic: t, forgotCount: tl.filter(l => l.selfRating === 'forgot').length };
  }).filter(x => x.forgotCount > 0).sort((a, b) => b.forgotCount - a.forgotCount).slice(0, 10);

  const rd = { perfect: logs.filter(l => l.selfRating === 'perfect').length, good: logs.filter(l => l.selfRating === 'good').length, recognize: logs.filter(l => l.selfRating === 'recognize').length, forgot: logs.filter(l => l.selfRating === 'forgot').length };
  const heatmapData = buildHeatmap(logs);

  return (
    <div className="pt-[52px] pb-6 space-y-5 animate-fade-in">
      <h1 className="text-[34px] font-bold text-[#1C1C1E] tracking-tight">分析</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: '総復習回数', value: logs.length.toString(), color: '#5856D6' },
          { label: '連続学習', value: `${stats.streakDays}日`, color: '#FF9500' },
          { label: '想起成功率', value: `${logs.length > 0 ? Math.round((rd.perfect + rd.good) / logs.length * 100) : 0}%`, color: '#34C759' },
          { label: 'レベル', value: `Lv.${stats.level}`, color: '#5856D6' },
        ].map(item => (
          <div key={item.label} className="card p-4 text-center">
            <p className="text-[24px] font-bold tracking-tight tabular-nums" style={{ color: item.color }}>{item.value}</p>
            <p className="text-[12px] text-[#8E8E93] mt-0.5 font-medium">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <div className="card px-5 py-5">
        <p className="section-header mb-4">学習ヒートマップ</p>
        <div className="flex gap-[3px] overflow-x-auto pb-2">
          {heatmapData.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day, di) => (
                <div
                  key={di}
                  className={`w-[13px] h-[13px] rounded-[3px] transition-colors ${getHeatColor(day.count)}`}
                  title={`${day.date}: ${day.count}回`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5 mt-3 text-[11px] text-[#AEAEB2]">
          <span>少</span>
          <div className="w-[10px] h-[10px] rounded-[2px] bg-[#E5E5EA]" />
          <div className="w-[10px] h-[10px] rounded-[2px] bg-[#34C759]/30" />
          <div className="w-[10px] h-[10px] rounded-[2px] bg-[#34C759]/60" />
          <div className="w-[10px] h-[10px] rounded-[2px] bg-[#34C759]" />
          <span>多</span>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="card px-5 py-5">
        <p className="section-header mb-4">評価分布</p>
        <div className="space-y-3.5">
          {[
            { label: '完璧に言えた', count: rd.perfect, color: 'bg-[#34C759]' },
            { label: 'だいたい言えた', count: rd.good, color: 'bg-[#007AFF]' },
            { label: '見ればわかる', count: rd.recognize, color: 'bg-[#FF9500]' },
            { label: '全然出ない', count: rd.forgot, color: 'bg-[#FF3B30]' },
          ].map(item => (
            <div key={item.label}>
              <div className="flex justify-between text-[13px] mb-2">
                <span className="text-[#1C1C1E] font-medium">{item.label}</span>
                <span className="text-[#8E8E93] font-semibold tabular-nums">{item.count}</span>
              </div>
              <ProgressBar value={item.count} max={Math.max(logs.length, 1)} color={item.color} />
            </div>
          ))}
        </div>
      </div>

      {/* Subject Analysis */}
      <div className="card px-5 py-5">
        <p className="section-header mb-5">科目別分析</p>
        <div className="space-y-5">
          {subjectAnalytics.map(s => (
            <div key={s.id}>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-[15px] font-medium text-[#1C1C1E]">{s.shortName}</span>
                <span className="text-[13px] text-[#8E8E93] ml-auto font-semibold tabular-nums">{s.successRate}%</span>
              </div>
              <ProgressBar value={s.total - s.new} max={s.total} />
              <div className="flex gap-4 text-[12px] mt-2">
                <span className="text-[#34C759] font-medium">習得 {s.mastered}</span>
                <span className="text-[#FF3B30] font-medium">苦手 {s.weak}</span>
                <span className="text-[#8E8E93]">未学習 {s.new}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weak Topics */}
      {weakTopics.length > 0 && (
        <div className="card px-5 py-5">
          <p className="section-header mb-4">苦手論点ランキング</p>
          <div className="space-y-3">
            {weakTopics.map((item, i) => {
              const subject = subjects.find(s => s.id === item.topic.subjectId);
              return (
                <div key={item.topic.id} className="flex items-center gap-3 text-[13px]">
                  <span className="w-5 h-5 bg-[#FF3B30]/[0.1] text-[#FF3B30] rounded-md flex items-center justify-center text-[11px] font-bold shrink-0">{i + 1}</span>
                  <span className="flex-1 text-[#1C1C1E] truncate font-medium">{item.topic.title}</span>
                  <span className="text-[11px] px-2 py-[2px] rounded-md text-white font-bold shrink-0" style={{ backgroundColor: subject?.color }}>{subject?.shortName}</span>
                  <span className="text-[13px] text-[#FF3B30] shrink-0 font-bold tabular-nums">{item.forgotCount}</span>
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

function buildHeatmap(logs: ReviewLog[]): { date: string; count: number }[][] {
  const weeks: { date: string; count: number }[][] = [];
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 83);
  const logsByDate: Record<string, number> = {};
  logs.forEach(l => { const date = l.reviewedAt.split('T')[0]; logsByDate[date] = (logsByDate[date] || 0) + 1; });
  let currentWeek: { date: string; count: number }[] = [];
  for (let i = 0; i < 84; i++) {
    const d = new Date(startDate); d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    currentWeek.push({ date: dateStr, count: logsByDate[dateStr] || 0 });
    if (currentWeek.length === 7) { weeks.push(currentWeek); currentWeek = []; }
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);
  return weeks;
}

function getHeatColor(count: number): string {
  if (count === 0) return 'bg-[#E5E5EA]';
  if (count <= 3) return 'bg-[#34C759]/30';
  if (count <= 8) return 'bg-[#34C759]/60';
  return 'bg-[#34C759]';
}
