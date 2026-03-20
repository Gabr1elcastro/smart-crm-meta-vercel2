// 🧪 Teste: Tipos de Chatbot Atualizados
// Execute este script na página de criação de chatbot para testar as alterações

console.log('🧪 Iniciando teste dos tipos de chatbot atualizados...');

// Função para testar os tipos de chatbot
async function testarTiposChatbot() {
  console.log('📋 Verificando se estamos na página correta...');
  
  // Verificar se estamos na página de criação de chatbot
  if (!window.location.pathname.includes('/chatbots') && !window.location.pathname.includes('/chatbot')) {
    console.error('❌ Este teste deve ser executado na página de chatbots');
    return;
  }
  
  console.log('✅ Página de chatbots detectada');
  
  // Aguardar o carregamento da página
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Verificar se há o seletor de tipos de chatbot
  const tipoSelector = document.querySelector('select') || document.querySelector('[role="combobox"]');
  if (!tipoSelector) {
    console.log('🔍 Procurando por outros elementos de seleção...');
    
    // Procurar por botões ou cards que possam ser seletores de tipo
    const botoes = Array.from(document.querySelectorAll('button, [class*="card"], [class*="border"]'));
    console.log('🔘 Elementos encontrados:', botoes.length);
    
    if (botoes.length > 0) {
      console.log('📋 Primeiros elementos:', botoes.slice(0, 5).map(el => ({
        tag: el.tagName,
        text: el.textContent?.trim().substring(0, 50),
        classes: el.className
      })));
    }
  } else {
    console.log('✅ Seletor de tipo encontrado');
    
    // Verificar as opções disponíveis
    const opcoes = Array.from(tipoSelector.querySelectorAll('option'));
    console.log(`📊 Opções encontradas: ${opcoes.length}`);
    
    opcoes.forEach((opcao, index) => {
      console.log(`  ${index + 1}. ${opcao.textContent} (value: ${opcao.value})`);
    });
    
    // Verificar se as novas opções estão presentes
    const temNegociosDigitais = opcoes.some(op => op.textContent?.includes('Negócios Digitais'));
    const temCriarDoZero = opcoes.some(op => op.textContent?.includes('Criar do zero'));
    
    console.log('✅ Verificação das novas opções:');
    console.log(`  - Negócios Digitais: ${temNegociosDigitais ? '✅' : '❌'}`);
    console.log(`  - Criar do zero: ${temCriarDoZero ? '✅' : '❌'}`);
    
    if (temNegociosDigitais && temCriarDoZero) {
      console.log('🎉 Todas as novas opções estão presentes!');
    } else {
      console.log('⚠️ Algumas opções estão faltando');
    }
  }
  
  // Verificar se há formulário de criação
  const formulario = document.querySelector('form') || document.querySelector('[class*="form"]');
  if (formulario) {
    console.log('✅ Formulário encontrado');
    
    // Verificar campos disponíveis
    const campos = formulario.querySelectorAll('input, textarea, select');
    console.log(`📝 Campos encontrados: ${campos.length}`);
    
    campos.forEach((campo, index) => {
      const tipo = campo.tagName.toLowerCase();
      const id = campo.id || campo.name || `campo_${index}`;
      const placeholder = campo.placeholder || 'Sem placeholder';
      
      console.log(`  ${index + 1}. ${tipo} - ${id} - "${placeholder}"`);
    });
    
    // Verificar se há campo de prompt (para o tipo "Criar do zero")
    const campoPrompt = Array.from(campos).find(campo => 
      campo.placeholder?.includes('prompt') || 
      campo.id?.includes('prompt') || 
      campo.name?.includes('prompt')
    );
    
    if (campoPrompt) {
      console.log('✅ Campo de prompt encontrado');
      console.log(`  - Tipo: ${campoPrompt.tagName}`);
      console.log(`  - ID: ${campoPrompt.id || 'N/A'}`);
      console.log(`  - Placeholder: ${campoPrompt.placeholder || 'N/A'}`);
    } else {
      console.log('⚠️ Campo de prompt não encontrado');
    }
  } else {
    console.log('⚠️ Formulário não encontrado');
  }
}

