import type { Metadata, Viewport } from 'next';
import './globals.css';
import BottomNav from '@/components/BottomNav';

export const metadata: Metadata = {
  title: 'SOUKI - CPA Essay Recall',
  description: '公認会計士論文式試験の想起学習アプリ',
  manifest: '/souki-cpa-study/manifest.json',
  icons: {
    icon: '/souki-cpa-study/favicon.ico',
    apple: '/souki-cpa-study/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SOUKI',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#F2F2F7',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="pb-[92px]">
        <main className="max-w-lg mx-auto px-5">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
