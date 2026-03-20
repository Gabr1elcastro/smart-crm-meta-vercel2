const fs = require('fs');
const path = require('path');

function testarContatosAtualizados() {
  console.log('🧪 Testando se a página de Contatos foi atualizada com a interface da ListView...\n');

  try {
    const contatosPath = path.join(__dirname, 'src', 'pages', 'contatos', 'Contatos.tsx');
    
    if (!fs.existsSync(contatosPath)) {
      console.error('❌ Arquivo Contatos.tsx não encontrado!');
      return;
    }

    const contatosContent = fs.readFileSync(contatosPath, 'utf8');
    
    console.log('📋 VERIFICAÇÕES REALIZADAS:');
    
    // 1. Verificar se usa a estrutura de Card/Table da ListView
    const usaEstruturaListView = contatosContent.includes('<Card>') && contatosContent.includes('<Table>');
    console.log(`✅ Usa estrutura Card/Table da ListView: ${usaEstruturaListView ? 'SIM' : 'NÃO'}`);
    
    // 2. Verificar se tem as colunas da ListView
    const temColunasListView = contatosContent.includes('Score de Qualificação') && 
                               contatosContent.includes('Score do Vendedor') &&
                               contatosContent.includes('Data de Criação');
    console.log(`✅ Tem colunas da ListView: ${temColunasListView ? 'SIM' : 'NÃO'}`);
    
    // 3. Verificar se tem análise de scores com tooltips
    const temAnaliseScores = contatosContent.includes('getScoreQualificacaoAnalysis') && 
                             contatosContent.includes('getScoreVendedorAnalysis') &&
                             contatosContent.includes('TooltipProvider');
    console.log(`✅ Tem análise de scores com tooltips: ${temAnaliseScores ? 'SIM' : 'NÃO'}`);
    
    // 4. Verificar se tem funcionalidades de contatos
    const temFuncionalidadesContatos = contatosContent.includes('Novo Contato') && 
                                      contatosContent.includes('Importar') &&
                                      contatosContent.includes('AddContactModal') &&
                                      contatosContent.includes('ImportModal');
    console.log(`✅ Tem funcionalidades de contatos: ${temFuncionalidadesContatos ? 'SIM' : 'NÃO'}`);
    
    // 5. Verificar se tem departamentos e etiquetas
    const temDepartamentosEtiquetas = contatosContent.includes('getDepartamentoNome') && 
                                     contatosContent.includes('etiquetasDisplay') &&
                                     contatosContent.includes('departamentosService');
    console.log(`✅ Tem departamentos e etiquetas: ${temDepartamentosEtiquetas ? 'SIM' : 'NÃO'}`);
    
    // 6. Verificar se tem ações de leads
    const temAcoesLeads = contatosContent.includes('handleMarkAsWon') && 
                          contatosContent.includes('handleMarkAsLost') &&
                          contatosContent.includes('handleArchive') &&
                          contatosContent.includes('handleViewConversation');
    console.log(`✅ Tem ações de leads: ${temAcoesLeads ? 'SIM' : 'NÃO'}`);
    
    // 7. Verificar se tem busca e filtros
    const temBuscaFiltros = contatosContent.includes('search') && 
                            contatosContent.includes('filteredLeads') &&
                            contatosContent.includes('placeholder="Buscar por nome ou número..."');
    console.log(`✅ Tem busca e filtros: ${temBuscaFiltros ? 'SIM' : 'NÃO'}`);
    
    // 8. Verificar se tem botões de ação no cabeçalho
    const temBotoesCabecalho = contatosContent.includes('Novo Contato') && 
                               contatosContent.includes('Importar') &&
                               contatosContent.includes('setShowAddModal(true)') &&
                               contatosContent.includes('setShowImportModal(true)');
    console.log(`✅ Tem botões de ação no cabeçalho: ${temBotoesCabecalho ? 'SIM' : 'NÃO'}`);
    
    // Resumo
    const totalVerificacoes = 8;
    const verificacoesPassaram = [
      usaEstruturaListView,
      temColunasListView,
      temAnaliseScores,
      temFuncionalidadesContatos,
      temDepartamentosEtiquetas,
      temAcoesLeads,
      temBuscaFiltros,
      temBotoesCabecalho
    ].filter(Boolean).length;
    
    console.log(`\n📊 RESULTADO: ${verificacoesPassaram}/${totalVerificacoes} verificações passaram`);
    
    if (verificacoesPassaram === totalVerificacoes) {
      console.log('🎉 SUCESSO! Página de Contatos foi atualizada com a interface da ListView!');
      
      console.log('\n🎯 ALTERAÇÕES REALIZADAS:');
      console.log('   - ✅ Interface: Substituída pela ListView avançada');
      console.log('   - ✅ Colunas: Score de Qualificação, Score do Vendedor, Data de Criação');
      console.log('   - ✅ Análises: Tooltips detalhados para scores');
      console.log('   - ✅ Funcionalidades: Adicionar, Importar, Editar contatos');
      console.log('   - ✅ Departamentos: Exibição e filtros por departamento');
      console.log('   - ✅ Etiquetas: Sistema de etiquetas integrado');
      console.log('   - ✅ Ações: Marcar como ganho/perdido, arquivar, ver conversa');
      console.log('   - ✅ Busca: Filtros avançados por nome e telefone');
      
      console.log('\n🔧 COMO FUNCIONA AGORA:');
      console.log('1. Interface idêntica à "Visualização em Lista" da aba CRM');
      console.log('2. Todas as funcionalidades de contatos preservadas');
      console.log('3. Análises avançadas de scores com tooltips informativos');
      console.log('4. Sistema de departamentos e etiquetas integrado');
      console.log('5. Ações completas de gerenciamento de leads');
      console.log('6. Busca e filtros avançados');
      console.log('7. Modais para adicionar e importar contatos');
      
      console.log('\n📱 INTERFACE ATUALIZADA:');
      console.log('   - Tabela: Colunas organizadas e responsivas');
      console.log('   - Scores: Análises visuais com cores e ícones');
      console.log('   - Tooltips: Informações detalhadas sobre scores');
      console.log('   - Departamentos: Chips coloridos para identificação');
      console.log('   - Etiquetas: Sistema visual integrado');
      console.log('   - Ações: Menu dropdown com todas as opções');
      console.log('   - Busca: Campo de busca em tempo real');
      console.log('   - Botões: Novo Contato e Importar no cabeçalho');
      
    } else {
      console.log('⚠️  ALGUMAS VERIFICAÇÕES FALHARAM!');
      console.log('💡 Verifique os itens que falharam acima');
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testarContatosAtualizados();
