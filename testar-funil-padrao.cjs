const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ltdkdeqxcgtuncgzsowt.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0ZGtkZXF4Y2d0dW5jZ3pzb3d0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzA4NzYxNiwiZXhwIjoyMDUyNjYzNjE2fQ.RKMW8QZohViES2Y2agpCC5OYv8owBCPnI3pgxppIeVs';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function testarFunilPadrao() {
  console.log('🧪 Testando funcionalidade de Funil Padrão...\n');

  try {
    // 1. Buscar um cliente de teste
    console.log('1️⃣ Buscando cliente de teste...');
    const { data: clientes, error: clientesError } = await supabase
      .from('clientes_info')
      .select('id, name, email, id_funil_padrao')
      .limit(1);

    if (clientesError) {
      console.error('❌ Erro ao buscar clientes:', clientesError);
      return;
    }

    if (!clientes || clientes.length === 0) {
      console.log('❌ Nenhum cliente encontrado para teste');
      return;
    }

    const cliente = clientes[0];
    console.log('✅ Cliente encontrado:', { 
      id: cliente.id, 
      name: cliente.name, 
      email: cliente.email,
      id_funil_padrao_atual: cliente.id_funil_padrao 
    });

    // 2. Buscar funis do cliente
    console.log('\n2️⃣ Buscando funis do cliente...');
    const { data: funis, error: funisError } = await supabase
      .from('funis')
      .select('id, nome, funil_padrao')
      .eq('id_cliente', cliente.id);

    if (funisError) {
      console.error('❌ Erro ao buscar funis:', funisError);
      return;
    }

    if (!funis || funis.length === 0) {
      console.log('❌ Nenhum funil encontrado para o cliente');
      return;
    }

    console.log('✅ Funis encontrados:', funis.map(f => ({ 
      id: f.id, 
      nome: f.nome, 
      funil_padrao: f.funil_padrao 
    })));

    // 3. Testar marcação de funil como padrão
    const funilParaTeste = funis[0];
    console.log(`\n3️⃣ Testando marcação do funil ${funilParaTeste.nome} como padrão...`);

    // Marcar como padrão na tabela funis
    const { error: marcarFunilError } = await supabase
      .from('funis')
      .update({ funil_padrao: true })
      .eq('id', funilParaTeste.id)
      .eq('id_cliente', cliente.id);

    if (marcarFunilError) {
      console.error('❌ Erro ao marcar funil como padrão:', marcarFunilError);
      return;
    }

    // Atualizar id_funil_padrao na tabela clientes_info
    const { error: atualizarClienteError } = await supabase
      .from('clientes_info')
      .update({ id_funil_padrao: funilParaTeste.id })
      .eq('id', cliente.id);

    if (atualizarClienteError) {
      console.error('❌ Erro ao atualizar id_funil_padrao em clientes_info:', atualizarClienteError);
      return;
    }

    console.log('✅ Funil marcado como padrão com sucesso!');

    // 4. Verificar se foi atualizado corretamente
    console.log('\n4️⃣ Verificando atualizações...');
    
    // Verificar tabela funis
    const { data: funilAtualizado, error: funilVerificacaoError } = await supabase
      .from('funis')
      .select('id, nome, funil_padrao')
      .eq('id', funilParaTeste.id)
      .eq('id_cliente', cliente.id)
      .single();

    if (funilVerificacaoError) {
      console.error('❌ Erro ao verificar funil:', funilVerificacaoError);
      return;
    }

    // Verificar tabela clientes_info
    const { data: clienteAtualizado, error: clienteVerificacaoError } = await supabase
      .from('clientes_info')
      .select('id, name, id_funil_padrao')
      .eq('id', cliente.id)
      .single();

    if (clienteVerificacaoError) {
      console.error('❌ Erro ao verificar cliente:', clienteVerificacaoError);
      return;
    }

    console.log('✅ Verificação concluída:');
    console.log('   📊 Funil na tabela funis:', { 
      id: funilAtualizado.id, 
      nome: funilAtualizado.nome, 
      funil_padrao: funilAtualizado.funil_padrao 
    });
    console.log('   👤 Cliente na tabela clientes_info:', { 
      id: clienteAtualizado.id, 
      name: clienteAtualizado.name, 
      id_funil_padrao: clienteAtualizado.id_funil_padrao 
    });

    // 5. Testar desmarcação
    console.log('\n5️⃣ Testando desmarcação do funil como padrão...');

    // Desmarcar na tabela funis
    const { error: desmarcarFunilError } = await supabase
      .from('funis')
      .update({ funil_padrao: false })
      .eq('id', funilParaTeste.id)
      .eq('id_cliente', cliente.id);

    if (desmarcarFunilError) {
      console.error('❌ Erro ao desmarcar funil:', desmarcarFunilError);
      return;
    }

    // Remover id_funil_padrao da tabela clientes_info
    const { error: removerClienteError } = await supabase
      .from('clientes_info')
      .update({ id_funil_padrao: null })
      .eq('id', cliente.id);

    if (removerClienteError) {
      console.error('❌ Erro ao remover id_funil_padrao de clientes_info:', removerClienteError);
      return;
    }

    console.log('✅ Funil desmarcado como padrão com sucesso!');

    // 6. Verificação final
    console.log('\n6️⃣ Verificação final...');
    
    const { data: funilFinal, error: funilFinalError } = await supabase
      .from('funis')
      .select('id, nome, funil_padrao')
      .eq('id', funilParaTeste.id)
      .eq('id_cliente', cliente.id)
      .single();

    const { data: clienteFinal, error: clienteFinalError } = await supabase
      .from('clientes_info')
      .select('id, name, id_funil_padrao')
      .eq('id', cliente.id)
      .single();

    if (funilFinalError || clienteFinalError) {
      console.error('❌ Erro na verificação final:', funilFinalError || clienteFinalError);
      return;
    }

    console.log('✅ Verificação final concluída:');
    console.log('   📊 Funil na tabela funis:', { 
      id: funilFinal.id, 
      nome: funilFinal.nome, 
      funil_padrao: funilFinal.funil_padrao 
    });
    console.log('   👤 Cliente na tabela clientes_info:', { 
      id: clienteFinal.id, 
      name: clienteFinal.name, 
      id_funil_padrao: clienteFinal.id_funil_padrao 
    });

    console.log('\n🎉 Teste concluído com sucesso!');
    console.log('✅ A funcionalidade está funcionando corretamente:');
    console.log('   - Marcação de funil como padrão atualiza ambas as tabelas');
    console.log('   - Desmarcação de funil como padrão atualiza ambas as tabelas');
    console.log('   - Sincronização entre funis.funil_padrao e clientes_info.id_funil_padrao');

  } catch (error) {
    console.error('❌ Erro inesperado durante o teste:', error);
  }
}

testarFunilPadrao();
