// Teste de Envio de Mensagens por Departamento
console.log('🧪 Testando Envio de Mensagens por Departamento...');

// Simular envio de mensagem e verificar logs
const testMessageSending = () => {
  console.log('📤 Testando envio de mensagem...');
  
  // Verificar se há logs de busca de departamento
  const logs = console.log;
  let departamentoFound = false;
  let chipFound = false;
  
  // Interceptar logs para verificar se a lógica está funcionando
  console.log = (...args) => {
    const message = args.join(' ');
    
    if (message.includes('Buscando departamento do lead')) {
      console.log('✅ Log de busca de departamento encontrado');
      departamentoFound = true;
    }
    
    if (message.includes('Buscando chip associado ao departamento')) {
      console.log('✅ Log de busca de chip encontrado');
      chipFound = true;
    }
    
    if (message.includes('Departamento do lead:')) {
      console.log('✅ Departamento identificado:', message);
    }
    
    if (message.includes('Chip associado:')) {
      console.log('✅ Chip associado identificado:', message);
    }
    
    if (message.includes('Nenhum chip configurado')) {
      console.log('⚠️  Erro esperado - departamento sem chip:', message);
    }
    
    // Chamar o console.log original
    logs.apply(console, args);
  };
  
  return { departamentoFound, chipFound };
};

// Verificar se a página de conversas está carregada
const checkConversationsPage = () => {
  console.log('📋 Verificando página de conversas...');
  
  const conversationsPage = document.querySelector('[data-testid="conversations"]') || 
                          document.querySelector('.conversations') ||
                          document.querySelector('main');
  
  if (conversationsPage) {
    console.log('✅ Página de conversas encontrada');
    
    // Verificar se há campo de mensagem
    const messageInput = document.querySelector('input[placeholder*="mensagem"]') ||
                        document.querySelector('textarea[placeholder*="mensagem"]') ||
                        document.querySelector('#mensagem-input');
    
    if (messageInput) {
      console.log('✅ Campo de mensagem encontrado');
      
      // Verificar se há botão de enviar
      const sendButton = document.querySelector('button[type="submit"]') ||
                        document.querySelector('button:contains("Enviar")') ||
                        document.querySelector('[data-testid="send-button"]');
      
      if (sendButton) {
        console.log('✅ Botão de enviar encontrado');
        console.log('📝 Para testar:');
        console.log('   1. Selecione um contato');
        console.log('   2. Digite uma mensagem');
        console.log('   3. Clique em enviar');
        console.log('   4. Verifique os logs no console');
        console.log('   5. Se o departamento não tiver chip, deve aparecer erro específico');
      } else {
        console.log('❌ Botão de enviar não encontrado');
      }
    } else {
      console.log('❌ Campo de mensagem não encontrado');
    }
  } else {
    console.log('❌ Página de conversas não encontrada');
  }
};

// Verificar departamentos e chips configurados
const checkDepartamentosChips = async () => {
  console.log('🏢 Verificando departamentos e chips...');
  
  try {
    // Simular busca de departamentos (se estiver na página de departamentos)
    const departamentosTable = document.querySelector('table');
    if (departamentosTable) {
      console.log('✅ Tabela de departamentos encontrada');
      
      // Verificar se há selects de chip
      const chipSelects = document.querySelectorAll('select');
      console.log(`🎛️  Selects de chip encontrados: ${chipSelects.length}`);
      
      chipSelects.forEach((select, index) => {
        const value = select.value;
        const isDisabled = select.disabled;
        const isConfigured = select.parentElement.querySelector('[class*="bg-orange-50"]');
        
        console.log(`  Select ${index + 1}:`);
        console.log(`    Valor: ${value}`);
        console.log(`    Desabilitado: ${isDisabled ? 'Sim' : 'Não'}`);
        console.log(`    Configurado: ${isConfigured ? 'Sim' : 'Não'}`);
        
        if (value && value !== 'none') {
          console.log(`    ✅ Chip configurado: ${value}`);
        } else if (isConfigured) {
          console.log(`    ⚠️  Configurado mas sem valor visível`);
        } else {
          console.log(`    ℹ️  Sem chip selecionado`);
        }
      });
    } else {
      console.log('ℹ️  Não está na página de departamentos');
    }
  } catch (error) {
    console.error('❌ Erro ao verificar departamentos:', error);
  }
};

// Executar verificações
setTimeout(() => {
  checkConversationsPage();
  checkDepartamentosChips();
  
  console.log('📋 Instruções para teste manual:');
  console.log('   1. Vá para a página de Conversas');
  console.log('   2. Selecione um contato que tenha departamento');
  console.log('   3. Digite uma mensagem e tente enviar');
  console.log('   4. Se o departamento não tiver chip configurado, deve aparecer:');
  console.log('      "Nenhum chip configurado para o envio de mensagem por este departamento. Vá na aba Departamentos e selecione um chip."');
  console.log('   5. Se o departamento tiver chip, a mensagem deve ser enviada normalmente');
  
  console.log('✅ Teste de envio por departamento concluído!');
}, 1000); 