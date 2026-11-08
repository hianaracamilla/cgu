import { createClient } from '@supabase/supabase-js';
import { Questao, BateriaDiaria, HistoricoResposta, RespostaType, ConfiancaType } from './types';
import { QUESTOES_SEED } from './seedData';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  '';

export const isSupabaseConfigured = (): boolean => {
  return (
    typeof supabaseUrl === 'string' &&
    supabaseUrl.length > 0 &&
    !supabaseUrl.includes('sua-url-aqui') &&
    typeof supabaseAnonKey === 'string' &&
    supabaseAnonKey.length > 0 &&
    !supabaseAnonKey.includes('sua-chave-aqui')
  );
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Chaves de armazenamento local para funcionamento 100% offline ou pré-setup
const STORAGE_QUESTOES_KEY = 'cgu2026_questoes_v1';
const STORAGE_BATERIA_KEY = 'cgu2026_bateria_ativa_v1';
const STORAGE_HISTORICO_KEY = 'cgu2026_historico_respostas_v1';

// Helpers para LocalStorage (Fallback / Zero Config)
function getLocalQuestoes(): Questao[] {
  if (typeof window === 'undefined') return QUESTOES_SEED;
  try {
    const raw = localStorage.getItem(STORAGE_QUESTOES_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_QUESTOES_KEY, JSON.stringify(QUESTOES_SEED));
      return QUESTOES_SEED;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : QUESTOES_SEED;
  } catch {
    return QUESTOES_SEED;
  }
}

function setLocalQuestoes(list: Questao[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_QUESTOES_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('Erro ao salvar questoes no localStorage:', err);
  }
}

function getLocalHistorico(): HistoricoResposta[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_HISTORICO_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalHistorico(item: HistoricoResposta): void {
  if (typeof window === 'undefined') return;
  try {
    const atual = getLocalHistorico();
    const index = atual.findIndex(
      (h) => h.questao_id === item.questao_id && h.bateria_id === item.bateria_id
    );
    if (index >= 0) {
      atual[index] = { ...atual[index], ...item };
    } else {
      atual.unshift({ ...item, id: Date.now() });
    }
    localStorage.setItem(STORAGE_HISTORICO_KEY, JSON.stringify(atual));
  } catch (err) {
    console.warn('Erro ao salvar historico no localStorage:', err);
  }
}

// ==========================================
// SERVIÇOS DE DADOS UNIFICADOS (SUPABASE + LOCAL)
// ==========================================

export async function getQuestoes(): Promise<Questao[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('questoes')
        .select('*')
        .order('id', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as Questao[];
      }
    } catch (e) {
      console.warn('Supabase indisponível no momento, usando fallback:', e);
    }
  }
  return getLocalQuestoes();
}

export async function gerarBateriaDiaria(
  qtdP1: number = 10,
  qtdP2: number = 10,
  qtdP3: number = 30
): Promise<{ bateria: BateriaDiaria; questoes: Questao[] }> {
  const todasQuestoes = await getQuestoes();

  // Filtragem por bloco
  const poolP1 = todasQuestoes.filter((q) => q.bloco === 'P1');
  const poolP2 = todasQuestoes.filter((q) => q.bloco === 'P2');
  const poolP3 = todasQuestoes.filter((q) => q.bloco === 'P3');

  // Seleciona questões únicas sem duplicar o mesmo item dentro da mesma bateria
  const selecionar = (pool: Questao[], quantidade: number): Questao[] => {
    if (pool.length === 0) return [];
    const embaralhado = [...pool].sort(() => Math.random() - 0.5);
    return embaralhado.slice(0, quantidade);
  };

  const selP1 = selecionar(poolP1, qtdP1);
  const selP2 = selecionar(poolP2, qtdP2);
  const selP3 = selecionar(poolP3, qtdP3);

  const selecionadas = [...selP1, ...selP2, ...selP3];
  const ids = selecionadas.map((q) => q.id);

  const novaBateria: BateriaDiaria = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `bat-${Date.now()}`,
    data_geracao: new Date().toISOString().split('T')[0],
    ids_questoes: ids,
    concluida: false,
    criada_em: new Date().toISOString(),
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('baterias_diarias').insert([
        {
          id: novaBateria.id,
          data_geracao: novaBateria.data_geracao,
          ids_questoes: novaBateria.ids_questoes,
          concluida: false,
        },
      ]);
    } catch (e) {
      console.warn('Falha ao persistir bateria no Supabase:', e);
    }
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_BATERIA_KEY, JSON.stringify({ bateria: novaBateria, questoes: selecionadas }));
  }

  return { bateria: novaBateria, questoes: selecionadas };
}

