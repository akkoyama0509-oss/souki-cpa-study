import { subjects } from '@/data/subjects';
import SubjectTopicsClient from './SubjectTopicsClient';

export function generateStaticParams() {
  return subjects.map(s => ({ subjectId: s.id }));
}

export default function SubjectTopicsPage() {
  return <SubjectTopicsClient />;
}
