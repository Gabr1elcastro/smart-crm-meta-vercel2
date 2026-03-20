-- Este script deve ser executado no console SQL do Supabase.
-- O ID do usuário bbf.materiais@gmail.com é: 8fa4cfa9-8f95-40fc-8934-d73e5ab6c942

-- Verifique se os dados foram corretamente associados
SELECT COUNT(*) FROM "public"."agente_conversacional_whatsapp" 
WHERE "user_id_auth" = '8fa4cfa9-8f95-40fc-8934-d73e5ab6c942';

-- 1. Habilite Row Level Security na tabela
ALTER TABLE "public"."agente_conversacional_whatsapp" ENABLE ROW LEVEL SECURITY;

-- 2. Crie políticas de segurança

-- Primeiro, remova políticas existentes se houver
DROP POLICY IF EXISTS "Usuários veem apenas suas próprias conversas" ON "public"."agente_conversacional_whatsapp";
DROP POLICY IF EXISTS "Usuários inserem apenas suas próprias conversas" ON "public"."agente_conversacional_whatsapp";
DROP POLICY IF EXISTS "Usuários atualizam apenas suas próprias conversas" ON "public"."agente_conversacional_whatsapp";
DROP POLICY IF EXISTS "Usuários excluem apenas suas próprias conversas" ON "public"."agente_conversacional_whatsapp";

-- Política para SELECT (leitura)
CREATE POLICY "Usuários veem apenas suas próprias conversas" 
ON "public"."agente_conversacional_whatsapp" 
FOR SELECT 
USING (auth.uid() = user_id_auth);

-- Política para INSERT (inserção)
CREATE POLICY "Usuários inserem apenas suas próprias conversas" 
ON "public"."agente_conversacional_whatsapp" 
FOR INSERT 
WITH CHECK (auth.uid() = user_id_auth);

-- Política para UPDATE (atualização)
CREATE POLICY "Usuários atualizam apenas suas próprias conversas" 
ON "public"."agente_conversacional_whatsapp" 
FOR UPDATE
USING (auth.uid() = user_id_auth);

-- Política para DELETE (exclusão)
CREATE POLICY "Usuários excluem apenas suas próprias conversas" 
ON "public"."agente_conversacional_whatsapp" 
FOR DELETE
USING (auth.uid() = user_id_auth);

-- Verificar as políticas
SELECT * FROM pg_policies WHERE tablename = 'agente_conversacional_whatsapp'; 