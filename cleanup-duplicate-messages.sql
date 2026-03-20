-- Script para limpar mensagens duplicadas na tabela agente_conversacional_whatsapp
-- Este script mantém apenas uma mensagem por combinação de telefone_id, mensagem e timestamp (aproximadamente)

-- Primeira etapa: Identificar e manter apenas o primeiro registro de cada grupo de duplicatas
WITH mensagens_duplicadas AS (
  SELECT 
    id,
    telefone_id,
    mensagem,
    timestamp,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY 
        telefone_id, 
        mensagem, 
        DATE_TRUNC('minute', COALESCE(timestamp::timestamp, created_at))
      ORDER BY created_at ASC
    ) as rn
  FROM agente_conversacional_whatsapp
  WHERE telefone_id IS NOT NULL 
    AND mensagem IS NOT NULL
    AND TRIM(mensagem) != ''
)
DELETE FROM agente_conversacional_whatsapp 
WHERE id IN (
  SELECT id 
  FROM mensagens_duplicadas 
  WHERE rn > 1
);

-- Segunda etapa: Verificar duplicatas exatas (mesmo conteúdo, mesmo telefone, mesmo timestamp exato)
WITH duplicatas_exatas AS (
  SELECT 
    id,
    telefone_id,
    mensagem,
    timestamp,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY 
        telefone_id, 
        mensagem, 
        timestamp,
        tipo
      ORDER BY created_at ASC
    ) as rn
  FROM agente_conversacional_whatsapp
  WHERE telefone_id IS NOT NULL 
    AND mensagem IS NOT NULL
)
DELETE FROM agente_conversacional_whatsapp 
WHERE id IN (
  SELECT id 
  FROM duplicatas_exatas 
  WHERE rn > 1
);

-- Relatório final: Mostrar quantas mensagens restaram após limpeza
SELECT 
  'Total de mensagens após limpeza' as status,
  COUNT(*) as quantidade
FROM agente_conversacional_whatsapp
UNION ALL
SELECT 
  'Mensagens por telefone (top 10)' as status,
  COUNT(*) as quantidade
FROM agente_conversacional_whatsapp
WHERE telefone_id IN (
  SELECT telefone_id 
  FROM agente_conversacional_whatsapp 
  GROUP BY telefone_id 
  ORDER BY COUNT(*) DESC 
  LIMIT 10
);

-- Comando para verificar se ainda existem duplicatas:
-- SELECT telefone_id, mensagem, COUNT(*) as duplicatas
-- FROM agente_conversacional_whatsapp
-- GROUP BY telefone_id, mensagem, DATE_TRUNC('minute', COALESCE(timestamp::timestamp, created_at))
-- HAVING COUNT(*) > 1
-- ORDER BY duplicatas DESC; 