-- Teste simples para verificar funis_rd com id_cliente = 114
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a tabela existe
SELECT 'TABELA EXISTE?' as info;
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'funis_rd'
) as tabela_existe;

-- 2. Contar total de registros
SELECT 'TOTAL DE REGISTROS:' as info;
SELECT COUNT(*) as total FROM funis_rd;

-- 3. Ver todos os registros
SELECT 'TODOS OS REGISTROS:' as info;
SELECT * FROM funis_rd ORDER BY created_at DESC;

-- 4. Buscar especificamente por id_cliente = 114
SELECT 'BUSCA POR ID_CLIENTE = 114:' as info;
SELECT * FROM funis_rd WHERE id_cliente = 114;

-- 5. Verificar se há registros com id_cliente diferente de 114
SELECT 'OUTROS ID_CLIENTES:' as info;
SELECT DISTINCT id_cliente, COUNT(*) as total 
FROM funis_rd 
GROUP BY id_cliente 
ORDER BY id_cliente;

-- 6. Verificar se RLS está ativo
SELECT 'RLS ATIVO?' as info;
SELECT rowsecurity as rls_ativo 
FROM pg_tables 
WHERE tablename = 'funis_rd';

-- 7. Verificar políticas RLS
SELECT 'POLITICAS RLS:' as info;
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'funis_rd';
