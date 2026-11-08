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

// ==========================================
// CRONOGRAMA PEDAGÓGICO SEMANAL DO EDITAL
// ==========================================
export function getTemaEDisciplinasDoDia(diaSemana: number): {
  diaNome: string;
  focoTema: string;
  disciplinasP1: string[];
  disciplinasP2: string[];
  disciplinasP3: string[];
  temDiscursiva: boolean;
} {
  switch (diaSemana) {
    case 1: // Segunda
    case 3: // Quarta
      return {
        diaNome: diaSemana === 1 ? 'Segunda-feira' : 'Quarta-feira',
        focoTema: 'Estatística, Governança & Português / Ética',
        disciplinasP1: ['Estado, Democracia e Ciência Política', 'Ética Pública e Responsabilidade Profissional'],
        disciplinasP2: ['Governança, Riscos e Integridade Pública e Privada', 'Transparência, Ouvidoria e Participação Social'],
        disciplinasP3: ['Estatística, Programação e Análise de Dados'],
        temDiscursiva: false,
      };
    case 2: // Terça
    case 4: // Quinta
      return {
        diaNome: diaSemana === 2 ? 'Terça-feira' : 'Quinta-feira',
        focoTema: 'Engenharia de Dados & Direito / Controle Governamental',
        disciplinasP1: ['Administração Pública e Fundamentos de Políticas Públicas'],
        disciplinasP2: ['Direito Público Aplicado, Controle e Responsabilização', 'Auditoria Governamental e Atuação Integrada da CGU'],
        disciplinasP3: ['Engenharia, Arquitetura e Governança de Dados'],
        temDiscursiva: false,
      };
    case 5: // Sexta
    case 6: // Sábado
      return {
        diaNome: diaSemana === 5 ? 'Sexta-feira' : 'Sábado',
        focoTema: 'Machine Learning, IA / LLMs & Políticas Públicas',
        disciplinasP1: ['Sociedade Brasileira, Desigualdades e Diversidade', 'Administração Pública e Fundamentos de Políticas Públicas'],
        disciplinasP2: ['Evidências, Dados e Inteligência Artificial', 'Governança, Riscos e Integridade Pública e Privada'],
        disciplinasP3: ['Aprendizado de Máquina e Inteligência Artificial', 'Redes Neurais, NLP e Modelos de Linguagem', 'MLOps, Governança e Gestão de Soluções de Dados'],
        temDiscursiva: false,
      };
    case 0: // Domingo
    default:
      return {
        diaNome: 'Domingo',
        focoTema: 'Simulado Geral Oficial Cebraspe + Prova Discursiva',
        disciplinasP1: [], // todas
        disciplinasP2: [], // todas
        disciplinasP3: [], // todas
        temDiscursiva: true,
      };
  }
}

