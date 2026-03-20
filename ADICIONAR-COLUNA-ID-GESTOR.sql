-- Script para adicionar a coluna id_gestor na tabela clientes_info
-- Esta coluna armazenará um array de IDs dos gestores inscritos para cada cliente

-- 1. Verificar se a coluna já existe
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'clientes_info' 
AND column_name = 'id_gestor';

-- 2. Adicionar a coluna se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clientes_info' 
        AND column_name = 'id_gestor'
    ) THEN
        ALTER TABLE public.clientes_info 
        ADD COLUMN id_gestor UUID[] DEFAULT '{}';
        
        RAISE NOTICE 'Coluna id_gestor adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna id_gestor já existe!';
    END IF;
END $$;

-- 3. Adicionar comentário na coluna para documentação
COMMENT ON COLUMN clientes_info.id_gestor IS 'Array de UUIDs dos gestores inscritos para este cliente';

-- 4. Verificar a estrutura atualizada da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'clientes_info' 
AND column_name = 'id_gestor';

-- 5. Exemplo de uso para adicionar um gestor:
-- UPDATE clientes_info SET id_gestor = array_append(id_gestor, 'uuid-do-gestor') WHERE id = 'uuid-do-cliente';

-- 6. Exemplo de uso para remover um gestor:
-- UPDATE clientes_info SET id_gestor = array_remove(id_gestor, 'uuid-do-gestor') WHERE id = 'uuid-do-cliente';

-- 7. Exemplo de uso para verificar se um usuário é gestor:
-- SELECT * FROM clientes_info WHERE 'uuid-do-usuario' = ANY(id_gestor);

-- 8. Verificar clientes com gestores inscritos
SELECT 
    id,
    name,
    email,
    id_gestor,
    array_length(id_gestor, 1) as total_gestores
FROM public.clientes_info 
WHERE id_gestor IS NOT NULL 
AND array_length(id_gestor, 1) > 0
ORDER BY created_at DESC;




