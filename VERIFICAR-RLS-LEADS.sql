-- 🔍 VERIFICAR E CONFIGURAR RLS PARA TABELA LEADS
-- Execute no SQL Editor do Supabase para garantir que o realtime funcione

-- 1. Verificar se RLS está habilitado na tabela leads
SELECT 
  schemaname, 
  tablename, 
  rowsecurity,
  CASE 
    WHEN rowsecurity = true THEN '✅ RLS HABILITADO'
    WHEN rowsecurity = false THEN '❌ RLS DESABILITADO'
    ELSE '⚠️ Status indefinido'
  END as status
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'leads';

-- 2. Verificar políticas existentes na tabela leads
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'leads';

-- 3. Se não houver políticas, criar uma política básica para permitir acesso
-- (Ajuste conforme suas necessidades de segurança)

-- Política para SELECT - permitir acesso aos leads do cliente
CREATE POLICY IF NOT EXISTS "Permitir acesso aos leads do cliente" ON leads
FOR SELECT USING (
  auth.uid() IN (
    SELECT user_id_auth 
    FROM clientes_info 
    WHERE id = leads.id_cliente
  )
);

-- Política para INSERT - permitir inserção de leads para o cliente
CREATE POLICY IF NOT EXISTS "Permitir inserção de leads" ON leads
FOR INSERT WITH CHECK (
  auth.uid() IN (
    SELECT user_id_auth 
    FROM clientes_info 
    WHERE id = leads.id_cliente
  )
);

-- Política para UPDATE - permitir atualização de leads do cliente
CREATE POLICY IF NOT EXISTS "Permitir atualização de leads" ON leads
FOR UPDATE USING (
  auth.uid() IN (
    SELECT user_id_auth 
    FROM clientes_info 
    WHERE id = leads.id_cliente
  )
);

-- 4. Verificar se as políticas foram criadas
SELECT 
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'leads';

-- 5. Se ainda houver problemas, desabilitar RLS temporariamente para teste
-- ALTER TABLE leads DISABLE ROW LEVEL SECURITY;

-- 6. Para reabilitar depois dos testes:
-- ALTER TABLE leads ENABLE ROW LEVEL SECURITY; 