// Script de debug para identificar o problema na busca de contatos
// Execute este script no console do navegador quando estiver na página /contatos

console.log('=== DEBUG: Busca de Contatos ===');

// 1. Verificar se estamos na página correta
if (window.location.pathname !== '/contatos') {
  console.log('❌ ERRO: Não estamos na página /contatos');
  console.log('Página atual:', window.location.pathname);
  return;
}

console.log('✅ Estamos na página correta: /contatos');

// 2. Verificar estado inicial
function verificarEstadoInicial() {
  console.log('🔍 Verificando estado inicial...');
  
  // Verificar campo de busca
  const campoBusca = document.querySelector('input[placeholder*="Buscar"]');
  if (campoBusca) {
    console.log('✅ Campo de busca encontrado');
    console.log('📝 Valor atual:', campoBusca.value);
    console.log('📝 Placeholder:', campoBusca.placeholder);
  } else {
    console.log('❌ Campo de busca não encontrado');
  }
  
  // Verificar contatos
  const contatos = document.querySelectorAll('[class*="w-full text-left px-6 py-5"]');
  console.log('📊 Contatos encontrados:', contatos.length);
  
  // Verificar mensagens
  const mensagens = document.querySelectorAll('.text-center.text-gray-400');
  console.log('📝 Mensagens encontradas:', mensagens.length);
  mensagens.forEach((msg, index) => {
    console.log(`Mensagem ${index + 1}:`, msg.textContent);
  });
  
  // Verificar loading
  const loading = document.querySelector('.text-primary-600');
  if (loading && loading.textContent?.includes('Carregando')) {
    console.log('⏳ Estado de loading ativo');
  } else {
    console.log('✅ Não está em loading');
  }
}

// 3. Função para monitorar mudanças no campo de busca
function monitorarCampoBusca() {
  console.log('🔍 Monitorando campo de busca...');
  
  const campoBusca = document.querySelector('input[placeholder*="Buscar"]');
  if (!campoBusca) {
    console.log('❌ Campo de busca não encontrado');
    return;
  }
  
  // Adicionar listener para mudanças
  campoBusca.addEventListener('input', (e) => {
    console.log('🔄 Campo de busca alterado:', e.target.value);
    
    // Aguardar um pouco para o React processar
    setTimeout(() => {
      verificarEstadoAposBusca(e.target.value);
    }, 100);
  });
  
  console.log('✅ Listener adicionado ao campo de busca');
}

// 4. Verificar estado após busca
function verificarEstadoAposBusca(termo) {
  console.log(`🔍 Verificando estado após busca por: "${termo}"`);
  
  // Verificar contatos
  const contatos = document.querySelectorAll('[class*="w-full text-left px-6 py-5"]');
  console.log(`📊 Contatos visíveis: ${contatos.length}`);
  
  // Verificar mensagens
  const mensagens = document.querySelectorAll('.text-center.text-gray-400');
  console.log(`📝 Mensagens visíveis: ${mensagens.length}`);
  mensagens.forEach((msg, index) => {
    console.log(`Mensagem ${index + 1}:`, msg.textContent?.trim());
  });
  
  // Verificar se há elementos de lista
  const lista = document.querySelector('[class*="bg-white border"]');
  if (lista) {
    console.log('✅ Container da lista encontrado');
    console.log('📊 Altura da lista:', lista.offsetHeight);
  } else {
    console.log('❌ Container da lista não encontrado');
  }
  
  // Verificar se há elementos dentro da lista
  const elementosLista = lista?.querySelectorAll('*');
  console.log(`📊 Elementos dentro da lista: ${elementosLista?.length || 0}`);
}

// 5. Função para simular digitação
function simularDigitação(termo) {
  console.log(`🔍 Simulando digitação: "${termo}"`);
  
  const campoBusca = document.querySelector('input[placeholder*="Buscar"]');
  if (!campoBusca) {
    console.log('❌ Campo de busca não encontrado');
    return;
  }
  
  // Limpar campo
  campoBusca.value = '';
  campoBusca.dispatchEvent(new Event('input', { bubbles: true }));
  
  setTimeout(() => {
    console.log('📝 Campo limpo');
    verificarEstadoAposBusca('');
    
    // Digitar termo
    setTimeout(() => {
      campoBusca.value = termo;
      campoBusca.dispatchEvent(new Event('input', { bubbles: true }));
      
      setTimeout(() => {
        verificarEstadoAposBusca(termo);
      }, 200);
    }, 100);
  }, 100);
}

