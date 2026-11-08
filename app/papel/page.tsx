'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
  Questao,
  BateriaDiaria,
  RespostaType,
  ConfiancaType,
  BoletimResultado,
} from '@/lib/types';
import {
  getBateriaAtivaOuCriar,
  salvarResposta,
} from '@/lib/supabase';
import {
  parseGabaritoString,
  gerarBoletim,
  calcularPontosCebraspe,
} from '@/lib/simulator';
import {
  Printer,
  FileText,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Check,
  Send,
  Grid3X3,
  ListOrdered,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ModoPapelPage() {
  const [, startTransition] = useTransition();

  const [bateria, setBateria] = useState<BateriaDiaria | null>(null);
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Aba ativa: 'impressao' | 'string' | 'grade'
  const [activeTab, setActiveTab] = useState<'impressao' | 'string' | 'grade'>('impressao');

  // Modo String Rápida
  const [inputString, setInputString] = useState<string>('');

  // Modo Grade Digital (mapa ordem 1..N => { resposta, confianca })
  const [gradeRespostas, setGradeRespostas] = useState<
    Map<number, { resposta: RespostaType; confianca: ConfiancaType }>
  >(new Map());

  // Resultado do Boletim do Dia após submissão
  const [boletim, setBoletim] = useState<BoletimResultado | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      try {
        const dados = await getBateriaAtivaOuCriar();
        setBateria(dados.bateria);
        setQuestoes(dados.questoes);

        // Inicializa a grade com brancos
        const mapaInicial = new Map<number, { resposta: RespostaType; confianca: ConfiancaType }>();
        dados.questoes.forEach((_, idx) => {
          mapaInicial.set(idx + 1, { resposta: 'B', confianca: 'Certeza' });
        });
        setGradeRespostas(mapaInicial);
      } catch (err) {
        console.error('Erro ao carregar folha:', err);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, []);

  // Submissão do Modo String Rápida
  const handleProcessarString = async () => {
    if (!inputString.trim()) return;
    setSubmitting(true);

    const { respostas } = parseGabaritoString(inputString, questoes);
    const resultado = gerarBoletim(questoes, respostas);
    setBoletim(resultado);

    // Salva em batch assíncrono no Supabase / Local
    for (let i = 0; i < questoes.length; i++) {
      const q = questoes[i];
      const num = i + 1;
      const marcacao = respostas.get(num) || { resposta: 'B', confianca: 'Certeza' };
      const { acertou, pontos } = calcularPontosCebraspe(q.bloco, q.gabarito, marcacao.resposta);

      await salvarResposta({
        bateria_id: bateria?.id,
        questao_id: q.id,
        resposta_usuario: marcacao.resposta,
        confianca: marcacao.confianca,
        acertou,
        pontos_liquidos: pontos,
      });
    }

    if (resultado.pontosLiquidosTotal > 0) {
      try {
        confetti({ particleCount: 50, spread: 70, origin: { y: 0.7 } });
      } catch {}
    }
    setSubmitting(false);
  };

  // Submissão do Modo Grade Digital
  const handleProcessarGrade = async () => {
    setSubmitting(true);
    const resultado = gerarBoletim(questoes, gradeRespostas);
    setBoletim(resultado);

    for (let i = 0; i < questoes.length; i++) {
      const q = questoes[i];
      const num = i + 1;
      const marcacao = gradeRespostas.get(num) || { resposta: 'B', confianca: 'Certeza' };
      const { acertou, pontos } = calcularPontosCebraspe(q.bloco, q.gabarito, marcacao.resposta);

      await salvarResposta({
        bateria_id: bateria?.id,
        questao_id: q.id,
        resposta_usuario: marcacao.resposta,
        confianca: marcacao.confianca,
        acertou,
        pontos_liquidos: pontos,
      });
    }

    if (resultado.pontosLiquidosTotal > 0) {
      try {
        confetti({ particleCount: 50, spread: 70, origin: { y: 0.7 } });
      } catch {}
    }
    setSubmitting(false);
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400 font-mono">Preparando Folha de Prova...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* NAVEGAÇÃO ENTRE ABAS DO MODO PAPEL (Oculta na impressão) */}
      <div className="no-print bg-slate-900 border border-slate-800 rounded-2xl p-2 flex flex-wrap gap-2 shadow-xl">
        <button
          onClick={() => setActiveTab('impressao')}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'impressao'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Printer className="w-4 h-4" />
          <span>Folha de Prova</span>
        </button>

        <button
          onClick={() => setActiveTab('string')}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'string'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <ListOrdered className="w-4 h-4" />
          <span>String Rápida</span>
        </button>

        <button
          onClick={() => setActiveTab('grade')}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'grade'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Grid3X3 className="w-4 h-4" />
          <span>Grade Cartão-Resposta</span>
        </button>
      </div>

      {/* ================================================================ */}
      {/* ABA 1: FOLHA DE PROVA PARA IMPRESSÃO / PDF (2 Colunas Cebraspe) */}
      {/* ================================================================ */}
      {activeTab === 'impressao' && (
        <div className="space-y-4">
          {/* BARRA DE AÇÕES NA TELA (Oculta na impressão) */}
          <div className="no-print bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Caderno de Prova Cebraspe (Simulado Real)
              </h2>
              <p className="text-xs text-slate-400">
                Formatado em duas colunas com tipografia de concurso oficial. Imprima ou salve em PDF pelo navegador.
              </p>
            </div>

            <button
              onClick={handlePrint}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/20 transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Gerar PDF</span>
            </button>
          </div>

          {/* ÁREA DA FOLHA DE PROVA (Renderizada na tela e na impressão) */}
          <div className="print-container bg-white text-black p-6 sm:p-10 rounded-2xl shadow-2xl font-serif">
            {/* CABEÇALHO OFICIAL DE PROVA */}
            <div className="print-header text-center pb-4 mb-5 border-b-2 border-black">
              <div className="text-[12px] uppercase font-bold tracking-widest text-gray-800">
                MINISTÉRIO DA TRANSPARÊNCIA E CONTROLADORIA-GERAL DA UNIÃO (CGU)
              </div>
              <div className="text-[14px] font-black uppercase text-black tracking-wider mt-1">
                CONCURSO PÚBLICO 2026 • CEBRASPE
              </div>
              <div className="text-[11px] font-semibold text-gray-700 mt-0.5">
                CARGO: AUDITOR FEDERAL DE FINANÇAS E CONTROLE • ESPECIALIDADE: CIÊNCIA DE DADOS
              </div>
              <div className="text-[10px] italic text-gray-600 mt-2 bg-gray-100 p-2 rounded border border-gray-300 text-justify">
                <strong>INSTRUÇÕES:</strong> Julgue os itens a seguir de acordo com os critérios Cebraspe.
                Para cada item, marque <strong>( C )</strong> se Certo, <strong>( E )</strong> se Errado ou <strong>( B )</strong> se Em Branco.
                Se tiver dúvida, marque também a caixa <strong>[ ? ]</strong> para remessa ao Caderno de Erros.
                P1/P2: Acerto = +1.0 pt, Erro = -1.0 pt. P3: Acerto = +2.0 pts, Erro = -2.0 pts.
              </div>
            </div>

            {/* ITENS EM DUAS COLUNAS */}
            <div className="print-two-columns">
              {questoes.map((q, idx) => {
                const num = idx + 1;
                return (
                  <div key={q.id} className="print-item text-[12px] sm:text-[13px] leading-relaxed mb-4 pb-2 border-b border-gray-200">
                    <div className="font-sans text-[10px] font-bold text-gray-600 uppercase mb-1">
                      ITEM {num} • [{q.bloco} - {q.disciplina}]
                    </div>
                    <p className="text-justify font-serif text-gray-900 leading-snug">
                      {q.enunciado}
                    </p>
                    <div className="print-bubbles flex items-center justify-between mt-2 pt-1 font-mono text-[11px] text-gray-700">
                      <div className="flex items-center gap-3">
                        <span className="border border-black px-1.5 py-0.5 rounded font-bold">( C )</span>
                        <span className="border border-black px-1.5 py-0.5 rounded font-bold">( E )</span>
                        <span className="border border-gray-400 px-1.5 py-0.5 rounded text-gray-500">( B )</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-500">
                        <span className="border border-gray-400 px-1 rounded">[ ? ] Dúvida</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* ABA 2: MODO STRING RÁPIDA (1C 2E 3B 4C? 5E? ...)                 */}
      {/* ================================================================ */}
      {activeTab === 'string' && (
        <div className="no-print space-y-5 max-w-3xl mx-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <ListOrdered className="w-5 h-5 text-blue-400" />
                Leitor Rápido por String Contínua
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Ideal após resolver a prova física: digite ou cole suas respostas em uma única linha.
                Use a interrogação <code className="text-amber-400 font-mono">?</code> para indicar dúvida (ex: <code className="text-blue-300 font-mono">1C 2E 3B 4C? 5E?</code>).
              </p>
            </div>

            {/* Atalhos Rápidos para Teste */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">Exemplo de Teste:</span>
              <button
                type="button"
                onClick={() =>
                  setInputString(
                    '1E 2C 3E 4E 5E 6C 7C 8E 9E 10E 11C 12C 13E 14E 15E'
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 font-mono border border-slate-700"
              >
                Gabaritar as 15 (100% Acertos)
              </button>
              <button
                type="button"
                onClick={() =>
                  setInputString(
                    '1C? 2C 3E 4C 5E 6E? 7C 8C 9E 10C 11C 12E? 13E 14C 15C?'
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono border border-slate-700"
              >
                Misto com Dúvidas & Erros
              </button>
            </div>

            <textarea
              rows={5}
              value={inputString}
              onChange={(e) => setInputString(e.target.value)}
              placeholder="Ex: 1C 2E 3B 4C? 5E? 6B 7C ... ou cole tudo aqui"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-100 font-mono placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setInputString('')}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Limpar Campo
              </button>

              <button
                onClick={handleProcessarString}
                disabled={submitting || !inputString.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Corrigindo...' : 'Corrigir e Gerar Boletim'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* ABA 3: MODO GRADE CARTÃO-RESPOSTA DIGITAL                        */}
      {/* ================================================================ */}
      {activeTab === 'grade' && (
        <div className="no-print space-y-5 max-w-4xl mx-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Grid3X3 className="w-5 h-5 text-blue-400" />
                  Cartão-Resposta Digital Cebraspe
                </h2>
                <p className="text-xs text-slate-400">
                  Toque rapidamente para marcar no celular: C (Certo), E (Errado), B (Branco) e ? (Dúvida).
                </p>
              </div>

              <button
                onClick={handleProcessarGrade}
                disabled={submitting}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Finalizar e Corrigir Dia</span>
              </button>
            </div>

            {/* GRADE INTERATIVA 1..N */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2">
              {questoes.map((q, idx) => {
                const num = idx + 1;
                const atual = gradeRespostas.get(num) || { resposta: 'B', confianca: 'Certeza' };

                const setItemResp = (r: RespostaType) => {
                  const novo = new Map(gradeRespostas);
                  novo.set(num, { ...atual, resposta: r });
                  setGradeRespostas(novo);
                };

                const toggleDuvida = () => {
                  const novo = new Map(gradeRespostas);
                  const novaConf = atual.confianca === 'Duvida' ? 'Certeza' : 'Duvida';
                  novo.set(num, { ...atual, confianca: novaConf });
                  setGradeRespostas(novo);
                };

                return (
                  <div
                    key={q.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs w-6 text-slate-400">
                        #{num}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          q.bloco === 'P3'
                            ? 'bg-amber-950/60 text-amber-300'
                            : 'bg-blue-950/60 text-blue-300'
                        }`}
                      >
                        {q.bloco}
                      </span>
                    </div>

                    {/* BOTÕES C, E, B */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setItemResp('C')}
                        className={`w-7 h-7 rounded-lg font-bold text-xs transition-all ${
                          atual.resposta === 'C'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-800 text-emerald-400 hover:bg-slate-700'
                        }`}
                      >
                        C
                      </button>
                      <button
                        onClick={() => setItemResp('E')}
                        className={`w-7 h-7 rounded-lg font-bold text-xs transition-all ${
                          atual.resposta === 'E'
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'bg-slate-800 text-rose-400 hover:bg-slate-700'
                        }`}
                      >
                        E
                      </button>
                      <button
                        onClick={() => setItemResp('B')}
                        className={`w-7 h-7 rounded-lg font-bold text-xs transition-all ${
                          atual.resposta === 'B'
                            ? 'bg-slate-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        B
                      </button>

                      {/* TOGGLE DÚVIDA */}
                      <button
                        onClick={toggleDuvida}
                        title="Marcar Dúvida"
                        className={`w-7 h-7 rounded-lg font-bold text-xs transition-all flex items-center justify-center ${
                          atual.confianca === 'Duvida'
                            ? 'bg-amber-500 text-black shadow-sm'
                            : 'bg-slate-800 text-amber-400/60 hover:text-amber-300'
                        }`}
                      >
                        ?
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* BOLETIM DO DIA (EXIBIDO APÓS CORREÇÃO EM LOTE)                     */}
      {/* ================================================================ */}
      {boletim && (
        <div className="no-print space-y-6 max-w-4xl mx-auto pt-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
          {/* CARD PRINCIPAL DO BOLETIM */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  Boletim Cebraspe Finalizado
                </span>
                <h3 className="text-2xl font-black text-white mt-0.5">
                  Desempenho da Bateria
                </h3>
              </div>

              <div className="flex items-baseline gap-2 bg-slate-950/80 px-4 py-2.5 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400">Saldo Líquido:</span>
                <span
                  className={`text-2xl font-mono font-black ${
                    boletim.pontosLiquidosTotal > 0
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}
                >
                  {boletim.pontosLiquidosTotal > 0
                    ? `+${boletim.pontosLiquidosTotal.toFixed(1)}`
                    : `${boletim.pontosLiquidosTotal.toFixed(1)}`}{' '}
                  pts
                </span>
              </div>
            </div>

            {/* MÉTRICAS POR BLOCO */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 my-6">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-xs text-slate-400 font-medium">Bloco P1 (Básicos)</div>
                <div className="text-lg font-mono font-bold text-white mt-1">
                  {boletim.pontosP1 > 0 ? `+${boletim.pontosP1.toFixed(1)}` : `${boletim.pontosP1.toFixed(1)}`} pts
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-xs text-slate-400 font-medium">Bloco P2 (Compl.)</div>
                <div className="text-lg font-mono font-bold text-white mt-1">
                  {boletim.pontosP2 > 0 ? `+${boletim.pontosP2.toFixed(1)}` : `${boletim.pontosP2.toFixed(1)}`} pts
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-xs text-amber-400 font-medium">Bloco P3 (C. Dados)</div>
                <div className="text-lg font-mono font-bold text-amber-300 mt-1">
                  {boletim.pontosP3 > 0 ? `+${boletim.pontosP3.toFixed(1)}` : `${boletim.pontosP3.toFixed(1)}`} pts
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-xs text-slate-400 font-medium">Taxa Líquida</div>
                <div className="text-lg font-mono font-bold text-blue-400 mt-1">
                  {boletim.taxaLiquida.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* CONTADORES GERAIS */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                {boletim.acertos} Acertos
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                {boletim.erros} Erros (Penalizados)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                {boletim.brancos} Em Branco
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                {boletim.duvidas} Marcadas com Dúvida
              </span>
            </div>
          </div>

          {/* LISTA DE ITENS PARA REVISÃO CIRÚRGICA (ERROS, BRANCOS E DÚVIDAS) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Gatilho Automático: Itens para Revisão ({boletim.itensParaRevisao.length})
              </h4>
              <span className="text-xs text-slate-400">
                Caderno de Erros abastecido
              </span>
            </div>

            {boletim.itensParaRevisao.length === 0 ? (
              <div className="p-6 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 text-center text-emerald-300 text-sm font-medium">
                Incrível! Você acertou todas as questões com 100% de certeza! Zero itens para revisão.
              </div>
            ) : (
              boletim.itensParaRevisao.map((item, idx) => (
                <div
                  key={item.questao.id}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono font-bold text-slate-400">
                        Item #{idx + 1}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 font-semibold">
                        {item.questao.bloco} • {item.questao.disciplina}
                      </span>
                      {item.confianca === 'Duvida' && (
                        <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-semibold border border-amber-800/60">
                          Marcou Dúvida
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-mono">
                      Marcou:{' '}
                      <strong className="text-white">
                        {item.resposta === 'B' ? 'Branco' : item.resposta}
                      </strong>{' '}
                      | Gabarito:{' '}
                      <strong className="text-emerald-400">{item.questao.gabarito}</strong>
                    </div>
                  </div>

                  <p className="text-sm font-serif text-slate-200 leading-relaxed">
                    {item.questao.enunciado}
                  </p>

                  {/* REGRA DE OURO */}
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-600/40 text-xs font-medium text-amber-200 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-amber-300">Regra de Ouro:</strong>{' '}
                      {item.questao.regra_ouro}
                    </div>
                  </div>

                  {/* EXPLICAÇÃO COMPLETA */}
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
                    <strong className="text-slate-100 block mb-1">Explicação:</strong>
                    {item.questao.comentario}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
