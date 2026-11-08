export type BlocoType = 'P1' | 'P2' | 'P3';
export type RespostaType = 'C' | 'E' | 'B';
export type ConfiancaType = 'Certeza' | 'Duvida';

export interface Questao {
  id: number;
  bloco: BlocoType;
  disciplina: string;
  topico_edital: string;
  enunciado: string;
  gabarito: 'C' | 'E';
  comentario: string;
  regra_ouro: string;
  nivel: string;
  criada_em?: string;
}

export interface BateriaDiaria {
  id: string;
  data_geracao: string;
  ids_questoes: number[];
  concluida: boolean;
  criada_em?: string;
}

export interface HistoricoResposta {
  id?: number;
  bateria_id?: string | null;
  questao_id: number;
  resposta_usuario: RespostaType;
  confianca: ConfiancaType;
  acertou: boolean;
  pontos_liquidos: number;
  dominada_no_caderno: boolean;
  data_resposta?: string;
  // Campos agregados (joins)
  questao?: Questao;
}

export interface BoletimResultado {
  totalQuestoes: number;
  respondidas: number;
  acertos: number;
  erros: number;
  brancos: number;
  duvidas: number;
  pontosLiquidosTotal: number;
  pontosP1: number;
  pontosP2: number;
  pontosP3: number;
  taxaLiquida: number;
  itensParaRevisao: Array<{
    questao: Questao;
    resposta: RespostaType;
    confianca: ConfiancaType;
    acertou: boolean;
    pontos: number;
  }>;
}

export const BLOCO_PESOS: Record<BlocoType, { acerto: number; erro: number; nome: string }> = {
  P1: { acerto: 1.0, erro: -1.0, nome: 'Conhecimentos Básicos (Peso 1)' },
  P2: { acerto: 1.0, erro: -1.0, nome: 'Conhecimentos Complementares (Peso 1)' },
  P3: { acerto: 2.0, erro: -2.0, nome: 'Específicos - Ciência de Dados (Peso 2)' },
};

export type TipoDiscursiva = 'conhecimentos_complementares_30' | 'situacao_problema_60';

export interface QuesitoAvaliacao {
  numero: string;
  descricao: string;
  pontos_maximos: number;
  criterio_esperado: string;
}

export interface QuestaoDiscursiva {
  id: string;
  tipo: TipoDiscursiva;
  titulo: string;
  disciplina: string;
  contexto: string;
  comando: string;
  limite_linhas: number; // 30 ou 60
  valor_pontos: number; // 30.00 ou 70.00
  quesitos: QuesitoAvaliacao[];
  padrao_resposta: string;
  fundamentacao_legal: string;
}

export interface RespostaDiscursiva {
  id?: string;
  questao_id: string;
  texto_resposta: string;
  quantidade_linhas: number;
  autoavaliacao_nota?: number;
  data_resposta?: string;
}

