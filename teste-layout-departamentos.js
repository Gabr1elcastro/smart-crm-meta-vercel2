// Teste do Layout de Departamentos
console.log('🧪 Testando Layout de Departamentos...');

// Verificar se os elementos estão presentes
const checkElements = () => {
  console.log('📋 Verificando elementos da página...');
  
  // Verificar se a tabela existe
  const table = document.querySelector('table');
  if (table) {
    console.log('✅ Tabela encontrada');
    
    // Verificar cabeçalhos
    const headers = table.querySelectorAll('th');
    console.log(`📊 Cabeçalhos encontrados: ${headers.length}`);
    headers.forEach((header, index) => {
      console.log(`  ${index + 1}. ${header.textContent.trim()}`);
    });
    
    // Verificar linhas de dados
    const rows = table.querySelectorAll('tbody tr');
    console.log(`📝 Linhas de dados: ${rows.length}`);
    
    // Verificar selects de chip
    const selects = table.querySelectorAll('select');
    console.log(`🎛️  Selects de chip: ${selects.length}`);
    
    // Verificar botões de ação
    const actionButtons = table.querySelectorAll('button[aria-label]');
    console.log(`🔘 Botões de ação: ${actionButtons.length}`);
    
  } else {
    console.log('❌ Tabela não encontrada');
  }
};

// Verificar responsividade
const checkResponsiveness = () => {
  console.log('📱 Verificando responsividade...');
  
  const card = document.querySelector('.max-w-6xl');
  if (card) {
    console.log('✅ Card com largura máxima configurado');
  }
  
  const container = document.querySelector('.px-4.sm\\:px-6.lg\\:px-8');
  if (container) {
    console.log('✅ Container responsivo configurado');
  }
};

// Verificar alinhamento
const checkAlignment = () => {
  console.log('🎯 Verificando alinhamento...');
  
  const centerCells = document.querySelectorAll('.text-center');
  console.log(`📐 Células centralizadas: ${centerCells.length}`);
  
  const rightCells = document.querySelectorAll('.text-right');
  console.log(`📐 Células alinhadas à direita: ${rightCells.length}`);
};

// Executar verificações
setTimeout(() => {
  checkElements();
  checkResponsiveness();
  checkAlignment();
  console.log('✅ Teste de layout concluído!');
}, 1000); 