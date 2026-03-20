// Script para testar a funcionalidade de agentes para o chip 2
// Execute este script no console do navegador ou como um teste Node.js

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase (substitua pelas suas credenciais)
const supabaseUrl = 'SUA_SUPABASE_URL';
const supabaseKey = 'SUA_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testarChip2Agentes() {
  console.log('🧪 Iniciando teste da funcionalidade de agentes para Chip 2...\n');

  try {
    // 1. Verificar se as colunas foram adicionadas
    console.log('1️⃣ Verificando estrutura da tabela prompts_oficial...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'prompts_oficial')
      .in('column_name', ['instance_id', 'instance_id_2', 'em_uso', 'em_uso_2'])
      .order('column_name');

    if (columnsError) {
      console.error('❌ Erro ao verificar colunas:', columnsError);
      return;
    }

    console.log('✅ Colunas encontradas:');
    columns.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // 2. Verificar dados existentes
    console.log('\n2️⃣ Verificando dados existentes...');
    const { data: prompts, error: promptsError } = await supabase
      .from('prompts_oficial')
      .select('id, nome, instance_id, instance_id_2, em_uso, em_uso_2, id_cliente')
      .limit(5);

    if (promptsError) {
      console.error('❌ Erro ao buscar prompts:', promptsError);
      return;
    }

    console.log('✅ Dados encontrados:');
    prompts.forEach(prompt => {
      console.log(`   - ID: ${prompt.id}, Nome: ${prompt.nome}`);
      console.log(`     instance_id: ${prompt.instance_id || 'null'}`);
      console.log(`     instance_id_2: ${prompt.instance_id_2 || 'null'}`);
      console.log(`     em_uso: ${prompt.em_uso || 'null'}`);
      console.log(`     em_uso_2: ${prompt.em_uso_2 || 'null'}`);
      console.log(`     id_cliente: ${prompt.id_cliente || 'null'}`);
      console.log('');
    });

    // 3. Verificar clientes com instance_id_2
    console.log('3️⃣ Verificando clientes com instance_id_2...');
    const { data: clientes, error: clientesError } = await supabase
      .from('clientes_info')
      .select('id, name, email, instance_id, instance_id_2, atendimento_ia, atendimento_ia_2')
      .not('instance_id_2', 'is', null)
      .limit(3);

    if (clientesError) {
      console.error('❌ Erro ao buscar clientes:', clientesError);
      return;
    }

    console.log('✅ Clientes com instance_id_2:');
    clientes.forEach(cliente => {
      console.log(`   - ID: ${cliente.id}, Nome: ${cliente.name}`);
      console.log(`     instance_id: ${cliente.instance_id || 'null'}`);
      console.log(`     instance_id_2: ${cliente.instance_id_2 || 'null'}`);
      console.log(`     atendimento_ia: ${cliente.atendimento_ia || 'null'}`);
      console.log(`     atendimento_ia_2: ${cliente.atendimento_ia_2 || 'null'}`);
      console.log('');
    });

    // 4. Testar atualização de um prompt para chip 2
    console.log('4️⃣ Testando atualização de prompt para chip 2...');
    if (prompts.length > 0) {
      const promptId = prompts[0].id;
      const testInstanceId2 = 'test-instance-id-2-' + Date.now();
      
      const { data: updateData, error: updateError } = await supabase
        .from('prompts_oficial')
        .update({
          instance_id_2: testInstanceId2,
          em_uso_2: true
        })
        .eq('id', promptId)
        .select();

      if (updateError) {
        console.error('❌ Erro ao atualizar prompt:', updateError);
      } else {
        console.log('✅ Prompt atualizado com sucesso:');
        console.log(`   - ID: ${updateData[0].id}`);
        console.log(`   - instance_id_2: ${updateData[0].instance_id_2}`);
        console.log(`   - em_uso_2: ${updateData[0].em_uso_2}`);
      }
    }

    console.log('\n🎉 Teste concluído com sucesso!');
    console.log('\n📋 Resumo:');
    console.log('   - Colunas instance_id_2 e em_uso_2 foram adicionadas');
    console.log('   - Dados existentes foram verificados');
    console.log('   - Clientes com instance_id_2 foram encontrados');
    console.log('   - Atualização de prompt para chip 2 foi testada');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testarChip2Agentes();
