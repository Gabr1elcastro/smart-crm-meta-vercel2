// Script para testar especificamente a tabela clientes_info
// Execute este script no console do navegador

console.log('=== TESTE ESPECÍFICO TABELA CLIENTES_INFO ===');

try {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  console.log('1. Testando conexão básica...');
  
  // Teste 1: Query simples
  const { data: test1, error: error1 } = await supabase
    .from('clientes_info')
    .select('*')
    .limit(1);
  
  console.log('Query simples:', error1 ? '❌ ERRO' : '✅ OK');
  if (error1) {
    console.error('Erro:', error1.message);
    console.error('Código:', error1.code);
  } else {
    console.log('Registros encontrados:', test1?.length || 0);
  }

  console.log('\n2. Testando query com colunas específicas...');
  
  // Teste 2: Query com colunas específicas
  const { data: test2, error: error2 } = await supabase
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
    .limit(1);
  
  console.log('Query com colunas:', error2 ? '❌ ERRO' : '✅ OK');
  if (error2) {
    console.error('Erro:', error2.message);
    console.error('Código:', error2.code);
  } else {
    console.log('Registros encontrados:', test2?.length || 0);
    if (test2 && test2.length > 0) {
      console.log('Primeiro registro:', test2[0]);
    }
  }

  console.log('\n3. Testando query completa...');
  
  // Teste 3: Query completa
  const { data: test3, error: error3 } = await supabase
    .from('clientes_info')
    .select(`
      id,
      nome,
      email,
      telefone,
      status,
      criado_em,
      plano
    `);
  
  console.log('Query completa:', error3 ? '❌ ERRO' : '✅ OK');
  if (error3) {
    console.error('Erro:', error3.message);
    console.error('Código:', error3.code);
  } else {
    console.log('Total de registros:', test3?.length || 0);
  }

  console.log('\n4. Testando ordenação...');
  
  // Teste 4: Query com ordenação
  const { data: test4, error: error4 } = await supabase
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
    .order('criado_em', { ascending: false })
    .limit(5);
  
  console.log('Query com ordenação:', error4 ? '❌ ERRO' : '✅ OK');
  if (error4) {
    console.error('Erro:', error4.message);
    console.error('Código:', error4.code);
  } else {
    console.log('Registros ordenados:', test4?.length || 0);
  }

  console.log('\n5. Verificando estrutura da tabela...');
  
  // Teste 5: Verificar se todas as colunas existem
  const colunasEsperadas = ['id', 'nome', 'email', 'telefone', 'status', 'criado_em', 'plano'];
  
  for (const coluna of colunasEsperadas) {
    try {
      const { data: testColuna, error: errorColuna } = await supabase
        .from('clientes_info')
        .select(coluna)
        .limit(1);
      
      if (errorColuna) {
        console.log(`❌ Coluna ${coluna}: ${errorColuna.message}`);
      } else {
        console.log(`✅ Coluna ${coluna}: OK`);
      }
    } catch (err) {
      console.log(`❌ Coluna ${coluna}: Erro ao testar`);
    }
  }

} catch (error) {
  console.error('Erro geral:', error);
}

console.log('\n=== FIM DO TESTE ===');
console.log('\n📋 PRÓXIMOS PASSOS:');
console.log('1. Se todos os testes passaram: O problema pode ser RLS');
console.log('2. Se algum teste falhou: Verifique a estrutura da tabela');
console.log('3. Se erro 400: Pode ser problema de permissões');
console.log('4. Se erro 404: Tabela não existe'); 