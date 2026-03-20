// Teste de Chips Configurados em "Meus Chips"
console.log('🧪 Testando Chips Configurados...');

// Verificar se os departamentos configurados mostram o chip correto
const checkConfiguredChips = () => {
  console.log('📋 Verificando chips configurados...');
  
  // Verificar se a tabela existe
  const table = document.querySelector('table');
  if (table) {
    console.log('✅ Tabela encontrada');
    
    // Verificar linhas de dados
    const rows = table.querySelectorAll('tbody tr');
    console.log(`📝 Linhas de dados: ${rows.length}`);
    
    // Verificar selects de chip
    const selects = table.querySelectorAll('select');
    console.log(`🎛️  Selects de chip: ${selects.length}`);
    
    // Verificar selects com fundo laranja (configurados)
    const configuredSelects = table.querySelectorAll('select + div[class*="bg-orange-50"]');
    console.log(`🔶 Selects configurados (fundo laranja): ${configuredSelects.length}`);
    
    // Verificar valores dos selects
    selects.forEach((select, index) => {
      const value = select.value;
      const isConfigured = select.parentElement.querySelector('[class*="bg-orange-50"]');
      
      console.log(`  Select ${index + 1}:`);
      console.log(`    Valor: ${value}`);
      console.log(`    Configurado: ${isConfigured ? 'Sim' : 'Não'}`);
      
      if (value && value !== 'none') {
        console.log(`    ✅ Mostrando chip: ${value}`);
      } else if (isConfigured) {
        console.log(`    ⚠️  Configurado mas sem valor visível`);
      } else {
        console.log(`    ℹ️  Sem chip selecionado`);
      }
    });
    
  } else {
    console.log('❌ Tabela não encontrada');
  }
};

// Verificar se os departamentos configurados estão desabilitados
const checkDisabledStates = () => {
  console.log('🔒 Verificando estados desabilitados...');
  
  const selects = document.querySelectorAll('select');
  selects.forEach((select, index) => {
    const isDisabled = select.disabled;
    const isConfigured = select.parentElement.querySelector('[class*="bg-orange-50"]');
    
    console.log(`  Select ${index + 1}:`);
    console.log(`    Desabilitado: ${isDisabled ? 'Sim' : 'Não'}`);
    console.log(`    Configurado: ${isConfigured ? 'Sim' : 'Não'}`);
    
    if (isConfigured && !isDisabled) {
      console.log(`    ⚠️  Configurado mas não desabilitado`);
    } else if (isConfigured && isDisabled) {
      console.log(`    ✅ Configurado e desabilitado corretamente`);
    }
  });
};

// Executar verificações
setTimeout(() => {
  checkConfiguredChips();
  checkDisabledStates();
  console.log('✅ Teste de chips configurados concluído!');
}, 1000); 