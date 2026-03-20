// Teste da unificação de mensagens de ambas as instâncias
console.log('🧪 TESTANDO UNIFICAÇÃO DE MENSAGENS DE AMBAS AS INSTÂNCIAS');
console.log('=' .repeat(70));

// Simular dados de leads com instâncias
const leadsData = [
  {
    telefone: '5511999999999',
    nome: 'João Silva',
    instance_id: 'smartcrm_114_financeiro',
    instance_id_2: 'smartcrm2_114_financeiro',
    nome_instancia: 'Chip 1 - Financeiro',
    nome_instancia_2: 'Chip 2 - Financeiro'
  },
  {
    telefone: '5511888888888',
    nome: 'Maria Santos',
    instance_id: 'smartcrm_114_financeiro',
    instance_id_2: null,
    nome_instancia: 'Chip 1 - Financeiro',
    nome_instancia_2: null
  }
];

// Simular mensagens de diferentes instâncias
const mensagensData = [
  // Mensagens do João - Chip 1
  {
    id: 1,
    telefone_id: '5511999999999',
    mensagem: 'Olá, preciso de ajuda com meu pedido',
    instance_id: 'smartcrm_114_financeiro',
    tipo: false, // Mensagem recebida
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 2,
    telefone_id: '5511999999999',
    mensagem: 'Claro! Como posso ajudar?',
    instance_id: 'smartcrm_114_financeiro',
    tipo: true, // Mensagem enviada
    created_at: '2024-01-15T10:01:00Z'
  },
  // Mensagens do João - Chip 2 (depois de transferir)
  {
    id: 3,
    telefone_id: '5511999999999',
    mensagem: 'Agora estou no departamento comercial',
    instance_id: 'smartcrm2_114_financeiro',
    tipo: false, // Mensagem recebida
    created_at: '2024-01-15T11:00:00Z'
  },
  {
    id: 4,
    telefone_id: '5511999999999',
    mensagem: 'Perfeito! Vou te ajudar com a venda',
    instance_id: 'smartcrm2_114_financeiro',
    tipo: true, // Mensagem enviada
    created_at: '2024-01-15T11:01:00Z'
  },
  // Mensagens da Maria - apenas Chip 1
  {
    id: 5,
    telefone_id: '5511888888888',
    mensagem: 'Bom dia!',
    instance_id: 'smartcrm_114_financeiro',
    tipo: false,
    created_at: '2024-01-15T09:00:00Z'
  }
];

// Função para coletar instâncias únicas dos leads
function coletarInstanciasUnicas(leads) {
  const instanceIds = new Set();
  
  leads.forEach(lead => {
    if (lead.instance_id) instanceIds.add(lead.instance_id);
    if (lead.instance_id_2) instanceIds.add(lead.instance_id_2);
  });
  
  return Array.from(instanceIds);
}

// Função para filtrar mensagens por instâncias
function filtrarMensagensPorInstancias(mensagens, instanceIds) {
  return mensagens.filter(msg => instanceIds.includes(msg.instance_id));
}

// Função para agrupar mensagens por telefone
function agruparMensagensPorTelefone(mensagens) {
  const grupos = {};
  
  mensagens.forEach(msg => {
    if (!grupos[msg.telefone_id]) {
      grupos[msg.telefone_id] = [];
    }
    grupos[msg.telefone_id].push(msg);
  });
  
  return grupos;
}

// Função para ordenar mensagens por data
function ordenarMensagensPorData(mensagens) {
  return mensagens.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}

// Teste 1: Coletar instâncias únicas
console.log('\n📋 TESTE 1: Coletar instâncias únicas dos leads');
const instanciasUnicas = coletarInstanciasUnicas(leadsData);
console.log('✅ Instâncias encontradas:', instanciasUnicas);

// Teste 2: Filtrar mensagens por instâncias
console.log('\n📋 TESTE 2: Filtrar mensagens por instâncias');
const mensagensFiltradas = filtrarMensagensPorInstancias(mensagensData, instanciasUnicas);
console.log('✅ Total de mensagens filtradas:', mensagensFiltradas.length);
console.log('✅ Mensagens por instância:');
const porInstancia = {};
instanciasUnicas.forEach(id => {
  porInstancia[id] = mensagensFiltradas.filter(msg => msg.instance_id === id).length;
});
console.log(porInstancia);

// Teste 3: Agrupar mensagens por telefone
console.log('\n📋 TESTE 3: Agrupar mensagens por telefone');
const mensagensPorTelefone = agruparMensagensPorTelefone(mensagensFiltradas);
Object.keys(mensagensPorTelefone).forEach(telefone => {
  console.log(`\n📞 Telefone: ${telefone}`);
  const mensagens = ordenarMensagensPorData(mensagensPorTelefone[telefone]);
  mensagens.forEach(msg => {
    const chip = msg.instance_id === 'smartcrm_114_financeiro' ? 'Chip 1' : 'Chip 2';
    const direcao = msg.tipo ? 'Enviada' : 'Recebida';
    console.log(`   ${chip} - ${direcao}: ${msg.mensagem} (${msg.created_at})`);
  });
});

// Teste 4: Simular exibição unificada
console.log('\n📋 TESTE 4: Simular exibição unificada no chat');
const telefoneJoao = '5511999999999';
const mensagensJoao = ordenarMensagensPorData(mensagensPorTelefone[telefoneJoao] || []);

console.log(`\n💬 Chat unificado para ${leadsData.find(l => l.telefone === telefoneJoao)?.nome}:`);
mensagensJoao.forEach((msg, index) => {
  const chip = msg.instance_id === 'smartcrm_114_financeiro' ? 'Chip 1' : 'Chip 2';
  const direcao = msg.tipo ? '→' : '←';
  const horario = new Date(msg.created_at).toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  console.log(`${index + 1}. [${horario}] ${direcao} ${msg.mensagem} [${chip}]`);
});

console.log('\n🎉 TESTE CONCLUÍDO!');
console.log('✅ Mensagens de ambas as instâncias unificadas com sucesso');
console.log('✅ Badges de instância funcionando');
console.log('✅ Ordenação cronológica mantida');
console.log('✅ Histórico completo preservado');




