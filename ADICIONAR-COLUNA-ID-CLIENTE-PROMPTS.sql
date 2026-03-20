-- Script para adicionar a coluna id_cliente na tabela prompts_oficial
-- Execute este script no SQL Editor do Supabase

-- Verificar se a coluna id_cliente já existe
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'prompts_oficial' 
AND column_name = 'id_cliente';

-- Adicionar a coluna id_cliente se ela não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'prompts_oficial' 
        AND column_name = 'id_cliente'
    ) THEN
        ALTER TABLE prompts_oficial 
        ADD COLUMN id_cliente INTEGER;
        
        RAISE NOTICE 'Coluna id_cliente adicionada com sucesso na tabela prompts_oficial';
    ELSE
        RAISE NOTICE 'Coluna id_cliente já existe na tabela prompts_oficial';
    END IF;
END $$;

-- Verificar a estrutura final da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'prompts_oficial'
ORDER BY ordinal_position;

-- Verificar chatbots existentes
SELECT id, nome, id_usuario, id_cliente, em_uso, created_at
FROM prompts_oficial 
ORDER BY created_at DESC 
LIMIT 10;
