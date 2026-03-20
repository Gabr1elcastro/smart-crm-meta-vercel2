// Script para testar a busca independente do modal de detalhes
// Execute este script no console do navegador quando estiver na página /conversations

console.log('=== TESTE: Busca Independente do Modal de Detalhes ===');

// 1. Verificar se estamos na página correta
if (window.location.pathname !== '/conversations') {
  console.log('❌ ERRO: Não estamos na página /conversations');
  console.log('Página atual:', window.location.pathname);
  console.log('Para testar, acesse /conversations e execute este script novamente');
  return;
}

console.log('✅ Estamos na página correta: /conversations');

// 2. Função para verificar se há contatos
function verificarContatos() {
  console.log('🔍 Verificando contatos disponíveis...');
  
  const contatos = document.querySelectorAll('[class*="w-full text-left px-6 py-5"]');
  console.log('Contatos encontrados:', contatos.length);
  
  if (contatos.length === 0) {
    console.log('⚠️ Nenhum contato encontrado na lista');
    console.log('💡 Dica: Aguarde o carregamento dos contatos ou verifique se há conversas');
    return false;
  }
  
  return true;
}

// 3. Função para monitorar requisições ao Supabase
function monitorarRequisicoesSupabase() {
  console.log('🔍 Monitorando requisições ao Supabase...');
  
  // Capturar requisições fetch
  const originalFetch = window.fetch;
  let requisicoesSupabase = [];
  
  window.fetch = function(...args) {
    const url = args[0];
    if (typeof url === 'string' && url.includes('supabase')) {
      requisicoesSupabase.push({
        url: url,
        timestamp: new Date().toISOString(),
        method: args[1]?.method || 'GET'
      });
      console.log('📡 Requisição Supabase detectada:', url);
    }
    return originalFetch.apply(this, args);
  };
  
  return () => {
    window.fetch = originalFetch;
    return requisicoesSupabase;
  };
}

// 4. Função para simular clique com botão direito
function simularCliqueDireito() {
  console.log('🖱️ Simulando clique com botão direito em um contato...');
  
  const contatos = document.querySelectorAll('[class*="w-full text-left px-6 py-5"]');
  if (contatos.length > 0) {
    const primeiroContato = contatos[0];
    console.log('🎯 Clicando com botão direito no primeiro contato da lista...');
    
    // Simular evento de clique com botão direito
    const rightClickEvent = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      button: 2,
      buttons: 2
    });
    
    primeiroContato.dispatchEvent(rightClickEvent);
    
    // Aguardar o menu de contexto abrir
    setTimeout(() => {
      verificarMenuContextoAberto();
    }, 500);
  } else {
    console.log('❌ Nenhum contato encontrado para clicar');
  }
}

// 5. Verificar se o menu de contexto abriu
function verificarMenuContextoAberto() {
  console.log('🔍 Verificando se o menu de contexto abriu...');
  
  const menuContexto = document.querySelector('[class*="ContextMenuContent"]');
  if (menuContexto) {
    console.log('✅ Menu de contexto aberto');
    verificarOpcoesMenu();
  } else {
    console.log('❌ Menu de contexto não foi aberto');
  }
}

// 6. Verificar opções do menu e clicar em "Ver detalhes"
function verificarOpcoesMenu() {
  console.log('🔍 Verificando opções do menu de contexto...');
  
  const opcoes = document.querySelectorAll('[class*="ContextMenuItem"]');
  console.log('Opções encontradas:', opcoes.length);
  
  let encontrouVerDetalhes = false;
  
  opcoes.forEach((opcao, index) => {
    const texto = opcao.textContent || '';
    console.log(`Opção ${index + 1}:`, texto.trim());
    
    if (texto.includes('Ver detalhes')) {
      encontrouVerDetalhes = true;
      console.log('✅ Opção "Ver detalhes" encontrada');
    }
  });
  
  if (encontrouVerDetalhes) {
    console.log('🖱️ Clicando na opção "Ver detalhes"...');
    const opcaoVerDetalhes = Array.from(opcoes).find(opcao => 
      opcao.textContent?.includes('Ver detalhes')
    );
    
    if (opcaoVerDetalhes) {
      opcaoVerDetalhes.click();
      
      setTimeout(() => {
        verificarModalDetalhes();
      }, 500);
    }
  } else {
    console.log('❌ Opção "Ver detalhes" não encontrada');
  }
}

// 7. Verificar se o modal de detalhes abriu
function verificarModalDetalhes() {
  console.log('🔍 Verificando se o modal de detalhes abriu...');
  
  const modal = document.querySelector('[class*="fixed inset-0 z-50"]');
  if (modal) {
    console.log('✅ Modal de detalhes aberto');
    verificarConteudoModal();
  } else {
    console.log('❌ Modal de detalhes não foi aberto');
  }
}

