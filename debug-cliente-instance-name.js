// Script para debug do problema de instance_name
// Execute este script no console do navegador

async function debugClienteInstanceName() {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );
    
    console.log('🔍 Iniciando debug do cliente...');
    
    // 1. Verificar usuário atual
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ Erro ao obter usuário:', userError);
      return;
    }
    
    if (!user) {
      console.error('❌ Nenhum usuário autenticado');
      return;
    }
    
    console.log('👤 Usuário autenticado:', user.email);
    
    // 2. Verificar se é atendente/gestor
    console.log('🔍 Verificando se é atendente/gestor...');
    const { data: atendenteData, error: atendenteError } = await supabase
      .from('atendentes')
      .select('id_cliente, email')
      .eq('email', user.email)
      .single();
    
    if (atendenteError && atendenteError.code !== 'PGRST116') {
      console.error('❌ Erro ao buscar atendente:', atendenteError);
    } else if (atendenteData) {
      console.log('👤 Usuário é atendente/gestor:', atendenteData);
      
      // Buscar informações do cliente associado
      const { data: clientInfo, error: clientError } = await supabase
        .from('clientes_info')
        .select('*')
        .eq('id', atendenteData.id_cliente)
        .single();
        
      if (clientError) {
        console.error('❌ Erro ao buscar cliente do atendente:', clientError);
      } else {
        console.log('🏢 Cliente do atendente:', clientInfo);
        console.log('📱 Instance_name:', clientInfo?.instance_name);
        console.log('🔑 API Key:', clientInfo?.apikey);
      }
    } else {
      console.log('👤 Usuário não é atendente/gestor');
    }
    
    // 3. Buscar diretamente na tabela clientes_info
    console.log('🔍 Buscando diretamente na tabela clientes_info...');
    const { data: clientesInfo, error: clientesError } = await supabase
      .from('clientes_info')
      .select('*')
      .eq('email', user.email)
      .order('id', { ascending: true });
    
    if (clientesError) {
      console.error('❌ Erro ao buscar clientes_info:', clientesError);
      return;
    }
    
    console.log('📋 Registros encontrados na clientes_info:', clientesInfo);
    
    if (!clientesInfo || clientesInfo.length === 0) {
      console.error('❌ Nenhum registro encontrado para o email:', user.email);
      return;
    }
    
    // 4. Verificar cada registro
    clientesInfo.forEach((cliente, index) => {
      console.log(`\n📋 Cliente ${index + 1}:`, {
        id: cliente.id,
        email: cliente.email,
        name: cliente.name,
        instance_name: cliente.instance_name,
        instance_id: cliente.instance_id,
        apikey: cliente.apikey ? '***' : 'null',
        created_at: cliente.created_at
      });
    });
    
    // 5. Verificar se algum tem instance_name
    const clienteComInstance = clientesInfo.find(c => c.instance_name);
    
    if (clienteComInstance) {
      console.log('✅ Cliente com instance_name encontrado:', clienteComInstance.instance_name);
    } else {
      console.error('❌ Nenhum cliente tem instance_name configurado');
      console.log('💡 Solução: Configure o WhatsApp na página "Meus Chips"');
    }
    
    // 6. Verificar estrutura da tabela
    console.log('\n🔍 Verificando estrutura da tabela clientes_info...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'clientes_info')
      .order('ordinal_position');
    
    if (columnsError) {
      console.error('❌ Erro ao buscar estrutura da tabela:', columnsError);
    } else {
      console.log('📋 Estrutura da tabela clientes_info:', columns);
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

// Executar o debug
debugClienteInstanceName();
