// @ts-ignore - imports Deno (Supabase Edge Functions)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-ignore - imports ESM URL (Supabase Edge Functions)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============================================================================
// FUNÇÃO PÚBLICA PARA WEBHOOKS EXTERNOS
// ============================================================================
// Esta edge function é configurada para aceitar requisições públicas (sem autenticação)
// permitindo que formulários e landing pages chamem o webhook diretamente.
//
// IMPORTANTE: Para tornar esta função completamente pública, você também precisa:_
// 1. No Dashboard do Supabase: Edge Functions > workflow-webhook-trigger > Settings
// 2. Marcar a função como "Public" ou desabilitar a verificação de autenticação
//
// A segurança é garantida pelo path único configurado no workflow (ex: /gabriel-tester)
// que funciona como um token de acesso secreto.
// ============================================================================

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
// Webhook deduplication: track recently processed webhooks
// ---------------------------------------------------------------------------

const recentWebhooks = new Map<string, number>();
const WEBHOOK_DEDUP_WINDOW_MS = 5000; // ignora webhooks duplicados em 5 segundos

function isDuplicateWebhook(normalizedPhone: string, webhookPath: string): boolean {
  const key = `${normalizedPhone}:${webhookPath}`;
  const now = Date.now();
  const lastSeen = recentWebhooks.get(key);
  if (lastSeen && now - lastSeen < WEBHOOK_DEDUP_WINDOW_MS) {
    return true;
  }
  recentWebhooks.set(key, now);
  // Limpa entradas antigas
  for (const [k, v] of recentWebhooks) {
    if (now - v > WEBHOOK_DEDUP_WINDOW_MS * 2) recentWebhooks.delete(k);
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
  console.log('[WWH] Sending text to:', numero, 'length:', text.length);
  const resp = await fetch(`${UAZAPI_BASE_URL}/send/text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', token: instanceToken },
    body: JSON.stringify({ number: numero, text }),
  });
  console.log('[WWH] Send text response status:', resp.status);
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
// Supabase execution helpers
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
    console.error('[WWH] upsertExecution error:', JSON.stringify(error));
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
// Helper: generate secure final path from client path
// ---------------------------------------------------------------------------

function generateSecurePath(clientPath: string): string {
  if (!clientPath) return '';
  
  // Remove leading slash if present for processing
  const cleanClientPath = clientPath.startsWith('/') ? clientPath.slice(1) : clientPath;
  
  // Generate secret suffix (8 characters from UUID)
  const secret = crypto.randomUUID()
    .replace(/-/g, '')
    .slice(0, 8);
  
  // Combine clientPath with secret
  const finalPath = `/${cleanClientPath}_${secret}`;
  
  return finalPath;
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
// Helper: get option display text (supports both 'text' and 'label')
// ---------------------------------------------------------------------------

function getOptionText(option: any): string {
  return option?.text || option?.label || option?.value || '';
}

// ---------------------------------------------------------------------------
// Helper: build menu display text (avoids duplication)
// ---------------------------------------------------------------------------

function buildMenuText(menuText: string, options: any[]): string {
  let fullText = menuText;
  // Só adiciona opções numeradas se o menuText não já contém numeração (1-, 1., 1), etc.)
  if (options.length > 0 && !/\d\s*[-–.)]\s*\S/.test(menuText)) {
    fullText += '\n' + options.map((o: any, i: number) => `${i + 1}. ${getOptionText(o)}`).join('\n');
  }
  return fullText;
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
    console.error('[WWH] Erro ao logar início do workflow:', error);
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
    console.error('[WWH] Erro ao logar execução do node:', error);
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
    console.error('[WWH] Erro ao logar conclusão do node:', error);
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
    console.error('[WWH] Erro ao logar erro do workflow:', error);
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
    console.error('[WWH] Erro ao logar espera do node:', error);
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

    console.log('[WWH] Executing node:', currentNode.id, 'type:', nodeType);

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
        let text = (nodeData.message || nodeData.content || '');
        
        // Substituir variáveis no texto da mensagem ({{nome}}, {{telefone}}, etc.)
        text = text.replace(
          /\{\{([^}]+)\}\}/g,
          (_: string, key: string) => {
            const trimmedKey = key.trim().toLowerCase();
            let replacement = '';
            
            // Valores padrão comuns (case-insensitive)
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
                // Buscar no leadData (case-insensitive)
                const leadDataKey = Object.keys(leadData).find(
                  k => k.toLowerCase() === trimmedKey
                );
                if (leadDataKey && leadData[leadDataKey] !== undefined && leadData[leadDataKey] !== null) {
                  replacement = String(leadData[leadDataKey]);
                } else if (execution.context) {
                  // Buscar no contexto da execução
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
        
        // Debug: log leadData para verificar se está populado
        console.log('[WWH] Menu - leadData:', JSON.stringify(leadData));
        console.log('[WWH] Menu - menuText original:', menuText);
        
        // Substituir variáveis no texto do menu ({{nome}}, {{telefone}}, etc.)
        menuText = menuText.replace(
          /\{\{([^}]+)\}\}/g,
          (_: string, key: string) => {
            const trimmedKey = key.trim().toLowerCase();
            let replacement = '';
            
            // Valores padrão comuns (case-insensitive)
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
                // Buscar no leadData (case-insensitive)
                const leadDataKey = Object.keys(leadData).find(
                  k => k.toLowerCase() === trimmedKey
                );
                if (leadDataKey && leadData[leadDataKey] !== undefined && leadData[leadDataKey] !== null) {
                  replacement = String(leadData[leadDataKey]);
                } else if (execution.context) {
                  // Buscar no contexto da execução
                  const contextKey = Object.keys(execution.context).find(
                    k => k.toLowerCase() === trimmedKey
                  );
                  if (contextKey && execution.context[contextKey] !== undefined && execution.context[contextKey] !== null) {
                    replacement = String(execution.context[contextKey]);
                  }
                }
                break;
            }
            
            console.log(`[WWH] Menu - substituindo {{${key}}} por "${replacement}"`);
            return replacement;
          }
        );
        
        console.log('[WWH] Menu - menuText após substituição:', menuText);
        
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

        // Log espera do menu
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
        // Sempre priorizar a mensagem mais recente recebida nesta execução.
        // Se não houver (execução automática), cair para o que estiver salvo no contexto.
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

          // Log espera do delay
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
      } catch (err: any) {
        console.error('[WWH] IA node error:', err.message);
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
            console.error('[WWH] Erro ao transferir lead para departamento:', updateErr);
          } else {
            console.log(
              '[WWH] Lead transferido para departamento',
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
        console.log('[WWH] Lead', leadId, 'chatbot definido como false (fim do workflow)');
      }
      await supabase
        .from('workflow_executions')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', execution.id);
      return;
    }

    // Unknown node: skip
    console.log('[WWH] Unknown node type, skipping:', nodeType);
    currentNode = getNextNode(currentNode.id, edges, nodes);
  }

  if (maxSteps <= 0) {
    console.error('[WWH] Max steps reached, stopping workflow to prevent infinite loop');
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
    console.log('[WWH] Current node not found, completing execution');
    await supabase
      .from('workflow_executions')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', execution.id);
    return;
  }

  const nodeType = currentNode.type;
  console.log('[WWH] Resuming waiting_input execution, node type:', nodeType, 'node id:', currentNode.id);

  // Route based on node type
  switch (nodeType) {
    case 'menu':
      // Menu nodes have specific resume logic
      await handleMenuResume(execution, workflow, message, instanceToken);
      break;

    case 'ia':
      // IA nodes: execute workflow with message as input
      // The message will be used as mensagem_usuario in the IA context (incomingMessage parameter)
      await executeWorkflow(workflow, currentNode, execution, instanceToken, message);
      break;

    case 'delay':
      // Delay nodes: if waiting_input, delay was likely interrupted by user message
      // Continue from next node (skip the delay since user responded)
      const edges = parseEdges(workflow.edges);
      const nextNode = getNextNode(currentNode.id, edges, nodes);
      if (nextNode) {
        console.log('[WWH] Delay interrupted, continuing to next node:', nextNode.id);
        await executeWorkflow(workflow, nextNode, execution, instanceToken, message);
      } else {
        console.log('[WWH] No next node after delay, completing execution');
        await supabase
          .from('workflow_executions')
          .update({ status: 'completed', updated_at: new Date().toISOString() })
          .eq('id', execution.id);
      }
      break;

    default:
      // Generic fallback: execute workflow continuing normally
      console.log('[WWH] Generic resume for node type:', nodeType);
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

  console.log('[WWH] Menu resume - user input:', trimmed, 'normalized:', normalizedInput, 'options count:', options.length);

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
    console.log('[WWH] Matched by sequential number:', asNumber);
  }

  let nextNode: WorkflowNode | null = null;
  if (matchedOption) {
    console.log('[WWH] Matched option:', matchedOption.id, getOptionText(matchedOption));
    nextNode =
      getNextNode(menuNodeId, edges, nodes, `option-${matchedOption.id}`) ||
      getNextNode(menuNodeId, edges, nodes, matchedOption.id) ||
      getNextNode(menuNodeId, edges, nodes);
  } else {
    console.log('[WWH] No option matched for input:', trimmed);
    console.log('[WWH] Available options:', options.map(o => ({ id: o.id, label: o.label || o.text })));
    
    // Verificar se já houve tentativas anteriores (evitar loop)
    const errorCount = (execution.context?.menuErrorCount || 0) + 1;
    
    if (errorCount >= 3) {
      // Após 3 tentativas, finalizar execução sem enviar mensagem
      console.log('[WWH] Max error attempts reached, completing execution');
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
    console.log('[WWH] No next node found after menu option');
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
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });

  // Esta função é pública e não requer autenticação para webhooks externos
  // A segurança é garantida pelo path único configurado no workflow
  // Se WORKFLOW_SECRET estiver configurado, ele será usado como autenticação opcional
  // mas não é obrigatório para permitir chamadas de formulários e landing pages
  if (WORKFLOW_SECRET) {
    const auth = req.headers.get('Authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    // Se o token for fornecido, valida. Se não for fornecido, permite continuar (função pública)
    if (token && token !== WORKFLOW_SECRET) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }
  }

  const url = new URL(req.url);
  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: corsHeaders });
  }

  // Path pode vir como query param (?path=/campanha) ou no body
  let webhookPath = url.searchParams.get('path') || body.path || null;
  
  // Normalizar o path: remover barras no início e espaços
  if (webhookPath) {
    webhookPath = webhookPath.replace(/^\/+/, '').trim();
  }
  
  if (!webhookPath) {
    return new Response(
      JSON.stringify({ error: 'Parâmetro "path" é obrigatório. Ex: ?path=/campanha-blackfriday' }),
      { status: 400, headers: corsHeaders },
    );
  }

  const { phone, path: _ignoredPath, data: nestedData, ...rootExtra } = body;
  // Mescla campos raiz com campos aninhados em `data` (se existir)
  const extraData = nestedData ? { ...nestedData, ...rootExtra } : rootExtra;
  if (!phone) {
    return new Response(JSON.stringify({ error: 'Campo "phone" é obrigatório no body' }), { status: 400, headers: corsHeaders });
  }

  const normalizedPhone = String(phone).replace(/\D/g, '');

  // Proteção contra execução duplicada de webhook
  const dedupKey = `${normalizedPhone}:${webhookPath}`;
  if (isDuplicateWebhook(normalizedPhone, webhookPath)) {
    console.log('[WWH] Duplicate webhook ignored:', dedupKey);
    return new Response(
      JSON.stringify({ duplicate: true }),
      {
        status: 200,
        headers: corsHeaders
      }
    );
  }

  const processPromise = (async () => {
    try {
      console.log('[WWH] Webhook externo recebido. path:', webhookPath, 'phone:', normalizedPhone);

      // Buscar workflow pelo path configurado no nó de início
      const { data: allWorkflows } = await supabase.from('workflows').select('*').eq('is_active', true);
      
      console.log('[WWH] Total de workflows ativos:', allWorkflows?.length || 0);
      
      // Coletar todos os paths disponíveis para debug
      const availablePaths: Array<{ nome: string; path: string }> = [];
      
      let workflow: any = null;
      
      for (const w of (allWorkflows || [])) {
        const nodes = parseNodes(w.nodes);
        const startNode = nodes.find((n: any) => n.type === 'inicio' || n.type === 'trigger');
        if (startNode?.data?.triggerType !== 'webhook_external') continue;
        
        // Normalizar ambos os paths antes de comparar
        // O path do banco pode ter / no início, o path recebido já está normalizado
        const storedPathRaw = startNode?.data?.webhookPath || '';
        const storedPath = storedPathRaw.replace(/^\/+/, '').trim();
        const receivedPath = webhookPath || '';
        
        // Adicionar à lista de paths disponíveis
        availablePaths.push({ nome: w.nome, path: storedPath });
        
        console.log('[WWH] Workflow:', w.nome, '- storedPath (raw):', storedPathRaw, '- storedPath (normalized):', storedPath, '- receivedPath:', receivedPath, '- match:', storedPath === receivedPath);
        
        if (storedPath === receivedPath) {
          workflow = w;
          break;
        }
      }

      if (!workflow) {
        console.error('[WWH] Nenhum workflow ativo encontrado para o path:', webhookPath);
        console.error('[WWH] Paths disponíveis nos workflows ativos:', JSON.stringify(availablePaths, null, 2));
        return;
      }
      console.log('[WWH] Workflow encontrado:', workflow.id, workflow.nome);

      const instanceToken = await getInstanceToken(workflow.id_cliente);
      if (!instanceToken) {
        console.error('[WWH] Instance token não encontrado para id_cliente:', workflow.id_cliente);
        return;
      }

      // Buscar ou criar lead
      const numero = normalizedPhone;
      const { data: existingLead } = await supabase.from('leads').select('*').eq('id_cliente', workflow.id_cliente).or(`telefone.eq.${numero},telefone.eq.+${numero}`).maybeSingle();
      let lead = existingLead;
      if (!lead) {
        const { data: newLead, error: createError } = await supabase.from('leads').insert({
          telefone: numero,
          nome: extraData.nome || `Contato ${numero.slice(-4)}`,
          id_cliente: workflow.id_cliente,
          status_conversa: 'em_atendimento',
          status: 'Leads',
          origem: extraData.origem || 'Webhook Externo',
          chatbot: true,
          closer_momento_da_ultima_msg: new Date().toISOString(),
        }).select().single();
        if (createError || !newLead) { console.error('[WWH] Erro ao criar lead:', createError); return; }
        lead = newLead;
      } else if (extraData.nome && (!lead.nome || lead.nome.startsWith('Contato '))) {
        // Atualiza o nome do lead existente se tiver nome placeholder ou vazio
        const { data: updatedLead } = await supabase.from('leads')
          .update({ nome: extraData.nome, updated_at: new Date().toISOString() })
          .eq('id', lead.id)
          .select()
          .single();
        if (updatedLead) lead = updatedLead;
        console.log('[WWH] Nome do lead atualizado para:', extraData.nome);
      }
      console.log('[WWH] Lead:', lead.id);

      const nodes = parseNodes(workflow.nodes);
      const startNode = nodes.find((n: any) => n.type === 'inicio') || nodes.find((n: any) => n.type === 'trigger');
      if (!startNode) { console.error('[WWH] Nó inicial não encontrado no workflow'); return; }

      const execution = await upsertExecution({
        workflow_id: String(workflow.id),
        lead_id: lead.id,
        id_cliente: workflow.id_cliente,
        phone: normalizedPhone,
        current_node_id: startNode.id,
        status: 'running',
        context: { leadData: lead, webhookData: extraData, mensagem_usuario: '' },
      });

      console.log('[WWH] Execução criada:', execution.id);
      await executeWorkflow(workflow, startNode, execution, instanceToken, '');
      console.log('[WWH] Workflow executado com sucesso');
    } catch (err: any) {
      console.error('[WWH] ERROR:', err?.message || JSON.stringify(err));
    }
  })();

  try {
    // @ts-ignore
    EdgeRuntime.waitUntil(processPromise);
  } catch {
    await processPromise;
  }

  return new Response(JSON.stringify({ received: true }), { status: 200, headers: corsHeaders });
}

serve(handleRequest);