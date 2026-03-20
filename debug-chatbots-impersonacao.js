// Script para debug de chatbots durante impersonação
// Execute este script no console do navegador

console.log('=== DEBUG CHATBOTS IMPERSONAÇÃO ===');

async function debugChatbotsImpersonacao() {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );
    
    console.log('1. Verificando modo de impersonação...');
    
    // Verificar se está em modo de impersonação
    const isImpersonating = sessionStorage.getItem('isImpersonating') === 'true';
    const impersonatedClienteStr = sessionStorage.getItem('impersonatedCliente');
    
    console.log('isImpersonating:', isImpersonating);
    console.log('impersonatedClienteStr:', impersonatedClienteStr);
    
    if (isImpersonating && impersonatedClienteStr) {
      const cliente = JSON.parse(impersonatedClienteStr);
      console.log('✅ Cliente impersonado:', cliente);
      
      console.log('\n2. Verificando estrutura da tabela prompts_oficial...');
      
      // Verificar se a coluna id_cliente existe
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_name', 'prompts_oficial')
        .eq('column_name', 'id_cliente');
      
      if (columnsError) {
        console.log('❌ Erro ao verificar colunas:', columnsError);
      } else {
        console.log('✅ Coluna id_cliente existe:', columns?.length > 0);
        if (columns && columns.length > 0) {
          console.log('Tipo da coluna:', columns[0]);
        }
      }
      
      console.log('\n3. Testando busca de chatbots por id_cliente...');
      
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
          console.log('Exemplos:', chatbotsPorIdCliente.slice(0, 3));
        }
      }
      
      console.log('\n4. Testando busca de chatbots por id_usuario...');
      
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
          console.log('Exemplos:', chatbotsPorIdUsuario.slice(0, 3));
        }
      }
      
      console.log('\n5. Verificando todos os chatbots da tabela...');
      
      // Teste 3: Verificar todos os chatbots
      const { data: todosChatbots, error: error3 } = await supabase
        .from('prompts_oficial')
        .select('id, nome, id_usuario, id_cliente, em_uso')
        .limit(10);
      
      console.log('Busca geral:', error3 ? '❌ ERRO' : '✅ OK');
      if (error3) {
        console.error('Erro:', error3);
      } else {
        console.log('Total de chatbots na tabela:', todosChatbots?.length || 0);
        if (todosChatbots && todosChatbots.length > 0) {
          console.log('Exemplos:', todosChatbots);
        }
      }
      
      console.log('\n6. Verificando se há chatbots sem id_cliente...');
      
      // Teste 4: Verificar chatbots sem id_cliente
      const { data: chatbotsSemIdCliente, error: error4 } = await supabase
        .from('prompts_oficial')
        .select('id, nome, id_usuario, id_cliente')
        .or('id_cliente.is.null,id_cliente.eq.')
        .limit(5);
      
      console.log('Chatbots sem id_cliente:', error4 ? '❌ ERRO' : '✅ OK');
      if (error4) {
        console.error('Erro:', error4);
      } else {
        console.log('Chatbots sem id_cliente:', chatbotsSemIdCliente?.length || 0);
        if (chatbotsSemIdCliente && chatbotsSemIdCliente.length > 0) {
          console.log('Exemplos:', chatbotsSemIdCliente);
        }
      }
      
    } else {
      console.log('❌ Modo impersonação inativo');
    }
    
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

// Função para testar o componente ChatbotTester
function testarChatbotTester() {
  console.log('\n=== TESTANDO COMPONENTE CHATBOT TESTER ===');
  
  // Verificar se o componente está na página
  const chatbotTester = document.querySelector('[data-testid="chatbot-tester"]') || 
                        document.querySelector('.chatbot-tester') ||
                        document.querySelector('[class*="chatbot"]');
  
  console.log('ChatbotTester encontrado:', chatbotTester ? '✅ SIM' : '❌ NÃO');
  
  // Verificar se há elementos de chatbot na página
  const chatbotElements = document.querySelectorAll('[data-testid*="chatbot"], .chatbot, [class*="chatbot"]');
  console.log('Elementos de chatbot encontrados:', chatbotElements.length);
  
  // Verificar se há dropdown de seleção de chatbot
  const selectElements = document.querySelectorAll('select, [role="combobox"]');
  console.log('Elementos de seleção encontrados:', selectElements.length);
  
  // Verificar se há botões de chatbot
  const chatbotButtons = document.querySelectorAll('button[class*="chatbot"], button[data-testid*="chatbot"]');
  console.log('Botões de chatbot encontrados:', chatbotButtons.length);
}

// Função para simular busca de chatbots como o componente faz
async function simularBuscaChatbots() {
  console.log('\n=== SIMULANDO BUSCA DE CHATBOTS ===');
  
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );
    
    // Simular o que o ChatbotTester faz
    const isImpersonating = sessionStorage.getItem('isImpersonating') === 'true';
    const impersonatedClienteStr = sessionStorage.getItem('impersonatedCliente');
    
    if (isImpersonating && impersonatedClienteStr) {
      const cliente = JSON.parse(impersonatedClienteStr);
      console.log('Simulando busca para cliente:', cliente.id);
      
      // Buscar chatbots pelo id_cliente
      const { data: chatbotsData, error } = await supabase
        .from('prompts_oficial')
        .select('*')
        .eq('id_cliente', cliente.id.toString());
      
      console.log('Resultado da busca:', error ? '❌ ERRO' : '✅ OK');
      if (error) {
        console.error('Erro:', error);
      } else {
        console.log('Chatbots encontrados:', chatbotsData?.length || 0);
        if (chatbotsData && chatbotsData.length > 0) {
          console.log('Chatbots:', chatbotsData.map(c => ({ id: c.id, nome: c.nome, id_cliente: c.id_cliente })));
        }
      }
    } else {
      console.log('❌ Não está em modo de impersonação');
    }
    
  } catch (error) {
    console.error('Erro ao simular busca:', error);
  }
}

// Expor funções globalmente
window.debugChatbotsImpersonacao = debugChatbotsImpersonacao;
window.testarChatbotTester = testarChatbotTester;
window.simularBuscaChatbots = simularBuscaChatbots;

console.log('=== FUNÇÕES DISPONÍVEIS ===');
console.log('debugChatbotsImpersonacao() - Debug completo de chatbots');
console.log('testarChatbotTester() - Testa componente na página');
console.log('simularBuscaChatbots() - Simula busca como o componente');

console.log('\n=== EXEMPLO DE USO ===');
console.log('debugChatbotsImpersonacao()');
console.log('testarChatbotTester()');
console.log('simularBuscaChatbots()');

// Executar debug inicial
debugChatbotsImpersonacao(); 