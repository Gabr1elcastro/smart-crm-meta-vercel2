-- Script para corrigir os problemas reais das etiquetas
-- Execute no Supabase SQL Editor

-- 1. IDENTIFICAR LEADS COM PROBLEMAS
-- Criar view temporária para análise
CREATE OR REPLACE VIEW v_leads_problemas_etiquetas AS
SELECT 
  l.id as lead_id,
  l.nome as lead_nome,
  l.id_cliente as lead_cliente,
  l.id_etiquetas,
  unnest(string_to_array(l.id_etiquetas, ','))::int as etiqueta_id,
  e.id as etiqueta_existe,
  e.id_cliente as etiqueta_cliente,
  e.nome as etiqueta_nome,
  CASE 
    WHEN e.id IS NULL THEN 'INEXISTENTE'
    WHEN e.id_cliente IS NULL THEN 'SISTEMA'
    WHEN e.id_cliente = l.id_cliente THEN 'CORRETO'
    ELSE 'OUTRO_CLIENTE'
  END as status_etiqueta
FROM leads l
LEFT JOIN etiquetas e ON unnest(string_to_array(l.id_etiquetas, ','))::int = e.id
WHERE l.id_etiquetas IS NOT NULL 
  AND l.id_etiquetas != ''
  AND l.id_etiquetas ~ '^[0-9,]+$'; -- Apenas números e vírgulas

-- 2. RELATÓRIO DE PROBLEMAS
SELECT 
  'RELATÓRIO DE PROBLEMAS' as tipo,
  status_etiqueta,
  count(*) as quantidade,
  count(DISTINCT lead_id) as leads_afetados
FROM v_leads_problemas_etiquetas
GROUP BY status_etiqueta
ORDER BY quantidade DESC;

-- 3. CORRIGIR LEADS COM ETIQUETAS INEXISTENTES
-- Remover IDs de etiquetas que não existem mais
UPDATE leads 
SET id_etiquetas = (
  SELECT string_agg(etiqueta_id::text, ',')
  FROM (
    SELECT DISTINCT unnest(string_to_array(id_etiquetas, ','))::int as etiqueta_id
  ) as ids
  WHERE etiqueta_id IN (SELECT id FROM etiquetas)
)
WHERE id IN (
  SELECT DISTINCT lead_id 
  FROM v_leads_problemas_etiquetas 
  WHERE status_etiqueta = 'INEXISTENTE'
);

-- 4. CORRIGIR LEADS COM ETIQUETAS DE OUTROS CLIENTES
-- Para cada lead, manter apenas etiquetas do próprio cliente + sistema
UPDATE leads 
SET id_etiquetas = (
  SELECT string_agg(etiqueta_id::text, ',')
  FROM (
    SELECT DISTINCT unnest(string_to_array(id_etiquetas, ','))::int as etiqueta_id
  ) as ids
  WHERE etiqueta_id IN (
    SELECT id FROM etiquetas 
    WHERE id_cliente = leads.id_cliente OR id_cliente IS NULL
  )
)
WHERE id IN (
  SELECT DISTINCT lead_id 
  FROM v_leads_problemas_etiquetas 
  WHERE status_etiqueta = 'OUTRO_CLIENTE'
);

-- 5. NORMALIZAR FORMATO DOS id_etiquetas
-- Remover espaços, vírgulas duplicadas e vazias
UPDATE leads 
SET id_etiquetas = regexp_replace(
  regexp_replace(
    regexp_replace(id_etiquetas, '\s+', '', 'g'), -- Remove espaços
    ',,+', ',', 'g' -- Remove vírgulas duplicadas
  ),
  '^,|,$', '', 'g' -- Remove vírgulas do início e fim
)
WHERE id_etiquetas IS NOT NULL 
  AND id_etiquetas != '';

-- 6. LIMPAR LEADS COM id_etiquetas VAZIO APÓS LIMPEZA
UPDATE leads 
SET id_etiquetas = NULL
WHERE id_etiquetas = '' OR id_etiquetas IS NULL;

-- 7. VERIFICAR RESULTADO APÓS CORREÇÕES
SELECT 
  'APÓS CORREÇÕES' as status,
  status_etiqueta,
  count(*) as quantidade,
  count(DISTINCT lead_id) as leads_afetados
FROM v_leads_problemas_etiquetas
GROUP BY status_etiqueta
ORDER BY quantidade DESC;

