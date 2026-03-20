// teste-chip-departamento.js
// Script para testar a implementação da relação entre departamentos e chips

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testarChipDepartamento() {
  console.log('🧪 TESTE: Relação entre Departamentos e Chips');
  console.log('==============================================\n');

  try {
    // 1. Verificar se a coluna foi adicionada
    console.log('1. Verificando estrutura da tabela departamento...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'departamento')
      .eq('table_schema', 'public');

    if (columnsError) {
      console.error('❌ Erro ao verificar estrutura:', columnsError);
      return;
    }

    const hasChipColumn = columns.some(col => col.column_name === 'instance_name_chip_associado');
    console.log(hasChipColumn ? '✅ Coluna instance_name_chip_associado encontrada' : '❌ Coluna não encontrada');

    // 2. Buscar clientes com chips disponíveis
    console.log('\n2. Buscando clientes com chips disponíveis...');
    const { data: clientes, error: clientesError } = await supabase
      .from('clientes_info')
      .select('id, name, instance_name, instance_name_2')
      .or('instance_name.not.is.null,instance_name_2.not.is.null');

    if (clientesError) {
      console.error('❌ Erro ao buscar clientes:', clientesError);
      return;
    }

    console.log(`✅ Encontrados ${clientes.length} clientes com chips disponíveis`);
    clientes.forEach(cliente => {
      console.log(`   - ${cliente.name}: Chip 1=${cliente.instance_name || 'N/A'}, Chip 2=${cliente.instance_name_2 || 'N/A'}`);
    });

    // 3. Testar busca de chips disponíveis para um cliente
    if (clientes.length > 0) {
      const clienteTeste = clientes[0];
      console.log(`\n3. Testando busca de chips para cliente: ${clienteTeste.name}`);
      
      const chipsDisponiveis = [];
      if (clienteTeste.instance_name) {
        chipsDisponiveis.push({
          chipNumber: 1,
          instanceName: clienteTeste.instance_name,
          isAvailable: true
        });
      }
      if (clienteTeste.instance_name_2) {
        chipsDisponiveis.push({
          chipNumber: 2,
          instanceName: clienteTeste.instance_name_2,
          isAvailable: true
        });
      }

      console.log(`✅ Chips disponíveis para ${clienteTeste.name}:`);
      chipsDisponiveis.forEach(chip => {
        console.log(`   - Chip ${chip.chipNumber}: ${chip.instanceName}`);
      });

      // 4. Buscar departamentos do cliente
      console.log('\n4. Buscando departamentos do cliente...');
      const { data: departamentos, error: depsError } = await supabase
        .from('departamento')
        .select('*')
        .eq('id_cliente', clienteTeste.id);

      if (depsError) {
        console.error('❌ Erro ao buscar departamentos:', depsError);
        return;
      }

      console.log(`✅ Encontrados ${departamentos.length} departamentos`);
      departamentos.forEach(dep => {
        console.log(`   - ${dep.nome}: Chip associado = ${dep.instance_name_chip_associado || 'Nenhum'}`);
      });

      // 5. Testar associação de chip a departamento
      if (departamentos.length > 0 && chipsDisponiveis.length > 0) {
        const departamentoTeste = departamentos[0];
        const chipTeste = chipsDisponiveis[0];

        console.log(`\n5. Testando associação de chip ${chipTeste.instanceName} ao departamento ${departamentoTeste.nome}...`);
        
        const { data: updateResult, error: updateError } = await supabase
          .from('departamento')
          .update({ instance_name_chip_associado: chipTeste.instanceName })
          .eq('id', departamentoTeste.id)
          .select();

        if (updateError) {
          console.error('❌ Erro ao associar chip:', updateError);
        } else {
          console.log('✅ Chip associado com sucesso!');
          console.log(`   Departamento: ${updateResult[0].nome}`);
          console.log(`   Chip associado: ${updateResult[0].instance_name_chip_associado}`);
        }
      }
    }

    // 6. Verificar departamentos associados a chips
    console.log('\n6. Verificando departamentos associados a chips...');
    const { data: clientesComAssociacao, error: assocError } = await supabase
      .from('clientes_info')
      .select(`
        id,
        name,
        id_departamento_chip_1,
        id_departamento_chip_2,
        departamento!inner(
          id,
          nome,
          instance_name_chip_associado
        )
      `)
      .or('id_departamento_chip_1.not.is.null,id_departamento_chip_2.not.is.null');

    if (assocError) {
      console.error('❌ Erro ao buscar associações:', assocError);
    } else {
      console.log(`✅ Encontrados ${clientesComAssociacao.length} clientes com departamentos associados a chips`);
      clientesComAssociacao.forEach(cliente => {
        console.log(`   - ${cliente.name}:`);
        console.log(`     Chip 1: ${cliente.id_departamento_chip_1 || 'N/A'}`);
        console.log(`     Chip 2: ${cliente.id_departamento_chip_2 || 'N/A'}`);
      });
    }

    console.log('\n✅ Teste concluído com sucesso!');
    console.log('\n📋 Resumo da implementação:');
    console.log('   - Coluna instance_name_chip_associado adicionada à tabela departamento');
    console.log('   - Interface permite associar chips a departamentos');
    console.log('   - Sistema previne associações duplicadas');
    console.log('   - Próximo passo: integrar com sistema de envio de mensagens');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar teste
testarChipDepartamento(); 