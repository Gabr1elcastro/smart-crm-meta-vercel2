const { createClient } = require('@supabase/supabase-js');

// Configuração via variáveis de ambiente
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ltdkdeqxcgtuncgzsowt.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0ZGtkZXF4Y2d0dW5jZ3pzb3d0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzA4NzYxNiwiZXhwIjoyMDUyNjYzNjE2fQ.RKMW8QZohViES2Y2agpCC5OYv8owBCPnI3pgxppIeVs';

// Dados da alteração
const userId = 'fc7b5761-9838-40a5-a339-1159c418af34';
const newPassword = 'Getracker2025*';

(async () => {
  try {
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      console.error('SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidos.');
      process.exit(1);
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) {
      console.error('Erro ao atualizar senha:', error);
      process.exit(1);
    }

    console.log('Senha atualizada com sucesso para:', data?.user?.email || userId);
    process.exit(0);
  } catch (err) {
    console.error('Falha inesperada:', err);
    process.exit(1);
  }
})();