// 6. Função para verificar React DevTools
function verificarReactDevTools() {
  console.log('🔍 Verificando se React DevTools está disponível...');
  
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('✅ React DevTools detectado');
  } else {
    console.log('❌ React DevTools não detectado');
  }
}

// 7. Função para verificar erros no console
function verificarErrosConsole() {
  console.log('🔍 Verificando erros no console...');
  
  // Interceptar erros
  const originalError = console.error;
  console.error = function(...args) {
    console.log('🚨 ERRO CAPTURADO:', ...args);
    originalError.apply(console, args);
  };
  
  console.log('✅ Interceptador de erros ativo');
}

// 8. Função para verificar estrutura DOM
function verificarEstruturaDOM() {
  console.log('🏗️ Verificando estrutura DOM...');
  
  const elementos = {
    'Container principal': document.querySelector('.w-full.py-10.px-8'),
    'Campo de busca': document.querySelector('input[placeholder*="Buscar"]'),
    'Lista de contatos': document.querySelector('[class*="bg-white border"]'),
    'Mensagens': document.querySelectorAll('.text-center.text-gray-400'),
    'Loading': document.querySelector('.text-primary-600')
  };
  
  Object.entries(elementos).forEach(([nome, elemento]) => {
    if (elemento) {
      if (Array.isArray(elemento)) {
        console.log(`✅ ${nome}: ${elemento.length} elementos`);
      } else {
        console.log(`✅ ${nome}: encontrado`);
        console.log(`   - Classes: ${elemento.className}`);
        console.log(`   - Visível: ${elemento.offsetParent !== null}`);
        console.log(`   - Altura: ${elemento.offsetHeight}`);
      }
    } else {
      console.log(`❌ ${nome}: não encontrado`);
    }
  });
}

// 9. Função para testar diferentes cenários
function testarCenarios() {
  console.log('🧪 Testando diferentes cenários...');
  
  // Cenário 1: Busca vazia
  console.log('📝 Cenário 1: Busca vazia');
  simularDigitação('');
  
  setTimeout(() => {
    // Cenário 2: Busca com termo
    console.log('📝 Cenário 2: Busca com termo');
    simularDigitação('teste');
    
    setTimeout(() => {
      // Cenário 3: Busca com termo longo
      console.log('📝 Cenário 3: Busca com termo longo');
      simularDigitação('termo muito longo que não deve existir');
      
      setTimeout(() => {
        // Cenário 4: Voltar para busca vazia
        console.log('📝 Cenário 4: Voltar para busca vazia');
        simularDigitação('');
        
        setTimeout(() => {
          console.log('');
          console.log('📋 RESUMO DO DEBUG:');
          console.log('✅ Estado inicial verificado');
          console.log('✅ Monitoramento ativo');
          console.log('✅ Cenários testados');
          console.log('');
          console.log('🎯 PRÓXIMOS PASSOS:');
          console.log('1. Digite algo no campo de busca');
          console.log('2. Observe os logs no console');
          console.log('3. Verifique se há erros');
          console.log('4. Compare com o comportamento esperado');
        }, 1000);
      }, 1000);
    }, 1000);
  }, 1000);
}

// Executar debug
console.log('🚀 Iniciando debug da busca de contatos...');

// Verificar estado inicial
verificarEstadoInicial();

// Verificar React DevTools
verificarReactDevTools();

// Verificar erros no console
verificarErrosConsole();

// Verificar estrutura DOM
verificarEstruturaDOM();

// Monitorar campo de busca
monitorarCampoBusca();

// Testar cenários
testarCenarios();

console.log('=== DEBUG INICIADO ===');
console.log('💡 Digite algo no campo de busca e observe os logs'); 