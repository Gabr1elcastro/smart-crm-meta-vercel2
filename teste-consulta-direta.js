// Teste direto da consulta funis_rd
// Cole este script no console do navegador

console.log('🔍 Teste direto da consulta funis_rd...');

const testarConsultaDireta = async () => {
  try {
    console.log('1️⃣ Fazendo consulta direta...');
    
    // Consulta exatamente igual ao FunisRdService
    const { data, error } = await supabase
      .from('funis_rd')
      .select('*')
      .eq('id_cliente', 114)
      .order('created_at', { ascending: false });
    
    console.log('📊 Dados retornados:', data);
    console.log('❌ Erro:', error);
    console.log('📈 Total:', data?.length || 0);
    
    if (data && data.length > 0) {
      console.log('✅ SUCESSO! Consulta funcionou!');
      data.forEach((funil, index) => {
        console.log(`${index + 1}. ${funil.nome_funil} (ID: ${funil.id})`);
      });
    } else {
      console.log('❌ PROBLEMA: Consulta não retornou dados');
    }
    
    return data;
    
  } catch (error) {
    console.error('❌ Erro na consulta:', error);
    return null;
  }
};

const testarFunisRdService = async () => {
  try {
    console.log('2️⃣ Testando FunisRdService...');
    
    // Simular exatamente o que o FunisRdService faz
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ Usuário não autenticado');
      return null;
    }
    
    const userMetadata = user.user_metadata || {};
    const id_cliente = userMetadata.id_cliente || userMetadata?.raw_user_meta_data?.id_cliente;
    
    console.log('👤 Usuário:', user.id);
    console.log('📊 user_metadata:', userMetadata);
    console.log('🆔 id_cliente:', id_cliente);
    
    if (!id_cliente) {
      console.error('❌ ID do cliente não encontrado');
      return null;
    }
    
    // Fazer a consulta
    const { data, error } = await supabase
      .from('funis_rd')
      .select('*')
      .eq('id_cliente', id_cliente)
      .order('created_at', { ascending: false });
    
    console.log('📊 FunisRdService - Dados:', data);
    console.log('❌ FunisRdService - Erro:', error);
    console.log('📈 FunisRdService - Total:', data?.length || 0);
    
    return data;
    
  } catch (error) {
    console.error('❌ Erro no FunisRdService:', error);
    return null;
  }
};

const executarTesteCompleto = async () => {
  console.log('🚀 Executando teste completo...');
  
  const consultaDireta = await testarConsultaDireta();
  const funisRdService = await testarFunisRdService();
  
  console.log('✅ Teste concluído!');
  console.log('📊 Resultado consulta direta:', consultaDireta?.length || 0, 'funis');
  console.log('📊 Resultado FunisRdService:', funisRdService?.length || 0, 'funis');
  
  if (consultaDireta && consultaDireta.length > 0) {
    console.log('✅ Consulta direta funciona!');
  } else {
    console.log('❌ Consulta direta não funciona!');
  }
  
  if (funisRdService && funisRdService.length > 0) {
    console.log('✅ FunisRdService funciona!');
  } else {
    console.log('❌ FunisRdService não funciona!');
  }
  
  return { consultaDireta, funisRdService };
};

// Executar
executarTesteCompleto();
