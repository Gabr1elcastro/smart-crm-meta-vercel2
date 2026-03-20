-- Script para adicionar as novas colunas de venda na tabela leads
-- Este script adiciona as colunas venda (boolean) e data_venda (date) para rastrear
-- quando um lead foi marcado como ganho (TRUE) ou perdido (FALSE)

-- 1. Adicionar a coluna venda (boolean)
ALTER TABLE leads 
ADD COLUMN venda BOOLEAN DEFAULT NULL;

-- 2. Adicionar a coluna data_venda (date)
ALTER TABLE leads 
ADD COLUMN data_venda DATE DEFAULT NULL;

-- 3. Verificar se as colunas foram criadas com sucesso
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND column_name IN ('venda', 'data_venda')
ORDER BY ordinal_position;

-- 4. Atualizar leads existentes que já têm status 'Ganho' ou 'Perdido'
-- Para leads com status 'Ganho'
UPDATE leads 
SET 
    venda = TRUE,
    data_venda = COALESCE(data_ultimo_status::date, data_criacao::date)
WHERE status = 'Ganho' 
AND venda IS NULL;

-- Para leads com status 'Perdido'
UPDATE leads 
SET 
    venda = FALSE,
    data_venda = COALESCE(data_ultimo_status::date, data_criacao::date)
WHERE status = 'Perdido' 
AND venda IS NULL;

-- 5. Verificar a distribuição dos dados após a migração
SELECT 
    status,
    venda,
    COUNT(*) as quantidade
FROM leads 
GROUP BY status, venda
ORDER BY status, venda;

-- 6. Verificar leads que ainda não têm status de venda definido
SELECT 
    COUNT(*) as leads_sem_status_venda
FROM leads 
WHERE venda IS NULL;

-- 7. Criar índice para melhorar performance de consultas por status de venda
CREATE INDEX IF NOT EXISTS idx_leads_venda ON leads(venda);
CREATE INDEX IF NOT EXISTS idx_leads_data_venda ON leads(data_venda);

-- 8. Verificar os índices criados
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE tablename = 'leads' 
AND indexname LIKE '%venda%';

-- 9. Teste: Inserir um lead de teste para verificar as novas colunas
-- INSERT INTO leads (
--     id_cliente, 
--     nome, 
--     telefone, 
--     status, 
--     data_criacao, 
--     data_ultimo_status, 
--     nome_instancia,
--     venda,
--     data_venda
-- ) VALUES (
--     1, 
--     'Teste Venda', 
--     '5511999999999', 
--     'Ganho', 
--     NOW(), 
--     NOW(), 
--     'Teste',
--     TRUE,
--     CURRENT_DATE
-- );

-- 10. Verificar a estrutura final da tabela leads
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'leads' 
ORDER BY ordinal_position; 