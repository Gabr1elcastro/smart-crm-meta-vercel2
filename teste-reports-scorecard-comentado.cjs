const fs = require('fs');
const path = require('path');

function testarScorecardComentado() {
  console.log('🧪 Testando se o scorecard foi comentado corretamente...\n');

  try {
    const reportsPath = path.join(__dirname, 'src', 'pages', 'reports', 'Reports.tsx');
    
    if (!fs.existsSync(reportsPath)) {
      console.error('❌ Arquivo Reports.tsx não encontrado!');
      return;
    }

    const content = fs.readFileSync(reportsPath, 'utf8');
    
    console.log('📋 VERIFICAÇÕES REALIZADAS:');
    
    // 1. Verificar se o import do Scorecard foi comentado
    const importScorecardComentado = content.includes('// import Scorecard from "./Scorecard";');
    console.log(`✅ Import do Scorecard comentado: ${importScorecardComentado ? 'SIM' : 'NÃO'}`);
    
    // 2. Verificar se o estado inicial foi alterado para "list"
    const estadoInicialList = content.includes('useState("list")');
    console.log(`✅ Estado inicial alterado para "list": ${estadoInicialList ? 'SIM' : 'NÃO'}`);
    
    // 3. Verificar se a tab do scorecard foi comentada
    const tabScorecardComentada = content.includes('{/* <TabsTrigger value="scorecard">Scorecard</TabsTrigger> */}');
    console.log(`✅ Tab do scorecard comentada: ${tabScorecardComentada ? 'SIM' : 'NÃO'}`);
    
    // 4. Verificar se o grid foi alterado para 1 coluna
    const gridUmaColuna = content.includes('grid-cols-1');
    console.log(`✅ Grid alterado para 1 coluna: ${gridUmaColuna ? 'SIM' : 'NÃO'}`);
    
    // 5. Verificar se o TabsContent do scorecard foi comentado
    const tabsContentScorecardComentado = content.includes('{/* <TabsContent value="scorecard"');
    console.log(`✅ TabsContent do scorecard comentado: ${tabsContentScorecardComentado ? 'SIM' : 'NÃO'}`);
    
    // 6. Verificar se apenas a visualização em lista está ativa
    const apenasListView = content.includes('value="list"') && !content.includes('value="scorecard"') || content.includes('{/* <TabsTrigger value="scorecard"');
    console.log(`✅ Apenas visualização em lista ativa: ${apenasListView ? 'SIM' : 'NÃO'}`);

    console.log('\n📊 RESUMO DAS ALTERAÇÕES:');
    const totalAlteracoes = [importScorecardComentado, estadoInicialList, tabScorecardComentada, gridUmaColuna, tabsContentScorecardComentado, apenasListView].filter(Boolean).length;
    console.log(`   - Total de alterações implementadas: ${totalAlteracoes}/6`);
    
    if (totalAlteracoes === 6) {
      console.log('🎉 TODAS as alterações foram implementadas com sucesso!');
    } else {
      console.log('⚠️  Algumas alterações não foram implementadas corretamente.');
    }

    console.log('\n🎯 RESULTADO ESPERADO:');
    console.log('   - Scorecard completamente comentado e não visível');
    console.log('   - Apenas "Visualização em Lista" disponível');
    console.log('   - Grid com 1 coluna (não mais 2 colunas)');
    console.log('   - Estado inicial definido como "list"');

    console.log('\n🧪 COMO TESTAR NO NAVEGADOR:');
    console.log('1. Acesse a página de Relatórios (/reports)');
    console.log('2. Verifique se apenas "Visualização em Lista" aparece');
    console.log('3. Verifique se não há opção de "Scorecard"');
    console.log('4. Verifique se a visualização em lista carrega automaticamente');

  } catch (error) {
    console.error('❌ Erro ao verificar as alterações:', error);
  }
}

// Executar o teste
testarScorecardComentado();
