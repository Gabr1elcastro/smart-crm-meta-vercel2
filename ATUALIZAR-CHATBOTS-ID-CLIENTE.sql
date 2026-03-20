-- Script para atualizar chatbots existentes com o id_cliente correto
-- Execute este script no SQL Editor do Supabase

-- Verificar chatbots sem id_cliente
SELECT id, nome, id_usuario, id_cliente, created_at
FROM prompts_oficial 
WHERE id_cliente IS NULL
ORDER BY created_at DESC;

-- Atualizar chatbots com id_cliente baseado no id_usuario
UPDATE prompts_oficial 
SET id_cliente = (
    SELECT ci.id 
    FROM clientes_info ci 
    WHERE ci.user_id_auth = prompts_oficial.id_usuario
    LIMIT 1
)
WHERE id_cliente IS NULL 
AND id_usuario IS NOT NULL;

-- Verificar resultado da atualização
SELECT id, nome, id_usuario, id_cliente, created_at
FROM prompts_oficial 
WHERE id_cliente IS NOT NULL
ORDER BY created_at DESC 
LIMIT 10;

-- Verificar se ainda há chatbots sem id_cliente
SELECT COUNT(*) as chatbots_sem_id_cliente
FROM prompts_oficial 
WHERE id_cliente IS NULL;

-- Mostrar estatísticas
SELECT 
    COUNT(*) as total_chatbots,
    COUNT(CASE WHEN id_cliente IS NOT NULL THEN 1 END) as com_id_cliente,
    COUNT(CASE WHEN id_cliente IS NULL THEN 1 END) as sem_id_cliente
FROM prompts_oficial;
