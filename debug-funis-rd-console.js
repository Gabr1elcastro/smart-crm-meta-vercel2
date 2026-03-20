// Script para debugar funis_rd no console do navegador
// Execute este script no console do navegador

console.log('🔍 Iniciando debug da tabela funis_rd...');

// Função para testar consultas diretas
const testarConsultasFunisRd = async () => {
  try {
    console.log('📊 Testando consultas na tabela funis_rd...');
    
    // 1. Buscar todos os registros
    console.log('1️⃣ Buscando TODOS os registros...');
    const { data: todos, error: todosError } = await supabase
      .from('funis_rd')
      .select('*')
      .order('created_at', { ascending: false });
    
    console.log('📋 Todos os registros:', todos);
    console.log('❌ Erro (todos):', todosError);
    console.log('📊 Total de registros:', todos?.length || 0);
    
    // 2. Buscar por id_cliente = 114 (integer)
    console.log('\n2️⃣ Buscando por id_cliente = 114 (integer)...');
    const { data: funis114Int, error: error114Int } = await supabase
      .from('funis_rd')
      .select('*')
      .eq('id_cliente', 114);
    
    console.log('📋 Registros para id_cliente = 114 (int):', funis114Int);
    console.log('❌ Erro (114 int):', error114Int);
    console.log('📊 Total para 114 (int):', funis114Int?.length || 0);
    
    // 3. Buscar por id_cliente = '114' (string)
    console.log('\n3️⃣ Buscando por id_cliente = "114" (string)...');
    const { data: funis114Str, error: error114Str } = await supabase
      .from('funis_rd')
      .select('*')
      .eq('id_cliente', '114');
    
    console.log('📋 Registros para id_cliente = "114" (str):', funis114Str);
    console.log('❌ Erro (114 str):', error114Str);
    console.log('📊 Total para "114" (str):', funis114Str?.length || 0);
    
    // 4. Verificar tipos de dados dos registros existentes
    if (todos && todos.length > 0) {
      console.log('\n4️⃣ Analisando tipos de dados dos registros existentes...');
      todos.forEach((registro, index) => {
        console.log(`Registro ${index + 1}:`, {
          id: registro.id,
          id_cliente: registro.id_cliente,
          id_cliente_type: typeof registro.id_cliente,
          nome_funil: registro.nome_funil,
          created_at: registro.created_at
        });
      });
    }
    
    return {
      todos,
      funis114Int,
      funis114Str,
      totalTodos: todos?.length || 0,
      total114Int: funis114Int?.length || 0,
      total114Str: funis114Str?.length || 0
    };
    
  } catch (error) {
    console.error('❌ Erro nas consultas:', error);
    return null;
  }
};

// Função para testar o endpoint de debug
const testarEndpointDebug = async () => {
  try {
    console.log('🌐 Testando endpoint de debug...');
    
    const response = await fetch('/api/debug-funis-rd');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Endpoint de debug:', data);
      return data;
    } else {
      console.error('❌ Erro no endpoint:', response.status);
      return null;
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
    return null;
  }
};

// Executar todos os testes
const executarDebugCompleto = async () => {
  console.log('🚀 Executando debug completo da tabela funis_rd...');
  
  // Teste 1: Consultas diretas
  console.log('\n📋 TESTE 1: Consultas diretas no Supabase');
  const consultas = await testarConsultasFunisRd();
  
  // Teste 2: Endpoint de debug
  console.log('\n📋 TESTE 2: Endpoint de debug');
  const endpoint = await testarEndpointDebug();
  
  console.log('\n✅ Debug completo finalizado!');
  console.log('📊 Resumo:');
  console.log('- Total de registros na tabela:', consultas?.totalTodos || 0);
  console.log('- Registros para id_cliente = 114 (int):', consultas?.total114Int || 0);
  console.log('- Registros para id_cliente = "114" (str):', consultas?.total114Str || 0);
  console.log('- Endpoint funcionou:', endpoint ? 'SIM' : 'NÃO');
  
  return { consultas, endpoint };
};

// Executar
executarDebugCompleto();
