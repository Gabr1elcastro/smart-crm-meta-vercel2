-- ⚡ SOLUÇÃO RÁPIDA: Desabilitar RLS temporariamente para testes de áudio
-- Execute este comando no SQL Editor do Supabase

-- IMPORTANTE: Isso remove todas as restrições de segurança no storage
-- Use apenas para testes! Para produção, use SUPABASE-STORAGE-POLICIES.sql

-- Desabilitar RLS na tabela de objects do storage
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Verificar se foi desabilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- Para REABILITAR RLS depois dos testes (RECOMENDADO):
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Mensagem de confirmação
SELECT 'RLS desabilitado no storage! Agora você pode testar o upload de áudio.' as status; 