-- Migration: Criar tabelas para Menu Interativo de Workflow
-- Data: 2024
-- Descrição: Cria tabelas workflow_executions e workflow_menu_logs para suportar menu interativo com lógica de entrada condicional

-- 1. Tabela workflow_executions (execuções de workflow)
CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL,
  lead_id INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running', 'waiting_input', 'completed', 'timeout')),
  current_node_id TEXT,
  context JSONB DEFAULT '{}'::jsonb,
  waiting_since TIMESTAMP WITH TIME ZONE,
  expected_options TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT fk_workflow FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
  CONSTRAINT fk_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  
  -- Índices para performance
  CONSTRAINT unique_active_execution UNIQUE (lead_id, workflow_id, status) 
    WHERE status = 'waiting_input'
);

-- Índices adicionais
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_lead_id ON workflow_executions(lead_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_waiting_since ON workflow_executions(waiting_since) 
  WHERE status = 'waiting_input';

-- 2. Tabela workflow_menu_logs (histórico de menus)
CREATE TABLE IF NOT EXISTS workflow_menu_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL,
  lead_id INTEGER NOT NULL,
  menu_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_response TEXT,
  option_chosen TEXT,
  is_valid_response BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT fk_execution FOREIGN KEY (execution_id) REFERENCES workflow_executions(id) ON DELETE CASCADE,
  CONSTRAINT fk_lead_log FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);

-- Índices para workflow_menu_logs
CREATE INDEX IF NOT EXISTS idx_workflow_menu_logs_execution_id ON workflow_menu_logs(execution_id);
CREATE INDEX IF NOT EXISTS idx_workflow_menu_logs_lead_id ON workflow_menu_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_workflow_menu_logs_menu_sent_at ON workflow_menu_logs(menu_sent_at);

-- 3. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_workflow_executions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_workflow_executions_updated_at ON workflow_executions;
CREATE TRIGGER trigger_update_workflow_executions_updated_at
  BEFORE UPDATE ON workflow_executions
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_executions_updated_at();

-- 4. Verificar se a coluna closer_momento_da_ultima_msg existe na tabela leads
-- Se não existir, criar (conforme especificação do usuário)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' 
    AND column_name = 'closer_momento_da_ultima_msg'
  ) THEN
    ALTER TABLE leads ADD COLUMN closer_momento_da_ultima_msg TIMESTAMP WITH TIME ZONE;
    
    -- Criar índice para performance
    CREATE INDEX IF NOT EXISTS idx_leads_closer_momento_da_ultima_msg 
      ON leads(closer_momento_da_ultima_msg);
    
    -- Atualizar registros existentes com valor padrão (NOW() se status_conversa = 'fechada')
    UPDATE leads 
    SET closer_momento_da_ultima_msg = NOW() 
    WHERE closer_momento_da_ultima_msg IS NULL 
      AND status_conversa = 'fechada';
  END IF;
END $$;

-- 5. Comentários nas tabelas
COMMENT ON TABLE workflow_executions IS 'Armazena execuções de workflows com estado (running, waiting_input, completed, timeout)';
COMMENT ON TABLE workflow_menu_logs IS 'Histórico de envios e respostas de menus interativos';
COMMENT ON COLUMN workflow_executions.status IS 'Status da execução: running, waiting_input, completed, timeout';
COMMENT ON COLUMN workflow_executions.expected_options IS 'Array de opções válidas quando status = waiting_input';
COMMENT ON COLUMN workflow_executions.waiting_since IS 'Timestamp de quando entrou em estado waiting_input';
COMMENT ON COLUMN leads.closer_momento_da_ultima_msg IS 'Timestamp da última mensagem quando conversa foi fechada';
