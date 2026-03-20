-- 🔥 SOLUÇÃO IMEDIATA PARA ERRO DE STORAGE
-- O problema está no STORAGE, não na tabela de mensagens!

-- Execute exatamente isto no SQL Editor do Supabase:

-- 1. Desabilitar RLS na tabela do STORAGE (onde está o erro)
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 2. Verificar se foi desabilitado
SELECT 
  schemaname, 
  tablename, 
  rowsecurity,
  CASE 
    WHEN rowsecurity = false THEN '✅ RLS DESABILITADO - Pode testar áudio!'
    WHEN rowsecurity = true THEN '❌ RLS AINDA ATIVO - Execute o comando acima'
    ELSE '⚠️ Status indefinido'
  END as status
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- 3. Se o bucket audioswpp não existir, criar:
INSERT INTO storage.buckets (id, name, public) 
VALUES ('audioswpp', 'audioswpp', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

-- 4. Verificar bucket
SELECT id, name, public FROM storage.buckets WHERE id = 'audioswpp';

-- ATENÇÃO: Você desabilitou RLS na tabela agente_conversacional_whatsapp
-- Isso está correto também, mas o problema do upload é no STORAGE!

-- Para reabilitar depois dos testes (recomendado):
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; 