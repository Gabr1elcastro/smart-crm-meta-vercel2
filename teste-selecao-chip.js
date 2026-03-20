// Teste da funcionalidade de seleção de chip
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Função para testar a seleção de chip
async function testarSelecaoChip() {
  console.log('🧪 TESTANDO FUNCIONALIDADE DE SELEÇÃO DE CHIP');
  console.log('=' .repeat(50));

  try {
    // Teste 1: Verificar se existem chips configurados
    console.log('\n📋 TESTE 1: Verificar chips configurados');
    
    const { data: clientesInfo, error: clientesError } = await supabase
      .from('clientes_info')
      .select('id, instance_name, instance_name_chip_2')
      .limit(5);
    
    if (clientesError) {
      console.log('❌ Erro ao buscar clientes:', clientesError);
    } else {
      console.log('📊 Clientes e seus chips:');
      clientesInfo.forEach(cliente => {
        console.log(`  - Cliente ID: ${cliente.id}`);
        console.log(`    Chip 1: ${cliente.instance_name || 'Não configurado'}`);
        console.log(`    Chip 2: ${cliente.instance_name_chip_2 || 'Não configurado'}`);
        console.log('');
      });
    }

    // Teste 2: Simular seleção de chip 1
    console.log('\n📋 TESTE 2: Simular seleção de chip 1');
    const chip1 = await getChipByNumber(1);
    console.log('✅ Chip 1 selecionado:', chip1);

    // Teste 3: Simular seleção de chip 2
    console.log('\n📋 TESTE 3: Simular seleção de chip 2');
    const chip2 = await getChipByNumber(2);
    console.log('✅ Chip 2 selecionado:', chip2);

    // Teste 4: Verificar se a lógica de fallback funciona
    console.log('\n📋 TESTE 4: Testar lógica de fallback');
    console.log('Se chip 2 não estiver configurado, deve usar chip 1');

  } catch (error) {
    console.error('💥 Erro no teste:', error);
  }
}

// Função auxiliar para obter chip por número (simulando a lógica do messageService)
async function getChipByNumber(chipNumber) {
  try {
    // Simular usuário autenticado (você precisaria implementar a autenticação real)
    const userEmail = 'teste@exemplo.com'; // Substitua por um email real
    
    // Buscar cliente por email
    const { data: clientInfo, error: clientError } = await supabase
      .from('clientes_info')
      .select('id, instance_name, instance_name_chip_2')
      .eq('email', userEmail)
      .single();
    
    if (clientError || !clientInfo) {
      throw new Error('Cliente não encontrado');
    }
    
    // Buscar instance_name baseado no número do chip
    let fieldName;
    if (chipNumber === 1) {
      fieldName = 'instance_name';
    } else {
      fieldName = 'instance_name_chip_2';
    }
    
    const instanceName = clientInfo[fieldName];
    
    if (!instanceName) {
      throw new Error(`Chip ${chipNumber} não encontrado`);
    }
    
    return instanceName;
    
  } catch (error) {
    console.error(`Erro ao obter chip ${chipNumber}:`, error);
    throw error;
  }
}

// Executar teste
testarSelecaoChip();




