import { topics } from '@/data/topics';
import TopicDetailClient from './TopicDetailClient';

export function generateStaticParams() {
  return topics.map(t => ({ topicId: t.id }));
}

export default function TopicDetailPage() {
  return <TopicDetailClient />;
}
