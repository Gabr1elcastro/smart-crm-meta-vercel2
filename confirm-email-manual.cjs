const { createClient } = require('@supabase/supabase-js');

// Dados do projeto fornecidos pelo usuário:
const SUPABASE_URL = 'https://ltdkdeqxcgtuncgzsowt.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0ZGtkZXF4Y2d0dW5jZ3pzb3d0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzA4NzYxNiwiZXhwIjoyMDUyNjYzNjE2fQ.RKMW8QZohViES2Y2agpCC5OYv8owBCPnI3pgxppIeVs';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function listUnconfirmedUsers() {
  console.log('🔍 Listando usuários não confirmados...');
  
  try {
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Erro ao listar usuários:', listError);
      return;
    }
    
    const unconfirmedUsers = users.users.filter(user => !user.email_confirmed_at);
    
    if (unconfirmedUsers.length === 0) {
      console.log('✅ Todos os usuários já estão confirmados!');
      return;
    }
    
    console.log(`📋 Encontrados ${unconfirmedUsers.length} usuários não confirmados:`);
    unconfirmedUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (ID: ${user.id})`);
    });
    
    return unconfirmedUsers;
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

async function confirmUserEmail(email) {
  console.log(`📧 Confirmando e-mail para: ${email}`);
  
  try {
    // Primeiro, buscar o usuário
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Erro ao listar usuários:', listError);
      return false;
    }
    
    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      console.error(`❌ Usuário com e-mail ${email} não encontrado!`);
      return false;
    }
    
    if (user.email_confirmed_at) {
      console.log(`✅ E-mail ${email} já está confirmado!`);
      return true;
    }
    
    // Confirmar o e-mail manualmente
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      email_confirm: true
    });
    
    if (error) {
      console.error('❌ Erro ao confirmar e-mail:', error);
      return false;
    } else {
      console.log('✅ E-mail confirmado com sucesso!', data);
      console.log('👤 Usuário agora pode fazer login normalmente.');
      return true;
    }
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    return false;
  }
}

async function confirmAllUnconfirmedUsers() {
  console.log('🔄 Confirmando todos os usuários não confirmados...');
  
  const unconfirmedUsers = await listUnconfirmedUsers();
  
  if (!unconfirmedUsers || unconfirmedUsers.length === 0) {
    return;
  }
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const user of unconfirmedUsers) {
    const success = await confirmUserEmail(user.email);
    if (success) {
      successCount++;
    } else {
      errorCount++;
    }
    // Pequena pausa entre as operações
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n📊 Resumo:`);
  console.log(`✅ Confirmados com sucesso: ${successCount}`);
  console.log(`❌ Erros: ${errorCount}`);
}

// Função principal
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📋 Uso:');
    console.log('  node confirm-email-manual.cjs list                    - Listar usuários não confirmados');
    console.log('  node confirm-email-manual.cjs confirm <email>         - Confirmar e-mail específico');
    console.log('  node confirm-email-manual.cjs confirm-all             - Confirmar todos os usuários não confirmados');
    return;
  }
  
  const command = args[0];
  
  switch (command) {
    case 'list':
      await listUnconfirmedUsers();
      break;
      
    case 'confirm':
      if (args.length < 2) {
        console.error('❌ Por favor, forneça um e-mail: node confirm-email-manual.cjs confirm <email>');
        return;
      }
      await confirmUserEmail(args[1]);
      break;
      
    case 'confirm-all':
      await confirmAllUnconfirmedUsers();
      break;
      
    default:
      console.error('❌ Comando inválido. Use: list, confirm <email>, ou confirm-all');
  }
}

main(); 