export async function getBateriaAtivaOuCriar(): Promise<{ bateria: BateriaDiaria; questoes: Questao[] }> {
  if (typeof window !== 'undefined') {
    try {
      const cache = localStorage.getItem(STORAGE_BATERIA_KEY);
      if (cache) {
        const parsed = JSON.parse(cache);
        if (parsed.bateria && parsed.questoes && parsed.questoes.length > 0) {
          // Se tiver questões repetidas no cache antigo, descarta e regenera sem duplicações
          const idsUnicos = new Set(parsed.questoes.map((q: Questao) => q.id));
          if (idsUnicos.size === parsed.questoes.length) {
            return parsed;
          }
        }
      }
    } catch {}
  }
  return gerarBateriaDiaria(10, 10, 30);
}

export async function salvarResposta(item: {
  bateria_id?: string | null;
  questao_id: number;
  resposta_usuario: RespostaType;
  confianca: ConfiancaType;
  acertou: boolean;
  pontos_liquidos: number;
  dominada_no_caderno?: boolean;
}): Promise<void> {
  const payload: HistoricoResposta = {
    ...item,
    dominada_no_caderno: item.dominada_no_caderno ?? false,
    data_resposta: new Date().toISOString(),
  };

  // Salva no Supabase
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('historico_respostas').insert([
        {
          bateria_id: payload.bateria_id || null,
          questao_id: payload.questao_id,
          resposta_usuario: payload.resposta_usuario,
          confianca: payload.confianca,
          acertou: payload.acertou,
          pontos_liquidos: payload.pontos_liquidos,
          dominada_no_caderno: payload.dominada_no_caderno,
        },
      ]);
    } catch (e) {
      console.warn('Erro ao salvar resposta no Supabase:', e);
    }
  }

  // Salva sempre no fallback local para resposta instantânea
  saveLocalHistorico(payload);
}

export async function getHistoricoRespostas(): Promise<HistoricoResposta[]> {
  const todasQuestoes = await getQuestoes();
  const mapaQuestoes = new Map(todasQuestoes.map((q) => [q.id, q]));

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('historico_respostas')
        .select('*')
        .order('data_resposta', { ascending: false });

      if (!error && data) {
        return (data as HistoricoResposta[]).map((h) => ({
          ...h,
          questao: mapaQuestoes.get(h.questao_id),
        }));
      }
    } catch (e) {
      console.warn('Falha ao buscar histórico no Supabase:', e);
    }
  }

  return getLocalHistorico().map((h) => ({
    ...h,
    questao: mapaQuestoes.get(h.questao_id),
  }));
}

export async function marcarComoDominada(questaoId: number): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase
        .from('historico_respostas')
        .update({ dominada_no_caderno: true })
        .eq('questao_id', questaoId);
    } catch (e) {
      console.warn('Erro ao atualizar no Supabase:', e);
    }
  }

  if (typeof window !== 'undefined') {
    const historico = getLocalHistorico().map((h) =>
      h.questao_id === questaoId ? { ...h, dominada_no_caderno: true } : h
    );
    localStorage.setItem(STORAGE_HISTORICO_KEY, JSON.stringify(historico));
  }
}

export async function bulkInsertQuestoes(novasQuestoes: Omit<Questao, 'id'>[]): Promise<{ count: number; error?: string }> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('questoes')
        .insert(novasQuestoes)
        .select();

      if (error) {
        return { count: 0, error: error.message };
      }
      return { count: data?.length || novasQuestoes.length };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return { count: 0, error: errorMessage };
    }
  }

  // Fallback Local
  const atuais = getLocalQuestoes();
  const maxId = atuais.reduce((max, q) => Math.max(max, q.id), 0);
  const preparadas: Questao[] = novasQuestoes.map((q, idx) => ({
    ...q,
    id: maxId + idx + 1,
  }));
  const uniao = [...atuais, ...preparadas];
  setLocalQuestoes(uniao);
  return { count: preparadas.length };
}
