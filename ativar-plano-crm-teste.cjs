const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const SUPABASE_URL = 'https://ltdkdeqxcgtuncgzsowt.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0ZGtkZXF4Y2d0dW5jZ3pzb3d0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzA4NzYxNiwiZXhwIjoyMDUyNjYzNjE2fQ.RKMW8QZohViES2Y2agpCC5OYv8owBCPnI3pgxppIeVs';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function ativarPlanoCRMTeste() {
  console.log('🔄 Ativando plano CRM para cliente de teste...\n');

  try {
    // 1. Listar clientes disponíveis
    console.log('1️⃣ Listando clientes disponíveis...');
    const { data: clientes, error: clientesError } = await supabase
      .from('clientes_info')
      .select('id, email, name, plano_crm')
      .limit(5);

    if (clientesError) {
      console.error('❌ Erro ao buscar clientes:', clientesError);
      return;
    }

    console.log('📋 Clientes encontrados:');
    clientes.forEach(cliente => {
      const status = cliente.plano_crm ? '🟢 COM plano CRM' : '🔴 SEM plano CRM';
      console.log(`   - ${cliente.email}: ${status}`);
    });

    // 2. Ativar plano CRM para o primeiro cliente
    const clienteTeste = clientes[0];
    console.log(`\n2️⃣ Ativando plano CRM para ${clienteTeste.email}...`);
    
    const { data: updateData, error: updateError } = await supabase
      .from('clientes_info')
      .update({ plano_crm: true })
      .eq('email', clienteTeste.email)
      .select();

    if (updateError) {
      console.error('❌ Erro ao atualizar cliente:', updateError);
      return;
    }

    console.log('✅ Plano CRM ativado com sucesso!');
    console.log('📋 Dados do cliente atualizado:', updateData[0]);

    // 3. Verificar se a atualização foi bem-sucedida
    console.log('\n3️⃣ Verificando atualização...');
    const { data: clienteVerificado, error: verificarError } = await supabase
      .from('clientes_info')
      .select('id, email, name, plano_crm')
      .eq('email', clienteTeste.email)
      .single();

    if (verificarError) {
      console.error('❌ Erro ao verificar cliente:', verificarError);
      return;
    }

    if (clienteVerificado.plano_crm) {
      console.log('✅ Verificação confirmada: Cliente agora tem plano CRM!');
      console.log('\n🎯 PRÓXIMOS PASSOS:');
      console.log('1. Faça login com este usuário no sistema');
      console.log('2. A aba "Relatórios" deve aparecer no Sidebar');
      console.log('3. Acesse /relatorios para testar as funcionalidades');
      console.log('4. Teste as três visualizações: Scorecard, Lista e Quadro');
    } else {
      console.log('❌ Erro: Cliente ainda não tem plano CRM ativo');
    }

  } catch (error) {
    console.error('❌ Erro durante a ativação:', error);
  }
}

// Executar a ativação
ativarPlanoCRMTeste();
