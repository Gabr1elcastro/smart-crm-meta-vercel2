// Script para verificar permissões das tabelas
// Execute este script no console do navegador

console.log('=== VERIFICAR PERMISSÕES DAS TABELAS ===');

try {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  // Verificar se o usuário está autenticado
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  console.log('Usuário autenticado:', !!session);
  if (session) {
    console.log('Email do usuário:', session.user.email);
  }

  // Testar diferentes operações na tabela clientes_info
  console.log('\n1. Testando operações na tabela clientes_info...');
  
  // SELECT
  try {
    const { data: selectData, error: selectError } = await supabase
      .from('clientes_info')
      .select('*')
      .limit(1);
    
    if (selectError) {
      console.log('❌ SELECT clientes_info:', selectError.message);
      console.log('   Código do erro:', selectError.code);
    } else {
      console.log('✅ SELECT clientes_info: OK');
      console.log('   Registros encontrados:', selectData?.length || 0);
    }
  } catch (err) {
    console.log('❌ SELECT clientes_info: Erro inesperado');
  }

  // Testar com query específica
  console.log('\n2. Testando query específica do serviço...');
  try {
    const { data: queryData, error: queryError } = await supabase
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
    
    if (queryError) {
      console.log('❌ Query específica:', queryError.message);
      console.log('   Código do erro:', queryError.code);
    } else {
      console.log('✅ Query específica: OK');
      console.log('   Registros encontrados:', queryData?.length || 0);
      if (queryData && queryData.length > 0) {
        console.log('   Primeiro registro:', queryData[0]);
      }
    }
  } catch (err) {
    console.log('❌ Query específica: Erro inesperado');
  }

  // Testar tabela atendentes
  console.log('\n3. Testando tabela atendentes...');
  try {
    const { data: atendentesData, error: atendentesError } = await supabase
      .from('atendentes')
      .select('*')
      .limit(1);
    
    if (atendentesError) {
      console.log('❌ SELECT atendentes:', atendentesError.message);
      console.log('   Código do erro:', atendentesError.code);
    } else {
      console.log('✅ SELECT atendentes: OK');
      console.log('   Registros encontrados:', atendentesData?.length || 0);
    }
  } catch (err) {
    console.log('❌ SELECT atendentes: Erro inesperado');
  }

  // Verificar se há dados de teste
  console.log('\n4. Verificando se há dados na tabela...');
  try {
    const { count, error: countError } = await supabase
      .from('clientes_info')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.log('❌ COUNT clientes_info:', countError.message);
    } else {
      console.log('✅ COUNT clientes_info:', count, 'registros');
    }
  } catch (err) {
    console.log('❌ COUNT clientes_info: Erro inesperado');
  }

} catch (error) {
  console.error('Erro geral:', error);
}

console.log('\n=== FIM DA VERIFICAÇÃO ===');
console.log('\n📋 POSSÍVEIS SOLUÇÕES:');
console.log('1. Se erro de permissão: Verifique RLS no Supabase');
console.log('2. Se tabela não existe: Verifique o nome correto');
console.log('3. Se não há dados: Insira dados de teste');
console.log('4. Se erro de conexão: Verifique as variáveis de ambiente'); 