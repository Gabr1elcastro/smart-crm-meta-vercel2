-- INDICES-PERMISSOES-ATENDENTES.sql
-- =====================================================
-- ÍNDICES OTIMIZADOS PARA FILTROS DE PERMISSÕES
-- =====================================================
-- Este script cria índices específicos para melhorar a performance
-- das consultas com filtros de permissão por departamento
-- =====================================================

-- 1. Índices para agente_conversacional_whatsapp
-- =====================================================

-- Índice para consultas por telefone_id e instance_id (usado nas políticas RLS)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agente_telefone_instance 
ON public.agente_conversacional_whatsapp (telefone_id, instance_id) 
WHERE telefone_id IS NOT NULL AND instance_id IS NOT NULL;

-- Índice para consultas por user_id_auth (para RLS)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agente_user_id_auth 
ON public.agente_conversacional_whatsapp (user_id_auth) 
WHERE user_id_auth IS NOT NULL;

-- Índice composto para consultas de conversas por telefone e data
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agente_telefone_created 
ON public.agente_conversacional_whatsapp (telefone_id, created_at DESC) 
WHERE telefone_id IS NOT NULL;

-- 2. Índices para leads com departamento
-- =====================================================

-- Índice para consultas por departamento e cliente (usado nas políticas RLS)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_departamento_cliente 
ON public.leads (id_departamento, id_cliente) 
WHERE id_departamento IS NOT NULL AND id_cliente IS NOT NULL;

-- Índice para consultas por telefone, departamento e cliente
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_telefone_departamento 
ON public.leads (telefone, id_departamento, id_cliente) 
WHERE telefone IS NOT NULL AND id_departamento IS NOT NULL;

-- Índice para consultas por cliente e data de criação
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_cliente_data 
ON public.leads (id_cliente, data_criacao DESC) 
WHERE id_cliente IS NOT NULL;

-- Índice para consultas por telefone e cliente
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_telefone_cliente 
ON public.leads (telefone, id_cliente) 
WHERE telefone IS NOT NULL AND id_cliente IS NOT NULL;

-- 3. Índices para atendentes
-- =====================================================

-- Índice para consultas por email e cliente (usado nas políticas RLS)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_atendentes_email_cliente 
ON public.atendentes (email, id_cliente) 
WHERE email IS NOT NULL AND id_cliente IS NOT NULL;

-- Índice para consultas por tipo de usuário e departamento
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_atendentes_tipo_departamento 
ON public.atendentes (tipo_usuario, id_departamento) 
WHERE tipo_usuario = 'Atendente' AND id_departamento IS NOT NULL;

-- Índice para consultas por tipo de usuário e departamentos (array)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_atendentes_tipo_departamentos 
ON public.atendentes USING GIN (departamentos) 
WHERE tipo_usuario = 'Atendente' AND departamentos IS NOT NULL;

-- 4. Índices para clientes_info
-- =====================================================

-- Índice para consultas por user_id_auth (usado nas políticas RLS)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clientes_user_id 
ON public.clientes_info (user_id_auth) 
WHERE user_id_auth IS NOT NULL;

-- Índice para consultas por email
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clientes_email 
ON public.clientes_info (email) 
WHERE email IS NOT NULL;

-- Índice para consultas por instance_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clientes_instance_id 
ON public.clientes_info (instance_id) 
WHERE instance_id IS NOT NULL;

-- 5. Verificar índices criados
-- =====================================================

-- Listar todos os índices criados
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE indexname LIKE 'idx_%'
  AND tablename IN ('agente_conversacional_whatsapp', 'leads', 'atendentes', 'clientes_info')
ORDER BY tablename, indexname;

-- 6. Análise de performance dos índices
-- =====================================================

-- Verificar uso dos índices
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes 
WHERE indexname LIKE 'idx_%'
  AND tablename IN ('agente_conversacional_whatsapp', 'leads', 'atendentes', 'clientes_info')
ORDER BY idx_scan DESC;

-- 7. Verificar tamanho dos índices
-- =====================================================

SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as tamanho
FROM pg_indexes 
WHERE indexname LIKE 'idx_%'
  AND tablename IN ('agente_conversacional_whatsapp', 'leads', 'atendentes', 'clientes_info')
ORDER BY pg_relation_size(indexname::regclass) DESC;

-- 8. Teste de performance das consultas
-- =====================================================

-- Teste 1: Consulta de mensagens por telefone (usado nas políticas RLS)
EXPLAIN (ANALYZE, BUFFERS) 
SELECT COUNT(*) 
FROM agente_conversacional_whatsapp 
WHERE telefone_id = '5511999999999' 
  AND instance_id = 'test_instance';

-- Teste 2: Consulta de leads por departamento (usado nas políticas RLS)
EXPLAIN (ANALYZE, BUFFERS) 
SELECT COUNT(*) 
FROM leads 
WHERE id_departamento = 1 
  AND id_cliente = 1;

-- Teste 3: Consulta de atendentes por email e cliente (usado nas políticas RLS)
EXPLAIN (ANALYZE, BUFFERS) 
SELECT COUNT(*) 
FROM atendentes 
WHERE email = 'test@example.com' 
  AND id_cliente = 1;

-- =====================================================
-- RESUMO DA IMPLEMENTAÇÃO
-- =====================================================
/*
ÍNDICES CRIADOS:

1. agente_conversacional_whatsapp:
   - idx_agente_telefone_instance: Para consultas por telefone e instância
   - idx_agente_user_id_auth: Para RLS por usuário
   - idx_agente_telefone_created: Para conversas ordenadas por data

2. leads:
   - idx_leads_departamento_cliente: Para filtros por departamento
   - idx_leads_telefone_departamento: Para busca de leads por telefone
   - idx_leads_cliente_data: Para listagem ordenada por data
   - idx_leads_telefone_cliente: Para busca rápida de leads

3. atendentes:
   - idx_atendentes_email_cliente: Para políticas RLS
   - idx_atendentes_tipo_departamento: Para filtros por tipo e departamento
   - idx_atendentes_tipo_departamentos: Para arrays de departamentos

4. clientes_info:
   - idx_clientes_user_id: Para políticas RLS
   - idx_clientes_email: Para consultas por email
   - idx_clientes_instance_id: Para consultas por instância

BENEFÍCIOS:
- Consultas de políticas RLS otimizadas
- Melhor performance em filtros por departamento
- Redução do tempo de resposta das consultas
- Suporte a grandes volumes de dados
*/ 