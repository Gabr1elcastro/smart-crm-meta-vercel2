// Script para testar o envio de mensagens baseado em departamento
// Execute este script no console do navegador

async function testarEnvioPorDepartamento() {
  console.log('🧪 TESTE: Envio de Mensagens por Departamento');
  console.log('==============================================\n');

  try {
    // 1. Verificar estrutura das tabelas
    console.log('1. Verificando estrutura das tabelas...');
    
    // Verificar se a coluna instance_name_chip_associado existe na tabela departamento
    const { data: deptColumns, error: deptError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'departamento')
      .eq('column_name', 'instance_name_chip_associado');

    if (deptError) {
      console.error('❌ Erro ao verificar coluna departamento:', deptError);
    } else {
      console.log(deptColumns.length > 0 ? '✅ Coluna instance_name_chip_associado encontrada em departamento' : '❌ Coluna não encontrada');
    }

    // Verificar se a coluna instance_name_chip_associado existe na tabela prompts_oficial
    const { data: promptColumns, error: promptError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'prompts_oficial')
      .eq('column_name', 'instance_name_chip_associado');

    if (promptError) {
      console.error('❌ Erro ao verificar coluna prompts_oficial:', promptError);
    } else {
      console.log(promptColumns.length > 0 ? '✅ Coluna instance_name_chip_associado encontrada em prompts_oficial' : '❌ Coluna não encontrada');
    }

    // 2. Buscar departamentos com chips associados
    console.log('\n2. Buscando departamentos com chips associados...');
    const { data: departamentos, error: deptError2 } = await supabase
      .from('departamento')
      .select('id, nome, instance_name_chip_associado')
      .not('instance_name_chip_associado', 'is', null);

    if (deptError2) {
      console.error('❌ Erro ao buscar departamentos:', deptError2);
    } else {
      console.log(`✅ Encontrados ${departamentos.length} departamentos com chips associados:`);
      departamentos.forEach(dept => {
        console.log(`   - ${dept.nome}: ${dept.instance_name_chip_associado}`);
      });
    }

    // 3. Buscar leads com departamentos
    console.log('\n3. Buscando leads com departamentos...');
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, nome, telefone, id_departamento')
      .not('id_departamento', 'is', null)
      .limit(5);

    if (leadsError) {
      console.error('❌ Erro ao buscar leads:', leadsError);
    } else {
      console.log(`✅ Encontrados ${leads.length} leads com departamentos:`);
      leads.forEach(lead => {
        console.log(`   - ${lead.nome} (${lead.telefone}): Departamento ${lead.id_departamento}`);
      });
    }

    // 4. Testar lógica de seleção de chip
    console.log('\n4. Testando lógica de seleção de chip...');
    
    if (leads.length > 0) {
      const leadTeste = leads[0];
      console.log(`Testando com lead: ${leadTeste.nome} (${leadTeste.telefone})`);
      
      // Buscar departamento do lead
      const { data: departamento, error: deptError3 } = await supabase
        .from('departamento')
        .select('instance_name_chip_associado')
        .eq('id', leadTeste.id_departamento)
        .single();

      if (deptError3) {
        console.error('❌ Erro ao buscar departamento do lead:', deptError3);
      } else {
        if (departamento?.instance_name_chip_associado) {
          console.log(`✅ Chip associado ao departamento: ${departamento.instance_name_chip_associado}`);
        } else {
          console.log('⚠️ Departamento sem chip associado - deveria usar chip 1 por padrão');
        }
      }
    }

    // 5. Verificar chips disponíveis
    console.log('\n5. Verificando chips disponíveis...');
    const { data: clientes, error: clientesError } = await supabase
      .from('clientes_info')
      .select('id, name, instance_name, instance_name_2')
      .or('instance_name.not.is.null,instance_name_2.not.is.null');

    if (clientesError) {
      console.error('❌ Erro ao buscar clientes:', clientesError);
    } else {
      console.log(`✅ Encontrados ${clientes.length} clientes com chips disponíveis:`);
      clientes.forEach(cliente => {
        console.log(`   - ${cliente.name}:`);
        console.log(`     Chip 1: ${cliente.instance_name || 'N/A'}`);
        console.log(`     Chip 2: ${cliente.instance_name_2 || 'N/A'}`);
      });
    }

    // 6. Simular teste de envio
    console.log('\n6. Simulando teste de envio...');
    
    // Função simulada para testar a lógica
    async function simularSelecaoChip(telefone) {
      try {
        // Buscar lead pelo telefone
        const { data: lead } = await supabase
          .from('leads')
          .select('id_departamento')
          .eq('telefone', telefone)
          .single();

        if (!lead?.id_departamento) {
          console.log('📱 Lead sem departamento - usando chip 1 por padrão');
          return 'chip_1_padrao';
        }

        // Buscar departamento
        const { data: departamento } = await supabase
          .from('departamento')
          .select('instance_name_chip_associado')
          .eq('id', lead.id_departamento)
          .single();

        if (!departamento?.instance_name_chip_associado) {
          console.log('⚠️ Departamento sem chip associado - usando chip 1 por padrão');
          return 'chip_1_padrao';
        }

        console.log(`✅ Usando chip associado: ${departamento.instance_name_chip_associado}`);
        return departamento.instance_name_chip_associado;

      } catch (error) {
        console.error('❌ Erro na simulação:', error);
        return 'erro';
      }
    }

    if (leads.length > 0) {
      const chipSelecionado = await simularSelecaoChip(leads[0].telefone);
      console.log(`Resultado: ${chipSelecionado}`);
    }

    console.log('\n🎉 Teste concluído!');
    console.log('\n📋 Resumo:');
    console.log('   - Estrutura das tabelas verificada');
    console.log('   - Departamentos com chips encontrados');
    console.log('   - Leads com departamentos encontrados');
    console.log('   - Lógica de seleção de chip testada');
    console.log('   - Chips disponíveis verificados');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testarEnvioPorDepartamento();
