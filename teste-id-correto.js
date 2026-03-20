// Script para testar se o ID correto está sendo usado
// Execute no console do navegador na página do Dashboard

console.log('🧪 Teste de ID Correto - Iniciando...');

// Verificar sessionStorage
const correctClientId = sessionStorage.getItem('correctClientId');
const hasMismatch = sessionStorage.getItem('clientIdMismatch') === 'true';

console.log('📊 SessionStorage:', {
  correctClientId,
  hasMismatch,
  storedId: correctClientId ? parseInt(correctClientId) : null
});

// Verificar se o useRealtime está usando o ID correto
if (window.React) {
  // Tentar acessar o contexto de realtime
  console.log('🔍 Verificando useRealtime...');
  
  // Aguardar um pouco para o contexto carregar
  setTimeout(() => {
    console.log('⏰ Verificação após 2 segundos...');
    
    // Verificar logs no console para ver se o RealtimeContext está usando o ID correto
    console.log('📋 Verifique os logs acima para:');
    console.log('   - "RealtimeContext: Usando ID correto do cliente: 38"');
    console.log('   - "RealtimeContext: ID do cliente definido: 38"');
    console.log('   - "Dashboard: Cliente ID disponível: 38"');
    console.log('   - "LeadsService: Buscando leads com filtro de data: {clientId: 38, ...}"');
  }, 2000);
}

// Função para verificar se há discrepâncias nos logs
function checkLogsForMismatch() {
  console.log('🔍 Verificando logs por discrepâncias...');
  
  // Verificar se há logs usando ID 133 (incorreto)
  const logs = performance.getEntriesByType('navigation');
  console.log('📊 Logs de navegação:', logs);
  
  console.log('✅ Se você vê logs com "clientId: 38" em vez de "clientId: 133", a correção está funcionando!');
}

// Executar verificação após 5 segundos
setTimeout(checkLogsForMismatch, 5000);

console.log('✅ Teste iniciado. Verifique os logs acima e aguarde 5 segundos para verificação final.'); 