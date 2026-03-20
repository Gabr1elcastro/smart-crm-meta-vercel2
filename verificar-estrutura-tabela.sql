-- Script para verificar e corrigir a estrutura da tabela clientes_info
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a tabela existe
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'clientes_info';

-- 2. Verificar a estrutura atual da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'clientes_info'
ORDER BY ordinal_position;

-- 3. Verificar se há dados na tabela
SELECT COUNT(*) as total_registros FROM public.clientes_info;

-- 4. Verificar alguns registros de exemplo
SELECT * FROM public.clientes_info LIMIT 3;

-- 5. Se a tabela não existir, criar com a estrutura correta
-- (Descomente se necessário)

/*
CREATE TABLE IF NOT EXISTS public.clientes_info (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nome text NOT NULL,
    email text NOT NULL,
    telefone text,
    status text DEFAULT 'ativo',
    criado_em timestamp with time zone DEFAULT now(),
    plano text DEFAULT 'basic'
);
*/

-- 6. Se a tabela existir mas faltar colunas, adicionar
-- (Descomente se necessário)

/*
-- Adicionar coluna se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'clientes_info' AND column_name = 'plano') THEN
        ALTER TABLE public.clientes_info ADD COLUMN plano text DEFAULT 'basic';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'clientes_info' AND column_name = 'status') THEN
        ALTER TABLE public.clientes_info ADD COLUMN status text DEFAULT 'ativo';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'clientes_info' AND column_name = 'criado_em') THEN
        ALTER TABLE public.clientes_info ADD COLUMN criado_em timestamp with time zone DEFAULT now();
    END IF;
END $$;
*/

-- 7. Verificar permissões RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'clientes_info';

-- 8. Desabilitar RLS temporariamente (se necessário)
-- ALTER TABLE public.clientes_info DISABLE ROW LEVEL SECURITY;

-- 9. Criar política RLS básica (se necessário)
-- CREATE POLICY "Permitir acesso anônimo" ON public.clientes_info
--     FOR SELECT USING (true);

-- 10. Teste final
SELECT 
    id,
    nome,
    email,
    telefone,
    status,
    criado_em,
    plano
FROM public.clientes_info
ORDER BY criado_em DESC
LIMIT 5; 