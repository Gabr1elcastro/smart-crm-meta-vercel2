// Script para listar todas as tabelas
// Execute este script no console do navegador

console.log('=== LISTAR TABELAS DO BANCO ===');

try {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  // Tentar diferentes nomes de tabela
  const possiveisNomes = [
    'clientes_info',
    'clientes',
    'cliente_info',
    'cliente',
    'customers',
    'customer_info'
  ];

  console.log('Testando diferentes nomes de tabela...');
  
  for (const nomeTabela of possiveisNomes) {
    try {
      const { data, error } = await supabase
        .from(nomeTabela)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${nomeTabela}: ${error.message}`);
      } else {
        console.log(`✅ ${nomeTabela}: Tabela encontrada`);
        if (data && data.length > 0) {
          console.log(`   Primeiro registro:`, data[0]);
        }
      }
    } catch (err) {
      console.log(`❌ ${nomeTabela}: Erro ao acessar`);
    }
  }

  // Testar tabela atendentes
  console.log('\nTestando tabela atendentes...');
  try {
    const { data: atendentes, error: atendentesError } = await supabase
      .from('atendentes')
      .select('*')
      .limit(1);
    
    if (atendentesError) {
      console.log('❌ atendentes:', atendentesError.message);
    } else {
      console.log('✅ atendentes: Tabela encontrada');
      if (atendentes && atendentes.length > 0) {
        console.log('   Primeiro registro:', atendentes[0]);
      }
    }
  } catch (err) {
    console.log('❌ atendentes: Erro ao acessar');
  }

  // Testar tabela superadmins
  console.log('\nTestando tabela superadmins...');
  try {
    const { data: superadmins, error: superadminsError } = await supabase
      .from('superadmins')
      .select('*')
      .limit(1);
    
    if (superadminsError) {
      console.log('❌ superadmins:', superadminsError.message);
    } else {
      console.log('✅ superadmins: Tabela encontrada');
      if (superadmins && superadmins.length > 0) {
        console.log('   Primeiro registro:', superadmins[0]);
      }
    }
  } catch (err) {
    console.log('❌ superadmins: Erro ao acessar');
  }

} catch (error) {
  console.error('Erro geral:', error);
}

console.log('\n=== FIM DA LISTAGEM ===');
console.log('\n📋 PRÓXIMOS PASSOS:');
console.log('1. Identifique o nome correto da tabela de clientes');
console.log('2. Atualize o serviço com o nome correto');
console.log('3. Verifique as permissões da tabela no Supabase'); 