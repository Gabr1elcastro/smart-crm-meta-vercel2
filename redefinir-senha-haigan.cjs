const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const SUPABASE_URL = 'https://ltdkdeqxcgtuncgzsowt.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0ZGtkZXF4Y2d0dW5jZ3pzb3d0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzA4NzYxNiwiZXhwIjoyMDUyNjYzNjE2fQ.RKMW8QZohViES2Y2agpCC5OYv8owBCPnI3pgxppIeVs';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function redefinirSenhaHaigan() {
  console.log('🔐 Iniciando redefinição de senha para rr.haigan@gmail.com...');
  
  try {
    // 1. Buscar usuário pelo email
    console.log('🔍 Buscando usuário: rr.haigan@gmail.com');
    
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error('❌ Erro ao listar usuários:', listError);
      return;
    }
    
    // Procurar pelo usuário específico
    const user = users.users.find(u => u.email === 'rr.haigan@gmail.com');
    
    if (!user) {
      console.log('❌ Usuário não encontrado!');
      console.log('📋 Usuários disponíveis:');
      users.users.forEach(u => {
        console.log(`  - ${u.email} (ID: ${u.id})`);
      });
      return;
    }
    
    console.log('✅ Usuário encontrado:', {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at
    });
    
    // 2. Redefinir a senha
    console.log('🔄 Redefinindo senha para: SmartCRM2025!');
    
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      password: 'SmartCRM2025!'
    });
    
    if (error) {
      console.error('❌ Erro ao redefinir senha:', error);
      return;
    }
    
    console.log('✅ Senha redefinida com sucesso!');
    console.log('👤 Dados do usuário atualizados:', {
      id: data.user.id,
      email: data.user.email,
      updated_at: data.user.updated_at
    });
    
    // 3. Verificar se a senha foi realmente alterada
    console.log('🔍 Verificando alteração...');
    
    // Tentar fazer login com a nova senha (simulação)
    console.log('🧪 Testando nova senha...');
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'rr.haigan@gmail.com',
      password: 'SmartCRM2025!'
    });
    
    if (signInError) {
      console.error('❌ Erro ao testar nova senha:', signInError);
      console.log('⚠️ A senha pode não ter sido alterada corretamente');
    } else {
      console.log('✅ Nova senha testada com sucesso!');
      console.log('🔐 Sessão criada:', signInData.session ? 'Sim' : 'Não');
      
      // Fazer logout para não deixar sessão ativa
      await supabase.auth.signOut();
      console.log('🚪 Logout realizado');
    }
    
    console.log('\n🎉 Processo concluído com sucesso!');
    console.log('📧 Email: rr.haigan@gmail.com');
    console.log('🔑 Nova senha: SmartCRM2025!');
    console.log('💡 O usuário pode fazer login com essas credenciais');
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

// Executar a função
redefinirSenhaHaigan();
