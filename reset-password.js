const { createClient } = require('@supabase/supabase-js');

// Dados do projeto fornecidos pelo usuário:
const SUPABASE_URL = 'https://ltdkdeqxcgtuncgzsowt.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0ZGtkZXF4Y2d0dW5jZ3pzb3d0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzA4NzYxNiwiZXhwIjoyMDUyNjYzNjE2fQ.RKMW8QZohViES2Y2agpCC5OYv8owBCPnI3pgxppIeVs';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function updatePassword() {
  const { data, error } = await supabase.auth.admin.updateUserByEmail('victorsilva734@hotmail.com', {
    password: 'Sm@rt2025!'
  });
  if (error) {
    console.error('Erro ao atualizar senha:', error);
  } else {
    console.log('Senha atualizada com sucesso!', data);
  }
}

updatePassword(); 