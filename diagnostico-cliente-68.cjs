// Script de diagnóstico para cliente ID 68 - Problema de carregamento de mensagens
const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Erro: SUPABASE_SERVICE_ROLE_KEY não configurada');
  console.log('Configure a variável de ambiente SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnosticarCliente68() {
  console.log('🔍 DIAGNÓSTICO CLIENTE ID 68 - PROBLEMA DE MENSAGENS');
  console.log('=====================================================\n');

  try {
    // 1. Verificar informações do cliente 68
    console.log('1. 📋 VERIFICANDO INFORMAÇÕES DO CLIENTE 68...');
    
    const { data: clienteInfo, error: clienteError } = await supabase
      .from('clientes_info')
      .select('*')
      .eq('id', 68)
      .single();

    if (clienteError) {
      console.error('❌ Erro ao buscar cliente 68:', clienteError);
      return;
    }

    if (!clienteInfo) {
      console.error('❌ Cliente 68 não encontrado na tabela clientes_info');
      return;
    }

    console.log('✅ Cliente 68 encontrado:');
    console.log('   - Nome:', clienteInfo.name);
    console.log('   - Email:', clienteInfo.email);
    console.log('   - Instance ID:', clienteInfo.instance_id);
    console.log('   - Instance ID 2:', clienteInfo.instance_id_2);
    console.log('   - Instance Name:', clienteInfo.instance_name);
    console.log('   - Instance Name 2:', clienteInfo.instance_name_2);
    console.log('   - Status:', clienteInfo.status);
    console.log('   - Plano Plus:', clienteInfo.plano_plus);
    console.log('   - Criado em:', clienteInfo.created_at);

    // 2. Verificar se há mensagens na tabela agente_conversacional_whatsapp
    console.log('\n2. 💬 VERIFICANDO MENSAGENS EXISTENTES...');
    
    const { data: mensagens, error: mensagensError } = await supabase
      .from('agente_conversacional_whatsapp')
      .select('*')
      .or(`instance_id.eq.${clienteInfo.instance_id},instance_id.eq.${clienteInfo.instance_id_2}`)
      .order('created_at', { ascending: false })
      .limit(10);

    if (mensagensError) {
      console.error('❌ Erro ao buscar mensagens:', mensagensError);
    } else {
      console.log(`✅ ${mensagens?.length || 0} mensagens encontradas`);
      if (mensagens && mensagens.length > 0) {
        console.log('   Últimas mensagens:');
        mensagens.forEach((msg, index) => {
          console.log(`   ${index + 1}. ${msg.telefone_id} - ${msg.mensagem?.substring(0, 50)}... (${msg.created_at})`);
        });
      }
    }

    // 3. Verificar se há leads associados ao cliente
    console.log('\n3. 👥 VERIFICANDO LEADS ASSOCIADOS...');
    
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .eq('id_cliente', 68)
      .order('created_at', { ascending: false })
      .limit(5);

    if (leadsError) {
      console.error('❌ Erro ao buscar leads:', leadsError);
    } else {
      console.log(`✅ ${leads?.length || 0} leads encontrados`);
      if (leads && leads.length > 0) {
        console.log('   Últimos leads:');
        leads.forEach((lead, index) => {
          console.log(`   ${index + 1}. ${lead.telefone} - ${lead.status} (${lead.created_at})`);
        });
      }
    }

    // 4. Verificar se há atendentes associados ao cliente
    console.log('\n4. 👨‍💼 VERIFICANDO ATENDENTES ASSOCIADOS...');
    
    const { data: atendentes, error: atendentesError } = await supabase
      .from('atendentes')
      .select('*')
      .eq('id_cliente', 68);

    if (atendentesError) {
      console.error('❌ Erro ao buscar atendentes:', atendentesError);
    } else {
      console.log(`✅ ${atendentes?.length || 0} atendentes encontrados`);
      if (atendentes && atendentes.length > 0) {
        atendentes.forEach((atendente, index) => {
          console.log(`   ${index + 1}. ${atendente.nome} - ${atendente.email} (${atendente.funcao})`);
        });
      }
    }

    // 5. Verificar se há usuários no Supabase Auth associados ao cliente
    console.log('\n5. 🔐 VERIFICANDO USUÁRIOS NO AUTH...');
    
    // Buscar usuários que podem estar associados ao cliente 68
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erro ao buscar usuários no Auth:', authError);
    } else {
      const usuariosCliente68 = authUsers.users.filter(user => {
        const metadata = user.user_metadata || {};
        return metadata.id_cliente === 68 || user.email === clienteInfo.email;
      });
      
      console.log(`✅ ${usuariosCliente68.length} usuários no Auth associados ao cliente 68`);
      usuariosCliente68.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} - ${user.user_metadata?.id_cliente || 'N/A'} (${user.created_at})`);
      });
    }

    // 6. Verificar se há problemas com as instâncias WhatsApp
    console.log('\n6. 📱 VERIFICANDO INSTÂNCIAS WHATSAPP...');
    
    if (clienteInfo.instance_id) {
      console.log(`   Instance ID: ${clienteInfo.instance_id}`);
      
      // Verificar se há mensagens com este instance_id
      const { data: mensagensInstance, error: mensagensInstanceError } = await supabase
        .from('agente_conversacional_whatsapp')
        .select('created_at')
        .eq('instance_id', clienteInfo.instance_id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (mensagensInstanceError) {
        console.error('   ❌ Erro ao verificar mensagens da instância:', mensagensInstanceError);
      } else {
        if (mensagensInstance && mensagensInstance.length > 0) {
          console.log(`   ✅ Última mensagem: ${mensagensInstance[0].created_at}`);
        } else {
          console.log('   ⚠️ Nenhuma mensagem encontrada para esta instância');
        }
      }
    }

    if (clienteInfo.instance_id_2) {
      console.log(`   Instance ID 2: ${clienteInfo.instance_id_2}`);
      
      const { data: mensagensInstance2, error: mensagensInstance2Error } = await supabase
        .from('agente_conversacional_whatsapp')
        .select('created_at')
        .eq('instance_id', clienteInfo.instance_id_2)
        .order('created_at', { ascending: false })
        .limit(1);

      if (mensagensInstance2Error) {
        console.error('   ❌ Erro ao verificar mensagens da instância 2:', mensagensInstance2Error);
      } else {
        if (mensagensInstance2 && mensagensInstance2.length > 0) {
          console.log(`   ✅ Última mensagem: ${mensagensInstance2[0].created_at}`);
        } else {
          console.log('   ⚠️ Nenhuma mensagem encontrada para esta instância');
        }
      }
    }

    // 7. Verificar se há problemas de permissões RLS
    console.log('\n7. 🔒 VERIFICANDO PERMISSÕES RLS...');
    
    try {
      // Tentar inserir uma mensagem de teste (deve falhar se RLS estiver ativo)
      const { data: testeInsert, error: testeInsertError } = await supabase
        .from('agente_conversacional_whatsapp')
        .insert({
          instance_id: clienteInfo.instance_id || 'teste',
          telefone_id: '5511999999999',
          mensagem: 'TESTE DIAGNÓSTICO',
          tipo: 'text',
          from_me: false,
          conversa_id: 'teste'
        })
        .select()
        .single();

      if (testeInsertError) {
        if (testeInsertError.code === '42501') {
          console.log('   ✅ RLS ativo - permissões funcionando');
        } else {
          console.log(`   ⚠️ Erro ao inserir teste: ${testeInsertError.code} - ${testeInsertError.message}`);
        }
      } else {
        console.log('   ⚠️ RLS pode não estar ativo - mensagem de teste inserida');
        
        // Remover mensagem de teste
        await supabase
          .from('agente_conversacional_whatsapp')
          .delete()
          .eq('id', testeInsert.id);
      }
    } catch (error) {
      console.log('   ⚠️ Erro ao testar permissões:', error.message);
    }

    // 8. Verificar se há problemas de conectividade com Evolution API
    console.log('\n8. 🌐 VERIFICANDO CONECTIVIDADE EVOLUTION API...');
    
    if (clienteInfo.instance_name) {
      console.log(`   Instance Name: ${clienteInfo.instance_name}`);
      
      try {
        const response = await fetch(`https://api.evolution.com.br/instance/connectionState/${clienteInfo.instance_name}`, {
          method: 'GET',
          headers: {
            'apikey': clienteInfo.apikey || '429683C4C977415CAAFCCE10F7D57E11'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('   ✅ Evolution API respondendo:', data);
        } else {
          console.log(`   ⚠️ Evolution API retornou status: ${response.status}`);
        }
      } catch (error) {
        console.log('   ❌ Erro ao conectar com Evolution API:', error.message);
      }
    }

    // 9. Resumo e recomendações
    console.log('\n9. 📊 RESUMO E RECOMENDAÇÕES...');
    
    const problemas = [];
    
    if (!clienteInfo.instance_id && !clienteInfo.instance_id_2) {
      problemas.push('❌ Nenhuma instância WhatsApp configurada');
    }
    
    if (!clienteInfo.instance_name && !clienteInfo.instance_name_2) {
      problemas.push('❌ Nenhum nome de instância configurado');
    }
    
    if (clienteInfo.status !== 'ativo') {
      problemas.push(`⚠️ Cliente com status: ${clienteInfo.status}`);
    }
    
    if (problemas.length === 0) {
      console.log('   ✅ Configuração básica parece estar correta');
      console.log('   🔍 Verificar logs da aplicação para mensagens de erro');
      console.log('   🔍 Verificar se o webhook está funcionando');
      console.log('   🔍 Verificar se a Evolution API está recebendo mensagens');
    } else {
      console.log('   Problemas identificados:');
      problemas.forEach(problema => console.log(`   ${problema}`));
    }

    console.log('\n🔧 PRÓXIMOS PASSOS:');
    console.log('   1. Verificar logs da aplicação no console do navegador');
    console.log('   2. Verificar se o webhook está funcionando');
    console.log('   3. Testar envio de mensagem manual');
    console.log('   4. Verificar status da instância na Evolution API');

  } catch (error) {
    console.error('💥 Erro durante diagnóstico:', error);
  }
}

// Executar diagnóstico
diagnosticarCliente68();
