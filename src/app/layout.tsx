import type { Metadata, Viewport } from 'next';
import './globals.css';
import BottomNav from '@/components/BottomNav';

export const metadata: Metadata = {
  title: 'ソウキ - 公認会計士論文式試験 想起学習アプリ',
  description: '目次学習・想起学習・答案骨格の再生を支援する公認会計士論文式試験対策アプリ',
  manifest: '/souki-cpa-study/manifest.json',
  icons: {
    icon: '/souki-cpa-study/favicon.ico',
    apple: '/souki-cpa-study/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ソウキ',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#6366F1',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="pb-24">
        <main className="max-w-lg mx-auto px-4">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
