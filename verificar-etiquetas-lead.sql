-- Script para verificar etiquetas do lead 13450
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se o lead existe
SELECT 
    id, 
    nome, 
    id_cliente, 
    id_etiquetas,
    telefone
FROM leads 
WHERE id = 13450;

-- 2. Verificar todas as etiquetas disponíveis para o cliente 38
SELECT 
    id, 
    nome, 
    cor, 
    id_cliente,
    created_at
FROM etiquetas 
WHERE id_cliente = 38 OR id_cliente IS NULL
ORDER BY created_at DESC;

-- 3. Verificar etiquetas específicas do lead (IDs 9, 26, 15)
SELECT 
    id, 
    nome, 
    cor, 
    id_cliente,
    CASE 
        WHEN id_cliente IS NULL THEN 'Sistema'
        WHEN id_cliente = 38 THEN 'Cliente 38'
        ELSE 'Outro Cliente (' || id_cliente || ')'
    END as tipo_etiqueta
FROM etiquetas 
WHERE id IN (9, 26, 15)
ORDER BY id;

-- 4. Verificar se há etiquetas órfãs (IDs que não existem mais)
WITH etiquetas_lead AS (
    SELECT unnest(string_to_array('9,26,15', ','))::int as id_etiqueta
),
etiquetas_existentes AS (
    SELECT id FROM etiquetas WHERE id_cliente = 38 OR id_cliente IS NULL
)
SELECT 
    el.id_etiqueta,
    CASE 
        WHEN ee.id IS NOT NULL THEN 'EXISTE'
        ELSE 'NÃO EXISTE'
    END as status
FROM etiquetas_lead el
LEFT JOIN etiquetas_existentes ee ON el.id_etiqueta = ee.id
ORDER BY el.id_etiqueta;

-- 5. Verificar se há problemas de permissão (etiquetas de outros clientes)
SELECT 
    id, 
    nome, 
    id_cliente,
    CASE 
        WHEN id_cliente IS NULL THEN 'Etiqueta do Sistema'
        WHEN id_cliente = 38 THEN 'Etiqueta do Cliente 38'
        ELSE 'Etiqueta de Outro Cliente (' || id_cliente || ')'
    END as status
FROM etiquetas 
WHERE id IN (9, 26, 15);

-- 6. Contar total de etiquetas por tipo para o cliente 38
SELECT 
    CASE 
        WHEN id_cliente IS NULL THEN 'Sistema'
        WHEN id_cliente = 38 THEN 'Cliente 38'
        ELSE 'Outros Clientes'
    END as tipo,
    COUNT(*) as total
FROM etiquetas 
WHERE id_cliente = 38 OR id_cliente IS NULL
GROUP BY 
    CASE 
        WHEN id_cliente IS NULL THEN 'Sistema'
        WHEN id_cliente = 38 THEN 'Cliente 38'
        ELSE 'Outros Clientes'
    END;





















