export interface Subject {
  id: string;
  name: string;
  shortName: string;
  color: string;
  displayOrder: number;
}

export interface Chapter {
  id: string;
  subjectId: string;
  title: string;
  parentId: string | null;
  depth: number;
  displayOrder: number;
}

export interface Topic {
  id: string;
  subjectId: string;
  chapterId: string;
  title: string;
  slug: string;
  summary: string;
  answerFramework: string[];
  keywords: string[];
  importance: 1 | 2 | 3;
  frequency: 1 | 2 | 3;
  difficulty: 1 | 2 | 3;
  relatedTopics: string[];
  compareTopics: string[];
  prompt: string;
  gabuComment: string;
  koyamaComment: string;
}

export type SelfRating = 'perfect' | 'good' | 'recognize' | 'forgot';

export interface ReviewLog {
  id: string;
  topicId: string;
  reviewedAt: string;
  selfRating: SelfRating;
  responseTimeSec: number;
  mode: 'recall' | 'browse';
}

export type QueueStatus = 'active' | 'suspended';

export interface StudyQueue {
  id: string;
  topicId: string;
  dueAt: string;
  intervalDays: number;
  easeFactor: number;
  status: QueueStatus;
}

export interface Favorite {
  id: string;
  topicId: string;
}

export interface UserStats {
  totalXp: number;
  level: number;
  streakDays: number;
  lastStudyDate: string | null;
  titles: string[];
}

export type TopicStatus = 'new' | 'due' | 'weak' | 'mastered';

export interface CharacterComment {
  condition: (stats: UserStats, dueCount: number) => boolean;
  message: string;
}
