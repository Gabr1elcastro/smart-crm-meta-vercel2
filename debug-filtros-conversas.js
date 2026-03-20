// Script para debugar os filtros de conversas
// Cole este código no console do navegador quando estiver na página de conversas

function debugFiltrosConversas() {
  console.log('🔍 DEBUG DOS FILTROS DE CONVERSAS');
  console.log('=================================\n');

  try {
    // 1. VERIFICAR ESTADOS DOS FILTROS
    console.log('1. 📊 Estados dos filtros:');
    
    // Verificar se estamos na página correta
    if (typeof window.React !== 'undefined') {
      console.log('✅ React encontrado');
    } else {
      console.log('❌ React não encontrado - execute na página de conversas');
      return;
    }

    // 2. VERIFICAR DADOS DISPONÍVEIS
    console.log('\n2. 📋 Verificando dados disponíveis...');
    
    // Verificar se há elementos da página de conversas
    const departamentoSelect = document.querySelector('[data-testid="departamento-select"], select');
    const etiquetaSelect = document.querySelector('[data-testid="etiqueta-select"], select');
    const contatosList = document.querySelector('[data-testid="contatos-list"], .flex-1');
    
    if (departamentoSelect) {
      console.log('✅ Select de departamento encontrado');
      console.log('   Valor atual:', departamentoSelect.value);
      console.log('   Opções:', Array.from(departamentoSelect.options).map(o => ({ value: o.value, text: o.textContent })));
    } else {
      console.log('❌ Select de departamento não encontrado');
    }
    
    if (etiquetaSelect) {
      console.log('✅ Select de etiqueta encontrado');
      console.log('   Valor atual:', etiquetaSelect.value);
      console.log('   Opções:', Array.from(etiquetaSelect.options).map(o => ({ value: o.value, text: o.textContent })));
    } else {
      console.log('❌ Select de etiqueta não encontrado');
    }
    
    if (contatosList) {
      console.log('✅ Lista de contatos encontrada');
      const contatos = contatosList.querySelectorAll('[data-testid="contato-item"], .p-4');
      console.log(`   Contatos visíveis: ${contatos.length}`);
    } else {
      console.log('❌ Lista de contatos não encontrada');
    }

    // 3. VERIFICAR ETIQUETAS VISÍVEIS
    console.log('\n3. 🏷️ Verificando etiquetas visíveis...');
    
    const etiquetasVisiveis = document.querySelectorAll('[data-testid="etiqueta-display"], .w-3.h-3.rounded-full');
    console.log(`   Etiquetas encontradas na tela: ${etiquetasVisiveis.length}`);
    
    etiquetasVisiveis.forEach((etiqueta, index) => {
      const cor = etiqueta.style.backgroundColor || 'sem cor';
      const titulo = etiqueta.title || 'sem título';
      console.log(`   Etiqueta ${index + 1}: ${cor} - ${titulo}`);
    });

    // 4. VERIFICAR CONSOLE LOGS
    console.log('\n4. 📝 Verificando logs do console...');
    console.log('   Procure por logs com:');
    console.log('   - "Debug lead encontrado"');
    console.log('   - "Leads com score de qualificação"');
    console.log('   - "EtiquetasDisplay"');
    console.log('   - "contatosExibidos"');

    // 5. TESTAR FILTROS MANUALMENTE
    console.log('\n5. 🧪 Testando filtros manualmente...');
    
    if (departamentoSelect && etiquetaSelect) {
      console.log('   Para testar:');
      console.log('   1. Mude o filtro de departamento para "Todos os departamentos"');
      console.log('   2. Mude o filtro de etiqueta para uma etiqueta específica');
      console.log('   3. Verifique se aparecem contatos');
      console.log('   4. Verifique se as etiquetas aparecem nos contatos');
      
      // Sugestões de teste
      console.log('\n   📋 Sequência de testes sugerida:');
      console.log('   a) Departamento: "Todos" + Etiqueta: "Todas"');
      console.log('   b) Departamento: "Todos" + Etiqueta: "Específica"');
      console.log('   c) Departamento: "Específico" + Etiqueta: "Todas"');
      console.log('   d) Departamento: "Específico" + Etiqueta: "Específica"');
    }

    // 6. VERIFICAR PROBLEMAS COMUNS
    console.log('\n6. 🔍 Verificando problemas comuns...');
    
    // Verificar se há erros no console
    const errors = [];
    const originalError = console.error;
    console.error = function(...args) {
      errors.push(args.join(' '));
      originalError.apply(console, args);
    };
    
    setTimeout(() => {
      console.error = originalError;
      if (errors.length > 0) {
        console.log('   ❌ Erros encontrados no console:');
        errors.forEach(error => console.log(`      - ${error}`));
      } else {
        console.log('   ✅ Nenhum erro encontrado no console');
      }
    }, 1000);

    // 7. INSTRUÇÕES PARA DEBUG MANUAL
    console.log('\n7. 📖 Instruções para debug manual:');
    console.log('   =================================');
    console.log('   1. Abra o DevTools (F12)');
    console.log('   2. Vá para a aba "Console"');
    console.log('   3. Procure por logs relacionados a:');
    console.log('      - "fetchLeads"');
    console.log('      - "contatosExibidos"');
    console.log('      - "EtiquetasDisplay"');
    console.log('   4. Mude os filtros e observe os logs');
    console.log('   5. Verifique se "allLeads" está sendo carregado');
    console.log('   6. Verifique se os filtros estão usando "allLeads"');

    // 8. VERIFICAR PERFORMANCE
    console.log('\n8. ⚡ Verificando performance...');
    
    const startTime = performance.now();
    
    // Simular operação pesada
    let count = 0;
    for (let i = 0; i < 1000000; i++) {
      count += i;
    }
    
    const endTime = performance.now();
    console.log(`   Tempo de processamento: ${(endTime - startTime).toFixed(2)}ms`);
    
    if (endTime - startTime > 100) {
      console.log('   ⚠️ Performance pode estar afetada');
    } else {
      console.log('   ✅ Performance parece normal');
    }

    console.log('\n✅ Debug concluído!');
    console.log('📝 Se ainda houver problemas, verifique os logs do console durante o uso dos filtros.');

  } catch (error) {
    console.error('❌ Erro no debug:', error);
  }
}

// Executar debug
debugFiltrosConversas();
