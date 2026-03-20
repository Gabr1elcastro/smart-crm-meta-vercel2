-- Script para inserir dados de teste na tabela funis_rd
-- Execute este script no SQL Editor do Supabase

-- Primeiro, vamos verificar se as tabelas existem
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('funis_rd', 'etapas_funis_rd');

-- Inserir dados de teste na tabela funis_rd
-- IMPORTANTE: Substitua o id_cliente pelo ID real do seu cliente
INSERT INTO funis_rd (id_cliente, id_funil_rd, nome_funil, funil_padrao, created_at, updated_at)
VALUES 
  (1, 'funil_vendas_001', 'Funil de Vendas - Principal', false, NOW(), NOW()),
  (1, 'funil_marketing_002', 'Funil de Marketing - Leads', false, NOW(), NOW()),
  (1, 'funil_qualificacao_003', 'Funil de Qualificação', false, NOW(), NOW());

-- Inserir dados de teste na tabela etapas_funis_rd
INSERT INTO etapas_funis_rd (id_cliente, id_funil_rd, nome_etapa, palavra_chave, created_at)
VALUES 
  -- Etapas do Funil de Vendas
  (1, 'funil_vendas_001', 'Lead Inicial', 'contato,interesse', NOW()),
  (1, 'funil_vendas_001', 'Lead Qualificado', 'qualificado,interessado', NOW()),
  (1, 'funil_vendas_001', 'Proposta Enviada', 'proposta,orçamento', NOW()),
  (1, 'funil_vendas_001', 'Negociação', 'negociação,reunião', NOW()),
  (1, 'funil_vendas_001', 'Fechamento', 'fechamento,venda', NOW()),
  
  -- Etapas do Funil de Marketing
  (1, 'funil_marketing_002', 'Visitante', 'visitante,site', NOW()),
  (1, 'funil_marketing_002', 'Lead', 'lead,cadastro', NOW()),
  (1, 'funil_marketing_002', 'MQL', 'mql,qualificado', NOW()),
  (1, 'funil_marketing_002', 'SQL', 'sql,vendas', NOW()),
  
  -- Etapas do Funil de Qualificação
  (1, 'funil_qualificacao_003', 'Novo Lead', 'novo,primeiro', NOW()),
  (1, 'funil_qualificacao_003', 'Em Qualificação', 'qualificando,analisando', NOW()),
  (1, 'funil_qualificacao_003', 'Qualificado', 'qualificado,aprovado', NOW()),
  (1, 'funil_qualificacao_003', 'Desqualificado', 'desqualificado,rejeitado', NOW());

-- Verificar os dados inseridos
SELECT 'Funis RD inseridos:' as tipo, COUNT(*) as total FROM funis_rd WHERE id_cliente = 1;
SELECT 'Etapas RD inseridas:' as tipo, COUNT(*) as total FROM etapas_funis_rd WHERE id_cliente = 1;

-- Mostrar os dados inseridos
SELECT 'FUNIS RD:' as secao;
SELECT * FROM funis_rd WHERE id_cliente = 1 ORDER BY created_at;

SELECT 'ETAPAS RD:' as secao;
SELECT * FROM etapas_funis_rd WHERE id_cliente = 1 ORDER BY id_funil_rd, created_at;

