// @ts-ignore - imports Deno (Supabase Edge Functions)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-ignore - imports ESM URL (Supabase Edge Functions)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: { env: { get(key: string): string | undefined } };

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const WORKFLOW_SECRET = Deno.env.get('WORKFLOW_SECRET') || '';
const UAZAPI_BASE_URL = 'https://smartcrm.uazapi.com';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IncomingPayload {
  phone: string;
  message: string | { text?: string; conversation?: string };
  id_cliente: number;
  fromMe?: boolean; // Indica se a mensagem foi enviada pelo próprio sistema
  from_me?: boolean; // Alternativa (snake_case)
}

interface WorkflowNode {
  id: string;
  type: string;
  data: Record<string, any>;
}

interface WorkflowEdge {
  id: string;
  source: string;
  sourceHandle?: string | null;
  target: string;
}

interface Workflow {
  id: string | number;
  id_cliente: number;
  nome: string;
  nodes: WorkflowNode[] | string;
  edges: WorkflowEdge[] | string;
  is_active: boolean;
  trigger_config?: any;
}

interface WorkflowExecution {
  id: string;
  workflow_id: string | number;
  lead_id?: number;
  id_cliente: number;
  phone: string;
  current_node_id: string;
  status: string;
  context: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

// ---------------------------------------------------------------------------
// Anti-loop: track recently processed messages
// ---------------------------------------------------------------------------

const recentMessages = new Map<string, number>();
const DEDUP_WINDOW_MS = 5000; // ignora msgs duplicadas em 5 segundos

function isDuplicateMessage(phone: string, message: string): boolean {
  const key = `${phone}:${message}`;
  const now = Date.now();
  const lastSeen = recentMessages.get(key);
  if (lastSeen && now - lastSeen < DEDUP_WINDOW_MS) {
    return true;
  }
  recentMessages.set(key, now);
  // Limpa entradas antigas
  for (const [k, v] of recentMessages) {
    if (now - v > DEDUP_WINDOW_MS * 2) recentMessages.delete(k);
  }
  return false;
}

// ---------------------------------------------------------------------------
// UAZAPI helpers
// ---------------------------------------------------------------------------

async function getInstanceToken(id_cliente: number): Promise<string> {
  const { data } = await supabase
    .from('clientes_info')
    .select('instance_id, instance_name')
    .eq('id', id_cliente)
    .single();
  return data?.instance_id || data?.instance_name || '';
}

async function sendText(phone: string, text: string, instanceToken: string): Promise<void> {
  const numero = phone.replace(/\D/g, '');
  console.log('[WMR] Sending text to:', numero, 'length:', text.length);
  const resp = await fetch(`${UAZAPI_BASE_URL}/send/text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', token: instanceToken },
    body: JSON.stringify({ number: numero, text }),
  });
  console.log('[WMR] Send text response status:', resp.status);
}

async function sendMedia(
  phone: string,
  mediaUrl: string,
  caption: string,
  mediaType: string,
  instanceToken: string,
): Promise<void> {
  const numero = phone.replace(/\D/g, '');
  await fetch(`${UAZAPI_BASE_URL}/send/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', token: instanceToken },
    body: JSON.stringify({ number: numero, mediaUrl, caption, mediaType }),
  });
}

// ---------------------------------------------------------------------------
// Supabase execution helpers_
// ---------------------------------------------------------------------------

async function getActiveExecution(
  phone: string,
  id_cliente: number,
): Promise<WorkflowExecution | null> {
  const { data } = await supabase
    .from('workflow_executions')
    .select('*')
    .eq('phone', phone)
    .eq('id_cliente', id_cliente)
    .in('status', ['running', 'waiting_input', 'waiting_timeout'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as WorkflowExecution | null;
}

async function getActiveWorkflow(id_cliente: number): Promise<Workflow | null> {
  const { data } = await supabase
    .from('workflows')
    .select('*')
    .eq('id_cliente', id_cliente)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as Workflow | null;
}

async function getWorkflowById(workflowId: string | number): Promise<Workflow | null> {
  const { data } = await supabase
    .from('workflows')
    .select('*')
    .eq('id', workflowId)
    .maybeSingle();
  return data as Workflow | null;
}

async function upsertExecution(
  exec: Partial<WorkflowExecution> & { id?: string },
): Promise<WorkflowExecution> {
  const { data, error } = await supabase
    .from('workflow_executions')
    .upsert(exec, { onConflict: 'id' })
    .select()
    .single();
  if (error) {
    console.error('[WMR] upsertExecution error:', JSON.stringify(error));
    throw new Error(`upsertExecution failed: ${error.message || JSON.stringify(error)}`);
  }
  return data as WorkflowExecution;
}

async function getLeadData(phone: string, id_cliente: number): Promise<Record<string, any>> {
  const numero = phone.replace(/\D/g, '');
  const { data } = await supabase
    .from('leads')
    .select('*')
    .eq('id_cliente', id_cliente)
    .or(`telefone.eq.${numero},telefone.eq.+${numero}`)
    .maybeSingle();
  return data || { id_cliente, telefone: numero };
}

function parseNodes(raw: WorkflowNode[] | string): WorkflowNode[] {
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return []; }
  }
  return raw || [];
}

function parseEdges(raw: WorkflowEdge[] | string): WorkflowEdge[] {
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return []; }
  }
  return raw || [];
}

function getNextNode(
  currentNodeId: string,
  edges: WorkflowEdge[],
  nodes: WorkflowNode[],
  handle?: string | null,
): WorkflowNode | null {
  const edge = edges.find(
    (e) => e.source === currentNodeId && (handle ? e.sourceHandle === handle : true),
  );
  if (!edge) return null;
  return nodes.find((n) => n.id === edge.target) || null;
}

