// Script para testar chatbots durante impersonação
// Execute este script no console do navegador

console.log('=== TESTE CHATBOTS IMPERSONAÇÃO ===');

async function testarChatbotsImpersonacao() {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );
    
    console.log('1. Verificando modo de impersonação...');
    
    const isImpersonating = sessionStorage.getItem('isImpersonating') === 'true';
    const impersonatedClienteStr = sessionStorage.getItem('impersonatedCliente');
    
    if (!isImpersonating || !impersonatedClienteStr) {
      console.log('❌ Não está em modo de impersonação');
      console.log('Execute primeiro: simularImpersonacaoCompleta(13, "Bruno 3")');
      return;
    }
    
    const cliente = JSON.parse(impersonatedClienteStr);
    console.log('✅ Cliente impersonado:', cliente);
    
    console.log('\n2. Testando busca de chatbots...');
    
    // Teste 1: Buscar chatbots pelo id_cliente
    const { data: chatbotsPorIdCliente, error: error1 } = await supabase
      .from('prompts_oficial')
      .select('*')
      .eq('id_cliente', cliente.id.toString());
    
    console.log('Busca por id_cliente:', error1 ? '❌ ERRO' : '✅ OK');
    if (error1) {
      console.error('Erro:', error1);
    } else {
      console.log('Chatbots encontrados por id_cliente:', chatbotsPorIdCliente?.length || 0);
      if (chatbotsPorIdCliente && chatbotsPorIdCliente.length > 0) {
        console.log('Chatbots:', chatbotsPorIdCliente.map(c => ({ id: c.id, nome: c.nome, id_cliente: c.id_cliente })));
      }
    }
    
    // Teste 2: Buscar chatbots pelo id_usuario (método antigo)
    const { data: chatbotsPorIdUsuario, error: error2 } = await supabase
      .from('prompts_oficial')
      .select('*')
      .eq('id_usuario', cliente.user_id_auth || 'teste');
    
    console.log('Busca por id_usuario:', error2 ? '❌ ERRO' : '✅ OK');
    if (error2) {
      console.error('Erro:', error2);
    } else {
      console.log('Chatbots encontrados por id_usuario:', chatbotsPorIdUsuario?.length || 0);
      if (chatbotsPorIdUsuario && chatbotsPorIdUsuario.length > 0) {
        console.log('Chatbots:', chatbotsPorIdUsuario.map(c => ({ id: c.id, nome: c.nome, id_usuario: c.id_usuario })));
      }
    }
    
    console.log('\n3. Verificando se há chatbots sem id_cliente...');
    
    // Verificar chatbots sem id_cliente
    const { data: chatbotsSemIdCliente, error: error3 } = await supabase
      .from('prompts_oficial')
      .select('id, nome, id_usuario, id_cliente')
      .or('id_cliente.is.null,id_cliente.eq.')
      .limit(10);
    
    if (error3) {
      console.error('Erro ao buscar chatbots sem id_cliente:', error3);
    } else {
      console.log('Chatbots sem id_cliente:', chatbotsSemIdCliente?.length || 0);
      if (chatbotsSemIdCliente && chatbotsSemIdCliente.length > 0) {
        console.log('Exemplos:', chatbotsSemIdCliente);
      }
    }
    
    console.log('\n4. Verificando se há chatbots com id_cliente...');
    
    // Verificar chatbots com id_cliente
    const { data: chatbotsComIdCliente, error: error4 } = await supabase
      .from('prompts_oficial')
      .select('id, nome, id_usuario, id_cliente')
      .not('id_cliente', 'is', null)
      .limit(10);
    
    if (error4) {
      console.error('Erro ao buscar chatbots com id_cliente:', error4);
    } else {
      console.log('Chatbots com id_cliente:', chatbotsComIdCliente?.length || 0);
      if (chatbotsComIdCliente && chatbotsComIdCliente.length > 0) {
        console.log('Exemplos:', chatbotsComIdCliente);
      }
    }
    
    console.log('\n5. Verificando se há chatbots para o cliente específico...');
    
    // Verificar chatbots específicos do cliente
    const { data: chatbotsCliente, error: error5 } = await supabase
      .from('prompts_oficial')
      .select('id, nome, id_usuario, id_cliente, em_uso')
      .eq('id_cliente', cliente.id.toString());
    
    if (error5) {
      console.error('Erro ao buscar chatbots do cliente:', error5);
    } else {
      console.log('Chatbots do cliente:', chatbotsCliente?.length || 0);
      if (chatbotsCliente && chatbotsCliente.length > 0) {
        console.log('Chatbots:', chatbotsCliente);
      } else {
        console.log('⚠️ Nenhum chatbot encontrado para este cliente');
        console.log('💡 Execute: atualizarChatbotsComIdCliente()');
      }
    }
    
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

