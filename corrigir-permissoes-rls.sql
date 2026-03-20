-- Script para corrigir permissões RLS das tabelas
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se RLS está habilitado nas tabelas
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('clientes_info', 'atendentes', 'superadmins');

-- 2. Desabilitar RLS temporariamente para teste
ALTER TABLE public.clientes_info DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.atendentes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.superadmins DISABLE ROW LEVEL SECURITY;

-- 3. Verificar se as tabelas estão acessíveis
-- (Execute as queries abaixo para testar)

-- Teste 1: Verificar se clientes_info está acessível
SELECT COUNT(*) FROM public.clientes_info;

-- Teste 2: Verificar se atendentes está acessível  
SELECT COUNT(*) FROM public.atendentes;

-- Teste 3: Verificar se superadmins está acessível
SELECT COUNT(*) FROM public.superadmins;

-- 4. Se tudo funcionar, reabilitar RLS com políticas corretas
-- (Descomente as linhas abaixo após confirmar que funciona)

/*
-- Reabilitar RLS
ALTER TABLE public.clientes_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atendentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.superadmins ENABLE ROW LEVEL SECURITY;

-- Criar políticas para permitir acesso anônimo (apenas para teste)
CREATE POLICY "Permitir acesso anônimo a clientes_info" ON public.clientes_info
    FOR SELECT USING (true);

CREATE POLICY "Permitir acesso anônimo a atendentes" ON public.atendentes
    FOR SELECT USING (true);

CREATE POLICY "Permitir acesso anônimo a superadmins" ON public.superadmins
    FOR SELECT USING (true);
*/

-- 5. Verificar estrutura das tabelas
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'clientes_info'
ORDER BY ordinal_position; 