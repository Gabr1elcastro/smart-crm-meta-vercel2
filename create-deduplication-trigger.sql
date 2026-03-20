-- SOLUÇÃO DEFINITIVA: Trigger para prevenir duplicação de mensagens
-- Este trigger impede inserções duplicadas diretamente no banco de dados

-- 1. Primeiro, vamos criar um índice único para prevenir duplicatas
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_messages 
ON agente_conversacional_whatsapp (
  telefone_id, 
  mensagem, 
  DATE_TRUNC('minute', COALESCE(timestamp::timestamp, created_at)),
  tipo
);

-- 2. Função que será executada antes de cada INSERT
CREATE OR REPLACE FUNCTION prevent_duplicate_messages()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se já existe uma mensagem similar nos últimos 60 segundos
  IF EXISTS (
    SELECT 1 
    FROM agente_conversacional_whatsapp 
    WHERE telefone_id = NEW.telefone_id
      AND mensagem = NEW.mensagem
      AND tipo = NEW.tipo
      AND ABS(EXTRACT(EPOCH FROM (
        COALESCE(NEW.timestamp::timestamp, NEW.created_at) - 
        COALESCE(timestamp::timestamp, created_at)
      ))) < 60
  ) THEN
    -- Registrar a tentativa de duplicação (para debug)
    RAISE NOTICE 'Mensagem duplicada impedida: telefone=%, mensagem=%, timestamp=%', 
      NEW.telefone_id, LEFT(NEW.mensagem, 50), NEW.created_at;
    
    -- Cancelar a inserção retornando NULL
    RETURN NULL;
  END IF;
  
  -- Se não é duplicata, permitir a inserção
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Criar o trigger que executa antes de cada INSERT
DROP TRIGGER IF EXISTS trigger_prevent_duplicate_messages ON agente_conversacional_whatsapp;

CREATE TRIGGER trigger_prevent_duplicate_messages
  BEFORE INSERT ON agente_conversacional_whatsapp
  FOR EACH ROW
  EXECUTE FUNCTION prevent_duplicate_messages();

-- 4. Limpar mensagens duplicadas existentes (executar apenas uma vez)
WITH ranked_messages AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY 
        telefone_id, 
        mensagem, 
        DATE_TRUNC('minute', COALESCE(timestamp::timestamp, created_at)),
        tipo
      ORDER BY created_at ASC
    ) as row_num
  FROM agente_conversacional_whatsapp
)
DELETE FROM agente_conversacional_whatsapp 
WHERE id IN (
  SELECT id 
  FROM ranked_messages 
  WHERE row_num > 1
);

-- 5. Verificação final - contar mensagens restantes
SELECT 
  'Mensagens após limpeza' as status,
  COUNT(*) as total
FROM agente_conversacional_whatsapp;

-- 6. Testar se ainda há duplicatas
SELECT 
  telefone_id,
  mensagem,
  COUNT(*) as duplicatas
FROM agente_conversacional_whatsapp
GROUP BY telefone_id, mensagem, DATE_TRUNC('minute', COALESCE(timestamp::timestamp, created_at)), tipo
HAVING COUNT(*) > 1
ORDER BY duplicatas DESC
LIMIT 10;

-- 7. Função para monitorar tentativas de duplicação em tempo real
CREATE OR REPLACE FUNCTION monitor_duplicate_attempts()
RETURNS TABLE(
  telefone_id text,
  mensagem text,
  tentativas_duplicacao bigint,
  ultima_tentativa timestamp
) AS $$
BEGIN
  -- Esta função pode ser chamada para monitorar tentativas de duplicação
  -- Implementar log de duplicatas se necessário
  RETURN QUERY
  SELECT 
    acw.telefone_id,
    LEFT(acw.mensagem, 100) as mensagem,
    COUNT(*) as tentativas_duplicacao,
    MAX(acw.created_at) as ultima_tentativa
  FROM agente_conversacional_whatsapp acw
  WHERE acw.created_at > NOW() - INTERVAL '1 hour'
  GROUP BY acw.telefone_id, acw.mensagem
  HAVING COUNT(*) > 1
  ORDER BY tentativas_duplicacao DESC;
END;
$$ LANGUAGE plpgsql;

-- Para monitorar duplicatas em tempo real, execute:
-- SELECT * FROM monitor_duplicate_attempts(); 