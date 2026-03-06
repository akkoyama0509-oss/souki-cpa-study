import { SelfRating, StudyQueue, ReviewLog, UserStats, Topic } from '@/types';
import { getItem, setItem } from './storage';

const INTERVAL_MAP: Record<SelfRating, number> = {
  perfect: 7,
  good: 3,
  recognize: 1,
  forgot: 0.25, // 6 hours
};

const XP_MAP: Record<SelfRating, number> = {
  perfect: 20,
  good: 10,
  recognize: 5,
  forgot: 2,
};

export function calculateNextReview(
  current: StudyQueue | null,
  rating: SelfRating
): { intervalDays: number; easeFactor: number; dueAt: string } {
  const baseInterval = INTERVAL_MAP[rating];
  const prevEase = current?.easeFactor ?? 2.5;

  let newEase = prevEase;
  if (rating === 'perfect') newEase = Math.min(prevEase + 0.15, 3.0);
  else if (rating === 'good') newEase = prevEase;
  else if (rating === 'recognize') newEase = Math.max(prevEase - 0.15, 1.3);
  else newEase = Math.max(prevEase - 0.3, 1.3);

  const prevInterval = current?.intervalDays ?? 0;
  let intervalDays: number;

  if (rating === 'forgot') {
    intervalDays = 0.25;
  } else if (prevInterval === 0) {
    intervalDays = baseInterval;
  } else {
    intervalDays = Math.round(prevInterval * newEase * (baseInterval / 7));
    intervalDays = Math.max(intervalDays, baseInterval);
  }

  const dueAt = new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000).toISOString();
  return { intervalDays, easeFactor: newEase, dueAt };
}

export function recordReview(
  topicId: string,
  rating: SelfRating,
  responseTimeSec: number
): void {
  const logs = getItem<ReviewLog[]>('reviewLogs', []);
  const newLog: ReviewLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    topicId,
    reviewedAt: new Date().toISOString(),
    selfRating: rating,
    responseTimeSec,
    mode: 'recall',
  };
  logs.push(newLog);
  setItem('reviewLogs', logs);

  const queue = getItem<StudyQueue[]>('studyQueue', []);
  const existing = queue.find(q => q.topicId === topicId);
  const next = calculateNextReview(existing ?? null, rating);

  if (existing) {
    existing.intervalDays = next.intervalDays;
    existing.easeFactor = next.easeFactor;
    existing.dueAt = next.dueAt;
  } else {
    queue.push({
      id: `sq-${Date.now()}`,
      topicId,
      dueAt: next.dueAt,
      intervalDays: next.intervalDays,
      easeFactor: next.easeFactor,
      status: 'active',
    });
  }
  setItem('studyQueue', queue);

  addXp(XP_MAP[rating], rating);
}

export function getDueTopics(): StudyQueue[] {
  const queue = getItem<StudyQueue[]>('studyQueue', []);
  const now = new Date().toISOString();
  return queue.filter(q => q.status === 'active' && q.dueAt <= now);
}

export function getQueueForTopic(topicId: string): StudyQueue | undefined {
  const queue = getItem<StudyQueue[]>('studyQueue', []);
  return queue.find(q => q.topicId === topicId);
}

export function getReviewLogs(): ReviewLog[] {
  return getItem<ReviewLog[]>('reviewLogs', []);
}

export function getReviewLogsForTopic(topicId: string): ReviewLog[] {
  return getReviewLogs().filter(l => l.topicId === topicId);
}

// XP & Level
const LEVEL_THRESHOLDS = [
  0, 50, 120, 210, 320, 450, 600, 780, 1000, 1260,
  1560, 1900, 2300, 2760, 3300, 3920, 4640, 5480, 6460, 7600,
];

export function getLevelFromXp(xp: number): number {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  return level;
}

export function getXpForNextLevel(level: number): number {
  if (level >= LEVEL_THRESHOLDS.length) return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 1000;
  return LEVEL_THRESHOLDS[level];
}

export function getXpForCurrentLevel(level: number): number {
  if (level <= 1) return 0;
  return LEVEL_THRESHOLDS[level - 1];
}

