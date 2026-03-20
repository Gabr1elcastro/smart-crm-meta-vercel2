// Script para testar as correções implementadas
import { createClient } from '@supabase/supabase-js';

// ⚠️ CONFIGURE SUAS CREDENCIAIS AQUI
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-supabase-url.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

if (supabaseUrl === 'https://your-supabase-url.supabase.co' || supabaseKey === 'your-supabase-anon-key') {
  console.error('❌ ERRO: Configure suas credenciais do Supabase!');
  console.log('📝 Edite o arquivo e substitua:');
  console.log('   - supabaseUrl pela URL do seu projeto');
  console.log('   - supabaseKey pela chave anônima do seu projeto');
  console.log('   - Ou configure as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testarCorrecoes() {
  console.log('🧪 TESTANDO CORREÇÕES DAS ETIQUETAS');
  console.log('===================================\n');

  try {
    // 1. TESTAR LIMPEZA DE ETIQUETAS ÓRFÃS
    console.log('1. 🔧 Testando limpeza de etiquetas órfãs...');
    
    // Buscar um cliente para teste
    const { data: clientes, error: clientesError } = await supabase
      .from('clientes_info')
      .select('id')
      .limit(1);
    
    if (clientesError || !clientes.length) {
      console.error('❌ Erro ao buscar clientes:', clientesError);
      return;
    }
    
    const clienteId = clientes[0].id;
    console.log(`   Testando com cliente ID: ${clienteId}`);
    
    // Executar limpeza
    const { data: resultadoLimpeza, error: limpezaError } = await supabase
      .rpc('limpar_todas_etiquetas_orfas_cliente', { cliente_id_param: clienteId });
    
    if (limpezaError) {
      console.error('❌ Erro na limpeza:', limpezaError);
    } else {
      console.log('✅ Limpeza executada:', resultadoLimpeza);
    }

    // 2. TESTAR FUNÇÃO DE ADICIONAR ETIQUETA
    console.log('\n2. ➕ Testando adição de etiqueta...');
    
    // Buscar um lead do cliente
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, nome, id_etiquetas')
      .eq('id_cliente', clienteId)
      .limit(1);
    
    if (leadsError || !leads.length) {
      console.error('❌ Erro ao buscar leads:', leadsError);
      return;
    }
    
    const lead = leads[0];
    console.log(`   Testando com lead: ${lead.nome} (ID: ${lead.id})`);
    
    // Buscar uma etiqueta disponível
    const { data: etiquetas, error: etiquetasError } = await supabase
      .from('etiquetas')
      .select('id, nome')
      .or(`id_cliente.eq.${clienteId},id_cliente.is.null`)
      .limit(1);
    
    if (etiquetasError || !etiquetas.length) {
      console.error('❌ Erro ao buscar etiquetas:', etiquetasError);
      return;
    }
    
    const etiqueta = etiquetas[0];
    console.log(`   Tentando adicionar etiqueta: ${etiqueta.nome} (ID: ${etiqueta.id})`);
    
    // Testar adição (se usando arrays)
    const { data: resultadoAdicao, error: adicaoError } = await supabase
      .rpc('adicionar_etiqueta_lead', { 
        lead_id_param: lead.id, 
        etiqueta_id_param: etiqueta.id 
      });
    
    if (adicaoError) {
      console.log('⚠️ Função de array não disponível, testando método tradicional...');
      
      // Método tradicional (string)
      const etiquetasAtuais = lead.id_etiquetas 
        ? lead.id_etiquetas.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
        : [];
      
      if (!etiquetasAtuais.includes(etiqueta.id)) {
        const novasEtiquetas = [...etiquetasAtuais, etiqueta.id];
        const novasEtiquetasString = novasEtiquetas.join(',');
        
        const { error: updateError } = await supabase
          .from('leads')
          .update({ id_etiquetas: novasEtiquetasString })
          .eq('id', lead.id);
        
        if (updateError) {
          console.error('❌ Erro ao adicionar etiqueta:', updateError);
        } else {
          console.log('✅ Etiqueta adicionada com sucesso!');
        }
      } else {
        console.log('ℹ️ Etiqueta já estava atribuída');
      }
    } else {
      console.log('✅ Etiqueta adicionada via função de array:', resultadoAdicao);
    }

    // 3. TESTAR CONSULTA DE ETIQUETAS
    console.log('\n3. 📋 Testando consulta de etiquetas...');
    
    const { data: etiquetasCliente, error: consultaError } = await supabase
      .from('etiquetas')
      .select('*')
      .or(`id_cliente.eq.${clienteId},id_cliente.is.null`)
      .order('created_at', { ascending: false });
    
    if (consultaError) {
      console.error('❌ Erro na consulta:', consultaError);
    } else {
      console.log(`✅ Encontradas ${etiquetasCliente.length} etiquetas:`);
      etiquetasCliente.forEach(e => {
        console.log(`   - ID ${e.id}: "${e.nome}" (${e.cor}) [Cliente: ${e.id_cliente || 'Sistema'}]`);
      });
    }

    // 4. TESTAR VIEW DE PROBLEMAS
    console.log('\n4. 🔍 Testando view de problemas...');
    
    const { data: problemas, error: problemasError } = await supabase
      .from('v_etiquetas_problemas')
      .select('*')
      .eq('id_cliente', clienteId)
      .limit(5);
    
    if (problemasError) {
      console.log('⚠️ View de problemas não disponível ainda');
    } else {
      console.log(`📊 Problemas encontrados: ${problemas.length}`);
      problemas.forEach(p => {
        console.log(`   Lead ${p.lead_id} (${p.lead_nome}):`);
        console.log(`     - Total: ${p.total_etiquetas}, Válidas: ${p.etiquetas_validas}, Órfãs: ${p.etiquetas_orfas}`);
      });
    }

    // 5. TESTAR NORMALIZAÇÃO DE DADOS
    console.log('\n5. 🔧 Testando normalização de dados...');
    
    // Verificar se há etiquetas com problemas de formato
    const { data: leadsComProblemas, error: problemasFormatError } = await supabase
      .from('leads')
      .select('id, nome, id_etiquetas')
      .eq('id_cliente', clienteId)
      .not('id_etiquetas', 'is', null)
      .not('id_etiquetas', 'eq', '')
      .or('id_etiquetas.like.% %') // Contém espaços
      .limit(5);
    
    if (problemasFormatError) {
      console.error('❌ Erro ao verificar problemas de formato:', problemasFormatError);
    } else if (leadsComProblemas.length > 0) {
      console.log(`⚠️ Encontrados ${leadsComProblemas.length} leads com problemas de formato:`);
      leadsComProblemas.forEach(l => {
        console.log(`   Lead ${l.id}: "${l.id_etiquetas}"`);
      });
    } else {
      console.log('✅ Nenhum problema de formato encontrado');
    }

    // 6. RELATÓRIO FINAL
    console.log('\n6. 📊 RELATÓRIO FINAL...');
    
    const { data: stats, error: statsError } = await supabase
      .from('leads')
      .select('id', { count: 'exact' })
      .eq('id_cliente', clienteId);
    
    const { data: statsComEtiquetas, error: statsEtiquetasError } = await supabase
      .from('leads')
      .select('id', { count: 'exact' })
      .eq('id_cliente', clienteId)
      .not('id_etiquetas', 'is', null)
      .not('id_etiquetas', 'eq', '');
    
    if (!statsError && !statsEtiquetasError) {
      console.log(`📈 Total de leads do cliente: ${stats.count}`);
      console.log(`📈 Leads com etiquetas: ${statsComEtiquetas.count}`);
      console.log(`📈 Percentual com etiquetas: ${((statsComEtiquetas.count / stats.count) * 100).toFixed(1)}%`);
    }

    console.log('\n✅ Teste concluído!');

  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

// Executar teste
testarCorrecoes();