// ---------------------------------------------------------------------------
// Helper: normalize input for comparison (remove spaces, special chars, lowercase)
// ---------------------------------------------------------------------------

function normalizeInput(input: string): string {
  if (!input) return '';
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '') // Remove todos os espaços
    .replace(/\n/g, '') // Remove quebras de linha
    .replace(/\r/g, '') // Remove carriage return
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove caracteres invisíveis (zero-width)
    .normalize('NFD') // Normaliza para remover acentos
    .replace(/[\u0300-\u036f]/g, ''); // Remove diacríticos (acentos)
}

// ---------------------------------------------------------------------------
// Helpers Globais de Normalização (Novo para a IA)
// ---------------------------------------------------------------------------

function normalizeForComparison(text?: string | null): string {
  if (!text) return '';
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\s+/g, ' ')
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function isIaEcho(messageText: string | null | undefined, lastIaMessage: string | null | undefined): boolean {
  if (!messageText || !lastIaMessage) return false;
  const incoming = normalizeForComparison(messageText);
  const lastIa = normalizeForComparison(lastIaMessage);

  if (!incoming || !lastIa) return false;
  if (incoming === lastIa) return true;

  const maxDiff = 20;
  const lenDiff = Math.abs(incoming.length - lastIa.length);
  if (lenDiff <= maxDiff) {
    if (
      incoming.startsWith(lastIa) ||
      lastIa.startsWith(incoming) ||
      incoming.endsWith(lastIa) ||
      lastIa.endsWith(incoming)
    ) {
      return true;
    }
  }

  const minLength = Math.min(incoming.length, lastIa.length);
  if (minLength < 15) return false;
  return incoming.includes(lastIa) || lastIa.includes(incoming);
}

// ---------------------------------------------------------------------------
// Helper: get option display text (supports both 'text' and 'label')
// ---------------------------------------------------------------------------

function getOptionText(option: any): string {
  return option?.text || option?.label || option?.value || '';
}

// ---------------------------------------------------------------------------
// Helper: build menu display text
// Agora retorna apenas o texto do menu configurado, sem listar opções.
// As opções são usadas apenas para roteamento interno do fluxo.
// ---------------------------------------------------------------------------

function buildMenuText(menuText: string, options: any[]): string {
  return menuText;
}

// ---------------------------------------------------------------------------
// Weighted random for Randomizador
// ---------------------------------------------------------------------------

function pickRandomSplit(splits: Array<{ id: string; label: string; percentage: number }>): string {
  const rand = Math.random() * 100;
  let cumulative = 0;
  for (const split of splits) {
    cumulative += split.percentage;
    if (rand < cumulative) return split.id;
  }
  return splits[splits.length - 1].id;
}

// ---------------------------------------------------------------------------
// Logging functions for workflow execution
// ---------------------------------------------------------------------------

async function logWorkflowStart(
  workflowId: string,
  executionId: string,
  leadId: number | null,
  idCliente: number
): Promise<void> {
  try {
    await supabase.from('workflow_logs').insert({
      workflow_id: workflowId,
      execution_id: executionId,
      lead_id: leadId,
      node_id: 'workflow_start',
      node_type: 'workflow',
      status: 'started',
      input_data: { workflow_id: workflowId, lead_id: leadId },
      id_cliente: idCliente,
    });
  } catch (error) {
    console.error('[WMR] Erro ao logar início do workflow:', error);
  }
}

async function logNodeExecution(
  executionId: string,
  nodeId: string,
  nodeType: string,
  workflowId: string,
  leadId: number | null,
  idCliente: number,
  inputData?: any
): Promise<void> {
  try {
    await supabase.from('workflow_logs').insert({
      execution_id: executionId,
      workflow_id: workflowId,
      node_id: nodeId,
      node_type: nodeType,
      status: 'started',
      input_data: inputData || {},
      lead_id: leadId,
      id_cliente: idCliente,
    });
  } catch (error) {
    console.error('[WMR] Erro ao logar execução do node:', error);
  }
}

async function logNodeCompletion(
  executionId: string,
  nodeId: string,
  workflowId: string,
  leadId: number | null,
  idCliente: number,
  outputData?: any,
  executionTimeMs?: number
): Promise<void> {
  try {
    await supabase.from('workflow_logs').insert({
      execution_id: executionId,
      workflow_id: workflowId,
      node_id: nodeId,
      status: 'completed',
      output_data: outputData || {},
      execution_time_ms: executionTimeMs,
      lead_id: leadId,
      id_cliente: idCliente,
    });
  } catch (error) {
    console.error('[WMR] Erro ao logar conclusão do node:', error);
  }
}

async function logNodeError(
  executionId: string,
  nodeId: string,
  workflowId: string,
  leadId: number | null,
  idCliente: number,
  errorMessage: string,
  context?: any
): Promise<void> {
  try {
    await supabase.from('workflow_logs').insert({
      execution_id: executionId,
      workflow_id: workflowId,
      node_id: nodeId,
      status: 'error',
      error_message: errorMessage,
      output_data: context || {},
      lead_id: leadId,
      id_cliente: idCliente,
    });
  } catch (error) {
    console.error('[WMR] Erro ao logar erro do workflow:', error);
  }
}

async function logNodeWaiting(
  executionId: string,
  nodeId: string,
  workflowId: string,
  leadId: number | null,
  idCliente: number,
  waitReason: string,
  context?: any
): Promise<void> {
  try {
    await supabase.from('workflow_logs').insert({
      execution_id: executionId,
      workflow_id: workflowId,
      node_id: nodeId,
      status: 'waiting',
      input_data: { wait_reason: waitReason, ...(context || {}) },
      lead_id: leadId,
      id_cliente: idCliente,
    });
  } catch (error) {
    console.error('[WMR] Erro ao logar espera do node:', error);
  }
}

