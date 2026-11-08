const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 1. Carrega variáveis de ambiente do .env.local
const envPath = path.join(__dirname, '../.env.local');
if (!fs.existsSync(envPath)) {
  console.error('Arquivo .env.local não encontrado.');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach((line) => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim();
});

const url = env['NEXT_PUBLIC_SUPABASE_URL'];
const key = env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'] || env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

if (!url || !key) {
  console.error('Credenciais do Supabase não encontradas no .env.local.');
  process.exit(1);
}

const supabase = createClient(url, key);

async function injetarLote(arquivoJson) {
  const caminhoArquivo = path.isAbsolute(arquivoJson)
    ? arquivoJson
    : path.join(__dirname, arquivoJson);

  if (!fs.existsSync(caminhoArquivo)) {
    console.error(`Arquivo não encontrado: ${caminhoArquivo}`);
    process.exit(1);
  }

  const questoesRaw = fs.readFileSync(caminhoArquivo, 'utf8');
  const questoes = JSON.parse(questoesRaw);

  console.log(`\nInjetando lote de ${questoes.length} questões no Supabase (${url})...`);

  const { data, error } = await supabase.from('questoes').insert(questoes).select();

  if (error) {
    console.error('Erro na inserção do lote:', error);
    process.exit(1);
  }

  console.log(`✅ Sucesso! ${data?.length || questoes.length} questões inseridas no banco.`);

  // Estatísticas atualizadas do banco
  const { data: todas, error: errTotal } = await supabase.from('questoes').select('bloco');
  if (!errTotal && todas) {
    const p1 = todas.filter((q) => q.bloco === 'P1').length;
    const p2 = todas.filter((q) => q.bloco === 'P2').length;
    const p3 = todas.filter((q) => q.bloco === 'P3').length;
    console.log('\n📊 ESTADO ATUAL DO SEU BANCO DE QUESTÕES:');
    console.log(`   - Bloco P1 (Conhecimentos Básicos): ${p1}`);
    console.log(`   - Bloco P2 (Conhecimentos Complementares): ${p2}`);
    console.log(`   - Bloco P3 (Ciência de Dados - Peso 2.0): ${p3}`);
    console.log(`   - TOTAL GERAL: ${todas.length} questões cadastradas.\n`);
  }
}

const arquivoAlvo = process.argv[2] || 'lote_01_p3.json';
injetarLote(arquivoAlvo);
