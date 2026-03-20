-- =====================================================
-- TESTE DE VALIDAÇÃO DAS POLÍTICAS RLS OTIMIZADAS
-- =====================================================
-- Execute este script APÓS aplicar a otimização para validar
-- que todas as funcionalidades continuam funcionando
-- =====================================================

-- 1. VERIFICAÇÃO INICIAL
-- =====================================================

-- Verificar se as políticas foram criadas corretamente
SELECT 'VERIFICAÇÃO INICIAL' as teste;
SELECT 
    policyname,
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN 'USING: ' || qual
        WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check
        ELSE 'N/A'
    END as condicao
FROM pg_policies 
WHERE tablename = 'agente_conversacional_whatsapp'
ORDER BY cmd, policyname;

-- =====================================================
-- 2. TESTE DE PERMISSÕES POR USUÁRIO
-- =====================================================

-- NOTA: Para executar estes testes, você precisa estar logado como um usuário específico
-- Substitua 'SEU_USER_ID_AQUI' pelo ID do usuário que você quer testar

-- Teste 1: Verificar se o usuário pode ver suas próprias mensagens
SELECT 'TESTE 1: SELECT - Mensagens próprias' as teste;
SELECT 
    COUNT(*) as total_mensagens_proprias,
    COUNT(CASE WHEN user_id = auth.uid() THEN 1 END) as por_user_id,
    COUNT(CASE WHEN user_id_auth = auth.uid() THEN 1 END) as por_user_id_auth
FROM agente_conversacional_whatsapp
WHERE user_id = auth.uid() OR user_id_auth = auth.uid();

-- Teste 2: Verificar se o usuário pode ver mensagens da sua instância
SELECT 'TESTE 2: SELECT - Mensagens da instância' as teste;
SELECT 
    COUNT(*) as total_mensagens_instancia
FROM agente_conversacional_whatsapp acw
WHERE acw.instance_id IN (
    SELECT ci.instance_id
    FROM clientes_info ci
    WHERE ci.user_id_auth = auth.uid()
);

-- Teste 3: Verificar se o usuário NÃO pode ver mensagens de outros usuários
SELECT 'TESTE 3: SELECT - Mensagens de outros usuários (deve ser 0)' as teste;
SELECT 
    COUNT(*) as mensagens_outros_usuarios
FROM agente_conversacional_whatsapp
WHERE user_id != auth.uid() 
  AND user_id_auth != auth.uid()
  AND instance_id NOT IN (
    SELECT ci.instance_id
    FROM clientes_info ci
    WHERE ci.user_id_auth = auth.uid()
  );

-- =====================================================
-- 3. TESTE DE PERFORMANCE
-- =====================================================

-- Teste 4: Medir tempo de execução de SELECT
SELECT 'TESTE 4: PERFORMANCE - SELECT' as teste;
EXPLAIN (ANALYZE, BUFFERS) 
SELECT COUNT(*) 
FROM agente_conversacional_whatsapp
WHERE user_id = auth.uid() OR user_id_auth = auth.uid();

-- Teste 5: Verificar uso de índices
SELECT 'TESTE 5: ÍNDICES UTILIZADOS' as teste;
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT * 
FROM agente_conversacional_whatsapp
WHERE user_id = auth.uid() OR user_id_auth = auth.uid()
LIMIT 10;

-- =====================================================
-- 4. TESTE DE SEGURANÇA
-- =====================================================

-- Teste 6: Verificar se RLS está ativo
SELECT 'TESTE 6: RLS ATIVO' as teste;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables 
WHERE tablename = 'agente_conversacional_whatsapp';

-- Teste 7: Verificar se não há políticas duplicadas
SELECT 'TESTE 7: POLÍTICAS SEM DUPLICAÇÃO' as teste;
SELECT 
    cmd,
    COUNT(*) as total_policies
FROM pg_policies 
WHERE tablename = 'agente_conversacional_whatsapp'
GROUP BY cmd
HAVING COUNT(*) > 1;

-- =====================================================
-- 5. TESTE DE CENÁRIOS ESPECÍFICOS
-- =====================================================

-- Teste 8: Verificar acesso por diferentes campos
SELECT 'TESTE 8: ACESSO POR DIFERENTES CAMPOS' as teste;
SELECT 
    'Por user_id' as tipo_acesso,
    COUNT(*) as total
FROM agente_conversacional_whatsapp
WHERE user_id = auth.uid()
UNION ALL
SELECT 
    'Por user_id_auth' as tipo_acesso,
    COUNT(*) as total
FROM agente_conversacional_whatsapp
WHERE user_id_auth = auth.uid()
UNION ALL
SELECT 
    'Por instance_id' as tipo_acesso,
    COUNT(*) as total
FROM agente_conversacional_whatsapp acw
WHERE acw.instance_id IN (
    SELECT ci.instance_id
    FROM clientes_info ci
    WHERE ci.user_id_auth = auth.uid()
);

-- =====================================================
-- 6. RESUMO DOS TESTES
-- =====================================================

SELECT 'RESUMO DOS TESTES' as teste;
SELECT 
    'Políticas criadas' as item,
    COUNT(*) as valor
FROM pg_policies 
WHERE tablename = 'agente_conversacional_whatsapp'
UNION ALL
SELECT 
    'RLS habilitado' as item,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE tablename = 'agente_conversacional_whatsapp' 
            AND rowsecurity = true
        ) THEN 1 
        ELSE 0 
    END as valor;

-- =====================================================
-- 7. INSTRUÇÕES PARA VALIDAÇÃO MANUAL
-- =====================================================

/*
INSTRUÇÕES PARA VALIDAÇÃO MANUAL:

1. Teste no Frontend:
   - Faça login com um usuário
   - Acesse a página de conversas
   - Verifique se as mensagens aparecem corretamente
   - Tente enviar uma nova mensagem
   - Verifique se não há erros de permissão

2. Teste de Segurança:
   - Tente acessar dados de outro usuário (deve ser bloqueado)
   - Verifique se apenas suas mensagens são visíveis
   - Confirme que mensagens da sua instância aparecem

3. Teste de Performance:
   - Monitore o tempo de carregamento das conversas
   - Verifique se não há lentidão excessiva
   - Compare com o comportamento anterior

4. Se encontrar problemas:
   - Execute o script de rollback (se criado)
   - Verifique os logs do Supabase
   - Teste com usuários diferentes
*/ 