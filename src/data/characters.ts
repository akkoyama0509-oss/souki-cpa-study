import { UserStats, CharacterComment } from '@/types';

export const gabuComments: CharacterComment[] = [
  { condition: (s, d) => d === 0 && s.streakDays > 0, message: '今日の復習は全部終わったワン！すごいワン！' },
  { condition: (s, d) => d > 0 && d <= 5, message: 'あと少しだワン！頑張れワン！' },
  { condition: (s, d) => d > 5 && d <= 15, message: '今日やるべき論点がたくさんあるワン！コツコツいこうワン！' },
  { condition: (s, d) => d > 15, message: 'たくさん溜まってるワン...でも少しずつやれば大丈夫ワン！' },
  { condition: (s) => s.streakDays >= 30, message: '30日連続！もう立派な習慣だワン！' },
  { condition: (s) => s.streakDays >= 7, message: '1週間連続！その調子ワン！' },
  { condition: (s) => s.streakDays === 0, message: '今日から始めようワン！1日1論点でもOKだワン！' },
  { condition: (s) => s.level >= 10, message: 'レベル' + '10超え！実力がついてきたワン！' },
  { condition: () => true, message: 'この論点、そろそろ復習だワン！' },
];

export const koyamaComments: CharacterComment[] = [
  { condition: (s, d) => d > 10, message: '溜め込むと本番で出てこない。毎日の積み重ねが答案力になる。' },
  { condition: (s) => s.streakDays >= 14, message: '継続は力だ。ただし、惰性の復習にならないよう、毎回本気で想起しなさい。' },
  { condition: (s) => s.streakDays === 0, message: '知っているだけでは足りない。答案骨格で出せるようにすること。' },
  { condition: (s) => s.level >= 5, message: '基礎が固まってきた。次は論点間の繋がりを意識して想起しなさい。' },
  { condition: (s) => s.totalXp > 500, message: '想起の質を上げろ。キーワードだけでなく、論理の流れを再現できるように。' },
  { condition: () => true, message: '論点の本質を掴め。表面的な暗記では論文は書けない。' },
];

export function getGabuComment(stats: UserStats, dueCount: number): string {
  const comment = gabuComments.find(c => c.condition(stats, dueCount));
  return comment?.message ?? 'がんばるワン！';
}

export function getKoyamaComment(stats: UserStats, dueCount: number): string {
  const comment = koyamaComments.find(c => c.condition(stats, dueCount));
  return comment?.message ?? '論点を正確に理解せよ。';
}
