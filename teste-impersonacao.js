// Script para testar a funcionalidade de impersonação
// Execute este script no console do navegador

console.log('=== TESTE DE IMPERSONAÇÃO ===');

// Função para simular impersonação
function simularImpersonacao(clienteId, clienteName) {
  console.log(`Simulando impersonação do cliente: ${clienteName} (ID: ${clienteId})`);
  
  // Armazenar dados de impersonação
  const clienteImpersonado = {
    id: clienteId,
    name: clienteName,
    email: 'teste@exemplo.com',
    phone: '(11) 99999-9999',
    instance_name: 'teste_instance'
  };
  
  sessionStorage.setItem('impersonatedCliente', JSON.stringify(clienteImpersonado));
  sessionStorage.setItem('isImpersonating', 'true');
  
  console.log('✅ Dados de impersonação armazenados');
  console.log('📋 Próximos passos:');
  console.log('1. Recarregue a página (F5)');
  console.log('2. Verifique se o banner de super admin aparece');
  console.log('3. Verifique se o contexto usa o ID do cliente correto');
  console.log('4. Teste as funcionalidades da aplicação');
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

// Função para verificar estado atual
function verificarEstado() {
  console.log('=== ESTADO ATUAL ===');
  
  const isImpersonating = sessionStorage.getItem('isImpersonating') === 'true';
  const impersonatedClienteStr = sessionStorage.getItem('impersonatedCliente');
  
  console.log('Modo impersonação:', isImpersonating ? '✅ ATIVO' : '❌ INATIVO');
  
  if (isImpersonating && impersonatedClienteStr) {
    try {
      const cliente = JSON.parse(impersonatedClienteStr);
      console.log('Cliente impersonado:', cliente);
    } catch (error) {
      console.error('Erro ao parsear cliente:', error);
    }
  }
  
  // Verificar se o banner está visível
  const banner = document.querySelector('[data-testid="super-admin-banner"]') || 
                 document.querySelector('.border-orange-200');
  console.log('Banner visível:', banner ? '✅ SIM' : '❌ NÃO');
  
  // Verificar contexto de autenticação
  if (window.React && window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
    console.log('React DevTools disponível para inspeção do contexto');
  }
}

// Função para testar contexto
async function testarContexto() {
  console.log('=== TESTANDO CONTEXTO ===');
  
  try {
    // Verificar se o contexto está usando o ID correto
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );
    
    // Buscar dados do usuário atual
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      console.log('Usuário autenticado:', session.user.email);
      console.log('User metadata:', session.user.user_metadata);
      
      // Verificar se está em modo de impersonação
      const isImpersonating = sessionStorage.getItem('isImpersonating') === 'true';
      const impersonatedClienteStr = sessionStorage.getItem('impersonatedCliente');
      
      if (isImpersonating && impersonatedClienteStr) {
        const cliente = JSON.parse(impersonatedClienteStr);
        console.log('✅ Modo impersonação ativo');
        console.log('ID do cliente que deveria ser usado:', cliente.id);
      } else {
        console.log('❌ Modo impersonação inativo');
      }
    } else {
      console.log('❌ Nenhum usuário autenticado');
    }
  } catch (error) {
    console.error('Erro ao testar contexto:', error);
  }
}

// Expor funções globalmente
window.simularImpersonacao = simularImpersonacao;
window.limparImpersonacao = limparImpersonacao;
window.verificarEstado = verificarEstado;
window.testarContexto = testarContexto;

console.log('=== FUNÇÕES DISPONÍVEIS ===');
console.log('simularImpersonacao(clienteId, clienteName) - Simula impersonação');
console.log('limparImpersonacao() - Remove dados de impersonação');
console.log('verificarEstado() - Verifica estado atual');
console.log('testarContexto() - Testa o contexto de autenticação');

console.log('\n=== EXEMPLO DE USO ===');
console.log('simularImpersonacao(13, "Bruno 3")');
console.log('verificarEstado()');
console.log('testarContexto()');
console.log('limparImpersonacao()');

// Executar verificação inicial
verificarEstado(); 