// Função para testar a funcionalidade específica do tipo "Criar do zero"
function testarTipoCriarDoZero() {
  console.log('🔍 Testando funcionalidade do tipo "Criar do zero"...');
  
  // Simular seleção do tipo "Criar do zero"
  const tipoSelector = document.querySelector('select') || document.querySelector('[role="combobox"]');
  if (tipoSelector) {
    // Procurar pela opção "Criar do zero"
    const opcaoCriarDoZero = Array.from(tipoSelector.querySelectorAll('option')).find(op => 
      op.textContent?.includes('Criar do zero')
    );
    
    if (opcaoCriarDoZero) {
      console.log('✅ Opção "Criar do zero" encontrada');
      console.log(`  - Value: ${opcaoCriarDoZero.value}`);
      
      // Simular seleção
      tipoSelector.value = opcaoCriarDoZero.value;
      tipoSelector.dispatchEvent(new Event('change', { bubbles: true }));
      
      console.log('🔄 Simulando seleção do tipo "Criar do zero"...');
      
      // Aguardar um pouco para ver se a interface muda
      setTimeout(() => {
        console.log('⏰ Verificando mudanças na interface...');
        
        // Verificar se apenas o campo de prompt está visível
        const camposVisiveis = document.querySelectorAll('input, textarea, select');
        const camposOcultos = Array.from(camposVisiveis).filter(campo => 
          campo.style.display === 'none' || 
          campo.closest('[style*="display: none"]') ||
          campo.closest('[class*="hidden"]')
        );
        
        console.log(`📊 Campos visíveis: ${camposVisiveis.length - camposOcultos.length}`);
        console.log(`📊 Campos ocultos: ${camposOcultos.length}`);
        
        // Verificar se o campo de prompt está visível
        const campoPrompt = Array.from(camposVisiveis).find(campo => 
          campo.placeholder?.includes('prompt') || 
          campo.id?.includes('prompt')
        );
        
        if (campoPrompt) {
          const estaVisivel = !camposOcultos.includes(campoPrompt);
          console.log(`✅ Campo de prompt está ${estaVisivel ? 'visível' : 'oculto'}`);
          
          if (estaVisivel) {
            console.log('🎉 Funcionalidade do tipo "Criar do zero" está funcionando!');
          } else {
            console.log('⚠️ Campo de prompt está oculto');
          }
        }
      }, 1000);
    } else {
      console.log('❌ Opção "Criar do zero" não encontrada');
    }
  } else {
    console.log('❌ Seletor de tipo não encontrado');
  }
}

// Função para verificar o estado atual
function verificarEstadoAtual() {
  console.log('🔍 Verificando estado atual...');
  
  // Verificar seletor de tipo
  const tipoSelector = document.querySelector('select') || document.querySelector('[role="combobox"]');
  console.log(`📋 Seletor de tipo: ${tipoSelector ? 'Encontrado' : 'Não encontrado'}`);
  
  // Verificar formulário
  const formulario = document.querySelector('form') || document.querySelector('[class*="form"]');
  console.log(`📝 Formulário: ${formulario ? 'Encontrado' : 'Não encontrado'}`);
  
  // Verificar campos
  const campos = document.querySelectorAll('input, textarea, select');
  console.log(`🔧 Campos totais: ${campos.length}`);
  
  // Verificar campo de prompt
  const campoPrompt = Array.from(campos).find(campo => 
    campo.placeholder?.includes('prompt') || 
    campo.id?.includes('prompt')
  );
  console.log(`💬 Campo de prompt: ${campoPrompt ? 'Encontrado' : 'Não encontrado'}`);
}

// Executar o teste
console.log('🚀 Executando teste...');
testarTiposChatbot().catch(console.error);

// Adicionar comandos úteis ao console
window.testarTiposChatbot = testarTiposChatbot;
window.testarTipoCriarDoZero = testarTipoCriarDoZero;
window.verificarEstadoAtual = verificarEstadoAtual;

console.log('💡 Comandos disponíveis:');
console.log('  - testarTiposChatbot() - Executa o teste completo');
console.log('  - testarTipoCriarDoZero() - Testa especificamente o tipo "Criar do zero"');
console.log('  - verificarEstadoAtual() - Verifica o estado atual da página');
