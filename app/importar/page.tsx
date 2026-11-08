'use client';

import React, { useState, useEffect } from 'react';
import { Questao } from '@/lib/types';
import {
  getQuestoes,
  bulkInsertQuestoes,
  isSupabaseConfigured,
} from '@/lib/supabase';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Database,
  FileCode,
  Copy,
  Sparkles,
  Layers,
} from 'lucide-react';
import confetti from 'canvas-confetti';

const EXEMPLO_JSON = `[
  {
    "bloco": "P3",
    "disciplina": "Machine Learning e Modelagem Preditiva",
    "topico_edital": "Gradiente Descendente e Otimização",
    "enunciado": "No treinamento de redes neurais profundas, o otimizador Adam combina as vantagens dos algoritmos AdaGrad e RMSProp ao computar taxas de aprendizado adaptativas para cada parâmetro a partir de estimativas de primeiros e segundos momentos dos gradientes.",
    "gabarito": "C",
    "comentario": "Correto. Adam (Adaptive Moment Estimation) armazena uma média móvel exponencial dos gradientes passados (primeiro momento / momentum) e dos quadrados dos gradientes (segundo momento / escala não centrada da variância), adaptando o learning rate por peso.",
    "regra_ouro": "Adam combina momentum (1º momento) com RMSProp (2º momento) para ajuste adaptativo individual da taxa de aprendizado.",
    "nivel": "Difícil"
  },
  {
    "bloco": "P2",
    "disciplina": "Auditoria Governamental",
    "topico_edital": "Papéis de Trabalho e Evidências em Auditoria",
    "enunciado": "A suficiência e a adequação são características que se confundem no contexto da evidência de auditoria: a suficiência refere-se à relevância e confiabilidade das evidências colhidas, ao passo que a adequação mensura a quantidade de evidências necessárias para fundamentar a opinião do auditor.",
    "gabarito": "E",
    "comentario": "Inversão de conceitos segundo as normas internacionais de auditoria (ISSAI / NBC TA 500). Suficiência é a medida da QUANTIDADE da evidência; Adequação é a medida da QUALIDADE da evidência (sua relevância e confiabilidade).",
    "regra_ouro": "Suficiência = QUANTIDADE de evidência. Adequação = QUALIDADE e relevância da evidência.",
    "nivel": "Difícil"
  }
]`;

