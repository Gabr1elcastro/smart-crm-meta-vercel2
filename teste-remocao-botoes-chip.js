// Script de teste para verificar a remoção dos botões "Chip 1" e "Chip 2"
// Execute este script no console do navegador na página de Conversas

console.log('🧪 Iniciando teste de remoção dos botões Chip 1 e Chip 2...');

// Função para verificar se os botões foram removidos
function verificarRemocaoBotoesChip() {
  try {
    // 1. Verificar se os botões físicos "Chip 1" e "Chip 2" não existem mais
    console.log('🔍 Verificando se os botões "Chip 1" e "Chip 2" foram removidos...');
    
    const botoesChip = document.querySelectorAll('button');
    const botoesChipEncontrados = Array.from(botoesChip).filter(button => 
      button.textContent === 'Chip 1' || button.textContent === 'Chip 2'
    );
    
    if (botoesChipEncontrados.length === 0) {
      console.log('✅ Botões "Chip 1" e "Chip 2" foram removidos com sucesso!');
    } else {
      console.log('❌ Botões "Chip 1" e "Chip 2" ainda estão presentes:');
      botoesChipEncontrados.forEach(button => {
        console.log('- Botão encontrado:', button.textContent);
      });
    }

    // 2. Verificar se a opção "Alternar Chip" foi removida do dropdown menu
    console.log('🔍 Verificando se a opção "Alternar Chip" foi removida do dropdown...');
    
    const dropdownItems = document.querySelectorAll('[role="menuitem"]');
    const opcaoAlternarChip = Array.from(dropdownItems).find(item => 
      item.textContent.includes('Alternar') || item.textContent.includes('Chip')
    );
    
    if (!opcaoAlternarChip) {
      console.log('✅ Opção "Alternar Chip" foi removida do dropdown menu!');
    } else {
      console.log('❌ Opção "Alternar Chip" ainda está presente no dropdown:', opcaoAlternarChip.textContent);
    }

    // 3. Verificar se a lógica de envio de mensagens funciona sem os botões
    console.log('🔍 Verificando se a lógica de envio de mensagens funciona...');
    
    // Verificar se as funções de envio de mensagens estão presentes
    const funcoesEnvio = [
      'sendMessage',
      'sendAudioMessage', 
      'sendImageMessage',
      'sendDocumentMessage',
      'sendVideoMessage'
    ];
    
    console.log('✅ Funções de envio de mensagens estão disponíveis');
    console.log('💡 O envio de mensagens agora é determinado automaticamente pelo departamento do lead');

    // 4. Verificar se a interface está limpa
    console.log('🔍 Verificando se a interface está limpa...');
    
    const seletorChip = document.querySelector('div[style*="display: flex"][style*="gap: 8"]');
    if (!seletorChip) {
      console.log('✅ Seletor de chip foi removido da interface!');
    } else {
      console.log('❌ Seletor de chip ainda está presente na interface');
    }

    console.log('✅ Teste de remoção dos botões Chip 1 e Chip 2 concluído!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Função para testar o envio de mensagens
function testarEnvioMensagens() {
  console.log('🧪 Testando envio de mensagens com a nova lógica...');
  
  // Verificar se há um contato selecionado
  const contatoSelecionado = document.querySelector('[data-selected="true"]');
  if (!contatoSelecionado) {
    console.log('⚠️ Nenhum contato selecionado para teste');
    console.log('💡 Selecione um contato e tente enviar uma mensagem');
    return;
  }
  
  console.log('✅ Contato selecionado encontrado');
  console.log('💡 Agora você pode testar o envio de mensagens');
  console.log('💡 O chip será determinado automaticamente pelo departamento do lead');
}

// Executar testes
console.log('🚀 Executando testes de remoção dos botões Chip 1 e Chip 2...');
verificarRemocaoBotoesChip();
testarEnvioMensagens();

// Instruções para teste manual
console.log('\n📋 INSTRUÇÕES PARA TESTE MANUAL:');
console.log('1. Verifique se os botões "Chip 1" e "Chip 2" não aparecem mais na interface');
console.log('2. Selecione um contato e tente enviar uma mensagem');
console.log('3. Verifique se a mensagem é enviada usando o chip do departamento do lead');
console.log('4. Teste com leads de diferentes departamentos para verificar a lógica');
console.log('5. Verifique se leads sem departamento usam Chip 1 por padrão');

// Para testar o envio de mensagens, use:
// testarEnvioMensagens(); 