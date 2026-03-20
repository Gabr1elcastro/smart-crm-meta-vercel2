-- Adicionar coluna int_instagram na tabela clientes_info
-- Esta coluna controla se o cliente tem acesso às conversas do Instagram

-- Verificar se a coluna já existe antes de adicionar
DO $$ 
BEGIN
    -- Verificar se a coluna int_instagram já existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'clientes_info' 
        AND column_name = 'int_instagram'
    ) THEN
        -- Adicionar a coluna int_instagram como boolean com valor padrão FALSE
        ALTER TABLE clientes_info 
        ADD COLUMN int_instagram BOOLEAN DEFAULT FALSE;
        
        -- Comentário para documentar a coluna
        COMMENT ON COLUMN clientes_info.int_instagram IS 'Controla se o cliente tem acesso às conversas do Instagram';
        
        RAISE NOTICE 'Coluna int_instagram adicionada com sucesso na tabela clientes_info';
    ELSE
        RAISE NOTICE 'Coluna int_instagram já existe na tabela clientes_info';
    END IF;
END $$;

-- Atualizar alguns clientes de teste para ter acesso ao Instagram (opcional)
-- Descomente as linhas abaixo se quiser ativar o Instagram para clientes específicos
/*
UPDATE clientes_info 
SET int_instagram = TRUE 
WHERE id IN (1, 2, 3); -- Substitua pelos IDs dos clientes que devem ter acesso
*/
