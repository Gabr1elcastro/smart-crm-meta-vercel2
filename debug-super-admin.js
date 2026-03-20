// Script de diagnóstico para Super Admin
// Execute este script no console do navegador para verificar possíveis problemas

console.log('=== DIAGNÓSTICO SUPER ADMIN ===');

// 1. Verificar se as rotas estão acessíveis
console.log('1. Testando acesso à rota /super-admin-login...');
try {
  const response = await fetch('/super-admin-login');
  console.log('Status da rota:', response.status);
  console.log('Rota acessível:', response.ok);
} catch (error) {
  console.error('Erro ao acessar rota:', error);
}

// 2. Verificar variáveis de ambiente
console.log('\n2. Verificando variáveis de ambiente...');
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? 'Presente' : 'Ausente');
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Presente' : 'Ausente');

// 3. Verificar se o Supabase está funcionando
console.log('\n3. Testando conexão com Supabase...');
try {
  const { createClient } = await import('@supabase/supabase-js');
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Variáveis de ambiente do Supabase não encontradas');
  } else {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.auth.getSession();
    console.log('Conexão Supabase:', error ? 'Erro' : 'OK');
    if (error) console.error('Erro Supabase:', error);
  }
} catch (error) {
  console.error('Erro ao testar Supabase:', error);
}

// 4. Verificar se a tabela superadmins existe
console.log('\n4. Verificando tabela superadmins...');
try {
  const { createClient } = await import('@supabase/supabase-js');
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from('superadmins')
      .select('*')
      .limit(1);
    
    console.log('Tabela superadmins:', error ? 'Erro' : 'OK');
    if (error) {
      console.error('Erro na tabela:', error);
    } else {
      console.log('Registros encontrados:', data?.length || 0);
    }
  }
} catch (error) {
  console.error('Erro ao verificar tabela:', error);
}

// 5. Verificar se o usuário existe
console.log('\n5. Verificando usuário super admin...');
try {
  const { createClient } = await import('@supabase/supabase-js');
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from('superadmins')
      .select('*')
      .eq('email', 'contatobrunohcunha@gmail.com')
      .single();
    
    console.log('Usuário super admin:', error ? 'Não encontrado' : 'Encontrado');
    if (error) {
      console.error('Erro ao buscar usuário:', error);
    } else {
      console.log('Dados do usuário:', data);
    }
  }
} catch (error) {
  console.error('Erro ao verificar usuário:', error);
}

// 6. Verificar se o usuário existe no Auth
console.log('\n6. Verificando usuário no Auth...');
try {
  const { createClient } = await import('@supabase/supabase-js');
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Tentar buscar usuário por email (requer admin)
    console.log('Nota: Verificação no Auth requer privilégios de admin');
    console.log('Verifique manualmente se o usuário existe no painel do Supabase');
  }
} catch (error) {
  console.error('Erro ao verificar Auth:', error);
}

console.log('\n=== FIM DO DIAGNÓSTICO ===');
console.log('\nPara resolver problemas:');
console.log('1. Execute o SQL em INSERT-SUPERADMIN.sql no Supabase');
console.log('2. Crie o usuário no Auth do Supabase com email: contatobrunohcunha@gmail.com');
console.log('3. Verifique se as variáveis de ambiente estão configuradas');
console.log('4. Teste o login com as credenciais corretas'); 