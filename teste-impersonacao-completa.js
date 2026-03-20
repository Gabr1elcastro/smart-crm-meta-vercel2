// Script para testar a funcionalidade completa de impersonação
// Execute este script no console do navegador

console.log('=== TESTE DE IMPERSONAÇÃO COMPLETA ===');

// Função para simular impersonação completa
function simularImpersonacaoCompleta(clienteId, clienteName) {
  console.log(`Simulando impersonação completa do cliente: ${clienteName} (ID: ${clienteId})`);
  
  // Armazenar dados de impersonação
  const clienteImpersonado = {
    id: clienteId,
    name: clienteName,
    email: 'teste@exemplo.com',
    phone: '(11) 99999-9999',
    instance_name: 'teste_instance',
    instance_id: 'teste-instance-id',
    sender_number: '5511999999999',
    apikey: 'teste-api-key',
    atendimento_humano: true,
    atendimento_ia: false,
    id_chatbot: null,
    id_departamento_chip_1: null,
    id_departamento_chip_2: null
  };
  
  sessionStorage.setItem('impersonatedCliente', JSON.stringify(clienteImpersonado));
  sessionStorage.setItem('isImpersonating', 'true');
  
  console.log('✅ Dados de impersonação completos armazenados');
  console.log('📋 Próximos passos:');
  console.log('1. Recarregue a página (F5)');
  console.log('2. Verifique se o banner de super admin aparece');
  console.log('3. Verifique se os chatbots aparecem');
  console.log('4. Verifique se o status de conexão aparece');
  console.log('5. Teste todas as funcionalidades da aplicação');
}

// Função para verificar dados carregados
async function verificarDadosCarregados() {
  console.log('=== VERIFICANDO DADOS CARREGADOS ===');
  
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );
    
    // Verificar se está em modo de impersonação
    const isImpersonating = sessionStorage.getItem('isImpersonating') === 'true';
    const impersonatedClienteStr = sessionStorage.getItem('impersonatedCliente');
    
    if (isImpersonating && impersonatedClienteStr) {
      const cliente = JSON.parse(impersonatedClienteStr);
      console.log('✅ Modo impersonação ativo');
      console.log('Cliente impersonado:', cliente);
      
      // Verificar se os dados do cliente estão no banco
      const { data: clienteCompleto, error } = await supabase
        .from('clientes_info')
        .select('*')
        .eq('id', cliente.id)
        .single();
      
      if (error) {
        console.log('❌ Erro ao buscar cliente no banco:', error);
      } else {
        console.log('✅ Cliente encontrado no banco:', clienteCompleto);
        
        // Verificar chatbots pelo id_cliente
        const { data: chatbots, error: chatbotsError } = await supabase
          .from('prompts_oficial')
          .select('*')
          .eq('id_cliente', cliente.id.toString());
        
        if (chatbotsError) {
          console.log('❌ Erro ao buscar chatbots:', chatbotsError);
        } else {
          console.log('✅ Chatbots encontrados pelo id_cliente:', chatbots?.length || 0);
          if (chatbots && chatbots.length > 0) {
            console.log('Chatbots:', chatbots.map(c => ({ id: c.id, nome: c.nome, em_uso: c.em_uso })));
          }
        }
        
        // Verificar chatbots pelo id_usuario (método antigo)
        const { data: chatbotsOld, error: chatbotsOldError } = await supabase
          .from('prompts_oficial')
          .select('*')
          .eq('id_usuario', cliente.user_id_auth || 'teste');
        
        if (chatbotsOldError) {
          console.log('❌ Erro ao buscar chatbots pelo id_usuario:', chatbotsOldError);
        } else {
          console.log('✅ Chatbots encontrados pelo id_usuario:', chatbotsOld?.length || 0);
        }
        
        // Verificar departamentos
        const { data: departamentos, error: deptError } = await supabase
          .from('departamento')
          .select('*')
          .eq('id_cliente', cliente.id);
        
        if (deptError) {
          console.log('❌ Erro ao buscar departamentos:', deptError);
        } else {
          console.log('✅ Departamentos encontrados:', departamentos?.length || 0);
        }
      }
    } else {
      console.log('❌ Modo impersonação inativo');
    }
  } catch (error) {
    console.error('Erro ao verificar dados:', error);
  }
}

