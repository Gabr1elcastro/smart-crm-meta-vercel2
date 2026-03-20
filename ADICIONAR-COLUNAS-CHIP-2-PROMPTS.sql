-- Script para adicionar colunas instance_id_2 e em_uso_2 na tabela prompts_oficial
-- Execute este script no SQL Editor do Supabase

-- Verificar se as colunas já existem
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'prompts_oficial' 
AND column_name IN ('instance_id_2', 'em_uso_2');

-- Adicionar a coluna instance_id_2 se ela não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'prompts_oficial' 
        AND column_name = 'instance_id_2'
    ) THEN
        ALTER TABLE prompts_oficial 
        ADD COLUMN instance_id_2 TEXT;
        
        RAISE NOTICE 'Coluna instance_id_2 adicionada com sucesso na tabela prompts_oficial';
    ELSE
        RAISE NOTICE 'Coluna instance_id_2 já existe na tabela prompts_oficial';
    END IF;
END $$;

-- Adicionar a coluna em_uso_2 se ela não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'prompts_oficial' 
        AND column_name = 'em_uso_2'
    ) THEN
        ALTER TABLE prompts_oficial 
        ADD COLUMN em_uso_2 BOOLEAN DEFAULT FALSE;
        
        RAISE NOTICE 'Coluna em_uso_2 adicionada com sucesso na tabela prompts_oficial';
    ELSE
        RAISE NOTICE 'Coluna em_uso_2 já existe na tabela prompts_oficial';
    END IF;
END $$;

-- Verificar a estrutura final da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'prompts_oficial'
AND column_name IN ('instance_id', 'instance_id_2', 'em_uso', 'em_uso_2')
ORDER BY ordinal_position;

-- Verificar dados existentes
SELECT id, nome, instance_id, instance_id_2, em_uso, em_uso_2, created_at
FROM prompts_oficial 
ORDER BY created_at DESC 
LIMIT 10;
