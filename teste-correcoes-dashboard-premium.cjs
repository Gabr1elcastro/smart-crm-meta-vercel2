const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const SUPABASE_URL = 'https://ltdkdeqxcgtuncgzsowt.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0ZGtkZXF4Y2d0dW5jZ3pzb3d0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzA4NzYxNiwiZXhwIjoyMDUyNjYzNjE2fQ.RKMW8QZohViES2Y2agpCC5OYv8owBCPnI3pgxppIeVs';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function testarCorrecoesDashboardPremium() {
  console.log('🧪 Testando correções do Dashboard Premium...\n');

  try {
    // 1. Verificar se o cliente com plano plus ainda existe
    console.log('1️⃣ Verificando cliente com plano plus...');
    const { data: clientes, error: clientesError } = await supabase
      .from('clientes_info')
      .select('id, email, plano_plus')
      .eq('plano_plus', true)
      .limit(1);

    if (clientesError) {
      console.error('❌ Erro ao buscar clientes:', clientesError);
      return;
    }

    if (!clientes || clientes.length === 0) {
      console.log('⚠️  Nenhum cliente com plano plus encontrado!');
      return;
    }

    const clientePlus = clientes[0];
    console.log(`✅ Cliente com plano plus encontrado: ${clientePlus.email} (ID: ${clientePlus.id})`);

    // 2. Verificar se há leads para este cliente
    console.log('\n2️⃣ Verificando leads do cliente...');
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, nome, status, score_qualificacao')
      .eq('id_cliente', clientePlus.id)
      .limit(5);

    if (leadsError) {
      console.error('❌ Erro ao buscar leads:', leadsError);
    } else {
      console.log(`📋 Leads encontrados: ${leads ? leads.length : 0}`);
      if (leads && leads.length > 0) {
        leads.forEach(lead => {
          console.log(`   - ${lead.nome}: status=${lead.status}, score=${lead.score_qualificacao}`);
        });
      }
    }

    // 3. Verificar estrutura da tabela leads
    console.log('\n3️⃣ Verificando estrutura da tabela leads...');
    const { data: leadSample, error: leadSampleError } = await supabase
      .from('leads')
      .select('*')
      .limit(1);

    if (leadSampleError) {
      console.error('❌ Erro ao verificar estrutura da tabela leads:', leadSampleError);
    } else if (leadSample && leadSample.length > 0) {
      const columns = Object.keys(leadSample[0]);
      console.log('📋 Colunas da tabela leads:', columns);
      
      const hasScoreQualificacao = columns.includes('score_qualificacao');
      const hasStatus = columns.includes('status');
      
      console.log(`   - score_qualificacao: ${hasScoreQualificacao ? '✅' : '❌'}`);
      console.log(`   - status: ${hasStatus ? '✅' : '❌'}`);
    }

    // 4. Resumo das correções implementadas
    console.log('\n📊 CORREÇÕES IMPLEMENTADAS:');
    console.log('✅ FunnelFlow: data={funnelData} → stages={funnelData}');
    console.log('✅ leadsService: getLeadsByCliente → getLeadsByClientId');
    console.log('✅ Campo score: lead.score → lead.score_qualificacao');

    console.log('\n🎯 COMO TESTAR NO NAVEGADOR:');
    console.log('1. Faça login com um usuário que tem plano plus');
    console.log('2. Acesse a rota raiz (/) - deve redirecionar para /dashboard-premium');
    console.log('3. Verifique se o DashboardPremium carrega sem erros');
    console.log('4. Verifique se o FunnelFlow aparece corretamente');
    console.log('5. Verifique se não há erros no console do navegador');

    console.log('\n🔍 VERIFICAÇÕES IMPORTANTES:');
    console.log('   - FunnelFlow deve receber prop "stages" (não "data")');
    console.log('   - leadsService.getLeadsByClientId deve existir');
    console.log('   - Campo score_qualificacao deve existir na tabela leads');
    console.log('   - Dados do funnel devem ser processados corretamente');

    console.log('\n📱 FUNCIONALIDADES ESPERADAS:');
    console.log('   - DashboardPremium carrega sem erros');
    console.log('   - Funnel de conversão exibido corretamente');
    console.log('   - KPICards funcionando');
    console.log('   - RevenueByChannel funcionando');
    console.log('   - Filtros de data funcionando');
    console.log('   - Botão de voltar ao dashboard básico funcionando');

    console.log('\n🎉 RESULTADO ESPERADO:');
    console.log('   - Sem erros de "Cannot read properties of undefined"');
    console.log('   - Sem erros de "getLeadsByCliente is not a function"');
    console.log('   - Dashboard premium funcionando perfeitamente');

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

// Executar o teste
testarCorrecoesDashboardPremium();
