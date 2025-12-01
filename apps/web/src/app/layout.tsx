import './globals.css';
import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import Header from '@/components/Header';

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NOTMAT',
  description: 'Transform your notes into structured, actionable tasks',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="">
      <body className={jetbrainsMono.className}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
          <Header />
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
