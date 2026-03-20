-- Script para adicionar a coluna id_agenda na tabela clientes_info
-- Esta coluna armazenará o ID da agenda do Google Calendar para cada cliente

-- Adicionar a coluna id_agenda se ela não existir
ALTER TABLE clientes_info 
ADD COLUMN IF NOT EXISTS id_agenda VARCHAR(255);

-- Adicionar comentário na coluna para documentação
COMMENT ON COLUMN clientes_info.id_agenda IS 'ID da agenda do Google Calendar do cliente';

-- Verificar se a coluna foi criada corretamente
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'clientes_info' 
AND column_name = 'id_agenda';

-- Exemplo de uso:
-- UPDATE clientes_info SET id_agenda = 'exemplo@gmail.com' WHERE id = 1;
