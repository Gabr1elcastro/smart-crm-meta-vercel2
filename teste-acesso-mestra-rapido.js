// 🧪 Teste Rápido - Acesso Mestra
// Execute no console do navegador

console.log('🔑 Teste Rápido - Acesso Mestra');
console.log('================================');

// Função para verificar estado atual
function checkCurrentState() {
  console.log('\n📊 Estado Atual:');
  
  // Verificar localStorage
  const masterAccess = localStorage.getItem('masterAccess');
  console.log('🔐 localStorage masterAccess:', masterAccess ? '✅ Presente' : '❌ Ausente');
  
  if (masterAccess) {
    try {
      const parsed = JSON.parse(masterAccess);
      console.log('📧 Email do acesso mestra:', parsed.targetUserEmail);
      console.log('🆔 ID do usuário:', parsed.targetUserId);
      console.log('⏰ Timestamp:', parsed.accessTime);
    } catch (error) {
      console.log('❌ Erro ao parsear masterAccess:', error);
    }
  }
  
  // Verificar se está na página correta
  console.log('📍 Página atual:', window.location.pathname);
  console.log('🔗 URL completa:', window.location.href);
  
  // Verificar se há erros no console
  console.log('⚠️ Verifique se há erros no console acima');
}

// Função para simular acesso mestra
function simulateMasterAccess(email = 'bbf.materiais@gmail.com') {
  console.log('\n🎭 Simulando acesso mestra para:', email);
  
  const mockAccess = {
    isMasterAccess: true,
    targetUserId: '999',
    targetUserEmail: email,
    accessTime: new Date().toISOString()
  };
  
  localStorage.setItem('masterAccess', JSON.stringify(mockAccess));
  console.log('✅ Acesso mestra simulado, recarregando página...');
  
  // Recarregar para testar
  window.location.reload();
}

// Função para limpar acesso mestra
function clearMasterAccess() {
  console.log('\n🧹 Limpando acesso mestra...');
  localStorage.removeItem('masterAccess');
  console.log('✅ Acesso mestra removido');
}

// Função para testar redirecionamento
function testRedirect() {
  console.log('\n🔄 Testando redirecionamento...');
  
  // Tentar ir para dashboard
  window.location.href = '/';
}

// Expor funções globalmente
window.checkCurrentState = checkCurrentState;
window.simulateMasterAccess = simulateMasterAccess;
window.clearMasterAccess = clearMasterAccess;
window.testRedirect = testRedirect;

console.log('\n💡 Funções disponíveis:');
console.log('• checkCurrentState() - Verificar estado atual');
console.log('• simulateMasterAccess(email) - Simular acesso mestra');
console.log('• clearMasterAccess() - Limpar acesso mestra');
console.log('• testRedirect() - Testar redirecionamento');

// Executar verificação inicial
checkCurrentState();
