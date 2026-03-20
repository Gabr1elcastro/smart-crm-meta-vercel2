-- =====================================================
-- ROLLBACK DAS POLÍTICAS RLS - agente_conversacional_whatsapp
-- =====================================================
-- Execute este script APENAS se houver problemas após a otimização
-- Este script restaura as políticas originais
-- =====================================================

-- ATENÇÃO: Este script restaura as políticas antigas que causavam problemas de performance
-- Use apenas se a otimização causar problemas funcionais

-- =====================================================
-- 1. REMOÇÃO DAS POLÍTICAS OTIMIZADAS
-- =====================================================

-- Remover políticas consolidadas
DROP POLICY IF EXISTS "Leitura consolidada de mensagens" ON public.agente_conversacional_whatsapp;
DROP POLICY IF EXISTS "Inserção consolidada de mensagens" ON public.agente_conversacional_whatsapp;
DROP POLICY IF EXISTS "Atualização de mensagens" ON public.agente_conversacional_whatsapp;
DROP POLICY IF EXISTS "Exclusão de mensagens" ON public.agente_conversacional_whatsapp;

-- =====================================================
-- 2. RESTAURAÇÃO DAS POLÍTICAS ORIGINAIS
-- =====================================================

-- Políticas de SELECT (3 políticas separadas)
CREATE POLICY "Usuários podem ver apenas suas próprias mensagens" 
ON public.agente_conversacional_whatsapp
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários veem apenas seus próprios dados" 
ON public.agente_conversacional_whatsapp
FOR SELECT
USING (auth.uid() = user_id_auth);

CREATE POLICY "read_messages_by_instance" 
ON public.agente_conversacional_whatsapp
FOR SELECT
USING (
  instance_id IN (
    SELECT clientes_info.instance_id
    FROM clientes_info
    WHERE clientes_info.user_id_auth = auth.uid()
  )
);

-- Políticas de INSERT (2 políticas separadas)
CREATE POLICY "Usuários podem inserir apenas suas próprias mensagens" 
ON public.agente_conversacional_whatsapp
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários inserem apenas seus próprios dados" 
ON public.agente_conversacional_whatsapp
FOR INSERT
WITH CHECK (auth.uid() = user_id_auth);

-- Políticas de UPDATE e DELETE (1 política cada)
CREATE POLICY "Usuários atualizam apenas seus próprios dados" 
ON public.agente_conversacional_whatsapp
FOR UPDATE
USING (auth.uid() = user_id_auth);

CREATE POLICY "Usuários excluem apenas seus próprios dados" 
ON public.agente_conversacional_whatsapp
FOR DELETE
USING (auth.uid() = user_id_auth);

-- =====================================================
-- 3. VERIFICAÇÃO DO ROLLBACK
-- =====================================================

-- Verificar se as políticas originais foram restauradas
SELECT 'ROLLBACK CONCLUÍDO' as status;
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

-- Contar políticas por operação (deve ser 3 para SELECT, 2 para INSERT, 1 para UPDATE e DELETE)
SELECT 
    cmd,
    COUNT(*) as total_policies
FROM pg_policies 
WHERE tablename = 'agente_conversacional_whatsapp'
GROUP BY cmd
ORDER BY cmd;

-- =====================================================
-- 4. AVISO IMPORTANTE
-- =====================================================

/*
AVISO: 
- As políticas originais foram restauradas
- Isso significa que os problemas de performance voltaram
- Considere investigar por que a otimização causou problemas
- Verifique se há algum caso de uso específico que não foi considerado

PRÓXIMOS PASSOS SUGERIDOS:
1. Teste todas as funcionalidades para confirmar que estão funcionando
2. Identifique qual funcionalidade específica quebrou
3. Ajuste a política consolidada para incluir esse caso
4. Teste novamente antes de aplicar em produção
*/ 