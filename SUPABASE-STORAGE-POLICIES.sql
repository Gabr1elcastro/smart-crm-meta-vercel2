-- POLÍTICAS SUPABASE STORAGE - Bucket audioswpp
-- Execute no SQL Editor do Supabase

-- 1. OPÇÃO RÁPIDA: Desabilitar RLS temporariamente (para testes)
-- DESCOMENTE a linha abaixo se quiser desabilitar RLS:
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 2. OPÇÃO RECOMENDADA: Configurar políticas corretas

-- Política para INSERIR arquivos (upload)
CREATE POLICY "Allow authenticated users to upload audio files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'audioswpp');

-- Política para LER arquivos (download público)
CREATE POLICY "Allow public read access to audio files" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'audioswpp');

-- Política para DELETAR arquivos (apenas donos)
CREATE POLICY "Allow users to delete their own audio files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'audioswpp' AND auth.uid()::text = owner);

-- Verificar se o bucket existe e tem as configurações corretas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audioswpp', 
  'audioswpp', 
  true, 
  10485760, -- 10MB limit
  ARRAY['audio/webm', 'audio/ogg', 'audio/wav', 'audio/mp3', 'audio/m4a']
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['audio/webm', 'audio/ogg', 'audio/wav', 'audio/mp3', 'audio/m4a'];

-- Verificar políticas criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects' 
AND policyname LIKE '%audio%';

-- ALTERNATIVA SIMPLES: Se quiser permitir tudo temporariamente
-- CREATE POLICY "Allow all operations on audioswpp" ON storage.objects
--   FOR ALL TO public
--   USING (bucket_id = 'audioswpp')
--   WITH CHECK (bucket_id = 'audioswpp'); 