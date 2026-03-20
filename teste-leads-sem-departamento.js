// Teste de Leads Sem Departamento - Chip 1 por Padrão
console.log('🧪 Testando Leads Sem Departamento...');

// Verificar se a lógica de chip 1 por padrão está funcionando
const checkLeadsWithoutDepartment = () => {
  console.log('📋 Verificando lógica de leads sem departamento...');
  
  // Verificar se há logs de busca de departamento
  const logs = console.log;
  let chip1Used = false;
  let defaultChipUsed = false;
  
  // Interceptar logs para verificar se a lógica está funcionando
  console.log = (...args) => {
    const message = args.join(' ');
    
    if (message.includes('Usando chip 1 por padrão para lead sem departamento')) {
      console.log('✅ Log de chip 1 por padrão encontrado');
      chip1Used = true;
    }
    
    if (message.includes('Chip 1 não configurado para este cliente')) {
      console.log('⚠️  Erro esperado - chip 1 não configurado:', message);
    }
    
    if (message.includes('Departamento do lead: null')) {
      console.log('✅ Lead sem departamento identificado');
    }
    
    if (message.includes('Chip associado:') && !message.includes('null')) {
      console.log('✅ Chip associado identificado:', message);
      defaultChipUsed = true;
    }
    
    // Chamar o console.log original
    logs.apply(console, args);
  };
  
  return { chip1Used, defaultChipUsed };
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
        console.log('📝 Para testar leads sem departamento:');
        console.log('   1. Selecione um contato que NÃO tenha departamento');
        console.log('   2. Digite uma mensagem');
        console.log('   3. Clique em enviar');
        console.log('   4. Verifique se usa chip 1 por padrão');
        console.log('   5. Se chip 1 não estiver configurado, deve aparecer erro');
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
  
  console.log('📋 Instruções para teste manual de leads sem departamento:');
  console.log('   1. Vá para a página de Conversas');
  console.log('   2. Selecione um contato que NÃO tenha departamento');
  console.log('   3. Digite uma mensagem e tente enviar');
  console.log('   4. Se chip 1 estiver configurado, deve enviar normalmente');
  console.log('   5. Se chip 1 não estiver configurado, deve aparecer:');
  console.log('      "Chip 1 não configurado para este cliente"');
  console.log('   6. Verifique os logs no console para confirmar o comportamento');
  
  console.log('✅ Teste de leads sem departamento concluído!');
}, 1000); 