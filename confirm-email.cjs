const { createClient } = require('@supabase/supabase-js');

// Dados do projeto fornecidos pelo usuário:
const SUPABASE_URL = 'https://ltdkdeqxcgtuncgzsowt.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0ZGtkZXF4Y2d0dW5jZ3pzb3d0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzA4NzYxNiwiZXhwIjoyMDUyNjYzNjE2fQ.RKMW8QZohViES2Y2agpCC5OYv8owBCPnI3pgxppIeVs';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function confirmEmail() {
  const email = 'jeeniferpimenta21@gmail.com';
  
  console.log(`Confirmando e-mail para: ${email}`);
  
  try {
    // Primeiro, vamos buscar o usuário para verificar se existe
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Erro ao listar usuários:', listError);
      return;
    }
    
    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      console.error(`Usuário com e-mail ${email} não encontrado!`);
      return;
    }
    
    console.log('Usuário encontrado:', {
      id: user.id,
      email: user.email,
      email_confirmed_at: user.email_confirmed_at,
      created_at: user.created_at
    });
    
    // Confirmar o e-mail manualmente
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      email_confirm: true
    });
    
    if (error) {
      console.error('Erro ao confirmar e-mail:', error);
    } else {
      console.log('E-mail confirmado com sucesso!', data);
      console.log('Usuário agora pode fazer login normalmente.');
    }
    
  } catch (error) {
    console.error('Erro inesperado:', error);
  }
}

confirmEmail(); 