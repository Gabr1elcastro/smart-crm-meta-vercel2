// Teste simples - Cole TODO o script no console
console.log('🔍 Teste simples iniciando...');

// Função para testar consulta direta
async function testarConsulta() {
  try {
    console.log('1️⃣ Testando consulta direta...');
    
    const { data, error } = await supabase
      .from('funis_rd')
      .select('*')
      .eq('id_cliente', 114)
      .order('created_at', { ascending: false });
    
    console.log('📊 Dados encontrados:', data);
    console.log('❌ Erro:', error);
    console.log('📈 Total:', data?.length || 0);
    
    if (data && data.length > 0) {
      console.log('✅ SUCESSO! Consulta funciona!');
      data.forEach((funil, index) => {
        console.log(`${index + 1}. ${funil.nome_funil}`);
      });
      return true;
    } else {
      console.log('❌ FALHA! Nenhum dado encontrado');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro na consulta:', error);
    return false;
  }
}

// Função para testar FunisRdService
async function testarFunisRdService() {
  try {
    console.log('2️⃣ Testando FunisRdService...');
    
    const { data: { user } } = await supabase.auth.getUser();
    const userMetadata = user.user_metadata || {};
    const id_cliente = userMetadata.id_cliente;
    
    console.log('🆔 ID Cliente do user_metadata:', id_cliente);
    
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
}

// Executar teste
async function executarTeste() {
  console.log('🚀 Executando teste...');
  
  const consultaOk = await testarConsulta();
  const serviceOk = await testarFunisRdService();
  
  console.log('✅ Teste concluído!');
  console.log('📊 Consulta direta:', consultaOk ? 'FUNCIONA' : 'NÃO FUNCIONA');
  console.log('📊 FunisRdService:', serviceOk ? 'FUNCIONA' : 'NÃO FUNCIONA');
  
  if (consultaOk && serviceOk) {
    console.log('🎉 TUDO FUNCIONA! O problema está no modal');
  } else if (consultaOk && !serviceOk) {
    console.log('🔧 Consulta funciona, FunisRdService não');
  } else {
    console.log('❌ Nada funciona');
  }
}

// Executar
executarTeste();
