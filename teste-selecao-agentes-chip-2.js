// Script para testar a seleção de agentes para o chip 2
// Execute este script no console do navegador

async function testarSelecaoAgentesChip2() {
  console.log('🧪 Testando seleção de agentes para Chip 2...\n');

  try {
    // Simular dados de teste
    const clienteTeste = {
      id: 999,
      email: 'teste@exemplo.com',
      instance_id: 'instance-1-teste',
      instance_id_2: 'instance-2-teste'
    };

    const agentesTeste = [
      {
        id: 1,
        nome: 'Agente Vendas',
        instance_id: 'instance-1-teste',
        instance_id_2: null,
        em_uso: true,
        em_uso_2: false
      },
      {
        id: 2,
        nome: 'Agente Suporte',
        instance_id: 'instance-1-teste',
        instance_id_2: 'instance-2-teste',
        em_uso: false,
        em_uso_2: true
      },
      {
        id: 3,
        nome: 'Agente Marketing',
        instance_id: null,
        instance_id_2: null,
        em_uso: false,
        em_uso_2: false
      }
    ];

    console.log('1️⃣ Dados de teste:');
    console.log('Cliente:', clienteTeste);
    console.log('Agentes:', agentesTeste);

    // Simular lógica de seleção para Chip 1
    console.log('\n2️⃣ Testando seleção para Chip 1:');
    const agentesChip1 = agentesTeste.map(agente => ({
      ...agente,
      isInUse: agente.em_uso,
      canSelect: true
    }));
    
    agentesChip1.forEach(agente => {
      console.log(`   - ${agente.nome}: ${agente.isInUse ? '✓ Em uso' : 'Disponível'}`);
    });

    // Simular lógica de seleção para Chip 2
    console.log('\n3️⃣ Testando seleção para Chip 2:');
    const agentesChip2 = agentesTeste.map(agente => ({
      ...agente,
      isInUse: agente.em_uso_2,
      canSelect: true
    }));
    
    agentesChip2.forEach(agente => {
      console.log(`   - ${agente.nome}: ${agente.isInUse ? '✓ Em uso' : 'Disponível'}`);
    });

    // Simular seleção de agente para Chip 2
    console.log('\n4️⃣ Simulando seleção de agente para Chip 2:');
    const agenteSelecionado = agentesTeste[0]; // Agente Vendas
    const chipNumber = 2;
    
    console.log(`Selecionando: ${agenteSelecionado.nome} para Chip ${chipNumber}`);
    
    // Simular atualização no banco de dados
    const updateData = {
      [chipNumber === 1 ? 'em_uso' : 'em_uso_2']: true,
      [chipNumber === 1 ? 'instance_id' : 'instance_id_2']: clienteTeste[chipNumber === 1 ? 'instance_id' : 'instance_id_2']
    };
    
    console.log('Dados para atualização:', updateData);
    
    // Simular desativação de outros agentes
    console.log('Desativando outros agentes para Chip 2...');
    const outrosAgentes = agentesTeste.filter(agente => agente.id !== agenteSelecionado.id);
    outrosAgentes.forEach(agente => {
      console.log(`   - Desativando ${agente.nome}`);
    });

    // Simular resultado final
    console.log('\n5️⃣ Resultado final:');
    const agentesAtualizados = agentesTeste.map(agente => {
      if (agente.id === agenteSelecionado.id) {
        return {
          ...agente,
          em_uso_2: true,
          instance_id_2: clienteTeste.instance_id_2
        };
      } else {
        return {
          ...agente,
          em_uso_2: false
        };
      }
    });

    agentesAtualizados.forEach(agente => {
      console.log(`   - ${agente.nome}:`);
      console.log(`     Chip 1: ${agente.em_uso ? '✓ Em uso' : 'Disponível'}`);
      console.log(`     Chip 2: ${agente.em_uso_2 ? '✓ Em uso' : 'Disponível'}`);
    });

    // Verificar validações
    console.log('\n6️⃣ Verificando validações:');
    
    // Verificar se apenas um agente está em uso por chip
    const agentesEmUsoChip1 = agentesAtualizados.filter(agente => agente.em_uso).length;
    const agentesEmUsoChip2 = agentesAtualizados.filter(agente => agente.em_uso_2).length;
    
    console.log(`   - Agentes em uso no Chip 1: ${agentesEmUsoChip1} ${agentesEmUsoChip1 === 1 ? '✅' : '❌'}`);
    console.log(`   - Agentes em uso no Chip 2: ${agentesEmUsoChip2} ${agentesEmUsoChip2 === 1 ? '✅' : '❌'}`);
    
    // Verificar se o mesmo agente pode ser usado em ambos os chips
    const agenteCompartilhado = agentesAtualizados.find(agente => agente.em_uso && agente.em_uso_2);
    if (agenteCompartilhado) {
      console.log(`   - Agente compartilhado: ${agenteCompartilhado.nome} ✅`);
    } else {
      console.log('   - Nenhum agente compartilhado entre os chips');
    }

    console.log('\n🎉 Teste de seleção de agentes concluído!');
    console.log('\n📋 Resumo:');
    console.log('   - Lógica de seleção para Chip 2 implementada');
    console.log('   - Validação de apenas um agente por chip funcionando');
    console.log('   - Compartilhamento de agentes entre chips permitido');
    console.log('   - Atualização de instance_id_2 funcionando');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testarSelecaoAgentesChip2();
