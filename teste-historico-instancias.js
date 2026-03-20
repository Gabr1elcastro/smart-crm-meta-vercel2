// Script de teste para verificar a funcionalidade de histórico de instâncias
// Execute este script no console do navegador na página de Conversas

console.log('🧪 Iniciando teste de histórico de instâncias...');

// Função para testar a funcionalidade de histórico
async function testarHistoricoInstancias() {
  try {
    // 1. Verificar se os campos existem na tabela leads
    console.log('📋 Verificando estrutura da tabela leads...');
    
    const { data: leads, error } = await supabase
      .from('leads')
      .select('id, nome, telefone, instance_id, nome_instancia, instance_id_2, nome_instancia_2, id_departamento')
      .limit(5);
    
    if (error) {
      console.error('❌ Erro ao buscar leads:', error);
      return;
    }
    
    console.log('✅ Estrutura da tabela leads:', leads[0] ? Object.keys(leads[0]) : 'Nenhum lead encontrado');
    
    // 2. Verificar se os campos de histórico existem
    const camposHistorico = ['instance_id_2', 'nome_instancia_2'];
    const camposExistem = camposHistorico.every(campo => 
      leads[0] && leads[0].hasOwnProperty(campo)
    );
    
    if (camposExistem) {
      console.log('✅ Campos de histórico existem na tabela');
    } else {
      console.log('❌ Campos de histórico não encontrados');
      console.log('💡 Execute o script ADICIONAR-CAMPOS-HISTORICO-LEADS.sql no Supabase');
      return;
    }
    
    // 3. Verificar departamentos disponíveis
    console.log('🏢 Verificando departamentos disponíveis...');
    const { data: departamentos, error: deptError } = await supabase
      .from('departamento')
      .select('id, nome, instance_name_chip_associado');
    
    if (deptError) {
      console.error('❌ Erro ao buscar departamentos:', deptError);
      return;
    }
    
    console.log('✅ Departamentos encontrados:', departamentos.length);
    console.log('📊 Departamentos com chip configurado:', 
      departamentos.filter(d => d.instance_name_chip_associado).length
    );
    
    // 4. Verificar clientes_info para chips disponíveis
    console.log('📱 Verificando chips disponíveis...');
    const { data: clientesInfo, error: clientError } = await supabase
      .from('clientes_info')
      .select('id, instance_name, instance_name_2, instance_id, instance_id_2');
    
    if (clientError) {
      console.error('❌ Erro ao buscar clientes_info:', clientError);
      return;
    }
    
    console.log('✅ Chips disponíveis:', clientesInfo.length);
    console.log('📊 Chips configurados:', 
      clientesInfo.filter(c => c.instance_name || c.instance_name_2).length
    );
    
    // 5. Testar função de atualização de histórico
    console.log('🔄 Testando função de atualização de histórico...');
    
    if (leads.length > 0 && departamentos.length > 0) {
      const leadTeste = leads[0];
      const departamentoTeste = departamentos.find(d => d.instance_name_chip_associado);
      
      if (departamentoTeste) {
        console.log('🧪 Testando transferência de lead...');
        console.log('Lead:', leadTeste.nome, '(ID:', leadTeste.id, ')');
        console.log('Departamento destino:', departamentoTeste.nome, '(ID:', departamentoTeste.id, ')');
        
        // Simular a função de atualização
        const leadAntes = { ...leadTeste };
        console.log('📋 Estado antes da transferência:');
        console.log('- instance_id:', leadAntes.instance_id);
        console.log('- nome_instancia:', leadAntes.nome_instancia);
        console.log('- instance_id_2:', leadAntes.instance_id_2);
        console.log('- nome_instancia_2:', leadAntes.nome_instancia_2);
        console.log('- id_departamento:', leadAntes.id_departamento);
        
        console.log('💡 Para testar a transferência real:');
        console.log('1. Vá para a página de Conversas');
        console.log('2. Selecione um contato');
        console.log('3. Clique em "Transferir para Departamento"');
        console.log('4. Selecione um departamento diferente');
        console.log('5. Confirme a transferência');
        console.log('6. Verifique o modal de detalhes do contato');
        console.log('7. Procure pela seção "Histórico de Instâncias"');
      } else {
        console.log('⚠️ Nenhum departamento com chip configurado encontrado');
        console.log('💡 Configure chips nos departamentos primeiro');
      }
    }
    
    console.log('✅ Teste de histórico de instâncias concluído!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Função para verificar histórico de um lead específico
async function verificarHistoricoLead(leadId) {
  try {
    console.log(`🔍 Verificando histórico do lead ${leadId}...`);
    
    const { data: lead, error } = await supabase
      .from('leads')
      .select('id, nome, telefone, instance_id, nome_instancia, instance_id_2, nome_instancia_2, id_departamento')
      .eq('id', leadId)
      .single();
    
    if (error) {
      console.error('❌ Erro ao buscar lead:', error);
      return;
    }
    
    console.log('📋 Dados do lead:');
    console.log('- Nome:', lead.nome);
    console.log('- Telefone:', lead.telefone);
    console.log('- Departamento atual:', lead.id_departamento);
    console.log('- Instance ID atual:', lead.instance_id);
    console.log('- Nome instância atual:', lead.nome_instancia);
    console.log('- Instance ID histórico:', lead.instance_id_2);
    console.log('- Nome instância histórico:', lead.nome_instancia_2);
    
    if (lead.instance_id_2 || lead.nome_instancia_2) {
      console.log('✅ Lead possui histórico de instâncias!');
      console.log('📝 Este lead foi transferido de departamento anteriormente');
    } else {
      console.log('📝 Lead não possui histórico de instâncias');
      console.log('💡 Isso significa que o lead nunca foi transferido de departamento');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar histórico:', error);
  }
}

// Executar teste
console.log('🚀 Executando teste de histórico de instâncias...');
testarHistoricoInstancias();

// Instruções para teste manual
console.log('\n📋 INSTRUÇÕES PARA TESTE MANUAL:');
console.log('1. Vá para a página de Conversas');
console.log('2. Selecione um contato que tenha lead associado');
console.log('3. Clique em "Transferir para Departamento"');
console.log('4. Selecione um departamento diferente do atual');
console.log('5. Confirme a transferência');
console.log('6. Clique em "Ver detalhes" do contato');
console.log('7. Procure pela seção "Histórico de Instâncias"');
console.log('8. Verifique se os dados da instância anterior foram preservados');

// Para verificar histórico de um lead específico, use:
// verificarHistoricoLead(123); // Substitua 123 pelo ID do lead 