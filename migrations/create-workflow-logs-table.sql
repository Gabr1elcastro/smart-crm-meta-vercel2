-- Migration: Criar tabela workflow_logs para sistema de debug e logs
-- Data: 2024

-- Tabela principal de logs de execução de workflows
create table if not exists workflow_logs (
  id uuid default gen_random_uuid() primary key,
  workflow_id uuid references workflows(id) on delete cascade,
  execution_id uuid, -- agrupa logs de uma mesma execução
  lead_id bigint references leads(id) on delete set null,
  node_id text, -- ID do node no React Flow
  node_type text, -- 'inicio', 'menu', 'condition', 'message', etc
  status text check (status in ('started', 'completed', 'error', 'waiting', 'timeout', 'skipped')),
  input_data jsonb, -- dados de entrada (contexto antes de executar)
  output_data jsonb, -- resultado (resposta do usuário, erro, etc)
  error_message text,
  execution_time_ms integer, -- tempo de processamento do node em milissegundos
  created_at timestamptz default now(),
  id_cliente bigint -- para RLS/multi-tenant
);

-- Índices para performance
create index if not exists idx_workflow_logs_workflow_id on workflow_logs(workflow_id);
create index if not exists idx_workflow_logs_execution_id on workflow_logs(execution_id);
create index if not exists idx_workflow_logs_lead_id on workflow_logs(lead_id);
create index if not exists idx_workflow_logs_created_at on workflow_logs(created_at desc);
create index if not exists idx_workflow_logs_status on workflow_logs(status);
create index if not exists idx_workflow_logs_id_cliente on workflow_logs(id_cliente);

-- Comentários para documentação
comment on table workflow_logs is 'Logs de execução de workflows para debug e troubleshooting';
comment on column workflow_logs.execution_id is 'ID único que agrupa todos os logs de uma mesma execução do workflow';
comment on column workflow_logs.node_id is 'ID do node no React Flow (ex: inicio-1234567890)';
comment on column workflow_logs.node_type is 'Tipo do node (inicio, message, menu, condition, end, etc)';
comment on column workflow_logs.status is 'Status da execução: started, completed, error, waiting, timeout, skipped';
comment on column workflow_logs.input_data is 'Dados de entrada/contexto antes de executar o node (JSON)';
comment on column workflow_logs.output_data is 'Resultado da execução (JSON)';
comment on column workflow_logs.execution_time_ms is 'Tempo de processamento do node em milissegundos';

-- Política RLS (Row Level Security) - ajustar conforme necessário
-- alter table workflow_logs enable row level security;
-- create policy "Users can only see logs from their own client" on workflow_logs
--   for select using (id_cliente = current_setting('app.current_client_id')::bigint);