export default function ImportarPage() {
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [jsonInput, setJsonInput] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState<{
    tipo: 'success' | 'error' | 'info';
    texto: string;
  } | null>(null);
  const [importing, setImporting] = useState<boolean>(false);
  const [hasSupabase, setHasSupabase] = useState<boolean>(false);

  useEffect(() => {
    carregar();
    setHasSupabase(isSupabaseConfigured());
  }, []);

  async function carregar() {
    try {
      const q = await getQuestoes();
      setQuestoes(q);
    } catch (err) {
      console.error(err);
    }
  }

  const handleImportar = async () => {
    setStatusMsg(null);
    if (!jsonInput.trim()) {
      setStatusMsg({ tipo: 'error', texto: 'Cole o array JSON antes de importar.' });
      return;
    }

    let parsed: any;
    try {
      parsed = JSON.parse(jsonInput);
    } catch {
      setStatusMsg({
        tipo: 'error',
        texto: 'JSON inválido. Certifique-se de que a sintaxe (aspas, vírgulas e colchetes) está correta.',
      });
      return;
    }

    if (!Array.isArray(parsed)) {
      setStatusMsg({
        tipo: 'error',
        texto: 'O JSON deve ser um array de objetos [ { ... }, { ... } ].',
      });
      return;
    }

    // Validação mínima de campos
    for (let i = 0; i < parsed.length; i++) {
      const item = parsed[i];
      if (
        !item.bloco ||
        !['P1', 'P2', 'P3'].includes(item.bloco) ||
        !item.disciplina ||
        !item.enunciado ||
        !item.gabarito ||
        !['C', 'E'].includes(item.gabarito.toUpperCase()) ||
        !item.comentario ||
        !item.regra_ouro
      ) {
        setStatusMsg({
          tipo: 'error',
          texto: `Item #${i + 1} inválido. Verifique se contém bloco (P1/P2/P3), disciplina, topico_edital, enunciado, gabarito (C/E), comentario e regra_ouro.`,
        });
        return;
      }
    }

    setImporting(true);
    try {
      const formatadas = parsed.map((item) => ({
        bloco: item.bloco as 'P1' | 'P2' | 'P3',
        disciplina: String(item.disciplina).trim(),
        topico_edital: String(item.topico_edital || 'Geral').trim(),
        enunciado: String(item.enunciado).trim(),
        gabarito: item.gabarito.toUpperCase() as 'C' | 'E',
        comentario: String(item.comentario).trim(),
        regra_ouro: String(item.regra_ouro).trim(),
        nivel: item.nivel || 'Difícil',
      }));

      const res = await bulkInsertQuestoes(formatadas);

      if (res.error) {
        setStatusMsg({
          tipo: 'error',
          texto: `Erro ao inserir no Supabase: ${res.error}`,
        });
      } else {
        setStatusMsg({
          tipo: 'success',
          texto: `Sucesso! ${res.count} questões inseridas no banco de dados.`,
        });
        setJsonInput('');
        await carregar();
        try {
          confetti({ particleCount: 45, spread: 60 });
        } catch {}
      }
    } catch (err: any) {
      setStatusMsg({
        tipo: 'error',
        texto: `Erro inesperado: ${err?.message || err}`,
      });
    } finally {
      setImporting(false);
    }
  };

  const totalP1 = questoes.filter((q) => q.bloco === 'P1').length;
  const totalP2 = questoes.filter((q) => q.bloco === 'P2').length;
  const totalP3 = questoes.filter((q) => q.bloco === 'P3').length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <UploadCloud className="w-6 h-6 text-blue-400" />
            Abastecimento em Lote de Questões
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cole novos lotes JSON gerados para alimentar a tabela <code className="text-blue-300 font-mono">questoes</code> com 1 clique.
          </p>
        </div>

        <div
          className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl border ${
            hasSupabase
              ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
              : 'bg-amber-950/40 border-amber-800/50 text-amber-300'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>{hasSupabase ? 'Destino: Supabase Cloud' : 'Destino: Armazenamento Local'}</span>
        </div>
      </div>

      {/* ESTADO ATUAL DO BANCO */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Total de Questões</div>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {questoes.length}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-blue-400 font-medium">Bloco P1 (Básicos)</div>
          <div className="text-xl font-bold font-mono text-blue-300 mt-1">
            {totalP1}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-indigo-400 font-medium">Bloco P2 (Compl.)</div>
          <div className="text-xl font-bold font-mono text-indigo-300 mt-1">
            {totalP2}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-amber-400 font-medium">Bloco P3 (C. Dados)</div>
          <div className="text-xl font-bold font-mono text-amber-300 mt-1">
            {totalP3}
          </div>
        </div>
      </div>

      {/* FORMULÁRIO DE IMPORTAÇÃO */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
            <FileCode className="w-4 h-4 text-blue-400" />
            Cole o Array JSON de Questões:
          </label>

          <button
            onClick={() => setJsonInput(EXEMPLO_JSON)}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Preencher Exemplo de Teste</span>
          </button>
        </div>

        <textarea
          rows={10}
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder={`[\n  {\n    "bloco": "P3",\n    "disciplina": "Machine Learning",\n    "topico_edital": "Regularização",\n    "enunciado": "...",\n    "gabarito": "C",\n    "comentario": "...",\n    "regra_ouro": "...",\n    "nivel": "Difícil"\n  }\n]`}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {statusMsg && (
          <div
            className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2.5 ${
              statusMsg.tipo === 'success'
                ? 'bg-emerald-950/60 border border-emerald-700/60 text-emerald-200'
                : 'bg-rose-950/60 border border-rose-700/60 text-rose-200'
            }`}
          >
            {statusMsg.tipo === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{statusMsg.texto}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setJsonInput('')}
            className="text-xs text-slate-400 hover:text-white"
          >
            Limpar Texto
          </button>

          <button
            onClick={handleImportar}
            disabled={importing || !jsonInput.trim()}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all active:scale-95"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{importing ? 'Inserindo no Banco...' : 'Importar Lote para o Banco'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
