'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  PlayCircle,
  Printer,
  BookmarkCheck,
  BarChart3,
  UploadCloud,
  ShieldCheck,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';

const navItems = [
  { href: '/', label: 'Treino', icon: PlayCircle, badge: '50/dia' },
  { href: '/papel', label: 'Modo Papel', icon: Printer, badge: 'PDF' },
  { href: '/caderno', label: 'Caderno', icon: BookmarkCheck, badge: 'Erros' },
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3, badge: 'Métricas' },
  { href: '/importar', label: 'Importar', icon: UploadCloud, badge: 'Lote' },
];

export default function Navigation() {
  const pathname = usePathname();
  const [hasSupabase, setHasSupabase] = useState<boolean>(false);
  const [diasRestantes, setDiasRestantes] = useState<number>(0);

  useEffect(() => {
    setHasSupabase(isSupabaseConfigured());

    // Cálculo até a data alvo: 13/12/2026
    const dataAlvo = new Date('2026-12-13T08:00:00');
    const hoje = new Date();
    const diffMs = dataAlvo.getTime() - hoje.getTime();
    const dias = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    setDiasRestantes(dias);
  }, []);

  return (
    <>
      {/* HEADER SUPERIOR (Desktop & Mobile) */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 p-0.5 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base tracking-tight text-white">
                  CGU <span className="text-blue-400">2026</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/60 uppercase tracking-wider">
                  Cebraspe
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Auditor Federal • Ciência de Dados
              </p>
            </div>
          </Link>

          {/* INDICADORES & STATUS */}
          <div className="flex items-center gap-2.5">
            {/* Meta de dias */}
            <div className="flex items-center gap-1.5 text-xs bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-lg text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-white">{diasRestantes}</span>
              <span className="text-slate-400 text-[11px]">dias p/ prova</span>
            </div>

            {/* Status Supabase / Offline */}
            <div
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors ${
                hasSupabase
                  ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/50'
                  : 'bg-amber-950/40 text-amber-300 border-amber-800/50'
              }`}
              title={
                hasSupabase
                  ? 'Conectado ao Supabase (Sincronização em nuvem ativa)'
                  : 'Modo Local Ativo (adicione chaves do Supabase no .env.local para sincronizar na nuvem)'
              }
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  hasSupabase ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="hidden md:inline">
                {hasSupabase ? 'Supabase Conectado' : 'Modo Local / Demo'}
              </span>
              <span className="md:hidden">
                {hasSupabase ? 'Nuvem' : 'Local'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* DESKTOP SIDEBAR / SUBNAV */}
      <aside className="hidden lg:block fixed left-0 top-16 bottom-0 w-64 border-r border-slate-800 bg-slate-950/60 backdrop-blur p-4 space-y-2 z-30 no-print">
        <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Navegação de Estudo
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                      isActive
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Card Motivacional / Regra Cebraspe */}
        <div className="pt-6">
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-blue-950/40 border border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-300">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Regra Cebraspe Ativa</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              P1 & P2: <span className="text-emerald-400 font-semibold">+1.0</span> / <span className="text-rose-400 font-semibold">-1.0</span><br />
              P3 (C. Dados): <span className="text-emerald-400 font-bold">+2.0</span> / <span className="text-rose-400 font-bold">-2.0</span><br />
              Em Branco: <span className="text-slate-300">0.0</span>
            </p>
          </div>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/90 px-2 py-1.5 bottom-nav no-print">
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all relative ${
                  isActive
                    ? 'text-blue-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 w-8 h-1 rounded-full bg-blue-500 shadow-sm shadow-blue-400/50" />
                )}
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-blue-400 scale-110' : 'text-slate-400'} transition-transform`} />
                <span className="text-[10px] tracking-tight truncate max-w-full">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