-- 8. ESTATÍSTICAS FINAIS
SELECT 
  'ESTATÍSTICAS FINAIS' as tipo,
  count(*) as total_leads,
  count(CASE WHEN id_etiquetas IS NOT NULL THEN 1 END) as leads_com_etiquetas,
  count(CASE WHEN id_etiquetas IS NULL THEN 1 END) as leads_sem_etiquetas
FROM leads;

-- 9. FUNÇÃO PARA LIMPAR ETIQUETAS ÓRFÃS DE UM LEAD ESPECÍFICO
CREATE OR REPLACE FUNCTION limpar_etiquetas_lead(lead_id_param int)
RETURNS text AS $$
DECLARE
  lead_record record;
  etiquetas_limpas text;
BEGIN
  -- Buscar o lead
  SELECT id_etiquetas, id_cliente INTO lead_record
  FROM leads 
  WHERE id = lead_id_param;
  
  IF NOT FOUND OR lead_record.id_etiquetas IS NULL THEN
    RETURN '';
  END IF;
  
  -- Limpar etiquetas órfãs
  SELECT string_agg(etiqueta_id::text, ',') INTO etiquetas_limpas
  FROM (
    SELECT DISTINCT unnest(string_to_array(lead_record.id_etiquetas, ','))::int as etiqueta_id
  ) as ids
  WHERE etiqueta_id IN (
    SELECT id FROM etiquetas 
    WHERE id_cliente = lead_record.id_cliente OR id_cliente IS NULL
  );
  
  -- Atualizar o lead se houve mudanças
  IF etiquetas_limpas != lead_record.id_etiquetas THEN
    UPDATE leads 
    SET id_etiquetas = etiquetas_limpas
    WHERE id = lead_id_param;
  END IF;
  
  RETURN COALESCE(etiquetas_limpas, '');
END;
$$ LANGUAGE plpgsql;

-- 10. FUNÇÃO PARA LIMPAR TODAS AS ETIQUETAS ÓRFÃS DE UM CLIENTE
CREATE OR REPLACE FUNCTION limpar_etiquetas_cliente(cliente_id_param int)
RETURNS TABLE(leads_atualizados int, etiquetas_removidas int) AS $$
DECLARE
  lead_record record;
  etiquetas_limpas text;
  leads_count int := 0;
  etiquetas_count int := 0;
BEGIN
  -- Processar cada lead do cliente
  FOR lead_record IN 
    SELECT id, id_etiquetas
    FROM leads 
    WHERE id_cliente = cliente_id_param
      AND id_etiquetas IS NOT NULL 
      AND id_etiquetas != ''
  LOOP
    -- Contar etiquetas órfãs antes da limpeza
    etiquetas_count := etiquetas_count + (
      SELECT count(*)
      FROM (
        SELECT unnest(string_to_array(lead_record.id_etiquetas, ','))::int as etiqueta_id
      ) as ids
      WHERE etiqueta_id NOT IN (
        SELECT id FROM etiquetas 
        WHERE id_cliente = cliente_id_param OR id_cliente IS NULL
      )
    );
    
    -- Limpar etiquetas órfãs deste lead
    SELECT string_agg(etiqueta_id::text, ',') INTO etiquetas_limpas
    FROM (
      SELECT DISTINCT unnest(string_to_array(lead_record.id_etiquetas, ','))::int as etiqueta_id
    ) as ids
    WHERE etiqueta_id IN (
      SELECT id FROM etiquetas 
      WHERE id_cliente = cliente_id_param OR id_cliente IS NULL
    );
    
    -- Atualizar se houve mudanças
    IF etiquetas_limpas != lead_record.id_etiquetas THEN
      UPDATE leads 
      SET id_etiquetas = etiquetas_limpas
      WHERE id = lead_record.id;
      
      leads_count := leads_count + 1;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT leads_count, etiquetas_count;
END;
$$ LANGUAGE plpgsql;

-- 11. EXEMPLO DE USO DAS FUNÇÕES
-- SELECT * FROM limpar_etiquetas_cliente(68); -- Limpar etiquetas do cliente 68
-- SELECT limpar_etiquetas_lead(1485); -- Limpar etiquetas do lead 1485

-- 12. LIMPAR VIEW TEMPORÁRIA
DROP VIEW IF EXISTS v_leads_problemas_etiquetas;
