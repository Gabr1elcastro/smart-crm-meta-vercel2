// Script completo para diagnosticar problemas das etiquetas
import { createClient } from '@supabase/supabase-js';

// ⚠️ CONFIGURE SUAS CREDENCIAIS AQUI
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (supabaseUrl === 'https://your-supabase-url.supabase.co' || supabaseKey === 'your-supabase-anon-key') {
  console.error('❌ ERRO: Configure suas credenciais do Supabase!');
  console.log('📝 Edite o arquivo e substitua:');
  console.log('   - supabaseUrl pela URL do seu projeto');
  console.log('   - supabaseKey pela chave anônima do seu projeto');
  console.log('   - Ou configure as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnosticarEtiquetas() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DE ETIQUETAS');
  console.log('=====================================\n');

  try {
    // 1. ANALISAR LEADS COM ETIQUETAS PROBLEMÁTICAS
    console.log('1. 📋 ANALISANDO LEADS COM ETIQUETAS...');
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, nome, id_etiquetas, id_cliente')
      .not('id_etiquetas', 'is', null)
      .not('id_etiquetas', 'eq', '')
      .limit(10);
    
    if (leadsError) {
      console.error('❌ Erro ao buscar leads:', leadsError);
      return;
    }

    console.log(`📊 Encontrados ${leads.length} leads com etiquetas\n`);

    // 2. ANALISAR CADA LEAD INDIVIDUALMENTE
    for (const lead of leads) {
      console.log(`\n🔍 LEAD: ${lead.nome} (ID: ${lead.id})`);
      console.log(`   Cliente: ${lead.id_cliente}`);
      console.log(`   id_etiquetas: "${lead.id_etiquetas}"`);
      
      // Parsear IDs das etiquetas
      const idsEtiquetas = lead.id_etiquetas
        .split(',')
        .map(id => id.trim())
        .filter(id => id !== '')
        .map(id => parseInt(id))
        .filter(id => !isNaN(id));
      
      console.log(`   IDs parseados: [${idsEtiquetas.join(', ')}]`);

      // Buscar etiquetas disponíveis para este cliente
      const { data: etiquetasDisponiveis, error: etiquetasError } = await supabase
        .from('etiquetas')
        .select('*')
        .or(`id_cliente.eq.${lead.id_cliente},id_cliente.is.null`)
        .order('created_at', { ascending: false });

      if (etiquetasError) {
        console.error('   ❌ Erro ao buscar etiquetas:', etiquetasError);
        continue;
      }

      console.log(`   Etiquetas disponíveis: ${etiquetasDisponiveis.length}`);
      console.log(`   IDs disponíveis: [${etiquetasDisponiveis.map(e => e.id).join(', ')}]`);

      // Verificar IDs órfãos
      const idsOrfaos = idsEtiquetas.filter(id => !etiquetasDisponiveis.find(e => e.id === id));
      const idsValidos = idsEtiquetas.filter(id => etiquetasDisponiveis.find(e => e.id === id));

      if (idsOrfaos.length > 0) {
        console.log(`   ❌ PROBLEMA: IDs órfãos encontrados: [${idsOrfaos.join(', ')}]`);
      } else {
        console.log(`   ✅ Todos os IDs são válidos`);
      }

      // Mostrar etiquetas encontradas
      const etiquetasEncontradas = etiquetasDisponiveis.filter(e => idsValidos.includes(e.id));
      if (etiquetasEncontradas.length > 0) {
        console.log(`   ✅ Etiquetas encontradas:`);
        etiquetasEncontradas.forEach(e => {
          console.log(`      - ID ${e.id}: "${e.nome}" (${e.cor}) [Cliente: ${e.id_cliente || 'Sistema'}]`);
        });
      }
    }

    // 3. ANALISAR DUPLICATAS DE NOMES
    console.log('\n\n2. 🔍 ANALISANDO DUPLICATAS DE NOMES...');
    const { data: todasEtiquetas, error: todasError } = await supabase
      .from('etiquetas')
      .select('*')
      .order('nome');

    if (todasError) {
      console.error('❌ Erro ao buscar todas as etiquetas:', todasError);
      return;
    }

    // Agrupar por nome normalizado
    const gruposPorNome = {};
    todasEtiquetas.forEach(etiqueta => {
      const nomeNormalizado = etiqueta.nome.toLowerCase().trim();
      if (!gruposPorNome[nomeNormalizado]) {
        gruposPorNome[nomeNormalizado] = [];
      }
      gruposPorNome[nomeNormalizado].push(etiqueta);
    });

    // Encontrar duplicatas
    const duplicatas = Object.entries(gruposPorNome).filter(([nome, etiquetas]) => etiquetas.length > 1);
    
    if (duplicatas.length > 0) {
      console.log(`❌ Encontradas ${duplicatas.length} duplicatas:`);
      duplicatas.forEach(([nome, etiquetas]) => {
        console.log(`   "${nome}":`);
        etiquetas.forEach(e => {
          console.log(`      - ID ${e.id}: "${e.nome}" (${e.cor}) [Cliente: ${e.id_cliente || 'Sistema'}]`);
        });
      });
    } else {
      console.log('✅ Nenhuma duplicata encontrada');
    }

    // 4. ANALISAR FORMATO DOS IDs
    console.log('\n\n3. 🔍 ANALISANDO FORMATO DOS id_etiquetas...');
    const { data: leadsComEtiquetasFormat, error: formatError } = await supabase
      .from('leads')
      .select('id, nome, id_etiquetas')
      .not('id_etiquetas', 'is', null)
      .not('id_etiquetas', 'eq', '')
      .limit(20);

    if (formatError) {
      console.error('❌ Erro ao buscar leads:', formatError);
      return;
    }

    console.log('📊 Análise de formato dos id_etiquetas:');
    leadsComEtiquetasFormat.forEach(lead => {
      const temEspacos = lead.id_etiquetas.includes(' ');
      const temVazios = lead.id_etiquetas.includes(',,') || lead.id_etiquetas.startsWith(',') || lead.id_etiquetas.endsWith(',');
      const temLetras = /[a-zA-Z]/.test(lead.id_etiquetas);
      
      if (temEspacos || temVazios || temLetras) {
        console.log(`   ❌ Lead ${lead.id} (${lead.nome}): "${lead.id_etiquetas}"`);
        if (temEspacos) console.log('      - Contém espaços');
        if (temVazios) console.log('      - Contém vírgulas vazias');
        if (temLetras) console.log('      - Contém letras');
      }
    });

    // 5. ESTATÍSTICAS GERAIS
    console.log('\n\n4. 📊 ESTATÍSTICAS GERAIS...');
    
    const totalLeads = await supabase.from('leads').select('id', { count: 'exact' });
    const leadsComEtiquetas = await supabase.from('leads').select('id', { count: 'exact' })
      .not('id_etiquetas', 'is', null)
      .not('id_etiquetas', 'eq', '');
    const totalEtiquetas = await supabase.from('etiquetas').select('id', { count: 'exact' });
    const etiquetasSistema = await supabase.from('etiquetas').select('id', { count: 'exact' })
      .is('id_cliente', null);

    console.log(`📈 Total de leads: ${totalLeads.count}`);
    console.log(`📈 Leads com etiquetas: ${leadsComEtiquetas.count}`);
    console.log(`📈 Total de etiquetas: ${totalEtiquetas.count}`);
    console.log(`📈 Etiquetas do sistema: ${etiquetasSistema.count}`);
    console.log(`📈 Etiquetas personalizadas: ${totalEtiquetas.count - etiquetasSistema.count}`);

    // 6. SUGESTÕES DE CORREÇÃO
    console.log('\n\n5. 💡 SUGESTÕES DE CORREÇÃO...');
    
    if (duplicatas.length > 0) {
      console.log('🔧 CORREÇÃO 1: Remover duplicatas de etiquetas');
      console.log('   - Identificar etiquetas duplicadas por nome');
      console.log('   - Manter apenas uma versão (preferencialmente a mais antiga)');
      console.log('   - Atualizar leads que usam etiquetas removidas');
    }
    
    console.log('🔧 CORREÇÃO 2: Limpar IDs órfãos');
    console.log('   - Executar limparTodasEtiquetasOrfas() para cada cliente');
    console.log('   - Remover IDs que não existem mais');
    
    console.log('🔧 CORREÇÃO 3: Normalizar formato dos id_etiquetas');
    console.log('   - Remover espaços extras');
    console.log('   - Remover vírgulas vazias');
    console.log('   - Validar que contém apenas números');
    
    console.log('🔧 CORREÇÃO 4: Migrar para array de inteiros');
    console.log('   - Alterar tipo da coluna id_etiquetas para int[]');
    console.log('   - Converter strings existentes para arrays');
    console.log('   - Atualizar código frontend para trabalhar com arrays');

  } catch (error) {
    console.error('❌ Erro geral no diagnóstico:', error);
  }
}

// Executar diagnóstico
diagnosticarEtiquetas();
