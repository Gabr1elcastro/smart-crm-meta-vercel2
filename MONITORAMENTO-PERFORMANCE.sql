-- =====================================================
-- MONITORAMENTO DE PERFORMANCE - PÓS OTIMIZAÇÃO
-- =====================================================
-- Script para acompanhar a performance após as otimizações
-- Execute periodicamente para monitorar melhorias
-- =====================================================

-- =====================================================
-- 1. ANÁLISE DE SLOW QUERIES ATUAIS
-- =====================================================

-- Consultas mais lentas (top 10)
SELECT 
    rolname,
    query,
    calls,
    total_time,
    mean_time,
    max_time,
    ROUND((total_time / calls), 2) as avg_time_per_call
FROM pg_stat_statements 
WHERE query NOT LIKE '%pg_stat_statements%'
  AND query NOT LIKE '%pg_stat_%'
  AND query NOT LIKE '%information_schema%'
ORDER BY total_time DESC
LIMIT 10;

-- =====================================================
-- 2. ANÁLISE DE USO DOS ÍNDICES
-- =====================================================

-- Estatísticas de uso dos índices otimizados
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    ROUND((idx_tup_fetch::float / NULLIF(idx_tup_read, 0)) * 100, 2) as fetch_ratio_percent
FROM pg_stat_user_indexes 
WHERE tablename IN ('agente_conversacional_whatsapp', 'leads', 'clientes_info')
  AND indexname LIKE 'idx_%'
ORDER BY idx_scan DESC;

-- =====================================================
-- 3. ANÁLISE DE CONSULTAS ESPECÍFICAS
-- =====================================================

-- Consultas relacionadas ao agente_conversacional_whatsapp
SELECT 
    rolname,
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements 
WHERE query LIKE '%agente_conversacional_whatsapp%'
  AND query LIKE '%instance_id%'
ORDER BY total_time DESC
LIMIT 5;

-- Consultas relacionadas ao leads
SELECT 
    rolname,
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements 
WHERE query LIKE '%leads%'
  AND query LIKE '%id_cliente%'
ORDER BY total_time DESC
LIMIT 5;

-- =====================================================
-- 4. ANÁLISE DE REALTIME
-- =====================================================

-- Consultas relacionadas ao realtime
SELECT 
    rolname,
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements 
WHERE query LIKE '%realtime%'
  OR query LIKE '%list_changes%'
ORDER BY total_time DESC
LIMIT 5;

-- =====================================================
-- 5. ANÁLISE DE CONEXÕES E SESSÕES
-- =====================================================

-- Sessões ativas por role
SELECT 
    usename,
    application_name,
    client_addr,
    state,
    COUNT(*) as session_count
FROM pg_stat_activity 
WHERE state IS NOT NULL
GROUP BY usename, application_name, client_addr, state
ORDER BY session_count DESC;

-- =====================================================
-- 6. ANÁLISE DE TAMANHO DAS TABELAS
-- =====================================================

-- Tamanho das tabelas principais
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables 
WHERE tablename IN ('agente_conversacional_whatsapp', 'leads', 'clientes_info')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- =====================================================
-- 7. ANÁLISE DE FRAGMENTAÇÃO
-- =====================================================

-- Fragmentação das tabelas (se houver)
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples,
    ROUND((n_dead_tup::float / NULLIF(n_live_tup + n_dead_tup, 0)) * 100, 2) as dead_tuple_ratio
FROM pg_stat_user_tables 
WHERE tablename IN ('agente_conversacional_whatsapp', 'leads', 'clientes_info')
ORDER BY dead_tuple_ratio DESC;

-- =====================================================
-- 8. MÉTRICAS DE PERFORMANCE GERAL
-- =====================================================

-- Resumo de performance
SELECT 
    'Total de consultas' as metric,
    SUM(calls) as value
FROM pg_stat_statements
UNION ALL
SELECT 
    'Tempo total de execução (ms)' as metric,
    ROUND(SUM(total_time), 2) as value
FROM pg_stat_statements
UNION ALL
SELECT 
    'Tempo médio por consulta (ms)' as metric,
    ROUND(AVG(mean_time), 2) as value
FROM pg_stat_statements
UNION ALL
SELECT 
    'Consultas mais lentas (>100ms)' as metric,
    COUNT(*) as value
FROM pg_stat_statements
WHERE mean_time > 100;

-- =====================================================
-- 9. RECOMENDAÇÕES AUTOMÁTICAS
-- =====================================================

/*
RECOMENDAÇÕES BASEADAS NOS DADOS:

1. SE mean_time > 100ms para agente_conversacional_whatsapp:
   - Verificar se os índices estão sendo usados
   - Considerar particionamento por data
   - Implementar cache Redis

2. SE calls > 1000000 para realtime:
   - Reduzir frequência de subscriptions
   - Implementar debounce no frontend
   - Usar WebSocket direto se possível

3. SE dead_tuple_ratio > 20%:
   - Executar VACUUM ANALYZE
   - Considerar autovacuum settings

4. SE session_count > 100:
   - Verificar connection pooling
   - Implementar PgBouncer
   - Otimizar queries que mantêm conexões abertas

5. SE total_size > 1GB:
   - Considerar arquivamento de dados antigos
   - Implementar particionamento
   - Otimizar storage
*/

-- =====================================================
-- 10. SCRIPT DE LIMPEZA (OPCIONAL)
-- =====================================================

-- Resetar estatísticas (execute apenas se necessário)
-- SELECT pg_stat_statements_reset();

-- VACUUM das tabelas principais (execute em horário de baixo tráfego)
-- VACUUM ANALYZE agente_conversacional_whatsapp;
-- VACUUM ANALYZE leads;
-- VACUUM ANALYZE clientes_info; 