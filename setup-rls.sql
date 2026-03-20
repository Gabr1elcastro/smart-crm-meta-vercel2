-- Habilitar RLS na tabela
ALTER TABLE "public"."agente_conversacional_whatsapp" ENABLE ROW LEVEL SECURITY;

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

-- Migrar dados existentes para o usuário bbf.materiais@gmail.com
-- Substitua UUID_DO_USUARIO pelo ID real do usuário bbf.materiais@gmail.com
-- Este comando associa todas as mensagens existentes sem user_id_auth ao usuário especificado
UPDATE "public"."agente_conversacional_whatsapp"
SET "user_id_auth" = 'ID_DO_USUARIO_BBF_MATERIAIS_AQUI'
WHERE "user_id_auth" IS NULL; 