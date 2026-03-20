-- Script para adicionar a coluna plano_crm na tabela clientes_info
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a coluna já existe
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'clientes_info' 
AND column_name = 'plano_crm';

-- 2. Adicionar a coluna se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clientes_info' 
        AND column_name = 'plano_crm'
    ) THEN
        ALTER TABLE public.clientes_info 
        ADD COLUMN plano_crm BOOLEAN DEFAULT FALSE;
        
        RAISE NOTICE 'Coluna plano_crm adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna plano_crm já existe!';
    END IF;
END $$;

-- 3. Verificar a estrutura atualizada da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'clientes_info' 
AND column_name IN ('plano_crm', 'plano_starter', 'plano_pro', 'plano_plus', 'plano_agentes')
ORDER BY column_name;

-- 4. Atualizar um cliente específico para ter acesso ao plano CRM (opcional)
-- Descomente e modifique o email conforme necessário
/*
UPDATE public.clientes_info 
SET plano_crm = TRUE 
WHERE email = 'seu-email@exemplo.com';
*/

-- 5. Verificar clientes com plano CRM ativo
SELECT 
    id,
    name,
    email,
    plano_crm,
    plano_starter,
    plano_pro,
    plano_plus,
    plano_agentes
FROM public.clientes_info 
WHERE plano_crm = TRUE
ORDER BY created_at DESC;
