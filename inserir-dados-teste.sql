-- Script para inserir dados de teste na tabela clientes_info
-- Execute este script no SQL Editor do Supabase

-- Primeiro, vamos verificar se a tabela existe e sua estrutura
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'clientes_info'
ORDER BY ordinal_position;

-- Inserir dados de teste
INSERT INTO public.clientes_info (
    id,
    nome,
    email,
    telefone,
    status,
    criado_em,
    plano
) VALUES 
(
    gen_random_uuid(),
    'Empresa ABC Ltda',
    'contato@empresaabc.com',
    '(11) 99999-9999',
    'ativo',
    now(),
    'premium'
),
(
    gen_random_uuid(),
    'Comércio XYZ',
    'vendas@comercioxyz.com',
    '(21) 88888-8888',
    'ativo',
    now() - interval '2 days',
    'pro'
),
(
    gen_random_uuid(),
    'Serviços 123',
    'admin@servicos123.com',
    '(31) 77777-7777',
    'suspenso',
    now() - interval '5 days',
    'basic'
),
(
    gen_random_uuid(),
    'Tecnologia Inovação',
    'ti@tecinovacao.com',
    '(41) 66666-6666',
    'ativo',
    now() - interval '1 day',
    'premium'
),
(
    gen_random_uuid(),
    'Consultoria Expert',
    'contato@consultoriaexpert.com',
    '(51) 55555-5555',
    'ativo',
    now() - interval '3 days',
    'pro'
)
ON CONFLICT (id) DO NOTHING;

-- Verificar se os dados foram inseridos
SELECT 
    id,
    nome,
    email,
    telefone,
    status,
    criado_em,
    plano
FROM public.clientes_info
ORDER BY criado_em DESC;

-- Contar total de registros
SELECT COUNT(*) as total_clientes FROM public.clientes_info;

-- Contar por status
SELECT 
    status,
    COUNT(*) as quantidade
FROM public.clientes_info
GROUP BY status; 