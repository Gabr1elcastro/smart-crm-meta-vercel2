-- Script para adicionar coluna id_mensagem na tabela agente_conversacional_whatsapp
-- Execute este script no seu banco de dados Supabase

-- 1. Verificar se a coluna já existe
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'agente_conversacional_whatsapp'
AND column_name = 'id_mensagem'
ORDER BY ordinal_position;

-- 2. Adicionar a coluna id_mensagem (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'agente_conversacional_whatsapp'
        AND column_name = 'id_mensagem'
    ) THEN
        ALTER TABLE agente_conversacional_whatsapp ADD COLUMN id_mensagem VARCHAR(255);
        RAISE NOTICE 'Coluna id_mensagem adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna id_mensagem já existe';
    END IF;
END $$;

-- 3. Verificar se a coluna foi criada com sucesso
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'agente_conversacional_whatsapp'
AND column_name = 'id_mensagem'
ORDER BY ordinal_position;

-- 4. Criar índice para otimizar consultas por id_mensagem
CREATE INDEX IF NOT EXISTS idx_id_mensagem 
ON agente_conversacional_whatsapp(id_mensagem) 
WHERE id_mensagem IS NOT NULL;

-- 5. Comentário na coluna para documentação
COMMENT ON COLUMN agente_conversacional_whatsapp.id_mensagem 
IS 'ID único da mensagem no WhatsApp para exclusão via webhook';

-- 6. Verificar a estrutura final da tabela
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'agente_conversacional_whatsapp'
ORDER BY ordinal_position;
