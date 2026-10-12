import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ratio Study Toolkit',
  description: 'Sales ratio statistics and performance-standard checks for mass appraisal.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <span className="site-title">Ratio Study Toolkit</span>
          <span className="site-subtitle">Synthetic demo data</span>
        </header>
        <main className="site-main">{children}</main>
      </body>
    </html>
  );
}
