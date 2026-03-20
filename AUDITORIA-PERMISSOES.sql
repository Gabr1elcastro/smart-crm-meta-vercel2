-- AUDITORIA-PERMISSOES.sql
-- =====================================================
-- SISTEMA DE AUDITORIA PARA PERMISSÕES
-- =====================================================
-- Este script implementa um sistema completo de auditoria
-- para monitorar todas as ações relacionadas a permissões
-- =====================================================

-- 1. Criar tabela de auditoria
-- =====================================================

CREATE TABLE IF NOT EXISTS public.auditoria_permissoes (
  id SERIAL PRIMARY KEY,
  user_id_auth UUID REFERENCES auth.users(id),
  email TEXT NOT NULL,
  acao TEXT NOT NULL,
  tabela TEXT NOT NULL,
  registro_id TEXT,
  departamento_id INTEGER,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  detalhes JSONB,
  ip_address INET,
  user_agent TEXT
);

-- 2. Criar índices para auditoria
-- =====================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auditoria_user_id 
ON public.auditoria_permissoes (user_id_auth) 
WHERE user_id_auth IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auditoria_email 
ON public.auditoria_permissoes (email) 
WHERE email IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auditoria_timestamp 
ON public.auditoria_permissoes (timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auditoria_acao_tabela 
ON public.auditoria_permissoes (acao, tabela);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auditoria_departamento 
ON public.auditoria_permissoes (departamento_id) 
WHERE departamento_id IS NOT NULL;

-- 3. Função para registrar auditoria
-- =====================================================

CREATE OR REPLACE FUNCTION registrar_auditoria_permissoes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.auditoria_permissoes (
    user_id_auth,
    email,
    acao,
    tabela,
    registro_id,
    departamento_id,
    detalhes,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    COALESCE(auth.jwt() ->> 'email', 'unknown'),
    TG_OP,
    TG_TABLE_NAME,
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.id::text
      ELSE NEW.id::text
    END,
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.id_departamento
      ELSE NEW.id_departamento
    END,
    jsonb_build_object(
      'old', CASE WHEN TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
      'new', CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
      'operation', TG_OP,
      'table', TG_TABLE_NAME,
      'timestamp', NOW()
    ),
    inet_client_addr(),
    current_setting('request.headers', true)::jsonb ->> 'user-agent'
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Triggers para auditoria
-- =====================================================

-- Trigger para auditoria de leads
DROP TRIGGER IF EXISTS auditoria_leads ON public.leads;
CREATE TRIGGER auditoria_leads
  AFTER INSERT OR UPDATE OR DELETE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION registrar_auditoria_permissoes();

-- Trigger para auditoria de mensagens
DROP TRIGGER IF EXISTS auditoria_mensagens ON public.agente_conversacional_whatsapp;
CREATE TRIGGER auditoria_mensagens
  AFTER INSERT OR UPDATE OR DELETE ON public.agente_conversacional_whatsapp
  FOR EACH ROW EXECUTE FUNCTION registrar_auditoria_permissoes();

-- Trigger para auditoria de atendentes
DROP TRIGGER IF EXISTS auditoria_atendentes ON public.atendentes;
CREATE TRIGGER auditoria_atendentes
  AFTER INSERT OR UPDATE OR DELETE ON public.atendentes
  FOR EACH ROW EXECUTE FUNCTION registrar_auditoria_permissoes();

-- 5. Função para auditoria manual
-- =====================================================

CREATE OR REPLACE FUNCTION registrar_auditoria_manual(
  p_acao TEXT,
  p_tabela TEXT,
  p_registro_id TEXT DEFAULT NULL,
  p_departamento_id INTEGER DEFAULT NULL,
  p_detalhes JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.auditoria_permissoes (
    user_id_auth,
    email,
    acao,
    tabela,
    registro_id,
    departamento_id,
    detalhes,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    COALESCE(auth.jwt() ->> 'email', 'unknown'),
    p_acao,
    p_tabela,
    p_registro_id,
    p_departamento_id,
    COALESCE(p_detalhes, '{}'::jsonb) || jsonb_build_object(
      'manual', true,
      'timestamp', NOW()
    ),
    inet_client_addr(),
    current_setting('request.headers', true)::jsonb ->> 'user-agent'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Views para consulta de auditoria
-- =====================================================

-- View para resumo de auditoria por usuário
CREATE OR REPLACE VIEW v_auditoria_por_usuario AS
SELECT 
  email,
  COUNT(*) as total_acoes,
  COUNT(CASE WHEN acao = 'INSERT' THEN 1 END) as insercoes,
  COUNT(CASE WHEN acao = 'UPDATE' THEN 1 END) as atualizacoes,
  COUNT(CASE WHEN acao = 'DELETE' THEN 1 END) as exclusoes,
  MIN(timestamp) as primeira_acao,
  MAX(timestamp) as ultima_acao
FROM public.auditoria_permissoes
GROUP BY email
ORDER BY total_acoes DESC;

-- View para resumo de auditoria por departamento
CREATE OR REPLACE VIEW v_auditoria_por_departamento AS
SELECT 
  departamento_id,
  COUNT(*) as total_acoes,
  COUNT(CASE WHEN acao = 'INSERT' THEN 1 END) as insercoes,
  COUNT(CASE WHEN acao = 'UPDATE' THEN 1 END) as atualizacoes,
  COUNT(CASE WHEN acao = 'DELETE' THEN 1 END) as exclusoes,
  MIN(timestamp) as primeira_acao,
  MAX(timestamp) as ultima_acao
FROM public.auditoria_permissoes
WHERE departamento_id IS NOT NULL
GROUP BY departamento_id
ORDER BY total_acoes DESC;

-- View para auditoria recente
CREATE OR REPLACE VIEW v_auditoria_recente AS
SELECT 
  email,
  acao,
  tabela,
  registro_id,
  departamento_id,
  timestamp,
  detalhes
FROM public.auditoria_permissoes
WHERE timestamp >= NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;

-- 7. Funções para relatórios de auditoria
-- =====================================================

-- Função para relatório de atividades por período
CREATE OR REPLACE FUNCTION relatorio_auditoria_periodo(
  p_data_inicio TIMESTAMP WITH TIME ZONE,
  p_data_fim TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
  email TEXT,
  total_acoes BIGINT,
  insercoes BIGINT,
  atualizacoes BIGINT,
  exclusoes BIGINT,
  tabelas_afetadas TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.email,
    COUNT(*) as total_acoes,
    COUNT(CASE WHEN a.acao = 'INSERT' THEN 1 END) as insercoes,
    COUNT(CASE WHEN a.acao = 'UPDATE' THEN 1 END) as atualizacoes,
    COUNT(CASE WHEN a.acao = 'DELETE' THEN 1 END) as exclusoes,
    ARRAY_AGG(DISTINCT a.tabela) as tabelas_afetadas
  FROM public.auditoria_permissoes a
  WHERE a.timestamp BETWEEN p_data_inicio AND p_data_fim
  GROUP BY a.email
  ORDER BY total_acoes DESC;
END;
$$ LANGUAGE plpgsql;

-- Função para relatório de atividades por departamento
CREATE OR REPLACE FUNCTION relatorio_auditoria_departamento(
  p_departamento_id INTEGER,
  p_dias INTEGER DEFAULT 30
)
RETURNS TABLE (
  email TEXT,
  acao TEXT,
  tabela TEXT,
  registro_id TEXT,
  timestamp TIMESTAMP WITH TIME ZONE,
  detalhes JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.email,
    a.acao,
    a.tabela,
    a.registro_id,
    a.timestamp,
    a.detalhes
  FROM public.auditoria_permissoes a
  WHERE a.departamento_id = p_departamento_id
    AND a.timestamp >= NOW() - (p_dias || ' days')::INTERVAL
  ORDER BY a.timestamp DESC;
END;
$$ LANGUAGE plpgsql;

-- 8. Políticas RLS para auditoria
-- =====================================================

-- Habilitar RLS na tabela de auditoria
ALTER TABLE public.auditoria_permissoes ENABLE ROW LEVEL SECURITY;

-- Política para gestores verem toda a auditoria
CREATE POLICY "Gestores veem toda auditoria" 
ON public.auditoria_permissoes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM atendentes a
    WHERE a.email = auth.jwt() ->> 'email'
    AND a.tipo_usuario = 'Gestor'
  )
);

-- Política para atendentes verem apenas sua própria auditoria
CREATE POLICY "Atendentes veem sua auditoria" 
ON public.auditoria_permissoes
FOR SELECT
USING (
  email = auth.jwt() ->> 'email'
);

-- 9. Verificar implementação
-- =====================================================

-- Verificar se a tabela foi criada
SELECT 
    'Tabela de auditoria criada' as status,
    COUNT(*) as total_registros
FROM public.auditoria_permissoes;

-- Verificar triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers 
WHERE trigger_name LIKE 'auditoria_%'
ORDER BY event_object_table, trigger_name;

-- Verificar views
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name LIKE 'v_auditoria_%'
ORDER BY table_name;

-- =====================================================
-- RESUMO DA IMPLEMENTAÇÃO
-- =====================================================
/*
SISTEMA DE AUDITORIA IMPLEMENTADO:

1. Tabela auditoria_permissoes:
   - Registra todas as ações (INSERT, UPDATE, DELETE)
   - Armazena detalhes completos das operações
   - Inclui informações de usuário e contexto

2. Triggers automáticos:
   - auditoria_leads: Para tabela leads
   - auditoria_mensagens: Para tabela agente_conversacional_whatsapp
   - auditoria_atendentes: Para tabela atendentes

3. Views para consulta:
   - v_auditoria_por_usuario: Resumo por usuário
   - v_auditoria_por_departamento: Resumo por departamento
   - v_auditoria_recente: Atividades das últimas 24h

4. Funções para relatórios:
   - relatorio_auditoria_periodo: Por período específico
   - relatorio_auditoria_departamento: Por departamento

5. Políticas RLS:
   - Gestores veem toda a auditoria
   - Atendentes veem apenas sua própria auditoria

BENEFÍCIOS:
- Rastreamento completo de todas as ações
- Conformidade com requisitos de auditoria
- Relatórios detalhados de atividades
- Segurança e privacidade dos dados
*/ 