// ---------------------------------------------------------------------------
// Core execution engine
// ---------------------------------------------------------------------------

async function executeWorkflow(
  workflow: Workflow,
  startNode: WorkflowNode,
  execution: WorkflowExecution,
  instanceToken: string,
  incomingMessage: string,
): Promise<void> {
  const nodes = parseNodes(workflow.nodes);
  const edges = parseEdges(workflow.edges);
  let leadData = execution.context?.leadData || {};
  const phone = execution.phone;
  const workflowId = String(workflow.id);
  const leadId = execution.lead_id || null;
  const idCliente = execution.id_cliente;

  // Se leadData está vazio ou não tem nome, buscar do banco
  if ((!leadData.nome && !leadData.name) && leadId) {
    const { data: lead } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();
    if (lead) {
      leadData = { ...leadData, ...lead };
      // Atualizar contexto com leadData completo
      execution.context = { ...execution.context, leadData };
    }
  }
  
  // Se ainda não tem nome e temos telefone, tentar buscar pelo telefone
  if ((!leadData.nome && !leadData.name) && phone) {
    const telefoneLimpo = phone.replace(/\D/g, '');
    const { data: lead } = await supabase
      .from('leads')
      .select('*')
      .eq('id_cliente', idCliente)
      .or(`telefone.eq.${telefoneLimpo},telefone.eq.+${telefoneLimpo}`)
      .maybeSingle();
    if (lead) {
      leadData = { ...leadData, ...lead };
      // Atualizar contexto com leadData completo
      execution.context = { ...execution.context, leadData };
    }
  }

  // Log início do workflow
  await logWorkflowStart(workflowId, execution.id, leadId, idCliente);

  let currentNode: WorkflowNode | null = startNode;
  let maxSteps = 50; // Proteção contra loops infinitos

  while (currentNode && maxSteps-- > 0) {
    const nodeType = currentNode.type;
    const nodeData = currentNode.data || {};
    const nodeStartTime = Date.now();

    console.log('[WMR] Executing node:', currentNode.id, 'type:', nodeType);

    // Log entrada no node
    await logNodeExecution(
      execution.id,
      currentNode.id,
      nodeType,
      workflowId,
      leadId,
      idCliente,
      {
        node_data: nodeData,
        context: execution.context,
        incoming_message: incomingMessage,
      }
    );

    await supabase
      .from('workflow_executions')
      .update({ current_node_id: currentNode.id, status: 'running', updated_at: new Date().toISOString() })
      .eq('id', execution.id);

    if (nodeType === 'inicio' || nodeType === 'trigger') {
      const executionTime = Date.now() - nodeStartTime;
      await logNodeCompletion(execution.id, currentNode.id, workflowId, leadId, idCliente, { skipped: true }, executionTime);
      currentNode = getNextNode(currentNode.id, edges, nodes);
      continue;
    }

    if (nodeType === 'message') {
      try {
        const text = (nodeData.message || nodeData.content || '').replace(
          /\{\{([^}]+)\}\}/g,
          (_: string, key: string) => leadData[key.trim()] ?? '',
        );

        if (nodeData.mediaUrl) {
          await sendMedia(phone, nodeData.mediaUrl, text, nodeData.mediaType || 'image', instanceToken);
        } else if (text) {
          await sendText(phone, text, instanceToken);
        }

        const executionTime = Date.now() - nodeStartTime;
        await logNodeCompletion(
          execution.id,
          currentNode.id,
          workflowId,
          leadId,
          idCliente,
          { message_sent: text || 'media', media_type: nodeData.mediaType },
          executionTime
        );
      } catch (error: any) {
        if (currentNode) {
          await logNodeError(execution.id, currentNode.id, workflowId, leadId, idCliente, error.message || 'Erro ao enviar mensagem', { error });
        }
      }
      currentNode = getNextNode(currentNode.id, edges, nodes);
      continue;
    }

    if (nodeType === 'menu') {
      try {
        let menuText: string = nodeData.message || nodeData.question || '';
        
        // Substituir variáveis no texto do menu ({{nome}}, {{telefone}}, etc.)
        menuText = menuText.replace(
          /\{\{([^}]+)\}\}/g,
          (_: string, key: string) => {
            const trimmedKey = key.trim().toLowerCase();
            let replacement = '';
            
            switch (trimmedKey) {
              case 'nome':
                replacement = leadData.nome || leadData.name || 'Cliente';
                break;
              case 'telefone':
              case 'phone':
                replacement = leadData.telefone || phone.replace(/\D/g, '') || '';
                break;
              case 'etapa':
                replacement = leadData.id_funil_etapa?.toString() || leadData.etapa || '';
                break;
              case 'vendedor':
                replacement = leadData.nome_vendedor || leadData.vendedor || '';
                break;
              default:
                const leadDataKey = Object.keys(leadData).find(
                  k => k.toLowerCase() === trimmedKey
                );
                if (leadDataKey && leadData[leadDataKey] !== undefined && leadData[leadDataKey] !== null) {
                  replacement = String(leadData[leadDataKey]);
                } else if (execution.context) {
                  const contextKey = Object.keys(execution.context).find(
                    k => k.toLowerCase() === trimmedKey
                  );
                  if (contextKey && execution.context[contextKey] !== undefined && execution.context[contextKey] !== null) {
                    replacement = String(execution.context[contextKey]);
                  }
                }
                break;
            }
            return replacement;
          }
        );
        
        const options: any[] = nodeData.options || [];

        const fullText = buildMenuText(menuText, options);
        await sendText(phone, fullText, instanceToken);

        await supabase
          .from('workflow_executions')
          .update({
            status: 'waiting_input',
            current_node_id: currentNode.id,
            context: { ...execution.context, leadData, menuNodeId: currentNode.id },
            updated_at: new Date().toISOString(),
          })
          .eq('id', execution.id);

        await logNodeWaiting(
          execution.id,
          currentNode.id,
          workflowId,
          leadId,
          idCliente,
          'menu_awaiting_input',
          { menu_text: menuText, options_count: options.length }
        );
      } catch (error: any) {
        if (currentNode) {
          await logNodeError(execution.id, currentNode.id, workflowId, leadId, idCliente, error.message || 'Erro ao enviar menu', { error });
        }
      }
      return;
    }

    if (nodeType === 'condition') {
      try {
        const operator: string = nodeData.operator || 'equals';
        const value: string = nodeData.value || '';
        const mensagemUsuario =
          (incomingMessage ?? '') ||
          execution.context?.mensagem_usuario ||
          '';

        let conditionMet = false;
        switch (operator) {
          case 'equals': conditionMet = mensagemUsuario.toLowerCase().trim() === value.toLowerCase().trim(); break;
          case 'contains': conditionMet = mensagemUsuario.toLowerCase().includes(value.toLowerCase()); break;
          case 'starts_with': conditionMet = mensagemUsuario.toLowerCase().startsWith(value.toLowerCase()); break;
          case 'ends_with': conditionMet = mensagemUsuario.toLowerCase().endsWith(value.toLowerCase()); break;
          default: conditionMet = false;
        }

        const handle = conditionMet ? 'true' : 'false';
        const executionTime = Date.now() - nodeStartTime;
        await logNodeCompletion(
          execution.id,
          currentNode.id,
          workflowId,
          leadId,
          idCliente,
          {
            operator,
            value,
            mensagem_usuario: mensagemUsuario,
            condition_met: conditionMet,
            next_handle: handle,
          },
          executionTime
        );
        currentNode = getNextNode(currentNode.id, edges, nodes, handle) || getNextNode(currentNode.id, edges, nodes);
      } catch (error: any) {
        if (currentNode) {
          await logNodeError(execution.id, currentNode.id, workflowId, leadId, idCliente, error.message || 'Erro ao avaliar condição', { error });
          currentNode = getNextNode(currentNode.id, edges, nodes);
        }
      }
      continue;
    }

    if (nodeType === 'delay') {
      try {
        const duration = nodeData.duration || 0;
        const unit = nodeData.unit || 'minutes';
        
        let delayMs = 0;
        switch (unit) {
          case 'seconds':
            delayMs = duration * 1000;
            break;
          case 'minutes':
            delayMs = duration * 60 * 1000;
            break;
          case 'hours':
            delayMs = duration * 3600 * 1000;
            break;
        }

        const nextNode = getNextNode(currentNode.id, edges, nodes);

        if (delayMs > 0 && nextNode) {
          const resumeAt = new Date(Date.now() + delayMs).toISOString();
          await supabase
            .from('workflow_executions')
            .update({
              status: 'waiting_timeout',
              current_node_id: currentNode.id,
              context: {
                ...execution.context,
                leadData,
                delay_next_node: nextNode.id,
                delay_resume_at: resumeAt,
              },
              updated_at: new Date().toISOString(),
            })
            .eq('id', execution.id);

          const unitLabel = unit === 'hours' ? 'horas' : unit === 'minutes' ? 'minutos' : 'segundos';
          await logNodeWaiting(
            execution.id,
            currentNode.id,
            workflowId,
            leadId,
            idCliente,
            'delay_awaiting_timeout',
            { delay_ms: delayMs, duration, unit, unit_label: unitLabel, resume_at: resumeAt, next_node: nextNode.id }
          );
          return;
        }

        const executionTime = Date.now() - nodeStartTime;
        await logNodeCompletion(execution.id, currentNode.id, workflowId, leadId, idCliente, { delay_skipped: true }, executionTime);
        currentNode = nextNode;
      } catch (error: any) {
        if (currentNode) {
          await logNodeError(execution.id, currentNode.id, workflowId, leadId, idCliente, error.message || 'Erro ao processar delay', { error });
          currentNode = getNextNode(currentNode.id, edges, nodes);
        }
      }
      continue;
    }

    if (nodeType === 'randomizador') {
      try {
        const splits: Array<{ id: string; label: string; percentage: number }> =
          nodeData.splits || [
            { id: '1', label: 'Caminho A', percentage: 50 },
            { id: '2', label: 'Caminho B', percentage: 50 },
          ];

        const pickedId = pickRandomSplit(splits);
        const handle = `split-${pickedId}`;
        const executionTime = Date.now() - nodeStartTime;
        await logNodeCompletion(
          execution.id,
          currentNode.id,
          workflowId,
          leadId,
          idCliente,
          { splits, picked_id: pickedId, handle },
          executionTime
        );
        currentNode = getNextNode(currentNode.id, edges, nodes, handle) || getNextNode(currentNode.id, edges, nodes);
      } catch (error: any) {
        if (currentNode) {
          await logNodeError(execution.id, currentNode.id, workflowId, leadId, idCliente, error.message || 'Erro ao processar randomizador', { error });
          currentNode = getNextNode(currentNode.id, edges, nodes);
        }
      }
      continue;
    }

    if (nodeType === 'ia') {
      try {
        const telefoneLimpo = phone.replace(/\D/g, '');
        const telefoneComSufixo = `${telefoneLimpo}@s.whatsapp.net`;

        const { data: historicoRaw } = await supabase
          .from('agente_conversacional_whatsapp')
          .select('mensagem, tipo, timestamp')
          .eq('id_cliente', execution.id_cliente)
          .or(`telefone_id.eq.${telefoneLimpo},telefone_id.eq.${telefoneComSufixo}`)
          .order('timestamp', { ascending: true })
          .limit(50);

        const historico = (historicoRaw || []).map((msg: any) => ({
          role: msg.tipo ? 'assistant' : 'user',
          content: msg.mensagem,
        }));

        const iaPayload = {
          execution_id: execution.id,
          workflow_id: execution.workflow_id,
          node_id: currentNode.id,
          lead_id: leadData.id || null,
          telefone: phone,
          id_cliente: execution.id_cliente,
          instance_id: instanceToken,
          config: {
            system_prompt: nodeData.systemPrompt || '',
          },
          context: {
            nome: leadData.nome || 'Cliente',
            mensagem_usuario: incomingMessage,
            dados_lead: leadData,
            historico,
          },
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        let aiResponse: string;
        try {
          const httpResponse = await fetch(
            'https://webhook.dev.usesmartcrm.com/webhook/workflow-ai',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(iaPayload),
              signal: controller.signal,
            },
          );
          clearTimeout(timeoutId);
          const result = await httpResponse.json();
          if (!result.success) throw new Error(result.error || 'IA retornou success: false');
          aiResponse = result.response;
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            throw new Error('Timeout: IA nao respondeu em 30 segundos');
          }
          throw fetchError;
        }

        await sendText(phone, aiResponse, instanceToken);

        execution.context = {
          ...execution.context,
          leadData,
          lastAiResponse: aiResponse,
          mensagem_usuario: incomingMessage,
        };

        const executionTime = Date.now() - nodeStartTime;
        await logNodeCompletion(
          execution.id,
          currentNode.id,
          workflowId,
          leadId,
          idCliente,
          { ai_response: aiResponse, prompt: nodeData.systemPrompt },
          executionTime
        );

        // Modo Conversa Flexível
        const isConversationMode =
          nodeData.conversationMode === true ||
          nodeData.conversationMode === 'true' ||
          String(nodeData.conversationMode).toLowerCase() === 'true';

        if (isConversationMode) {
          console.log('[WMR] IA conversationMode ativo, pausando workflow');
          await supabase
            .from('workflow_executions')
            .update({
              status: 'waiting_input',
              current_node_id: currentNode.id,
              context: execution.context,
              updated_at: new Date().toISOString(),
            })
            .eq('id', execution.id);

          await logNodeWaiting(
            execution.id,
            currentNode.id,
            workflowId,
            leadId,
            idCliente,
            'ia_awaiting_input',
            {}
          );
          return; // Para o loop aqui
        }
      } catch (err: any) {
        console.error('[WMR] IA node error:', err.message);
        const errorMsg = nodeData.errorMessage || 'Desculpe, ocorreu um erro. Tente novamente.';
        await sendText(phone, errorMsg, instanceToken);

        await logNodeError(
          execution.id,
          currentNode.id,
          workflowId,
          leadId,
          idCliente,
          err.message || 'Erro na IA',
          { error: err, error_message_sent: errorMsg }
        );

        const errorNext = getNextNode(currentNode.id, edges, nodes, 'error');
        currentNode = errorNext || getNextNode(currentNode.id, edges, nodes);
        continue;
      }

      currentNode = getNextNode(currentNode.id, edges, nodes);
      continue;
    }

    if (nodeType === 'transfer_department') {
      try {
        const raw = nodeData.id_departamento;
        const idDepartamento =
          raw != null && raw !== ''
            ? (() => {
                const n = Number(raw);
                return Number.isNaN(n) ? null : n;
              })()
            : null;

        if (idDepartamento != null) {
          const numero = phone.replace(/\D/g, '');
          const targetId = (leadData && (leadData as any).id) || leadId || null;

          let query = supabase
            .from('leads')
            .update({ id_departamento: idDepartamento, updated_at: new Date().toISOString() })
            .eq('id_cliente', idCliente);

          if (targetId != null) {
            query = query.eq('id', targetId);
          } else {
            query = query.or(`telefone.eq.${numero},telefone.eq.+${numero}`);
          }

          const { error: updateErr } = await query.select('id').maybeSingle();
          if (updateErr) {
            console.error('[WMR] Erro ao transferir lead para departamento:', updateErr);
          } else {
            console.log(
              '[WMR] Lead transferido para departamento',
              idDepartamento,
              'via',
              leadId != null ? 'leadId' : leadData?.id ? 'leadData.id' : 'telefone'
            );
          }
        }
        const executionTime = Date.now() - nodeStartTime;
        await logNodeCompletion(
          execution.id,
          currentNode.id,
          workflowId,
          leadId,
          idCliente,
          { transfer_department: idDepartamento },
          executionTime
        );
        currentNode = getNextNode(currentNode.id, edges, nodes);
      } catch (error: any) {
        if (currentNode) {
          await logNodeError(execution.id, currentNode.id, workflowId, leadId, idCliente, error.message || 'Erro ao transferir departamento', { error });
          currentNode = getNextNode(currentNode.id, edges, nodes);
        }
      }
      continue;
    }

    if (nodeType === 'end') {
      const executionTime = Date.now() - nodeStartTime;
      await logNodeCompletion(execution.id, currentNode.id, workflowId, leadId, idCliente, { workflow_completed: true }, executionTime);
      if (leadId != null) {
        await supabase
          .from('leads')
          .update({ chatbot: false, updated_at: new Date().toISOString() })
          .eq('id', leadId)
          .eq('id_cliente', idCliente);
        console.log('[WMR] Lead', leadId, 'chatbot definido como false (fim do workflow)');
      }
      await supabase
        .from('workflow_executions')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', execution.id);
      return;
    }

    // Unknown node: skip
    console.log('[WMR] Unknown node type, skipping:', nodeType);
    currentNode = getNextNode(currentNode.id, edges, nodes);
  }

  if (maxSteps <= 0) {
    console.error('[WMR] Max steps reached, stopping workflow to prevent infinite loop');
  }

  await supabase
    .from('workflow_executions')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('id', execution.id);
}

