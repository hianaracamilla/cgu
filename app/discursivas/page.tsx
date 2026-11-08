'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  PenTool,
  Printer,
  Clock,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Award,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  Save,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { DISCURSIVAS_OFICIAIS } from '@/lib/discursivasSeed';
import { QuestaoDiscursiva, TipoDiscursiva } from '@/lib/types';

export default function DiscursivasPage() {
  const [tipoFiltro, setTipoFiltro] = useState<TipoDiscursiva>('conhecimentos_complementares_30');
  const [questaoAtualId, setQuestaoAtualId] = useState<string>('disc-p2-01');
  const [textoResposta, setTextoResposta] = useState<string>('');
  const [mostrarEspelho, setMostrarEspelho] = useState<boolean>(false);
  const [notasQuesitos, setNotasQuesitos] = useState<Record<string, number>>({});
  const [salvoFeedback, setSalvoFeedback] = useState<boolean>(false);

  // Cronômetro
  const [tempoSegundos, setTempoSegundos] = useState<number>(45 * 60); // 45 min padrão
  const [cronometroAtivo, setCronometroAtivo] = useState<boolean>(false);

  // Filtragem de questões disponíveis
  const questoesFiltradas = useMemo(() => {
    return DISCURSIVAS_OFICIAIS.filter((q) => q.tipo === tipoFiltro);
  }, [tipoFiltro]);

  // Questão selecionada
  const questao = useMemo(() => {
    return DISCURSIVAS_OFICIAIS.find((q) => q.id === questaoAtualId) || questoesFiltradas[0];
  }, [questaoAtualId, questoesFiltradas]);

  // Atualizar questão ao trocar tipo
  useEffect(() => {
    if (questoesFiltradas.length > 0 && !questoesFiltradas.some((q) => q.id === questaoAtualId)) {
      setQuestaoAtualId(questoesFiltradas[0].id);
      setTempoSegundos(questoesFiltradas[0].limite_linhas === 30 ? 45 * 60 : 90 * 60);
      setCronometroAtivo(false);
    }
  }, [tipoFiltro, questoesFiltradas, questaoAtualId]);

  // Carregar rascunho salvo do localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const rascunho = localStorage.getItem(`discursiva_draft_${questao.id}`);
      setTextoResposta(rascunho || '');
      const notasSalvas = localStorage.getItem(`discursiva_notas_${questao.id}`);
      if (notasSalvas) {
        try {
          setNotasQuesitos(JSON.parse(notasSalvas));
        } catch {
          setNotasQuesitos({});
        }
      } else {
        setNotasQuesitos({});
      }
      setMostrarEspelho(false);
    }
  }, [questao.id]);

  // Temporizador do cronômetro
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (cronometroAtivo && tempoSegundos > 0) {
      interval = setInterval(() => {
        setTempoSegundos((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (tempoSegundos === 0 && cronometroAtivo) {
      setCronometroAtivo(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [cronometroAtivo, tempoSegundos]);

  // Cálculo das linhas aproximadas
  const linhasContadas = useMemo(() => {
    if (!textoResposta.trim()) return 0;
    // Divide por quebras explícitas e calcula quebras automáticas (aprox 75 caracteres por linha pautada manuscrita)
    const paragrafos = textoResposta.split('\n');
    let total = 0;
    for (const p of paragrafos) {
      if (p.length === 0) {
        total += 1;
      } else {
        total += Math.max(1, Math.ceil(p.length / 75));
      }
    }
    return total;
  }, [textoResposta]);

  const limiteExcedido = linhasContadas > questao.limite_linhas;
  const pertoDoLimite = linhasContadas >= questao.limite_linhas - 3 && !limiteExcedido;

  // Formatação do tempo
  const formatarTempo = (seg: number) => {
    const m = Math.floor(seg / 60);
    const s = seg % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Salvar rascunho
  const handleSalvarRascunho = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`discursiva_draft_${questao.id}`, textoResposta);
      localStorage.setItem(`discursiva_notas_${questao.id}`, JSON.stringify(notasQuesitos));
      setSalvoFeedback(true);
      setTimeout(() => setSalvoFeedback(false), 2500);
    }
  };

  // Calcular nota autoavaliada
  const notaTotalAutoavaliada = useMemo(() => {
    let soma = 0;
    for (const q of questao.quesitos) {
      soma += notasQuesitos[q.numero] || 0;
    }
    return Math.min(questao.valor_pontos, soma);
  }, [notasQuesitos, questao]);

  return (
    <div className="space-y-6">
      {/* ========================================================= */}
      {/* FOLHA OFICIAL PARA IMPRESSÃO (@media print) */}
      {/* ========================================================= */}
      <div className="hidden print:block print:w-full print:text-black">
        <div className="border-2 border-black p-4 mb-4 text-center">
          <p className="font-bold text-xs uppercase tracking-wider">
            GOVERNO FEDERAL • CONTROLADORIA-GERAL DA UNIÃO (CGU)
          </p>
          <p className="font-extrabold text-sm uppercase">
            CONCURSO PÚBLICO - AUDITOR FEDERAL DE FINANÇAS E CONTROLE (AFFC)
          </p>
          <p className="text-xs font-semibold">CEBRASPE • PROVA DISCURSIVA</p>
          <div className="mt-2 pt-2 border-t border-black flex justify-between text-xs">
            <span>
              <strong>TIPO:</strong> {questao.limite_linhas === 30 ? 'Questão Discursiva (30 linhas)' : 'Situação-Problema (60 linhas)'}
            </span>
            <span>
              <strong>VALOR MÁXIMO:</strong> {questao.valor_pontos.toFixed(2)} PONTOS
            </span>
            <span>
              <strong>DATA:</strong> ____/____/2026
            </span>
          </div>
        </div>

        <div className="border border-black p-3 mb-4 text-xs bg-slate-50">
          <p className="font-bold mb-1">TEMA: {questao.titulo}</p>
          <p className="text-justify mb-2">{questao.contexto}</p>
          <p className="font-semibold whitespace-pre-line">{questao.comando}</p>
        </div>

        <div className="border border-black p-1">
          <p className="text-[10px] text-center font-bold tracking-widest uppercase border-b border-black pb-1 mb-1">
            FOLHA DE TEXTO DEFINITIVO (TRANSCREVER A CANETA PRETA TRANSPARENTE)
          </p>
          <div className="space-y-0 text-xs">
            {Array.from({ length: questao.limite_linhas }).map((_, idx) => (
              <div
                key={idx}
                className="flex items-center h-[26px] border-b border-slate-300 px-1"
              >
                <span className="w-8 text-[11px] font-mono font-bold text-slate-500 border-r border-slate-300 mr-2 select-none">
                  {(idx + 1).toString().padStart(2, '0')}
                </span>
                <span className="flex-1"></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TELA INTERATIVA (NO-PRINT) */}
      {/* ========================================================= */}
      <div className="no-print space-y-6">
        {/* CABEÇALHO */}
        <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/30 border border-blue-800/40 rounded-2xl p-5 backdrop-blur-sm shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-2">
                <PenTool className="w-3.5 h-3.5" />
                Prova Discursiva Cebraspe • 100,00 Pontos
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Simulador de Prova Discursiva CGU 2026
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                Treine a escrita dissertativa sob rigorosas condições de prova: limite real de linhas, cronômetro, impressão de folhas pautadas oficiais e autoavaliação com o padrão de resposta da banca.
              </p>
            </div>

            {/* SELETOR DE MODALIDADE */}
            <div className="flex bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 shrink-0">
              <button
                onClick={() => setTipoFiltro('conhecimentos_complementares_30')}
                className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  tipoFiltro === 'conhecimentos_complementares_30'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                30 Linhas (P2 - 30 pts)
              </button>
              <button
                onClick={() => setTipoFiltro('situacao_problema_60')}
                className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  tipoFiltro === 'situacao_problema_60'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                60 Linhas (P3 - 70 pts)
              </button>
            </div>
          </div>
        </div>

        {/* BARRA DE SELEÇÃO DE TEMA & CRONÔMETRO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-center">
            <label className="text-xs font-semibold text-slate-400 mb-1 flex items-center justify-between">
              <span>Selecione a Proposta de Discursiva:</span>
              <span className="text-[11px] text-blue-400 font-mono">
                {questoesFiltradas.length} propostas disponíveis
              </span>
            </label>
            <select
              value={questaoAtualId}
              onChange={(e) => setQuestaoAtualId(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              {questoesFiltradas.map((q, idx) => (
                <option key={q.id} value={q.id}>
                  Proposta #{idx + 1}: {q.titulo}
                </option>
              ))}
            </select>
          </div>

          {/* CRONÔMETRO DE PROVA */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  cronometroAtivo
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 animate-pulse'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                  Tempo Restante
                </p>
                <p className="text-xl font-mono font-black text-white">
                  {formatarTempo(tempoSegundos)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCronometroAtivo(!cronometroAtivo)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  cronometroAtivo
                    ? 'bg-amber-600/20 text-amber-300 border border-amber-600/40 hover:bg-amber-600/30'
                    : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500'
                }`}
              >
                {cronometroAtivo ? 'Pausar' : 'Iniciar'}
              </button>
              <button
                onClick={() => {
                  setCronometroAtivo(false);
                  setTempoSegundos(questao.limite_linhas === 30 ? 45 * 60 : 90 * 60);
                }}
                title="Reiniciar tempo"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* CARD DO ENUNCIADO / SITUAÇÃO-PROBLEMA */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="bg-slate-800/60 px-5 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                {questao.tipo === 'conhecimentos_complementares_30' ? 'Bloco P2 • 30 Linhas' : 'Bloco P3 • 60 Linhas'}
              </span>
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                {questao.disciplina}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-0.5 rounded-full">
                Vale {questao.valor_pontos.toFixed(2)} pts
              </span>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors border border-slate-700"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir Folha Cebraspe
              </button>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <h2 className="text-lg font-bold text-white tracking-tight">
              {questao.titulo}
            </h2>

            {/* Contexto motivador */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 text-sm text-slate-300 leading-relaxed">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                Texto Motivador / Cenário de Auditoria:
              </p>
              {questao.contexto}
            </div>

            {/* Comando com tópicos pontuados */}
            <div className="bg-blue-950/20 border border-blue-900/40 rounded-xl p-4 text-sm text-slate-200">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                Comando da Questão Discursiva:
              </p>
              <div className="whitespace-pre-line leading-relaxed font-sans text-slate-200">
                {questao.comando}
              </div>
            </div>
          </div>
        </div>

        {/* ÁREA DE ESCRITA / REDAÇÃO */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <PenTool className="w-4 h-4 text-emerald-400" />
                Área de Redação do Candidato
              </h3>
              <span className="text-xs text-slate-400">
                (Aproximadamente 70-75 caracteres por linha pautada)
              </span>
            </div>

            {/* CONTADORES DE LINHAS E PALAVRAS */}
            <div className="flex items-center gap-3">
              <div
                className={`px-3 py-1 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 border ${
                  limiteExcedido
                    ? 'bg-rose-950/80 text-rose-300 border-rose-700 animate-pulse'
                    : pertoDoLimite
                    ? 'bg-amber-950/80 text-amber-300 border-amber-700'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {limiteExcedido ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>
                  {linhasContadas} / {questao.limite_linhas} linhas
                </span>
              </div>

              <div className="text-xs text-slate-400 font-mono hidden sm:block">
                {textoResposta.trim().split(/\s+/).filter(Boolean).length} palavras
              </div>

              <button
                onClick={handleSalvarRascunho}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                {salvoFeedback ? 'Salvo!' : 'Salvar'}
              </button>
            </div>
          </div>

          {limiteExcedido && (
            <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-3 text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                <strong>Atenção ao limite Cebraspe:</strong> Seu texto ultrapassou a linha {questao.limite_linhas}. Linhas excedentes são sumariamente desconsideradas pelos corretores da banca.
              </span>
            </div>
          )}

          {/* TEXTAREA COM LINHAS PAUTADAS VISUAIS */}
          <div className="relative rounded-xl border border-slate-700 focus-within:border-blue-500 transition-colors bg-slate-950 overflow-hidden">
            <textarea
              value={textoResposta}
              onChange={(e) => setTextoResposta(e.target.value)}
              placeholder="Digite aqui o seu texto dissertativo estruturado em introdução, desenvolvimento dos quesitos (1, 2 e 3) e conclusão..."
              rows={questao.limite_linhas === 30 ? 14 : 22}
              className="w-full bg-transparent text-slate-100 p-4 text-sm font-mono leading-[26px] resize-y focus:outline-none selection:bg-blue-600 selection:text-white"
            />
          </div>
        </div>

        {/* BOTÃO PARA ABRIR ESPELHO DE AVALIAÇÃO / AUTOAVALIAÇÃO */}
        <div className="pt-2">
          <button
            onClick={() => setMostrarEspelho(!mostrarEspelho)}
            className="w-full bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-700/50 hover:border-indigo-500/80 rounded-2xl p-4 flex items-center justify-between text-white font-bold transition-all shadow-lg hover:shadow-indigo-500/10 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                <Award className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-white">
                  Padrão de Resposta & Espelho de Avaliação Cebraspe
                </p>
                <p className="text-xs text-slate-400 font-normal">
                  {mostrarEspelho
                    ? 'Ocultar critérios oficiais e notas da banca'
                    : 'Clique para comparar sua resposta com os quesitos de pontuação da banca'}
                </p>
              </div>
            </div>
            {mostrarEspelho ? (
              <ChevronUp className="w-5 h-5 text-indigo-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-indigo-400" />
            )}
          </button>
        </div>

        {/* PAINEL REVELADO DO ESPELHO DE CORREÇÃO */}
        {mostrarEspelho && (
          <div className="bg-slate-900 border border-indigo-900/60 rounded-2xl p-5 space-y-6 shadow-2xl animate-in fade-in duration-300">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Grade de Correção Oficial (Quesitos de Conteúdo)
                </h3>
                <p className="text-xs text-slate-400">
                  Avalie o cumprimento de cada item para calcular sua nota preliminar.
                </p>
              </div>
              <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-right">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Nota Autoavaliada
                </span>
                <span className="text-lg font-mono font-black text-emerald-400">
                  {notaTotalAutoavaliada.toFixed(2)} / {questao.valor_pontos.toFixed(2)}
                </span>
              </div>
            </div>

            {/* QUESITOS DA GRADE DE AVALIAÇÃO */}
            <div className="space-y-4">
              {questao.quesitos.map((q) => {
                const notaAtual = notasQuesitos[q.numero] ?? 0;
                return (
                  <div
                    key={q.numero}
                    className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="font-bold text-sm text-blue-300">
                        Quesito {q.numero}: {q.descricao}
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-900/60 px-2 py-0.5 rounded self-start sm:self-auto">
                        Valor Máximo: {q.pontos_maximos.toFixed(2)} pts
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-3 rounded-lg border border-slate-800/80">
                      <strong>Critério do Examinador:</strong> {q.criterio_esperado}
                    </p>

                    {/* BOTÕES RÁPIDOS DE NOTA */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-xs text-slate-400 font-medium">
                        Atribuir nota:
                      </span>
                      {[0, 0.5, 0.75, 1.0].map((frac) => {
                        const pontuacao = +(q.pontos_maximos * frac).toFixed(2);
                        const selecionado = Math.abs(notaAtual - pontuacao) < 0.05;
                        return (
                          <button
                            key={frac}
                            onClick={() => {
                              const novasNotas = { ...notasQuesitos, [q.numero]: pontuacao };
                              setNotasQuesitos(novasNotas);
                              localStorage.setItem(
                                `discursiva_notas_${questao.id}`,
                                JSON.stringify(novasNotas)
                              );
                            }}
                            className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all ${
                              selecionado
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            {frac === 0
                              ? '0 pt (Não abordou)'
                              : frac === 0.5
                              ? `${pontuacao.toFixed(1)} (Incompleto)`
                              : frac === 0.75
                              ? `${pontuacao.toFixed(1)} (Bom)`
                              : `${pontuacao.toFixed(1)} (Excelente)`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* PADRÃO DE RESPOSTA MODELO */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-5 space-y-3">
              <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Padrão de Resposta Oficial Esperado pela Banca
              </h4>
              <div className="text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-line bg-slate-900/60 p-4 rounded-lg border border-slate-800/80">
                {questao.padrao_resposta}
              </div>
              <div className="text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                <strong>Fundamentação Legal e Doutrinária:</strong>{' '}
                {questao.fundamentacao_legal}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
