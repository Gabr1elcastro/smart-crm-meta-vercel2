// Script para criar usuário super admin no Supabase Auth
// Execute este script após configurar as variáveis de ambiente

const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas');
  console.log('Certifique-se de que VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSuperAdminUser() {
  try {
    console.log('🚀 Criando usuário super admin...');
    
    const email = 'contatobrunohcunha@gmail.com';
    const password = 'SuperAdmin@2024!'; // Senha temporária - deve ser alterada
    
    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: 'Bruno',
        last_name: 'Cunha',
        role: 'super_admin'
      }
    });

    if (authError) {
      console.error('❌ Erro ao criar usuário no Auth:', authError);
      return;
    }

    console.log('✅ Usuário criado no Supabase Auth:', authData.user.id);
    
    // Verificar se o super admin já existe na tabela
    const { data: existingSuperAdmin, error: checkError } = await supabase
      .from('superadmins')
      .select('*')
      .eq('email', email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Erro ao verificar super admin existente:', checkError);
      return;
    }

    if (existingSuperAdmin) {
      console.log('ℹ️ Super admin já existe na tabela');
    } else {
      // Inserir na tabela superadmins
      const { data: superAdminData, error: insertError } = await supabase
        .from('superadmins')
        .insert({
          nome: 'Bruno Cunha',
          email: email
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Erro ao inserir na tabela superadmins:', insertError);
        return;
      }

      console.log('✅ Super admin inserido na tabela:', superAdminData.id);
    }

    console.log('\n🎉 Super admin criado com sucesso!');
    console.log('📧 Email:', email);
    console.log('🔑 Senha temporária:', password);
    console.log('\n⚠️ IMPORTANTE: Altere a senha no primeiro login!');
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

// Executar o script
createSuperAdminUser(); 