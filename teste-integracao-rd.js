// Script para testar a integração RD Station
// Execute este script no console do navegador

console.log('🚀 Iniciando teste de integração RD Station...');

// Função para testar se a tabela funis_rd está funcionando
const testarTabelaFunisRd = async () => {
  try {
    console.log('🔍 Testando acesso à tabela funis_rd...');
    
    // Simular uma consulta direta (isso deve ser executado no contexto da aplicação)
    const response = await fetch('/api/test-funis-rd');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Tabela funis_rd acessível:', data);
      return data;
    } else {
      console.error('❌ Erro ao acessar tabela:', response.status);
      return null;
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
    return null;
  }
};

// Função para simular dados de teste
const simularDadosTeste = () => {
  console.log('🧪 Simulando dados de teste...');
  
  const dadosTeste = {
    funis: [
      {
        id: 1,
        id_cliente: 1,
        id_funil_rd: 'funil_123',
        nome_funil: 'Funil de Vendas - Teste',
        funil_padrao: false,
        created_at: new Date().toISOString()
      }
    ],
    etapas: [
      {
        id: 1,
        id_cliente: 1,
        id_funil_rd: 'funil_123',
        nome_etapa: 'Lead Qualificado',
        palavra_chave: 'interesse,qualificado',
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        id_cliente: 1,
        id_funil_rd: 'funil_123',
        nome_etapa: 'Proposta Enviada',
        palavra_chave: 'proposta,orçamento',
        created_at: new Date().toISOString()
      }
    ]
  };
  
  console.log('📊 Dados de teste criados:', dadosTeste);
  return dadosTeste;
};

// Executar testes
const executarTestes = async () => {
  console.log('📋 Executando testes...');
  
  // Teste 1: Verificar se a tabela está acessível
  const resultadoTabela = await testarTabelaFunisRd();
  
  // Teste 2: Simular dados
  const dadosSimulados = simularDadosTeste();
  
  console.log('✅ Testes concluídos!');
  console.log('📊 Resultado da tabela:', resultadoTabela);
  console.log('🧪 Dados simulados:', dadosSimulados);
};

// Executar
executarTestes();

