// Teste simples para verificar se o modal está funcionando
// Cole este script no console do navegador

console.log('🎭 Teste simples do modal...');

const testarModalSimples = async () => {
  try {
    console.log('1️⃣ Testando consulta direta...');
    
    // Consulta exatamente igual ao FunisRdService
    const { data, error } = await supabase
      .from('funis_rd')
      .select('*')
      .eq('id_cliente', 114)
      .order('created_at', { ascending: false });
    
    console.log('📊 Dados:', data);
    console.log('❌ Erro:', error);
    console.log('📈 Total:', data?.length || 0);
    
    if (data && data.length > 0) {
      console.log('✅ Dados encontrados!');
      console.log('🎯 Funis disponíveis:');
      data.forEach((funil, index) => {
        console.log(`${index + 1}. ${funil.nome_funil} (ID: ${funil.id})`);
      });
      
      // Simular o que o modal deve fazer
      console.log('🎭 Simulando comportamento do modal...');
      console.log('✅ Modal deve avançar para seleção de funil');
      console.log('✅ Modal deve mostrar', data.length, 'opções de funil');
      
      return true;
    } else {
      console.log('❌ Nenhum dado encontrado');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
    return false;
  }
};

const testarFunisRdService = async () => {
  try {
    console.log('2️⃣ Testando FunisRdService...');
    
    // Simular a chamada do FunisRdService
    const { data: { user } } = await supabase.auth.getUser();
    const userMetadata = user.user_metadata || {};
    const id_cliente = userMetadata.id_cliente || userMetadata?.raw_user_meta_data?.id_cliente;
    
    console.log('🆔 ID Cliente:', id_cliente);
    
    // Fazer a consulta
    const { data, error } = await supabase
      .from('funis_rd')
      .select('*')
      .eq('id_cliente', id_cliente)
      .order('created_at', { ascending: false });
    
    console.log('📊 FunisRdService - Dados:', data);
    console.log('❌ FunisRdService - Erro:', error);
    console.log('📈 FunisRdService - Total:', data?.length || 0);
    
    return data && data.length > 0;
    
  } catch (error) {
    console.error('❌ Erro no FunisRdService:', error);
    return false;
  }
};

const executarTeste = async () => {
  console.log('🚀 Executando teste simples...');
  
  const consultaDireta = await testarModalSimples();
  const funisRdService = await testarFunisRdService();
  
  console.log('✅ Teste concluído!');
  console.log('📊 Consulta direta:', consultaDireta ? 'FUNCIONA' : 'NÃO FUNCIONA');
  console.log('📊 FunisRdService:', funisRdService ? 'FUNCIONA' : 'NÃO FUNCIONA');
  
  if (consultaDireta && funisRdService) {
    console.log('🎉 TUDO FUNCIONA! O problema pode estar no modal ou na lógica de verificação');
    console.log('💡 Teste inserir um token no modal para ver se avança');
  } else if (consultaDireta && !funisRdService) {
    console.log('🔧 Consulta direta funciona, mas FunisRdService não');
    console.log('💡 Problema pode estar na obtenção do id_cliente');
  } else {
    console.log('❌ Nada funciona. Problema na consulta ou na tabela');
  }
  
  return { consultaDireta, funisRdService };
};

// Executar
executarTeste();
