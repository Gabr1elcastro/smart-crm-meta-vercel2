-- Script para resolver o problema de duplicação de contatos
-- Este script adiciona uma constraint UNIQUE na tabela leads para garantir que
-- não possam existir dois leads com o mesmo id_cliente e telefone

-- 1. Primeiro, vamos verificar se já existem duplicatas na tabela
SELECT 
    id_cliente,
    telefone,
    COUNT(*) as quantidade
FROM leads 
GROUP BY id_cliente, telefone 
HAVING COUNT(*) > 1
ORDER BY quantidade DESC;

-- 2. Se existirem duplicatas, você pode querer removê-las primeiro
-- (Execute apenas se quiser remover duplicatas existentes)
-- DELETE FROM leads 
-- WHERE id IN (
--     SELECT id FROM (
--         SELECT id,
--         ROW_NUMBER() OVER (PARTITION BY id_cliente, telefone ORDER BY data_criacao DESC) as rn
--         FROM leads
--     ) t 
--     WHERE t.rn > 1
-- );

-- 3. Adicionar a constraint UNIQUE para prevenir duplicatas futuras
-- Esta constraint garante que não possam existir dois leads com o mesmo id_cliente e telefone
ALTER TABLE leads 
ADD CONSTRAINT unique_lead_cliente_telefone 
UNIQUE (id_cliente, telefone);

-- 4. Verificar se a constraint foi criada com sucesso
SELECT 
    constraint_name,
    table_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'leads' 
AND constraint_name = 'unique_lead_cliente_telefone';

-- 5. Teste a constraint tentando inserir um lead duplicado (deve falhar)
-- INSERT INTO leads (id_cliente, telefone, nome, status, data_criacao, data_ultimo_status, nome_instancia)
-- VALUES (1, '5511999999999', 'Teste Duplicado', 'Novo', NOW(), NOW(), 'Teste');
-- (Este comando deve falhar se a constraint estiver funcionando)

-- 6. Verificar a estrutura atual da tabela leads
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'leads' 
ORDER BY ordinal_position; 