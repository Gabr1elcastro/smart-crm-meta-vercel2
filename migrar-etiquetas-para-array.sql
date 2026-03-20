-- Script para migrar id_etiquetas de string para array de inteiros
-- ⚠️ ATENÇÃO: Faça backup antes de executar!

-- 1. CRIAR COLUNA TEMPORÁRIA
ALTER TABLE leads ADD COLUMN id_etiquetas_array int[];

-- 2. CONVERTER STRINGS PARA ARRAYS
UPDATE leads 
SET id_etiquetas_array = (
  SELECT array_agg(etiqueta_id)
  FROM (
    SELECT DISTINCT unnest(string_to_array(id_etiquetas, ','))::int as etiqueta_id
    WHERE id_etiquetas IS NOT NULL 
      AND id_etiquetas != ''
      AND etiqueta_id > 0
  ) as ids
  WHERE etiqueta_id IN (
    SELECT id FROM etiquetas 
    WHERE id_cliente = leads.id_cliente OR id_cliente IS NULL
  )
)
WHERE id_etiquetas IS NOT NULL 
  AND id_etiquetas != '';

-- 3. VALIDAR CONVERSÃO
SELECT 
  'ANTES' as etapa,
  count(*) as total_leads,
  count(CASE WHEN id_etiquetas IS NOT NULL AND id_etiquetas != '' THEN 1 END) as com_etiquetas_string
FROM leads

UNION ALL

SELECT 
  'DEPOIS' as etapa,
  count(*) as total_leads,
  count(CASE WHEN id_etiquetas_array IS NOT NULL THEN 1 END) as com_etiquetas_array
FROM leads;

-- 4. VERIFICAR DIFERENÇAS
SELECT 
  l.id,
  l.nome,
  l.id_etiquetas as string_original,
  l.id_etiquetas_array as array_novo,
  array_to_string(l.id_etiquetas_array, ',') as array_convertido_para_string
FROM leads l
WHERE l.id_etiquetas IS NOT NULL 
  AND l.id_etiquetas != ''
  AND (
    l.id_etiquetas_array IS NULL 
    OR array_to_string(l.id_etiquetas_array, ',') != l.id_etiquetas
  )
LIMIT 10;

-- 5. REMOVER COLUNA ANTIGA E RENOMEAR NOVA
-- ⚠️ DESCOMENTE APENAS APÓS VALIDAR QUE A CONVERSÃO ESTÁ CORRETA!

-- ALTER TABLE leads DROP COLUMN id_etiquetas;
-- ALTER TABLE leads RENAME COLUMN id_etiquetas_array TO id_etiquetas;

-- 6. ATUALIZAR ÍNDICES
-- DROP INDEX IF EXISTS idx_leads_id_etiquetas;
-- CREATE INDEX idx_leads_id_etiquetas ON leads USING gin(id_etiquetas);

-- 7. ATUALIZAR FUNÇÕES PARA TRABALHAR COM ARRAYS
CREATE OR REPLACE FUNCTION limpar_etiquetas_orfas_lead_array(lead_id_param int)
RETURNS int[] AS $$
DECLARE
  lead_record record;
  etiquetas_limpas int[];
BEGIN
  -- Buscar o lead
  SELECT id_etiquetas_array, id_cliente INTO lead_record
  FROM leads 
  WHERE id = lead_id_param;
  
  IF NOT FOUND OR lead_record.id_etiquetas_array IS NULL THEN
    RETURN ARRAY[]::int[];
  END IF;
  
  -- Limpar etiquetas órfãs
  SELECT array_agg(etiqueta_id) INTO etiquetas_limpas
  FROM unnest(lead_record.id_etiquetas_array) as etiqueta_id
  WHERE etiqueta_id IN (
    SELECT id FROM etiquetas 
    WHERE id_cliente = lead_record.id_cliente OR id_cliente IS NULL
  );
  
  -- Atualizar o lead se houve mudanças
  IF etiquetas_limpas != lead_record.id_etiquetas_array THEN
    UPDATE leads 
    SET id_etiquetas_array = etiquetas_limpas
    WHERE id = lead_id_param;
  END IF;
  
  RETURN COALESCE(etiquetas_limpas, ARRAY[]::int[]);
