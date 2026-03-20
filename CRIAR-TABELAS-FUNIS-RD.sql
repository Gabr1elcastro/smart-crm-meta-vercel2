-- Script para criar tabelas para integração com RD Station
-- Execute este script no SQL Editor do Supabase

-- 1. Criar tabela funis_rd
CREATE TABLE IF NOT EXISTS funis_rd (
    id SERIAL PRIMARY KEY,
    id_cliente INTEGER NOT NULL,
    id_funil_rd VARCHAR(255) NOT NULL,
    nome_funil VARCHAR(255) NOT NULL,
    funil_padrao BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela etapas_funis_rd
CREATE TABLE IF NOT EXISTS etapas_funis_rd (
    id SERIAL PRIMARY KEY,
    id_cliente INTEGER NOT NULL,
    id_funil_rd VARCHAR(255) NOT NULL,
    nome_etapa VARCHAR(255) NOT NULL,
    palavra_chave TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_funis_rd_id_cliente ON funis_rd(id_cliente);
CREATE INDEX IF NOT EXISTS idx_funis_rd_id_funil_rd ON funis_rd(id_funil_rd);
CREATE INDEX IF NOT EXISTS idx_funis_rd_funil_padrao ON funis_rd(funil_padrao);

CREATE INDEX IF NOT EXISTS idx_etapas_funis_rd_id_cliente ON etapas_funis_rd(id_cliente);
CREATE INDEX IF NOT EXISTS idx_etapas_funis_rd_id_funil_rd ON etapas_funis_rd(id_funil_rd);

-- 4. Habilitar RLS (Row Level Security)
ALTER TABLE funis_rd ENABLE ROW LEVEL SECURITY;
ALTER TABLE etapas_funis_rd ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas RLS para funis_rd
CREATE POLICY "Usuários podem ver seus próprios funis RD" ON funis_rd
    FOR SELECT USING (
        id_cliente = (
            SELECT (auth.jwt() ->> 'user_metadata' ->> 'id_cliente')::INTEGER
        )
    );

CREATE POLICY "Usuários podem inserir seus próprios funis RD" ON funis_rd
    FOR INSERT WITH CHECK (
        id_cliente = (
            SELECT (auth.jwt() ->> 'user_metadata' ->> 'id_cliente')::INTEGER
        )
    );

CREATE POLICY "Usuários podem atualizar seus próprios funis RD" ON funis_rd
    FOR UPDATE USING (
        id_cliente = (
            SELECT (auth.jwt() ->> 'user_metadata' ->> 'id_cliente')::INTEGER
        )
    );

CREATE POLICY "Usuários podem deletar seus próprios funis RD" ON funis_rd
    FOR DELETE USING (
        id_cliente = (
            SELECT (auth.jwt() ->> 'user_metadata' ->> 'id_cliente')::INTEGER
        )
    );

-- 6. Criar políticas RLS para etapas_funis_rd
CREATE POLICY "Usuários podem ver suas próprias etapas RD" ON etapas_funis_rd
    FOR SELECT USING (
        id_cliente = (
            SELECT (auth.jwt() ->> 'user_metadata' ->> 'id_cliente')::INTEGER
        )
    );

CREATE POLICY "Usuários podem inserir suas próprias etapas RD" ON etapas_funis_rd
    FOR INSERT WITH CHECK (
        id_cliente = (
            SELECT (auth.jwt() ->> 'user_metadata' ->> 'id_cliente')::INTEGER
        )
    );

CREATE POLICY "Usuários podem atualizar suas próprias etapas RD" ON etapas_funis_rd
    FOR UPDATE USING (
        id_cliente = (
            SELECT (auth.jwt() ->> 'user_metadata' ->> 'id_cliente')::INTEGER
        )
    );

CREATE POLICY "Usuários podem deletar suas próprias etapas RD" ON etapas_funis_rd
    FOR DELETE USING (
        id_cliente = (
            SELECT (auth.jwt() ->> 'user_metadata' ->> 'id_cliente')::INTEGER
        )
    );

-- 7. Criar constraint para garantir apenas um funil padrão por cliente
CREATE UNIQUE INDEX IF NOT EXISTS idx_funis_rd_cliente_padrao 
ON funis_rd(id_cliente) 
WHERE funil_padrao = TRUE;

-- 8. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Criar trigger para atualizar updated_at na tabela funis_rd
CREATE TRIGGER update_funis_rd_updated_at 
    BEFORE UPDATE ON funis_rd 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

