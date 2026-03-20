-- SQL Script: Adicionar colunas para sistema de áudio
-- Execute este script no seu banco de dados Supabase

-- 1. Adicionar coluna tipo_mensagem com valores pré-definidos
ALTER TABLE agente_conversacional_whatsapp 
ADD COLUMN IF NOT EXISTS tipo_mensagem VARCHAR(10) 
CHECK (tipo_mensagem IN ('texto', 'audio', 'imagem', 'video')) 
DEFAULT 'texto';

-- 2. Adicionar coluna url_arquivo para armazenar URLs de arquivos
ALTER TABLE agente_conversacional_whatsapp 
ADD COLUMN IF NOT EXISTS url_arquivo TEXT;

-- 3. Atualizar mensagens existentes para tipo 'texto' (se a coluna for NULL)
UPDATE agente_conversacional_whatsapp 
SET tipo_mensagem = 'texto' 
WHERE tipo_mensagem IS NULL;

-- 4. Criar índice para otimizar consultas por tipo de mensagem
CREATE INDEX IF NOT EXISTS idx_tipo_mensagem 
ON agente_conversacional_whatsapp(tipo_mensagem);

-- 5. Comentários nas colunas para documentação
COMMENT ON COLUMN agente_conversacional_whatsapp.tipo_mensagem 
IS 'Tipo da mensagem: texto, audio, imagem ou video';

COMMENT ON COLUMN agente_conversacional_whatsapp.url_arquivo 
IS 'URL do arquivo armazenado no Supabase Storage (apenas para mensagens não-texto)';

-- 6. Se necessário, também aplicar as mesmas alterações na tabela alternativa
-- (descomente as linhas abaixo se você usar a tabela whatsapp_messages)

/*
ALTER TABLE whatsapp_messages 
ADD COLUMN IF NOT EXISTS tipo_mensagem VARCHAR(10) 
CHECK (tipo_mensagem IN ('texto', 'audio', 'imagem', 'video')) 
DEFAULT 'texto';

ALTER TABLE whatsapp_messages 
ADD COLUMN IF NOT EXISTS url_arquivo TEXT;

UPDATE whatsapp_messages 
SET tipo_mensagem = 'texto' 
WHERE tipo_mensagem IS NULL;

CREATE INDEX IF NOT EXISTS idx_tipo_mensagem_wm 
ON whatsapp_messages(tipo_mensagem);
*/

-- Verificar se as colunas foram criadas corretamente
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'agente_conversacional_whatsapp' 
AND column_name IN ('tipo_mensagem', 'url_arquivo');

-- Exemplo de como inserir uma mensagem de áudio:
-- INSERT INTO agente_conversacional_whatsapp (
--     conversa_id, mensagem, tipo, telefone_id, instance_id, 
--     user_id, tipo_mensagem, url_arquivo, timestamp, created_at
-- ) VALUES (
--     'contato_usuario', '🎤 Mensagem de voz', true, '+5511999999999@s.whatsapp.net', 
--     'sua_instance_id', 'user_id', 'audio', 
--     'https://supabase-url/storage/v1/object/public/audioswpp/audio_123.webm',
--     NOW(), NOW()
-- ); 