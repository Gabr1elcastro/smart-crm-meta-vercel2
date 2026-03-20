// Script para verificar os dados na tabela funis_rd
// Execute este script no console do navegador

console.log('🔍 Verificando dados na tabela funis_rd...');

const verificarDados = async () => {
  try {
    console.log('📡 Fazendo requisição para /api/verificar-funis-rd...');
    
    const response = await fetch('/api/verificar-funis-rd');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Dados obtidos com sucesso!');
      console.log('📊 Resumo:', {
        total_funis: data.total_funis,
        total_etapas: data.total_etapas,
        clientes_com_funis: data.clientes_com_funis,
        clientes_com_etapas: data.clientes_com_etapas
      });
      
      console.log('📋 Todos os funis:', data.todos_funis);
      console.log('📋 Todas as etapas:', data.todas_etapas);
      
      // Verificar se há dados para id_cliente = 114
      if (data.funis_por_cliente['114']) {
        console.log('✅ Funis encontrados para id_cliente = 114:', data.funis_por_cliente['114']);
      } else {
        console.log('❌ Nenhum funil encontrado para id_cliente = 114');
        console.log('📊 Clientes com funis:', data.clientes_com_funis);
      }
      
      if (data.etapas_por_cliente['114']) {
        console.log('✅ Etapas encontradas para id_cliente = 114:', data.etapas_por_cliente['114']);
      } else {
        console.log('❌ Nenhuma etapa encontrada para id_cliente = 114');
        console.log('📊 Clientes com etapas:', data.clientes_com_etapas);
      }
      
      return data;
    } else {
      console.error('❌ Erro na requisição:', response.status);
      const errorText = await response.text();
      console.error('📄 Detalhes do erro:', errorText);
      return null;
    }
  } catch (error) {
    console.error('❌ Erro na verificação:', error);
    return null;
  }
};

// Executar verificação
verificarDados();