// ---------------------------------------------------------------------------
// Generic resume handler - routes based on node type
// ---------------------------------------------------------------------------

async function handleWaitingInputResume(
  execution: WorkflowExecution,
  workflow: Workflow,
  message: string,
  instanceToken: string,
): Promise<void> {
  const nodes = parseNodes(workflow.nodes);
  const currentNode = nodes.find((n) => n.id === execution.current_node_id);

  if (!currentNode) {
    console.log('[WMR] Current node not found, completing execution');
    await supabase
      .from('workflow_executions')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', execution.id);
    return;
  }

  const nodeType = currentNode.type;
  console.log('[WMR] Resuming waiting_input execution, node type:', nodeType, 'node id:', currentNode.id);

  // Route based on node type
  switch (nodeType) {
    case 'menu':
      // Menu nodes have specific resume logic
      await handleMenuResume(execution, workflow, message, instanceToken);
      break;

    case 'ia':
      execution.context = {
        ...execution.context,
        mensagem_usuario: message,
        ia_last_interaction: new Date().toISOString()
      };
      await supabase
        .from('workflow_executions')
        .update({
          status: 'running',
          context: execution.context,
          updated_at: new Date().toISOString(),
        })
        .eq('id', execution.id);
      await executeWorkflow(workflow, currentNode, execution, instanceToken, message);
      break;

    case 'delay':
      // Delay nodes: if waiting_input, delay was likely interrupted by user message
      // Continue from next node (skip the delay since user responded)
      const edges = parseEdges(workflow.edges);
      const nextNode = getNextNode(currentNode.id, edges, nodes);
      if (nextNode) {
        console.log('[WMR] Delay interrupted, continuing to next node:', nextNode.id);
        await executeWorkflow(workflow, nextNode, execution, instanceToken, message);
      } else {
        console.log('[WMR] No next node after delay, completing execution');
        await supabase
          .from('workflow_executions')
          .update({ status: 'completed', updated_at: new Date().toISOString() })
          .eq('id', execution.id);
      }
      break;

    default:
      // Generic fallback: execute workflow continuing normally
      console.log('[WMR] Generic resume for node type:', nodeType);
      await executeWorkflow(workflow, currentNode, execution, instanceToken, message);
      break;
  }
}

