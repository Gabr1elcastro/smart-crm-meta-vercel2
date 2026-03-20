// 🧪 Teste: Edição de Contatos com Atualização Instantânea
// Execute este script na página /contatos para testar a funcionalidade

console.log('🧪 Iniciando teste de edição de contatos...');

// Função para testar a edição de contatos
async function testarEdicaoContatos() {
  console.log('📋 Verificando se estamos na página correta...');
  
  // Verificar se estamos na página de contatos
  if (!window.location.pathname.includes('/contatos')) {
    console.error('❌ Este teste deve ser executado na página /contatos');
  return;
}

  console.log('✅ Página de contatos detectada');
  
  // Aguardar o carregamento da página
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Verificar se há contatos na lista
  const contatosLista = document.querySelectorAll('[class*="w-full text-left px-6 py-5"]');
  console.log(`📊 Contatos encontrados na lista: ${contatosLista.length}`);
  
  if (contatosLista.length === 0) {
    console.log('⚠️ Nenhum contato encontrado. Crie um contato primeiro para testar.');
    return;
  }
  
  // Selecionar o primeiro contato para teste
  const primeiroContato = contatosLista[0];
  console.log('🎯 Selecionando primeiro contato para teste...');
  
  // Clicar no primeiro contato para abrir o modal
    primeiroContato.click();
    
    // Aguardar o modal abrir
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Verificar se o modal abriu
  const modal = document.querySelector('[class*="fixed inset-0 z-50"]');
  if (!modal) {
    console.error('❌ Modal não abriu');
    return;
  }
  
  console.log('✅ Modal aberto com sucesso');
  
  // Procurar pelo botão "Editar"
  const botaoEditar = Array.from(document.querySelectorAll('button')).find(btn => 
    btn.textContent?.includes('Editar')
  );
  
  if (!botaoEditar) {
    console.error('❌ Botão "Editar" não encontrado');
    return;
  }
  
  console.log('✅ Botão "Editar" encontrado');
  
  // Clicar no botão "Editar"
    botaoEditar.click();
    
  // Aguardar a ativação do modo de edição
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Verificar se os campos estão editáveis
  const camposInput = modal.querySelectorAll('input');
  if (camposInput.length === 0) {
    console.error('❌ Campos de input não encontrados');
    return;
  }
  
  console.log(`✅ ${camposInput.length} campos de input encontrados`);
  
  // Simular edição do nome
  const campoNome = Array.from(camposInput).find(input => 
    input.placeholder?.includes('Nome do contato')
  );
  
  if (campoNome) {
    const nomeOriginal = campoNome.value;
    const nomeNovo = nomeOriginal + ' [TESTE]';
    
    console.log(`📝 Editando nome de "${nomeOriginal}" para "${nomeNovo}"`);
    
    // Simular digitação
    campoNome.value = nomeNovo;
    campoNome.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Procurar pelo botão "Salvar"
    const botaoSalvar = Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent?.includes('Salvar')
    );
  
  if (botaoSalvar) {
    console.log('✅ Botão "Salvar" encontrado');
      
      // Clicar em "Salvar"
    botaoSalvar.click();
    
      console.log('💾 Salvando alterações...');
      
      // Aguardar o salvamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verificar se o toast de sucesso apareceu
      const toastSucesso = document.querySelector('[class*="toast-success"]') || 
                          document.querySelector('[class*="success"]') ||
                          document.querySelector('[class*="bg-green"]');
      
      if (toastSucesso) {
        console.log('✅ Toast de sucesso detectado');
      } else {
        console.log('⚠️ Toast de sucesso não detectado (pode estar oculto)');
      }
      
      // Verificar se o nome foi atualizado na lista
      const nomeAtualizado = primeiroContato.querySelector('[class*="font-semibold text-lg"]');
      if (nomeAtualizado && nomeAtualizado.textContent?.includes('[TESTE]')) {
        console.log('✅ Nome atualizado na lista sem precisar de F5!');
        console.log('🎉 Teste de atualização instantânea PASSOU!');
      } else {
        console.log('❌ Nome não foi atualizado na lista');
        console.log('🔍 Verificando se precisa de F5...');
        
        // Tentar recarregar a página para ver se as mudanças foram salvas
        console.log('🔄 Recarregando página para verificar se as mudanças foram salvas no banco...');
        window.location.reload();
      }
    } else {
      console.error('❌ Botão "Salvar" não encontrado');
    }
  } else {
    console.error('❌ Campo de nome não encontrado');
  }
}

// Função para verificar o estado atual
function verificarEstadoAtual() {
  console.log('🔍 Verificando estado atual...');

// Verificar se há contatos
  const contatos = document.querySelectorAll('[class*="w-full text-left px-6 py-5"]');
  console.log(`📊 Contatos na lista: ${contatos.length}`);
  
  // Verificar se há modal aberto
  const modal = document.querySelector('[class*="fixed inset-0 z-50"]');
  console.log(`📱 Modal aberto: ${modal ? 'Sim' : 'Não'}`);
  
  // Verificar se está em modo de edição
  const camposInput = document.querySelectorAll('input');
  console.log(`✏️ Campos de input: ${camposInput.length}`);
  
  // Verificar botões disponíveis
  const botoes = Array.from(document.querySelectorAll('button')).map(btn => btn.textContent?.trim());
  console.log('🔘 Botões disponíveis:', botoes.filter(Boolean));
}

// Executar o teste
console.log('🚀 Executando teste...');
testarEdicaoContatos().catch(console.error);

// Adicionar comandos úteis ao console
window.testarEdicaoContatos = testarEdicaoContatos;
window.verificarEstadoAtual = verificarEstadoAtual;

console.log('💡 Comandos disponíveis:');
console.log('  - testarEdicaoContatos() - Executa o teste completo');
console.log('  - verificarEstadoAtual() - Verifica o estado atual da página'); 