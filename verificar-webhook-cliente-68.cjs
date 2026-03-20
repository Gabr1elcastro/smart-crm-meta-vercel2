// Script para verificar webhook e mensagens em tempo real do cliente 68
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

async function verificarWebhookCliente68() {
  console.log('🔍 VERIFICAÇÃO DE WEBHOOK E MENSAGENS EM TEMPO REAL - CLIENTE 68');
  console.log('==================================================================\n');

  try {
    // 1. Buscar informações do cliente 68
    const { data: clienteInfo, error: clienteError } = await supabase
      .from('clientes_info')
      .select('*')
      .eq('id', 68)
      .single();

    if (clienteError || !clienteInfo) {
      console.error('❌ Cliente 68 não encontrado');
      return;
    }

    console.log('📋 Cliente 68:', clienteInfo.name);
    console.log('📱 Instance Name:', clienteInfo.instance_name);
    console.log('🔑 API Key:', clienteInfo.apikey ? '✅ Configurada' : '❌ Não configurada');

    // 2. Verificar se há mensagens recentes
    console.log('\n2. 💬 VERIFICANDO MENSAGENS RECENTES...');
    
    const { data: mensagens, error: mensagensError } = await supabase
      .from('agente_conversacional_whatsapp')
      .select('*')
      .or(`instance_id.eq.${clienteInfo.instance_id},instance_id.eq.${clienteInfo.instance_id_2}`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (mensagensError) {
      console.error('❌ Erro ao buscar mensagens:', mensagensError);
    } else {
      console.log(`✅ ${mensagens?.length || 0} mensagens encontradas`);
      
      if (mensagens && mensagens.length > 0) {
        const mensagensPorDia = {};
        mensagens.forEach(msg => {
          const data = new Date(msg.created_at).toLocaleDateString('pt-BR');
          if (!mensagensPorDia[data]) mensagensPorDia[data] = 0;
          mensagensPorDia[data]++;
        });
        
        console.log('   Distribuição por dia:');
        Object.entries(mensagensPorDia).forEach(([data, count]) => {
          console.log(`   ${data}: ${count} mensagens`);
        });
        
        console.log('\n   Últimas 5 mensagens:');
        mensagens.slice(0, 5).forEach((msg, index) => {
          const data = new Date(msg.created_at).toLocaleString('pt-BR');
          console.log(`   ${index + 1}. ${msg.telefone_id} - ${msg.mensagem?.substring(0, 40)}... (${data})`);
        });
      }
    }

    // 3. Verificar se há leads com conversas ativas
    console.log('\n3. 👥 VERIFICANDO LEADS COM CONVERSAS ATIVAS...');
    
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .eq('id_cliente', 68)
      .in('status', ['conversaEmAndamento', 'oportunidade', 'ganho'])
      .order('created_at', { ascending: false });

    if (leadsError) {
      console.error('❌ Erro ao buscar leads:', leadsError);
    } else {
      console.log(`✅ ${leads?.length || 0} leads com conversas ativas`);
      
      if (leads && leads.length > 0) {
        leads.forEach((lead, index) => {
          console.log(`   ${index + 1}. ${lead.telefone} - ${lead.status} (${lead.created_at})`);
        });
      }
    }

    // 4. Verificar se há problemas com o webhook
    console.log('\n4. 🌐 VERIFICANDO WEBHOOK...');
    
    if (clienteInfo.instance_name) {
      try {
        // Verificar status da instância na Evolution API
        const response = await fetch(`https://api.evolution.com.br/instance/connectionState/${clienteInfo.instance_name}`, {
          method: 'GET',
          headers: {
            'apikey': clienteInfo.apikey || '429683C4C977415CAAFCCE10F7D57E11'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('   ✅ Evolution API respondendo');
          console.log('   📊 Status da instância:', data);
          
          // Verificar se a instância está conectada
          if (data.state === 'open') {
            console.log('   🟢 Instância conectada e funcionando');
          } else {
            console.log(`   🟡 Instância com status: ${data.state}`);
          }
        } else {
          console.log(`   ⚠️ Evolution API retornou status: ${response.status}`);
        }
      } catch (error) {
        console.log('   ❌ Erro ao conectar com Evolution API:', error.message);
      }
    }

    // 5. Verificar se há mensagens perdidas (webhook não funcionando)
    console.log('\n5. 🔍 VERIFICANDO POSSÍVEIS MENSAGENS PERDIDAS...');
    
    // Verificar se há mensagens muito antigas vs. muito recentes
    if (mensagens && mensagens.length > 0) {
      const mensagemMaisAntiga = new Date(mensagens[mensagens.length - 1].created_at);
      const mensagemMaisRecente = new Date(mensagens[0].created_at);
      const agora = new Date();
      
      const diffAntiga = Math.floor((agora - mensagemMaisAntiga) / (1000 * 60 * 60 * 24)); // dias
      const diffRecente = Math.floor((agora - mensagemMaisRecente) / (1000 * 60)); // minutos
      
      console.log(`   📅 Mensagem mais antiga: há ${diffAntiga} dias`);
      console.log(`   📅 Mensagem mais recente: há ${diffRecente} minutos`);
      
      if (diffRecente > 60) { // mais de 1 hora
        console.log('   ⚠️ Última mensagem é muito antiga - possível problema com webhook');
      } else {
        console.log('   ✅ Mensagens recentes sendo recebidas');
      }
    }

    // 6. Verificar se há problemas de permissões ou RLS
    console.log('\n6. 🔒 VERIFICANDO PERMISSÕES...');
    
    try {
      // Tentar buscar mensagens com diferentes filtros
      const { data: testeQuery, error: testeQueryError } = await supabase
        .from('agente_conversacional_whatsapp')
        .select('id, created_at')
        .or(`instance_id.eq.${clienteInfo.instance_id},instance_id.eq.${clienteInfo.instance_id_2}`)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // últimas 24h
        .limit(1);

      if (testeQueryError) {
        console.log(`   ❌ Erro ao consultar mensagens: ${testeQueryError.code} - ${testeQueryError.message}`);
      } else {
        console.log('   ✅ Permissões de leitura funcionando');
      }
    } catch (error) {
      console.log('   ⚠️ Erro ao testar permissões:', error.message);
    }

    // 7. Verificar se há problemas específicos com o cliente
    console.log('\n7. 🎯 PROBLEMAS ESPECÍFICOS DO CLIENTE 68...');
    
    const problemas = [];
    
    if (!clienteInfo.instance_id && !clienteInfo.instance_id_2) {
      problemas.push('❌ Nenhuma instância WhatsApp configurada');
    }
    
    if (!clienteInfo.instance_name && !clienteInfo.instance_name_2) {
      problemas.push('❌ Nenhum nome de instância configurado');
    }
    
    if (!clienteInfo.apikey) {
      problemas.push('❌ API Key não configurada');
    }
    
    if (clienteInfo.status !== 'ativo') {
      problemas.push(`⚠️ Cliente com status: ${clienteInfo.status}`);
    }
    
    if (problemas.length === 0) {
      console.log('   ✅ Configuração básica está correta');
    } else {
      console.log('   Problemas identificados:');
      problemas.forEach(problema => console.log(`   ${problema}`));
    }

    // 8. Recomendações específicas
    console.log('\n8. 🔧 RECOMENDAÇÕES ESPECÍFICAS...');
    
    if (mensagens && mensagens.length === 0) {
      console.log('   📝 Nenhuma mensagem encontrada - verificar:');
      console.log('      - Se o webhook está configurado corretamente');
      console.log('      - Se a Evolution API está enviando mensagens');
      console.log('      - Se as permissões RLS estão corretas');
    } else if (mensagens && mensagens.length > 0) {
      const ultimaMensagem = new Date(mensagens[0].created_at);
      const agora = new Date();
      const diffMinutos = Math.floor((agora - ultimaMensagem) / (1000 * 60));
      
      if (diffMinutos > 60) {
        console.log('   ⏰ Última mensagem há mais de 1 hora - verificar:');
        console.log('      - Se o webhook parou de funcionar');
        console.log('      - Se há problemas de conectividade');
        console.log('      - Se a instância WhatsApp está desconectada');
      } else {
        console.log('   ✅ Mensagens sendo recebidas normalmente');
        console.log('   🔍 Se o problema é específico, verificar:');
        console.log('      - Logs da aplicação no console do navegador');
        console.log('      - Se há erros JavaScript');
        console.log('      - Se as subscriptions em tempo real estão funcionando');
      }
    }

    // 9. Teste de envio de mensagem (opcional)
    console.log('\n9. 🧪 TESTE DE ENVIO DE MENSAGEM...');
    console.log('   Para testar se o problema é de recebimento ou envio:');
    console.log('   1. Acesse a plataforma como cliente 68');
    console.log('   2. Vá para Conversas');
    console.log('   3. Tente enviar uma mensagem para um número de teste');
    console.log('   4. Verifique se aparece na lista de conversas');
    console.log('   5. Verifique se a mensagem é salva no banco');

    console.log('\n🔍 PRÓXIMOS PASSOS PARA INVESTIGAÇÃO:');
    console.log('   1. Execute este script para ver o estado atual');
    console.log('   2. Verifique logs da aplicação no console do navegador');
    console.log('   3. Teste envio de mensagem manual');
    console.log('   4. Verifique se o webhook está funcionando');
    console.log('   5. Verifique status da instância na Evolution API');

  } catch (error) {
    console.error('💥 Erro durante verificação:', error);
  }
}

// Executar verificação
verificarWebhookCliente68();
