'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  HistoricoResposta,
  Questao,
} from '@/lib/types';
import {
  getHistoricoRespostas,
  getQuestoes,
} from '@/lib/supabase';
import HistoricoCalendarioModal from '@/components/HistoricoCalendarioModal';
import {
  BarChart3,
  Target,
  TrendingUp,
  AlertOctagon,
  Calendar,
  Sparkles,
  BookOpen,
  Award,
  CheckCircle2,
  Clock,
  Flame,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [historico, setHistorico] = useState<HistoricoResposta[]>([]);
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [hojeDiaSemana, setHojeDiaSemana] = useState<number>(1);
  const [showHistoricoModal, setShowHistoricoModal] = useState<boolean>(false);

  useEffect(() => {
    setHojeDiaSemana(new Date().getDay());
    async function carregar() {
      setLoading(true);
      try {
        const [hist, quests] = await Promise.all([
          getHistoricoRespostas(),
          getQuestoes(),
        ]);
        setHistorico(hist);
        setQuestoes(quests);
      } catch (err) {
        console.error('Erro ao carregar métricas:', err);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, []);

  // 1. Meta Rumo aos 1.750 Itens
  const META_TOTAL = 1750;
  const totalResolvidos = historico.length;
  const percentualMeta = Math.min(100, Number(((totalResolvidos / META_TOTAL) * 100).toFixed(1)));

  // 2. Pontos Líquidos Totais e Máximo Possível
  const saldoLiquidoTotal = historico.reduce((acc, h) => acc + h.pontos_liquidos, 0);
  const maxPontosResolvidos = historico.reduce((acc, h) => {
    const q = h.questao;
    return acc + (q?.bloco === 'P3' ? 2 : 1);
  }, 0);

  const taxaAcertoLiquido =
    maxPontosResolvidos > 0
      ? Math.max(0, Number(((saldoLiquidoTotal / maxPontosResolvidos) * 100).toFixed(1)))
      : 0;

  // 3. Desempenho no Bloco P3 (Ciência de Dados)
  const itensP3 = historico.filter((h) => h.questao?.bloco === 'P3');
  const pontosP3 = itensP3.reduce((acc, h) => acc + h.pontos_liquidos, 0);
  const maxPontosP3 = itensP3.length * 2;
  const taxaP3 =
    maxPontosP3 > 0
      ? Math.max(0, Number(((pontosP3 / maxPontosP3) * 100).toFixed(1)))
      : 0;

  // Alerta se P3 estiver abaixo de 30% ou 54 pontos na régua padrão de 180 pts da prova
  const p3EmAlerta = itensP3.length > 5 && taxaP3 < 30;

  // 4. Análise de Pontos Cegos por Disciplina
  const disciplinasMap = new Map<
    string,
    { total: number; acertos: number; pontos: number; bloco: string }
  >();

  historico.forEach((h) => {
    const disc = h.questao?.disciplina || 'Outros';
    const bloco = h.questao?.bloco || 'P1';
    const atual = disciplinasMap.get(disc) || { total: 0, acertos: 0, pontos: 0, bloco };
    disciplinasMap.set(disc, {
      total: atual.total + 1,
      acertos: atual.acertos + (h.acertou ? 1 : 0),
      pontos: atual.pontos + h.pontos_liquidos,
      bloco,
    });
  });

  const disciplinasStats = Array.from(disciplinasMap.entries()).map(([nome, dados]) => ({
    nome,
    ...dados,
    taxa: Number(((dados.acertos / dados.total) * 100).toFixed(0)),
  }));

  // Cronograma Semanal CGU 2026
  const diasSemana = [
    {
      dia: 'Seg / Qua',
      foco: 'Estatística, Inferência & Governança / LGPD',
      detalhes: 'P1: Português & Ética | P2: Governança COSO & LGPD | P3: Estatística Bayesiana & Testes de Hipótese',
      cor: 'border-blue-500/50 bg-blue-950/20',
      diasIndices: [1, 3], // Seg (1), Qua (3)
    },
    {
      dia: 'Ter / Qui',
      foco: 'Engenharia de Dados & Direito / Controle',
      detalhes: 'P1: Adm. Pública | P2: Auditoria Governamental & Lei 14.133 | P3: Spark, Pipelines & SQL Avançado',
      cor: 'border-emerald-500/50 bg-emerald-950/20',
      diasIndices: [2, 4], // Ter (2), Qui (4)
    },
    {
      dia: 'Sex / Sáb',
      foco: 'Machine Learning, IA / LLMs & Políticas Públicas',
      detalhes: 'P1: Políticas Públicas | P2: LAI & Gestão de Riscos | P3: Regularização, Transformers & Modelagem Preditiva',
      cor: 'border-purple-500/50 bg-purple-950/20',
      diasIndices: [5, 6], // Sex (5), Sáb (6)
    },
    {
      dia: 'Domingo',
      foco: 'Simulado de Prova + Caderno de Erros + Discursiva',
      detalhes: 'Bateria de 50 itens cronometrada no Modo Papel + Revisão 10 min das Regras de Ouro + 1 Estudo de Caso de Dados',
      cor: 'border-amber-500/50 bg-amber-950/20',
      diasIndices: [0], // Dom (0)
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400 font-mono">Calculando Métricas do Edital...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-400" />
            Painel Estratégico & Métricas CGU 2026
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitoramento de pontuação líquida Cebraspe e cronograma semanal de estudo reverso.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
          <Clock className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-300 font-medium">Meta Final: 13/12/2026</span>
        </div>
      </div>

      {/* 4 CARDS DE MÉTRICAS PRINCIPAIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Meta de Itens */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Rumo aos 1.750 Itens</span>
            <Target className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-white font-mono">
              {totalResolvidos} <span className="text-xs text-slate-400 font-normal">/ {META_TOTAL}</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${percentualMeta}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-400 mt-1.5 font-medium">
              {percentualMeta}% da meta concluída
            </div>
          </div>
        </div>

        {/* Card 2: Taxa de Acerto Líquido Cebraspe */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Aproveitamento Líquido</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {taxaAcertoLiquido}%
            </div>
            <div className="text-[11px] text-slate-400 mt-2 font-medium">
              Saldo Líquido: <strong className="text-white">{saldoLiquidoTotal > 0 ? `+${saldoLiquidoTotal.toFixed(1)}` : saldoLiquidoTotal.toFixed(1)} pts</strong>
            </div>
          </div>
        </div>

        {/* Card 3: Desempenho P3 (Ciência de Dados - Alerta) */}
        <div
          className={`rounded-2xl p-4 sm:p-5 shadow-xl space-y-3 border transition-colors ${
            p3EmAlerta
              ? 'bg-rose-950/40 border-rose-700/60'
              : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-300">
              Desempenho P3 (C. Dados)
            </span>
            {p3EmAlerta ? (
              <AlertOctagon className="w-4 h-4 text-rose-400 animate-pulse" />
            ) : (
              <Award className="w-4 h-4 text-amber-400" />
            )}
          </div>
          <div>
            <div
              className={`text-2xl font-black font-mono ${
                p3EmAlerta ? 'text-rose-400' : 'text-amber-300'
              }`}
            >
              {taxaP3}%
            </div>
            <div className="text-[11px] text-slate-400 mt-2 font-medium">
              {p3EmAlerta ? (
                <span className="text-rose-300 font-semibold">⚠️ Alerta: abaixo de 30% líquidos!</span>
              ) : (
                <span>Saldo P3: {pontosP3 > 0 ? `+${pontosP3.toFixed(1)}` : pontosP3.toFixed(1)} pts (Peso 2.0)</span>
              )}
            </div>
          </div>
        </div>

        {/* Card 4: Foco da Semana */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Ritmo Diário</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-white font-mono">
              50 <span className="text-xs text-slate-400 font-normal">itens/dia</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-2 font-medium">
              10 P1 + 10 P2 + 30 P3
            </div>
          </div>
        </div>
      </div>

      {/* PONTOS CEGOS POR DISCIPLINA */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-400" />
              Mapeamento de Pontos Cegos do Edital
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Identifique disciplinas com maior incidência de erros e penalidades líquidas.
            </p>
          </div>
        </div>

        {disciplinasStats.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            Responda questões no treino para gerar o gráfico de pontos cegos.
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            {disciplinasStats.map((d) => (
              <div key={d.nome} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-semibold px-1.5 py-0.5 rounded text-[10px] ${
                        d.bloco === 'P3'
                          ? 'bg-amber-950 text-amber-300'
                          : 'bg-blue-950 text-blue-300'
                      }`}
                    >
                      {d.bloco}
                    </span>
                    <span className="font-medium text-slate-200">{d.nome}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span className="text-slate-400">{d.total} resolvidas</span>
                    <span
                      className={`font-bold ${
                        d.pontos > 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {d.pontos > 0 ? `+${d.pontos.toFixed(1)}` : d.pontos.toFixed(1)} pts
                    </span>
                    <span className="text-slate-300 w-10 text-right">{d.taxa}%</span>
                  </div>
                </div>

                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden flex">
                  <div
                    className={`h-2 transition-all duration-300 ${
                      d.taxa >= 70
                        ? 'bg-emerald-500'
                        : d.taxa >= 50
                        ? 'bg-blue-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${d.taxa}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CRONOGRAMA SEMANAL CGU 2026 */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              Divisão Estratégica da Semana (Edital CGU 2026)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Ciclo de estudos reverso distribuído por afinidade temática e peso de prova.
            </p>
          </div>
          <button
            onClick={() => setShowHistoricoModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold transition-all shrink-0 self-start sm:self-auto"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span>Ver Histórico de Provas</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
          {diasSemana.map((bloco) => {
            const isHoje = bloco.diasIndices.includes(hojeDiaSemana);
            return (
              <div
                key={bloco.dia}
                className={`p-4 rounded-xl border transition-all ${bloco.cor} ${
                  isHoje ? 'ring-2 ring-emerald-400/80 shadow-lg' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-sm text-white">{bloco.dia}</span>
                  {isHoje && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                      Hoje
                    </span>
                  )}
                </div>
                <div className="text-xs font-semibold text-slate-200 mb-1">
                  {bloco.foco}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {bloco.detalhes}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL DE HISTÓRICO / CALENDÁRIO */}
      <HistoricoCalendarioModal
        isOpen={showHistoricoModal}
        onClose={() => setShowHistoricoModal(false)}
        onBateriaCarregada={() => {
          setShowHistoricoModal(false);
          router.push('/');
        }}
      />
    </div>
  );
}
