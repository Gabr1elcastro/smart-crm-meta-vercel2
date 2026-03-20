const fs = require('fs');
const path = require('path');

function testarAbaCRM() {
  console.log('🧪 Testando se a aba foi alterada de "Relatórios" para "CRM"...\n');

  try {
    // Verificar o Sidebar
    const sidebarPath = path.join(__dirname, 'src', 'components', 'layout', 'Sidebar.tsx');
    const appLayoutPath = path.join(__dirname, 'src', 'components', 'layout', 'AppLayout.tsx');
    
    if (!fs.existsSync(sidebarPath)) {
      console.error('❌ Arquivo Sidebar.tsx não encontrado!');
      return;
    }

    if (!fs.existsSync(appLayoutPath)) {
      console.error('❌ Arquivo AppLayout.tsx não encontrado!');
      return;
    }

    const sidebarContent = fs.readFileSync(sidebarPath, 'utf8');
    const appLayoutContent = fs.readFileSync(appLayoutPath, 'utf8');
    
    console.log('📋 VERIFICAÇÕES REALIZADAS:');
    
    // 1. Verificar se o Sidebar foi atualizado
    const sidebarAtualizado = sidebarContent.includes('label="CRM"') && !sidebarContent.includes('label="Relatórios"');
    console.log(`✅ Sidebar atualizado para "CRM": ${sidebarAtualizado ? 'SIM' : 'NÃO'}`);
    
    // 2. Verificar se o comentário foi atualizado
    const comentarioAtualizado = sidebarContent.includes('{/* CRM - só mostra se plano_crm for TRUE */}');
    console.log(`✅ Comentário atualizado para "CRM": ${comentarioAtualizado ? 'SIM' : 'NÃO'}`);
    
    // 3. Verificar se o AppLayout foi atualizado
    const appLayoutAtualizado = appLayoutContent.includes('"/relatorios": "CRM"') && !appLayoutContent.includes('"/relatorios": "Relatórios"');
    console.log(`✅ AppLayout atualizado para "CRM": ${appLayoutAtualizado ? 'SIM' : 'NÃO'}`);
    
    // 4. Verificar se a rota ainda aponta para /relatorios
    const rotaCorreta = sidebarContent.includes('to="/relatorios"');
    console.log(`✅ Rota ainda aponta para /relatorios: ${rotaCorreta ? 'SIM' : 'NÃO'}`);
    
    // 5. Verificar se o ícone ainda é BarChart3
    const iconeCorreto = sidebarContent.includes('icon={BarChart3}');
    console.log(`✅ Ícone ainda é BarChart3: ${iconeCorreto ? 'SIM' : 'NÃO'}`);
    
    // Resumo
    const totalVerificacoes = 5;
    const verificacoesPassaram = [
      sidebarAtualizado,
      comentarioAtualizado,
      appLayoutAtualizado,
      rotaCorreta,
      iconeCorreto
    ].filter(Boolean).length;
    
    console.log(`\n📊 RESULTADO: ${verificacoesPassaram}/${totalVerificacoes} verificações passaram`);
    
    if (verificacoesPassaram === totalVerificacoes) {
      console.log('🎉 SUCESSO! Aba foi alterada de "Relatórios" para "CRM"!');
      
      console.log('\n🎯 ALTERAÇÕES REALIZADAS:');
      console.log('   - ✅ Sidebar: label="CRM"');
      console.log('   - ✅ Comentário: "CRM - só mostra se plano_crm for TRUE"');
      console.log('   - ✅ AppLayout: "/relatorios": "CRM"');
      console.log('   - ✅ Rota: mantida como /relatorios');
      console.log('   - ✅ Ícone: mantido como BarChart3');
      
      console.log('\n🔧 COMO FUNCIONA AGORA:');
      console.log('1. Usuários com plano_crm = TRUE veem a aba "CRM"');
      console.log('2. A aba "CRM" leva para a rota /relatorios');
      console.log('3. O título da página mostra "CRM"');
      console.log('4. Funcionalidades permanecem as mesmas (Scorecard, Lista, Quadro)');
      
      console.log('\n📱 INTERFACE ATUALIZADA:');
      console.log('   - Sidebar: "CRM" (em vez de "Relatórios")');
      console.log('   - Título da página: "CRM"');
      console.log('   - URL: /relatorios (mantida)');
      console.log('   - Ícone: BarChart3 (mantido)');
      
    } else {
      console.log('⚠️  ALGUMAS VERIFICAÇÕES FALHARAM!');
      console.log('💡 Verifique os itens que falharam acima');
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testarAbaCRM();