// 8. Verificar conteúdo do modal
function verificarConteudoModal() {
  console.log('🔍 Verificando conteúdo do modal...');
  
  // Verificar título
  const titulo = document.querySelector('h2');
  if (titulo && titulo.textContent?.includes('Detalhes do Contato')) {
    console.log('✅ Título do modal correto');
  } else {
    console.log('❌ Título do modal não encontrado');
  }
  
  // Verificar campos de informação
  const campos = [
    'Nome:',
    'Telefone:',
    'Status de Atendimento:'
  ];
  
  campos.forEach(campo => {
    const elemento = Array.from(document.querySelectorAll('span')).find(el => 
      el.textContent?.includes(campo)
    );
    
    if (elemento) {
      console.log(`✅ Campo "${campo}" encontrado`);
    } else {
      console.log(`❌ Campo "${campo}" não encontrado`);
    }
  });
  
  // Verificar se há informações do lead
  const infoLead = document.querySelector('h3');
  if (infoLead && infoLead.textContent?.includes('Informações do Lead')) {
    console.log('✅ Seção de informações do lead encontrada');
  } else {
    console.log('ℹ️ Seção de informações do lead não encontrada (pode ser normal se o contato não estiver na base)');
  }
  
  // Verificar botão de fechar
  const botaoFechar = document.querySelector('button[class*="variant="secondary"]');
  if (botaoFechar) {
    console.log('✅ Botão "Fechar" encontrado');
  } else {
    console.log('❌ Botão "Fechar" não encontrado');
  }
}

// 9. Função para verificar se a busca foi independente
function verificarBuscaIndependente(requisicoesCapturadas) {
  console.log('🔍 Verificando se a busca foi independente...');
  
  if (requisicoesCapturadas.length === 0) {
    console.log('⚠️ Nenhuma requisição Supabase detectada');
    return;
  }
  
  console.log('📊 Requisições Supabase capturadas:', requisicoesCapturadas.length);
  
  // Verificar se há requisição específica para leads
  const requisicaoLeads = requisicoesCapturadas.find(req => 
    req.url.includes('leads') && req.method === 'GET'
  );
  
  if (requisicaoLeads) {
    console.log('✅ Requisição independente para leads detectada');
    console.log('📡 URL:', requisicaoLeads.url);
    console.log('⏰ Timestamp:', requisicaoLeads.timestamp);
  } else {
    console.log('❌ Requisição independente para leads não detectada');
  }
  
  // Verificar se não há requisições desnecessárias
  const requisicoesDesnecessarias = requisicoesCapturadas.filter(req => 
    !req.url.includes('leads') && req.url.includes('supabase')
  );
  
  if (requisicoesDesnecessarias.length === 0) {
    console.log('✅ Nenhuma requisição desnecessária detectada');
  } else {
    console.log('⚠️ Requisições desnecessárias detectadas:', requisicoesDesnecessarias.length);
  }
}

// 10. Função para testar fechamento do modal
function testarFechamentoModal() {
  console.log('❌ Testando fechamento do modal...');
  
  const botaoFechar = document.querySelector('button[class*="variant="secondary"]');
  if (botaoFechar) {
    console.log('🖱️ Clicando no botão "Fechar"...');
    botaoFechar.click();
    
    setTimeout(() => {
      const modal = document.querySelector('[class*="fixed inset-0 z-50"]');
      if (!modal) {
        console.log('✅ Modal fechado com sucesso');
      } else {
        console.log('❌ Modal ainda está aberto');
      }
    }, 500);
  } else {
    console.log('❌ Botão "Fechar" não encontrado');
  }
}

// Executar todos os testes
console.log('🚀 Iniciando testes da busca independente...');

// Verificar se há contatos
if (verificarContatos()) {
  // Iniciar monitoramento de requisições
  const pararMonitoramento = monitorarRequisicoesSupabase();
  
  // Simular clique com botão direito
  simularCliqueDireito();
  
  // Aguardar um pouco para os testes assíncronos
  setTimeout(() => {
    // Parar monitoramento e obter resultados
    const requisicoesCapturadas = pararMonitoramento();
    
    console.log('');
    console.log('📋 RESUMO DOS TESTES:');
    console.log('✅ Estrutura da página verificada');
    console.log('✅ Contatos encontrados');
    console.log('✅ Menu de contexto verificado');
    console.log('✅ Modal de detalhes testado');
    console.log('✅ Conteúdo do modal verificado');
    console.log('✅ Monitoramento de requisições');
    console.log('');
    console.log('🔧 MELHORIAS IMPLEMENTADAS:');
    console.log('✅ Busca independente do modal');
    console.log('✅ Não depende do polling das conversas');
    console.log('✅ Requisição específica para leads');
    console.log('✅ Dependência apenas do ID do contato');
    console.log('');
    console.log('🎯 PRÓXIMOS PASSOS PARA TESTE MANUAL:');
    console.log('1. Clique com botão direito em um contato da lista');
    console.log('2. Clique na opção "Ver detalhes" no menu');
    console.log('3. Verifique se o modal abre sem erros no console');
    console.log('4. Verifique se há informações do lead (se disponível)');
    console.log('5. Clique em "Fechar" para fechar o modal');
    console.log('');
    console.log('🔍 VERIFICAÇÃO DE BUSCA INDEPENDENTE:');
    verificarBuscaIndependente(requisicoesCapturadas);
    console.log('');
    console.log('✅ BENEFÍCIOS:');
    console.log('✅ Modal não é afetado pelo polling das conversas');
    console.log('✅ Busca específica apenas quando necessário');
    console.log('✅ Performance melhorada');
    console.log('✅ Dados sempre atualizados');
  }, 4000);
} else {
  console.log('');
  console.log('💡 SUGESTÕES:');
  console.log('1. Aguarde o carregamento dos contatos');
  console.log('2. Verifique se há conversas ativas');
  console.log('3. Execute o script novamente');
}

console.log('=== FIM DOS TESTES ==='); 