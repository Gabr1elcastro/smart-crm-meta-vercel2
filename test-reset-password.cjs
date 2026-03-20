const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const SUPABASE_URL = 'https://ltdkdeqxcgtuncgzsowt.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0ZGtkZXF4Y2d0dW5jZ3pzb3d0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzA4NzYxNiwiZXhwIjoyMDUyNjYzNjE2fQ.RKMW8QZohViES2Y2agpCC5OYv8owBCPnI3pgxppIeVs';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function testPasswordReset() {
  console.log('🧪 Testando configuração de redefinição de senha...');
  
  try {
    // Primeiro, listar usuários para encontrar um email válido
    console.log('📋 Buscando usuários existentes...');
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Erro ao listar usuários:', listError);
      return;
    }
    
    if (!users.users || users.users.length === 0) {
      console.log('⚠️ Nenhum usuário encontrado no sistema');
      return;
    }
    
    // Usar o primeiro usuário encontrado
    const testUser = users.users[0];
    const testEmail = testUser.email;
    
    console.log('👤 Usando usuário:', testEmail);
    
    // Testar envio de email de reset
    const redirectUrl = 'http://localhost:8080/update-password';
    
    console.log('📧 Enviando email de reset para:', testEmail);
    console.log('🔗 URL de redirecionamento:', redirectUrl);
    
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: testEmail,
      options: {
        redirectTo: redirectUrl
      }
    });
    
    if (error) {
      console.error('❌ Erro ao gerar link de recuperação:', error);
      return;
    }
    
    console.log('✅ Link de recuperação gerado com sucesso!');
    console.log('🔗 Link gerado:', data.properties.action_link);
    
    // Verificar se o link contém os parâmetros esperados
    const url = new URL(data.properties.action_link);
    const hasAccessToken = url.searchParams.has('access_token');
    const hasRefreshToken = url.searchParams.has('refresh_token');
    const hasType = url.searchParams.get('type') === 'recovery';
    
    console.log('🔍 Verificação dos parâmetros:');
    console.log('  - access_token presente:', hasAccessToken);
    console.log('  - refresh_token presente:', hasRefreshToken);
    console.log('  - type=recovery:', hasType);
    
    if (hasAccessToken && hasRefreshToken && hasType) {
      console.log('✅ Todos os parâmetros necessários estão presentes!');
      console.log('🎉 Configuração de redefinição de senha está funcionando corretamente!');
    } else {
      console.log('⚠️ Alguns parâmetros estão faltando');
    }
    
    // Verificar configuração de URLs no Supabase
    console.log('\n📋 Verificando configuração de URLs...');
    console.log('ℹ️  Certifique-se de que no painel do Supabase (Authentication > URL Configuration):');
    console.log('   - Site URL: http://localhost:8080 (para desenvolvimento)');
    console.log('   - Redirect URLs inclui: http://localhost:8080/update-password');
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

// Executar o teste
testPasswordReset(); 