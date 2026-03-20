-- SOLUÇÃO DEFINITIVA PARA DUPLICAÇÃO DE MENSAGENS
-- Execute estes comandos no banco de dados Supabase

-- 1. PRIMEIRO: Limpar mensagens duplicadas existentes
WITH mensagens_duplicadas AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY conversa_id, mensagem, timestamp, telefone_id, instance_id 
      ORDER BY created_at DESC
    ) as rn
  FROM conversas 
  WHERE created_at >= '2025-05-30 00:00:00'
)
DELETE FROM conversas 
WHERE id IN (
  SELECT id FROM mensagens_duplicadas WHERE rn > 1
);

-- 2. CRIAR ÍNDICE ÚNICO para prevenir duplicações futuras
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversas_unique_message 
ON conversas (conversa_id, mensagem, telefone_id, instance_id, timestamp);

-- 3. CRIAR FUNÇÃO para detectar duplicatas
CREATE OR REPLACE FUNCTION check_duplicate_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se já existe uma mensagem idêntica nos últimos 5 segundos
  IF EXISTS (
    SELECT 1 FROM conversas 
    WHERE conversa_id = NEW.conversa_id 
    AND mensagem = NEW.mensagem 
    AND telefone_id = NEW.telefone_id 
    AND instance_id = NEW.instance_id
    AND ABS(EXTRACT(EPOCH FROM (NEW.timestamp - timestamp))) < 5
    AND id != NEW.id
  ) THEN
    -- Log da duplicata detectada
    RAISE NOTICE 'DUPLICATA DETECTADA: conversa_id=%, mensagem=%, telefone_id=%', 
      NEW.conversa_id, LEFT(NEW.mensagem, 50), NEW.telefone_id;
    
    -- Bloquear a inserção
    RETURN NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. CRIAR TRIGGER para executar a função
DROP TRIGGER IF EXISTS trigger_check_duplicate_message ON conversas;
CREATE TRIGGER trigger_check_duplicate_message
  BEFORE INSERT ON conversas
  FOR EACH ROW
  EXECUTE FUNCTION check_duplicate_message();

-- 5. VERIFICAR se os triggers estão ativos
SELECT 
  trigger_name, 
  event_manipulation, 
  action_timing, 
  action_statement
FROM information_schema.triggers 
WHERE table_name = 'conversas';

-- 6. CONTAR mensagens duplicadas restantes
SELECT 
  conversa_id, 
  mensagem, 
  telefone_id, 
  COUNT(*) as duplicatas
FROM conversas 
WHERE created_at >= '2025-05-30 00:00:00'
GROUP BY conversa_id, mensagem, telefone_id 
HAVING COUNT(*) > 1
ORDER BY duplicatas DESC; 