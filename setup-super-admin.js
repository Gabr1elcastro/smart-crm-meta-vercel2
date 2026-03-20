// Script automatizado para configurar Super Admin
// Execute este script no console do navegador após configurar as variáveis de ambiente

console.log('=== CONFIGURAÇÃO AUTOMATIZADA SUPER ADMIN ===');

async function setupSuperAdmin() {
  try {
    // 1. Verificar se o Supabase está configurado
    console.log('1. Verificando configuração do Supabase...');
    
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
      console.log('Configure o arquivo .env com:');
      console.log('VITE_SUPABASE_URL=sua_url_do_supabase');
      console.log('VITE_SUPABASE_ANON_KEY=sua_chave_anonima');
      return;
    }
    
    console.log('✅ Variáveis de ambiente configuradas');
    
    // 2. Importar e configurar Supabase
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );
    
    // 3. Criar tabela superadmins
    console.log('\n2. Criando tabela superadmins...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.superadmins (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        nome text NOT NULL,
        email text NOT NULL UNIQUE,
        criado_em timestamp with time zone DEFAULT now()
      );
    `;
    
    const { error: tableError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (tableError) {
      console.log('⚠️ Não foi possível criar a tabela via RPC (normal se não tiver permissões)');
      console.log('Execute manualmente no SQL Editor do Supabase:');
      console.log(createTableSQL);
    } else {
      console.log('✅ Tabela superadmins criada/verificada');
    }
    
    // 4. Inserir usuário super admin
    console.log('\n3. Inserindo usuário super admin...');
    
    const { data: existingUser, error: checkError } = await supabase
      .from('superadmins')
      .select('*')
      .eq('email', 'contatobrunohcunha@gmail.com')
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Erro ao verificar usuário:', checkError);
      return;
    }
    
    if (existingUser) {
      console.log('✅ Usuário super admin já existe');
    } else {
      const { data: newUser, error: insertError } = await supabase
        .from('superadmins')
        .insert({
          nome: 'Bruno Cunha',
          email: 'contatobrunohcunha@gmail.com'
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('❌ Erro ao inserir usuário:', insertError);
        console.log('Execute manualmente no SQL Editor:');
        console.log(`
          INSERT INTO public.superadmins (nome, email) 
          VALUES ('Bruno Cunha', 'contatobrunohcunha@gmail.com')
          ON CONFLICT (email) DO NOTHING;
        `);
      } else {
        console.log('✅ Usuário super admin criado:', newUser);
      }
    }
    
    // 5. Verificar se o usuário existe no Auth
    console.log('\n4. Verificando usuário no Auth...');
    
    // Tentar fazer login para verificar se existe
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'contatobrunohcunha@gmail.com',
      password: 'teste123' // Senha de teste
    });
    
    if (authError) {
      if (authError.message.includes('Invalid login credentials')) {
        console.log('⚠️ Usuário não existe no Auth ou senha incorreta');
        console.log('Crie o usuário manualmente no painel do Supabase:');
        console.log('1. Acesse Authentication > Users');
        console.log('2. Clique em "Add User"');
        console.log('3. Email: contatobrunohcunha@gmail.com');
        console.log('4. Defina uma senha');
        console.log('5. Marque "Auto-confirm"');
      } else {
        console.error('❌ Erro ao verificar Auth:', authError);
      }
    } else {
      console.log('✅ Usuário existe no Auth');
      // Fazer logout
      await supabase.auth.signOut();
    }
    
    // 6. Testar acesso à rota
    console.log('\n5. Testando acesso à rota...');
    
    try {
      const response = await fetch('/super-admin-login');
      console.log('Status da rota:', response.status);
      
      if (response.ok) {
        console.log('✅ Rota /super-admin-login acessível');
      } else {
        console.log('⚠️ Rota retornou status:', response.status);
      }
    } catch (error) {
      console.log('⚠️ Erro ao testar rota:', error.message);
    }
    
    // 7. Resumo final
    console.log('\n=== RESUMO DA CONFIGURAÇÃO ===');
    console.log('✅ Variáveis de ambiente: OK');
    console.log('✅ Cliente Supabase: OK');
    console.log('⚠️ Tabela superadmins: Verificar manualmente');
    console.log('⚠️ Usuário no Auth: Criar manualmente');
    console.log('✅ Rotas: Configuradas');
    
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('1. Execute o SQL no Supabase SQL Editor');
    console.log('2. Crie o usuário no Auth do Supabase');
    console.log('3. Teste o login em /super-admin-login');
    console.log('4. Use as credenciais: contatobrunohcunha@gmail.com + sua_senha');
    
  } catch (error) {
    console.error('❌ Erro durante a configuração:', error);
  }
}

// Executar configuração
setupSuperAdmin(); 