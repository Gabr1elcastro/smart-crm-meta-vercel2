-- Script para adicionar coluna instance_name_chip_associado na tabela prompts_oficial
-- Execute este script no SQL Editor do Supabase

-- Verificar se a coluna já existe
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'prompts_oficial' 
AND column_name = 'instance_name_chip_associado';

-- Adicionar a coluna instance_name_chip_associado se ela não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'prompts_oficial' 
        AND column_name = 'instance_name_chip_associado'
    ) THEN
        ALTER TABLE prompts_oficial 
        ADD COLUMN instance_name_chip_associado TEXT;
        
        RAISE NOTICE 'Coluna instance_name_chip_associado adicionada com sucesso na tabela prompts_oficial';
    ELSE
        RAISE NOTICE 'Coluna instance_name_chip_associado já existe na tabela prompts_oficial';
    END IF;
END $$;

-- Verificar a estrutura final da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'prompts_oficial'
AND column_name IN ('instance_id', 'instance_id_2', 'em_uso', 'em_uso_2', 'instance_name_chip_associado')
ORDER BY ordinal_position;

-- Verificar dados existentes
SELECT id, nome, instance_id, instance_id_2, em_uso, em_uso_2, instance_name_chip_associado, created_at
FROM prompts_oficial 
ORDER BY created_at DESC 
LIMIT 10;
