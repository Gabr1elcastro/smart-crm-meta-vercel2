-- Migration: Adicionar coluna waiting_until na tabela workflow_executions
-- Data: Janeiro 2025
-- Descrição: Adiciona campo para controlar timeout de delay nodes

-- Adicionar coluna waiting_until (timestamp)
ALTER TABLE workflow_executions 
ADD COLUMN IF NOT EXISTS waiting_until timestamp with time zone;

-- Criar índice para performance em consultas de timeout
CREATE INDEX IF NOT EXISTS idx_workflow_executions_waiting_until ON workflow_executions(waiting_until) 
WHERE waiting_until IS NOT NULL;

-- Comentário para documentação
COMMENT ON COLUMN workflow_executions.waiting_until IS 'Timestamp até quando o workflow está aguardando (para delay nodes). Se mensagem chegar antes, cancela o delay.';
