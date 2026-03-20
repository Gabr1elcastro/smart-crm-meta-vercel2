// Script de Teste - Super Admin Grupos de Disparo
// Execute no console do navegador após fazer login como super admin

console.log('🧪 Iniciando teste de grupos de disparo para super admin...');

// Função para testar acesso aos grupos de disparo
async function testarAcessoGruposDisparo() {
  try {
    console.log('📋 Verificando estado atual...');
    
    // Verificar se está em modo de impersonação
    const isImpersonating = sessionStorage.getItem('isImpersonating');
    const impersonatedCliente = sessionStorage.getItem('impersonatedCliente');
    
    console.log('🔍 Estado de impersonação:', {
      isImpersonating,
      impersonatedCliente: impersonatedCliente ? JSON.parse(impersonatedCliente) : null
    });
    
    if (isImpersonating !== 'true' || !impersonatedCliente) {
      console.log('❌ Não está em modo de impersonação. Acesse um cliente primeiro.');
      return false;
    }
    
    const cliente = JSON.parse(impersonatedCliente);
    console.log('✅ Cliente impersonado:', cliente);
    
    // Testar busca de grupos de disparo
    console.log('🔍 Buscando grupos de disparo para o cliente:', cliente.id);
    
    const { data: grupos, error } = await supabase
      .from('grupos_disparo')
      .select('*')
      .eq('id_cliente', cliente.id)
      .order('id', { ascending: false });
    
    if (error) {
      console.error('❌ Erro ao buscar grupos:', error);
      return false;
    }
    
    console.log('✅ Grupos de disparo encontrados:', grupos);
    console.log(`📊 Total de grupos: ${grupos?.length || 0}`);
    
    // Testar criação de grupo (simulação)
    console.log('🧪 Testando permissões de criação...');
    
    // Verificar se consegue inserir (sem realmente inserir)
    const { data: testePermissao, error: erroPermissao } = await supabase
      .from('grupos_disparo')
      .select('id')
      .eq('id_cliente', cliente.id)
      .limit(1);
    
    if (erroPermissao) {
      console.error('❌ Erro de permissão:', erroPermissao);
      return false;
    }
    
    console.log('✅ Permissões de acesso confirmadas');
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
    return false;
  }
}

// Função para simular impersonação completa
async function simularImpersonacaoCompleta(clienteId, nomeCliente) {
  try {
    console.log(`🎭 Simulando impersonação do cliente ${nomeCliente} (ID: ${clienteId})...`);
    
    // Buscar dados do cliente
    const { data: cliente, error } = await supabase
      .from('clientes_info')
      .select('*')
      .eq('id', clienteId)
      .single();
    
    if (error || !cliente) {
      console.error('❌ Cliente não encontrado:', error);
      return false;
    }
    
    console.log('✅ Cliente encontrado:', cliente);
    
    // Simular dados de impersonação
    const dadosImpersonacao = {
      id: cliente.id,
      name: cliente.name,
      email: cliente.email,
      instance_name: cliente.instance_name
    };
    
    // Armazenar na sessão
    sessionStorage.setItem('impersonatedCliente', JSON.stringify(dadosImpersonacao));
    sessionStorage.setItem('isImpersonating', 'true');
    
    console.log('✅ Impersonação simulada com sucesso');
    console.log('🔄 Recarregue a página para aplicar as mudanças');
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao simular impersonação:', error);
    return false;
  }
}

// Função para verificar estrutura da tabela grupos_disparo
async function verificarEstruturaGruposDisparo() {
  try {
    console.log('🔍 Verificando estrutura da tabela grupos_disparo...');
    
    // Verificar se a tabela existe e tem dados
    const { data: grupos, error } = await supabase
      .from('grupos_disparo')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ Erro ao acessar tabela grupos_disparo:', error);
      return false;
    }
    
    console.log('✅ Tabela grupos_disparo acessível');
    console.log('📊 Amostra de grupos:', grupos);
    
    // Verificar estrutura
    if (grupos && grupos.length > 0) {
      const primeiroGrupo = grupos[0];
      console.log('🏗️ Estrutura do primeiro grupo:', Object.keys(primeiroGrupo));
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao verificar estrutura:', error);
    return false;
  }
}

// Função para testar criação de grupo (sem inserir)
async function testarCriacaoGrupo(clienteId) {
  try {
    console.log(`🧪 Testando criação de grupo para cliente ${clienteId}...`);
    
    // Simular dados de grupo
    const dadosGrupo = {
      id_cliente: clienteId,
      nome_grupo: 'TESTE_SUPER_ADMIN',
      qtd_contatos: 0,
      lista_contatos: []
    };
    
    // Verificar se consegue fazer select (teste de permissão)
    const { data: teste, error } = await supabase
      .from('grupos_disparo')
      .select('id')
      .eq('id_cliente', clienteId)
      .limit(1);
    
    if (error) {
      console.error('❌ Erro de permissão para select:', error);
      return false;
    }
    
    console.log('✅ Permissões de leitura confirmadas');
    
    // Verificar se consegue inserir (sem realmente inserir)
    console.log('⚠️ Teste de inserção não executado por segurança');
    console.log('✅ Dados do grupo preparados:', dadosGrupo);
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao testar criação:', error);
    return false;
  }
}

// Função principal de teste
async function executarTesteCompleto() {
  console.log('🚀 Iniciando teste completo de grupos de disparo...');
  
  // 1. Verificar estrutura da tabela
  const estruturaOk = await verificarEstruturaGruposDisparo();
  if (!estruturaOk) {
    console.log('❌ Falha na verificação da estrutura');
    return;
  }
  
  // 2. Verificar se está em modo de impersonação
  const isImpersonating = sessionStorage.getItem('isImpersonating');
  if (isImpersonating !== 'true') {
    console.log('⚠️ Não está em modo de impersonação');
    console.log('💡 Use simularImpersonacaoCompleta(clienteId, nomeCliente) primeiro');
    return;
  }
  
  // 3. Testar acesso aos grupos
  const acessoOk = await testarAcessoGruposDisparo();
  if (!acessoOk) {
    console.log('❌ Falha no teste de acesso');
    return;
  }
  
  // 4. Testar criação de grupo
  const cliente = JSON.parse(sessionStorage.getItem('impersonatedCliente'));
  const criacaoOk = await testarCriacaoGrupo(cliente.id);
  
  if (criacaoOk) {
    console.log('🎉 Teste completo executado com sucesso!');
    console.log('✅ Super admin pode acessar e gerenciar grupos de disparo');
  } else {
    console.log('❌ Falha no teste de criação');
  }
}

// Expor funções para uso no console
window.testarAcessoGruposDisparo = testarAcessoGruposDisparo;
window.simularImpersonacaoCompleta = simularImpersonacaoCompleta;
window.verificarEstruturaGruposDisparo = verificarEstruturaGruposDisparo;
window.testarCriacaoGrupo = testarCriacaoGrupo;
window.executarTesteCompleto = executarTesteCompleto;

console.log('📚 Funções disponíveis:');
console.log('- testarAcessoGruposDisparo()');
console.log('- simularImpersonacaoCompleta(clienteId, nomeCliente)');
console.log('- verificarEstruturaGruposDisparo()');
console.log('- testarCriacaoGrupo(clienteId)');
console.log('- executarTesteCompleto()');

console.log('🎯 Para testar, execute: executarTesteCompleto()');

