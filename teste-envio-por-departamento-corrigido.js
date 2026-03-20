// Teste da implementação corrigida de envio por departamento
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Função para testar a lógica de departamentos
async function testarLógicaDepartamentos() {
  console.log('🧪 TESTANDO LÓGICA DE ENVIO POR DEPARTAMENTO');
  console.log('=' .repeat(50));

  try {
    // Teste 1: Lead com departamento que tem chip associado
    console.log('\n📋 TESTE 1: Lead com departamento que tem chip associado');
    const telefone1 = '5511999999999';
    
    // Buscar departamento do lead
    const { data: lead1, error: leadError1 } = await supabase
      .from('leads')
      .select('id_departamento')
      .eq('telefone', telefone1)
      .single();
    
    if (leadError1) {
      console.log('❌ Lead não encontrado ou sem departamento');
    } else {
      console.log('✅ Lead encontrado, departamento:', lead1.id_departamento);
      
      if (lead1.id_departamento) {
        // Buscar chip associado ao departamento
        const { data: departamento1, error: deptError1 } = await supabase
          .from('departamento')
          .select('instance_name_chip_associado')
          .eq('id', lead1.id_departamento)
          .single();
        
        if (departamento1?.instance_name_chip_associado) {
          console.log('✅ Departamento tem chip associado:', departamento1.instance_name_chip_associado);
        } else {
          console.log('⚠️ Departamento sem chip associado, usaria chip 1');
        }
      }
    }

    // Teste 2: Lead sem departamento
    console.log('\n📋 TESTE 2: Lead sem departamento');
    const telefone2 = '5511888888888';
    
    const { data: lead2, error: leadError2 } = await supabase
      .from('leads')
      .select('id_departamento')
      .eq('telefone', telefone2)
      .single();
    
    if (leadError2) {
      console.log('✅ Lead sem departamento, usaria chip 1 por padrão');
    } else {
      console.log('ℹ️ Lead tem departamento:', lead2.id_departamento);
    }

    // Teste 3: Verificar departamentos e seus chips
    console.log('\n📋 TESTE 3: Verificar departamentos e chips associados');
    const { data: departamentos, error: deptError } = await supabase
      .from('departamento')
      .select('id, nome, instance_name_chip_associado');
    
    if (deptError) {
      console.log('❌ Erro ao buscar departamentos:', deptError);
    } else {
      console.log('📊 Departamentos encontrados:');
      departamentos.forEach(dept => {
        console.log(`  - ID: ${dept.id}, Nome: ${dept.nome}, Chip: ${dept.instance_name_chip_associado || 'Nenhum'}`);
      });
    }

    // Teste 4: Verificar leads e seus departamentos
    console.log('\n📋 TESTE 4: Verificar leads e seus departamentos');
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('telefone, id_departamento')
      .limit(10);
    
    if (leadsError) {
      console.log('❌ Erro ao buscar leads:', leadsError);
    } else {
      console.log('📊 Leads encontrados:');
      leads.forEach(lead => {
        console.log(`  - Telefone: ${lead.telefone}, Departamento: ${lead.id_departamento || 'Nenhum'}`);
      });
    }

  } catch (error) {
    console.error('💥 Erro no teste:', error);
  }
}

// Executar teste
testarLógicaDepartamentos();