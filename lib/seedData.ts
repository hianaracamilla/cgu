import { Questao } from './types';

export const QUESTOES_SEED: Questao[] = [
  // ==================== BLOCO P1 ====================
  {
    id: 1,
    bloco: 'P1',
    disciplina: 'Língua Portuguesa',
    topico_edital: 'Coesão e Coerência Textual / Pontuação Cebraspe',
    enunciado: 'No trecho "A auditoria governamental contemporânea, que adota técnicas analíticas de dados, visa mitigar riscos de desconformidade", o isolamento da oração "que adota técnicas analíticas de dados" por vírgulas confere-lhe caráter explicativo; caso as vírgulas fossem suprimidas, haveria prejuízo para a correção gramatical do texto, embora o sentido original permanecesse inalterado.',
    gabarito: 'E',
    comentario: 'A supressão das vírgulas altera o sentido da oração adjetiva de explicativa para restritiva (passaria a indicar que apenas as auditorias que adotam analítica visam mitigar riscos), o que altera a semântica, mas NÃO causa incorreção gramatical.',
    regra_ouro: 'A retirada de vírgulas em orações adjetivas transforma explicativa em restritiva: mantém a correção gramatical, mas SEMPRE altera o sentido.',
    nivel: 'Difícil'
  },
  {
    id: 2,
    bloco: 'P1',
    disciplina: 'Administração Pública',
    topico_edital: 'Nova Governança Pública e Accountability',
    enunciado: 'O conceito de accountability horizontal refere-se à mútua fiscalização e controle existente entre órgãos estatais autônomos e independentes, tais como o controle externo exercido pelo Tribunal de Contas com auxílio do controle interno, ao passo que a accountability vertical decorre do controle social e eleitoral exercido pelos cidadãos.',
    gabarito: 'C',
    comentario: "Correto. Guillermo O'Donnell conceitua accountability horizontal como a atuação recíproca de controle e fiscalização entre poderes/órgãos estatais (ex: CGU, TCU, Judiciário, MP), enquanto a vertical abrange mecanismos societários e eleitorais (voto, manifestação, controle social direto).",
    regra_ouro: 'Accountability horizontal é entre órgãos/poderes (ex: CGU/TCU); accountability vertical é sociedade/cidadão sobre os governantes.',
    nivel: 'Média'
  },
  {
    id: 3,
    bloco: 'P1',
    disciplina: 'Políticas Públicas',
    topico_edital: 'Ciclo de Políticas Públicas e Avaliação de Impacto',
    enunciado: 'Na fase de avaliação de impacto de uma política pública, a identificação do contrafactual é dispensável quando a amostragem do grupo de tratamento contemplar mais de 90% da população-alvo do programa governamental.',
    gabarito: 'E',
    comentario: 'O contrafactual (o que teria ocorrido com o grupo tratado na ausência da política pública) é a premissa epistemológica indispensável da avaliação de impacto causal. Mesmo que 90% ou 100% sejam tratados, sem grupo de controle ou método quase-experimental válido (como RDD, Propensity Score ou DiD), confunde-se correlação temporal com impacto causal da política.',
    regra_ouro: 'Avaliação de impacto causal EXIGE contrafactual; sem contrafactual não há como isolar o efeito real da intervenção pública.',
    nivel: 'Difícil'
  },
  {
    id: 4,
    bloco: 'P1',
    disciplina: 'Ética e Integridade Pública',
    topico_edital: 'Conflito de Interesses e Lei 12.813/2013',
    enunciado: 'Configura conflito de interesses após o exercício do cargo público a divulgação ou uso de informação privilegiada obtida em razão das atividades exercidas, hipótese na qual a restrição temporal (quarentena) prevista em lei é permanentemente extinta após transcorridos seis meses da data de exoneração.',
    gabarito: 'E',
    comentario: 'Atenção à pegadinha clássica do Cebraspe! O dever de sigilo e a vedação de divulgação ou uso de informação privilegiada obtida em razão das atividades exercidas PERDURA A QUALQUER TEMPO (não prescreve após a quarentena de 6 meses). A quarentena de 6 meses restringe certas atividades profissionais ou consultorias, mas o sigilo sobre informação privilegiada é perpétuo enquanto mantiver tal condição.',
    regra_ouro: 'Informação privilegiada: a vedação ao uso/divulgação NUNCA prescreve (a quarentena de 6 meses restringe apenas atividades profissionais).',
    nivel: 'Difícil'
  },
  {
    id: 5,
    bloco: 'P1',
    disciplina: 'Estado e Democracia',
    topico_edital: 'Controle Social e Transparência Pública',
    enunciado: 'O orçamento participativo e as consultas públicas consubstanciam instrumentos de democracia deliberativa e participativa que, embora não revoguem as prerrogativas constitucionais do Poder Legislativo na aprovação final da Lei Orçamentária Anual, vinculam formal e compulsoriamente a alocação de créditos orçamentários pelo Executivo.',
    gabarito: 'E',
    comentario: 'Erradíssimo. As deliberações de orçamentos participativos e audiências públicas não possuem natureza compulsória vinculante de direito estrito sobre o Poder Executivo na elaboração orçamentária nem sobre o Legislativo, tratando-se de mecanismos de vocalização de prioridades e controle social.',
    regra_ouro: 'Orçamento participativo e consultas têm natureza consultiva/participativa; NÃO geram vinculação formal e cogente de alocação orçamentária.',
    nivel: 'Média'
  },

  // ==================== BLOCO P2 ====================
  {
    id: 6,
    bloco: 'P2',
    disciplina: 'Governança e Gestão de Riscos',
    topico_edital: 'Framework COSO ERM 2017 e Três Linhas',
    enunciado: 'De acordo com o Modelo das Três Linhas do IIA (atualizado em 2020), as funções de conformidade regulatória, controle de qualidade e gestão de riscos integram a segunda linha, cuja principal responsabilidade é fornecer assistência, monitoramento e orientação especializada às funções da primeira linha (gestão operacional).',
    gabarito: 'C',
    comentario: 'Exatamente. 1ª Linha: entrega de produtos/serviços e gestão operacional direta dos riscos. 2ª Linha: conformidade, qualidade e supervisão de riscos especializada. 3ª Linha: Auditoria Interna, com independência e avaliação objetiva.',
    regra_ouro: '1ª Linha = operação e execução; 2ª Linha = conformidade, controle e apoio técnico de risco; 3ª Linha = auditoria interna independente.',
    nivel: 'Média'
  },
  {
    id: 7,
    bloco: 'P2',
    disciplina: 'Lei Geral de Proteção de Dados (LGPD)',
    topico_edital: 'Princípios e Bases Legais da LGPD (Lei 13.709/2018)',
    enunciado: 'O tratamento de dados pessoais sensíveis pela administração pública prescinde do consentimento do titular quando for indispensável para o cumprimento de obrigação legal ou regulatória pelo controlador, bem como para o tratamento compartilhado de dados necessários à execução, pela administração pública, de políticas públicas previstas em leis ou regulamentos.',
    gabarito: 'C',
    comentario: 'Correto. Art. 11, II, "a" e "b" da LGPD: Dados pessoais sensíveis podem ser tratados sem consentimento do titular para cumprimento de obrigação legal ou regulatória e na execução de políticas públicas pela administração pública.',
    regra_ouro: 'Administração Pública pode tratar dados sensíveis SEM consentimento para obrigação legal ou execução de políticas públicas regimentadas.',
    nivel: 'Difícil'
  },
  {
    id: 8,
    bloco: 'P2',
    disciplina: 'Auditoria Governamental',
    topico_edital: 'Auditoria Baseada em Riscos (ABR) e Matriz de Achados',
    enunciado: 'Na elaboração da Matriz de Achados em uma auditoria operacional realizada pela CGU, a ausência de controle informatizado sobre a concessão de diárias classifica-se como a causa do achado, o superfaturamento financeiro constatado classifica-se como a evidência, e a infringência ao Decreto de Diárias classifica-se como a condição.',
    gabarito: 'E',
    comentario: 'Inversão dos elementos do achado! A situação encontrada (fatos verificados: superfaturamento/falhas) é a CONDIÇÃO; a norma ou boa prática que deveria ser seguida é o CRITÉRIO (Decreto); o motivo gerador (ausência de controle) é a CAUSA; e o dano/impacto financeiro é o EFEITO.',
    regra_ouro: 'Elementos do Achado Cebraspe: Condição (o que é), Critério (o que deveria ser), Causa (por que ocorreu) e Efeito (impacto/dano gerado).',
    nivel: 'Difícil'
  },
  {
    id: 9,
    bloco: 'P2',
    disciplina: 'Direito Administrativo e Licitações',
    topico_edital: 'Nova Lei de Licitações (Lei 14.133/2021)',
    enunciado: 'Sob a égide da Lei 14.133/2021, o diálogo competitivo é a modalidade de licitação destinada à contratação de obras, serviços e compras em que a Administração Pública realiza diálogos com licitantes previamente selecionados mediante critérios objetivos, sendo cabível exclusivamente para objetos que envolvam inovação tecnológica ou técnica.',
    gabarito: 'E',
    comentario: 'Não é exclusivamente para inovação! O art. 32, I da Lei 14.133/2021 prevê cabimento do diálogo competitivo quando a necessidade não puder ser satisfeita sem adaptação de soluções disponíveis no mercado, ou quando envolver inovação tecnológica/técnica, ou impossibilidade de definir com precisão suficiente as especificações técnicas, ou impossibilidade de definir a modalidade jurídica/financeira do contrato.',
    regra_ouro: 'Diálogo Competitivo (Lei 14.133): não é restrito à inovação tecnológica; cabe também quando a especificação técnica não puder ser definida a priori.',
    nivel: 'Difícil'
  },
  {
    id: 10,
    bloco: 'P2',
    disciplina: 'Lei de Acesso à Informação (LAI)',
    topico_edital: 'Classificação de Sigilo e Prazos da Lei 12.527/2011',
    enunciado: 'Informações que possam colocar em risco a segurança do Presidente da República e sobre sua honra pessoal poderão ser classificadas no grau ultrassecreto por até vinte e cinco anos, cabendo tal competência originária de classificação privativamente a Ministros de Estado.',
    gabarito: 'E',
    comentario: 'Art. 24, § 2º da LAI: As informações que puderem colocar em risco a segurança do Presidente e Vice-Presidente da República e respectivos cônjuges e filhos(as) serão classificadas como reservadas e ficarão sob sigilo até o término do mandato em exercício. Não são ultrassecretas nem por 25 anos nessa regra específica.',
    regra_ouro: 'Segurança pessoal do Presidente/Vice e familiares: classificação é RESERVADA com prazo estrito até o término do mandato.',
    nivel: 'Difícil'
  },

  // ==================== BLOCO P3 ====================
  {
    id: 11,
    bloco: 'P3',
    disciplina: 'Machine Learning e Modelagem Preditiva',
    topico_edital: 'Regularização L1 vs L2 (Lasso vs Ridge) e Esparsidade',
    enunciado: 'Em modelos de regressão linear para detecção de fraudes em pagamentos, o regularizador Lasso (L1) adiciona uma penalidade proporcional à soma dos valores absolutos dos coeficientes, o que força determinados coeficientes a se tornarem exatamente zero à medida que o hiperparâmetro lambda aumenta, executando seleção de atributos intrínseca.',
    gabarito: 'C',
    comentario: 'Correto. O Lasso (L1: lambda * sum(|beta|)) possui cantos pontiagudos nas interseções com os eixos na geometria dos contornos de penalização, forçando coeficientes de variáveis irrelevantes ou colineares a zero (solução esparsa / feature selection). A regressão Ridge (L2), por outro lado, encolhe coeficientes próximos a zero, mas nunca os anula rigorosamente.',
    regra_ouro: 'Lasso (L1) = penalidade em valor absoluto -> gera esparsidade e ZERA coeficientes (Feature Selection). Ridge (L2) apenas atenua.',
    nivel: 'Difícil'
  },
  {
    id: 12,
    bloco: 'P3',
    disciplina: 'Processamento de Linguagem Natural e LLMs',
    topico_edital: 'Mecanismo de Atenção Multi-Head e Transformers',
    enunciado: 'No mecanismo de Scaled Dot-Product Attention da arquitetura Transformer, o escalonamento pelo fator raiz quadrada da dimensão das chaves (sqrt(d_k)) é empregado com o propósito primordial de prevenir que o produto escalar atinja magnitudes elevadas em dimensões altas, o que empurraria a função softmax para regiões de gradientes extremamente pequenos (vanishing gradients).',
    gabarito: 'C',
    comentario: 'Correto. Vaswani et al. (2017) justificam que para valores altos de d_k, os produtos escalares crescem em magnitude. Ao alimentar esses valores elevados na softmax, a distribuição fica pontiaguda com derivadas próximas a zero. Dividir por sqrt(d_k) normaliza a variância para 1, estabilizando os gradientes.',
    regra_ouro: 'Na Self-Attention, divide-se por sqrt(d_k) para evitar que o produto escalar infle e jogue a softmax na zona de gradiente desvanecente.',
    nivel: 'Difícil'
  },
  {
    id: 13,
    bloco: 'P3',
    disciplina: 'Engenharia de Dados e Big Data',
    topico_edital: 'Apache Spark: Shuffle, Particionamento e Fault Tolerance',
    enunciado: 'No Apache Spark, transformações do tipo narrow dependency (como map, filter e flatMap) exigem a redistribuição física de dados através da rede entre os executores (shuffle), enquanto transformações wide dependency (como reduceByKey, join e groupByKey) operam estritamente sobre partições locais sem sobrecarga de I/O de rede.',
    gabarito: 'E',
    comentario: 'Inversão clássica de conceitos do Apache Spark! Transformações NARROW (map, filter) NÃO exigem shuffle, pois cada partição filha depende de uma única partição pai (computação local). Já transformações WIDE (groupByKey, join, reduceByKey) exigem SHUFFLE (troca de dados através da rede entre executores), sendo a principal causa de gargalos de I/O em pipelines de dados.',
    regra_ouro: 'Spark: Narrow (map, filter) = sem shuffle / dados locais. Wide (join, groupByKey) = COM SHUFFLE / tráfego pesado de rede.',
    nivel: 'Difícil'
  },
  {
    id: 14,
    bloco: 'P3',
    disciplina: 'Estatística e Inferência Causal',
    topico_edital: 'Regressão Logística, ROC-AUC e Teorema de Bayes',
    enunciado: 'Em um cenário de dados com desbalanceamento severo de classes (como na detecção de transações fraudulentas, em que apenas 0,1% das instâncias são positivas), a métrica ROC-AUC é superior à curva Precision-Recall (PR-AUC), pois a ROC-AUC é imune ao impacto do desbalanceamento por incorporar a taxa de verdadeiros negativos na sua formulação.',
    gabarito: 'E',
    comentario: 'Pelo contrário! Em problemas com classes altamente desbalanceadas, a ROC-AUC apresenta uma ilusão excessivamente otimista porque a True Negative Rate (Especificidade) é dominada pelo enorme volume da classe majoritária, fazendo com que a False Positive Rate (FPR) permaneça artificialmente baixa. A curva Precision-Recall (PR-AUC) foca exclusivamente na classe minoritária e na precisão, sendo a métrica recomendada e superior para desbalanceamento severo.',
    regra_ouro: 'Desbalanceamento severo (fraudes): ROC-AUC é enganosamente otimista. A métrica correta e padrão-ouro é a curva PR-AUC.',
    nivel: 'Difícil'
  },
  {
    id: 15,
    bloco: 'P3',
    disciplina: 'Bancos de Dados e SQL Analítico',
    topico_edital: 'Window Functions e Estratégias de Indexação',
    enunciado: 'Considere a consulta analítica SQL para auditoria de licitações: "SELECT fornecedor_id, valor, ROW_NUMBER() OVER (PARTITION BY orgao_id ORDER BY valor DESC) as rk FROM empenhos". A execução de uma window function como ROW_NUMBER() com cláusula PARTITION BY colapsa as linhas agregadas do resultado de forma idêntica à cláusula GROUP BY.',
    gabarito: 'E',
    comentario: 'Diferença fundamental de SQL: Funções de janela (Window Functions com OVER) NÃO colapsam o conjunto de linhas! Cada registro original do SELECT preserva sua identidade e linha individual na saída, recebendo o cálculo analítico contextualizado pelo PARTITION BY. Quem agrupa e colapsa linhas para um único valor escalar é a cláusula GROUP BY.',
    regra_ouro: 'Window Functions (OVER / PARTITION BY) preservam todas as linhas da tabela; GROUP BY colapsa as linhas em uma única por grupo.',
    nivel: 'Difícil'
  }
];