// Função para atualizar chatbots se necessário
async function atualizarChatbotsSeNecessario() {
  console.log('\n=== ATUALIZANDO CHATBOTS SE NECESSÁRIO ===');
  
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );
    
    // Verificar se há chatbots sem id_cliente
    const { data: chatbotsSemIdCliente, error } = await supabase
      .from('prompts_oficial')
      .select('id, nome, id_usuario, id_cliente')
      .or('id_cliente.is.null,id_cliente.eq.')
      .limit(5);
    
    if (error) {
      console.error('Erro ao verificar chatbots:', error);
      return;
    }
    
    if (chatbotsSemIdCliente && chatbotsSemIdCliente.length > 0) {
      console.log('⚠️ Encontrados chatbots sem id_cliente:', chatbotsSemIdCliente.length);
      console.log('💡 Execute: atualizarChatbotsComIdCliente()');
    } else {
      console.log('✅ Todos os chatbots já têm id_cliente');
    }
    
  } catch (error) {
    console.error('Erro ao verificar chatbots:', error);
  }
}

// Função para testar componentes na página
function testarComponentesChatbot() {
  console.log('\n=== TESTANDO COMPONENTES CHATBOT ===');
  
  // Verificar se há elementos de chatbot na página
  const chatbotElements = document.querySelectorAll('[data-testid*="chatbot"], .chatbot, [class*="chatbot"]');
  console.log('Elementos de chatbot encontrados:', chatbotElements.length);
  
  // Verificar se há dropdown de seleção
  const selectElements = document.querySelectorAll('select, [role="combobox"]');
  console.log('Elementos de seleção encontrados:', selectElements.length);
  
  // Verificar se há botões de chatbot
  const chatbotButtons = document.querySelectorAll('button[class*="chatbot"], button[data-testid*="chatbot"]');
  console.log('Botões de chatbot encontrados:', chatbotButtons.length);
  
  // Verificar se há mensagens de erro
  const errorElements = document.querySelectorAll('.error, .alert, [class*="error"], [class*="alert"]');
  console.log('Elementos de erro encontrados:', errorElements.length);
  
  // Verificar se há elementos de loading
  const loadingElements = document.querySelectorAll('[class*="loading"], [class*="spinner"], .loader');
  console.log('Elementos de loading encontrados:', loadingElements.length);
}

// Expor funções globalmente
window.testarChatbotsImpersonacao = testarChatbotsImpersonacao;
window.atualizarChatbotsSeNecessario = atualizarChatbotsSeNecessario;
window.testarComponentesChatbot = testarComponentesChatbot;

console.log('=== FUNÇÕES DISPONÍVEIS ===');
console.log('testarChatbotsImpersonacao() - Testa chatbots durante impersonação');
console.log('atualizarChatbotsSeNecessario() - Verifica se precisa atualizar chatbots');
console.log('testarComponentesChatbot() - Testa componentes na página');

console.log('\n=== EXEMPLO DE USO ===');
console.log('testarChatbotsImpersonacao()');
console.log('atualizarChatbotsSeNecessario()');
console.log('testarComponentesChatbot()');

// Executar teste inicial
testarChatbotsImpersonacao(); 