export async function gerarBateriaDiaria(
  qtdP1: number = 10,
  qtdP2: number = 10,
  qtdP3: number = 30,
  diaSemanaForcado?: number
): Promise<{ bateria: BateriaDiaria; questoes: Questao[] }> {
  const todasQuestoes = await getQuestoes();
  const diaSemana = diaSemanaForcado !== undefined ? diaSemanaForcado : new Date().getDay();
  const cronograma = getTemaEDisciplinasDoDia(diaSemana);

  // Selecionador com priorização pedagógica por tema do dia
  const selecionarComPrioridade = (
    poolBloco: Questao[],
    disciplinasPrioritarias: string[],
    quantidade: number
  ): Questao[] => {
    if (poolBloco.length === 0) return [];

    let prioritarias: Questao[] = [];
    if (disciplinasPrioritarias.length > 0) {
      prioritarias = poolBloco.filter((q) =>
        disciplinasPrioritarias.some((d) => q.disciplina.toLowerCase().includes(d.toLowerCase()))
      );
    }

    const outras = poolBloco.filter((q) => !prioritarias.includes(q));

    const embaralhar = (arr: Questao[]) => [...arr].sort(() => Math.random() - 0.5);
    const selPrioritarias = embaralhar(prioritarias);
    const selOutras = embaralhar(outras);

    // Seleciona até 70% das questões das disciplinas do dia, e completa com as demais
    const qtdPrioritaria = Math.min(selPrioritarias.length, Math.ceil(quantidade * 0.7));
    const selecionadas = selPrioritarias.slice(0, qtdPrioritaria);

    const restanteQtd = quantidade - selecionadas.length;
    const complemento = [...selPrioritarias.slice(qtdPrioritaria), ...selOutras].slice(0, restanteQtd);

    return embaralhar([...selecionadas, ...complemento]);
  };

  const poolP1 = todasQuestoes.filter((q) => q.bloco === 'P1');
  const poolP2 = todasQuestoes.filter((q) => q.bloco === 'P2');
  const poolP3 = todasQuestoes.filter((q) => q.bloco === 'P3');

  const selP1 = selecionarComPrioridade(poolP1, cronograma.disciplinasP1, qtdP1);
  const selP2 = selecionarComPrioridade(poolP2, cronograma.disciplinasP2, qtdP2);
  const selP3 = selecionarComPrioridade(poolP3, cronograma.disciplinasP3, qtdP3);

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
  // 1. Se o Supabase estiver conectado, busca a bateria do dia ativa na nuvem
  if (isSupabaseConfigured() && supabase) {
    try {
      const hoje = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('baterias_diarias')
        .select('*')
        .eq('data_geracao', hoje)
        .eq('concluida', false)
        .order('criada_em', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        const bateriaDb = data[0] as BateriaDiaria;
        const todas = await getQuestoes();
        const mapa = new Map(todas.map((q) => [q.id, q]));
        const questoesOrdenadas = bateriaDb.ids_questoes
          .map((id) => mapa.get(id))
          .filter(Boolean) as Questao[];

        if (questoesOrdenadas.length > 0) {
          if (typeof window !== 'undefined') {
            localStorage.setItem(
              STORAGE_BATERIA_KEY,
              JSON.stringify({ bateria: bateriaDb, questoes: questoesOrdenadas })
            );
          }
          return { bateria: bateriaDb, questoes: questoesOrdenadas };
        }
      }
    } catch (e) {
      console.warn('Erro ao sincronizar bateria diária com Supabase:', e);
    }
  }

  // 2. Fallback de cache local
  if (typeof window !== 'undefined') {
    try {
      const cache = localStorage.getItem(STORAGE_BATERIA_KEY);
      if (cache) {
        const parsed = JSON.parse(cache);
        if (parsed.bateria && parsed.questoes && parsed.questoes.length > 0) {
          const idsUnicos = new Set(parsed.questoes.map((q: Questao) => q.id));
          if (idsUnicos.size === parsed.questoes.length) {
            return parsed;
          }
        }
      }
    } catch {}
  }

  // 3. Se não houver bateria hoje, gera uma nova respeitando o cronograma
  return gerarBateriaDiaria(10, 10, 30);
}

// Carrega qualquer bateria histórica específica por ID
export async function carregarBateriaPorId(
  bateriaId: string
): Promise<{ bateria: BateriaDiaria; questoes: Questao[] } | null> {
  const todas = await getQuestoes();
  const mapa = new Map(todas.map((q) => [q.id, q]));

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('baterias_diarias')
        .select('*')
        .eq('id', bateriaId)
        .single();

      if (!error && data) {
        const bat = data as BateriaDiaria;
        const questoesOrdenadas = bat.ids_questoes
          .map((id) => mapa.get(id))
          .filter(Boolean) as Questao[];

        if (typeof window !== 'undefined') {
          localStorage.setItem(
            STORAGE_BATERIA_KEY,
            JSON.stringify({ bateria: bat, questoes: questoesOrdenadas })
          );
        }
        return { bateria: bat, questoes: questoesOrdenadas };
      }
    } catch (e) {
      console.warn('Erro ao carregar bateria por ID do Supabase:', e);
    }
  }

  // Fallback se estiver no localStorage
  if (typeof window !== 'undefined') {
    try {
      const cache = localStorage.getItem(STORAGE_BATERIA_KEY);
      if (cache) {
        const parsed = JSON.parse(cache);
        if (parsed.bateria?.id === bateriaId) return parsed;
      }
    } catch {}
  }

  return null;
}

