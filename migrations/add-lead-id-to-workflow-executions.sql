-- Migration: Adicionar coluna lead_id na tabela workflow_executions se não existir
-- Data: 2024
-- Descrição: Adiciona coluna lead_id para rastrear qual lead está executando o workflow

-- Verificar se a coluna lead_id existe, se não, adicionar
DO $$
BEGIN
  -- Verificar se a coluna já existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workflow_executions' 
    AND column_name = 'lead_id'
  ) THEN
    -- Adicionar coluna como nullable primeiro (para não quebrar registros existentes)
    ALTER TABLE workflow_executions 
    ADD COLUMN lead_id INTEGER;
    
    -- Adicionar foreign key constraint
    ALTER TABLE workflow_executions
    ADD CONSTRAINT fk_workflow_executions_lead 
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;
    
    -- Criar índice para performance
    CREATE INDEX IF NOT EXISTS idx_workflow_executions_lead_id 
    ON workflow_executions(lead_id);
    
    -- Comentário na coluna
    COMMENT ON COLUMN workflow_executions.lead_id IS 'ID do lead que está executando este workflow';
    
    RAISE NOTICE 'Coluna lead_id adicionada com sucesso à tabela workflow_executions';
  ELSE
    RAISE NOTICE 'Coluna lead_id já existe na tabela workflow_executions';
  END IF;
END $$;
