const { createClient } = require('@supabase/supabase-js');

// Configuração via variáveis de ambiente (sempre evitar hardcode)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Dados da alteração devem ser recebidos dinamicamente para não vazar dados sensíveis em código
const userId = process.argv[2];
const newPassword = process.argv[3];

if (!userId || !newPassword) {
  console.error('Uso: node update-password.cjs <userId> <newPassword>');
  process.exit(1);
}

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


