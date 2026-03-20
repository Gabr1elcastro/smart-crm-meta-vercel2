/**
 * Supabase Edge Function: check-workflow-timeouts
 * 
 * Esta função verifica workflows em estado 'waiting_input' que excederam o timeout
 * e executa a ação configurada (encerrar ou voltar ao início)
 * 
 * Deve ser executada via cron job a cada 5 minutos_
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[Timeout Check] Iniciando verificação de timeouts...');

    // Buscar execuções waiting_input que excederam timeout
    const agora = new Date();
    const { data: executions, error: execError } = await supabase
      .from('workflow_executions')
      .select(`
        *,
        workflows:workflow_id (
          id,
          nodes,
          edges
        ),
        leads:lead_id (
          id,
          telefone,
          id_cliente
        )
      `)
      .eq('status', 'waiting_input')
      .not('waiting_since', 'is', null);

    if (execError) {
      console.error('[Timeout Check] Erro ao buscar execuções:', execError);
      throw execError;
    }

    if (!executions || executions.length === 0) {
      console.log('[Timeout Check] Nenhuma execução aguardando input');
      return new Response(
        JSON.stringify({ message: 'Nenhuma execução aguardando input', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`[Timeout Check] Encontradas ${executions.length} execuções aguardando input`);

    let processedCount = 0;

    for (const execution of executions) {
      try {
        const waitingSince = new Date(execution.waiting_since);
        const diffMinutes = (agora.getTime() - waitingSince.getTime()) / (1000 * 60);

        // Buscar node atual para obter timeout configurado
        const workflow = execution.workflows;
        if (!workflow || !workflow.nodes) {
          console.warn(`[Timeout Check] Workflow não encontrado para execução ${execution.id}`);
          continue;
        }

        const currentNode = workflow.nodes.find((n: any) => n.id === execution.current_node_id);
        if (!currentNode || currentNode.type !== 'menu') {
          console.warn(`[Timeout Check] Node de menu não encontrado para execução ${execution.id}`);
          continue;
        }

        const menuData = currentNode.data;
        const timeoutMinutes = menuData.timeout_minutes || 30;

        // Verificar se excedeu timeout
        if (diffMinutes < timeoutMinutes) {
          // Ainda dentro do timeout
          continue;
        }

        console.log(`[Timeout Check] Timeout excedido para execução ${execution.id} (${diffMinutes.toFixed(1)}min > ${timeoutMinutes}min)`);

        const lead = execution.leads;
        if (!lead) {
          console.warn(`[Timeout Check] Lead não encontrado para execução ${execution.id}`);
          continue;
        }

        // Executar ação de timeout
        const timeoutAction = menuData.timeout_action || 'encerrar';

        if (timeoutAction === 'voltar_inicio') {
          // Voltar ao início - criar nova execução
          const startNode = workflow.nodes.find(
            (n: any) => n.type === 'inicio' || n.type === 'trigger'
          );

          if (startNode) {
            await supabase
              .from('workflow_executions')
              .insert({
                workflow_id: execution.workflow_id,
                lead_id: execution.lead_id,
                status: 'running',
                current_node_id: startNode.id,
                context: { leadId: lead.id, phone: lead.telefone },
              });

            console.log(`[Timeout Check] Nova execução criada (voltar início) para lead ${lead.id}`);
          }
        }

        // Enviar mensagem de timeout se configurada
        if (menuData.timeout_message && lead.telefone) {
          // Nota: Aqui você precisaria chamar o serviço de envio de mensagem
          // Por enquanto, apenas logamos
          console.log(`[Timeout Check] Mensagem de timeout deveria ser enviada para ${lead.telefone}`);
          // TODO: Integrar com serviço de envio de mensagem
        }

        // Atualizar execução para timeout
        await supabase
          .from('workflow_executions')
          .update({
            status: 'timeout',
            updated_at: agora.toISOString(),
          })
          .eq('id', execution.id);

        // Atualizar status do lead
        await supabase
          .from('leads')
          .update({
            status_conversa: 'fechada',
            closer_momento_da_ultima_msg: agora.toISOString(),
          })
          .eq('id', lead.id);

        processedCount++;
        console.log(`[Timeout Check] Execução ${execution.id} marcada como timeout`);
      } catch (error) {
        console.error(`[Timeout Check] Erro ao processar execução ${execution.id}:`, error);
      }
    }

    console.log(`[Timeout Check] Processamento concluído. ${processedCount} execuções processadas.`);

    return new Response(
      JSON.stringify({
        message: 'Verificação de timeouts concluída',
        processed: processedCount,
        total: executions.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('[Timeout Check] Erro geral:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
