import type { Metadata } from 'next';
import './globals.css';
import BottomNav from '@/components/BottomNav';

export const metadata: Metadata = {
  title: 'ソウキ - 公認会計士論文式試験 想起学習アプリ',
  description: '目次学習・想起学習・答案骨格の再生を支援する公認会計士論文式試験対策アプリ',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="pb-20">
        <main className="max-w-lg mx-auto px-4">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
