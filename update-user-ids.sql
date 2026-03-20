-- Script para atualizar o user_id_auth em todos os registros
-- Este script deve ser executado no console SQL do Supabase (SQL Editor)

-- ID do usuário bbf.materiais@gmail.com (correto)
-- Obtido via login: 2694a691-d3fc-46a0-aece-eb704e549c89

-- ID antigo que está nos registros
-- Encontrado na verificação: 8fa4cfa9-8f95-40fc-8934-d73e5ab6c942

-- Desativar temporariamente o RLS para permitir a atualização
ALTER TABLE "public"."agente_conversacional_whatsapp" DISABLE ROW LEVEL SECURITY;

-- Verificar quantos registros têm o ID antigo
SELECT COUNT(*) FROM "public"."agente_conversacional_whatsapp" 
WHERE "user_id_auth" = '8fa4cfa9-8f95-40fc-8934-d73e5ab6c942';

-- Atualizar todos os registros com o ID antigo para o ID novo
UPDATE "public"."agente_conversacional_whatsapp"
SET "user_id_auth" = '2694a691-d3fc-46a0-aece-eb704e549c89'
WHERE "user_id_auth" = '8fa4cfa9-8f95-40fc-8934-d73e5ab6c942';

-- Verificar quantos registros agora têm o ID novo
SELECT COUNT(*) FROM "public"."agente_conversacional_whatsapp" 
WHERE "user_id_auth" = '2694a691-d3fc-46a0-aece-eb704e549c89';

-- Reativar o RLS
ALTER TABLE "public"."agente_conversacional_whatsapp" ENABLE ROW LEVEL SECURITY;

-- Verificar as políticas existentes
SELECT * FROM pg_policies WHERE tablename = 'agente_conversacional_whatsapp'; 