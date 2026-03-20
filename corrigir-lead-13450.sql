-- Script para corrigir etiquetas órfãs do lead 13450
-- Execute este script no Supabase SQL Editor

-- 1. Verificar o estado atual do lead
SELECT 
    id, 
    nome, 
    id_cliente, 
    id_etiquetas
FROM leads 
WHERE id = 13450;

-- 2. Corrigir as etiquetas do lead 13450
-- Remover a etiqueta órfã (ID 9) e manter apenas as válidas (26, 15)
UPDATE leads 
SET id_etiquetas = '26,15'
WHERE id = 13450;

-- 3. Verificar se a correção foi aplicada
SELECT 
    id, 
    nome, 
    id_cliente, 
    id_etiquetas
FROM leads 
WHERE id = 13450;

-- 4. Opcional: Limpar todas as etiquetas órfãs do cliente 38
-- (Execute apenas se quiser limpar todos os leads do cliente)
/*
WITH etiquetas_validas AS (
    SELECT id FROM etiquetas 
    WHERE id_cliente = 38 OR id_cliente IS NULL
),
leads_com_etiquetas AS (
    SELECT 
        l.id,
        l.id_etiquetas,
        string_to_array(l.id_etiquetas, ',') as etiquetas_array
    FROM leads l
    WHERE l.id_cliente = 38 
    AND l.id_etiquetas IS NOT NULL 
    AND l.id_etiquetas != ''
)
UPDATE leads 
SET id_etiquetas = (
    SELECT string_agg(etiqueta_id::text, ',')
    FROM unnest(string_to_array(leads.id_etiquetas, ',')) as etiqueta_id
    WHERE etiqueta_id::int IN (SELECT id FROM etiquetas_validas)
)
WHERE id IN (
    SELECT l.id 
    FROM leads_com_etiquetas l
    WHERE EXISTS (
        SELECT 1 
        FROM unnest(l.etiquetas_array) as etiqueta_id
        WHERE etiqueta_id::int NOT IN (SELECT id FROM etiquetas_validas)
    )
);
*/





















