import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Scaled - Real-Time Party Game',
  description: 'Test your intuition for scale in this real-time multiplayer party game.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground bg-slate-900">
        {children}
      </body>
    </html>
  );
}
