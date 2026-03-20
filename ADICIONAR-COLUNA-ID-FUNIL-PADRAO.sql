-- Script para adicionar a coluna id_funil_padrao na tabela clientes_info
-- Esta coluna armazena o ID do funil padrão para cada cliente

-- Verificar se a coluna já existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'clientes_info' 
        AND column_name = 'id_funil_padrao'
    ) THEN
        -- Adicionar a coluna
        ALTER TABLE public.clientes_info 
        ADD COLUMN id_funil_padrao INTEGER NULL;
        
        -- Adicionar comentário
        COMMENT ON COLUMN public.clientes_info.id_funil_padrao IS 'ID do funil padrão para direcionamento automático de novos leads';
        
        -- Adicionar índice para melhor performance
        CREATE INDEX IF NOT EXISTS idx_clientes_info_id_funil_padrao 
        ON public.clientes_info(id_funil_padrao);
        
        RAISE NOTICE 'Coluna id_funil_padrao adicionada com sucesso na tabela clientes_info';
    ELSE
        RAISE NOTICE 'Coluna id_funil_padrao já existe na tabela clientes_info';
    END IF;
END $$;

-- Verificar a estrutura atualizada
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'clientes_info' 
AND column_name = 'id_funil_padrao';

-- Verificar se há algum funil já definido como padrão
SELECT 
    ci.id,
    ci.name,
    ci.email,
    ci.id_funil_padrao,
    f.nome as nome_funil_padrao
FROM public.clientes_info ci
LEFT JOIN public.funis f ON ci.id_funil_padrao = f.id
WHERE ci.id_funil_padrao IS NOT NULL;
