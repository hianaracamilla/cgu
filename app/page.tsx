'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import {
  Questao,
  BateriaDiaria,
  RespostaType,
  ConfiancaType,
  BLOCO_PESOS,
} from '@/lib/types';
import {
  getBateriaAtivaOuCriar,
  gerarBateriaDiaria,
  expandirBateriaDiariaPara50,
  salvarResposta,
  getHistoricoRespostas,
  getTemaEDisciplinasDoDia,
  carregarBateriaPorId,
} from '@/lib/supabase';
import { calcularPontosCebraspe } from '@/lib/simulator';
import HistoricoCalendarioModal from '@/components/HistoricoCalendarioModal';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  MinusCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Zap,
  Sparkles,
  Flame,
  Award,
  Layers,
  SlidersHorizontal,
  Calendar,
  PenTool,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function TreinoPage() {
  const [, startTransition] = useTransition();

  const [bateria, setBateria] = useState<BateriaDiaria | null>(null);
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [showHistoricoModal, setShowHistoricoModal] = useState<boolean>(false);

  // Mapa de respostas da sessão atual (por questao_id)
  const [respostasSessao, setRespostasSessao] = useState<
    Map<
      number,
      {
        resposta: RespostaType;
        confianca: ConfiancaType;
        acertou: boolean;
        pontos: number;
      }
    >
  >(new Map());

  // Estado local para toggle de dúvida do item atual antes de responder
  const [duvidaAtiva, setDuvidaAtiva] = useState<boolean>(false);

  // Modal / Seletor de Baterias Extras
  const [showExtraModal, setShowExtraModal] = useState<boolean>(false);

  // Carrega bateria ativa e histórico inicial
  useEffect(() => {
    async function carregar() {
      setLoading(true);
      try {
        const dados = await getBateriaAtivaOuCriar();
        setBateria(dados.bateria);
        setQuestoes(dados.questoes);

        // Preenche respostas já dadas
        const historico = await getHistoricoRespostas();
        const mapa = new Map();
        historico.forEach((h) => {
          mapa.set(h.questao_id, {
            resposta: h.resposta_usuario,
            confianca: h.confianca,
            acertou: h.acertou,
            pontos: h.pontos_liquidos,
          });
        });
        setRespostasSessao(mapa);
      } catch (err) {
        console.error('Erro ao carregar treino:', err);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, []);

  const questaoAtual = questoes[currentIndex];
  const marcacaoAtual = questaoAtual ? respostasSessao.get(questaoAtual.id) : null;
  const jaRespondida = !!marcacaoAtual;

  // Atualiza estado de dúvida quando muda de questão
  useEffect(() => {
    if (marcacaoAtual) {
      setDuvidaAtiva(marcacaoAtual.confianca === 'Duvida');
    } else {
      setDuvidaAtiva(false);
    }
  }, [currentIndex, marcacaoAtual]);

  // Função disparada ao clicar em C, E ou B
  const handleResponder = (resposta: RespostaType) => {
    if (!questaoAtual) return;

    const confianca: ConfiancaType = duvidaAtiva ? 'Duvida' : 'Certeza';
    const { acertou, pontos } = calcularPontosCebraspe(
      questaoAtual.bloco,
      questaoAtual.gabarito,
      resposta
    );

    // Efeito de celebração se acertar P3 com certeza
    if (acertou && confianca === 'Certeza' && questaoAtual.bloco === 'P3') {
      try {
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#10b981', '#3b82f6', '#f59e0b'],
        });
      } catch {}
    }

    // 1. Atualização Otimista Imediata da UI
    const novoMapa = new Map(respostasSessao);
    novoMapa.set(questaoAtual.id, {
      resposta,
      confianca,
      acertou,
      pontos,
    });
    setRespostasSessao(novoMapa);

    // 2. Persistência Assíncrona no Supabase / Local
    salvarResposta({
      bateria_id: bateria?.id,
      questao_id: questaoAtual.id,
      resposta_usuario: resposta,
      confianca,
      acertou,
      pontos_liquidos: pontos,
    }).catch((err) => console.error('Erro ao salvar resposta:', err));
  };

  // Estado de carregamento da expansão para 50 questões
  const [expandindo, setExpandindo] = useState<boolean>(false);

  // Expande a bateria ativa atual para 50 questões
  const handleExpandirPara50 = async () => {
    if (!bateria) return;
    setExpandindo(true);
    setShowExtraModal(false);
    try {
      const res = await expandirBateriaDiariaPara50(bateria.id);
      setBateria(res.bateria);
      setQuestoes(res.questoes);
      try {
        confetti({
          particleCount: 50,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
        });
      } catch {}
      // Se estava no final, posiciona suavemente no primeiro item adicionado
      if (res.questoes.length > currentIndex + 1) {
        setCurrentIndex(questoes.length);
      }
    } catch (err) {
      console.error('Erro ao expandir bateria:', err);
    } finally {
      setExpandindo(false);
    }
  };

  // Gerar nova bateria diária (padrão 25 itens: 5 P1, 5 P2, 15 P3; ou 50 itens: 10 P1, 10 P2, 30 P3)
  const handleGerarNovaBateria = async (p1 = 5, p2 = 5, p3 = 15) => {
    setLoading(true);
    setShowExtraModal(false);
    try {
      const novos = await gerarBateriaDiaria(p1, p2, p3);
      setBateria(novos.bateria);
      setQuestoes(novos.questoes);
      setCurrentIndex(0);
      setRespostasSessao(new Map());
    } finally {
      setLoading(false);
    }
  };

  // Alterna para uma bateria do histórico selecionada no modal do calendário
  const handleCarregarBateriaPorId = async (bateriaId: string) => {
    setLoading(true);
    try {
      const res = await carregarBateriaPorId(bateriaId);
      if (res) {
        setBateria(res.bateria);
        setQuestoes(res.questoes);
        setCurrentIndex(0);

        // Preenche respostas já dadas
        const historico = await getHistoricoRespostas();
        const mapa = new Map();
        historico.forEach((h) => {
          mapa.set(h.questao_id, {
            resposta: h.resposta_usuario,
            confianca: h.confianca,
            acertou: h.acertou,
            pontos: h.pontos_liquidos,
          });
        });
        setRespostasSessao(mapa);
      }
    } catch (err) {
      console.error('Erro ao alternar bateria:', err);
    } finally {
      setLoading(false);
    }
  };

  // Estatísticas da sessão atual
  const totalQuestoes = questoes.length;
  const respondidasCount = questoes.filter((q) => respostasSessao.has(q.id)).length;
  const saldoLiquido = Array.from(respostasSessao.values()).reduce(
    (acc, curr) => acc + curr.pontos,
    0
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400 font-mono tracking-wide">
          Carregando Bateria Cebraspe...
        </p>
      </div>
    );
  }

  if (questoes.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-lg text-slate-300">Nenhuma questão encontrada para a bateria.</p>
        <button
          onClick={() => handleGerarNovaBateria(5, 5, 15)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium shadow-lg"
        >
          Gerar Bateria Padrão (25 Itens)
        </button>
      </div>
    );
  }

  const pesoInfo = BLOCO_PESOS[questaoAtual.bloco];
  const hoje = new Date();
  const diaSemanaHoje = hoje.getDay();
  const cronogramaHoje = getTemaEDisciplinasDoDia(diaSemanaHoje);

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* BANNER DOMINGO: SIMULADO GERAL + DISCURSIVA */}
      {cronogramaHoje.temDiscursiva ? (
        <div className="bg-gradient-to-r from-purple-950/60 via-indigo-950/40 to-slate-900 border border-purple-500/30 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center shrink-0">
              <PenTool className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Planejamento de Domingo
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {cronogramaHoje.diaNome}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white mt-0.5">
                {cronogramaHoje.focoTema}: Simulado Cebraspe + Prova Discursiva
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                O teste de hoje foi gerado com a distribuição geral de exame. Não esqueça de treinar também a discursiva!
              </p>
            </div>
          </div>
          <Link
            href="/discursivas"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all shrink-0"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Treinar Discursiva</span>
          </Link>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-slate-400 font-medium">{cronogramaHoje.diaNome}:</span>
            <span className="text-slate-200 font-semibold">{cronogramaHoje.focoTema}</span>
          </div>
          <span className="text-slate-400 text-[11px] hidden sm:inline">
            70% das questões focadas nas matérias do dia
          </span>
        </div>
      )}

      {/* BARRA SUPERIOR DE PROGRESSO E CONTROLES */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-3.5 sm:p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 font-mono">
              Item {currentIndex + 1} de {totalQuestoes}
            </span>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>{respondidasCount}/{totalQuestoes} feitos</span>
            </div>
          </div>

          {/* Saldo Líquido Cebraspe em tempo real e Ações */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
              <span className="text-slate-400">Saldo:</span>
              <span
                className={`font-mono font-bold ${
                  saldoLiquido > 0
                    ? 'text-emerald-400'
                    : saldoLiquido < 0
                    ? 'text-rose-400'
                    : 'text-slate-300'
                }`}
              >
                {saldoLiquido > 0 ? `+${saldoLiquido.toFixed(1)}` : saldoLiquido.toFixed(1)} pts
              </span>
            </div>

            {/* Botão de Histórico / Provas Anteriores */}
            <button
              onClick={() => setShowHistoricoModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 text-xs font-medium transition-all"
              title="Calendário e Provas de Dias Anteriores"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Provas Anteriores</span>
            </button>

            {totalQuestoes < 50 && (
              <button
                onClick={handleExpandirPara50}
                disabled={expandindo}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600/30 to-indigo-600/30 hover:from-blue-600/50 hover:to-indigo-600/50 text-blue-300 border border-blue-500/40 text-xs font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-50"
                title="Completar perguntas do dia e aumentar para 50"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">{expandindo ? 'Expandindo...' : '+ Completar 50'}</span>
                <span className="sm:hidden">{expandindo ? '...' : '+50'}</span>
              </button>
            )}

            <button
              onClick={() => setShowExtraModal(true)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Gerar Bateria Extra / Opções"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Linha de Progresso Visual */}
        <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden flex">
          <div
            className="bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 h-2 transition-all duration-300"
            style={{ width: `${(respondidasCount / totalQuestoes) * 100}%` }}
          />
        </div>

        {/* Seletor Rápido de Questões (Carrossel Horizontal de Pílulas) */}
        <div className="flex gap-1.5 overflow-x-auto pt-3 pb-1 no-scrollbar text-xs">
          {questoes.map((q, idx) => {
            const resp = respostasSessao.get(q.id);
            const isCurrent = idx === currentIndex;
            let statusClass = 'bg-slate-800/70 text-slate-400 border-slate-700/50';

            if (resp) {
              if (resp.resposta === 'B') {
                statusClass = 'bg-slate-700 text-slate-200 border-slate-500';
              } else if (resp.acertou) {
                statusClass = 'bg-emerald-950/80 text-emerald-300 border-emerald-600/60';
              } else {
                statusClass = 'bg-rose-950/80 text-rose-300 border-rose-600/60';
              }
            }

            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`min-w-8 h-8 px-2 rounded-lg font-mono font-medium border flex items-center justify-center transition-all ${statusClass} ${
                  isCurrent ? 'ring-2 ring-blue-500 scale-105 font-bold shadow-md' : 'opacity-85 hover:opacity-100'
                }`}
              >
                {idx + 1}
                {resp?.confianca === 'Duvida' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute top-1 right-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* FLASHCARD FOCADO DA QUESTÃO */}
      <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        {/* Metadados: Bloco, Peso, Disciplina e Tópico */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-md border ${
                questaoAtual.bloco === 'P3'
                  ? 'bg-amber-950/40 text-amber-300 border-amber-700/50'
                  : 'bg-blue-950/40 text-blue-300 border-blue-700/50'
              }`}
            >
              {questaoAtual.bloco} • {pesoInfo?.nome}
            </span>
            <span className="text-xs font-medium text-slate-300 bg-slate-800/60 px-2 py-0.5 rounded">
              {questaoAtual.disciplina}
            </span>
          </div>

          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
            Nível: {questaoAtual.nivel}
          </span>
        </div>

        <div className="mb-2 text-xs font-semibold text-slate-400">
          Tópico: <span className="text-slate-300 font-normal">{questaoAtual.topico_edital}</span>
        </div>

        {/* ENUNCIADO ESTILO CEBRASPE */}
        <div className="my-5 p-4 rounded-xl bg-slate-950/60 border border-slate-800/60 text-slate-100 text-sm sm:text-base leading-relaxed tracking-normal select-text font-serif">
          {questaoAtual.enunciado}
        </div>

        {/* TOGGLE DÚVIDA (?) */}
        <div className="flex items-center justify-between py-2 mb-4 border-t border-slate-800/60">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const novoEstado = !duvidaAtiva;
                setDuvidaAtiva(novoEstado);
                if (jaRespondida) {
                  // Re-salva com nova marcação de confiança
                  salvarResposta({
                    bateria_id: bateria?.id,
                    questao_id: questaoAtual.id,
                    resposta_usuario: marcacaoAtual.resposta,
                    confianca: novoEstado ? 'Duvida' : 'Certeza',
                    acertou: marcacaoAtual.acertou,
                    pontos_liquidos: marcacaoAtual.pontos,
                  });
                  const novoMapa = new Map(respostasSessao);
                  novoMapa.set(questaoAtual.id, {
                    ...marcacaoAtual,
                    confianca: novoEstado ? 'Duvida' : 'Certeza',
                  });
                  setRespostasSessao(novoMapa);
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
                duvidaAtiva
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-lg shadow-amber-500/10'
                  : 'bg-slate-800/70 text-slate-400 border-slate-700/60 hover:text-slate-200'
              }`}
            >
              <HelpCircle className={`w-4 h-4 ${duvidaAtiva ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>Marcar como Dúvida (?)</span>
            </button>
            {duvidaAtiva && (
              <span className="text-[11px] text-amber-400/90 hidden sm:inline">
                (Irá automaticamente para o Caderno de Erros)
              </span>
            )}
          </div>

          {jaRespondida && (
            <div className="flex items-center gap-1.5 text-xs font-mono font-semibold">
              <span className="text-slate-400">Marcou:</span>
              <span className="text-white px-2 py-0.5 rounded bg-slate-800">
                {marcacaoAtual.resposta === 'B' ? 'Em Branco' : marcacaoAtual.resposta}
              </span>
            </div>
          )}
        </div>

        {/* BOTÕES TÁTEIS GRANDES PARA POLEGAR [ C ] [ E ] [ Em Branco ] */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 my-3">
          {/* BOTÃO CERTO */}
          <button
            onClick={() => handleResponder('C')}
            className={`py-4 sm:py-5 px-3 rounded-2xl font-black text-lg sm:text-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-md ${
              marcacaoAtual?.resposta === 'C'
                ? 'bg-emerald-600 text-white ring-4 ring-emerald-500/30'
                : 'bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-400 border border-emerald-800/60'
            }`}
          >
            <span>CERTO</span>
            <span className="text-[10px] font-sans font-normal opacity-75">
              +{pesoInfo.acerto.toFixed(1)} / {pesoInfo.erro.toFixed(1)}
            </span>
          </button>

          {/* BOTÃO ERRADO */}
          <button
            onClick={() => handleResponder('E')}
            className={`py-4 sm:py-5 px-3 rounded-2xl font-black text-lg sm:text-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-md ${
              marcacaoAtual?.resposta === 'E'
                ? 'bg-rose-600 text-white ring-4 ring-rose-500/30'
                : 'bg-rose-950/40 hover:bg-rose-900/50 text-rose-400 border border-rose-800/60'
            }`}
          >
            <span>ERRADO</span>
            <span className="text-[10px] font-sans font-normal opacity-75">
              +{pesoInfo.acerto.toFixed(1)} / {pesoInfo.erro.toFixed(1)}
            </span>
          </button>

          {/* BOTÃO EM BRANCO */}
          <button
            onClick={() => handleResponder('B')}
            className={`py-4 sm:py-5 px-3 rounded-2xl font-bold text-sm sm:text-base flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-md ${
              marcacaoAtual?.resposta === 'B'
                ? 'bg-slate-700 text-white ring-4 ring-slate-600/30'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700'
            }`}
          >
            <span>EM BRANCO</span>
            <span className="text-[10px] font-sans font-normal text-slate-400">
              0.0 pt (Sem risco)
            </span>
          </button>
        </div>

        {/* FEEDBACK VISUAL IMEDIATO + EXPLICAÇÃO + REGRA DE OURO */}
        {jaRespondida && (
          <div className="mt-6 pt-5 border-t border-slate-800 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* Card de Resultado da Questão */}
            <div
              className={`p-4 rounded-xl border flex items-center justify-between ${
                marcacaoAtual.resposta === 'B'
                  ? 'bg-slate-800/50 border-slate-700 text-slate-300'
                  : marcacaoAtual.acertou
                  ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-200'
                  : 'bg-rose-950/60 border-rose-700/60 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-3">
                {marcacaoAtual.resposta === 'B' ? (
                  <MinusCircle className="w-6 h-6 text-slate-400" />
                ) : marcacaoAtual.acertou ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-400" />
                )}
                <div>
                  <div className="font-bold text-sm sm:text-base">
                    {marcacaoAtual.resposta === 'B'
                      ? 'Deixada em Branco'
                      : marcacaoAtual.acertou
                      ? 'Parabéns, você acertou!'
                      : 'Você errou (Penalidade aplicada)'}
                  </div>
                  <div className="text-xs opacity-80">
                    Gabarito Oficial Cebraspe: <strong className="text-white">{questaoAtual.gabarito}</strong>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-lg font-mono font-black">
                  {marcacaoAtual.pontos > 0
                    ? `+${marcacaoAtual.pontos.toFixed(1)}`
                    : `${marcacaoAtual.pontos.toFixed(1)}`}{' '}
                  pts
                </span>
                <div className="text-[10px] uppercase tracking-wider font-semibold opacity-75">
                  Líquido
                </div>
              </div>
            </div>

            {/* DESTAQUE CIRÚRGICO: REGRA DE OURO */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-transparent border border-amber-600/40">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 mb-1 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Regra de Ouro (Caderno de Erros)</span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-amber-100/90 leading-relaxed">
                {questaoAtual.regra_ouro}
              </p>
            </div>

            {/* COMENTÁRIO COMPLETO */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed space-y-1.5">
              <span className="font-bold text-slate-200 block">Explicação Detalhada:</span>
              <p>{questaoAtual.comentario}</p>
            </div>
          </div>
        )}

        {/* NAVEGAÇÃO ANTERIOR / PRÓXIMO */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-800">
          <button
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Anterior</span>
          </button>

          <button
            onClick={() =>
              setCurrentIndex((prev) => Math.min(questoes.length - 1, prev + 1))
            }
            disabled={currentIndex === questoes.length - 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20 transition-all"
          >
            <span>Próximo</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CARD DE CONCLUSÃO DA BATERIA PADRÃO & OPÇÃO DE EXPANDIR PARA 50 */}
      {(respondidasCount >= totalQuestoes || (currentIndex === totalQuestoes - 1 && jaRespondida)) && totalQuestoes < 50 && (
        <div className="bg-gradient-to-r from-emerald-950/70 via-indigo-950/50 to-slate-900 border-2 border-emerald-500/40 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="flex items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 text-2xl shrink-0">
                🎉
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Etapa Concluída ({respondidasCount}/{totalQuestoes} itens)
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Saldo: <strong className={saldoLiquido >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{saldoLiquido > 0 ? `+${saldoLiquido.toFixed(1)}` : saldoLiquido.toFixed(1)} pts</strong>
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                  Parabéns! Você completou a Prova Padrão ({totalQuestoes} questões)!
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Sua rota base de hoje está garantida. Que tal aproveitar o embalo e completar a meta máxima de <strong>50 perguntas do dia</strong>?
                </p>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Ao expandir: +{50 - totalQuestoes} novas questões selecionadas sem duplicatas.</span>
            </div>
            <span className="text-blue-400 font-semibold font-mono">5 P1 + 5 P2 + 15 P3 extras</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
            <button
              onClick={handleExpandirPara50}
              disabled={expandindo}
              className="w-full sm:w-auto flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{expandindo ? 'Sorteando e Adicionando Questões...' : '🚀 Completar Perguntas do Dia (Aumentar para 50)'}</span>
            </button>

            <Link
              href="/caderno"
              className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs text-center border border-slate-700 transition-colors"
            >
              Revisar Caderno de Erros
            </Link>
          </div>
        </div>
      )}

      {/* MODAL / BOTTOM SHEET DE BATERIA EXTRA */}
      {showExtraModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Modo Extra & Opções de Bateria
              </h3>
              <button
                onClick={() => setShowExtraModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
              >
                ✕ Fechar
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Alterne o tamanho da sua prova, puxe mais questões para overdelivery ou expanda o treino ativo.
            </p>

            <div className="space-y-2 pt-2">
              {totalQuestoes < 50 && (
                <button
                  onClick={handleExpandirPara50}
                  disabled={expandindo}
                  className="w-full text-left p-3.5 rounded-xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 hover:from-blue-900/60 hover:to-purple-900/60 border border-blue-500/50 flex items-center justify-between transition-all"
                >
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      🚀 Expandir Bateria Atual para 50 Itens
                    </div>
                    <div className="text-[11px] text-blue-200/80">
                      Adiciona +{50 - totalQuestoes} novas questões mantendo suas respostas atuais!
                    </div>
                  </div>
                  <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                </button>
              )}

              <button
                onClick={() => handleGerarNovaBateria(5, 5, 15)}
                className="w-full text-left p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-semibold text-white">
                    🎯 Prova Padrão (25 Itens)
                  </div>
                  <div className="text-[11px] text-slate-400">
                    5 P1 + 5 P2 + 15 P3 (Proporção oficial curta, anti-procrastinação)
                  </div>
                </div>
                <RotateCcw className="w-4 h-4 text-blue-400" />
              </button>

              <button
                onClick={() => handleGerarNovaBateria(10, 10, 30)}
                className="w-full text-left p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-semibold text-white">
                    🔥 Prova Completa do Dia (50 Itens)
                  </div>
                  <div className="text-[11px] text-slate-400">
                    10 P1 + 10 P2 + 30 P3 (Meta diária máxima)
                  </div>
                </div>
                <Zap className="w-4 h-4 text-amber-400" />
              </button>

              <button
                onClick={() => handleGerarNovaBateria(3, 3, 9)}
                className="w-full text-left p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-semibold text-white">
                    ⚡ Tiro Rápido (15 Itens)
                  </div>
                  <div className="text-[11px] text-slate-400">
                    3 P1 + 3 P2 + 9 P3 (15 minutos para dias corridos)
                  </div>
                </div>
                <RotateCcw className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => handleGerarNovaBateria(0, 0, 25)}
                className="w-full text-left p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-semibold text-emerald-300">
                    🔬 Foco Total P3: Ciência de Dados (25 Itens)
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Apenas P3 com peso 2.0 (Machine Learning, Spark, SQL, NLP)
                  </div>
                </div>
                <Award className="w-4 h-4 text-emerald-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE HISTÓRICO / CALENDÁRIO DE PROVAS */}
      <HistoricoCalendarioModal
        isOpen={showHistoricoModal}
        onClose={() => setShowHistoricoModal(false)}
        onBateriaCarregada={handleCarregarBateriaPorId}
      />
    </div>
  );
}
