-- Migration: Adicionar coluna workflow_ativo na tabela leads
-- Data: Janeiro 2025
-- Descrição: Adiciona controle de automação de workflows por lead

-- Adicionar coluna workflow_ativo (boolean, default true)
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS workflow_ativo boolean DEFAULT true;

-- Criar índice para performance em consultas
CREATE INDEX IF NOT EXISTS idx_leads_workflow_ativo ON leads(workflow_ativo);

-- Comentário para documentação
COMMENT ON COLUMN leads.workflow_ativo IS 'Controla se o lead pode receber automações de workflow. false = pausado, true = ativo';
