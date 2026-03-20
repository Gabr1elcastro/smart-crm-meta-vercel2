-- Script para adicionar campos de histórico na tabela leads
-- Este script adiciona as colunas instance_id_2 e nome_instancia_2 para manter
-- o histórico das conversas quando um lead muda de departamento

-- 1. Verificar se as colunas já existem
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND column_name IN ('instance_id_2', 'nome_instancia_2')
ORDER BY ordinal_position;

-- 2. Adicionar a coluna instance_id_2 (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' 
        AND column_name = 'instance_id_2'
    ) THEN
        ALTER TABLE leads ADD COLUMN instance_id_2 TEXT;
        RAISE NOTICE 'Coluna instance_id_2 adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna instance_id_2 já existe';
    END IF;
END $$;

-- 3. Adicionar a coluna nome_instancia_2 (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' 
        AND column_name = 'nome_instancia_2'
    ) THEN
        ALTER TABLE leads ADD COLUMN nome_instancia_2 TEXT;
        RAISE NOTICE 'Coluna nome_instancia_2 adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna nome_instancia_2 já existe';
    END IF;
END $$;

-- 4. Verificar se as colunas foram criadas com sucesso
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND column_name IN ('instance_id_2', 'nome_instancia_2')
ORDER BY ordinal_position;

-- 5. Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_leads_instance_id_2 ON leads(instance_id_2) WHERE instance_id_2 IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_nome_instancia_2 ON leads(nome_instancia_2) WHERE nome_instancia_2 IS NOT NULL;

-- 6. Verificar os índices criados
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE tablename = 'leads' 
AND indexname LIKE '%instance_id_2%' OR indexname LIKE '%nome_instancia_2%';

-- 7. Verificar a estrutura final da tabela leads
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'leads' 
ORDER BY ordinal_position; 