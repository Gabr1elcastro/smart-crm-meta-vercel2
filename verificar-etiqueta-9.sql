-- Script para verificar especificamente a etiqueta 9
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se a etiqueta 9 existe
SELECT 
    id, 
    nome, 
    cor, 
    id_cliente,
    created_at
FROM etiquetas 
WHERE id = 9;

-- 2. Verificar todas as etiquetas padrão do sistema (id_cliente IS NULL)
SELECT 
    id, 
    nome, 
    cor, 
    id_cliente,
    created_at
FROM etiquetas 
WHERE id_cliente IS NULL
ORDER BY id;

-- 3. Verificar a consulta exata que o sistema faz
SELECT 
    id, 
    nome, 
    cor, 
    id_cliente,
    created_at
FROM etiquetas 
WHERE id_cliente = 38 OR id_cliente IS NULL
ORDER BY created_at DESC;

-- 4. Verificar se há alguma etiqueta com ID 9 em qualquer cliente
SELECT 
    id, 
    nome, 
    cor, 
    id_cliente,
    created_at
FROM etiquetas 
WHERE id = 9;





















