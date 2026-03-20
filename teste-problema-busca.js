// Script para testar especificamente o problema da busca
// Execute este script no console do navegador quando estiver na página /contatos

console.log('=== TESTE ESPECÍFICO: Problema da Busca ===');

// 1. Verificar se estamos na página correta
if (window.location.pathname !== '/contatos') {
  console.log('❌ ERRO: Não estamos na página /contatos');
  console.log('Página atual:', window.location.pathname);
  return;
}

console.log('✅ Estamos na página correta: /contatos');

// 2. Função para verificar estado antes da busca
function verificarEstadoAntes() {
  console.log('🔍 Estado ANTES da busca:');
  
  const contatos = document.querySelectorAll('[class*="w-full text-left px-6 py-5"]');
  console.log(`📊 Contatos visíveis: ${contatos.length}`);
  
  const mensagens = document.querySelectorAll('.text-center.text-gray-400');
  console.log(`📝 Mensagens visíveis: ${mensagens.length}`);
  
  const loading = document.querySelector('.text-primary-600');
  console.log(`⏳ Loading ativo: ${loading ? 'Sim' : 'Não'}`);
  
  const lista = document.querySelector('[class*="bg-white border"]');
  console.log(`📋 Lista encontrada: ${lista ? 'Sim' : 'Não'}`);
  
  return {
    contatos: contatos.length,
    mensagens: mensagens.length,
    loading: !!loading,
    lista: !!lista
  };
}

// 3. Função para verificar estado durante a busca
function verificarEstadoDurante(termo) {
  console.log(`🔍 Estado DURANTE busca por "${termo}":`);
  
  const contatos = document.querySelectorAll('[class*="w-full text-left px-6 py-5"]');
  console.log(`📊 Contatos visíveis: ${contatos.length}`);
  
  const mensagens = document.querySelectorAll('.text-center.text-gray-400');
  console.log(`📝 Mensagens visíveis: ${mensagens.length}`);
  mensagens.forEach((msg, index) => {
    console.log(`   Mensagem ${index + 1}: "${msg.textContent?.trim()}"`);
  });
  
  const loading = document.querySelector('.text-primary-600');
  console.log(`⏳ Loading ativo: ${loading ? 'Sim' : 'Não'}`);
  
  const lista = document.querySelector('[class*="bg-white border"]');
  console.log(`📋 Lista encontrada: ${lista ? 'Sim' : 'Não'}`);
  
  // Verificar se há elementos dentro da lista
  if (lista) {
    const elementosLista = lista.querySelectorAll('*');
    console.log(`📊 Elementos dentro da lista: ${elementosLista.length}`);
    
    // Verificar se há botões de contato
    const botoesContato = lista.querySelectorAll('button');
    console.log(`🔘 Botões de contato: ${botoesContato.length}`);
  }
  
  return {
    contatos: contatos.length,
    mensagens: mensagens.length,
    loading: !!loading,
    lista: !!lista
  };
}

// 4. Função para testar busca específica
function testarBuscaEspecifica(termo) {
  console.log(`🧪 Testando busca por: "${termo}"`);
  
  const campoBusca = document.querySelector('input[placeholder*="Buscar"]');
  if (!campoBusca) {
    console.log('❌ Campo de busca não encontrado');
    return;
  }
  
  // Estado antes
  const estadoAntes = verificarEstadoAntes();
  
  // Limpar campo
  campoBusca.value = '';
  campoBusca.dispatchEvent(new Event('input', { bubbles: true }));
  
  setTimeout(() => {
    console.log('📝 Campo limpo');
    const estadoLimpo = verificarEstadoDurante('');
    
    // Digitar termo
    setTimeout(() => {
      campoBusca.value = termo;
      campoBusca.dispatchEvent(new Event('input', { bubbles: true }));
      
      setTimeout(() => {
        const estadoDurante = verificarEstadoDurante(termo);
        
        console.log('');
        console.log('📊 COMPARAÇÃO DE ESTADOS:');
        console.log('Antes:', estadoAntes);
        console.log('Limpo:', estadoLimpo);
        console.log('Durante:', estadoDurante);
        
        // Verificar se houve mudança problemática
        if (estadoAntes.contatos > 0 && estadoDurante.contatos === 0 && estadoDurante.mensagens === 0) {
          console.log('🚨 PROBLEMA IDENTIFICADO: Contatos desapareceram sem mensagem!');
        } else if (estadoDurante.loading) {
          console.log('⚠️ ATENÇÃO: Loading ativo durante busca');
        } else if (estadoDurante.lista && estadoDurante.contatos === 0) {
          console.log('⚠️ ATENÇÃO: Lista existe mas sem contatos');
        } else {
          console.log('✅ Comportamento parece normal');
        }
      }, 300);
    }, 200);
  }, 200);
}

// 5. Função para verificar React state
function verificarReactState() {
  console.log('🔍 Tentando verificar estado do React...');
  
  // Tentar acessar variáveis do React através do DOM
  const debugElement = document.querySelector('div[style*="display: none"]');
  if (debugElement) {
    console.log('📝 Debug info encontrada:', debugElement.textContent);
  } else {
    console.log('❌ Debug info não encontrada');
  }
}

// 6. Função para verificar erros JavaScript
function verificarErrosJS() {
  console.log('🔍 Verificando erros JavaScript...');
  
  // Interceptar erros
  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.error = function(...args) {
    console.log('🚨 ERRO:', ...args);
    originalError.apply(console, args);
  };
  
  console.warn = function(...args) {
    console.log('⚠️ WARNING:', ...args);
    originalWarn.apply(console, args);
  };
  
  console.log('✅ Interceptadores de erro ativos');
}

// 7. Função para testar diferentes cenários
function testarCenariosEspecificos() {
  console.log('🧪 Testando cenários específicos...');
  
  // Cenário 1: Busca vazia
  console.log('');
  console.log('📝 CENÁRIO 1: Busca vazia');
  testarBuscaEspecifica('');
  
  setTimeout(() => {
    // Cenário 2: Busca com termo simples
    console.log('');
    console.log('📝 CENÁRIO 2: Busca com termo simples');
    testarBuscaEspecifica('a');
    
    setTimeout(() => {
      // Cenário 3: Busca com termo inexistente
      console.log('');
      console.log('📝 CENÁRIO 3: Busca com termo inexistente');
      testarBuscaEspecifica('xyz123');
      
      setTimeout(() => {
        // Cenário 4: Voltar para vazio
        console.log('');
        console.log('📝 CENÁRIO 4: Voltar para vazio');
        testarBuscaEspecifica('');
        
        setTimeout(() => {
          console.log('');
          console.log('📋 RESUMO DOS TESTES:');
          console.log('✅ Todos os cenários testados');
          console.log('✅ Estados comparados');
          console.log('✅ Problemas identificados');
          console.log('');
          console.log('🎯 PRÓXIMOS PASSOS:');
          console.log('1. Verifique os logs acima');
          console.log('2. Identifique o padrão do problema');
          console.log('3. Compare com o comportamento esperado');
          console.log('4. Reporte os resultados');
        }, 2000);
      }, 2000);
    }, 2000);
  }, 2000);
}

// Executar testes
console.log('🚀 Iniciando testes específicos...');

// Verificar erros JavaScript
verificarErrosJS();

// Verificar React state
verificarReactState();

// Testar cenários específicos
testarCenariosEspecificos();

console.log('=== TESTES INICIADOS ===');
console.log('💡 Aguarde os resultados dos testes...'); 