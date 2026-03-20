// Script de teste para o webhook da agenda do Google
// Execute este script para testar se o endpoint está funcionando

const testWebhookAgenda = async () => {
  console.log('🧪 Testando webhook da planilha de agenda...');
  
  // Dados de teste simulando um cliente
  const testData = {
    cliente_id: 999,
    user_id_auth: "test-user-123",
    nome: "Cliente Teste",
    email: "teste@exemplo.com",
    id_agenda: "test-agenda-id-123",
    plano_starter: false,
    plano_pro: false,
    plano_plus: true,
    plano_agentes: false,
    trial: false,
    data_conexao: new Date().toISOString(),
    tipo_conexao: "google_agenda"
  };

  try {
    console.log('📤 Enviando dados de teste...');
    console.log('📋 Payload:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('https://webhook.dev.usesmartcrm.com/webhook/planilha-agenda', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log('📥 Resposta recebida:');
    console.log('   Status:', response.status);
    console.log('   Status Text:', response.statusText);
    
    if (response.ok) {
      console.log('✅ Webhook funcionando corretamente!');
      
      // Tentar ler o corpo da resposta se houver
      try {
        const responseBody = await response.text();
        if (responseBody) {
          console.log('   Resposta:', responseBody);
        }
      } catch (e) {
        // Resposta vazia é normal para webhooks
      }
    } else {
      console.log('❌ Webhook retornou erro:', response.status);
      
      // Tentar ler detalhes do erro
      try {
        const errorBody = await response.text();
        if (errorBody) {
          console.log('   Detalhes do erro:', errorBody);
        }
      } catch (e) {
        console.log('   Não foi possível ler detalhes do erro');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar webhook:', error.message);
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.log('💡 Dica: Este script deve ser executado em um ambiente com fetch disponível');
      console.log('   - Navegador moderno');
      console.log('   - Node.js 18+ com --experimental-fetch');
      console.log('   - Ou instalar node-fetch: npm install node-fetch');
    }
  }
};

// Executar teste se estiver em ambiente Node.js
if (typeof window === 'undefined') {
  // Ambiente Node.js
  console.log('🖥️ Executando em ambiente Node.js');
  
  // Verificar se fetch está disponível
  if (typeof fetch === 'undefined') {
    console.log('⚠️ Fetch não disponível. Instalando node-fetch...');
    
    try {
      const { default: fetch } = await import('node-fetch');
      global.fetch = fetch;
      console.log('✅ node-fetch instalado e configurado');
    } catch (e) {
      console.error('❌ Erro ao instalar node-fetch:', e.message);
      console.log('💡 Execute: npm install node-fetch');
      process.exit(1);
    }
  }
  
  testWebhookAgenda();
} else {
  // Ambiente de navegador
  console.log('🌐 Executando em ambiente de navegador');
  console.log('💡 Abra o console do navegador e execute: testWebhookAgenda()');
  
  // Expor função globalmente para teste no console
  window.testWebhookAgenda = testWebhookAgenda;
}

console.log('\n📚 Como usar:');
console.log('1. No navegador: Abra o console e execute testWebhookAgenda()');
console.log('2. No Node.js: Execute este arquivo diretamente');
console.log('3. Verifique se o endpoint está respondendo corretamente');
console.log('4. Confirme se os dados chegam na planilha');
