-- =====================================================
-- OTIMIZAÇÃO DE POLÍTICAS RLS - agente_conversacional_whatsapp
-- =====================================================
-- Este script consolida múltiplas políticas em uma única por operação
-- para melhorar a performance sem comprometer a funcionalidade
-- =====================================================

-- 1. BACKUP DAS POLÍTICAS ATUAIS (para segurança)
-- Comentário: Execute primeiro para documentar o estado atual
/*
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'agente_conversacional_whatsapp';
*/

-- =====================================================
-- 2. REMOÇÃO DAS POLÍTICAS ANTIGAS
-- =====================================================

-- Remover políticas antigas de SELECT
DROP POLICY IF EXISTS "Usuários podem ver apenas suas próprias mensagens" ON public.agente_conversacional_whatsapp;
DROP POLICY IF EXISTS "Usuários veem apenas seus próprios dados" ON public.agente_conversacional_whatsapp;
DROP POLICY IF EXISTS "read_messages_by_instance" ON public.agente_conversacional_whatsapp;

-- Remover políticas antigas de INSERT
DROP POLICY IF EXISTS "Usuários podem inserir apenas suas próprias mensagens" ON public.agente_conversacional_whatsapp;
DROP POLICY IF EXISTS "Usuários inserem apenas seus próprios dados" ON public.agente_conversacional_whatsapp;

-- Remover políticas antigas de UPDATE e DELETE (para recriar com nomes consistentes)
DROP POLICY IF EXISTS "Usuários atualizam apenas seus próprios dados" ON public.agente_conversacional_whatsapp;
DROP POLICY IF EXISTS "Usuários excluem apenas seus próprios dados" ON public.agente_conversacional_whatsapp;

-- =====================================================
-- 3. CRIAÇÃO DAS POLÍTICAS CONSOLIDADAS
-- =====================================================

-- Política consolidada de SELECT
-- Permite acesso se o usuário for o owner da mensagem OU se a instância pertencer ao usuário
CREATE POLICY "Leitura consolidada de mensagens" 
ON public.agente_conversacional_whatsapp
FOR SELECT
USING (
  auth.uid() = user_id OR
  auth.uid() = user_id_auth OR
  instance_id IN (
    SELECT clientes_info.instance_id
    FROM clientes_info
    WHERE clientes_info.user_id_auth = auth.uid()
  )
);

-- Política consolidada de INSERT
-- Permite inserção se o usuário for o owner da mensagem
CREATE POLICY "Inserção consolidada de mensagens" 
ON public.agente_conversacional_whatsapp
FOR INSERT
WITH CHECK (
  auth.uid() = user_id OR
  auth.uid() = user_id_auth
);

-- Política de UPDATE
-- Permite atualização apenas pelo owner da mensagem
CREATE POLICY "Atualização de mensagens" 
ON public.agente_conversacional_whatsapp
FOR UPDATE
USING (auth.uid() = user_id_auth)
WITH CHECK (auth.uid() = user_id_auth);

-- Política de DELETE
-- Permite exclusão apenas pelo owner da mensagem
CREATE POLICY "Exclusão de mensagens" 
ON public.agente_conversacional_whatsapp
FOR DELETE
USING (auth.uid() = user_id_auth);

-- =====================================================
-- 4. VERIFICAÇÃO DAS POLÍTICAS CRIADAS
-- =====================================================

-- Verificar se as políticas foram criadas corretamente
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'agente_conversacional_whatsapp'
ORDER BY cmd, policyname;

-- =====================================================
-- 5. VALIDAÇÃO DE PERFORMANCE
-- =====================================================

-- Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'agente_conversacional_whatsapp';

-- Contar número de políticas (deve ser 4: SELECT, INSERT, UPDATE, DELETE)
SELECT 
    COUNT(*) as total_policies,
    cmd,
    COUNT(*) as policies_per_operation
FROM pg_policies 
WHERE tablename = 'agente_conversacional_whatsapp'
GROUP BY cmd
ORDER BY cmd; 