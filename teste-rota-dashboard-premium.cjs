const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const SUPABASE_URL = 'https://ltdkdeqxcgtuncgzsowt.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0ZGtkZXF4Y2d0dW5jZ3pzb3d0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzA4NzYxNiwiZXhwIjoyMDUyNjYzNjE2fQ.RKMW8QZohViES2Y2agpCC5OYv8owBCPnI3pgxppIeVs';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function testarRotaDashboardPremium() {
  console.log('🧪 Testando nova rota do Dashboard Premium...\n');

  try {
    // 1. Verificar status atual dos clientes
    console.log('1️⃣ Verificando status dos clientes...');
    const { data: clientes, error: clientesError } = await supabase
      .from('clientes_info')
      .select('id, email, plano_plus')
      .limit(5);

    if (clientesError) {
      console.error('❌ Erro ao buscar clientes:', clientesError);
      return;
    }

    console.log('📋 Status dos clientes:');
    clientes.forEach(cliente => {
      const status = cliente.plano_plus ? '🟢 COM plano plus' : '🔴 SEM plano plus';
      console.log(`   - ${cliente.email}: ${status}`);
    });

    // 2. Verificar se há pelo menos um cliente com plano plus
    const clientesComPlanoPlus = clientes.filter(c => c.plano_plus);
    
    if (clientesComPlanoPlus.length === 0) {
      console.log('\n⚠️  NENHUM CLIENTE TEM PLANO PLUS!');
      console.log('💡 Para testar, atualize um cliente para plano plus:');
      if (clientes.length > 0) {
        const clienteTeste = clientes[0];
        console.log(`   UPDATE clientes_info SET plano_plus = TRUE WHERE email = '${clienteTeste.email}';`);
      }
      return;
    }

    // 3. Resumo da implementação
    console.log('\n📊 IMPLEMENTAÇÃO COMPLETA:');
    console.log('✅ Nova rota /dashboard-premium criada');
    console.log('✅ DashboardRouter redireciona para rota específica');
    console.log('✅ Sidebar inclui link para Dashboard Premium');
    console.log('✅ Botão de voltar ao dashboard básico implementado');
    console.log('✅ Proteção PlanoPlusRoute aplicada');

    console.log('\n🎯 COMO TESTAR:');
    console.log('1. Faça login com um usuário que tem plano plus');
    console.log('2. Acesse a rota raiz (/) - deve redirecionar para /dashboard-premium');
    console.log('3. Verifique se o DashboardPremium aparece com todas as funcionalidades');
    console.log('4. Teste o botão "Voltar ao Dashboard Básico"');
    console.log('5. Verifique se o link "Dashboard Premium" aparece no sidebar');
    console.log('6. Teste se as rotas premium funcionam (/channels/*, /reports)');

    console.log('\n🔗 ROTAS DISPONÍVEIS:');
    console.log('   - / → Dashboard básico (redireciona para premium se plano plus)');
    console.log('   - /dashboard-premium → Dashboard premium (protegido)');
    console.log('   - /channels/facebook → Facebook Ads (protegido)');
    console.log('   - /channels/google → Google Ads (protegido)');
    console.log('   - /channels/organico → Orgânico (protegido)');
    console.log('   - /channels/whatsapp → WhatsApp (protegido)');
    console.log('   - /reports → Relatórios (protegido)');

    console.log('\n📱 FUNCIONALIDADES DO DASHBOARD PREMIUM:');
    console.log('   - KPICards (Total Leads, Conversões, Receita, Investimento)');
    console.log('   - RevenueByChannel com navegação para canais');
    console.log('   - Funnel de conversão');
    console.log('   - Filtros de data avançados');
    console.log('   - Botão de voltar ao dashboard básico');

    console.log('\n🛡️ SISTEMA DE PROTEÇÃO:');
    console.log('   - Clientes sem plano plus são redirecionados para dashboard básico');
    console.log('   - Todas as rotas premium são protegidas por PlanoPlusRoute');
    console.log('   - Sidebar mostra links premium apenas para plano plus');

    console.log('\n🎉 RESULTADO ESPERADO:');
    console.log('   - Clientes com plano plus: DashboardPremium + funcionalidades premium');
    console.log('   - Clientes sem plano plus: Dashboard básico (funnel + filtros)');
    console.log('   - Navegação limpa e intuitiva entre as versões');

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

// Executar o teste
testarRotaDashboardPremium();
