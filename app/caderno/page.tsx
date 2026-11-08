'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
  Questao,
  HistoricoResposta,
  BlocoType,
  RespostaType,
  ConfiancaType,
} from '@/lib/types';
import {
  getHistoricoRespostas,
  marcarComoDominada,
  salvarResposta,
} from '@/lib/supabase';
import { calcularPontosCebraspe } from '@/lib/simulator';
import {
  BookmarkCheck,
  Zap,
  Filter,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  XCircle,
  Archive,
  RefreshCw,
  Search,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CadernoErrosPage() {
  const [, startTransition] = useTransition();

  const [historico, setHistorico] = useState<HistoricoResposta[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filtros
  const [blocoFiltro, setBlocoFiltro] = useState<string>('TODOS');
  const [disciplinaFiltro, setDisciplinaFiltro] = useState<string>('TODAS');
  const [buscaTexto, setBuscaTexto] = useState<string>('');

  // Modos especiais
  const [modoRevisaoRapida, setModoRevisaoRapida] = useState<boolean>(false);
  const [modoRefazer, setModoRefazer] = useState<boolean>(false);

  // Estado para respostas no Modo Refazer (por questao_id)
  const [respostasRefazer, setRespostasRefazer] = useState<
    Map<
      number,
      {
        resposta: RespostaType;
        acertou: boolean;
        pontos: number;
      }
    >
  >(new Map());

  // Carrega histórico
  useEffect(() => {
    async function carregar() {
      setLoading(true);
      try {
        const dados = await getHistoricoRespostas();
        setHistorico(dados);
      } catch (err) {
        console.error('Erro ao carregar caderno de erros:', err);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, []);

  // Critério do Caderno de Erros:
  // acertou === false OU confianca === 'Duvida' (e dominada_no_caderno === false)
  // Agrupa para não duplicar a mesma questão se foi respondida mais de uma vez
  const itensCadernoMap = new Map<number, HistoricoResposta>();
  historico.forEach((item) => {
    if (
      (!item.acertou || item.confianca === 'Duvida') &&
      !item.dominada_no_caderno &&
      item.questao
    ) {
      if (!itensCadernoMap.has(item.questao_id)) {
        itensCadernoMap.set(item.questao_id, item);
      }
    }
  });

  const itensCaderno = Array.from(itensCadernoMap.values());

  // Disciplinas únicas para filtro
  const disciplinasDisponiveis = Array.from(
    new Set(itensCaderno.map((i) => i.questao?.disciplina).filter(Boolean))
  ) as string[];

  // Aplicação dos filtros
  const itensFiltrados = itensCaderno.filter((item) => {
    const q = item.questao;
    if (!q) return false;

    if (blocoFiltro !== 'TODOS' && q.bloco !== blocoFiltro) return false;
    if (disciplinaFiltro !== 'TODAS' && q.disciplina !== disciplinaFiltro) return false;

    if (buscaTexto.trim()) {
      const termo = buscaTexto.toLowerCase();
      const match =
        q.enunciado.toLowerCase().includes(termo) ||
        q.disciplina.toLowerCase().includes(termo) ||
        q.topico_edital.toLowerCase().includes(termo) ||
        q.regra_ouro.toLowerCase().includes(termo);
      if (!match) return false;
    }

    return true;
  });

  // Ação de Arquivar / Marcar como Dominada
  const handleMarcarDominada = async (questaoId: number) => {
    // Atualização otimista
    setHistorico((prev) =>
      prev.map((h) => (h.questao_id === questaoId ? { ...h, dominada_no_caderno: true } : h))
    );

    try {
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
    } catch {}

    startTransition(() => {
      marcarComoDominada(questaoId);
    });
  };

  // Resposta no Modo Refazer Erros
  const handleResponderRefazer = (questao: Questao, resposta: RespostaType) => {
    const { acertou, pontos } = calcularPontosCebraspe(questao.bloco, questao.gabarito, resposta);
    const novo = new Map(respostasRefazer);
    novo.set(questao.id, { resposta, acertou, pontos });
    setRespostasRefazer(novo);

    if (acertou) {
      try {
        confetti({ particleCount: 25, spread: 40 });
      } catch {}
    }

    // Salva nova resposta no histórico
    startTransition(() => {
      salvarResposta({
        questao_id: questao.id,
        resposta_usuario: resposta,
        confianca: 'Certeza',
        acertou,
        pontos_liquidos: pontos,
        dominada_no_caderno: acertou, // se acertou ao refazer, já pode arquivar automaticamente ou manter
      });
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400 font-mono">Carregando Caderno de Erros...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* CABEÇALHO COM MODOS DE VISUALIZAÇÃO */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <BookmarkCheck className="w-6 h-6 text-amber-400" />
                Caderno de Erros Inteligente
              </h1>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800/60 font-bold">
                {itensCaderno.length} {itensCaderno.length === 1 ? 'item ativo' : 'itens ativos'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Questões erradas ou marcadas com dúvida na preparação para a CGU 2026.
            </p>
          </div>

          {/* TOGGLES: REVISÃO RÁPIDA (10 MIN) & REFAZER ERROS */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                setModoRevisaoRapida(!modoRevisaoRapida);
                if (!modoRevisaoRapida) setModoRefazer(false);
              }}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                modoRevisaoRapida
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-800 text-amber-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Revisão 10 Min (Regras)</span>
            </button>

            <button
              onClick={() => {
                setModoRefazer(!modoRefazer);
                if (!modoRefazer) setModoRevisaoRapida(false);
              }}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                modoRefazer
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-slate-800 text-blue-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refazer Erros</span>
            </button>
          </div>
        </div>

        {/* BARRA DE FILTROS */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-3">
          {/* Filtro por Bloco */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium">Bloco:</span>
            {(['TODOS', 'P1', 'P2', 'P3'] as const).map((b) => (
              <button
                key={b}
                onClick={() => setBlocoFiltro(b)}
                className={`px-2.5 py-1 rounded-lg font-mono font-semibold transition-all ${
                  blocoFiltro === b
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {b}
              </button>
            ))}
          </div>

          {/* Filtro por Disciplina */}
          {disciplinasDisponiveis.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 font-medium">Disciplina:</span>
              <select
                value={disciplinaFiltro}
                onChange={(e) => setDisciplinaFiltro(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-blue-500"
              >
                <option value="TODAS">Todas as Disciplinas</option>
                {disciplinasDisponiveis.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Campo de Busca Rápida */}
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={buscaTexto}
              onChange={(e) => setBuscaTexto(e.target.value)}
              placeholder="Buscar termo, tópico ou regra..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* CASO NÃO HAJA ITENS */}
      {itensFiltrados.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8 space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">Nenhum item pendente no Caderno</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {itensCaderno.length === 0
              ? 'Excelente! Você ainda não errou nenhuma questão ou já dominou todos os itens arquivados.'
              : 'Nenhuma questão encontrada com os filtros selecionados.'}
          </p>
        </div>
      ) : modoRevisaoRapida ? (
        /* ========================================================== */
        /* MODO REVISÃO DE 10 MINUTOS: APENAS REGRAS DE OURO EM BULLET */
        /* ========================================================== */
        <div className="space-y-3 animate-in fade-in duration-200">
          <div className="bg-amber-950/30 border border-amber-800/40 p-4 rounded-2xl flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-xs text-amber-200 font-medium">
              <strong>Modo Flash-Review Ativo:</strong> Enunciados longos ocultados.
              Revise cirurgicamente as Regras de Ouro antes de dormir ou antes da prova.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {itensFiltrados.map((item, idx) => {
              const q = item.questao!;
              return (
                <div
                  key={q.id}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800/90 hover:border-amber-500/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono font-bold text-slate-400">#{idx + 1}</span>
                      <span
                        className={`font-semibold px-2 py-0.5 rounded ${
                          q.bloco === 'P3'
                            ? 'bg-amber-950 text-amber-300'
                            : 'bg-blue-950 text-blue-300'
                        }`}
                      >
                        {q.bloco} • {q.disciplina}
                      </span>
                      <span className="text-[11px] text-slate-400 hidden sm:inline">
                        Gabarito: <strong className="text-white">{q.gabarito}</strong>
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm font-semibold text-amber-200 leading-snug">
                      ✨ {q.regra_ouro}
                    </p>
                  </div>

                  <button
                    onClick={() => handleMarcarDominada(q.id)}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 border border-slate-700 hover:border-emerald-700/60 text-xs font-semibold transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Já dominei</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ========================================================== */
        /* MODO NORMAL / MODO REFAZER ERROS                           */
        /* ========================================================== */
        <div className="space-y-4">
          {itensFiltrados.map((item, idx) => {
            const q = item.questao!;
            const refiz = respostasRefazer.get(q.id);

            return (
              <div
                key={q.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 relative"
              >
                {/* Metadados */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono font-bold text-slate-400">Item #{idx + 1}</span>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded ${
                        q.bloco === 'P3'
                          ? 'bg-amber-950 text-amber-300'
                          : 'bg-blue-950 text-blue-300'
                      }`}
                    >
                      {q.bloco} • {q.disciplina}
                    </span>
                    <span className="text-slate-400 hidden sm:inline">{q.topico_edital}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.confianca === 'Duvida' && (
                      <span className="text-[11px] font-semibold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                        Marcado com Dúvida
                      </span>
                    )}
                    <button
                      onClick={() => handleMarcarDominada(q.id)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 border border-slate-700 hover:border-emerald-700 text-xs font-semibold transition-colors"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>✅ Já dominei</span>
                    </button>
                  </div>
                </div>

                {/* Enunciado */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-slate-100 text-sm font-serif leading-relaxed">
                  {q.enunciado}
                </div>

                {/* Se estiver no Modo Refazer */}
                {modoRefazer ? (
                  <div className="pt-2 space-y-3">
                    <div className="text-xs font-semibold text-blue-400">
                      Julgue novamente sem ver o gabarito:
                    </div>

                    <div className="grid grid-cols-2 gap-3 max-w-xs">
                      <button
                        onClick={() => handleResponderRefazer(q, 'C')}
                        className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                          refiz?.resposta === 'C'
                            ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                            : 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60 hover:bg-emerald-900/50'
                        }`}
                      >
                        CERTO
                      </button>

                      <button
                        onClick={() => handleResponderRefazer(q, 'E')}
                        className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                          refiz?.resposta === 'E'
                            ? 'bg-rose-600 text-white ring-2 ring-rose-400'
                            : 'bg-rose-950/40 text-rose-400 border-rose-800/60 hover:bg-rose-900/50'
                        }`}
                      >
                        ERRADO
                      </button>
                    </div>

                    {refiz && (
                      <div
                        className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                          refiz.acertou
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/60'
                            : 'bg-rose-950/60 text-rose-300 border border-rose-700/60'
                        }`}
                      >
                        {refiz.acertou ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                        <span>
                          {refiz.acertou
                            ? 'Excelente! Agora você acertou.'
                            : `Ainda incorreto. Gabarito oficial: ${q.gabarito}.`}
                        </span>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Regra de Ouro e Comentário (visíveis no modo normal ou após refazer) */}
                {(!modoRefazer || refiz) && (
                  <div className="space-y-2 pt-2">
                    <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-600/40 text-xs font-medium text-amber-200 flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-amber-300">Regra de Ouro:</strong> {q.regra_ouro}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                      <span className="font-bold text-slate-200 block mb-1">
                        Gabarito: <span className="text-white font-mono">{q.gabarito}</span> • Explicação:
                      </span>
                      {q.comentario}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
