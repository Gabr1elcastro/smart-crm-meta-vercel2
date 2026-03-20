// Script de teste para verificar a implementação das Conversas Instagram
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase (substitua pelas suas credenciais)
const supabaseUrl = 'SUA_SUPABASE_URL';
const supabaseKey = 'SUA_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testarConversasInstagram() {
  console.log('🧪 Testando implementação das Conversas Instagram...\n');

  try {
    // 1. Verificar se a coluna int_instagram existe
    console.log('1. Verificando coluna int_instagram...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'clientes_info')
      .eq('column_name', 'int_instagram');

    if (columnsError) {
      console.error('❌ Erro ao verificar coluna:', columnsError);
    } else if (columns.length > 0) {
      console.log('✅ Coluna int_instagram encontrada');
    } else {
      console.log('❌ Coluna int_instagram não encontrada - execute o script SQL primeiro');
      return;
    }

    // 2. Verificar se a tabela agente_conversacional_instagram existe
    console.log('\n2. Verificando tabela agente_conversacional_instagram...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'agente_conversacional_instagram');

    if (tablesError) {
      console.error('❌ Erro ao verificar tabela:', tablesError);
    } else if (tables.length > 0) {
      console.log('✅ Tabela agente_conversacional_instagram encontrada');
    } else {
      console.log('❌ Tabela agente_conversacional_instagram não encontrada');
      return;
    }

    // 3. Verificar se a tabela leads_instagram existe
    console.log('\n3. Verificando tabela leads_instagram...');
    const { data: leadsTables, error: leadsTablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'leads_instagram');

    if (leadsTablesError) {
      console.error('❌ Erro ao verificar tabela leads_instagram:', leadsTablesError);
    } else if (leadsTables.length > 0) {
      console.log('✅ Tabela leads_instagram encontrada');
    } else {
      console.log('❌ Tabela leads_instagram não encontrada');
      return;
    }

    // 4. Testar consulta de mensagens Instagram
    console.log('\n4. Testando consulta de mensagens Instagram...');
    const { data: messages, error: messagesError } = await supabase
      .from('agente_conversacional_instagram')
      .select('*')
      .limit(5);

    if (messagesError) {
      console.error('❌ Erro ao consultar mensagens:', messagesError);
    } else {
      console.log(`✅ Consulta de mensagens funcionando - ${messages.length} mensagens encontradas`);
      if (messages.length > 0) {
        console.log('📝 Exemplo de mensagem:', messages[0]);
      }
    }

    // 5. Testar consulta de leads Instagram
    console.log('\n5. Testando consulta de leads Instagram...');
    const { data: leads, error: leadsError } = await supabase
      .from('leads_instagram')
      .select('*')
      .limit(5);

    if (leadsError) {
      console.error('❌ Erro ao consultar leads:', leadsError);
    } else {
      console.log(`✅ Consulta de leads funcionando - ${leads.length} leads encontrados`);
      if (leads.length > 0) {
        console.log('👤 Exemplo de lead:', leads[0]);
      }
    }

    // 6. Testar verificação de permissão Instagram
    console.log('\n6. Testando verificação de permissão Instagram...');
    const { data: clientes, error: clientesError } = await supabase
      .from('clientes_info')
      .select('id, int_instagram')
      .limit(5);

    if (clientesError) {
      console.error('❌ Erro ao consultar clientes:', clientesError);
    } else {
      console.log(`✅ Consulta de clientes funcionando - ${clientes.length} clientes encontrados`);
      const clientesComInstagram = clientes.filter(c => c.int_instagram === true);
      console.log(`📱 Clientes com acesso ao Instagram: ${clientesComInstagram.length}`);
    }

    console.log('\n🎉 Teste concluído com sucesso!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Execute o script ADICIONAR-COLUNA-INT-INSTAGRAM.sql no Supabase');
    console.log('2. Configure int_instagram = TRUE para os clientes que devem ter acesso');
    console.log('3. Acesse /conversations-instagram na aplicação');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testarConversasInstagram();