// Função para testar componentes específicos
function testarComponentes() {
  console.log('=== TESTANDO COMPONENTES ===');
  
  // Verificar se o banner está visível
  const banner = document.querySelector('[data-testid="super-admin-banner"]') || 
                 document.querySelector('.border-orange-200');
  console.log('Banner visível:', banner ? '✅ SIM' : '❌ NÃO');
  
  // Verificar se há chatbots na página
  const chatbotElements = document.querySelectorAll('[data-testid*="chatbot"], .chatbot, [class*="chatbot"]');
  console.log('Elementos de chatbot encontrados:', chatbotElements.length);
  
  // Verificar se há status de conexão
  const connectionElements = document.querySelectorAll('[data-testid*="connection"], [class*="connection"], [class*="status"]');
  console.log('Elementos de status de conexão encontrados:', connectionElements.length);
  
  // Verificar se há departamentos
  const departmentElements = document.querySelectorAll('[data-testid*="department"], [class*="department"], [class*="departamento"]');
  console.log('Elementos de departamento encontrados:', departmentElements.length);
  
  // Verificar se há leads
  const leadElements = document.querySelectorAll('[data-testid*="lead"], [class*="lead"]');
  console.log('Elementos de lead encontrados:', leadElements.length);
  
  // Verificar se há conversas
  const conversationElements = document.querySelectorAll('[data-testid*="conversation"], [class*="conversation"], [class*="conversa"]');
  console.log('Elementos de conversa encontrados:', conversationElements.length);
}

// Função para verificar contexto React
function verificarContextoReact() {
  console.log('=== VERIFICANDO CONTEXTO REACT ===');
  
  // Verificar se o React DevTools está disponível
  if (window.React && window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
    console.log('✅ React DevTools disponível');
    console.log('💡 Dica: Use o React DevTools para inspecionar:');
    console.log('   - AuthContext.user.id_cliente');
    console.log('   - usePermissions.permissions');
    console.log('   - WhatsAppConnect.clientInfo');
    console.log('   - ChatbotTester.clientId');
  } else {
    console.log('❌ React DevTools não disponível');
  }
  
  // Verificar sessionStorage
  console.log('SessionStorage:');
  console.log('  isImpersonating:', sessionStorage.getItem('isImpersonating'));
  console.log('  impersonatedCliente:', sessionStorage.getItem('impersonatedCliente'));
  console.log('  isSuperAdmin:', sessionStorage.getItem('isSuperAdmin'));
  console.log('  superAdminData:', sessionStorage.getItem('superAdminData'));
}

// Função para limpar impersonação
function limparImpersonacao() {
  console.log('Limpando dados de impersonação...');
  
  sessionStorage.removeItem('impersonatedCliente');
  sessionStorage.removeItem('isImpersonating');
  
  console.log('✅ Dados de impersonação removidos');
  console.log('📋 Próximos passos:');
  console.log('1. Recarregue a página (F5)');
  console.log('2. Verifique se voltou ao estado normal');
}

// Expor funções globalmente
window.simularImpersonacaoCompleta = simularImpersonacaoCompleta;
window.verificarDadosCarregados = verificarDadosCarregados;
window.testarComponentes = testarComponentes;
window.verificarContextoReact = verificarContextoReact;
window.limparImpersonacao = limparImpersonacao;

console.log('=== FUNÇÕES DISPONÍVEIS ===');
console.log('simularImpersonacaoCompleta(clienteId, clienteName) - Simula impersonação completa');
console.log('verificarDadosCarregados() - Verifica dados no banco');
console.log('testarComponentes() - Testa componentes na página');
console.log('verificarContextoReact() - Verifica contexto React');
console.log('limparImpersonacao() - Remove dados de impersonação');

console.log('\n=== EXEMPLO DE USO ===');
console.log('simularImpersonacaoCompleta(13, "Bruno 3")');
console.log('// Recarregue a página');
console.log('verificarDadosCarregados()');
console.log('testarComponentes()');
console.log('verificarContextoReact()');
console.log('limparImpersonacao()');

// Executar verificação inicial
verificarContextoReact(); 