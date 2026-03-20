-- 🎵 SCRIPT: INSERIR ÁUDIO DE TESTE
-- Execute no Supabase SQL Editor para testar reprodução

-- OPÇÃO 1: Áudio de teste público (MP3)
INSERT INTO agente_conversacional_whatsapp (
  conversa_id,
  mensagem,
  tipo,
  telefone_id,
  user_id,
  tipo_mensagem,
  url_arquivo,
  timestamp,
  created_at
) VALUES (
  'TESTE_AUDIO_' || NOW()::text,
  '🎤 Áudio de teste',
  false, -- mensagem recebida
  '5511999999999', -- SUBSTITUA pelo telefone real
  'user_id_aqui', -- SUBSTITUA pelo user_id real
  'audio',
  'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3',
  NOW(),
  NOW()
);

-- OPÇÃO 2: Se você tem um áudio OGG no Supabase Storage
-- INSERT INTO agente_conversacional_whatsapp (
--   conversa_id,
--   mensagem,
--   tipo,
--   telefone_id,
--   user_id,
--   tipo_mensagem,
--   url_arquivo,
--   timestamp,
--   created_at
-- ) VALUES (
--   'TESTE_AUDIO_OGG_' || NOW()::text,
--   '🎤 Áudio OGG de teste',
--   true, -- mensagem enviada
--   '5511999999999', -- SUBSTITUA pelo telefone real
--   'user_id_aqui', -- SUBSTITUA pelo user_id real
--   'audio',
--   'https://SEU_PROJETO.supabase.co/storage/v1/object/public/audioswpp/audio_123.ogg',
--   NOW(),
--   NOW()
-- );

-- ✅ APÓS EXECUTAR:
-- 1. Vá para as conversas
-- 2. Selecione o contato com telefone 5511999999999
-- 3. Deve aparecer um miniplayer de áudio
-- 4. Teste a reprodução clicando em play

-- 🗑️ LIMPAR TESTE (opcional):
-- DELETE FROM agente_conversacional_whatsapp 
-- WHERE mensagem LIKE '%Áudio de teste%'; 