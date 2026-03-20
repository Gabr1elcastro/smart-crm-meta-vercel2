-- Script para adicionar coluna de transcrição de áudio
-- Execute este script no seu banco de dados Supabase

-- 1. Verificar se a coluna já existe
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'agente_conversacional_whatsapp'
AND column_name = 'transcricao_audio'
ORDER BY ordinal_position;

-- 2. Adicionar a coluna transcricao_audio (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'agente_conversacional_whatsapp'
        AND column_name = 'transcricao_audio'
    ) THEN
        ALTER TABLE agente_conversacional_whatsapp ADD COLUMN transcricao_audio TEXT;
        RAISE NOTICE 'Coluna transcricao_audio adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna transcricao_audio já existe';
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
AND column_name = 'transcricao_audio'
ORDER BY ordinal_position;

-- 4. Criar índice para otimizar consultas por transcrição
CREATE INDEX IF NOT EXISTS idx_transcricao_audio 
ON agente_conversacional_whatsapp(transcricao_audio) 
WHERE transcricao_audio IS NOT NULL;

-- 5. Comentário na coluna para documentação
COMMENT ON COLUMN agente_conversacional_whatsapp.transcricao_audio 
IS 'Transcrição do áudio da mensagem (quando disponível)';

-- 6. Verificar a estrutura final da tabela
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'agente_conversacional_whatsapp'
ORDER BY ordinal_position;

-- 7. Exemplo de como inserir uma mensagem de áudio com transcrição:
-- INSERT INTO agente_conversacional_whatsapp (
--     conversa_id,
--     mensagem,
--     tipo,
--     telefone_id,
--     user_id,
--     tipo_mensagem,
--     url_arquivo,
--     transcricao_audio,
--     timestamp,
--     created_at
-- ) VALUES (
--     'contato_usuario',
--     '🎤 Mensagem de voz',
--     false, -- mensagem recebida
--     '+5511999999999@s.whatsapp.net',
--     'user_id_aqui',
--     'audio',
--     'https://supabase-url/storage/v1/object/public/audioswpp/audio_123.webm',
--     'Olá, gostaria de saber mais sobre o produto que vocês oferecem.',
--     NOW(),
--     NOW()
-- ); 