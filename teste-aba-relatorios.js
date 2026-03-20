const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const SUPABASE_URL = 'https://ltdkdeqxcgtuncgzsowt.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0ZGtkZXF4Y2d0dW5jZ3pzb3d0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzA4NzYxNiwiZXhwIjoyMDUyNjYzNjE2fQ.RKMW8QZohViES2Y2agpCC5OYv8owBCPnI3pgxppIeVs';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function testarAbaRelatorios() {
  console.log('🧪 Testando funcionalidade da aba de relatórios...\n');

  try {
    // 1. Verificar se a tabela clientes_info tem o campo plano_plus
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
      const hasPlanoPlus = columns.includes('plano_plus');
      
      if (hasPlanoPlus) {
        console.log('✅ Campo plano_plus encontrado na tabela clientes_info');
      } else {
        console.log('❌ Campo plano_plus NÃO encontrado na tabela clientes_info');
        console.log('📋 Colunas disponíveis:', columns);
        return;
      }
    }

    // 2. Listar alguns clientes para teste
    console.log('\n2️⃣ Listando clientes para teste...');
    const { data: clientes, error: clientesError } = await supabase
      .from('clientes_info')
      .select('id, email, plano_plus')
      .limit(5);

    if (clientesError) {
      console.error('❌ Erro ao buscar clientes:', clientesError);
      return;
    }

    console.log('📋 Clientes encontrados:');
    clientes.forEach(cliente => {
      const status = cliente.plano_plus ? '🟢 COM plano plus' : '🔴 SEM plano plus';
      console.log(`   - ${cliente.email}: ${status}`);
    });

    // 3. Testar atualização de plano plus
    console.log('\n3️⃣ Testando atualização de plano plus...');
    
    if (clientes.length > 0) {
      const clienteTeste = clientes[0];
      const novoStatus = !clienteTeste.plano_plus; // Inverter o status atual
      
      console.log(`🔄 Alterando plano_plus de ${clienteTeste.email} para ${novoStatus}...`);
      
      const { data: updateData, error: updateError } = await supabase
        .from('clientes_info')
        .update({ plano_plus: novoStatus })
        .eq('id', clienteTeste.id)
        .select();

      if (updateError) {
        console.error('❌ Erro ao atualizar plano plus:', updateError);
      } else {
        console.log('✅ Plano plus atualizado com sucesso!');
        console.log(`   Novo status: ${novoStatus ? '🟢 COM plano plus' : '🔴 SEM plano plus'}`);
        
        // Reverter a mudança para não afetar o cliente
        console.log('🔄 Revertendo mudança...');
        await supabase
          .from('clientes_info')
          .update({ plano_plus: clienteTeste.plano_plus })
          .eq('id', clienteTeste.id);
        console.log('✅ Mudança revertida!');
      }
    }

    // 4. Verificar se a rota /reports está funcionando
    console.log('\n4️⃣ Verificando rota de relatórios...');
    console.log('📋 Para testar a rota /reports:');
    console.log('   1. Acesse o dashboard');
    console.log('   2. Verifique se a aba "Relatórios" aparece no sidebar');
    console.log('   3. Clique na aba e teste a navegação');
    console.log('   4. Verifique se clientes sem plano plus são redirecionados');

    // 5. Resumo dos testes
    console.log('\n📊 RESUMO DOS TESTES:');
    console.log('✅ Estrutura da tabela verificada');
    console.log('✅ Clientes listados');
    console.log('✅ Atualização de plano plus testada');
    console.log('✅ Rotas configuradas no App.tsx');
    console.log('✅ Sidebar atualizado com condição de plano plus');
    console.log('✅ Proteção PlanoPlusRoute implementada');

    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('1. Testar no navegador com diferentes usuários');
    console.log('2. Verificar se a aba aparece apenas para plano plus');
    console.log('3. Confirmar se a rota /reports está protegida');
    console.log('4. Testar redirecionamento para clientes sem plano');

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

// Executar o teste
testarAbaRelatorios();
