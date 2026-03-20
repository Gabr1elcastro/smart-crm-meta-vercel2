-- Script para criar a etiqueta 9 padrão do sistema
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se a etiqueta 9 já existe
SELECT 
    id, 
    nome, 
    cor, 
    id_cliente
FROM etiquetas 
WHERE id = 9;

-- 2. Se não existir, criar a etiqueta 9 padrão do sistema
-- (Execute apenas se a consulta acima não retornar resultados)
INSERT INTO etiquetas (id, nome, cor, id_cliente, created_at)
VALUES (9, 'OPORTUNIDADE', '#993399', NULL, NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. Verificar se foi criada
SELECT 
    id, 
    nome, 
    cor, 
    id_cliente,
    created_at
FROM etiquetas 
WHERE id = 9;

-- 4. Verificar todas as etiquetas padrão do sistema
SELECT 
    id, 
    nome, 
    cor, 
    id_cliente
FROM etiquetas 
WHERE id_cliente IS NULL
ORDER BY id;





















