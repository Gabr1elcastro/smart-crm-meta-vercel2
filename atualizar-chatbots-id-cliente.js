// Script para atualizar chatbots com id_cliente
// Execute este script no console do navegador

console.log('=== ATUALIZANDO CHATBOTS COM ID_CLIENTE ===');

async function atualizarChatbotsComIdCliente() {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );
    
    console.log('1. Buscando todos os chatbots...');
    
    // Buscar todos os chatbots
    const { data: chatbots, error: fetchError } = await supabase
      .from('prompts_oficial')
      .select('*');
    
    if (fetchError) {
      console.error('❌ Erro ao buscar chatbots:', fetchError);
      return;
    }
    
    console.log(`✅ Encontrados ${chatbots?.length || 0} chatbots`);
    
    if (!chatbots || chatbots.length === 0) {
      console.log('Nenhum chatbot encontrado para atualizar');
      return;
    }
    
    console.log('2. Buscando clientes para mapear...');
    
    // Buscar todos os clientes
    const { data: clientes, error: clientesError } = await supabase
      .from('clientes_info')
      .select('id, user_id_auth');
    
    if (clientesError) {
      console.error('❌ Erro ao buscar clientes:', clientesError);
      return;
    }
    
    console.log(`✅ Encontrados ${clientes?.length || 0} clientes`);
    
    // Criar mapa de user_id_auth para id_cliente
    const clienteMap = {};
    if (clientes) {
      clientes.forEach(cliente => {
        if (cliente.user_id_auth) {
          clienteMap[cliente.user_id_auth] = cliente.id;
        }
      });
    }
    
    console.log('3. Mapeamento criado:', clienteMap);
    
    console.log('4. Atualizando chatbots...');
    
    let atualizados = 0;
    let erros = 0;
    
    for (const chatbot of chatbots) {
      if (chatbot.id_usuario && clienteMap[chatbot.id_usuario]) {
        const idCliente = clienteMap[chatbot.id_usuario];
        
        console.log(`Atualizando chatbot ${chatbot.id} (${chatbot.nome}) com id_cliente: ${idCliente}`);
        
        const { error: updateError } = await supabase
          .from('prompts_oficial')
          .update({ id_cliente: idCliente.toString() })
          .eq('id', chatbot.id);
        
        if (updateError) {
          console.error(`❌ Erro ao atualizar chatbot ${chatbot.id}:`, updateError);
          erros++;
        } else {
          console.log(`✅ Chatbot ${chatbot.id} atualizado com sucesso`);
          atualizados++;
        }
      } else {
        console.log(`⚠️ Chatbot ${chatbot.id} (${chatbot.nome}) - id_usuario não encontrado no mapa: ${chatbot.id_usuario}`);
      }
    }
    
    console.log('\n=== RESULTADO ===');
    console.log(`✅ Chatbots atualizados: ${atualizados}`);
    console.log(`❌ Erros: ${erros}`);
    console.log(`⚠️ Chatbots não mapeados: ${chatbots.length - atualizados - erros}`);
    
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

// Função para verificar chatbots após atualização
async function verificarChatbotsAtualizados() {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );
    
    console.log('=== VERIFICANDO CHATBOTS ATUALIZADOS ===');
    
    // Buscar chatbots com id_cliente preenchido
    const { data: chatbotsComIdCliente, error: error1 } = await supabase
      .from('prompts_oficial')
      .select('id, nome, id_usuario, id_cliente')
      .not('id_cliente', 'is', null);
    
    if (error1) {
      console.error('❌ Erro ao buscar chatbots com id_cliente:', error1);
    } else {
      console.log(`✅ Chatbots com id_cliente: ${chatbotsComIdCliente?.length || 0}`);
      if (chatbotsComIdCliente && chatbotsComIdCliente.length > 0) {
        console.log('Exemplos:', chatbotsComIdCliente.slice(0, 5));
      }
    }
    
    // Buscar chatbots sem id_cliente
    const { data: chatbotsSemIdCliente, error: error2 } = await supabase
      .from('prompts_oficial')
      .select('id, nome, id_usuario, id_cliente')
      .or('id_cliente.is.null,id_cliente.eq.');
    
    if (error2) {
      console.error('❌ Erro ao buscar chatbots sem id_cliente:', error2);
    } else {
      console.log(`⚠️ Chatbots sem id_cliente: ${chatbotsSemIdCliente?.length || 0}`);
      if (chatbotsSemIdCliente && chatbotsSemIdCliente.length > 0) {
        console.log('Exemplos:', chatbotsSemIdCliente.slice(0, 5));
      }
    }
    
  } catch (error) {
    console.error('Erro ao verificar:', error);
  }
}

// Expor funções globalmente
window.atualizarChatbotsComIdCliente = atualizarChatbotsComIdCliente;
window.verificarChatbotsAtualizados = verificarChatbotsAtualizados;

console.log('=== FUNÇÕES DISPONÍVEIS ===');
console.log('atualizarChatbotsComIdCliente() - Atualiza chatbots com id_cliente');
console.log('verificarChatbotsAtualizados() - Verifica chatbots após atualização');

console.log('\n=== EXEMPLO DE USO ===');
console.log('atualizarChatbotsComIdCliente()');
console.log('verificarChatbotsAtualizados()'); 