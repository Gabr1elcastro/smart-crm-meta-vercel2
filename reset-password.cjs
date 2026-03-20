const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ltdkdeqxcgtuncgzsowt.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0ZGtkZXF4Y2d0dW5jZ3pzb3d0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzA4NzYxNiwiZXhwIjoyMDUyNjYzNjE2fQ.RKMW8QZohViES2Y2agpCC5OYv8owBCPnI3pgxppIeVs';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function updatePassword() {
  // Buscar usuário pelo e-mail
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) {
    console.error('Erro ao buscar usuários:', userError);
    return;
  }
  const user = users.users.find(u => u.email === 'bruno.cunha+003@ensinoagil.com.br');
  if (!user) {
    console.error('Usuário não encontrado!');
    return;
  }

  // Atualizar senha pelo ID
  const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
    password: '123456'
  });
  if (error) {
    console.error('Erro ao atualizar senha:', error);
  } else {
    console.log('Senha atualizada com sucesso!', data);
  }
}

updatePassword(); 