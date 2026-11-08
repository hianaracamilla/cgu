import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Navigation from '@/components/Navigation';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'CGU 2026 Cebraspe Simulator | Auditor Federal - Ciência de Dados',
  description:
    'Simulador mobile-first e gerador de provas com estudo reverso por questões para Auditor Federal de Finanças e Controle da CGU 2026.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CGU 2026',
  },
};

export const viewport: Viewport = {
  themeColor: '#090d16',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}>
      <body className="min-h-full bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
        <Navigation />
        <main className="flex-1 lg:pl-64 pb-24 lg:pb-10 w-full transition-all">
          <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
