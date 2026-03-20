// Script de diagnóstico para problemas de ID de cliente incorreto
// Execute este script no console do navegador para diagnosticar problemas

import { supabase } from '@/lib/supabase';

export const debugUserIdMismatch = async () => {
  console.log('🔍 Iniciando diagnóstico de IDs de cliente incorretos...');
  
  try {
    // 1. Verificar usuário autenticado atual
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      console.log('❌ Nenhum usuário autenticado');
      return;
    }
    
    const currentUser = session.user;
    console.log('👤 Usuário atual:', {
      id: currentUser.id,
      email: currentUser.email,
      id_cliente: currentUser.user_metadata?.id_cliente
    });
    
    // 2. Buscar todos os registros na tabela clientes_info
    const { data: allClientes, error: clientesError } = await supabase
      .from('clientes_info')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (clientesError) {
      console.error('❌ Erro ao buscar clientes:', clientesError);
      return;
    }
    
    console.log(`📊 Total de registros na tabela clientes_info: ${allClientes.length}`);
    
    // 3. Buscar registros com o email do usuário atual
    const userClientes = allClientes.filter(cliente => cliente.email === currentUser.email);
    console.log(`📧 Registros encontrados para ${currentUser.email}:`, userClientes.length);
    
    if (userClientes.length > 0) {
      userClientes.forEach((cliente, index) => {
        console.log(`   ${index + 1}. ID: ${cliente.id}, user_id_auth: ${cliente.user_id_auth}, created_at: ${cliente.created_at}`);
      });
    }
    
    // 4. Verificar se o user_id_auth está correto
    const correctCliente = userClientes.find(cliente => 
      cliente.user_id_auth === currentUser.id
    ) || userClientes[0];
    
    if (correctCliente) {
      console.log('✅ Cliente correto encontrado:', {
        id: correctCliente.id,
        user_id_auth: correctCliente.user_id_auth,
        email: correctCliente.email
      });
      
      // 5. Verificar se o id_cliente atual está correto
      const currentIdCliente = currentUser.user_metadata?.id_cliente;
      if (currentIdCliente !== correctCliente.id) {
        console.log('⚠️  ID de cliente incorreto detectado!');
        console.log(`   Atual: ${currentIdCliente}`);
        console.log(`   Correto: ${correctCliente.id}`);
        
        // 6. Corrigir o id_cliente
        console.log('🔧 Corrigindo id_cliente...');
        const { error: updateError } = await supabase.auth.updateUser({
          data: { id_cliente: correctCliente.id }
        });
        
        if (updateError) {
          console.error('❌ Erro ao corrigir id_cliente:', updateError);
        } else {
          console.log('✅ id_cliente corrigido com sucesso!');
          
          // 7. Atualizar user_id_auth se necessário
          if (correctCliente.user_id_auth !== currentUser.id) {
            console.log('🔧 Atualizando user_id_auth...');
            const { error: updateClienteError } = await supabase
              .from('clientes_info')
              .update({ user_id_auth: currentUser.id })
              .eq('id', correctCliente.id);
            
            if (updateClienteError) {
              console.error('❌ Erro ao atualizar user_id_auth:', updateClienteError);
            } else {
              console.log('✅ user_id_auth atualizado com sucesso!');
            }
          }
        }
      } else {
        console.log('✅ ID de cliente está correto!');
      }
    } else {
      console.log('❌ Nenhum cliente encontrado para o usuário atual');
    }
    
    // 8. Verificar registros duplicados
    const emailGroups = {};
    allClientes.forEach(cliente => {
      if (!emailGroups[cliente.email]) {
        emailGroups[cliente.email] = [];
      }
      emailGroups[cliente.email].push(cliente);
    });
    
    const duplicateEmails = Object.entries(emailGroups)
      .filter(([email, clientes]) => clientes.length > 1)
      .map(([email, clientes]) => ({ email, count: clientes.length, clientes }));
    
    if (duplicateEmails.length > 0) {
      console.log('⚠️  Emails duplicados encontrados:');
      duplicateEmails.forEach(({ email, count, clientes }) => {
        console.log(`   ${email}: ${count} registros`);
        clientes.forEach(cliente => {
          console.log(`     - ID: ${cliente.id}, user_id_auth: ${cliente.user_id_auth}, created_at: ${cliente.created_at}`);
        });
      });
    } else {
      console.log('✅ Nenhum email duplicado encontrado');
    }
    
  } catch (error) {
    console.error('❌ Erro durante diagnóstico:', error);
  }
};

// Função para limpar registros duplicados (use com cuidado!)
export const cleanupDuplicateRecords = async () => {
  console.log('🧹 Iniciando limpeza de registros duplicados...');
  
  try {
    const { data: allClientes, error: clientesError } = await supabase
      .from('clientes_info')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (clientesError) {
      console.error('❌ Erro ao buscar clientes:', clientesError);
      return;
    }
    
    const emailGroups = {};
    allClientes.forEach(cliente => {
      if (!emailGroups[cliente.email]) {
        emailGroups[cliente.email] = [];
      }
      emailGroups[cliente.email].push(cliente);
    });
    
    const duplicateEmails = Object.entries(emailGroups)
      .filter(([email, clientes]) => clientes.length > 1);
    
    for (const [email, clientes] of duplicateEmails) {
      console.log(`🔧 Processando duplicatas para ${email}...`);
      
      // Manter o registro mais antigo (primeiro na lista)
      const keepCliente = clientes[0];
      const deleteClientes = clientes.slice(1);
      
      console.log(`   Mantendo: ID ${keepCliente.id}`);
      console.log(`   Removendo: ${deleteClientes.map(c => c.id).join(', ')}`);
      
      // Deletar registros duplicados
      for (const cliente of deleteClientes) {
        const { error: deleteError } = await supabase
          .from('clientes_info')
          .delete()
          .eq('id', cliente.id);
        
        if (deleteError) {
          console.error(`   ❌ Erro ao deletar ID ${cliente.id}:`, deleteError);
        } else {
          console.log(`   ✅ ID ${cliente.id} removido`);
        }
      }
    }
    
    console.log('✅ Limpeza concluída!');
    
  } catch (error) {
    console.error('❌ Erro durante limpeza:', error);
  }
};

// Exportar funções para uso no console
window.debugUserIdMismatch = debugUserIdMismatch;
window.cleanupDuplicateRecords = cleanupDuplicateRecords;

console.log('🔧 Script de diagnóstico carregado!');
console.log('Use debugUserIdMismatch() para diagnosticar problemas');
console.log('Use cleanupDuplicateRecords() para limpar duplicatas (cuidado!)'); 