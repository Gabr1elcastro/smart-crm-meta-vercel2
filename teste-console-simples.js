// Teste simples no console do navegador
// Cole este script no console do navegador (F12)

console.log('🔍 Teste simples - Verificando tabela funis_rd...');

// Função para testar consulta simples
const testarConsultaSimples = async () => {
  try {
    console.log('1️⃣ Testando consulta simples...');
    
    // Buscar todos os registros
    const { data: todos, error: todosError } = await supabase
      .from('funis_rd')
      .select('*');
    
    console.log('📋 Todos os registros:', todos);
    console.log('❌ Erro:', todosError);
    console.log('📊 Total:', todos?.length || 0);
    
    // Buscar por id_cliente = 114
    const { data: registros114, error: error114 } = await supabase
      .from('funis_rd')
      .select('*')
      .eq('id_cliente', 114);
    
    console.log('🎯 Registros para id_cliente = 114:', registros114);
    console.log('❌ Erro 114:', error114);
    console.log('📊 Total 114:', registros114?.length || 0);
    
    return { todos, registros114 };
    
  } catch (error) {
    console.error('❌ Erro na consulta:', error);
    return null;
  }
};

// Função para testar endpoint
const testarEndpoint = async () => {
  try {
    console.log('2️⃣ Testando endpoint...');
    
    const response = await fetch('/api/teste-funis-rd-simples');
    const data = await response.json();
    
    console.log('✅ Endpoint response:', data);
    return data;
    
  } catch (error) {
    console.error('❌ Erro no endpoint:', error);
    return null;
  }
};

// Executar testes
const executarTeste = async () => {
  console.log('🚀 Executando teste simples...');
  
  const consulta = await testarConsultaSimples();
  const endpoint = await testarEndpoint();
  
  console.log('✅ Teste concluído!');
  console.log('📊 Resumo:');
  console.log('- Consulta direta:', consulta ? 'OK' : 'ERRO');
  console.log('- Endpoint:', endpoint ? 'OK' : 'ERRO');
  
  return { consulta, endpoint };
};

// Executar
executarTeste();
