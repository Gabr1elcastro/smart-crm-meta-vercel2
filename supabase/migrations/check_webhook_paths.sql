-- ============================================================================
-- VERIFICAR PATHS DE WEBHOOK CONFIGURADOS
-- ============================================================================
-- Esta query lista todos os workflows ativos com seus paths de webhook
<<<<<<< HEAD
-- para facilitar a identificação de qual path usar_
=======
-- para facilitar a identificação de qual path usar _
>>>>>>> novo-dashboard
-- ============================================================================

SELECT 
  w.id,
  w.nome,
  w.is_active,
  -- Path do trigger_config
  w.trigger_config->>'webhookPath' as path_from_trigger_config,
  -- Path do nodes (onde realmente está sendo usado)
  (
    SELECT node->'data'->>'webhookPath'
    FROM jsonb_array_elements(w.nodes::jsonb) as node
    WHERE (node->>'type' = 'inicio' OR node->>'type' = 'trigger')
      AND (node->'data'->>'triggerType' = 'webhook_external')
    LIMIT 1
  ) as path_from_nodes,
  -- Path normalizado (sem / inicial)
  regexp_replace(
    trim(
      COALESCE(
        (
          SELECT node->'data'->>'webhookPath'
          FROM jsonb_array_elements(w.nodes::jsonb) as node
          WHERE (node->>'type' = 'inicio' OR node->>'type' = 'trigger')
            AND (node->'data'->>'triggerType' = 'webhook_external')
          LIMIT 1
        ),
        ''
      )
    ),
    '^/+',
    ''
  ) as path_normalized,
  -- URL completa do webhook (exemplo)
  CONCAT(
    'https://ltdkdeqxcgtuncgzsowt.supabase.co/functions/v1/workflow-webhook-trigger?path=',
    regexp_replace(
      trim(
        COALESCE(
          (
            SELECT node->'data'->>'webhookPath'
            FROM jsonb_array_elements(w.nodes::jsonb) as node
            WHERE (node->>'type' = 'inicio' OR node->>'type' = 'trigger')
              AND (node->'data'->>'triggerType' = 'webhook_external')
            LIMIT 1
          ),
          ''
        )
      ),
      '^/+',
      ''
    )
  ) as webhook_url_example
FROM workflows w
WHERE w.is_active = true
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(w.nodes::jsonb) as node
    WHERE (node->>'type' = 'inicio' OR node->>'type' = 'trigger')
      AND (node->'data'->>'triggerType' = 'webhook_external')
  )
ORDER BY w.nome;
