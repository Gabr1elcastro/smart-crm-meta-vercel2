// Script para testar a integração com funis RD
// Execute este script no console do navegador para testar

const testFunisRd = async () => {
  try {
    console.log('🔍 Testando busca de funis RD...');
    
    // Simular a busca de funis RD
    const response = await fetch('/api/test-funis-rd', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Funis RD encontrados:', data);
      return data;
    } else {
      console.error('❌ Erro ao buscar funis RD:', response.status);
      return null;
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
    return null;
  }
};

// Função para testar diretamente no Supabase
const testSupabaseFunisRd = async () => {
  try {
    console.log('🔍 Testando busca direta no Supabase...');
    
    // Esta função deve ser executada no contexto da aplicação onde o supabase está disponível
    const { data, error } = await supabase
      .from('funis_rd')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Erro no Supabase:', error);
      return null;
    }
    
    console.log('✅ Funis RD encontrados no Supabase:', data);
    return data;
  } catch (error) {
    console.error('❌ Erro na consulta Supabase:', error);
    return null;
  }
};

// Executar testes
console.log('🚀 Iniciando testes de integração RD Station...');
testFunisRd();