// ---------------------------------------------------------------------------
// Menu resume handler
// ---------------------------------------------------------------------------

async function handleMenuResume(
  execution: WorkflowExecution,
  workflow: Workflow,
  message: string,
  instanceToken: string,
): Promise<void> {
  const nodes = parseNodes(workflow.nodes);
  const edges = parseEdges(workflow.edges);
  const menuNodeId: string = execution.context?.menuNodeId || execution.current_node_id;
  const menuNode = nodes.find((n) => n.id === menuNodeId);

  if (!menuNode) {
    await supabase
      .from('workflow_executions')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', execution.id);
    return;
  }

  const options: any[] = menuNode.data?.options || [];
  const normalizedInput = normalizeInput(message);
  const trimmed = message.trim();
  const asNumber = parseInt(trimmed, 10);

  console.log('[WMR] Menu resume - user input:', trimmed, 'normalized:', normalizedInput, 'options count:', options.length);

  // Match by normalized comparison: ID, value, text, label, or sequential number
  let matchedOption = options.find((o) => {
    const optionId = normalizeInput(String(o.id || ''));
    const optionValue = normalizeInput(String(o.value || ''));
    const optionText = normalizeInput(String(o.text || ''));
    const optionLabel = normalizeInput(String(o.label || ''));
    
    return (
      optionId === normalizedInput ||
      optionValue === normalizedInput ||
      optionText === normalizedInput ||
      optionLabel === normalizedInput
    );
  });

  // Fallback: match by sequential number (1, 2, 3...)
  if (!matchedOption && !isNaN(asNumber) && asNumber >= 1 && asNumber <= options.length) {
    matchedOption = options[asNumber - 1];
    console.log('[WMR] Matched by sequential number:', asNumber);
  }

  let nextNode: WorkflowNode | null = null;
  if (matchedOption) {
    console.log('[WMR] Matched option:', matchedOption.id, getOptionText(matchedOption));
    nextNode =
      getNextNode(menuNodeId, edges, nodes, `option-${matchedOption.id}`) ||
      getNextNode(menuNodeId, edges, nodes, matchedOption.id) ||
      getNextNode(menuNodeId, edges, nodes);
  } else {
    console.log('[WMR] No option matched for input:', trimmed);
    console.log('[WMR] Available options:', options.map(o => ({ id: o.id, label: o.label || o.text })));
    
    // Verificar se já houve tentativas anteriores (evitar loop)
    const errorCount = (execution.context?.menuErrorCount || 0) + 1;
    
    if (errorCount >= 3) {
      // Após 3 tentativas, finalizar execução sem enviar mensagem
      console.log('[WMR] Max error attempts reached, completing execution');
      await supabase
        .from('workflow_executions')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', execution.id);
      return;
    }
    
    // Enviar mensagem de erro e manter aguardando (mas incrementar contador)
    const menuText: string = menuNode.data?.message || menuNode.data?.question || '';
    const fullText = buildMenuText(menuText, options);
    
    await sendText(execution.phone, `Opção inválida (tentativa ${errorCount}/3). Por favor, escolha uma das opções:\n${fullText}`, instanceToken);
    
    // Atualizar execução mantendo status waiting_input mas incrementando contador de erros
    await supabase
      .from('workflow_executions')
      .update({ 
        context: { ...execution.context, menuErrorCount: errorCount },
        updated_at: new Date().toISOString() 
      })
      .eq('id', execution.id);
    return;
  }

  if (!nextNode) {
    console.log('[WMR] No next node found after menu option');
    await supabase
      .from('workflow_executions')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', execution.id);
    return;
  }

  await executeWorkflow(workflow, nextNode, execution, instanceToken, message);
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

async function handleRequest(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  if (WORKFLOW_SECRET) {
    const auth = req.headers.get('Authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (token !== WORKFLOW_SECRET) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
  }

  let body: IncomingPayload;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { phone, message, id_cliente, fromMe, from_me } = body;
  if (!phone || !id_cliente) {
    return new Response(JSON.stringify({ error: 'Missing phone or id_cliente' }), { status: 400 });
  }

  // 1. Extração SEGURA do texto ANTES de qualquer validação
  let messageText = '';
  if (typeof message === 'string' && message.trim()) {
    messageText = message;
  } else if (message && typeof message === 'object') {
    const msgObj = message as Record<string, any>;
    messageText = msgObj.text || msgObj.conversation || '';
  } else if (message !== null && message !== undefined) {
    messageText = String(message);
  }

  // 2. Verificação de Ecos e Takeover Humano
  if (fromMe === true || from_me === true) {
    console.log('[WMR] Mensagem do sistema detectada (fromMe/from_me=true). Verificando takeover...');
    
    try {
      const existingExecution = await getActiveExecution(phone, id_cliente);
      
      if (existingExecution) {
        const workflow = await getWorkflowById(existingExecution.workflow_id);
        
        if (workflow) {
          const nodes = parseNodes(workflow.nodes);
          const currentNode = nodes.find((n) => n.id === existingExecution.current_node_id);

          let lead: any = null;
          if (existingExecution.lead_id) {
            const { data: leadData } = await supabase
              .from('leads')
              .select('*')
              .eq('id', existingExecution.lead_id)
              .eq('id_cliente', id_cliente)
              .maybeSingle();
            if (leadData) lead = leadData;
          }

          // Usa a resposta salva no contexto (tempo real) ou faz fallback para o banco
          const lastMsgFromContext = existingExecution.context?.lastAiResponse;
          const lastMsgFromDb = lead?.ultima_msg_ia;
          
          const isEcho = isIaEcho(messageText, lastMsgFromContext) || isIaEcho(messageText, lastMsgFromDb);

          if (isEcho) {
            console.log('[WMR] Eco da IA ignorado para não desligar o modo conversa.');
            return new Response(JSON.stringify({ success: true, reason: 'ignored_ai_echo' }), { 
              status: 200, 
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
            });
          }

          const isHumanTakeover = !!lead && (
            lead.atendimento_humano === true || 
            lead.atendimento_humano === 'true' || 
            lead.atendimento_humano === 1 || 
            lead.atendimento_humano === '1'
          );

          if (!isHumanTakeover) {
            console.log('[WMR] fromMe=true mas sem evidência de atendimento humano ativo. Ignorado.');
            return new Response(JSON.stringify({ success: true, reason: 'ignored_from_me_no_takeover' }), { 
              status: 200, 
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
            });
          }

          // Desativa a IA caso seja nó de IA em Modo Conversa
          if (currentNode && currentNode.type === 'ia') {
            const iaNodeData = currentNode.data || {};
            const isConversationMode = iaNodeData.conversationMode === true || iaNodeData.conversationMode === 'true' || String(iaNodeData.conversationMode).toLowerCase() === 'true';

            if (isConversationMode) {
              console.log('[WMR] Encerrando modo conversa IA por takeover humano.');
              const updatedContext = { ...(existingExecution.context || {}), ia_exit_reason: 'human_takeover' };
              
              await supabase
                .from('workflow_executions')
                .update({ status: 'completed', context: updatedContext, updated_at: new Date().toISOString() })
                .eq('id', existingExecution.id);

              if (existingExecution.lead_id) {
                await supabase
                  .from('leads')
                  .update({ chatbot: false, updated_at: new Date().toISOString() })
                  .eq('id', existingExecution.lead_id)
                  .eq('id_cliente', id_cliente);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('[WMR] Erro ao processar takeover:', err);
    }
    
    return new Response(JSON.stringify({ success: true, reason: 'ignored_from_me' }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
    });
  }

  // 3. Processamento Normal
  if (isDuplicateMessage(phone, messageText)) {
    console.log('[WMR] Duplicate message detected, skipping. phone:', phone);
    return new Response(JSON.stringify({ received: true, skipped: 'duplicate' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const processPromise = (async () => {
    try {
      console.log('[WMR] Processing message from:', phone, 'id_cliente:', id_cliente, 'message:', messageText);

      const instanceToken = await getInstanceToken(id_cliente);
      if (!instanceToken) {
        console.error('[WMR] No instance token found for id_cliente:', id_cliente);
        return;
      }

      const leadData = await getLeadData(phone, id_cliente);
      const activeWorkflow = await getActiveWorkflow(id_cliente);

      let isTriggerMatch = false;
      if (activeWorkflow && messageText) {
        const nodes = parseNodes(activeWorkflow.nodes);
        const startNode = nodes.find((n: any) => n.type === 'inicio' || n.type === 'trigger');
        const triggerConfig = activeWorkflow.trigger_config || startNode?.data || {};
        if (triggerConfig.keyword) {
          const keyword = String(triggerConfig.keyword).toLowerCase();
          if (messageText.toLowerCase().includes(keyword)) {
            isTriggerMatch = true;
            console.log('[WMR] Trigger match detected:', keyword);
          }
        }
      }

      const existingExecution = await getActiveExecution(phone, id_cliente);
      let abortExisting = false;

      if (existingExecution) {
        console.log('[WMR] Found existing execution:', existingExecution.id, 'status:', existingExecution.status);

        if (existingExecution.status === 'waiting_input') {
          const isExpired = existingExecution.updated_at &&
            (Date.now() - new Date(existingExecution.updated_at).getTime() > 60 * 60 * 1000);

          if (isExpired || isTriggerMatch) {
            console.log(`[WMR] Aborting previous menu (expired: ${isExpired}, trigger: ${isTriggerMatch})`);
            await supabase
              .from('workflow_executions')
              .update({ status: 'completed', updated_at: new Date().toISOString() })
              .eq('id', existingExecution.id);
            abortExisting = true;
          }
        }

        if (!abortExisting) {
          const workflow = await getWorkflowById(existingExecution.workflow_id);
          if (!workflow) {
            console.log('[WMR] Workflow not found for execution, completing');
            return;
          }

          existingExecution.context = existingExecution.context || {};
          existingExecution.context.leadData = leadData;

          if (existingExecution.status === 'waiting_input') {
            await handleWaitingInputResume(existingExecution, workflow, messageText, instanceToken);
            return;
          }

          if (existingExecution.status === 'waiting_timeout') {
            console.log('[WMR] Delay interrupted by user message, continuing workflow');
            const workflow = await getWorkflowById(existingExecution.workflow_id);
            if (!workflow) {
              console.log('[WMR] Workflow not found for execution, completing');
              await supabase
                .from('workflow_executions')
                .update({ status: 'completed', updated_at: new Date().toISOString() })
                .eq('id', existingExecution.id);
              return;
            }

            const nodes = parseNodes(workflow.nodes);
            const nextNodeId = existingExecution.context?.delay_next_node;
            
            if (nextNodeId) {
              const nextNode = nodes.find((n) => n.id === nextNodeId);
              if (nextNode) {
                existingExecution.status = 'running';
                existingExecution.current_node_id = nextNode.id;
                existingExecution.context = {
                  ...existingExecution.context,
                  leadData,
                  delay_cancelled: true,
                  mensagem_usuario: messageText,
                };
                
                await supabase
                  .from('workflow_executions')
                  .update({
                    status: 'running',
                    current_node_id: nextNode.id,
                    context: existingExecution.context,
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', existingExecution.id);

                await executeWorkflow(workflow, nextNode, existingExecution, instanceToken, messageText);
                return;
              }
            }
            
            await supabase
              .from('workflow_executions')
              .update({ status: 'completed', updated_at: new Date().toISOString() })
              .eq('id', existingExecution.id);
            return;
          }

          const nodes = parseNodes(workflow.nodes);
          const currentNode = nodes.find((n) => n.id === existingExecution.current_node_id);
          if (currentNode) {
            await executeWorkflow(workflow, currentNode, existingExecution, instanceToken, messageText);
          }
          return;
        }
      }

      const workflow = activeWorkflow;
      if (!workflow) {
        console.log('[WMR] No active workflow found for id_cliente:', id_cliente);
        return;
      }

      console.log('[WMR] Found workflow:', workflow.id, workflow.nome);

      const nodes = parseNodes(workflow.nodes);
      const edges = parseEdges(workflow.edges);

      const startNode =
        nodes.find((n) => n.type === 'inicio') ||
        nodes.find((n) => n.type === 'trigger') ||
        nodes.find((n) => {
          const incomingEdges = edges.filter((e) => e.target === n.id);
          return incomingEdges.length === 0;
        });

      if (!startNode) {
        console.error('[WMR] No start node found in workflow');
        return;
      }

      // --- REGRA DO DIEGO: Controle de Webhook Externo ---
      const triggerConfig = workflow.trigger_config || startNode.data || {};
      const triggerType = triggerConfig.triggerType ?? startNode.data?.triggerType ?? 'message_received';

      if (triggerType === 'webhook_external') {
        console.log('[WMR] Workflow acionado por Webhook Externo - ignorar mensagem do usuário');
        return;
      }

      // Verificar palavra-chave (keyword)
      if (triggerConfig.keyword && messageText) {
        const keyword: string = String(triggerConfig.keyword).toLowerCase();
        if (!messageText.toLowerCase().includes(keyword)) {
          console.log('[WMR] Keyword not matched. Expected:', keyword, 'Got:', messageText);
          return;
        }
      } else {
        if (leadData.chatbot !== true) {
          console.log('[WMR] Lead não pode iniciar workflow (chatbot deve ser true)');
          return;
        }
      }

      // Buscar ou criar lead se necessário
      let leadId: number | null = leadData.id || null;
      if (!leadId && leadData.telefone) {
        const telefoneLimpo = phone.replace(/\D/g, '');
        const { data: existingLead } = await supabase
          .from('leads')
          .select('id')
          .eq('id_cliente', id_cliente)
          .or(`telefone.eq.${telefoneLimpo},telefone.eq.+${telefoneLimpo}`)
          .maybeSingle();
        leadId = existingLead?.id || null;
      }

      const execution = await upsertExecution({
        workflow_id: String(workflow.id),
        lead_id: leadId || undefined,
        id_cliente,
        phone,
        current_node_id: startNode.id,
        status: 'running',
        context: { leadData, mensagem_usuario: messageText },
      });

      console.log('[WMR] Created execution:', execution.id);
      await executeWorkflow(workflow, startNode, execution, instanceToken, messageText);
      console.log('[WMR] Workflow execution finished');
    } catch (err: any) {
      console.error('[WMR] ERROR:', err?.message || err?.details || JSON.stringify(err));
      console.error('[WMR] ERROR stack:', err?.stack);
    }
  })();

  try {
    // @ts-ignore
    EdgeRuntime.waitUntil(processPromise);
  } catch {
    await processPromise;
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

serve(handleRequest);