END;
$$ LANGUAGE plpgsql;

-- 8. FUNÇÃO PARA ADICIONAR ETIQUETA A UM LEAD
CREATE OR REPLACE FUNCTION adicionar_etiqueta_lead(lead_id_param int, etiqueta_id_param int)
RETURNS boolean AS $$
DECLARE
  lead_record record;
  novas_etiquetas int[];
BEGIN
  -- Buscar o lead
  SELECT id_etiquetas_array, id_cliente INTO lead_record
  FROM leads 
  WHERE id = lead_id_param;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Verificar se a etiqueta existe e pertence ao cliente
  IF NOT EXISTS (
    SELECT 1 FROM etiquetas 
    WHERE id = etiqueta_id_param 
      AND (id_cliente = lead_record.id_cliente OR id_cliente IS NULL)
  ) THEN
    RETURN false;
  END IF;
  
  -- Verificar se já não está atribuída
  IF lead_record.id_etiquetas_array IS NOT NULL 
     AND etiqueta_id_param = ANY(lead_record.id_etiquetas_array) THEN
    RETURN false;
  END IF;
  
  -- Verificar limite de 3 etiquetas
  IF array_length(lead_record.id_etiquetas_array, 1) >= 3 THEN
    RETURN false;
  END IF;
  
  -- Adicionar etiqueta
  novas_etiquetas := COALESCE(lead_record.id_etiquetas_array, ARRAY[]::int[]) || etiqueta_id_param;
  
  -- Atualizar o lead
  UPDATE leads 
  SET id_etiquetas_array = novas_etiquetas
  WHERE id = lead_id_param;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 9. FUNÇÃO PARA REMOVER ETIQUETA DE UM LEAD
CREATE OR REPLACE FUNCTION remover_etiqueta_lead(lead_id_param int, etiqueta_id_param int)
RETURNS boolean AS $$
DECLARE
  lead_record record;
  novas_etiquetas int[];
BEGIN
  -- Buscar o lead
  SELECT id_etiquetas_array INTO lead_record
  FROM leads 
  WHERE id = lead_id_param;
  
  IF NOT FOUND OR lead_record.id_etiquetas_array IS NULL THEN
    RETURN false;
  END IF;
  
  -- Remover etiqueta
  novas_etiquetas := array_remove(lead_record.id_etiquetas_array, etiqueta_id_param);
  
  -- Atualizar o lead
  UPDATE leads 
  SET id_etiquetas_array = novas_etiquetas
  WHERE id = lead_id_param;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 10. VIEW ATUALIZADA PARA ARRAYS
CREATE OR REPLACE VIEW v_etiquetas_problemas_array AS
SELECT 
  l.id as lead_id,
  l.nome as lead_nome,
  l.id_cliente,
  l.id_etiquetas_array,
  array_length(l.id_etiquetas_array, 1) as total_etiquetas,
  (
    SELECT count(*)
    FROM unnest(l.id_etiquetas_array) as etiqueta_id
    WHERE etiqueta_id IN (
      SELECT id FROM etiquetas 
      WHERE id_cliente = l.id_cliente OR id_cliente IS NULL
    )
  ) as etiquetas_validas,
  (
    SELECT count(*)
    FROM unnest(l.id_etiquetas_array) as etiqueta_id
    WHERE etiqueta_id NOT IN (
      SELECT id FROM etiquetas 
      WHERE id_cliente = l.id_cliente OR id_cliente IS NULL
    )
  ) as etiquetas_orfas
FROM leads l
WHERE l.id_etiquetas_array IS NOT NULL;

-- 11. RELATÓRIO FINAL
SELECT 
  'CONVERSÃO CONCLUÍDA' as status,
  count(*) as total_leads,
  count(CASE WHEN id_etiquetas_array IS NOT NULL THEN 1 END) as leads_com_etiquetas,
  count(CASE WHEN id_etiquetas_array IS NOT NULL AND array_length(id_etiquetas_array, 1) > 0 THEN 1 END) as leads_com_etiquetas_validas
FROM leads;
