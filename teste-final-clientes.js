// Script de teste final para verificar carregamento de clientes
// Execute este script no console do navegador

console.log('=== TESTE FINAL - CARREGAMENTO DE CLIENTES ===');

try {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  console.log('1. Testando query com estrutura real...');
  
  // Teste com a estrutura real da tabela
  const { data: clientes, error } = await supabase
    .from('clientes_info')
    .select(`
      id,
      created_at,
      name,
      email,
      user_id_auth,
      instance_id,
      sender_number,
      instance_name,
      apikey,
      atendimento_humano,
      atendimento_ia,
      prompt_type,
      id_chatbot,
      phone,
      atualizando_relatorio,
      id_departamento_padrao,
      instance_id_2,
      instance_name_2,
      sender_number_2,
      atendimento_humano_2,
      atendimento_ia_2,
      data_hora_atualizacao_relatorio,
      id_departamento_chip_1,
      id_departamento_chip_2
    `)
    .order('created_at', { ascending: false });

  console.log('Query com estrutura real:', error ? '❌ ERRO' : '✅ OK');
  if (error) {
    console.error('Erro:', error.message);
    console.error('Código:', error.code);
  } else {
    console.log('Total de clientes:', clientes?.length || 0);
    if (clientes && clientes.length > 0) {
      console.log('Primeiro cliente:', clientes[0]);
    }
  }

  console.log('\n2. Testando estatísticas...');
  
  // Teste das estatísticas
  const { data: clientesStats, error: clientesError } = await supabase
    .from('clientes_info')
    .select('*');

  const { data: atendentes, error: atendentesError } = await supabase
    .from('atendentes')
    .select('*');

  if (clientesError || atendentesError) {
    console.log('❌ Erro nas estatísticas:', { clientesError, atendentesError });
  } else {
    const clientesData = clientesStats || [];
    const atendentesData = atendentes || [];
    
    const estatisticas = {
      totalClientes: clientesData.length,
      clientesAtivos: clientesData.filter(c => c.atendimento_humano === true).length,
      clientesSuspensos: clientesData.filter(c => c.atendimento_humano === false).length,
      totalUsuarios: clientesData.length + atendentesData.length,
    };
    
    console.log('✅ Estatísticas calculadas:', estatisticas);
  }

  console.log('\n3. Testando busca por nome...');
  
  // Teste de busca
  const { data: buscaResult, error: buscaError } = await supabase
    .from('clientes_info')
    .select('id, name, email, phone')
    .ilike('name', '%Bruno%')
    .limit(5);

  console.log('Busca por nome:', buscaError ? '❌ ERRO' : '✅ OK');
  if (buscaError) {
    console.error('Erro na busca:', buscaError.message);
  } else {
    console.log('Resultados da busca:', buscaResult?.length || 0);
  }

  console.log('\n4. Verificando campos obrigatórios...');
  
  // Verificar se os campos principais existem
  const camposObrigatorios = ['id', 'name', 'email', 'created_at', 'atendimento_humano'];
  
  for (const campo of camposObrigatorios) {
    try {
      const { data: testCampo, error: errorCampo } = await supabase
        .from('clientes_info')
        .select(campo)
        .limit(1);
      
      if (errorCampo) {
        console.log(`❌ Campo ${campo}: ${errorCampo.message}`);
      } else {
        console.log(`✅ Campo ${campo}: OK`);
      }
    } catch (err) {
      console.log(`❌ Campo ${campo}: Erro ao testar`);
    }
  }

} catch (error) {
  console.error('Erro geral:', error);
}

console.log('\n=== FIM DO TESTE ===');
console.log('\n📋 RESULTADO:');
console.log('Se todos os testes passaram: ✅ Sistema funcionando');
console.log('Se algum teste falhou: ❌ Verifique os erros acima');
console.log('\n🎯 PRÓXIMOS PASSOS:');
console.log('1. Teste o dashboard do super admin');
console.log('2. Verifique se os clientes aparecem na lista');
console.log('3. Teste a funcionalidade de impersonação'); 