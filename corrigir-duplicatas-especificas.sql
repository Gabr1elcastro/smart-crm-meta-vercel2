-- Script para corrigir as duplicatas específicas encontradas no diagnóstico
-- Execute no Supabase SQL Editor

-- 1. CORRIGIR DUPLICATAS DE "OPORTUNIDADE"
-- Manter apenas a etiqueta do sistema (ID 8) e remover as outras
UPDATE leads 
SET id_etiquetas = '8'
WHERE id_etiquetas IN ('10', '26', '27');

-- Remover etiquetas duplicadas (manter apenas ID 8)
DELETE FROM etiquetas WHERE id IN (10, 26, 27);

-- 2. CORRIGIR DUPLICATAS DE "CONVERSA EM ANDAMENTO"
-- Manter a mais antiga (ID 13) e atualizar leads que usam ID 15
UPDATE leads 
SET id_etiquetas = '13'
WHERE id_etiquetas = '15';

DELETE FROM etiquetas WHERE id = 15;

-- 3. CORRIGIR DUPLICATAS DE "FOLLOW-UP"
-- Manter a mais antiga (ID 21) e atualizar leads que usam ID 14
UPDATE leads 
SET id_etiquetas = '21'
WHERE id_etiquetas = '14';

DELETE FROM etiquetas WHERE id = 14;

-- 4. CORRIGIR DUPLICATAS DE "PAROU DE RESPONDER"
-- Manter a mais antiga (ID 19) e atualizar leads que usam ID 17
UPDATE leads 
SET id_etiquetas = '19'
WHERE id_etiquetas = '17';

DELETE FROM etiquetas WHERE id = 17;

-- 5. CORRIGIR DUPLICATAS DE "VIU E NÃO RESPONDEU"
-- Manter a mais antiga (ID 18) e atualizar leads que usam ID 16
UPDATE leads 
SET id_etiquetas = '18'
WHERE id_etiquetas = '16';

DELETE FROM etiquetas WHERE id = 16;

-- 6. VERIFICAR RESULTADO
SELECT 
  'ETIQUETAS RESTANTES' as status,
  count(*) as total,
  count(CASE WHEN id_cliente IS NULL THEN 1 END) as sistema,
  count(CASE WHEN id_cliente IS NOT NULL THEN 1 END) as personalizadas
FROM etiquetas;

-- 7. VERIFICAR LEADS AFETADOS
SELECT 
  'LEADS ATUALIZADOS' as status,
  count(*) as total_leads_atualizados
FROM leads 
WHERE id_etiquetas IN ('8', '13', '18', '19', '21');

-- 8. VERIFICAR SE AINDA HÁ DUPLICATAS
SELECT 
  lower(trim(nome)) as nome_normalizado,
  count(*) as quantidade,
  string_agg(id::text, ', ') as ids,
  string_agg(nome, ' | ') as nomes_originais
FROM etiquetas
GROUP BY lower(trim(nome))
HAVING count(*) > 1
ORDER BY quantidade DESC;
