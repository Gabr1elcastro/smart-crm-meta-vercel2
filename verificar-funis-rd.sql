-- Script para verificar dados na tabela funis_rd
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar todos os registros na tabela funis_rd
SELECT 'TODOS OS REGISTROS:' as info;
SELECT * FROM funis_rd ORDER BY created_at DESC;

-- 2. Verificar especificamente para id_cliente = 114
SELECT 'REGISTROS PARA ID_CLIENTE = 114:' as info;
SELECT * FROM funis_rd WHERE id_cliente = 114;

-- 3. Verificar tipos de dados
SELECT 'TIPOS DE DADOS:' as info;
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'funis_rd' 
ORDER BY ordinal_position;

-- 4. Verificar se há diferenças de tipo entre id_cliente
SELECT 'VERIFICAR TIPOS DE ID_CLIENTE:' as info;
SELECT 
  id_cliente,
  TYPEOF(id_cliente) as tipo,
  COUNT(*) as total
FROM funis_rd 
GROUP BY id_cliente, TYPEOF(id_cliente);

-- 5. Verificar se há registros com id_cliente como string
SELECT 'ID_CLIENTE COMO STRING:' as info;
SELECT * FROM funis_rd WHERE id_cliente::text = '114';

-- 6. Verificar se há registros com id_cliente como integer
SELECT 'ID_CLIENTE COMO INTEGER:' as info;
SELECT * FROM funis_rd WHERE id_cliente = 114::integer;

-- 7. Contar total de registros
SELECT 'TOTAL DE REGISTROS:' as info;
SELECT COUNT(*) as total_registros FROM funis_rd;

-- 8. Verificar se RLS está bloqueando
SELECT 'VERIFICAR RLS:' as info;
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'funis_rd';