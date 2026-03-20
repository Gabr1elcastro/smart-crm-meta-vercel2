-- Script SQL para corrigir problemas das etiquetas
-- Execute este script no Supabase SQL Editor

-- 1. LIMPAR IDs ÓRFÃOS DOS LEADS
-- Remove IDs de etiquetas que não existem mais
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
WHERE id_etiquetas IS NOT NULL 
  AND id_etiquetas != ''
  AND EXISTS (
    SELECT 1 FROM (
      SELECT unnest(string_to_array(id_etiquetas, ','))::int as etiqueta_id
    ) as ids
    WHERE etiqueta_id NOT IN (
      SELECT id FROM etiquetas 
      WHERE id_cliente = leads.id_cliente OR id_cliente IS NULL
    )
  );

-- 2. NORMALIZAR FORMATO DOS id_etiquetas
-- Remove espaços extras e vírgulas vazias
UPDATE leads 
SET id_etiquetas = regexp_replace(
  regexp_replace(id_etiquetas, '\s+', '', 'g'), -- Remove espaços
  ',,+', ',', 'g' -- Remove vírgulas duplicadas
)
WHERE id_etiquetas IS NOT NULL 
  AND id_etiquetas != '';

-- Remove vírgulas do início e fim
UPDATE leads 
SET id_etiquetas = trim(id_etiquetas, ',')
WHERE id_etiquetas IS NOT NULL 
  AND id_etiquetas != '';

-- 3. REMOVER DUPLICATAS DE ETIQUETAS
-- Identificar etiquetas duplicadas por nome (case-insensitive)
WITH etiquetas_duplicadas AS (
  SELECT 
    lower(trim(nome)) as nome_normalizado,
    array_agg(id ORDER BY created_at ASC) as ids,
    array_agg(nome ORDER BY created_at ASC) as nomes,
    array_agg(cor ORDER BY created_at ASC) as cores,
    array_agg(id_cliente ORDER BY created_at ASC) as clientes
  FROM etiquetas
  GROUP BY lower(trim(nome))
  HAVING count(*) > 1
),
-- Manter apenas a primeira etiqueta de cada grupo
etiquetas_para_manter AS (
  SELECT 
    nome_normalizado,
    ids[1] as id_manter,
    nomes[1] as nome_manter,
    cores[1] as cor_manter,
    clientes[1] as cliente_manter
  FROM etiquetas_duplicadas
),
-- IDs das etiquetas a serem removidas
etiquetas_para_remover AS (
  SELECT unnest(ids[2:]) as id_remover
  FROM etiquetas_duplicadas
)
-- Atualizar leads que usam etiquetas duplicadas
UPDATE leads 
SET id_etiquetas = (
  SELECT string_agg(
    CASE 
      WHEN etiqueta_id = ed.id_remover THEN em.id_manter::text
      ELSE etiqueta_id::text
    END, 
    ','
  )
  FROM (
    SELECT unnest(string_to_array(id_etiquetas, ','))::int as etiqueta_id
  ) as ids
  LEFT JOIN etiquetas_para_remover ed ON ids.etiqueta_id = ed.id_remover
  LEFT JOIN etiquetas_para_manter em ON ed.id_remover IS NOT NULL
)
WHERE id_etiquetas IS NOT NULL 
  AND id_etiquetas != ''
  AND EXISTS (
    SELECT 1 FROM etiquetas_para_remover 
    WHERE id_remover IN (
      SELECT unnest(string_to_array(id_etiquetas, ','))::int
    )
  );

-- Remover etiquetas duplicadas (manter apenas a primeira)
DELETE FROM etiquetas 
WHERE id IN (
  WITH etiquetas_duplicadas AS (
    SELECT 
      lower(trim(nome)) as nome_normalizado,
      array_agg(id ORDER BY created_at ASC) as ids
    FROM etiquetas
    GROUP BY lower(trim(nome))
    HAVING count(*) > 1
  )
  SELECT unnest(ids[2:]) -- Remove todas exceto a primeira
  FROM etiquetas_duplicadas
);

-- 4. NORMALIZAR NOMES DAS ETIQUETAS
-- Capitalizar primeira letra de cada palavra
UPDATE etiquetas 
SET nome = initcap(trim(nome))
WHERE nome != initcap(trim(nome));

-- 5. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_etiquetas_id_cliente ON etiquetas(id_cliente);
CREATE INDEX IF NOT EXISTS idx_etiquetas_nome ON etiquetas(lower(nome));
CREATE INDEX IF NOT EXISTS idx_leads_id_etiquetas ON leads USING gin(string_to_array(id_etiquetas, ',')::int[]);

-- 6. ADICIONAR CONSTRAINTS PARA EVITAR DUPLICATAS FUTURAS
-- Constraint única para (id_cliente, nome_normalizado)
ALTER TABLE etiquetas 
ADD CONSTRAINT unique_etiqueta_nome_cliente 
UNIQUE (id_cliente, lower(trim(nome)));

