-- 🎵 SCRIPT: VERIFICAR DUPLICATAS DE MENSAGENS DE ÁUDIO
-- Execute no Supabase SQL Editor para verificar se há mensagens duplicadas

-- 1. Verificar mensagens de áudio com transcrição
SELECT 
  id,
  conversa_id,
  telefone_id,
  tipo_mensagem,
  url_arquivo,
  transcricao_audio,
  timestamp,
  created_at,
  COUNT(*) as quantidade
FROM agente_conversacional_whatsapp 
WHERE tipo_mensagem = 'audio'
GROUP BY 
  id,
  conversa_id,
  telefone_id,
  tipo_mensagem,
  url_arquivo,
  transcricao_audio,
  timestamp,
  created_at
HAVING COUNT(*) > 1
ORDER BY created_at DESC;

-- 2. Verificar mensagens de áudio por telefone específico
SELECT 
  id,
  conversa_id,
  telefone_id,
  tipo_mensagem,
  url_arquivo,
  transcricao_audio,
  timestamp,
  created_at
FROM agente_conversacional_whatsapp 
WHERE tipo_mensagem = 'audio'
AND telefone_id LIKE '%5511999999999%'
ORDER BY created_at DESC;

-- 3. Verificar se há mensagens com mesmo ID mas dados diferentes
SELECT 
  id,
  COUNT(*) as quantidade,
  COUNT(DISTINCT url_arquivo) as urls_diferentes,
  COUNT(DISTINCT transcricao_audio) as transcricoes_diferentes
FROM agente_conversacional_whatsapp 
WHERE tipo_mensagem = 'audio'
GROUP BY id
HAVING COUNT(*) > 1
ORDER BY quantidade DESC;

-- 4. Verificar mensagens de áudio sem transcrição
SELECT 
  id,
  conversa_id,
  telefone_id,
  tipo_mensagem,
  url_arquivo,
  transcricao_audio,
  timestamp,
  created_at
FROM agente_conversacional_whatsapp 
WHERE tipo_mensagem = 'audio'
AND transcricao_audio IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- 5. Verificar mensagens de áudio com transcrição
SELECT 
  id,
  conversa_id,
  telefone_id,
  tipo_mensagem,
  url_arquivo,
  transcricao_audio,
  timestamp,
  created_at
FROM agente_conversacional_whatsapp 
WHERE tipo_mensagem = 'audio'
AND transcricao_audio IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- 6. Limpar mensagens de teste (se necessário)
-- DELETE FROM agente_conversacional_whatsapp 
-- WHERE conversa_id LIKE 'TESTE%' 
-- AND tipo_mensagem = 'audio';

-- 7. Verificar estrutura da tabela
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'agente_conversacional_whatsapp'
AND column_name IN ('id', 'tipo_mensagem', 'url_arquivo', 'transcricao_audio')
ORDER BY ordinal_position; 