const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const SUPABASE_URL = 'https://ltdkdeqxcgtuncgzsowt.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0ZGtkZXF4Y2d0dW5jZ3pzb3d0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzA4NzYxNiwiZXhwIjoyMDUyNjYzNjE2fQ.RKMW8QZohViES2Y2agpCC5OYv8owBCPnI3pgxppIeVs';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function atualizarClientePlanoPlus() {
  console.log('🔄 Atualizando cliente para plano plus...\n');

  try {
    // 1. Primeiro, vamos definir valores padrão para todos os clientes
    console.log('1️⃣ Definindo valores padrão para todos os clientes...');
    const { data: updateDefault, error: updateDefaultError } = await supabase
      .from('clientes_info')
      .update({ plano_plus: false })
      .is('plano_plus', null);

    if (updateDefaultError) {
      console.error('❌ Erro ao definir valores padrão:', updateDefaultError);
    } else {
      console.log('✅ Valores padrão definidos para clientes com plano_plus = null');
    }

    // 2. Agora vamos atualizar um cliente específico para plano plus
    const emailClientePlus = 'diego.almeida_7@hotmail.com'; // Cliente que será atualizado
    
    console.log(`\n2️⃣ Atualizando cliente ${emailClientePlus} para plano plus...`);
    const { data: updatePlus, error: updatePlusError } = await supabase
      .from('clientes_info')
      .update({ plano_plus: true })
      .eq('email', emailClientePlus)
      .select();

    if (updatePlusError) {
      console.error('❌ Erro ao atualizar para plano plus:', updatePlusError);
    } else {
      console.log('✅ Cliente atualizado para plano plus com sucesso!');
      if (updatePlus && updatePlus.length > 0) {
        console.log('📋 Dados do cliente atualizado:', updatePlus[0]);
      }
    }

    // 3. Verificar o resultado
    console.log('\n3️⃣ Verificando resultado da atualização...');
    const { data: clientes, error: clientesError } = await supabase
      .from('clientes_info')
      .select('id, email, plano_plus')
      .limit(5);

    if (clientesError) {
      console.error('❌ Erro ao verificar clientes:', clientesError);
    } else {
      console.log('📋 Status dos clientes após atualização:');
      clientes.forEach(cliente => {
        const status = cliente.plano_plus ? '🟢 COM plano plus' : '🔴 SEM plano plus';
        console.log(`   - ${cliente.email}: ${status}`);
      });
    }

    // 4. Resumo final
    console.log('\n📊 RESUMO DA ATUALIZAÇÃO:');
    console.log('✅ Valores padrão definidos para clientes com plano_plus = null');
    console.log(`✅ Cliente ${emailClientePlus} atualizado para plano plus`);
    console.log('✅ Sistema pronto para teste');

    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('1. Faça logout e login novamente com o usuário atualizado');
    console.log('2. Verifique se o DashboardPremium aparece');
    console.log('3. Teste se a aba de relatórios aparece no sidebar');
    console.log('4. Teste se as rotas premium estão funcionando');

    console.log('\n🔧 COMANDOS SQL EXECUTADOS:');
    console.log('-- Definir valores padrão:');
    console.log('UPDATE clientes_info SET plano_plus = FALSE WHERE plano_plus IS NULL;');
    console.log('');
    console.log('-- Atualizar cliente específico:');
    console.log(`UPDATE clientes_info SET plano_plus = TRUE WHERE email = '${emailClientePlus}';`);

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

// Executar a atualização
atualizarClientePlanoPlus();
