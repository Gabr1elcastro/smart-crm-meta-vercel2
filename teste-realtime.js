// Teste do sistema de realtime para mensagens
// Este arquivo testa se o realtime está funcionando corretamente

import { supabase } from './src/lib/supabase.js';

console.log('🧪 Testando sistema de realtime...');

// Simular configuração de subscription
async function testRealtime() {
  try {
    console.log('📡 Configurando subscription de teste...');
    
    // Criar canal de teste
    const channel = supabase
      .channel('test_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agente_conversacional_whatsapp'
        },
        (payload) => {
          console.log('✅ Nova mensagem recebida via realtime:', payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'agente_conversacional_whatsapp'
        },
        (payload) => {
          console.log('✅ Mensagem atualizada via realtime:', payload);
        }
      )
      .subscribe((status) => {
        console.log('📊 Status da subscription:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('🎉 Subscription ativa com sucesso!');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Erro na subscription');
        }
      });
    
    console.log('📋 Canal criado:', channel);
    
    // Testar se o canal está funcionando
    setTimeout(() => {
      console.log('🔍 Verificando status do canal...');
      console.log('Canal ativo:', channel.subscribe);
    }, 2000);
    
  } catch (error) {
    console.error('❌ Erro ao testar realtime:', error);
  }
}

// Executar teste
testRealtime();

console.log('🏁 Teste iniciado. Verifique o console para resultados.');
