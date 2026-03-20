-- Script para verificar se o sistema de envio por departamento está funcionando
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar estrutura das tabelas
SELECT 'ESTRUTURA DAS TABELAS' as secao;

-- Verificar colunas da tabela departamento
SELECT 
    'departamento' as tabela,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'departamento' 
AND column_name = 'instance_name_chip_associado';

-- Verificar colunas da tabela prompts_oficial
SELECT 
    'prompts_oficial' as tabela,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'prompts_oficial' 
AND column_name = 'instance_name_chip_associado';

-- 2. Verificar departamentos com chips associados
SELECT 'DEPARTAMENTOS COM CHIPS' as secao;

SELECT 
    id,
    nome,
    instance_name_chip_associado,
    CASE 
        WHEN instance_name_chip_associado IS NOT NULL THEN '✅ Configurado'
        ELSE '❌ Sem chip'
    END as status
FROM departamento
ORDER BY nome;

-- 3. Verificar leads com departamentos
SELECT 'LEADS COM DEPARTAMENTOS' as secao;

SELECT 
    l.id,
    l.nome,
    l.telefone,
    l.id_departamento,
    d.nome as departamento_nome,
    d.instance_name_chip_associado,
    CASE 
        WHEN d.instance_name_chip_associado IS NOT NULL THEN '✅ Chip configurado'
        ELSE '⚠️ Sem chip - usará chip 1'
    END as status_chip
FROM leads l
LEFT JOIN departamento d ON l.id_departamento = d.id
WHERE l.id_departamento IS NOT NULL
ORDER BY l.nome
LIMIT 10;

-- 4. Verificar leads sem departamento
SELECT 'LEADS SEM DEPARTAMENTO' as secao;

SELECT 
    COUNT(*) as total_leads_sem_departamento
FROM leads
WHERE id_departamento IS NULL;

-- 5. Verificar chips disponíveis
SELECT 'CHIPS DISPONÍVEIS' as secao;

SELECT 
    id,
    name,
    instance_name as chip_1,
    instance_name_2 as chip_2,
    CASE 
        WHEN instance_name IS NOT NULL AND instance_name_2 IS NOT NULL THEN 'Ambos chips'
        WHEN instance_name IS NOT NULL THEN 'Apenas Chip 1'
        WHEN instance_name_2 IS NOT NULL THEN 'Apenas Chip 2'
        ELSE 'Nenhum chip'
    END as status_chips
FROM clientes_info
WHERE instance_name IS NOT NULL OR instance_name_2 IS NOT NULL
ORDER BY name;

-- 6. Verificar agentes com instance_name_chip_associado
SELECT 'AGENTES COM CHIP ASSOCIADO' as secao;

SELECT 
    id,
    nome,
    instance_id,
    instance_id_2,
    em_uso,
    em_uso_2,
    instance_name_chip_associado,
    CASE 
        WHEN instance_name_chip_associado IS NOT NULL THEN '✅ Configurado'
        ELSE '❌ Sem configuração'
    END as status_chip_associado
FROM prompts_oficial
ORDER BY created_at DESC
LIMIT 10;

-- 7. Estatísticas gerais
SELECT 'ESTATÍSTICAS GERAIS' as secao;

SELECT 
    'Total de departamentos' as metrica,
    COUNT(*) as valor
FROM departamento
UNION ALL
SELECT 
    'Departamentos com chip' as metrica,
    COUNT(*) as valor
FROM departamento
WHERE instance_name_chip_associado IS NOT NULL
UNION ALL
SELECT 
    'Total de leads' as metrica,
    COUNT(*) as valor
FROM leads
UNION ALL
SELECT 
    'Leads com departamento' as metrica,
    COUNT(*) as valor
FROM leads
WHERE id_departamento IS NOT NULL
UNION ALL
SELECT 
    'Total de agentes' as metrica,
    COUNT(*) as valor
FROM prompts_oficial
UNION ALL
SELECT 
    'Agentes com chip associado' as metrica,
    COUNT(*) as valor
FROM prompts_oficial
WHERE instance_name_chip_associado IS NOT NULL;
