// Script para testar se o campo prompt está sendo preenchido na edição
// Execute este script na página de chatbots

console.log("🧪 TESTE: Verificação do campo prompt na edição");

// Função para testar a edição de chatbot tipo "Criar do zero"
async function testarEdicaoPrompt() {
  console.log("1️⃣ Iniciando teste de edição do campo prompt...");
  
  try {
    // 1. Verificar se há chatbots do tipo "Criar do zero" (ID 11)
    const chatbots = document.querySelectorAll('[data-chatbot-type="11"], .chatbot-card');
    console.log("Chatbots encontrados:", chatbots.length);
    
    if (chatbots.length === 0) {
      console.log("❌ Nenhum chatbot do tipo 'Criar do zero' encontrado");
      console.log("💡 Crie um chatbot do tipo 'Criar do zero' primeiro");
      return;
    }
    
    // 2. Clicar no primeiro chatbot do tipo "Criar do zero"
    const primeiroChatbot = chatbots[0];
    console.log("2️⃣ Clicando no primeiro chatbot...");
    
    const botaoEditar = primeiroChatbot.querySelector('button[onclick*="handleEditChatbot"], button:contains("Editar")');
    if (!botaoEditar) {
      console.log("❌ Botão editar não encontrado");
      return;
    }
    
    botaoEditar.click();
    console.log("✅ Botão editar clicado");
    
    // 3. Aguardar o modal abrir
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 4. Verificar se o campo prompt está preenchido
    const modal = document.querySelector('[role="dialog"]');
    if (!modal) {
      console.log("❌ Modal não encontrado");
      return;
    }
    
    const campoPrompt = modal.querySelector('textarea[id="prompt"]');
    if (!campoPrompt) {
      console.log("❌ Campo prompt não encontrado no modal");
      return;
    }
    
    console.log("3️⃣ Campo prompt encontrado:", campoPrompt);
    console.log("Valor atual:", campoPrompt.value);
    console.log("Placeholder:", campoPrompt.placeholder);
    
    if (campoPrompt.value && campoPrompt.value.trim() !== '') {
      console.log("✅ SUCESSO: Campo prompt está preenchido com:", campoPrompt.value);
    } else {
      console.log("❌ PROBLEMA: Campo prompt está vazio");
      console.log("💡 Verifique se o valor está sendo carregado de descricao_produto");
    }
    
    // 5. Verificar se o tipo está correto
    const tipoChatbot = modal.querySelector('input[value="11"], select[value="11"]');
    if (tipoChatbot) {
      console.log("✅ Tipo de chatbot correto (ID 11)");
    } else {
      console.log("⚠️ Tipo de chatbot não identificado como ID 11");
    }
    
  } catch (error) {
    console.error("❌ Erro durante o teste:", error);
  }
}

// Função para verificar logs no console
function verificarLogs() {
  console.log("🔍 Verificando logs de debug...");
  console.log("Procure por mensagens que começam com 'DEBUG' no console");
  console.log("Elas devem mostrar os valores de initialValues, chatbotType e prompt");
}

// Executar testes
console.log("🚀 Executando testes...");
testarEdicaoPrompt();
verificarLogs();

console.log("📋 INSTRUÇÕES:");
console.log("1. Abra o console do navegador (F12)");
console.log("2. Execute este script na página de chatbots");
console.log("3. Clique em editar um chatbot do tipo 'Criar do zero'");
console.log("4. Verifique se o campo prompt está preenchido");
console.log("5. Verifique os logs de debug no console");
