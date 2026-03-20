-- Script para verificar se as colunas do chip 2 foram adicionadas corretamente
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se as colunas existem
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'prompts_oficial' 
AND column_name IN ('instance_id', 'instance_id_2', 'em_uso', 'em_uso_2')
ORDER BY column_name;

-- 2. Verificar dados existentes na tabela prompts_oficial
SELECT 
    id, 
    nome, 
    instance_id, 
    instance_id_2, 
    em_uso, 
    em_uso_2, 
    id_cliente,
    created_at
FROM prompts_oficial 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Verificar clientes com instance_id_2 preenchido
SELECT 
    id, 
    name, 
    email, 
    instance_id, 
    instance_id_2, 
    atendimento_ia, 
    atendimento_ia_2,
    id_departamento_chip_1,
    id_departamento_chip_2
FROM clientes_info 
WHERE instance_id_2 IS NOT NULL
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Contar quantos prompts têm instance_id_2 preenchido
SELECT 
    COUNT(*) as total_prompts,
    COUNT(instance_id) as com_instance_id,
    COUNT(instance_id_2) as com_instance_id_2,
    COUNT(CASE WHEN em_uso = true THEN 1 END) as em_uso_chip_1,
    COUNT(CASE WHEN em_uso_2 = true THEN 1 END) as em_uso_chip_2
FROM prompts_oficial;

-- 5. Verificar se há inconsistências (mais de um prompt em uso por chip)
SELECT 
    'Chip 1' as chip,
    COUNT(*) as prompts_em_uso
FROM prompts_oficial 
WHERE em_uso = true
UNION ALL
SELECT 
    'Chip 2' as chip,
    COUNT(*) as prompts_em_uso
FROM prompts_oficial 
WHERE em_uso_2 = true;

-- 6. Testar inserção de dados para chip 2 (comentado para não inserir dados reais)
/*
INSERT INTO prompts_oficial (
    nome, 
    id_usuario, 
    id_cliente, 
    em_uso, 
    em_uso_2,
    status, 
    instance_id,
    instance_id_2,
    prompt,
    created_at
) VALUES 
(
    'Chatbot Teste Chip 2',
    'user-id-teste',
    999,
    false,
    true,
    true,
    null,
    'test-instance-id-2',
    'Olá! Sou o chatbot de teste para o chip 2.',
    NOW()
);
*/
