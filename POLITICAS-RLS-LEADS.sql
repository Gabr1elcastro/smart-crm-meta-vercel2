-- POLITICAS-RLS-LEADS.sql
-- =====================================================
-- POLÍTICAS RLS PARA TABELA LEADS
-- =====================================================
-- Este script implementa filtros de permissão por departamento
-- para a tabela leads
-- =====================================================

-- 1. Habilitar RLS na tabela leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas existentes
DROP POLICY IF EXISTS "Permitir acesso aos leads do cliente" ON leads;
DROP POLICY IF EXISTS "Permitir inserção de leads" ON leads;
DROP POLICY IF EXISTS "Permitir atualização de leads" ON leads;
DROP POLICY IF EXISTS "Leitura de leads por departamento" ON leads;
DROP POLICY IF EXISTS "Inserção de leads" ON leads;
DROP POLICY IF EXISTS "Atualização de leads" ON leads;

-- 3. Política de SELECT para leads
CREATE POLICY "Leitura de leads por departamento" 
ON public.leads
FOR SELECT
USING (
  -- Gestores veem todos os leads do cliente
  EXISTS (
    SELECT 1 FROM atendentes a
    WHERE a.email = auth.jwt() ->> 'email'
    AND a.id_cliente = leads.id_cliente
    AND a.tipo_usuario = 'Gestor'
  )
  OR
  -- Atendentes veem apenas leads dos seus departamentos
  EXISTS (
    SELECT 1 FROM atendentes a
    WHERE a.email = auth.jwt() ->> 'email'
    AND a.id_cliente = leads.id_cliente
    AND a.tipo_usuario = 'Atendente'
    AND (
      (a.id_departamento IS NOT NULL AND leads.id_departamento = a.id_departamento)
      OR
      (a.departamentos IS NOT NULL AND leads.id_departamento::text = ANY(a.departamentos))
    )
  )
);

-- 4. Política de INSERT para leads
CREATE POLICY "Inserção de leads" 
ON public.leads
FOR INSERT
WITH CHECK (
  -- Gestores podem inserir leads em qualquer departamento
  EXISTS (
    SELECT 1 FROM atendentes a
    WHERE a.email = auth.jwt() ->> 'email'
    AND a.id_cliente = leads.id_cliente
    AND a.tipo_usuario = 'Gestor'
  )
  OR
  -- Atendentes podem inserir leads apenas nos seus departamentos
  EXISTS (
    SELECT 1 FROM atendentes a
    WHERE a.email = auth.jwt() ->> 'email'
    AND a.id_cliente = leads.id_cliente
    AND a.tipo_usuario = 'Atendente'
    AND (
      (a.id_departamento IS NOT NULL AND leads.id_departamento = a.id_departamento)
      OR
      (a.departamentos IS NOT NULL AND leads.id_departamento::text = ANY(a.departamentos))
    )
  )
);

-- 5. Política de UPDATE para leads
CREATE POLICY "Atualização de leads" 
ON public.leads
FOR UPDATE
USING (
  -- Mesma lógica de SELECT
  EXISTS (
    SELECT 1 FROM atendentes a
    WHERE a.email = auth.jwt() ->> 'email'
    AND a.id_cliente = leads.id_cliente
    AND a.tipo_usuario = 'Gestor'
  )
  OR
  EXISTS (
    SELECT 1 FROM atendentes a
    WHERE a.email = auth.jwt() ->> 'email'
    AND a.id_cliente = leads.id_cliente
    AND a.tipo_usuario = 'Atendente'
    AND (
      (a.id_departamento IS NOT NULL AND leads.id_departamento = a.id_departamento)
      OR
      (a.departamentos IS NOT NULL AND leads.id_departamento::text = ANY(a.departamentos))
    )
  )
)
WITH CHECK (
  -- Mesma lógica de INSERT
  EXISTS (
    SELECT 1 FROM atendentes a
    WHERE a.email = auth.jwt() ->> 'email'
    AND a.id_cliente = leads.id_cliente
    AND a.tipo_usuario = 'Gestor'
  )
  OR
  EXISTS (
    SELECT 1 FROM atendentes a
    WHERE a.email = auth.jwt() ->> 'email'
    AND a.id_cliente = leads.id_cliente
    AND a.tipo_usuario = 'Atendente'
    AND (
      (a.id_departamento IS NOT NULL AND leads.id_departamento = a.id_departamento)
      OR
      (a.departamentos IS NOT NULL AND leads.id_departamento::text = ANY(a.departamentos))
    )
  )
);

-- 6. Política de DELETE para leads (apenas gestores)
CREATE POLICY "Exclusão de leads" 
ON public.leads
FOR DELETE
USING (
  -- Apenas gestores podem deletar leads
  EXISTS (
    SELECT 1 FROM atendentes a
    WHERE a.email = auth.jwt() ->> 'email'
    AND a.id_cliente = leads.id_cliente
    AND a.tipo_usuario = 'Gestor'
  )
);

-- 7. Verificar se as políticas foram criadas
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'leads'
ORDER BY cmd, policyname;

-- 8. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables 
WHERE tablename = 'leads';

-- 9. Teste de validação das políticas
-- (Execute como gestor para verificar se funciona)
SELECT 
    'Teste de políticas RLS' as teste,
    COUNT(*) as total_leads_visiveis
FROM leads
WHERE id_cliente = (
    SELECT ci.id FROM clientes_info ci 
    WHERE ci.user_id_auth = auth.uid()
);

-- =====================================================
-- RESUMO DA IMPLEMENTAÇÃO
-- =====================================================
/*
POLÍTICAS CRIADAS:
1. "Leitura de leads por departamento" - SELECT
   - Gestores veem todos os leads do cliente
   - Atendentes veem apenas leads dos seus departamentos

2. "Inserção de leads" - INSERT
   - Gestores podem inserir leads em qualquer departamento
   - Atendentes podem inserir leads apenas nos seus departamentos

3. "Atualização de leads" - UPDATE
   - Gestores podem atualizar qualquer lead
   - Atendentes podem atualizar apenas leads dos seus departamentos

4. "Exclusão de leads" - DELETE
   - Apenas gestores podem deletar leads

BENEFÍCIOS:
- Controle granular de acesso aos leads
- Segurança em nível de banco de dados
- Filtros automáticos por departamento
- Prevenção de acesso não autorizado
*/ 