function addXp(amount: number, rating: SelfRating): void {
  const stats = getUserStats();
  const today = new Date().toISOString().split('T')[0];
  const lastDate = stats.lastStudyDate;

  let streakBonus = 0;
  if (lastDate) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (lastDate === yesterday || lastDate === today) {
      if (lastDate === yesterday) {
        stats.streakDays += 1;
      }
      streakBonus = Math.min(stats.streakDays, 10);
    } else if (lastDate !== today) {
      stats.streakDays = 1;
    }
  } else {
    stats.streakDays = 1;
  }

  stats.totalXp += amount + streakBonus;
  stats.level = getLevelFromXp(stats.totalXp);
  stats.lastStudyDate = today;

  // Titles
  if (stats.streakDays >= 7 && !stats.titles.includes('一週間の継続者')) {
    stats.titles.push('一週間の継続者');
  }
  if (stats.streakDays >= 30 && !stats.titles.includes('一ヶ月の修行者')) {
    stats.titles.push('一ヶ月の修行者');
  }
  if (stats.level >= 5 && !stats.titles.includes('論点探求者')) {
    stats.titles.push('論点探求者');
  }
  if (stats.level >= 10 && !stats.titles.includes('理論の達人')) {
    stats.titles.push('理論の達人');
  }

  // Weak topic overcome bonus
  if (rating === 'perfect') {
    const logs = getReviewLogsForTopic('');
    const topicLogs = getItem<ReviewLog[]>('reviewLogs', []);
    const recentForTopic = topicLogs.filter(l => l.selfRating === 'forgot').length;
    if (recentForTopic > 3 && !stats.titles.includes('苦手克服者')) {
      stats.titles.push('苦手克服者');
      stats.totalXp += 50;
    }
  }

  setItem('userStats', stats);
}

export function getUserStats(): UserStats {
  return getItem<UserStats>('userStats', {
    totalXp: 0,
    level: 1,
    streakDays: 0,
    lastStudyDate: null,
    titles: [],
  });
}

export function getTopicStatus(topicId: string): 'new' | 'due' | 'weak' | 'mastered' {
  const queue = getQueueForTopic(topicId);
  if (!queue) return 'new';

  const logs = getReviewLogsForTopic(topicId);
  const recentLogs = logs.slice(-3);
  const forgotCount = recentLogs.filter(l => l.selfRating === 'forgot').length;

  if (forgotCount >= 2) return 'weak';

  const now = new Date().toISOString();
  if (queue.dueAt <= now) return 'due';

  if (queue.intervalDays >= 14 && recentLogs.every(l => l.selfRating === 'perfect' || l.selfRating === 'good')) {
    return 'mastered';
  }

  return 'due';
}

export function getSmartQueue(allTopics: Topic[], subjectId?: string): Topic[] {
  const pool = subjectId
    ? allTopics.filter(t => t.subjectId === subjectId)
    : [...allTopics];

  const weak: Topic[] = [];
  const newTopics: Topic[] = [];
  const rest: Topic[] = [];

  for (const t of pool) {
    const status = getTopicStatus(t.id);
    if (status === 'weak') weak.push(t);
    else if (status === 'new') newTopics.push(t);
    else rest.push(t);
  }

  const shuffle = <T,>(arr: T[]): T[] => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  return [...shuffle(weak), ...shuffle(newTopics), ...shuffle(rest)].slice(0, 10);
}

export function getTodayStudyStats(): {
  reviewedToday: number;
  dueCount: number;
  weakCount: number;
} {
  const logs = getReviewLogs();
  const today = new Date().toISOString().split('T')[0];
  const reviewedToday = logs.filter(l => l.reviewedAt.startsWith(today)).length;
  const dueCount = getDueTopics().length;
  const queue = getItem<StudyQueue[]>('studyQueue', []);
  const weakCount = queue.filter(q => {
    const topicLogs = logs.filter(l => l.topicId === q.topicId).slice(-3);
    return topicLogs.filter(l => l.selfRating === 'forgot').length >= 2;
  }).length;
  return { reviewedToday, dueCount, weakCount };
}

export function getNextDueTime(): string | null {
  const queue = getItem<StudyQueue[]>('studyQueue', []);
  const active = queue.filter(q => q.status === 'active');
  if (active.length === 0) return null;
  active.sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  return active[0].dueAt;
}

export function getFavorites(): string[] {
  return getItem<string[]>('favorites', []);
}

export function toggleFavorite(topicId: string): void {
  const favs = getFavorites();
  const idx = favs.indexOf(topicId);
  if (idx >= 0) {
    favs.splice(idx, 1);
  } else {
    favs.push(topicId);
  }
  setItem('favorites', favs);
}
