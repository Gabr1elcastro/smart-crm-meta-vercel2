// Script para investigar o problema do cliente ID 6
// email: bbf.materiais@gmail.com

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://ltdkdeqxcgtuncgzsowt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0ZGtkZXF4Y2d0dW5jZ3pzb3d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI5NzAsImV4cCI6MjA1MDU0ODk3MH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function investigarClienteId6() {
  console.log('🔍 Investigando problema do cliente ID 6...\n');

  try {
    // 1. Buscar o cliente ID 6 na tabela clientes_info
    console.log('1. Buscando cliente ID 6 na tabela clientes_info...');
    const { data: cliente6, error: errorCliente6 } = await supabase
      .from('clientes_info')
      .select('*')
      .eq('id', 6)
      .single();

    if (errorCliente6) {
      console.error('❌ Erro ao buscar cliente ID 6:', errorCliente6);
    } else {
      console.log('✅ Cliente ID 6 encontrado:', cliente6);
    }

    // 2. Buscar por email bbf.materiais@gmail.com
    console.log('\n2. Buscando por email bbf.materiais@gmail.com...');
    const { data: clientePorEmail, error: errorEmail } = await supabase
      .from('clientes_info')
      .select('*')
      .eq('email', 'bbf.materiais@gmail.com')
      .single();

    if (errorEmail) {
      console.error('❌ Erro ao buscar por email:', errorEmail);
    } else {
      console.log('✅ Cliente encontrado por email:', clientePorEmail);
    }

    // 3. Buscar TODOS os registros com este email
    console.log('\n3. Buscando TODOS os registros com este email...');
    const { data: todosComEmail, error: errorTodos } = await supabase
      .from('clientes_info')
      .select('*')
      .eq('email', 'bbf.materiais@gmail.com');

    if (errorTodos) {
      console.error('❌ Erro ao buscar todos:', errorTodos);
    } else {
      console.log('✅ Todos os registros com este email:', todosComEmail);
      console.log(`📊 Total de registros encontrados: ${todosComEmail.length}`);
    }

    // 4. Buscar usuário ID 132
    console.log('\n4. Buscando usuário ID 132...');
    const { data: cliente132, error: error132 } = await supabase
      .from('clientes_info')
      .select('*')
      .eq('id', 132)
      .single();

    if (error132) {
      console.error('❌ Erro ao buscar cliente ID 132:', error132);
    } else {
      console.log('✅ Cliente ID 132 encontrado:', cliente132);
    }

    // 5. Verificar se há múltiplos registros com o mesmo email
    console.log('\n5. Verificando se há múltiplos registros...');
    const { data: todosClientes, error: errorTodosClientes } = await supabase
      .from('clientes_info')
      .select('id, email, name, user_id_auth, created_at')
      .order('id', { ascending: true });

    if (errorTodosClientes) {
      console.error('❌ Erro ao buscar todos os clientes:', errorTodosClientes);
    } else {
      console.log('📊 Total de clientes na tabela:', todosClientes.length);
      
      // Procurar por duplicatas de email
      const emails = todosClientes.map(c => c.email);
      const duplicatas = emails.filter((email, index) => emails.indexOf(email) !== index);
      
      if (duplicatas.length > 0) {
        console.log('⚠️ Emails duplicados encontrados:', [...new Set(duplicatas)]);
        
        duplicatas.forEach(email => {
          const registros = todosClientes.filter(c => c.email === email);
          console.log(`📧 Email ${email} aparece ${registros.length} vezes:`, registros);
        });
      } else {
        console.log('✅ Nenhum email duplicado encontrado');
      }
    }

    // 6. Verificar se há registros com user_id_auth duplicado
    console.log('\n6. Verificando user_id_auth duplicados...');
    const userIds = todosClientes.filter(c => c.user_id_auth).map(c => c.user_id_auth);
    const userIdsDuplicados = userIds.filter((id, index) => userIds.indexOf(id) !== index);
    
    if (userIdsDuplicados.length > 0) {
      console.log('⚠️ user_id_auth duplicados encontrados:', [...new Set(userIdsDuplicados)]);
      
      userIdsDuplicados.forEach(userId => {
        const registros = todosClientes.filter(c => c.user_id_auth === userId);
        console.log(`👤 User ID ${userId} aparece ${registros.length} vezes:`, registros);
      });
    } else {
      console.log('✅ Nenhum user_id_auth duplicado encontrado');
    }

    // 7. Simular a busca que o AuthContext faz
    console.log('\n7. Simulando busca do AuthContext...');
    const { data: clienteSimulado, error: errorSimulado } = await supabase
      .from('clientes_info')
      .select('id')
      .eq('email', 'bbf.materiais@gmail.com')
      .single();

    if (errorSimulado) {
      console.error('❌ Erro na busca simulada:', errorSimulado);
    } else {
      console.log('✅ Resultado da busca simulada:', clienteSimulado);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar a investigação
investigarClienteId6(); 