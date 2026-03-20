-- ============================================================================
-- INVESTIGAÇÃO E NORMALIZAÇÃO DE WEBHOOK PATHS
-- ============================================================================
-- Este script investiga a estrutura do trigger_config e normaliza os paths
<<<<<<< HEAD
-- removendo barras iniciais e espaços.__
=======
-- removendo barras iniciais e espaços._
>>>>>>> novo-dashboard
-- ============================================================================

-- 1. INVESTIGAÇÃO: Ver exemplos de trigger_config e nodes
-- ============================================================================

-- Ver exemplos de trigger_config
SELECT 
  id,
  nome,
  trigger_config,
  CASE 
    WHEN trigger_config IS NULL THEN 'NULL'
    WHEN trigger_config::text = '{}' THEN 'VAZIO'
    ELSE 'TEM DADOS'
  END as trigger_config_status,
  trigger_config->>'webhookPath' as webhook_path_from_trigger_config,
  trigger_config->>'triggerType' as trigger_type_from_trigger_config
FROM workflows
WHERE is_active = true
LIMIT 10;

-- Ver exemplos de nodes (precisa parsear JSON)
SELECT 
  id,
  nome,
  jsonb_array_elements(nodes::jsonb) as node_data
FROM workflows
WHERE is_active = true
  AND nodes IS NOT NULL
LIMIT 20;

-- Buscar workflows com webhook_external e mostrar paths
SELECT 
  w.id,
  w.nome,
  w.trigger_config,
  w.trigger_config->>'webhookPath' as path_from_trigger_config,
  -- Extrair webhookPath do primeiro nó de início/trigger
  (
    SELECT node->>'data'::jsonb->>'webhookPath'
    FROM jsonb_array_elements(w.nodes::jsonb) as node
    WHERE (node->>'type' = 'inicio' OR node->>'type' = 'trigger')
      AND (node->>'data'::jsonb->>'triggerType' = 'webhook_external')
    LIMIT 1
  ) as path_from_nodes
FROM workflows w
WHERE w.is_active = true
  AND (
    w.trigger_config->>'triggerType' = 'webhook_external'
    OR EXISTS (
      SELECT 1
      FROM jsonb_array_elements(w.nodes::jsonb) as node
      WHERE (node->>'type' = 'inicio' OR node->>'type' = 'trigger')
        AND (node->>'data'::jsonb->>'triggerType' = 'webhook_external')
    )
  )
LIMIT 20;

-- ============================================================================
-- 2. NORMALIZAÇÃO: Remover barras iniciais e espaços dos paths
-- ============================================================================

-- Função auxiliar para normalizar path (remove / inicial e espaços)
CREATE OR REPLACE FUNCTION normalize_webhook_path(path_text TEXT)
RETURNS TEXT AS $$
BEGIN
  IF path_text IS NULL THEN
    RETURN NULL;
  END IF;
  -- Remove barras no início e espaços
  RETURN regexp_replace(trim(path_text), '^/+', '');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Atualizar trigger_config.webhookPath
UPDATE workflows
SET trigger_config = jsonb_set(
  trigger_config,
  '{webhookPath}',
  to_jsonb(normalize_webhook_path(trigger_config->>'webhookPath'))
)
WHERE trigger_config IS NOT NULL
  AND trigger_config->>'webhookPath' IS NOT NULL
  AND trigger_config->>'webhookPath' != normalize_webhook_path(trigger_config->>'webhookPath');

-- Atualizar nodes[].data.webhookPath (mais complexo, precisa iterar)
-- Esta query atualiza o webhookPath dentro do array de nodes
UPDATE workflows w
SET nodes = (
  SELECT jsonb_agg(
    CASE 
      WHEN (node->>'type' = 'inicio' OR node->>'type' = 'trigger')
        AND (node->'data'->>'triggerType' = 'webhook_external')
        AND node->'data'->>'webhookPath' IS NOT NULL
      THEN jsonb_set(
        node,
        '{data,webhookPath}',
        to_jsonb(normalize_webhook_path(node->'data'->>'webhookPath'))
      )
      ELSE node
    END
  )
  FROM jsonb_array_elements(w.nodes::jsonb) as node
)::text
WHERE w.nodes IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(w.nodes::jsonb) as node
    WHERE (node->>'type' = 'inicio' OR node->>'type' = 'trigger')
      AND (node->'data'->>'triggerType' = 'webhook_external')
      AND node->'data'->>'webhookPath' IS NOT NULL
      AND node->'data'->>'webhookPath' != normalize_webhook_path(node->'data'->>'webhookPath')
  );

-- ============================================================================
-- 3. VERIFICAÇÃO: Confirmar que a normalização funcionou
-- ============================================================================

-- Verificar paths normalizados
SELECT 
  id,
  nome,
  trigger_config->>'webhookPath' as normalized_trigger_config_path,
  (
    SELECT node->'data'->>'webhookPath'
    FROM jsonb_array_elements(nodes::jsonb) as node
    WHERE (node->>'type' = 'inicio' OR node->>'type' = 'trigger')
      AND (node->'data'->>'triggerType' = 'webhook_external')
    LIMIT 1
  ) as normalized_nodes_path
FROM workflows
WHERE is_active = true
  AND (
    trigger_config->>'triggerType' = 'webhook_external'
    OR EXISTS (
      SELECT 1
      FROM jsonb_array_elements(nodes::jsonb) as node
      WHERE (node->>'type' = 'inicio' OR node->>'type' = 'trigger')
        AND (node->'data'->>'triggerType' = 'webhook_external')
    )
  )
LIMIT 20;

-- ============================================================================
-- 4. LIMPEZA: Remover função auxiliar (opcional)
-- ============================================================================

-- Descomente se quiser remover a função após usar:
-- DROP FUNCTION IF EXISTS normalize_webhook_path(TEXT);
