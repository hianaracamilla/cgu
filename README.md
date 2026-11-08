# 🛡️ CGU 2026 Cebraspe Simulator

> **Web App Mobile-First (PWA) de altíssima performance para estudo reverso por questões focado no concurso de Auditor Federal de Finanças e Controle da Controladoria-Geral da União (Especialidade: Ciência de Dados).**

---

## 📌 Sumário
- [1. Visão Geral e Metodologia](#1-visão-geral-e-metodologia)
- [2. Stack Tecnológica](#2-stack-tecnológica)
- [3. Regras de Negócio e Matemática do Edital](#3-regras-de-negócio-e-matemática-do-edital)
- [4. Estrutura de Telas e Funcionalidades](#4-estrutura-de-telas-e-funcionalidades)
- [5. Instalação e Execução Local](#5-instalação-e-execução-local)
- [6. Configuração do Supabase (Passo a Passo)](#6-configuração-do-supabase-passo-a-passo)
- [7. Deploy Imediato na Vercel](#7-deploy-imediato-na-vercel)
- [8. Fábrica de Questões (Formato JSON para `/importar`)](#8-fábrica-de-questões-formato-json-para-importar)
- [9. Estrutura do Código-Fonte](#9-estrutura-do-código-fonte)

---

## 1. Visão Geral e Metodologia

O **CGU 2026 Cebraspe Simulator** foi projetado para operar sob o princípio do **Estudo Reverso de Alta Densidade**: fixar a teoria a partir da resolução cirúrgica de itens no padrão da banca examinadora (Cebraspe).

### Principais Pilares:
1. **Zero Latência no Celular:** Interface tátil projetada para a zona de alcance do polegar (*thumb-friendly*), com *Bottom Navigation Bar* nativa e atualizações otimistas na interface (*Optimistic UI*).
2. **Dupla Modalidade (Tela ou Papel):** Resolva no celular com feedback e penalidade instantâneos ou gere a folha de prova diagramada em **2 colunas** via `@media print` para simular as condições reais do dia da prova.
3. **Gatilho Automático do Caderno de Erros:** Qualquer questão que a usuária errar **ou** acertar marcando a flag de `Dúvida (?)` é enviada para o Caderno de Erros com a **Regra de Ouro (resumo de 1 linha)**.
4. **Resiliência Offline / Zero Config:** O sistema conta com fallback automático no `localStorage`. Caso o Supabase ainda não esteja configurado no ambiente, a usuária pode treinar imediatamente sem travamento de tela.

---

## 2. Stack Tecnológica

| Camada | Tecnologia | Finalidade |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (App Router) | Renderização híbrida rápida e rotas otimizadas |
| **Linguagem** | TypeScript | Tipagem estrita de regras de pontuação e entidades |
| **Estilização** | Tailwind CSS v4 | Estilização responsiva, tema escuro de alto contraste |
| **Ícones** | Lucide React | Ícones minimalistas para mobile e desktop |
| **Banco de Dados** | Supabase (`@supabase/supabase-js`) | PostgreSQL com Row Level Security (RLS) |
| **Impressão / PDF** | CSS Nativo `@media print` | Diagramação em duas colunas estilo caderno Cebraspe |
| **PWA** | Web App Manifest + Service Worker | Instalável como aplicativo nativo no celular e desktop |
| **Hospedagem** | Vercel | Deploy contínuo via Git |

---

## 3. Regras de Negócio e Matemática do Edital

### 3.1 Modalidade de Julgamento
Cada item é julgado em:
- **`C` (Certo)**
- **`E` (Errado)**
- **`B` (Em Branco)**
- **Flag opcional `?` (Dúvida)**

### 3.2 Fator de Correção Cebraspe (Pesos e Penalidades)
| Bloco | Disciplinas Típicas | Acerto | Erro (Penalidade) | Em Branco |
| :--- | :--- | :---: | :---: | :---: |
| **P1** (Básicos) | Português, Ética, Adm. Pública, Políticas Públicas | **+1.0 pt** | **-1.0 pt** | 0.0 pt |
| **P2** (Complementares) | Governança, LGPD, LAI, Auditoria Governamental, Licitações | **+1.0 pt** | **-1.0 pt** | 0.0 pt |
| **P3** (Específicos - Ciência de Dados) | Machine Learning, NLP/LLMs, Spark, Estatística, SQL | **+2.0 pts** | **-2.0 pts** | 0.0 pt |

### 3.3 Meta Diária Padrão (50 Itens)
Toda bateria diária padrão sorteia:
- **10 itens de P1** (Peso 1.0)
- **10 itens de P2** (Peso 1.0)
- **30 itens de P3** (Peso 2.0 - Ciência de Dados)

### 3.4 Modo Extra (Overdelivery)
Possibilidade de gerar novas baterias sob demanda a qualquer momento:
- Bateria Diária Padrão (50 itens)
- Bateria Rápida (+20 itens)
- Foco Total P3 (+30 itens só de Ciência de Dados)

---

## 4. Estrutura de Telas e Funcionalidades

### 📱 Tela 1: Treino Mobile / Interativo (`/`)
- Flashcard focado na tela com badge de Bloco (P1, P2, P3 e Peso), Disciplina e Tópico do Edital.
- Botões táteis gigantes para o polegar: `[ CERTO ]`, `[ ERRADO ]`, `[ EM BRANCO ]`.
- Botão toggle `[ ? Dúvida ]` que direciona a questão para o Caderno de Erros mesmo em caso de acerto fortuito.
- Feedback visual imediato:
  - **Verde:** Acertou (+1.0 ou +2.0 pts)
  - **Vermelho:** Errou com aplicação da penalidade líquida (-1.0 ou -2.0 pts)
  - **Cinza:** Em Branco (0.0 pt)
- Bloco destacado com a **Regra de Ouro (1 linha)** e Comentário Detalhado.
- Carrossel horizontal de pílulas numéricas para pular rapidamente para qualquer item.

### 🖨️ Tela 2: Modo Papel — Impressão & Correção em Lote (`/papel`)
- **Parte A (Folha de Prova Cebraspe):**
  - Aciona `window.print()` com CSS `@media print` customizado.
  - Oculta menus, botões e barras de navegação.
  - Tipografia serifada clássica, cabeçalho oficial do Ministério/CGU e diagramação em **duas colunas** com caixinhas `( C ) ( E ) ( B ) [ ? ]` ao lado de cada item.
- **Parte B (Leitor de Gabarito Rápido):**
  - **Modo String Rápida:** Textarea com parser Regex inteligente que aceita strings contínuas como `1C 2E 3B 4C? 5E? ...`.
  - **Modo Grade Digital:** Cartão-resposta interativo de 1 a 50 na tela do smartphone.
  - **Boletim do Dia:** Saldo Líquido Total, aproveitamento por bloco (P1, P2, P3) e sanfona expandida apenas das questões erradas, em branco ou marcadas com dúvida.

### 📓 Tela 3: Caderno de Erros Inteligente (`/caderno`)
- Lista dinâmica de itens onde `acertou = false` OU `confianca = 'Duvida'` (e `dominada_no_caderno = false`).
- Filtros rápidos por Bloco (P1, P2, P3), Disciplina e busca por texto.
- **Modo Flash-Review 10 Minutos:** Oculta os textos longos dos enunciados e transforma o caderno em uma lista direta de bullets com as **Regras de Ouro** (ideal para revisão antes de dormir).
- **Modo Refazer Erros:** Permite rejulgar as questões às cegas sem visualizar o gabarito previamente, com botão `"✅ Já dominei"` para arquivar do caderno ativo.

### 📊 Tela 4: Dashboard & Cronograma Semanal (`/dashboard`)
- Barra de progresso rumo à meta de **1.750 itens até 13/12/2026**.
- Taxa de Acerto Líquido Cebraspe.
- **Alerta visual P3:** Dispara alerta destacado caso o aproveitamento líquido em Ciência de Dados fique abaixo de 30% líquidos / 54 pontos.
- Gráfico de barras com mapeamento de **Pontos Cegos** por disciplina.
- **Guia Visual do Cronograma Semanal CGU 2026:**
  - *Seg / Qua:* Estatística, Inferência & Governança / LGPD
  - *Ter / Qui:* Engenharia de Dados & Direito / Controle
  - *Sex / Sáb:* Machine Learning, IA / LLMs & Políticas Públicas
  - *Domingo:* Simulado Cronometrado + Caderno de Erros + Discursiva

### 📥 Tela 5: Abastecimento em Lote (`/importar`)
- Painel para colar arrays JSON de novas questões e disparar a inserção em lote (*bulk insert*) diretamente na tabela `questoes` com 1 clique.
- Contador em tempo real das questões cadastradas por bloco.
- Validação automática de sintaxe JSON com botão de exemplo pronto para testes.

---

## 5. Instalação e Execução Local

### Pré-requisitos
- **Node.js** v18+ (recomendado Node 20 ou 22)
- **npm**, **pnpm** ou **yarn**

### Passo a Passo:
1. Clone o repositório ou acerte a pasta do projeto:
   ```bash
   cd cgu
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Crie o arquivo `.env.local` na raiz com suas credenciais:
   ```bash
   cp .env.example .env.local
   ```

4. Preencha o `.env.local` com suas chaves do Supabase:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua-chave-publishable-ou-anon-aqui
   ```

5. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

6. Abra no navegador:
   ```
   http://localhost:3000
   ```

---

## 6. Configuração do Supabase (Passo a Passo)

1. Crie uma conta gratuita em [supabase.com](https://supabase.com) e inicie um novo projeto.
2. No menu lateral esquerdo, vá em **SQL Editor**.
3. Abra o arquivo local [`supabase/schema.sql`](file:///home/hianara/cgu/supabase/schema.sql) deste projeto.
4. Copie todo o conteúdo, cole no SQL Editor do Supabase e clique em **Run**.
5. As seguintes tabelas serão criadas com índices e políticas de Row Level Security (RLS) abertas:
   - `questoes`
   - `baterias_diarias`
   - `historico_respostas`
6. O script já insere automaticamente um **seed inicial de 15 questões inéditas e difíceis estilo Cebraspe** (5 de P1, 5 de P2 e 5 de P3).
7. Para obter as chaves:
   - Vá em **Project Settings** (ícone de engrenagem) -> **API**.
   - Copie a **Project URL** para `NEXT_PUBLIC_SUPABASE_URL`.
   - Copie a **Publishable Key** (ou `anon public`) para `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (ou `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

---

## 7. Deploy Imediato na Vercel

1. Suba o projeto para o seu repositório no GitHub:
   ```bash
   git add .
   git commit -m "feat: CGU 2026 simulator"
   git remote add origin https://github.com/SEU_USUARIO/cgu-2026-simulator.git
   git branch -M main
   git push -u origin main
   ```
2. Acesse [vercel.com](https://vercel.com) e clique em **Add New Project**.
3. Importe o repositório do GitHub.
4. Na seção **Environment Variables**, cadastre as mesmas variáveis do seu `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (ou `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
5. Clique em **Deploy**. O deploy será concluído em menos de 1 minuto!

---

## 8. Fábrica de Questões (Formato JSON para `/importar`)

Para abastecer o simulador continuamente, você pode colar no campo da tela `/importar` arrays JSON no seguinte padrão:

```json
[
  {
    "bloco": "P3",
    "disciplina": "Machine Learning e Modelagem Preditiva",
    "topico_edital": "Regularização L1 vs L2 (Lasso vs Ridge)",
    "enunciado": "Em modelos de regressão linear para detecção de fraudes em pagamentos, o regularizador Lasso (L1) adiciona uma penalidade proporcional à soma dos valores absolutos dos coeficientes, forçando coeficientes de atributos irrelevantes a se tornarem exatamente zero, executando seleção intrínseca de variáveis.",
    "gabarito": "C",
    "comentario": "Correto. O regularizador L1 gera cantos nas curvas de nível da função de perda, produzindo soluções esparsas e zerando parâmetros irrelevantes.",
    "regra_ouro": "Lasso (L1) penaliza valor absoluto e zera coeficientes (Feature Selection). Ridge (L2) apenas atenua.",
    "nivel": "Difícil"
  },
  {
    "bloco": "P2",
    "disciplina": "Governança e Gestão de Riscos",
    "topico_edital": "Modelo das Três Linhas do IIA",
    "enunciado": "No Modelo das Três Linhas do IIA, a função de auditoria interna compõe a segunda linha de defesa da organização, responsável pela conformidade e gestão direta dos riscos operacionais.",
    "gabarito": "E",
    "comentario": "A auditoria interna compõe a TERCEIRA linha, atuando com independência e avaliação objetiva. A 2ª linha cuida de conformidade, riscos e apoio técnico.",
    "regra_ouro": "1ª Linha: Operação | 2ª Linha: Conformidade e Riscos | 3ª Linha: Auditoria Interna Independente.",
    "nivel": "Média"
  }
]
```

---

## 9. Estrutura do Código-Fonte

```
cgu/
├── app/
│   ├── layout.tsx           # Layout raiz com fontes, PWA meta e navegação
│   ├── globals.css          # Estilos Tailwind + regras @media print em 2 colunas
│   ├── page.tsx             # Tela 1: Treino Mobile / Interativo
│   ├── papel/page.tsx       # Tela 2: Modo Papel (Impressão, String e Grade)
│   ├── caderno/page.tsx     # Tela 3: Caderno de Erros Inteligente
│   ├── dashboard/page.tsx   # Tela 4: Métricas Cebraspe e Cronograma Semanal
│   └── importar/page.tsx    # Tela 5: Importação em Lote via JSON
├── components/
│   └── Navigation.tsx       # Header superior, Sidebar desktop e Bottom Nav mobile
├── lib/
│   ├── types.ts             # Interfaces TypeScript (Questao, Bateria, Boletim)
│   ├── simulator.ts         # Fator de correção Cebraspe e Parser Regex
│   ├── seedData.ts          # 15 questões reais completas para fallback local
│   └── supabase.ts          # Cliente Supabase com sincronização e fallback offline
├── public/
│   ├── manifest.json        # Manifesto PWA
│   └── icon.svg             # Ícone do aplicativo
├── supabase/
│   └── schema.sql           # Schema SQL com tabelas, RLS e seed inicial
├── .env.example             # Template das variáveis de ambiente
├── .env.local               # Credenciais locais do Supabase
└── README.md                # Esta documentação completa
```

---

⭐ **Bons estudos rumo à aprovação na CGU 2026!**
