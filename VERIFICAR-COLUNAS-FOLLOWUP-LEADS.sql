-- Script para verificar e adicionar colunas de followup na tabela leads
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se as colunas já existem
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'leads'
AND column_name IN (
    'id_followup',
    'primeiro_followup_data',
    'primeiro_followup_hora',
    'primeiro_followup_mensagem',
    'segundo_followup_data',
    'segundo_followup_hora',
    'segundo_followup_mensagem',
    'terceiro_followup_data',
    'terceiro_followup_hora',
    'terceiro_followup_mensagem'
)
ORDER BY ordinal_position;

-- 2. Adicionar coluna id_followup (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'leads'
        AND column_name = 'id_followup'
    ) THEN
        ALTER TABLE leads ADD COLUMN id_followup INTEGER;
        RAISE NOTICE 'Coluna id_followup adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna id_followup já existe';
    END IF;
END $$;

-- 3. Adicionar coluna primeiro_followup_data (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'leads'
        AND column_name = 'primeiro_followup_data'
    ) THEN
        ALTER TABLE leads ADD COLUMN primeiro_followup_data DATE;
        RAISE NOTICE 'Coluna primeiro_followup_data adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna primeiro_followup_data já existe';
    END IF;
END $$;

-- 4. Adicionar coluna primeiro_followup_hora (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'leads'
        AND column_name = 'primeiro_followup_hora'
    ) THEN
        ALTER TABLE leads ADD COLUMN primeiro_followup_hora TIME;
        RAISE NOTICE 'Coluna primeiro_followup_hora adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna primeiro_followup_hora já existe';
    END IF;
END $$;

-- 5. Adicionar coluna primeiro_followup_mensagem (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'leads'
        AND column_name = 'primeiro_followup_mensagem'
    ) THEN
        ALTER TABLE leads ADD COLUMN primeiro_followup_mensagem TEXT;
        RAISE NOTICE 'Coluna primeiro_followup_mensagem adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna primeiro_followup_mensagem já existe';
    END IF;
END $$;

-- 6. Adicionar coluna segundo_followup_data (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'leads'
        AND column_name = 'segundo_followup_data'
    ) THEN
        ALTER TABLE leads ADD COLUMN segundo_followup_data DATE;
        RAISE NOTICE 'Coluna segundo_followup_data adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna segundo_followup_data já existe';
    END IF;
END $$;

-- 7. Adicionar coluna segundo_followup_hora (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'leads'
        AND column_name = 'segundo_followup_hora'
    ) THEN
        ALTER TABLE leads ADD COLUMN segundo_followup_hora TIME;
        RAISE NOTICE 'Coluna segundo_followup_hora adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna segundo_followup_hora já existe';
    END IF;
END $$;

-- 8. Adicionar coluna segundo_followup_mensagem (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'leads'
        AND column_name = 'segundo_followup_mensagem'
    ) THEN
        ALTER TABLE leads ADD COLUMN segundo_followup_mensagem TEXT;
        RAISE NOTICE 'Coluna segundo_followup_mensagem adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna segundo_followup_mensagem já existe';
    END IF;
END $$;

-- 9. Adicionar coluna terceiro_followup_data (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'leads'
        AND column_name = 'terceiro_followup_data'
    ) THEN
        ALTER TABLE leads ADD COLUMN terceiro_followup_data DATE;
        RAISE NOTICE 'Coluna terceiro_followup_data adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna terceiro_followup_data já existe';
    END IF;
END $$;

-- 10. Adicionar coluna terceiro_followup_hora (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'leads'
        AND column_name = 'terceiro_followup_hora'
    ) THEN
        ALTER TABLE leads ADD COLUMN terceiro_followup_hora TIME;
        RAISE NOTICE 'Coluna terceiro_followup_hora adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna terceiro_followup_hora já existe';
    END IF;
END $$;

-- 11. Adicionar coluna terceiro_followup_mensagem (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'leads'
        AND column_name = 'terceiro_followup_mensagem'
    ) THEN
        ALTER TABLE leads ADD COLUMN terceiro_followup_mensagem TEXT;
        RAISE NOTICE 'Coluna terceiro_followup_mensagem adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna terceiro_followup_mensagem já existe';
    END IF;
END $$;

-- 12. Verificar se as colunas foram criadas com sucesso
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'leads'
AND column_name IN (
    'id_followup',
    'primeiro_followup_data',
    'primeiro_followup_hora',
    'primeiro_followup_mensagem',
    'segundo_followup_data',
    'segundo_followup_hora',
    'segundo_followup_mensagem',
    'terceiro_followup_data',
    'terceiro_followup_hora',
    'terceiro_followup_mensagem'
)
ORDER BY ordinal_position;

-- 13. Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_leads_id_followup ON leads(id_followup) WHERE id_followup IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_primeiro_followup_data ON leads(primeiro_followup_data) WHERE primeiro_followup_data IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_segundo_followup_data ON leads(segundo_followup_data) WHERE segundo_followup_data IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_terceiro_followup_data ON leads(terceiro_followup_data) WHERE terceiro_followup_data IS NOT NULL;

-- 14. Verificar os índices criados
SELECT
    indexname,
    tablename,
    indexdef
FROM pg_indexes
WHERE tablename = 'leads'
AND indexname LIKE '%followup%';

-- 15. Verificar a estrutura final da tabela leads
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'leads'
ORDER BY ordinal_position; 