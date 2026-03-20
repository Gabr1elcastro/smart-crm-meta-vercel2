-- Script para inserir dados de teste para id_cliente = 114
-- Execute este script no SQL Editor do Supabase

-- Inserir dados de teste na tabela funis_rd para id_cliente = 114
INSERT INTO funis_rd (id_cliente, id_funil_rd, nome_funil, funil_padrao, created_at, updated_at)
VALUES 
  (114, 'funil_vendas_001', 'Funil de Vendas - Principal', false, NOW(), NOW()),
  (114, 'funil_marketing_002', 'Funil de Marketing - Leads', false, NOW(), NOW()),
  (114, 'funil_qualificacao_003', 'Funil de Qualificação', false, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Inserir dados de teste na tabela etapas_funis_rd para id_cliente = 114
INSERT INTO etapas_funis_rd (id_cliente, id_funil_rd, nome_etapa, palavra_chave, created_at)
VALUES 
  -- Etapas do Funil de Vendas
  (114, 'funil_vendas_001', 'Lead Inicial', 'contato,interesse', NOW()),
  (114, 'funil_vendas_001', 'Lead Qualificado', 'qualificado,interessado', NOW()),
  (114, 'funil_vendas_001', 'Proposta Enviada', 'proposta,orçamento', NOW()),
  (114, 'funil_vendas_001', 'Negociação', 'negociação,reunião', NOW()),
  (114, 'funil_vendas_001', 'Fechamento', 'fechamento,venda', NOW()),
  
  -- Etapas do Funil de Marketing
  (114, 'funil_marketing_002', 'Visitante', 'visitante,site', NOW()),
  (114, 'funil_marketing_002', 'Lead', 'lead,cadastro', NOW()),
  (114, 'funil_marketing_002', 'MQL', 'mql,qualificado', NOW()),
  (114, 'funil_marketing_002', 'SQL', 'sql,vendas', NOW()),
  
  -- Etapas do Funil de Qualificação
  (114, 'funil_qualificacao_003', 'Novo Lead', 'novo,primeiro', NOW()),
  (114, 'funil_qualificacao_003', 'Em Qualificação', 'qualificando,analisando', NOW()),
  (114, 'funil_qualificacao_003', 'Qualificado', 'qualificado,aprovado', NOW()),
  (114, 'funil_qualificacao_003', 'Desqualificado', 'desqualificado,rejeitado', NOW())
ON CONFLICT (id) DO NOTHING;

-- Verificar os dados inseridos
SELECT 'Funis RD inseridos para cliente 114:' as info, COUNT(*) as total FROM funis_rd WHERE id_cliente = 114;
SELECT 'Etapas RD inseridas para cliente 114:' as info, COUNT(*) as total FROM etapas_funis_rd WHERE id_cliente = 114;

-- Mostrar os dados inseridos
SELECT 'FUNIS RD PARA CLIENTE 114:' as secao;
SELECT * FROM funis_rd WHERE id_cliente = 114 ORDER BY created_at;

SELECT 'ETAPAS RD PARA CLIENTE 114:' as secao;
SELECT * FROM etapas_funis_rd WHERE id_cliente = 114 ORDER BY id_funil_rd, created_at;
