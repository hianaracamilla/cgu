import { BlocoType, RespostaType, ConfiancaType, Questao, BoletimResultado } from './types';

/**
 * Calcula a pontuação líquida Cebraspe e se acertou:
 * - P1: Certo = +1.0, Erro = -1.0, Branco = 0.0
 * - P2: Certo = +1.0, Erro = -1.0, Branco = 0.0
 * - P3: Certo = +2.0, Erro = -2.0, Branco = 0.0
 */
export function calcularPontosCebraspe(
  bloco: BlocoType,
  gabarito: 'C' | 'E',
  resposta: RespostaType
): { acertou: boolean; pontos: number } {
  if (resposta === 'B') {
    return { acertou: false, pontos: 0.0 };
  }

  const peso = bloco === 'P3' ? 2.0 : 1.0;

  if (resposta === gabarito) {
    return { acertou: true, pontos: peso };
  } else {
    return { acertou: false, pontos: -peso };
  }
}

/**
 * Parser de String Rápida para o Leitor de Gabarito do Modo Papel
 * Suporta formatos flexíveis:
 * - "1C 2E 3B 4C? 5E?"
 * - "1:C, 2:E?, 3:B"
 * - Linhas com "1 C" ou "1 C?"
 */
export function parseGabaritoString(
  input: string,
  questoesOrdem: Questao[]
): {
  respostas: Map<number, { resposta: RespostaType; confianca: ConfiancaType }>;
  invalidos: string[];
} {
  const mapa = new Map<number, { resposta: RespostaType; confianca: ConfiancaType }>();
  const invalidos: string[] = [];

  if (!input || input.trim().length === 0) {
    return { respostas: mapa, invalidos };
  }

  // Regex para capturar padrão: (número opcional)(C|E|B)(? opcional)
  // Ex: "1C", "1C?", "1: C", "1 - E?", "42B"
  const tokens = input.trim().split(/[\s,;\n]+/);

  for (const token of tokens) {
    if (!token) continue;
    // Tenta formato "1C?" ou "1:C?"
    const matchComNumero = token.match(/^(\d+)[:\.\-]?[ ]*([CEBceb])(\?)?$/i);
    if (matchComNumero) {
      const num = parseInt(matchComNumero[1], 10);
      const resp = matchComNumero[2].toUpperCase() as RespostaType;
      const conf: ConfiancaType = matchComNumero[3] === '?' ? 'Duvida' : 'Certeza';
      mapa.set(num, { resposta: resp, confianca: conf });
      continue;
    }

    // Tenta formato sem número caso o usuário cole apenas letras "C E B C? E?"
    const matchSemNumero = token.match(/^([CEBceb])(\?)?$/i);
    if (matchSemNumero) {
      const nextIndex = mapa.size + 1;
      const resp = matchSemNumero[1].toUpperCase() as RespostaType;
      const conf: ConfiancaType = matchSemNumero[2] === '?' ? 'Duvida' : 'Certeza';
      mapa.set(nextIndex, { resposta: resp, confianca: conf });
      continue;
    }

    invalidos.push(token);
  }

  return { respostas: mapa, invalidos };
}

/**
 * Constrói o Boletim do Dia com cálculos estatísticos e itens para revisão
 */
export function gerarBoletim(
  questoes: Questao[],
  respostasMapa: Map<number, { resposta: RespostaType; confianca: ConfiancaType }>
): BoletimResultado {
  let acertos = 0;
  let erros = 0;
  let brancos = 0;
  let duvidas = 0;
  let respondidas = 0;
  let pontosTotal = 0;
  let pontosP1 = 0;
  let pontosP2 = 0;
  let pontosP3 = 0;

  const itensParaRevisao: BoletimResultado['itensParaRevisao'] = [];

  questoes.forEach((questao, idx) => {
    const numOrdem = idx + 1;
    const marcacao = respostasMapa.get(numOrdem) || { resposta: 'B' as RespostaType, confianca: 'Certeza' as ConfiancaType };
    const { acertou, pontos } = calcularPontosCebraspe(questao.bloco, questao.gabarito, marcacao.resposta);

    if (marcacao.resposta !== 'B') {
      respondidas++;
    }

    if (marcacao.confianca === 'Duvida') {
      duvidas++;
    }

    if (marcacao.resposta === 'B') {
      brancos++;
    } else if (acertou) {
      acertos++;
    } else {
      erros++;
    }

    pontosTotal += pontos;
    if (questao.bloco === 'P1') pontosP1 += pontos;
    if (questao.bloco === 'P2') pontosP2 += pontos;
    if (questao.bloco === 'P3') pontosP3 += pontos;

    // Gatilho do Caderno de Erros: Errou OU Acertou com Dúvida OU Deixou em Branco
    if (!acertou || marcacao.confianca === 'Duvida' || marcacao.resposta === 'B') {
      itensParaRevisao.push({
        questao,
        resposta: marcacao.resposta,
        confianca: marcacao.confianca,
        acertou,
        pontos,
      });
    }
  });

  const totalQuestoes = questoes.length;
  // Taxa líquida sobre o total máximo de pontos possíveis
  const maxPontosPossiveis = questoes.reduce((acc, q) => acc + (q.bloco === 'P3' ? 2 : 1), 0);
  const taxaLiquida = maxPontosPossiveis > 0 ? (pontosTotal / maxPontosPossiveis) * 100 : 0;

  return {
    totalQuestoes,
    respondidas,
    acertos,
    erros,
    brancos,
    duvidas,
    pontosLiquidosTotal: Number(pontosTotal.toFixed(1)),
    pontosP1: Number(pontosP1.toFixed(1)),
    pontosP2: Number(pontosP2.toFixed(1)),
    pontosP3: Number(pontosP3.toFixed(1)),
    taxaLiquida: Number(taxaLiquida.toFixed(1)),
    itensParaRevisao,
  };
}
