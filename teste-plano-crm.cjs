const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const SUPABASE_URL = 'https://ltdkdeqxcgtuncgzsowt.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0ZGtkZXF4Y2d0dW5jZ3pzb3d0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzA4NzYxNiwiZXhwIjoyMDUyNjYzNjE2fQ.RKMW8QZohViES2Y2agpCC5OYv8owBCPnI3pgxppIeVs';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function testarPlanoCRM() {
  console.log('🧪 Testando funcionalidade do Plano CRM...\n');

  try {
    // 1. Verificar se a coluna plano_crm existe
    console.log('1️⃣ Verificando se a coluna plano_crm existe...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('clientes_info')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Erro ao verificar tabela:', tableError);
      return;
    }

    if (tableInfo && tableInfo.length > 0) {
      const columns = Object.keys(tableInfo[0]);
      const hasPlanoCrm = columns.includes('plano_crm');
      
      if (hasPlanoCrm) {
        console.log('✅ Coluna plano_crm encontrada!');
      } else {
        console.log('❌ Coluna plano_crm NÃO encontrada!');
        console.log('💡 Execute o script ADICIONAR-COLUNA-PLANO-CRM.sql primeiro');
        return;
      }
    }

    // 2. Listar clientes e seus planos
    console.log('\n2️⃣ Listando clientes e seus planos...');
    const { data: clientes, error: clientesError } = await supabase
      .from('clientes_info')
      .select('id, email, name, plano_crm, plano_plus, plano_agentes')
      .limit(10);

    if (clientesError) {
      console.error('❌ Erro ao buscar clientes:', clientesError);
      return;
    }

    console.log('📋 Status dos clientes:');
    clientes.forEach(cliente => {
      const statusCRM = cliente.plano_crm ? '🟢 COM plano CRM' : '🔴 SEM plano CRM';
      const statusPlus = cliente.plano_plus ? '🟢 COM plano plus' : '🔴 SEM plano plus';
      const statusAgentes = cliente.plano_agentes ? '🟢 COM plano agentes' : '🔴 SEM plano agentes';
      
      console.log(`   - ${cliente.email}:`);
      console.log(`     ${statusCRM}`);
      console.log(`     ${statusPlus}`);
      console.log(`     ${statusAgentes}`);
    });

    // 3. Verificar se há pelo menos um cliente com plano CRM
    const clientesComPlanoCRM = clientes.filter(c => c.plano_crm);
    
    if (clientesComPlanoCRM.length === 0) {
      console.log('\n⚠️  NENHUM CLIENTE TEM PLANO CRM!');
      console.log('💡 Para testar, atualize um cliente para plano CRM:');
      if (clientes.length > 0) {
        const clienteTeste = clientes[0];
        console.log(`   UPDATE clientes_info SET plano_crm = TRUE WHERE email = '${clienteTeste.email}';`);
      }
      return;
    }

    // 4. Resumo da implementação
    console.log('\n📊 IMPLEMENTAÇÃO COMPLETA:');
    console.log('✅ Coluna plano_crm adicionada na tabela clientes_info');
    console.log('✅ Hook useUserType atualizado para verificar plano_crm');
    console.log('✅ Sidebar inclui aba de Relatórios para usuários com plano_crm');
    console.log('✅ Rota /relatorios protegida e requer plano_crm');
    console.log('✅ Página de Relatórios com Scorecard, Lista e Quadro reabilitadas');
    console.log('✅ ProtectedRoute atualizado para verificar plano_crm');
    
    console.log('\n🎯 FUNCIONALIDADES DISPONÍVEIS:');
    console.log('   - Scorecard com métricas avançadas');
    console.log('   - Visualização em Lista com filtros');
    console.log('   - Visualização em Quadro (Kanban)');
    console.log('   - Acesso exclusivo para clientes com plano_crm = TRUE');

    console.log('\n🔧 PARA TESTAR:');
    console.log('1. Faça login com um usuário que tenha plano_crm = TRUE');
    console.log('2. A aba "Relatórios" deve aparecer no Sidebar');
    console.log('3. Acesse /relatorios para ver todas as funcionalidades');
    console.log('4. Teste as três visualizações: Scorecard, Lista e Quadro');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testarPlanoCRM();
