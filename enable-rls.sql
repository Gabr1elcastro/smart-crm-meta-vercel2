-- Este script deve ser executado no console SQL do Supabase.
-- ID do usuário bbf.materiais@gmail.com: 8fa4cfa9-8f95-40fc-8934-d73e5ab6c942

-- 1. Ativar RLS na tabela
ALTER TABLE "public"."agente_conversacional_whatsapp" ENABLE ROW LEVEL SECURITY;

-- 2. Criar uma política que permite que os usuários vejam apenas seus próprios dados
CREATE POLICY "Usuários veem apenas seus próprios dados" 
ON "public"."agente_conversacional_whatsapp" 
FOR SELECT 
USING (auth.uid() = user_id_auth);

-- 3. Criar política para INSERT
CREATE POLICY "Usuários inserem apenas seus próprios dados" 
ON "public"."agente_conversacional_whatsapp" 
FOR INSERT 
WITH CHECK (auth.uid() = user_id_auth);

-- 4. Criar política para UPDATE
CREATE POLICY "Usuários atualizam apenas seus próprios dados" 
ON "public"."agente_conversacional_whatsapp" 
FOR UPDATE 
USING (auth.uid() = user_id_auth);

-- 5. Criar política para DELETE
CREATE POLICY "Usuários excluem apenas seus próprios dados" 
ON "public"."agente_conversacional_whatsapp" 
FOR DELETE 
USING (auth.uid() = user_id_auth);

-- 6. Verificar as políticas após a criação
SELECT * FROM pg_policies WHERE tablename = 'agente_conversacional_whatsapp'; 