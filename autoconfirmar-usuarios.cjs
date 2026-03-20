const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não configuradas!');
  console.error('Verifique se VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão definidas no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function mostrarInstrucoesAutoconfirmacao() {
  console.log('🚀 [AUTOCONFIRMAÇÃO] Instruções para autoconfirmação no Supabase');
  console.log('');
  console.log('📋 Como confirmar usuários no painel do Supabase:');
  console.log('');
  console.log('1. Acesse: https://supabase.com/dashboard');
  console.log('2. Selecione seu projeto');
  console.log('3. Vá para Authentication > Users');
  console.log('4. Encontre os usuários com status "Unconfirmed"');
  console.log('5. Clique no usuário e depois em "Confirm User"');
  console.log('');
  console.log('🔄 OU use o script confirm-email-manual.cjs existente:');
  console.log('   node confirm-email-manual.cjs confirm-all');
  console.log('');
  console.log('⚡ SOLUÇÃO IMPLEMENTADA:');
  console.log('   ✅ Novos usuários são autoconfirmados automaticamente');
  console.log('   ✅ Verificação de e-mail desabilitada no signup');
  console.log('   ✅ Usuários existentes precisam ser confirmados manualmente');
  console.log('');
}

async function listarUsuariosNaoConfirmados() {
  console.log('📋 [LISTAGEM] Não é possível listar usuários sem service role key');
  console.log('');
  console.log('🔧 Para listar usuários não confirmados:');
  console.log('1. Use o painel do Supabase: Authentication > Users');
  console.log('2. OU use o script existente: node confirm-email-manual.cjs list');
  console.log('');
}

// Verificar argumentos da linha de comando
const command = process.argv[2];

switch (command) {
  case 'list':
    listarUsuariosNaoConfirmados();
    break;
  case 'instructions':
    mostrarInstrucoesAutoconfirmacao();
    break;
  default:
    console.log('🚀 [AUTOCONFIRMAÇÃO] Script de autoconfirmação de usuários');
    console.log('');
    console.log('Comandos disponíveis:');
    console.log('  node autoconfirmar-usuarios.cjs list         - Instruções para listar usuários');
    console.log('  node autoconfirmar-usuarios.cjs instructions - Instruções completas de autoconfirmação');
    console.log('');
    console.log('⚡ SOLUÇÃO IMPLEMENTADA:');
    console.log('   ✅ Novos usuários são autoconfirmados automaticamente no signup');
    console.log('   ✅ Verificação de e-mail desabilitada para ganhar agilidade');
    console.log('   ✅ EmailConfirmationHandler desabilitado');
    console.log('');
    console.log('📋 Para confirmar usuários existentes:');
    console.log('   1. Painel Supabase: Authentication > Users');
    console.log('   2. OU script: node confirm-email-manual.cjs confirm-all');
    break;
}
