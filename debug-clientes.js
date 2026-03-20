// Script para debugar carregamento de clientes
// Execute este script no console do navegador

console.log('=== DEBUG CARREGAMENTO DE CLIENTES ===');

// 1. Verificar variáveis de ambiente
console.log('1. Verificando variáveis de ambiente...');
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ OK' : '❌ AUSENTE');
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ OK' : '❌ AUSENTE');

// 2. Testar conexão com Supabase
console.log('\n2. Testando conexão com Supabase...');
try {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  // Testar tabela clientes_info
  console.log('Testando tabela clientes_info...');
  const { data: clientes, error: clientesError } = await supabase
    .from('clientes_info')
    .select('*');
  
  console.log('Tabela clientes_info:', clientesError ? '❌ ERRO' : '✅ OK');
  if (clientesError) {
    console.error('Erro na tabela clientes_info:', clientesError);
  } else {
    console.log('Registros encontrados:', clientes?.length || 0);
    if (clientes && clientes.length > 0) {
      console.log('Primeiro cliente:', clientes[0]);
    }
  }

  // Testar query específica do serviço
  console.log('\n3. Testando query do serviço...');
  const { data: clientesServico, error: servicoError } = await supabase
    .from('clientes_info')
    .select(`
      id,
      nome,
      email,
      telefone,
      status,
      criado_em,
      plano
    `)
    .order('criado_em', { ascending: false });

  console.log('Query do serviço:', servicoError ? '❌ ERRO' : '✅ OK');
  if (servicoError) {
    console.error('Erro na query do serviço:', servicoError);
  } else {
    console.log('Registros da query do serviço:', clientesServico?.length || 0);
  }

  // Testar tabela atendentes
  console.log('\n4. Testando tabela atendentes...');
  const { data: atendentes, error: atendentesError } = await supabase
    .from('atendentes')
    .select('*');
  
  console.log('Tabela atendentes:', atendentesError ? '❌ ERRO' : '✅ OK');
  if (atendentesError) {
    console.error('Erro na tabela atendentes:', atendentesError);
  } else {
    console.log('Registros atendentes:', atendentes?.length || 0);
  }

} catch (error) {
  console.error('Erro ao testar Supabase:', error);
}

// 5. Verificar se o serviço está sendo chamado
console.log('\n5. Verificando chamada do serviço...');
try {
  // Simular chamada do serviço
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  // Testar getClientes
  console.log('Testando getClientes...');
  const { data: clientesData, error } = await supabase
    .from('clientes_info')
    .select(`
      id,
      nome,
      email,
      telefone,
      status,
      criado_em,
      plano
    `)
    .order('criado_em', { ascending: false });

  if (error) {
    console.error('Erro em getClientes:', error);
  } else {
    console.log('getClientes retornou:', clientesData?.length || 0, 'registros');
  }

  // Testar getEstatisticas
  console.log('Testando getEstatisticas...');
  const { data: clientes, error: clientesError } = await supabase
    .from('clientes_info')
    .select('*');

  const { data: atendentes, error: atendentesError } = await supabase
    .from('atendentes')
    .select('*');

  if (clientesError || atendentesError) {
    console.error('Erro em getEstatisticas:', { clientesError, atendentesError });
  } else {
    const clientesData = clientes || [];
    const atendentesData = atendentes || [];
    
    const estatisticas = {
      totalClientes: clientesData.length,
      clientesAtivos: clientesData.filter(c => c.status?.toLowerCase() === 'ativo').length,
      clientesSuspensos: clientesData.filter(c => c.status?.toLowerCase() === 'suspenso').length,
      totalUsuarios: clientesData.length + atendentesData.length,
    };
    
    console.log('Estatísticas calculadas:', estatisticas);
  }

} catch (error) {
  console.error('Erro ao testar serviço:', error);
}

console.log('\n=== FIM DO DEBUG ===');
console.log('\n📋 PRÓXIMOS PASSOS:');
console.log('1. Verifique se a tabela clientes_info existe');
console.log('2. Verifique se há dados na tabela');
console.log('3. Verifique as permissões da tabela');
console.log('4. Teste o dashboard novamente'); 