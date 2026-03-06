import { Subject } from '@/types';

export const subjects: Subject[] = [
  { id: 'financial', name: '財務諸表論', shortName: '財表', color: '#3B82F6', displayOrder: 1 },
  { id: 'management', name: '管理会計論（理論）', shortName: '管理', color: '#10B981', displayOrder: 2 },
  { id: 'audit', name: '監査論', shortName: '監査', color: '#8B5CF6', displayOrder: 3 },
  { id: 'corporate', name: '企業法', shortName: '企業', color: '#F59E0B', displayOrder: 4 },
  { id: 'tax', name: '租税法（理論）', shortName: '租税', color: '#EF4444', displayOrder: 5 },
  { id: 'business', name: '経営学（理論）', shortName: '経営', color: '#06B6D4', displayOrder: 6 },
];