-- 7. FUNÇÃO PARA LIMPAR ETIQUETAS ÓRFÃAS DE UM LEAD
CREATE OR REPLACE FUNCTION limpar_etiquetas_orfas_lead(lead_id_param int)
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

-- 8. FUNÇÃO PARA LIMPAR TODAS AS ETIQUETAS ÓRFÃAS DE UM CLIENTE
CREATE OR REPLACE FUNCTION limpar_todas_etiquetas_orfas_cliente(cliente_id_param int)
RETURNS TABLE(leads_atualizados int, etiquetas_orfas_removidas int) AS $$
DECLARE
  lead_record record;
  etiquetas_limpas text;
  leads_count int := 0;
  orfas_count int := 0;
BEGIN
  -- Processar cada lead do cliente
  FOR lead_record IN 
    SELECT id, id_etiquetas
    FROM leads 
    WHERE id_cliente = cliente_id_param
      AND id_etiquetas IS NOT NULL 
      AND id_etiquetas != ''
  LOOP
    -- Limpar etiquetas órfãs deste lead
    SELECT string_agg(etiqueta_id::text, ',') INTO etiquetas_limpas
    FROM (
      SELECT DISTINCT unnest(string_to_array(lead_record.id_etiquetas, ','))::int as etiqueta_id
    ) as ids
    WHERE etiqueta_id IN (
      SELECT id FROM etiquetas 
      WHERE id_cliente = cliente_id_param OR id_cliente IS NULL
    );
    
    -- Contar etiquetas órfãs removidas
    orfas_count := orfas_count + (
      SELECT count(*)
      FROM (
        SELECT unnest(string_to_array(lead_record.id_etiquetas, ','))::int as etiqueta_id
      ) as ids
      WHERE etiqueta_id NOT IN (
        SELECT id FROM etiquetas 
        WHERE id_cliente = cliente_id_param OR id_cliente IS NULL
      )
    );
    
    -- Atualizar se houve mudanças
    IF etiquetas_limpas != lead_record.id_etiquetas THEN
      UPDATE leads 
      SET id_etiquetas = etiquetas_limpas
      WHERE id = lead_record.id;
      
      leads_count := leads_count + 1;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT leads_count, orfas_count;
END;
$$ LANGUAGE plpgsql;

-- 9. VIEW PARA MONITORAR PROBLEMAS DE ETIQUETAS
CREATE OR REPLACE VIEW v_etiquetas_problemas AS
SELECT 
  l.id as lead_id,
  l.nome as lead_nome,
  l.id_cliente,
  l.id_etiquetas,
  string_to_array(l.id_etiquetas, ',')::int[] as ids_array,
  array_length(string_to_array(l.id_etiquetas, ','), 1) as total_etiquetas,
  (
    SELECT count(*)
    FROM unnest(string_to_array(l.id_etiquetas, ','))::int as etiqueta_id
    WHERE etiqueta_id IN (
      SELECT id FROM etiquetas 
      WHERE id_cliente = l.id_cliente OR id_cliente IS NULL
    )
  ) as etiquetas_validas,
  (
    SELECT count(*)
    FROM unnest(string_to_array(l.id_etiquetas, ','))::int as etiqueta_id
    WHERE etiqueta_id NOT IN (
      SELECT id FROM etiquetas 
      WHERE id_cliente = l.id_cliente OR id_cliente IS NULL
    )
  ) as etiquetas_orfas
FROM leads l
WHERE l.id_etiquetas IS NOT NULL 
  AND l.id_etiquetas != '';

-- 10. RELATÓRIO DE PROBLEMAS
SELECT 
  'LEADS COM ETIQUETAS ÓRFÃS' as tipo_problema,
  count(*) as quantidade
FROM v_etiquetas_problemas 
WHERE etiquetas_orfas > 0

UNION ALL

SELECT 
  'ETIQUETAS DUPLICADAS' as tipo_problema,
  count(*) as quantidade
FROM (
  SELECT lower(trim(nome)) as nome_normalizado
  FROM etiquetas
  GROUP BY lower(trim(nome))
  HAVING count(*) > 1
) as duplicatas

UNION ALL

SELECT 
  'LEADS COM FORMATO INVÁLIDO' as tipo_problema,
  count(*) as quantidade
FROM leads 
WHERE id_etiquetas IS NOT NULL 
  AND id_etiquetas != ''
  AND (
    id_etiquetas ~ '\s' OR -- Contém espaços
    id_etiquetas ~ ',,+' OR -- Contém vírgulas duplicadas
    id_etiquetas ~ '^,|,$' OR -- Começa ou termina com vírgula
    id_etiquetas ~ '[^0-9,]' -- Contém caracteres não numéricos
  );
