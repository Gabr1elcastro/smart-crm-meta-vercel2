-- POLITICAS-RLS-ATENDENTES.sql
-- =====================================================
-- POLÍTICAS RLS AVANÇADAS PARA ATENDENTES
-- =====================================================
-- Este script implementa filtros de permissão por departamento
-- para a tabela agente_conversacional_whatsapp
-- =====================================================

-- 1. Remover políticas antigas
DROP POLICY IF EXISTS "Leitura consolidada de mensagens" ON public.agente_conversacional_whatsapp;
DROP POLICY IF EXISTS "Inserção consolidada de mensagens" ON public.agente_conversacional_whatsapp;
DROP POLICY IF EXISTS "Atualização de mensagens" ON public.agente_conversacional_whatsapp;
DROP POLICY IF EXISTS "Exclusão de mensagens" ON public.agente_conversacional_whatsapp;
DROP POLICY IF EXISTS "Usuários veem apenas suas próprias conversas" ON public.agente_conversacional_whatsapp;
DROP POLICY IF EXISTS "Usuários inserem apenas suas próprias conversas" ON public.agente_conversacional_whatsapp;
DROP POLICY IF EXISTS "Usuários atualizam apenas suas próprias conversas" ON public.agente_conversacional_whatsapp;
DROP POLICY IF EXISTS "Usuários excluem apenas suas próprias conversas" ON public.agente_conversacional_whatsapp;

-- 2. Política de SELECT com filtro por departamento
CREATE POLICY "Leitura por departamento e permissões" 
ON public.agente_conversacional_whatsapp
FOR SELECT
USING (
  -- Gestores veem todas as mensagens do cliente
  EXISTS (
    SELECT 1 FROM atendentes a
    WHERE a.email = auth.jwt() ->> 'email'
    AND a.id_cliente = (
      SELECT ci.id FROM clientes_info ci 
      WHERE ci.user_id_auth = auth.uid()
    )
    AND a.tipo_usuario = 'Gestor'
  )
  OR
  -- Atendentes veem apenas mensagens dos seus departamentos
  EXISTS (
    SELECT 1 FROM atendentes a
    WHERE a.email = auth.jwt() ->> 'email'
    AND a.id_cliente = (
      SELECT ci.id FROM clientes_info ci 
      WHERE ci.user_id_auth = auth.uid()
    )
    AND a.tipo_usuario = 'Atendente'
    AND (
      -- Verificar se o telefone da mensagem pertence a um lead do departamento do atendente
      EXISTS (
        SELECT 1 FROM leads l
        WHERE l.telefone = agente_conversacional_whatsapp.telefone_id
        AND l.id_cliente = a.id_cliente
        AND (
          (a.id_departamento IS NOT NULL AND l.id_departamento = a.id_departamento)
          OR
          (a.departamentos IS NOT NULL AND l.id_departamento::text = ANY(a.departamentos))
        )
      )
    )
  )
);

-- 3. Política de INSERT
CREATE POLICY "Inserção por permissões" 
ON public.agente_conversacional_whatsapp
FOR INSERT
WITH CHECK (
  auth.uid() = user_id_auth
);

-- 4. Política de UPDATE
CREATE POLICY "Atualização por permissões" 
ON public.agente_conversacional_whatsapp
FOR UPDATE
USING (
  -- Mesma lógica de SELECT para UPDATE
  EXISTS (
    SELECT 1 FROM atendentes a
    WHERE a.email = auth.jwt() ->> 'email'
    AND a.id_cliente = (
      SELECT ci.id FROM clientes_info ci 
      WHERE ci.user_id_auth = auth.uid()
    )
    AND a.tipo_usuario = 'Gestor'
  )
  OR
  EXISTS (
    SELECT 1 FROM atendentes a
    WHERE a.email = auth.jwt() ->> 'email'
    AND a.id_cliente = (
      SELECT ci.id FROM clientes_info ci 
      WHERE ci.user_id_auth = auth.uid()
    )
    AND a.tipo_usuario = 'Atendente'
    AND (
      EXISTS (
        SELECT 1 FROM leads l
        WHERE l.telefone = agente_conversacional_whatsapp.telefone_id
        AND l.id_cliente = a.id_cliente
        AND (
          (a.id_departamento IS NOT NULL AND l.id_departamento = a.id_departamento)
          OR
          (a.departamentos IS NOT NULL AND l.id_departamento::text = ANY(a.departamentos))
        )
      )
    )
  )
)
WITH CHECK (
  auth.uid() = user_id_auth
);

-- 5. Política de DELETE
CREATE POLICY "Exclusão por permissões" 
ON public.agente_conversacional_whatsapp
FOR DELETE
USING (
  -- Apenas gestores podem deletar mensagens
  EXISTS (
    SELECT 1 FROM atendentes a
    WHERE a.email = auth.jwt() ->> 'email'
    AND a.id_cliente = (
      SELECT ci.id FROM clientes_info ci 
      WHERE ci.user_id_auth = auth.uid()
    )
    AND a.tipo_usuario = 'Gestor'
  )
);

-- 6. Verificar se as políticas foram criadas
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

-- 7. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables 
WHERE tablename = 'agente_conversacional_whatsapp';

-- =====================================================
-- RESUMO DA IMPLEMENTAÇÃO
-- =====================================================
/*
POLÍTICAS CRIADAS:
1. "Leitura por departamento e permissões" - SELECT
   - Gestores veem todas as mensagens
   - Atendentes veem apenas mensagens dos seus departamentos

2. "Inserção por permissões" - INSERT
   - Qualquer usuário autenticado pode inserir suas próprias mensagens

3. "Atualização por permissões" - UPDATE
   - Gestores podem atualizar qualquer mensagem
   - Atendentes podem atualizar apenas mensagens dos seus departamentos

4. "Exclusão por permissões" - DELETE
   - Apenas gestores podem deletar mensagens

BENEFÍCIOS:
- Segurança em nível de banco de dados
- Filtros automáticos por departamento
- Controle granular de permissões
- Auditoria completa das ações
*/ 