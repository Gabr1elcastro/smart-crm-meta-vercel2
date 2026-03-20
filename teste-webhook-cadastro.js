// Teste do Webhook para Cadastro de Usuários
// Este arquivo testa se o webhook está funcionando corretamente

console.log('🧪 Testando webhook de cadastro...');

// Função para testar o webhook
async function testWebhook() {
  try {
    console.log('📡 Enviando dados de teste para o webhook...');
    
    const testData = {
      nome: 'Usuário Teste',
      telefone: '(11) 99999-9999',
      email: 'teste@smartcrm.com',
      tipo: 'cadastro_usuario',
      timestamp: new Date().toISOString(),
      origem: 'site_smartcrm'
    };
    
    console.log('📋 Dados de teste:', testData);
    
    const response = await fetch('https://webhook.dev.usesmartcrm.com/webhook/mensagens_wpp_site_smartcrm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    console.log('📊 Status da resposta:', response.status);
    console.log('📊 Status text:', response.statusText);
    
    if (response.ok) {
      console.log('✅ Webhook respondeu com sucesso!');
      
      try {
        const responseData = await response.json();
        console.log('📄 Dados da resposta:', responseData);
      } catch (parseError) {
        console.log('📄 Resposta não é JSON válido');
      }
    } else {
      console.error('❌ Webhook retornou erro:', response.status);
      
      try {
        const errorData = await response.text();
        console.error('📄 Detalhes do erro:', errorData);
      } catch (parseError) {
        console.error('📄 Não foi possível ler detalhes do erro');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar webhook:', error);
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('💡 Dica: Este erro pode indicar que o fetch não está disponível no ambiente');
    }
    
    if (error.name === 'TypeError' && error.message.includes('CORS')) {
      console.error('💡 Dica: Erro de CORS - o webhook pode não permitir requisições do navegador');
    }
  }
}

// Função para testar conectividade básica
async function testConnectivity() {
  try {
    console.log('🔍 Testando conectividade com o webhook...');
    
    const response = await fetch('https://webhook.dev.usesmartcrm.com/webhook/mensagens_wpp_site_smartcrm', {
      method: 'HEAD',
      mode: 'no-cors'
    });
    
    console.log('✅ Webhook está acessível');
    return true;
    
  } catch (error) {
    console.error('❌ Webhook não está acessível:', error);
    return false;
  }
}

// Função para simular dados reais de cadastro
function generateTestData() {
  const nomes = ['João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa'];
  const telefones = ['(11) 99999-9999', '(21) 88888-8888', '(31) 77777-7777', '(41) 66666-6666'];
  const emails = ['joao@email.com', 'maria@email.com', 'pedro@email.com', 'ana@email.com'];
  
  const randomIndex = Math.floor(Math.random() * nomes.length);
  
  return {
    nome: nomes[randomIndex],
    telefone: telefones[randomIndex],
    email: emails[randomIndex],
    tipo: 'cadastro_usuario',
    timestamp: new Date().toISOString(),
    origem: 'site_smartcrm'
  };
}

// Executar testes
async function runTests() {
  console.log('🚀 Iniciando testes do webhook...\n');
  
  // Teste 1: Conectividade
  console.log('=== TESTE 1: CONECTIVIDADE ===');
  const isConnected = await testConnectivity();
  console.log('');
  
  if (isConnected) {
    // Teste 2: Envio de dados
    console.log('=== TESTE 2: ENVIO DE DADOS ===');
    await testWebhook();
    console.log('');
    
    // Teste 3: Múltiplos envios
    console.log('=== TESTE 3: MÚLTIPLOS ENVIOS ===');
    for (let i = 1; i <= 3; i++) {
      console.log(`\n--- Envio ${i} ---`);
      const testData = generateTestData();
      console.log('📋 Dados:', testData);
      
      try {
        const response = await fetch('https://webhook.dev.usesmartcrm.com/webhook/mensagens_wpp_site_smartcrm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testData)
        });
        
        if (response.ok) {
          console.log(`✅ Envio ${i} bem-sucedido`);
        } else {
          console.log(`⚠️ Envio ${i} falhou: ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ Erro no envio ${i}:`, error.message);
      }
    }
  }
  
  console.log('\n🏁 Testes concluídos!');
}

// Executar se estiver no navegador
if (typeof window !== 'undefined') {
  console.log('🌐 Executando no navegador...');
  runTests();
} else {
  console.log('🖥️ Executando no Node.js...');
  console.log('💡 Para testar no Node.js, use: node teste-webhook-cadastro.js');
}

// Exportar para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testWebhook,
    testConnectivity,
    generateTestData,
    runTests
  };
}
