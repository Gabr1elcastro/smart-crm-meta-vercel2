const { createClient } = require('@supabase/supabase-js');

// Dados do projeto fornecidos pelo usuário:
const SUPABASE_URL = 'https://ltdkdeqxcgtuncgzsowt.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0ZGtkZXF4Y2d0dW5jZ3pzb3d0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzA4NzYxNiwiZXhwIjoyMDUyNjYzNjE2fQ.RKMW8QZohViES2Y2agpCC5OYv8owBCPnI3pgxppIeVs';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Função para verificar se o e-mail já existe nas tabelas clientes_info e atendentes
async function checkEmailExists(email) {
  console.log(`🔍 Verificando e-mail: ${email}`);
  
  try {
    // Verificar na tabela clientes_info
    console.log('📋 Verificando na tabela clientes_info...');
    const { data: clienteData, error: clienteError } = await supabase
      .from('clientes_info')
      .select('id, name, email')
      .eq('email', email)
      .single();

    if (clienteData) {
      console.log('✅ E-mail encontrado na tabela clientes_info:', clienteData);
      return { exists: true, table: 'clientes_info', data: clienteData };
    }

    // Verificar na tabela atendentes
    console.log('📋 Verificando na tabela atendentes...');
    const { data: atendenteData, error: atendenteError } = await supabase
      .from('atendentes')
      .select('id, nome, email, tipo_usuario')
      .eq('email', email)
      .single();

    if (atendenteData) {
      console.log('✅ E-mail encontrado na tabela atendentes:', atendenteData);
      return { exists: true, table: 'atendentes', data: atendenteData };
    }

    console.log('✅ E-mail não encontrado em nenhuma tabela - disponível para uso');
    return { exists: false, table: null, data: null };
  } catch (error) {
    console.log('✅ E-mail não encontrado (erro esperado se não existir):', error.message);
    return { exists: false, table: null, data: null };
  }
}

// Função para listar todos os e-mails das tabelas
async function listAllEmails() {
  console.log('📋 Listando todos os e-mails cadastrados...\n');
  
  try {
    // Listar e-mails da tabela clientes_info
    console.log('👥 E-mails na tabela clientes_info:');
    const { data: clientes, error: clientesError } = await supabase
      .from('clientes_info')
      .select('id, name, email, created_at')
      .order('created_at', { ascending: false });
    
    if (clientesError) {
      console.error('❌ Erro ao buscar clientes:', clientesError);
    } else {
      if (clientes && clientes.length > 0) {
        clientes.forEach((cliente, index) => {
          console.log(`  ${index + 1}. ${cliente.email} (${cliente.name}) - ID: ${cliente.id}`);
        });
      } else {
        console.log('  Nenhum cliente encontrado');
      }
    }
    
    console.log('\n👤 E-mails na tabela atendentes:');
    const { data: atendentes, error: atendentesError } = await supabase
      .from('atendentes')
      .select('id, nome, email, tipo_usuario, created_at')
      .order('created_at', { ascending: false });
    
    if (atendentesError) {
      console.error('❌ Erro ao buscar atendentes:', atendentesError);
    } else {
      if (atendentes && atendentes.length > 0) {
        atendentes.forEach((atendente, index) => {
          console.log(`  ${index + 1}. ${atendente.email} (${atendente.nome} - ${atendente.tipo_usuario}) - ID: ${atendente.id}`);
        });
      } else {
        console.log('  Nenhum atendente encontrado');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

// Função principal
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📋 Uso:');
    console.log('  node test-email-validation.cjs list                    - Listar todos os e-mails cadastrados');
    console.log('  node test-email-validation.cjs check <email>           - Verificar se um e-mail específico existe');
    console.log('  node test-email-validation.cjs test                    - Testar com e-mails de exemplo');
    return;
  }
  
  const command = args[0];
  
  switch (command) {
    case 'list':
      await listAllEmails();
      break;
      
    case 'check':
      if (args.length < 2) {
        console.error('❌ Por favor, forneça um e-mail: node test-email-validation.cjs check <email>');
        return;
      }
      const result = await checkEmailExists(args[1]);
      console.log('\n📊 Resultado da verificação:');
      console.log(`  E-mail: ${args[1]}`);
      console.log(`  Existe: ${result.exists ? 'Sim' : 'Não'}`);
      if (result.exists) {
        console.log(`  Tabela: ${result.table}`);
        console.log(`  Dados:`, result.data);
      }
      break;
      
    case 'test':
      console.log('🧪 Testando validação com e-mails de exemplo...\n');
      
      // Testar com e-mails que provavelmente existem
      const testEmails = [
        'bbf.materiais@gmail.com',
        'teste@exemplo.com',
        'usuario.inexistente@teste.com'
      ];
      
      for (const email of testEmails) {
        console.log(`\n--- Testando: ${email} ---`);
        const result = await checkEmailExists(email);
        console.log(`Resultado: ${result.exists ? 'EXISTE' : 'NÃO EXISTE'}`);
        if (result.exists) {
          console.log(`Tabela: ${result.table}`);
        }
      }
      break;
      
    default:
      console.error('❌ Comando inválido. Use: list, check <email>, ou test');
  }
}

main(); 