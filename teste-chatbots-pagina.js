// Script para testar chatbots na página Chatbots.tsx durante impersonação
// Execute este script no console do navegador quando estiver na página /chatbots

console.log('=== TESTE: Chatbots na página Chatbots.tsx ===');

// 1. Verificar status de impersonação
const isImpersonating = sessionStorage.getItem('isImpersonating') === 'true';
const impersonatedClienteStr = sessionStorage.getItem('impersonatedCliente');

console.log('Status de impersonação:', isImpersonating);
console.log('Dados do cliente impersonado:', impersonatedClienteStr);

if (isImpersonating && impersonatedClienteStr) {
  try {
    const impersonatedCliente = JSON.parse(impersonatedClienteStr);
    console.log('Cliente impersonado:', impersonatedCliente);
    
    // 2. Verificar se estamos na página correta
    if (window.location.pathname !== '/chatbots') {
      console.log('❌ ERRO: Não estamos na página /chatbots');
      console.log('Página atual:', window.location.pathname);
      return;
    }
    
    console.log('✅ Estamos na página correta: /chatbots');
    
    // 3. Verificar se há chatbots sendo exibidos
    const chatbotCards = document.querySelectorAll('[data-testid="chatbot-card"]');
    const chatbotCardsAlt = document.querySelectorAll('.grid .card, .grid [class*="card"]');
    
    console.log('Chatbot cards encontrados (data-testid):', chatbotCards.length);
    console.log('Chatbot cards encontrados (alternativo):', chatbotCardsAlt.length);
    
    // 4. Verificar estado de loading
    const loadingElement = document.querySelector('[class*="animate-spin"]');
    const noChatbotsMessage = document.querySelector('p:contains("Nenhum chatbot criado")');
    
    console.log('Elemento de loading encontrado:', !!loadingElement);
    console.log('Mensagem "nenhum chatbot" encontrada:', !!noChatbotsMessage);
    
    // 5. Verificar dados no Supabase
    async function verificarChatbotsNoSupabase() {
      try {
        const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
        
        const supabaseUrl = 'https://ltdkdeqxcgtuncgzsowt.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0ZGtkZXF4Y2d0dW5jZ3pzb3d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI5NzQsImV4cCI6MjA1MDU0ODk3NH0.8KqXqXqXqXqXqXqXqXqXqXqXqXqXqXqXqXqXqXqXq';
        
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        console.log('🔍 Verificando chatbots no Supabase para cliente:', impersonatedCliente.id);
        
        // Buscar por id_cliente
        const { data: chatbotsPorIdCliente, error: errorIdCliente } = await supabase
          .from('prompts_oficial')
          .select('*')
          .eq('id_cliente', impersonatedCliente.id.toString());
        
        console.log('Chatbots por id_cliente:', chatbotsPorIdCliente);
        console.log('Erro por id_cliente:', errorIdCliente);
        
        // Buscar por id_usuario (para comparação)
        const { data: chatbotsPorIdUsuario, error: errorIdUsuario } = await supabase
          .from('prompts_oficial')
          .select('*')
          .eq('id_usuario', impersonatedCliente.user_id_auth);
        
        console.log('Chatbots por id_usuario:', chatbotsPorIdUsuario);
        console.log('Erro por id_usuario:', errorIdUsuario);
        
        // Verificar se há chatbots com id_cliente null
        const { data: chatbotsComIdClienteNull, error: errorNull } = await supabase
          .from('prompts_oficial')
          .select('*')
          .is('id_cliente', null);
        
        console.log('Chatbots com id_cliente null:', chatbotsComIdClienteNull);
        
        // 6. Sugerir ações
        if (chatbotsPorIdCliente && chatbotsPorIdCliente.length > 0) {
          console.log('✅ Chatbots encontrados por id_cliente!');
          console.log('Se os chatbots não aparecem na interface, pode ser um problema de renderização.');
        } else if (chatbotsPorIdUsuario && chatbotsPorIdUsuario.length > 0) {
          console.log('⚠️ Chatbots encontrados por id_usuario, mas não por id_cliente');
          console.log('Isso indica que os chatbots precisam ser atualizados com id_cliente');
          
          // Sugerir script para atualizar
          console.log('💡 Execute o script atualizar-chatbots-id-cliente.js para corrigir');
        } else {
          console.log('❌ Nenhum chatbot encontrado para este cliente');
        }
        
      } catch (error) {
        console.error('Erro ao verificar Supabase:', error);
      }
    }
    
    verificarChatbotsNoSupabase();
    
  } catch (error) {
    console.error('Erro ao parsear dados do cliente impersonado:', error);
  }
} else {
  console.log('❌ Não está em modo de impersonação');
  console.log('Para testar, acesse /super-admin e faça impersonação de um cliente');
}

console.log('=== FIM DO TESTE ==='); 