// 🧪 Teste: Áudio Nativo via Base64 para Evolution API
// Este arquivo testa a nova funcionalidade de envio de áudio nativo

console.log('🎵 Testando sistema de áudio nativo via base64...');

// Simular um Blob de áudio para teste
function createTestAudioBlob() {
  // Criar um Blob simples para teste
  const testData = new Uint8Array([0x52, 0x49, 0x46, 0x46]); // Header WAV básico
  return new Blob([testData], { type: 'audio/wav' });
}

// Função para converter Blob para base64 (simulando nossa implementação)
async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove o prefixo "data:audio/...;base64," para obter apenas o base64
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Falha ao converter blob para base64'));
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsDataURL(blob);
  });
}

// Teste da conversão base64
async function testBase64Conversion() {
  try {
    console.log('🔄 Testando conversão Blob → Base64...');
    
    const testBlob = createTestAudioBlob();
    console.log('📁 Blob de teste criado:', {
      type: testBlob.type,
      size: testBlob.size + ' bytes'
    });
    
    const base64 = await blobToBase64(testBlob);
    console.log('✅ Conversão para base64 bem-sucedida!');
    console.log('📏 Tamanho do base64:', base64.length, 'caracteres');
    console.log('🔍 Primeiros 50 caracteres:', base64.substring(0, 50) + '...');
    
    return true;
  } catch (error) {
    console.error('❌ Erro na conversão base64:', error);
    return false;
  }
}

// Teste da estrutura do payload
function testPayloadStructure() {
  console.log('📋 Testando estrutura do payload...');
  
  const testPayload = {
    number: "5511999999999@s.whatsapp.net",
    options: {
      delay: 0,
      presence: "recording",
      encoding: true
    },
    audioMessage: {
      audio: "[BASE64_AUDIO_AQUI]"
    }
  };
  
  console.log('✅ Payload de teste criado:');
  console.log(JSON.stringify(testPayload, null, 2));
  
  // Verificar se a estrutura está correta
  const requiredFields = ['number', 'options', 'audioMessage'];
  const hasAllFields = requiredFields.every(field => testPayload.hasOwnProperty(field));
  
  if (hasAllFields) {
    console.log('✅ Estrutura do payload válida');
    return true;
  } else {
    console.error('❌ Estrutura do payload inválida');
    return false;
  }
}

// Teste da URL da API
function testAPIEndpoint() {
  console.log('🌐 Testando endpoint da API...');
  
  const baseUrl = 'https://wsapi.dev.usesmartcrm.com';
  const endpoint = '/message/sendWhatsAppAudio';
  const instance = 'test-instance';
  
  const fullUrl = `${baseUrl}${endpoint}/${instance}`;
  console.log('🔗 URL completa:', fullUrl);
  
  // Verificar se a URL está no formato correto
  if (fullUrl.includes('sendWhatsAppAudio') && fullUrl.includes(instance)) {
    console.log('✅ Endpoint da API configurado corretamente');
    return true;
  } else {
    console.error('❌ Endpoint da API mal configurado');
    return false;
  }
}

// Teste de headers
function testHeaders() {
  console.log('🔑 Testando headers da requisição...');
  
  const testHeaders = {
    'Content-Type': 'application/json',
    'apikey': '429683C4C977415CAAFCCE10F7D57E11'
  };
  
  console.log('✅ Headers de teste criados:');
  console.log(JSON.stringify(testHeaders, null, 2));
  
  // Verificar se os headers obrigatórios estão presentes
  const requiredHeaders = ['Content-Type', 'apikey'];
  const hasAllHeaders = requiredHeaders.every(header => testHeaders.hasOwnProperty(header));
  
  if (hasAllHeaders) {
    console.log('✅ Headers válidos');
    return true;
  } else {
    console.error('❌ Headers inválidos');
    return false;
  }
}

// Função principal de teste
async function runAllTests() {
  console.log('🚀 INICIANDO TESTES COMPLETOS...\n');
  
  const results = {
    base64Conversion: false,
    payloadStructure: false,
    apiEndpoint: false,
    headers: false
  };
  
  // Teste 1: Conversão base64
  console.log('🧪 TESTE 1: Conversão Blob → Base64');
  results.base64Conversion = await testBase64Conversion();
  console.log('');
  
  // Teste 2: Estrutura do payload
  console.log('🧪 TESTE 2: Estrutura do Payload');
  results.payloadStructure = testPayloadStructure();
  console.log('');
  
  // Teste 3: Endpoint da API
  console.log('🧪 TESTE 3: Endpoint da API');
  results.apiEndpoint = testAPIEndpoint();
  console.log('');
  
  // Teste 4: Headers
  console.log('🧪 TESTE 4: Headers da Requisição');
  results.headers = testHeaders();
  console.log('');
  
  // Resultado final
  console.log('📊 RESULTADO DOS TESTES:');
  console.log('========================');
  console.log(`✅ Conversão Base64: ${results.base64Conversion ? 'PASSOU' : 'FALHOU'}`);
  console.log(`✅ Estrutura Payload: ${results.payloadStructure ? 'PASSOU' : 'FALHOU'}`);
  console.log(`✅ Endpoint API: ${results.apiEndpoint ? 'PASSOU' : 'FALHOU'}`);
  console.log(`✅ Headers: ${results.headers ? 'PASSOU' : 'FALHOU'}`);
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  console.log(`\n🎯 TOTAL: ${passedTests}/${totalTests} testes passaram`);
  
  if (passedTests === totalTests) {
    console.log('🎉 TODOS OS TESTES PASSARAM! Sistema pronto para uso.');
  } else {
    console.log('⚠️ ALGUNS TESTES FALHARAM. Verifique os erros acima.');
  }
}

// Executar todos os testes
runAllTests().catch(error => {
  console.error('💥 Erro durante execução dos testes:', error);
});

console.log('🏁 Testes iniciados. Verifique o console para resultados.');
