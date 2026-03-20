// Script para testar etiquetas diretamente no navegador
// Cole este código no console do navegador quando estiver na aplicação

async function testarEtiquetasNoBrowser() {
  console.log('🧪 TESTANDO ETIQUETAS NO NAVEGADOR');
  console.log('==================================\n');

  try {
    // Verificar se estamos na aplicação correta
    if (typeof window.supabase === 'undefined') {
      console.error('❌ Supabase não encontrado. Execute este script na aplicação SmartCRM.');
      return;
    }

    const supabase = window.supabase;

    // 1. TESTAR BUSCA DE ETIQUETAS
    console.log('1. 📋 Testando busca de etiquetas...');
    
    // Buscar um cliente para teste
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ Usuário não logado');
      return;
    }

    console.log(`   Usuário logado: ${user.email}`);
    console.log(`   ID Cliente: ${user.user_metadata?.id_cliente}`);

    if (!user.user_metadata?.id_cliente) {
      console.error('❌ ID do cliente não encontrado no usuário');
      return;
    }

    const clienteId = user.user_metadata.id_cliente;

    // Buscar etiquetas do cliente
    const { data: etiquetas, error: etiquetasError } = await supabase
      .from('etiquetas')
      .select('*')
      .or(`id_cliente.eq.${clienteId},id_cliente.is.null`)
      .order('created_at', { ascending: false });

    if (etiquetasError) {
      console.error('❌ Erro ao buscar etiquetas:', etiquetasError);
      return;
    }

    console.log(`✅ Encontradas ${etiquetas.length} etiquetas:`);
    etiquetas.forEach(e => {
      console.log(`   - ID ${e.id}: "${e.nome}" (${e.cor}) [Cliente: ${e.id_cliente || 'Sistema'}]`);
    });

    // 2. TESTAR LEADS COM ETIQUETAS
    console.log('\n2. 🔍 Testando leads com etiquetas...');
    
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, nome, id_etiquetas, id_cliente')
      .eq('id_cliente', clienteId)
      .not('id_etiquetas', 'is', null)
      .not('id_etiquetas', 'eq', '')
      .limit(5);

    if (leadsError) {
      console.error('❌ Erro ao buscar leads:', leadsError);
      return;
    }

    console.log(`📊 Encontrados ${leads.length} leads com etiquetas:`);

    for (const lead of leads) {
      console.log(`\n   Lead: ${lead.nome} (ID: ${lead.id})`);
      console.log(`   id_etiquetas: "${lead.id_etiquetas}"`);

      // Parsear IDs das etiquetas
      const idsEtiquetas = lead.id_etiquetas
        .split(',')
        .map(id => id.trim())
        .filter(id => id !== '')
        .map(id => parseInt(id))
        .filter(id => !isNaN(id));

      console.log(`   IDs parseados: [${idsEtiquetas.join(', ')}]`);

      // Verificar quais etiquetas foram encontradas
      const etiquetasEncontradas = etiquetas.filter(e => idsEtiquetas.includes(e.id));
      const idsOrfaos = idsEtiquetas.filter(id => !etiquetas.find(e => e.id === id));

      if (idsOrfaos.length > 0) {
        console.log(`   ❌ PROBLEMA: IDs órfãos: [${idsOrfaos.join(', ')}]`);
      } else {
        console.log(`   ✅ Todos os IDs são válidos`);
      }

      if (etiquetasEncontradas.length > 0) {
        console.log(`   ✅ Etiquetas encontradas:`);
        etiquetasEncontradas.forEach(e => {
          console.log(`      - "${e.nome}" (${e.cor})`);
        });
      } else {
        console.log(`   ❌ Nenhuma etiqueta encontrada!`);
      }
    }

    // 3. TESTAR FUNÇÃO DE LIMPEZA
    console.log('\n3. 🔧 Testando limpeza de etiquetas órfãs...');
    
    try {
      const { data: resultadoLimpeza, error: limpezaError } = await supabase
        .rpc('limpar_todas_etiquetas_orfas_cliente', { cliente_id_param: clienteId });

      if (limpezaError) {
        console.log('⚠️ Função de limpeza não disponível:', limpezaError.message);
        console.log('   Execute o script SQL de correção primeiro');
      } else {
        console.log('✅ Limpeza executada:', resultadoLimpeza);
      }
    } catch (error) {
      console.log('⚠️ Função de limpeza não disponível:', error.message);
    }

    // 4. TESTAR COMPONENTE EtiquetasDisplay
    console.log('\n4. 🎨 Testando componente EtiquetasDisplay...');
    
    // Simular dados de um lead
    const leadTeste = leads[0];
    if (leadTeste) {
      console.log(`   Testando com lead: ${leadTeste.nome}`);
      console.log(`   id_etiquetas: "${leadTeste.id_etiquetas}"`);
      
      // Simular a lógica do componente
      const ids = leadTeste.id_etiquetas
        .split(',')
        .map(id => id.trim())
        .filter(id => id !== '')
        .map(id => parseInt(id))
        .filter(id => !isNaN(id));

      const etiquetasDoLead = etiquetas.filter(etiqueta => ids.includes(etiqueta.id));
      
      console.log(`   Etiquetas que seriam exibidas: ${etiquetasDoLead.length}`);
      etiquetasDoLead.forEach(e => {
        console.log(`      - "${e.nome}" (${e.cor})`);
      });

      if (etiquetasDoLead.length === 0) {
        console.log(`   ❌ PROBLEMA: Nenhuma etiqueta seria exibida!`);
        console.log(`   🔍 Possíveis causas:`);
        console.log(`      - IDs órfãos: ${ids.filter(id => !etiquetas.find(e => e.id === id))}`);
        console.log(`      - Problema de parsing: ${leadTeste.id_etiquetas}`);
      } else {
        console.log(`   ✅ Componente funcionaria corretamente`);
      }
    }

    // 5. RELATÓRIO FINAL
    console.log('\n5. 📊 RELATÓRIO FINAL...');
    
    const totalLeads = await supabase
      .from('leads')
      .select('id', { count: 'exact' })
      .eq('id_cliente', clienteId);

    const leadsComEtiquetas = await supabase
      .from('leads')
      .select('id', { count: 'exact' })
      .eq('id_cliente', clienteId)
      .not('id_etiquetas', 'is', null)
      .not('id_etiquetas', 'eq', '');

    console.log(`📈 Total de leads: ${totalLeads.count}`);
    console.log(`📈 Leads com etiquetas: ${leadsComEtiquetas.count}`);
    console.log(`📈 Percentual: ${((leadsComEtiquetas.count / totalLeads.count) * 100).toFixed(1)}%`);

    // 6. SUGESTÕES
    console.log('\n6. 💡 SUGESTÕES...');
    
    const leadsComProblemas = leads.filter(lead => {
      const ids = lead.id_etiquetas.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      const etiquetasValidas = etiquetas.filter(e => ids.includes(e.id));
      return etiquetasValidas.length === 0;
    });

    if (leadsComProblemas.length > 0) {
      console.log(`⚠️ ${leadsComProblemas.length} leads têm problemas de etiquetas`);
      console.log('🔧 Execute o script SQL de correção para resolver');
    } else {
      console.log('✅ Todos os leads testados estão funcionando corretamente');
    }

    console.log('\n✅ Teste concluído!');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar teste
testarEtiquetasNoBrowser();
