'use client';

import React, { useState, useEffect, useTransition } from 'react';
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
  salvarResposta,
  getHistoricoRespostas,
} from '@/lib/supabase';
import { calcularPontosCebraspe } from '@/lib/simulator';
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
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function TreinoPage() {
  const [, startTransition] = useTransition();

  const [bateria, setBateria] = useState<BateriaDiaria | null>(null);
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

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
    startTransition(() => {
      salvarResposta({
        bateria_id: bateria?.id,
        questao_id: questaoAtual.id,
        resposta_usuario: resposta,
        confianca,
        acertou,
        pontos_liquidos: pontos,
      });
    });
  };

  // Gerar nova bateria diária padrão (50 itens: 10 P1, 10 P2, 30 P3)
  const handleGerarNovaBateria = async (p1 = 10, p2 = 10, p3 = 30) => {
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
          onClick={() => handleGerarNovaBateria(10, 10, 30)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium shadow-lg"
        >
          Gerar Bateria Padrão de 50
        </button>
      </div>
    );
  }

  const pesoInfo = BLOCO_PESOS[questaoAtual.bloco];

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
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

          {/* Saldo Líquido Cebraspe em tempo real */}
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

      {/* MODAL / BOTTOM SHEET DE BATERIA EXTRA */}
      {showExtraModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Modo Extra & Baterias
              </h3>
              <button
                onClick={() => setShowExtraModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
              >
                ✕ Fechar
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Puxe novas questões sob demanda para overdelivery diário ou foque em blocos específicos.
            </p>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => handleGerarNovaBateria(10, 10, 30)}
                className="w-full text-left p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-semibold text-white">
                    🎯 Bateria Diária Padrão (50 Itens)
                  </div>
                  <div className="text-[11px] text-slate-400">
                    10 de P1 + 10 de P2 + 30 de P3 (Ciência de Dados)
                  </div>
                </div>
                <RotateCcw className="w-4 h-4 text-blue-400" />
              </button>

              <button
                onClick={() => handleGerarNovaBateria(5, 5, 10)}
                className="w-full text-left p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-semibold text-white">
                    ⚡ Bateria Rápida (+20 Itens)
                  </div>
                  <div className="text-[11px] text-slate-400">
                    5 P1 + 5 P2 + 10 P3 (Para tiros curtos)
                  </div>
                </div>
                <Zap className="w-4 h-4 text-amber-400" />
              </button>

              <button
                onClick={() => handleGerarNovaBateria(0, 0, 30)}
                className="w-full text-left p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-semibold text-emerald-300">
                    🔬 Foco Total P3: Ciência de Dados (30 Itens)
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
    </div>
  );
}
