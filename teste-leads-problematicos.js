// Script para testar leads que podem ter problemas de etiquetas
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ltdkdeqxcgtuncgzsowt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0ZGtkZXF4Y2d0dW5jZ3pzb3d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcwODc2MTYsImV4cCI6MjA1MjY2MzYxNn0.t3bforHO5Y1jRt5ygCkdlhvAGc1WV9TNTLV7yruQMn0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testarLeadsProblematicos() {
  console.log('🔍 TESTANDO LEADS COM POSSÍVEIS PROBLEMAS');
  console.log('==========================================\n');

  try {
    // 1. BUSCAR LEADS QUE USAM ETIQUETAS DUPLICADAS
    console.log('1. 🔍 Buscando leads que usam etiquetas duplicadas...');
    
    const etiquetasDuplicadas = [10, 14, 15, 16, 17, 18, 19, 21, 26, 27];
    
    const { data: leadsProblematicos, error: leadsError } = await supabase
      .from('leads')
      .select('id, nome, id_etiquetas, id_cliente')
      .or(etiquetasDuplicadas.map(id => `id_etiquetas.like.%${id}%`).join(','))
      .limit(20);

    if (leadsError) {
      console.error('❌ Erro ao buscar leads:', leadsError);
      return;
    }

    console.log(`📊 Encontrados ${leadsProblematicos.length} leads que usam etiquetas duplicadas\n`);

    // 2. ANALISAR CADA LEAD PROBLEMÁTICO
    for (const lead of leadsProblematicos) {
      console.log(`🔍 LEAD: ${lead.nome} (ID: ${lead.id})`);
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

      // Identificar IDs problemáticos
      const idsProblematicos = idsEtiquetas.filter(id => etiquetasDuplicadas.includes(id));
      const idsNormais = idsEtiquetas.filter(id => !etiquetasDuplicadas.includes(id));

      if (idsProblematicos.length > 0) {
        console.log(`   ❌ PROBLEMA: IDs duplicados encontrados: [${idsProblematicos.join(', ')}]`);
      }

      if (idsNormais.length > 0) {
        console.log(`   ✅ IDs normais: [${idsNormais.join(', ')}]`);
      }

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

      // Verificar quais etiquetas seriam encontradas
      const etiquetasEncontradas = etiquetasDisponiveis.filter(e => idsEtiquetas.includes(e.id));
      const idsOrfaos = idsEtiquetas.filter(id => !etiquetasDisponiveis.find(e => e.id === id));

      if (idsOrfaos.length > 0) {
        console.log(`   ❌ IDs órfãos: [${idsOrfaos.join(', ')}]`);
      }

      if (etiquetasEncontradas.length > 0) {
        console.log(`   ✅ Etiquetas que seriam exibidas:`);
        etiquetasEncontradas.forEach(e => {
          console.log(`      - ID ${e.id}: "${e.nome}" (${e.cor}) [Cliente: ${e.id_cliente || 'Sistema'}]`);
        });
      } else {
        console.log(`   ❌ NENHUMA ETIQUETA SERIA EXIBIDA!`);
      }

      console.log(''); // Linha em branco
    }

    // 3. TESTAR COMPONENTE EtiquetasDisplay SIMULADO
    console.log('\n3. 🎨 Simulando componente EtiquetasDisplay...');
    
    let leadsSemEtiquetas = 0;
    let leadsComEtiquetas = 0;

    for (const lead of leadsProblematicos) {
      const ids = lead.id_etiquetas
        .split(',')
        .map(id => id.trim())
        .filter(id => id !== '')
        .map(id => parseInt(id))
        .filter(id => !isNaN(id));

      // Buscar etiquetas disponíveis
      const { data: etiquetasDisponiveis } = await supabase
        .from('etiquetas')
        .select('*')
        .or(`id_cliente.eq.${lead.id_cliente},id_cliente.is.null`);

      const etiquetasDoLead = etiquetasDisponiveis.filter(etiqueta => ids.includes(etiqueta.id));

      if (etiquetasDoLead.length === 0) {
        leadsSemEtiquetas++;
        console.log(`   ❌ ${lead.nome}: Nenhuma etiqueta seria exibida`);
      } else {
        leadsComEtiquetas++;
        console.log(`   ✅ ${lead.nome}: ${etiquetasDoLead.length} etiqueta(s) seria(m) exibida(s)`);
      }
    }

    console.log(`\n📊 RESULTADO:`);
    console.log(`   Leads que exibiriam etiquetas: ${leadsComEtiquetas}`);
    console.log(`   Leads que NÃO exibiriam etiquetas: ${leadsSemEtiquetas}`);

    // 4. SUGESTÕES DE CORREÇÃO
    console.log('\n4. 💡 SUGESTÕES DE CORREÇÃO...');
    
    if (leadsSemEtiquetas > 0) {
      console.log(`⚠️ ${leadsSemEtiquetas} leads têm problemas de etiquetas`);
      console.log('🔧 Execute o script SQL de correção de duplicatas');
      console.log('📝 Arquivo: corrigir-duplicatas-especificas.sql');
    } else {
      console.log('✅ Todos os leads testados estão funcionando corretamente');
    }

    // 5. VERIFICAR ETIQUETAS DUPLICADAS ATUAIS
    console.log('\n5. 🔍 Verificando etiquetas duplicadas atuais...');
    
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
      console.log(`❌ Ainda existem ${duplicatas.length} duplicatas:`);
      duplicatas.forEach(([nome, etiquetas]) => {
        console.log(`   "${nome}":`);
        etiquetas.forEach(e => {
          console.log(`      - ID ${e.id}: "${e.nome}" (${e.cor}) [Cliente: ${e.id_cliente || 'Sistema'}]`);
        });
      });
    } else {
      console.log('✅ Nenhuma duplicata encontrada!');
    }

    console.log('\n✅ Teste concluído!');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar teste
testarLeadsProblematicos();
