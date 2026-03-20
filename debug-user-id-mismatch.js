// Script para diagnosticar e corrigir problemas de ID de cliente
// Execute este script para verificar se há usuários com ID de cliente incorreto

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseUserClientMismatch() {
  console.log('🔍 Iniciando diagnóstico de problemas de ID de cliente...\n');

  try {
    // 1. Buscar todos os usuários autenticados
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erro ao buscar usuários autenticados:', authError);
      return;
    }

    console.log(`📊 Total de usuários autenticados: ${authUsers.users.length}\n`);

    // 2. Para cada usuário, verificar se o id_cliente está correto
    for (const authUser of authUsers.users) {
      const userEmail = authUser.email;
      const userMetadata = authUser.user_metadata || {};
      const currentIdCliente = userMetadata.id_cliente;

      console.log(`\n👤 Verificando usuário: ${userEmail}`);
      console.log(`   ID Cliente atual: ${currentIdCliente}`);

      // 3. Buscar o cliente correto por email
      const { data: correctClient, error: clientError } = await supabase
        .from('clientes_info')
        .select('id, email, name')
        .eq('email', userEmail)
        .order('id', { ascending: true })
        .limit(1)
        .single();

      if (clientError) {
        console.log(`   ❌ Cliente não encontrado para email: ${userEmail}`);
        continue;
      }

      console.log(`   ✅ Cliente encontrado: ID=${correctClient.id}, Nome=${correctClient.name}`);

      // 4. Verificar se o ID está correto
      if (currentIdCliente !== correctClient.id) {
        console.log(`   ⚠️  PROBLEMA DETECTADO: ID incorreto!`);
        console.log(`      Atual: ${currentIdCliente}`);
        console.log(`      Correto: ${correctClient.id}`);
        
        // 5. Corrigir o ID do cliente
        try {
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            authUser.id,
            {
              user_metadata: {
                ...userMetadata,
                id_cliente: correctClient.id
              }
            }
          );

          if (updateError) {
            console.log(`   ❌ Erro ao corrigir ID: ${updateError.message}`);
          } else {
            console.log(`   ✅ ID corrigido com sucesso!`);
          }
        } catch (updateError) {
          console.log(`   ❌ Erro ao corrigir ID: ${updateError.message}`);
        }
      } else {
        console.log(`   ✅ ID está correto`);
      }
    }

    console.log('\n🎉 Diagnóstico concluído!');

  } catch (error) {
    console.error('❌ Erro durante o diagnóstico:', error);
  }
}

// Função para verificar dados específicos
async function checkSpecificUser(email) {
  console.log(`\n🔍 Verificando usuário específico: ${email}`);

  try {
    // Buscar usuário autenticado
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erro ao buscar usuários:', authError);
      return;
    }

    const authUser = authUsers.users.find(u => u.email === email);
    if (!authUser) {
      console.log(`❌ Usuário não encontrado: ${email}`);
      return;
    }

    console.log(`👤 Usuário encontrado: ${authUser.email}`);
    console.log(`   ID Cliente atual: ${authUser.user_metadata?.id_cliente}`);

    // Buscar cliente por email
    const { data: client, error: clientError } = await supabase
      .from('clientes_info')
      .select('*')
      .eq('email', email)
      .order('id', { ascending: true })
      .limit(1)
      .single();

    if (clientError) {
      console.log(`❌ Cliente não encontrado para email: ${email}`);
      return;
    }

    console.log(`✅ Cliente encontrado:`);
    console.log(`   ID: ${client.id}`);
    console.log(`   Nome: ${client.name}`);
    console.log(`   Email: ${client.email}`);
    console.log(`   Trial: ${client.trial}`);
    console.log(`   Plano Starter: ${client.plano_starter}`);
    console.log(`   Plano Pro: ${client.plano_pro}`);
    console.log(`   Plano Plus: ${client.plano_plus}`);

  } catch (error) {
    console.error('❌ Erro ao verificar usuário:', error);
  }
}

// Exportar funções para uso
export { diagnoseUserClientMismatch, checkSpecificUser };

// Se executado diretamente
if (typeof window === 'undefined') {
  // Executar diagnóstico
  diagnoseUserClientMismatch();
  
  // Verificar usuário específico (substitua pelo email)
  // checkSpecificUser('bbf.materiais@gmail.com');
} 