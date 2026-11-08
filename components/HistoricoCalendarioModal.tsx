'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Printer,
  X,
  Sparkles,
  ArrowRight,
  PlusCircle,
  Layers,
} from 'lucide-react';
import { HistoricoBateriaItem } from '@/lib/types';
import {
  getHistoricoBaterias,
  carregarBateriaPorId,
  gerarBateriaDiaria,
  getTemaEDisciplinasDoDia,
} from '@/lib/supabase';

interface HistoricoCalendarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBateriaCarregada: (bateriaId: string) => void;
}

export default function HistoricoCalendarioModal({
  isOpen,
  onClose,
  onBateriaCarregada,
}: HistoricoCalendarioModalProps) {
  const [historico, setHistorico] = useState<HistoricoBateriaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [carregandoId, setCarregandoId] = useState<string | null>(null);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const lista = await getHistoricoBaterias();
      setHistorico(lista);
    } catch (err) {
      console.error('Erro ao carregar histórico de baterias:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      carregarDados();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelecionarBateria = async (bateriaId: string) => {
    setCarregandoId(bateriaId);
    try {
      const res = await carregarBateriaPorId(bateriaId);
      if (res) {
        onBateriaCarregada(bateriaId);
        onClose();
      }
    } catch (err) {
      console.error('Erro ao carregar bateria:', err);
    } finally {
      setCarregandoId(null);
    }
  };

  const handleGerarNovaBateria = async (diaSemana?: number) => {
    setCarregandoId('nova');
    try {
      const res = await gerarBateriaDiaria(10, 10, 30, diaSemana);
      if (res) {
        onBateriaCarregada(res.bateria.id);
        onClose();
      }
    } catch (err) {
      console.error('Erro ao gerar nova bateria:', err);
    } finally {
      setCarregandoId(null);
    }
  };

  const hojeStr = new Date().toISOString().split('T')[0];
  const cronogramaHoje = getTemaEDisciplinasDoDia(new Date().getDay());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* HEADER MODAL */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Histórico & Calendário de Provas
              </h2>
              <p className="text-xs text-slate-400">
                Acesse provas geradas em dias anteriores, retome baterias incompletas ou revise seu gabarito.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BANNER DO DIA ATUAL */}
        <div className="p-5 pb-3">
          <div className="bg-gradient-to-r from-blue-950/60 to-indigo-950/40 border border-blue-800/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {cronogramaHoje.diaNome} (Hoje)
                </span>
                <span className="text-xs font-semibold text-slate-300">
                  {cronogramaHoje.focoTema}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {cronogramaHoje.temDiscursiva
                  ? '🎯 Domingo é dia de Simulado Oficial Completo e Estudo de Caso Discursivo!'
                  : 'Bateria personalizada com priorização pedagógica nas disciplinas da grade semanal.'}
              </p>
            </div>

            <button
              onClick={() => handleGerarNovaBateria()}
              disabled={carregandoId !== null}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/20 shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              Gerar Nova Prova Hoje
            </button>
          </div>
        </div>

        {/* LISTAGEM DE PROVAS GERADAS */}
        <div className="flex-1 overflow-y-auto px-5 py-2 space-y-3">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-3">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-mono">Buscando histórico no Supabase...</p>
            </div>
          ) : historico.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Layers className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-sm font-medium">Nenhuma prova encontrada no histórico.</p>
              <p className="text-xs text-slate-500">
                Gere uma nova bateria para começar o seu treinamento diário.
              </p>
            </div>
          ) : (
            historico.map((bat) => {
              const eHoje = bat.data_geracao === hojeStr;
              const emAndamento = bat.respondidas_count > 0 && bat.respondidas_count < bat.total_questoes;
              const pendente = bat.respondidas_count === 0;
              const percentual = bat.total_questoes > 0 ? (bat.respondidas_count / bat.total_questoes) * 100 : 0;

              return (
                <div
                  key={bat.id}
                  className={`bg-slate-950/80 border rounded-2xl p-4 transition-all ${
                    eHoje
                      ? 'border-blue-500/50 shadow-lg shadow-blue-500/5'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">
                          {bat.data_geracao.split('-').reverse().join('/')}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">
                          • {bat.dia_semana_nome}
                        </span>
                        {eHoje && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                            Hoje
                          </span>
                        )}
                        {bat.concluida ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-900/40 text-emerald-400 border border-emerald-800/40 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Concluída
                          </span>
                        ) : emAndamento ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-400 border border-amber-800/40 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Em Andamento
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                            Pendente
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400">{bat.foco_tema}</p>

                      {/* BARRA DE PROGRESSO & PONTUAÇÃO */}
                      <div className="flex items-center gap-3 pt-1.5 text-xs text-slate-300">
                        <div className="w-32 bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              bat.concluida ? 'bg-emerald-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${percentual}%` }}
                          />
                        </div>
                        <span className="font-mono text-slate-400 text-[11px]">
                          {bat.respondidas_count}/{bat.total_questoes} respondidas
                        </span>
                        {bat.respondidas_count > 0 && (
                          <span
                            className={`font-mono font-bold text-xs ${
                              bat.pontos_liquidos >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {bat.pontos_liquidos >= 0 ? `+${bat.pontos_liquidos}` : bat.pontos_liquidos} pts líq.
                          </span>
                        )}
                      </div>
                    </div>

                    {/* BOTÕES DE AÇÃO */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => handleSelecionarBateria(bat.id)}
                        disabled={carregandoId !== null}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          bat.concluida
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5" />
                        {carregandoId === bat.id
                          ? 'Carregando...'
                          : bat.concluida
                          ? 'Revisar Prova'
                          : pendente
                          ? 'Iniciar Prova'
                          : 'Continuar Respondendo'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>
            {historico.length} {historico.length === 1 ? 'prova registrada' : 'provas registradas'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
