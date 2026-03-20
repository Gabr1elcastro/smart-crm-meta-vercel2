const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const SUPABASE_URL = 'https://ltdkdeqxcgtuncgzsowt.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0ZGtkZXF4Y2d0dW5jZ3pzb3d0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzA4NzYxNiwiZXhwIjoyMDUyNjYzNjE2fQ.RKMW8QZohViES2Y2agpCC5OYv8owBCPnI3pgxppIeVs';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function debugDashboardRouter() {
  console.log('🔍 Debug do DashboardRouter - Investigando problema...\n');

  try {
    // 1. Verificar estrutura da tabela clientes_info
    console.log('1️⃣ Verificando estrutura da tabela clientes_info...');
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
      console.log('📋 Colunas disponíveis:', columns);
      
      const hasPlanoPlus = columns.includes('plano_plus');
      if (hasPlanoPlus) {
        console.log('✅ Campo plano_plus encontrado');
      } else {
        console.log('❌ Campo plano_plus NÃO encontrado');
        console.log('💡 Precisa adicionar o campo plano_plus na tabela');
        return;
      }
    }

    // 2. Listar clientes com seus planos
    console.log('\n2️⃣ Listando clientes e seus planos...');
    const { data: clientes, error: clientesError } = await supabase
      .from('clientes_info')
      .select('id, email, plano_plus, user_id_auth')
      .limit(10);

    if (clientesError) {
      console.error('❌ Erro ao buscar clientes:', clientesError);
      return;
    }

    console.log('📋 Clientes encontrados:');
    clientes.forEach(cliente => {
      const status = cliente.plano_plus ? '🟢 COM plano plus' : '🔴 SEM plano plus';
      console.log(`   - ID: ${cliente.id}, Email: ${cliente.email}, Plano: ${status}`);
      if (cliente.user_id_auth) {
        console.log(`     User ID Auth: ${cliente.user_id_auth}`);
      }
    });

    // 3. Verificar se há clientes com plano plus
    const clientesComPlanoPlus = clientes.filter(c => c.plano_plus);
    const clientesSemPlanoPlus = clientes.filter(c => !c.plano_plus);

    console.log(`\n📊 Resumo:`);
    console.log(`   - Total de clientes: ${clientes.length}`);
    console.log(`   - Com plano plus: ${clientesComPlanoPlus.length}`);
    console.log(`   - Sem plano plus: ${clientesSemPlanoPlus.length}`);

    if (clientesComPlanoPlus.length === 0) {
      console.log('\n⚠️  NENHUM CLIENTE TEM PLANO PLUS!');
      console.log('💡 Para testar, atualize um cliente para plano plus:');
      if (clientes.length > 0) {
        const clienteTeste = clientes[0];
        console.log(`   UPDATE clientes_info SET plano_plus = TRUE WHERE id = ${clienteTeste.id};`);
      }
    }

    // 4. Simular a lógica do usePlanoPlus
    console.log('\n4️⃣ Simulando lógica do usePlanoPlus...');
    if (clientes.length > 0) {
      const clienteTeste = clientes[0];
      console.log(`🧪 Testando com cliente: ${clienteTeste.email}`);
      
      // Simular a busca por email
      const { data: clientePorEmail, error: buscaError } = await supabase
        .from('clientes_info')
        .select('*')
        .eq('email', clienteTeste.email)
        .order('id', { ascending: true })
        .limit(1);

      if (buscaError) {
        console.error('❌ Erro na busca por email:', buscaError);
      } else {
        console.log('✅ Busca por email funcionou');
        if (clientePorEmail && clientePorEmail.length > 0) {
          const cliente = clientePorEmail[0];
          console.log(`   - Cliente encontrado: ${cliente.email}`);
          console.log(`   - plano_plus: ${cliente.plano_plus}`);
          console.log(`   - Resultado esperado: ${cliente.plano_plus ? 'DashboardPremium' : 'Dashboard Básico'}`);
        }
      }
    }

    // 5. Verificar se o campo plano_plus tem valores corretos
    console.log('\n5️⃣ Verificando valores do campo plano_plus...');
    const { data: valoresPlano, error: valoresError } = await supabase
      .from('clientes_info')
      .select('plano_plus')
      .not('plano_plus', 'is', null);

    if (valoresError) {
      console.error('❌ Erro ao verificar valores:', valoresError);
    } else {
      const valoresUnicos = [...new Set(valoresPlano.map(v => v.plano_plus))];
      console.log('📋 Valores únicos encontrados:', valoresUnicos);
      
      if (valoresUnicos.length === 0) {
        console.log('⚠️  Campo plano_plus está vazio para todos os clientes');
        console.log('💡 Execute: UPDATE clientes_info SET plano_plus = FALSE WHERE plano_plus IS NULL;');
      }
    }

    // 6. Resumo e próximos passos
    console.log('\n📊 RESUMO DO DEBUG:');
    console.log('✅ Estrutura da tabela verificada');
    console.log('✅ Clientes listados');
    console.log('✅ Lógica do usePlanoPlus simulada');
    console.log('✅ Valores do campo plano_plus verificados');

    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('1. Verificar se o campo plano_plus existe na tabela');
    console.log('2. Atualizar pelo menos um cliente para plano plus = TRUE');
    console.log('3. Testar no navegador com usuário que tem plano plus');
    console.log('4. Verificar console do navegador para erros');

    console.log('\n🔧 COMANDOS SQL SUGERIDOS:');
    console.log('-- Adicionar campo se não existir:');
    console.log('ALTER TABLE clientes_info ADD COLUMN IF NOT EXISTS plano_plus BOOLEAN DEFAULT FALSE;');
    console.log('');
    console.log('-- Atualizar cliente específico para plano plus:');
    if (clientes.length > 0) {
      console.log(`UPDATE clientes_info SET plano_plus = TRUE WHERE email = '${clientes[0].email}';`);
    }
    console.log('');
    console.log('-- Verificar estrutura atual:');
    console.log('SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = \'clientes_info\';');

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

// Executar o debug
debugDashboardRouter();
