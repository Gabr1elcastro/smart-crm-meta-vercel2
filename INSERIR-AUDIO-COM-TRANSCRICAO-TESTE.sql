-- 🎵 SCRIPT: INSERIR ÁUDIO COM TRANSCRIÇÃO DE TESTE
-- Execute no Supabase SQL Editor para testar a funcionalidade de transcrição

-- OPÇÃO 1: Mensagem de áudio recebida com transcrição
INSERT INTO agente_conversacional_whatsapp (
  conversa_id,
  mensagem,
  tipo,
  telefone_id,
  user_id,
  tipo_mensagem,
  url_arquivo,
  transcricao_audio,
  timestamp,
  created_at
) VALUES (
  'TESTE_TRANSCRICAO_' || NOW()::text,
  '🎤 Mensagem de voz',
  false, -- mensagem recebida
  '5511999999999', -- SUBSTITUA pelo telefone real
  'user_id_aqui', -- SUBSTITUA pelo user_id real
  'audio',
  'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3', -- URL de teste
  'Olá, gostaria de saber mais sobre os produtos que vocês oferecem. Pode me enviar um catálogo com os preços?',
  NOW(),
  NOW()
);

-- OPÇÃO 2: Mensagem de áudio enviada com transcrição
INSERT INTO agente_conversacional_whatsapp (
  conversa_id,
  mensagem,
  tipo,
  telefone_id,
  user_id,
  tipo_mensagem,
  url_arquivo,
  transcricao_audio,
  timestamp,
  created_at
) VALUES (
  'TESTE_TRANSCRICAO_ENVIADA_' || NOW()::text,
  '🎤 Mensagem de voz',
  true, -- mensagem enviada
  '5511999999999', -- SUBSTITUA pelo telefone real
  'user_id_aqui', -- SUBSTITUA pelo user_id real
  'audio',
  'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3', -- URL de teste
  'Claro! Vou te enviar nosso catálogo completo com todos os produtos e preços. Você pode escolher o que melhor atende suas necessidades.',
  NOW(),
  NOW()
);

-- OPÇÃO 3: Mensagem de áudio sem transcrição (para comparar)
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
  'TESTE_AUDIO_SEM_TRANSCRICAO_' || NOW()::text,
  '🎤 Mensagem de voz',
  false, -- mensagem recebida
  '5511999999999', -- SUBSTITUA pelo telefone real
  'user_id_aqui', -- SUBSTITUA pelo user_id real
  'audio',
  'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3', -- URL de teste
  NOW(),
  NOW()
);

-- ✅ APÓS EXECUTAR:
-- 1. Vá para as conversas
-- 2. Selecione o contato com telefone 5511999999999
-- 3. Deve aparecer:
--    - Player de áudio
--    - Transcrição abaixo (para as duas primeiras mensagens)
--    - Apenas player (para a terceira mensagem)
-- 4. Verifique se as cores das bordas estão corretas:
--    - Azul para mensagens enviadas
--    - Cinza para mensagens recebidas

-- 🗑️ LIMPAR TESTE (opcional):
-- DELETE FROM agente_conversacional_whatsapp 
-- WHERE conversa_id LIKE 'TESTE_TRANSCRICAO%' OR conversa_id LIKE 'TESTE_AUDIO_SEM_TRANSCRICAO%';

-- 📊 VERIFICAR RESULTADO:
-- SELECT 
--   id,
--   conversa_id,
--   mensagem,
--   tipo,
--   tipo_mensagem,
--   url_arquivo,
--   transcricao_audio,
--   timestamp
-- FROM agente_conversacional_whatsapp 
-- WHERE conversa_id LIKE 'TESTE_TRANSCRICAO%' OR conversa_id LIKE 'TESTE_AUDIO_SEM_TRANSCRICAO%'
-- ORDER BY created_at DESC; 