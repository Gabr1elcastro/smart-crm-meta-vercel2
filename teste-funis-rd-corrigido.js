// Teste para verificar se o FunisRdService está funcionando agora
// Cole este script no console do navegador

console.log('🔧 Testando FunisRdService corrigido...');

// Função para testar o FunisRdService
const testarFunisRdService = async () => {
  try {
    console.log('🔍 Testando FunisRdService...');
    
    // Simular a chamada do FunisRdService
    const { data: { user } } = await supabase.auth.getUser();
    console.log('👤 Usuário:', user.id);
    
    const userMetadata = user.user_metadata || {};
    const id_cliente = userMetadata.id_cliente || userMetadata?.raw_user_meta_data?.id_cliente;
    console.log('🆔 ID Cliente:', id_cliente);
    
    // Fazer a consulta diretamente
    const { data, error } = await supabase
      .from('funis_rd')
      .select('*')
      .eq('id_cliente', id_cliente)
      .order('created_at', { ascending: false });
    
    console.log('📊 Dados retornados:', data);
    console.log('❌ Erro:', error);
    console.log('📈 Total encontrado:', data?.length || 0);
    
    if (data && data.length > 0) {
      console.log('✅ SUCESSO! Funis encontrados!');
      console.log('🎯 Funis disponíveis:');
      data.forEach((funil, index) => {
        console.log(`${index + 1}. ${funil.nome_funil} (ID: ${funil.id})`);
      });
    } else {
      console.log('❌ PROBLEMA: Nenhum funil encontrado');
    }
    
    return data;
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    return null;
  }
};

// Função para testar o modal
const testarModal = async () => {
  try {
    console.log('🎭 Testando se o modal vai funcionar...');
    
    // Simular a verificação que o modal faz
    const funis = await testarFunisRdService();
    
    if (funis && funis.length > 0) {
      console.log('✅ Modal deve funcionar! Funis encontrados para exibição.');
      console.log('🎯 Próximo passo: Modal deve avançar para seleção de funil');
    } else {
      console.log('❌ Modal não vai funcionar. Nenhum funil encontrado.');
    }
    
    return funis;
    
  } catch (error) {
    console.error('❌ Erro no teste do modal:', error);
    return null;
  }
};

// Executar teste
const executarTeste = async () => {
  console.log('🚀 Executando teste completo...');
  
  const resultado = await testarModal();
  
  console.log('✅ Teste concluído!');
  console.log('📊 Resultado:', resultado ? 'SUCESSO' : 'FALHA');
  
  if (resultado && resultado.length > 0) {
    console.log('🎉 A integração deve funcionar agora!');
    console.log('💡 Teste inserindo um token no modal para ver se avança para seleção de funis');
  } else {
    console.log('🔧 Ainda há problemas. Verifique os logs acima.');
  }
  
  return resultado;
};

// Executar
executarTeste();