// Lista todo o histórico de baterias geradas com estatísticas de progresso
export async function getHistoricoBaterias(): Promise<
  import('./types').HistoricoBateriaItem[]
> {
  const baterias: BateriaDiaria[] = [];
  const todasRespostas = await getHistoricoRespostas();

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('baterias_diarias')
        .select('*')
        .order('criada_em', { ascending: false });

      if (!error && data) {
        baterias.push(...(data as BateriaDiaria[]));
      }
    } catch (e) {
      console.warn('Erro ao listar baterias do Supabase:', e);
    }
  }

  // Se não trouxe nada do Supabase, tenta carregar a bateria local ativa
  if (baterias.length === 0 && typeof window !== 'undefined') {
    try {
      const cache = localStorage.getItem(STORAGE_BATERIA_KEY);
      if (cache) {
        const parsed = JSON.parse(cache);
        if (parsed.bateria) baterias.push(parsed.bateria);
      }
    } catch {}
  }

  return baterias.map((bat) => {
    // Respostas vinculadas a essa bateria
    const respostasDaBateria = todasRespostas.filter((r) => r.bateria_id === bat.id);
    const respondidasCount = respostasDaBateria.length;
    const acertosCount = respostasDaBateria.filter((r) => r.acertou).length;
    const errosCount = respostasDaBateria.filter((r) => !r.acertou && r.resposta_usuario !== 'B').length;
    const brancosCount = respostasDaBateria.filter((r) => r.resposta_usuario === 'B').length;
    const pontosLiquidos = respostasDaBateria.reduce((acc, r) => acc + (r.pontos_liquidos || 0), 0);

    const dataObj = new Date(bat.data_geracao + 'T12:00:00');
    const diaSemana = dataObj.getDay();
    const cronograma = getTemaEDisciplinasDoDia(diaSemana);

    const concluida = bat.concluida || (respondidasCount >= bat.ids_questoes.length && bat.ids_questoes.length > 0);

    return {
      id: bat.id,
      data_geracao: bat.data_geracao,
      criada_em: bat.criada_em || bat.data_geracao,
      total_questoes: bat.ids_questoes.length,
      respondidas_count: respondidasCount,
      acertos_count: acertosCount,
      erros_count: errosCount,
      brancos_count: brancosCount,
      pontos_liquidos: +pontosLiquidos.toFixed(1),
      concluida,
      dia_semana_nome: cronograma.diaNome,
      foco_tema: cronograma.focoTema,
    };
  });
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
  const isUuid = (str?: string | null) =>
    typeof str === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

  const payload: HistoricoResposta = {
    ...item,
    bateria_id: isUuid(item.bateria_id) ? item.bateria_id : null,
    dominada_no_caderno: item.dominada_no_caderno ?? false,
    data_resposta: new Date().toISOString(),
  };

  // Salva no Supabase
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase.from('historico_respostas').insert([
        {
          bateria_id: payload.bateria_id,
          questao_id: payload.questao_id,
          resposta_usuario: payload.resposta_usuario,
          confianca: payload.confianca,
          acertou: payload.acertou,
          pontos_liquidos: payload.pontos_liquidos,
          dominada_no_caderno: payload.dominada_no_caderno,
        },
      ]);
      if (error) {
        console.error('Erro retornado pelo Supabase ao salvar resposta:', error);
      }
    } catch (e) {
      console.warn('Erro na requisição ao Supabase:', e);
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
