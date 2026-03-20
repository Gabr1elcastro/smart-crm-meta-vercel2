const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não configuradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testarAutoconfirmacao() {
  console.log('🧪 [TESTE] Testando autoconfirmação...');
  console.log('');
  
  try {
    // Tentar fazer signup com um e-mail de teste
    const emailTeste = `teste-${Date.now()}@exemplo.com`;
    const senhaTeste = '123456';
    
    console.log(`📧 [TESTE] Tentando cadastrar: ${emailTeste}`);
    
    const { data, error } = await supabase.auth.signUp({
      email: emailTeste,
      password: senhaTeste,
      options: {
        data: {
          first_name: 'Teste',
          last_name: 'Autoconfirmação'
        }
      }
    });
    
    if (error) {
      console.error('❌ [TESTE] Erro no cadastro:', error.message);
      return;
    }
    
    console.log('✅ [TESTE] Usuário cadastrado com sucesso!');
    console.log('');
    
    // Verificar status de confirmação
    if (data.user) {
      console.log('📊 [TESTE] Status do usuário:');
      console.log(`   ID: ${data.user.id}`);
      console.log(`   Email: ${data.user.email}`);
      console.log(`   Email confirmado: ${data.user.email_confirmed_at ? '✅ SIM' : '❌ NÃO'}`);
      console.log(`   Data de confirmação: ${data.user.email_confirmed_at || 'N/A'}`);
      console.log('');
      
      if (data.user.email_confirmed_at) {
        console.log('🎉 [TESTE] AUTOCONFIRMAÇÃO FUNCIONANDO!');
        console.log('   ✅ Usuário foi criado já confirmado');
        console.log('   ✅ Não precisa verificar e-mail');
        console.log('   ✅ Pode fazer login imediatamente');
      } else {
        console.log('⚠️ [TESTE] AUTOCONFIRMAÇÃO NÃO FUNCIONANDO');
        console.log('   ❌ Usuário foi criado mas não confirmado');
        console.log('   ❌ Precisa verificar e-mail');
        console.log('');
        console.log('🔧 [SOLUÇÃO] Desabilite a verificação de e-mail no Supabase:');
        console.log('   1. Acesse: https://supabase.com/dashboard');
        console.log('   2. Vá para Authentication > Settings');
        console.log('   3. Desmarque "Enable email confirmations"');
        console.log('   4. Salve as configurações');
      }
      
      // Limpar usuário de teste
      console.log('');
      console.log('🧹 [TESTE] Limpando usuário de teste...');
      try {
        // Tentar fazer login para limpar a sessão
        await supabase.auth.signInWithPassword({
          email: emailTeste,
          password: senhaTeste
        });
        
        // Fazer logout
        await supabase.auth.signOut();
        console.log('✅ [TESTE] Usuário de teste limpo');
      } catch (cleanupError) {
        console.log('⚠️ [TESTE] Não foi possível limpar usuário de teste:', cleanupError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ [TESTE] Erro inesperado:', error);
  }
}

async function verificarConfiguracao() {
  console.log('🔍 [VERIFICAÇÃO] Verificando configuração atual...');
  console.log('');
  
  try {
    // Verificar se conseguimos acessar o Supabase
    const { data, error } = await supabase.from('_pgrst_reserved_relation').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ [VERIFICAÇÃO] Erro ao conectar com Supabase:', error.message);
      return;
    }
    
    console.log('✅ [VERIFICAÇÃO] Conexão com Supabase OK');
    console.log(`   URL: ${supabaseUrl}`);
    console.log(`   Key presente: ${supabaseAnonKey ? '✅ SIM' : '❌ NÃO'}`);
    console.log('');
    
    console.log('📋 [VERIFICAÇÃO] Próximos passos:');
    console.log('   1. Execute: node testar-autoconfirmacao.cjs test');
    console.log('   2. Se não funcionar, desabilite verificação no Supabase');
    console.log('   3. Consulte: DESABILITAR-VERIFICACAO-EMAIL-SUPABASE.md');
    
  } catch (error) {
    console.error('❌ [VERIFICAÇÃO] Erro inesperado:', error);
  }
}

// Verificar argumentos da linha de comando
const command = process.argv[2];

switch (command) {
  case 'test':
    testarAutoconfirmacao();
    break;
  case 'check':
    verificarConfiguracao();
    break;
  default:
    console.log('🧪 [TESTE] Script de teste de autoconfirmação');
    console.log('');
    console.log('Comandos disponíveis:');
    console.log('  node testar-autoconfirmacao.cjs check  - Verificar configuração');
    console.log('  node testar-autoconfirmacao.cjs test   - Testar autoconfirmação');
    console.log('');
    console.log('📋 Para desabilitar verificação de e-mail:');
    console.log('   1. Consulte: DESABILITAR-VERIFICACAO-EMAIL-SUPABASE.md');
    console.log('   2. OU acesse: https://supabase.com/dashboard');
    break;
}




