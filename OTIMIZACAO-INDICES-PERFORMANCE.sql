-- =====================================================
-- OTIMIZAÇÃO DE PERFORMANCE - ÍNDICES E CONSULTAS
-- =====================================================
-- Script para resolver as slow queries identificadas
-- =====================================================

-- =====================================================
-- 1. ÍNDICES PARA agente_conversacional_whatsapp
-- =====================================================

-- Índice principal para consultas por instance_id + created_at
-- Resolve: SELECT * FROM agente_conversacional_whatsapp WHERE instance_id = ANY (...) ORDER BY created_at ASC
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agente_conversacional_whatsapp_instance_created 
ON public.agente_conversacional_whatsapp (instance_id, created_at ASC);

-- Índice para consultas por instance_id único
-- Resolve: SELECT * FROM agente_conversacional_whatsapp WHERE instance_id = $1 ORDER BY created_at ASC
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agente_conversacional_whatsapp_instance_single 
ON public.agente_conversacional_whatsapp (instance_id, created_at ASC) 
WHERE instance_id IS NOT NULL;

-- Índice para consultas por user_id (para RLS)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agente_conversacional_whatsapp_user_id 
ON public.agente_conversacional_whatsapp (user_id) 
WHERE user_id IS NOT NULL;

-- Índice para consultas por user_id_auth (para RLS)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agente_conversacional_whatsapp_user_id_auth 
ON public.agente_conversacional_whatsapp (user_id_auth) 
WHERE user_id_auth IS NOT NULL;

-- Índice para consultas por telefone_id (para agrupamento de conversas)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agente_conversacional_whatsapp_telefone_id 
ON public.agente_conversacional_whatsapp (telefone_id) 
WHERE telefone_id IS NOT NULL;

-- Índice para consultas por conversa_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agente_conversacional_whatsapp_conversa_id 
ON public.agente_conversacional_whatsapp (conversa_id) 
WHERE conversa_id IS NOT NULL;

-- =====================================================
-- 2. ÍNDICES PARA leads
-- =====================================================

-- Índice principal para consultas por id_cliente
-- Resolve: SELECT * FROM leads WHERE id_cliente = $1 LIMIT $2 OFFSET $3
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_id_cliente 
ON public.leads (id_cliente) 
WHERE id_cliente IS NOT NULL;

-- Índice para consultas por telefone + id_cliente (para busca de leads)
-- Resolve: SELECT * FROM leads WHERE telefone = ANY ($1) AND id_cliente = $2
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_telefone_id_cliente 
ON public.leads (telefone, id_cliente) 
WHERE telefone IS NOT NULL AND id_cliente IS NOT NULL;

-- Índice para consultas por data_criacao + id_cliente (para Dashboard)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_data_criacao_id_cliente 
ON public.leads (data_criacao DESC, id_cliente) 
WHERE id_cliente IS NOT NULL;

-- =====================================================
-- 3. ÍNDICES PARA clientes_info
-- =====================================================

-- Índice para consultas por user_id_auth
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clientes_info_user_id_auth 
ON public.clientes_info (user_id_auth) 
WHERE user_id_auth IS NOT NULL;

-- Índice para consultas por instance_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clientes_info_instance_id 
ON public.clientes_info (instance_id) 
WHERE instance_id IS NOT NULL;

-- =====================================================
-- 4. VERIFICAÇÃO DOS ÍNDICES CRIADOS
-- =====================================================

-- Verificar índices da tabela agente_conversacional_whatsapp
SELECT 
    'agente_conversacional_whatsapp' as tabela,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'agente_conversacional_whatsapp'
ORDER BY indexname;

-- Verificar índices da tabela leads
SELECT 
    'leads' as tabela,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'leads'
ORDER BY indexname;

-- Verificar índices da tabela clientes_info
SELECT 
    'clientes_info' as tabela,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'clientes_info'
ORDER BY indexname;

-- =====================================================
-- 5. ANÁLISE DE PERFORMANCE
-- =====================================================

-- Verificar estatísticas de uso dos índices
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes 
WHERE tablename IN ('agente_conversacional_whatsapp', 'leads', 'clientes_info')
ORDER BY tablename, idx_scan DESC;

-- =====================================================
-- 6. RECOMENDAÇÕES ADICIONAIS
-- =====================================================

/*
RECOMENDAÇÕES PARA O FRONTEND:

1. PAGINAÇÃO OBRIGATÓRIA:
   - Sempre use LIMIT e OFFSET nas consultas
   - Implemente infinite scroll ou paginação
   - Evite buscar todas as mensagens de uma vez

2. CACHE LOCAL:
   - Use React Query ou SWR para cache
   - Implemente cache de mensagens por conversa
   - Evite refetch desnecessário

3. REALTIME OTIMIZADO:
   - Use apenas para novas mensagens
   - Implemente debounce nas subscriptions
   - Faça unsubscribe quando componente desmontar

4. CONSULTAS INTELIGENTES:
   - Busque apenas mensagens necessárias
   - Use filtros por data quando possível
   - Implemente busca lazy loading

EXEMPLO DE CONSULTA OTIMIZADA:
SELECT * FROM agente_conversacional_whatsapp 
WHERE instance_id = $1 
ORDER BY created_at DESC 
LIMIT 50 OFFSET 0;
*/ 