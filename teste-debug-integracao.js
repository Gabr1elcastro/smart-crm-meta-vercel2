// Script para debugar a integração RD Station
// Execute este script no console do navegador

console.log('🔍 Iniciando debug da integração RD Station...');

// Função para testar informações do usuário
const testarInformacoesUsuario = async () => {
  try {
    console.log('👤 Testando informações do usuário...');
    
    const response = await fetch('/api/debug-user-info');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Informações do usuário:', data);
      
      // Verificar se id_cliente está presente
      if (data.user.id_cliente_from_metadata) {
        console.log('✅ id_cliente encontrado:', data.user.id_cliente_from_metadata);
      } else {
        console.error('❌ id_cliente NÃO encontrado no user_metadata');
        console.log('📊 user_metadata completo:', data.user.user_metadata);
      }
      
      // Verificar se há funis RD
      if (data.funis_rd && data.funis_rd.length > 0) {
        console.log('✅ Funis RD encontrados:', data.funis_rd);
      } else {
        console.log('⚠️ Nenhum funil RD encontrado');
      }
      
      return data;
    } else {
      console.error('❌ Erro ao obter informações do usuário:', response.status);
      return null;
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
    return null;
  }
};

// Função para testar diretamente o FunisRdService
const testarFunisRdService = async () => {
  try {
    console.log('🔍 Testando FunisRdService diretamente...');
    
    // Esta função deve ser executada no contexto da aplicação onde o FunisRdService está disponível
    if (typeof FunisRdService !== 'undefined') {
      const funis = await FunisRdService.getFunisRd();
      console.log('✅ FunisRdService retornou:', funis);
      return funis;
    } else {
      console.log('⚠️ FunisRdService não está disponível no contexto atual');
      return null;
    }
  } catch (error) {
    console.error('❌ Erro no FunisRdService:', error);
    return null;
  }
};

// Função para verificar se as tabelas existem
const verificarTabelas = async () => {
  try {
    console.log('🔍 Verificando se as tabelas existem...');
    
    const response = await fetch('/api/test-funis-rd');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Tabelas acessíveis:', data);
      return data;
    } else {
      console.error('❌ Erro ao verificar tabelas:', response.status);
      return null;
    }
  } catch (error) {
    console.error('❌ Erro na verificação das tabelas:', error);
    return null;
  }
};

// Executar todos os testes
const executarDebugCompleto = async () => {
  console.log('🚀 Executando debug completo...');
  
  // Teste 1: Informações do usuário
  console.log('\n📋 TESTE 1: Informações do usuário');
  const userInfo = await testarInformacoesUsuario();
  
  // Teste 2: Verificar tabelas
  console.log('\n📋 TESTE 2: Verificar tabelas');
  const tabelas = await verificarTabelas();
  
  // Teste 3: FunisRdService (se disponível)
  console.log('\n📋 TESTE 3: FunisRdService');
  const funisService = await testarFunisRdService();
  
  console.log('\n✅ Debug completo finalizado!');
  console.log('📊 Resumo:');
  console.log('- User Info:', userInfo ? 'OK' : 'ERRO');
  console.log('- Tabelas:', tabelas ? 'OK' : 'ERRO');
  console.log('- FunisRdService:', funisService ? 'OK' : 'N/A');
};

// Executar
executarDebugCompleto();

