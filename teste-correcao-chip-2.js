// Teste da correção do chip 2
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Função para testar a correção do chip 2
async function testarCorrecaoChip2() {
  console.log('🧪 TESTANDO CORREÇÃO DO CHIP 2');
  console.log('=' .repeat(50));

  try {
    // Teste 1: Verificar estrutura da tabela clientes_info
    console.log('\n📋 TESTE 1: Verificar estrutura da tabela');
    
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'clientes_info')
      .in('column_name', ['instance_name', 'instance_name_2', 'instance_name_chip_2'])
      .order('column_name');
    
    if (columnsError) {
      console.log('❌ Erro ao buscar estrutura:', columnsError);
    } else {
      console.log('📊 Campos encontrados:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    }

    // Teste 2: Verificar dados de um cliente específico
    console.log('\n📋 TESTE 2: Verificar dados do cliente');
    
    const { data: cliente, error: clienteError } = await supabase
      .from('clientes_info')
      .select('id, email, instance_name, instance_name_2')
      .eq('email', 'diego.almeida@basicobemfeito.com')
      .single();
    
    if (clienteError) {
      console.log('❌ Erro ao buscar cliente:', clienteError);
    } else {
      console.log('📊 Dados do cliente:');
      console.log(`  - ID: ${cliente.id}`);
      console.log(`  - Email: ${cliente.email}`);
      console.log(`  - Chip 1 (instance_name): ${cliente.instance_name || 'Não configurado'}`);
      console.log(`  - Chip 2 (instance_name_2): ${cliente.instance_name_2 || 'Não configurado'}`);
    }

    // Teste 3: Simular busca do chip 2
    console.log('\n📋 TESTE 3: Simular busca do chip 2');
    
    if (cliente) {
      const chip2 = cliente.instance_name_2;
      if (chip2) {
        console.log('✅ Chip 2 encontrado:', chip2);
        console.log('✅ Correção funcionando!');
      } else {
        console.log('⚠️ Chip 2 não configurado para este cliente');
        console.log('💡 Configure o chip 2 na página "Meus Chips"');
      }
    }

  } catch (error) {
    console.error('💥 Erro no teste:', error);
  }
}

// Executar teste
testarCorrecaoChip2();




