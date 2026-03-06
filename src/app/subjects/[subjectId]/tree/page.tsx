import { subjects } from '@/data/subjects';
import TreeClient from './TreeClient';

export function generateStaticParams() {
  return subjects.map(s => ({ subjectId: s.id }));
}

export default function TreePage() {
  return <TreeClient />;
}
