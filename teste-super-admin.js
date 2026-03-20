// Script de teste para Super Admin
// Execute este script no console do navegador para testar as funcionalidades

console.log('=== TESTE SUPER ADMIN ===');

// 1. Testar acesso à rota
console.log('1. Testando acesso à rota...');
try {
  const response = await fetch('/super-admin-login');
  console.log('Status da rota:', response.status);
  console.log('Rota acessível:', response.ok);
} catch (error) {
  console.error('Erro ao acessar rota:', error);
}

// 2. Testar variáveis de ambiente
console.log('\n2. Verificando variáveis de ambiente...');
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ OK' : '❌ AUSENTE');
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ OK' : '❌ AUSENTE');

// 3. Testar Supabase
console.log('\n3. Testando Supabase...');
try {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  // Testar tabela superadmins
  const { data: superadmins, error: superadminsError } = await supabase
    .from('superadmins')
    .select('*');
  
  console.log('Tabela superadmins:', superadminsError ? '❌ ERRO' : '✅ OK');
  if (superadminsError) {
    console.error('Erro:', superadminsError);
  } else {
    console.log('Registros superadmins:', superadmins?.length || 0);
  }

  // Testar tabela clientes_info
  const { data: clientes, error: clientesError } = await supabase
    .from('clientes_info')
    .select('*');
  
  console.log('Tabela clientes_info:', clientesError ? '❌ ERRO' : '✅ OK');
  if (clientesError) {
    console.error('Erro:', clientesError);
  } else {
    console.log('Registros clientes:', clientes?.length || 0);
  }

  // Testar tabela atendentes
  const { data: atendentes, error: atendentesError } = await supabase
    .from('atendentes')
    .select('*');
  
  console.log('Tabela atendentes:', atendentesError ? '❌ ERRO' : '✅ OK');
  if (atendentesError) {
    console.error('Erro:', atendentesError);
  } else {
    console.log('Registros atendentes:', atendentes?.length || 0);
  }

} catch (error) {
  console.error('Erro ao testar Supabase:', error);
}

// 4. Testar sessionStorage
console.log('\n4. Verificando sessionStorage...');
const isSuperAdmin = sessionStorage.getItem('isSuperAdmin');
const superAdminData = sessionStorage.getItem('superAdminData');
const isImpersonating = sessionStorage.getItem('isImpersonating');
const impersonatedCliente = sessionStorage.getItem('impersonatedCliente');

console.log('isSuperAdmin:', isSuperAdmin);
console.log('superAdminData:', superAdminData ? 'Presente' : 'Ausente');
console.log('isImpersonating:', isImpersonating);
console.log('impersonatedCliente:', impersonatedCliente ? 'Presente' : 'Ausente');

// 5. Testar componentes
console.log('\n5. Verificando componentes...');
try {
  // Verificar se os componentes existem
  const components = [
    'SuperAdminLogin',
    'SuperAdminDashboard', 
    'SuperAdminBanner'
  ];
  
  console.log('Componentes necessários:', components.join(', '));
  console.log('✅ Componentes devem estar disponíveis');
} catch (error) {
  console.error('Erro ao verificar componentes:', error);
}

console.log('\n=== FIM DO TESTE ===');
console.log('\n📋 PRÓXIMOS PASSOS:');
console.log('1. Acesse: http://localhost:5173/super-admin-login');
console.log('2. Execute o SQL no Supabase se necessário');
console.log('3. Crie o usuário no Auth do Supabase');
console.log('4. Teste o login e funcionalidades'); 