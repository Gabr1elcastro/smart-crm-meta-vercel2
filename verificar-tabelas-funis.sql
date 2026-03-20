-- Script para verificar se as tabelas funis e funis_etapa existem
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se as tabelas existem
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('funis', 'funis_etapa')
ORDER BY table_name;

-- 2. Verificar estrutura da tabela funis (se existir)
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'funis'
ORDER BY ordinal_position;

-- 3. Verificar estrutura da tabela funis_etapa (se existir)
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'funis_etapa'
ORDER BY ordinal_position;

-- 4. Verificar políticas RLS nas tabelas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('funis', 'funis_etapa');

-- 5. Verificar se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('funis', 'funis_etapa');

-- 6. Verificar permissões do usuário atual
SELECT 
  grantee,
  table_name,
  privilege_type
FROM information_schema.table_privileges 
WHERE table_name IN ('funis', 'funis_etapa')
AND grantee = current_user;
