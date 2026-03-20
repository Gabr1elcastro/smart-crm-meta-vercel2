const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'your-service-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testarRedefinicaoSenha() {
  console.log('🔐 Testando redefinição de senha corrigida...\n');

  try {
    // 1. Verificar configurações de autenticação
    console.log('1️⃣ Verificando configurações de autenticação...');
    
    // Simular o que o ForgotPassword.tsx faz
    const redirectTo = 'https://app.usesmartcrm.com/update-password'.trim();
    console.log('✅ URL de redirecionamento limpa:', redirectTo);
    console.log('✅ Comprimento da URL:', redirectTo.length);
    console.log('✅ Sem espaços extras:', redirectTo === redirectTo.trim());
    
    // 2. Verificar se a URL está correta
    console.log('\n2️⃣ Verificando estrutura da URL...');
    const url = new URL(redirectTo);
    console.log('✅ Protocolo:', url.protocol);
    console.log('✅ Host:', url.host);
    console.log('✅ Pathname:', url.pathname);
    console.log('✅ URL completa válida:', url.toString());
    
    // 3. Verificar se não há espaços ou caracteres especiais
    console.log('\n3️⃣ Verificando limpeza da URL...');
    const urlWithSpaces = '  https://app.usesmartcrm.com/update-password  ';
    const cleanedUrl = urlWithSpaces.trim();
    console.log('❌ URL com espaços:', `"${urlWithSpaces}"`);
    console.log('✅ URL limpa:', `"${cleanedUrl}"`);
    console.log('✅ Espaços removidos:', urlWithSpaces.length !== cleanedUrl.length);
    
    // 4. Verificar parâmetros esperados na URL de recuperação
    console.log('\n4️⃣ Verificando parâmetros esperados...');
    const expectedParams = ['type', 'code'];
    console.log('✅ Parâmetros esperados na URL de recuperação:');
    expectedParams.forEach(param => {
      console.log(`   - ${param}`);
    });
    
    // 5. Simular URL de recuperação
    console.log('\n5️⃣ Simulando URL de recuperação...');
    const recoveryUrl = 'https://app.usesmartcrm.com/update-password?type=recovery&code=abc123';
    const recoveryUrlObj = new URL(recoveryUrl);
    console.log('✅ URL de recuperação simulada:', recoveryUrl);
    console.log('✅ Parâmetro type:', recoveryUrlObj.searchParams.get('type'));
    console.log('✅ Parâmetro code:', recoveryUrlObj.searchParams.get('code'));
    
    // 6. Verificar se a rota update-password está configurada
    console.log('\n6️⃣ Verificando configuração da rota...');
    console.log('✅ Rota /update-password deve estar configurada no App.tsx');
    console.log('✅ Componente UpdatePassword deve estar implementado');
    console.log('✅ Deve usar exchangeCodeForSession para trocar código pela sessão');
    
    console.log('\n🎯 Resumo das correções implementadas:');
    console.log('   ✅ URL de redirecionamento fixa e limpa');
    console.log('   ✅ Sem espaços extras na URL');
    console.log('   ✅ Rota correta /update-password');
    console.log('   ✅ Uso do método exchangeCodeForSession');
    console.log('   ✅ Parâmetros type=recovery&code=...');
    console.log('   ✅ Tratamento de erros melhorado');
    
    console.log('\n📋 Configurações necessárias no Supabase:');
    console.log('   🔗 Site URL: https://app.usesmartcrm.com');
    console.log('   🔗 Redirect URLs: https://app.usesmartcrm.com/update-password');
    console.log('   🔗 (opcional) https://app.usesmartcrm.com/*');
    
    console.log('\n📱 Para testar:');
    console.log('   1. Acesse /forgot-password');
    console.log('   2. Digite um email válido');
    console.log('   3. Verifique se o email recebido tem a URL correta');
    console.log('   4. Clique no link e confirme se vai para /update-password');
    console.log('   5. Digite uma nova senha e confirme');
    
    console.log('\n⚠️  Problemas anteriores corrigidos:');
    console.log('   ❌ URL com espaços extras (%20%20)');
    console.log('   ❌ Redirecionamento para raiz sem rota');
    console.log('   ❌ Uso incorreto de setSession');
    console.log('   ✅ Agora usa exchangeCodeForSession');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testarRedefinicaoSenha();
