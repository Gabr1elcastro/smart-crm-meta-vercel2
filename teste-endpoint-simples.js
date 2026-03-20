// Teste usando endpoint de API
console.log('🔍 Teste via endpoint iniciando...');

// Função para testar via endpoint
async function testarViaEndpoint() {
  try {
    console.log('1️⃣ Testando endpoint /api/teste-funis-rd-simples...');
    
    const response = await fetch('/api/teste-funis-rd-simples');
    const data = await response.json();
    
    console.log('📊 Resposta do endpoint:', data);
    
    if (data.success) {
      console.log('✅ Endpoint funcionou!');
      console.log('📈 Total de registros:', data.teste.total_registros);
      console.log('📋 Registros para id_cliente = 114:', data.teste.registros_114_integer);
      console.log('📋 Registros para id_cliente = "114":', data.teste.registros_114_string);
      console.log('🔍 IDs únicos encontrados:', data.teste.ids_unicos);
      
      if (data.teste.registros_114_integer.length > 0) {
        console.log('✅ SUCESSO! Funis encontrados para id_cliente = 114');
        data.teste.registros_114_integer.forEach((funil, index) => {
          console.log(`${index + 1}. ${funil.nome_funil} (ID: ${funil.id})`);
        });
        return true;
      } else {
        console.log('❌ FALHA! Nenhum funil encontrado para id_cliente = 114');
        return false;
      }
    } else {
      console.log('❌ Endpoint retornou erro:', data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
    return false;
  }
}

// Função para testar endpoint de debug
async function testarEndpointDebug() {
  try {
    console.log('2️⃣ Testando endpoint /api/debug-funis-rd...');
    
    const response = await fetch('/api/debug-funis-rd');
    const data = await response.json();
    
    console.log('📊 Resposta do debug:', data);
    
    if (data.success) {
      console.log('✅ Debug endpoint funcionou!');
      console.log('👤 Usuário ID:', data.debug_info.user_id);
      console.log('🆔 ID Cliente:', data.debug_info.id_cliente_from_metadata);
      console.log('📈 Total de funis RD:', data.tabela_funis_rd.total_registros);
      console.log('📋 Funis para id_cliente:', data.tabela_funis_rd.registros_para_id_cliente_integer);
      
      return data.tabela_funis_rd.registros_para_id_cliente_integer.length > 0;
    } else {
      console.log('❌ Debug endpoint retornou erro:', data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro no debug endpoint:', error);
    return false;
  }
}

// Executar teste
async function executarTeste() {
  console.log('🚀 Executando teste via endpoints...');
  
  const endpointOk = await testarViaEndpoint();
  const debugOk = await testarEndpointDebug();
  
  console.log('✅ Teste concluído!');
  console.log('📊 Endpoint simples:', endpointOk ? 'FUNCIONA' : 'NÃO FUNCIONA');
  console.log('📊 Endpoint debug:', debugOk ? 'FUNCIONA' : 'NÃO FUNCIONA');
  
  if (endpointOk && debugOk) {
    console.log('🎉 TUDO FUNCIONA! Os dados estão na tabela');
    console.log('💡 O problema deve estar no modal ou na lógica de verificação');
  } else if (endpointOk && !debugOk) {
    console.log('🔧 Endpoint simples funciona, debug não');
  } else {
    console.log('❌ Nenhum endpoint funciona');
  }
}

// Executar
executarTeste();
