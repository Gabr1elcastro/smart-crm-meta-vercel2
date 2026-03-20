const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'your-service-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testarQuadroLeads() {
  console.log('🔍 Testando melhorias no Quadro de Leads...\n');

  try {
    // 1. Verificar se a coluna score_final_qualificacao existe na tabela leads
    console.log('1️⃣ Verificando estrutura da tabela leads...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'leads')
      .eq('table_schema', 'public')
      .in('column_name', ['score_final_qualificacao', 'probabilidade_final_fechamento']);

    if (columnsError) {
      console.error('❌ Erro ao verificar colunas:', columnsError);
      return;
    }

    console.log('✅ Colunas encontradas:');
    columns.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}`);
    });

    // 2. Verificar alguns leads com scores de qualificação
    console.log('\n2️⃣ Verificando leads com scores de qualificação...');
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, nome, score_final_qualificacao, probabilidade_final_fechamento')
      .not('score_final_qualificacao', 'is', null)
      .limit(5);

    if (leadsError) {
      console.error('❌ Erro ao buscar leads:', leadsError);
      return;
    }

    if (leads && leads.length > 0) {
      console.log('✅ Leads com scores encontrados:');
      leads.forEach(lead => {
        console.log(`   - ${lead.nome}: Score ${lead.score_final_qualificacao}/10, Probabilidade ${lead.probabilidade_final_fechamento}%`);
      });
    } else {
      console.log('⚠️  Nenhum lead com score de qualificação encontrado');
    }

    // 3. Verificar estrutura da tabela estagios
    console.log('\n3️⃣ Verificando estrutura da tabela estagios...');
    const { data: estagios, error: estagiosError } = await supabase
      .from('estagios')
      .select('*')
      .limit(3);

    if (estagiosError) {
      console.error('❌ Erro ao buscar estágios:', estagiosError);
      return;
    }

    if (estagios && estagios.length > 0) {
      console.log('✅ Estágios encontrados:');
      estagios.forEach(estagio => {
        console.log(`   - ${estagio.nome} (${estagio.cor})`);
      });
    } else {
      console.log('⚠️  Nenhum estágio encontrado');
    }

    // 4. Verificar se há leads distribuídos nos estágios
    console.log('\n4️⃣ Verificando distribuição de leads nos estágios...');
    const { data: leadsPorEstagio, error: leadsEstagioError } = await supabase
      .from('leads')
      .select('id, nome, stage')
      .not('stage', 'is', null)
      .limit(10);

    if (leadsEstagioError) {
      console.error('❌ Erro ao buscar leads por estágio:', leadsEstagioError);
      return;
    }

    if (leadsPorEstagio && leadsPorEstagio.length > 0) {
      console.log('✅ Leads distribuídos nos estágios:');
      leadsPorEstagio.forEach(lead => {
        console.log(`   - ${lead.nome} → Estágio: ${lead.stage}`);
      });
    } else {
      console.log('⚠️  Nenhum lead distribuído nos estágios');
    }

    console.log('\n🎯 Resumo das melhorias implementadas:');
    console.log('   ✅ Cards com melhor alinhamento e espaçamento');
    console.log('   ✅ Probabilidade substituída por Score de Qualificação');
    console.log('   ✅ Layout mais limpo e organizado');
    console.log('   ✅ Espaçamento consistente entre colunas');
    console.log('   ✅ Cards com bordas e padding melhorados');

    console.log('\n📱 Para testar visualmente:');
    console.log('   1. Acesse a aba CRM (Quadro de Leads)');
    console.log('   2. Verifique se os cards estão bem alinhados');
    console.log('   3. Confirme se aparece "Score: X.X/10" em vez de "X% prob."');
    console.log('   4. Observe o espaçamento entre as colunas');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testarQuadroLeads();
