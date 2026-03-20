-- Script para migrar o campo id_gestor de string para array
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar a estrutura atual da coluna id_gestor
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'clientes_info' 
AND column_name = 'id_gestor';

-- 2. Verificar dados atuais
SELECT 
    id,
    name,
    email,
    id_gestor,
    CASE 
        WHEN id_gestor IS NULL THEN 'NULL'
        WHEN id_gestor = '' THEN 'VAZIO'
        ELSE 'TEM_DADOS'
    END as status_gestor
FROM public.clientes_info 
WHERE id_gestor IS NOT NULL 
ORDER BY created_at DESC;

-- 3. Criar coluna temporária para backup
ALTER TABLE public.clientes_info 
ADD COLUMN IF NOT EXISTS id_gestor_backup TEXT;

-- 4. Fazer backup dos dados atuais
UPDATE public.clientes_info 
SET id_gestor_backup = id_gestor 
WHERE id_gestor IS NOT NULL AND id_gestor != '';

-- 5. Alterar o tipo da coluna id_gestor para array de UUIDs
-- Primeiro, vamos limpar os dados inválidos
UPDATE public.clientes_info 
SET id_gestor = NULL 
WHERE id_gestor = '' OR id_gestor = 'null' OR id_gestor = 'undefined';

-- 6. Converter string para array quando possível
UPDATE public.clientes_info 
SET id_gestor = CASE 
    WHEN id_gestor IS NOT NULL AND id_gestor != '' THEN 
        ARRAY[id_gestor::UUID]
    ELSE 
        NULL
END
WHERE id_gestor IS NOT NULL;

-- 7. Alterar o tipo da coluna para UUID[]
DO $$
BEGIN
    -- Tentar alterar o tipo da coluna
    BEGIN
        ALTER TABLE public.clientes_info 
        ALTER COLUMN id_gestor TYPE UUID[] 
        USING id_gestor::UUID[];
    EXCEPTION 
        WHEN OTHERS THEN
            RAISE NOTICE 'Erro ao alterar tipo da coluna: %', SQLERRM;
            RAISE NOTICE 'Removendo coluna e recriando...';
            
            -- Remover coluna e recriar
            ALTER TABLE public.clientes_info DROP COLUMN IF EXISTS id_gestor;
            ALTER TABLE public.clientes_info 
            ADD COLUMN id_gestor UUID[] DEFAULT '{}';
            
            -- Restaurar dados do backup
            UPDATE public.clientes_info 
            SET id_gestor = ARRAY[id_gestor_backup::UUID]
            WHERE id_gestor_backup IS NOT NULL 
            AND id_gestor_backup != '';
    END;
END $$;

-- 8. Verificar se a conversão foi bem-sucedida
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'clientes_info' 
AND column_name = 'id_gestor';

-- 9. Verificar dados convertidos
SELECT 
    id,
    name,
    email,
    id_gestor,
    array_length(id_gestor, 1) as total_gestores,
    id_gestor_backup
FROM public.clientes_info 
WHERE id_gestor IS NOT NULL 
AND array_length(id_gestor, 1) > 0
ORDER BY created_at DESC;

-- 10. Limpar coluna de backup (opcional - descomente se tudo estiver OK)
-- ALTER TABLE public.clientes_info DROP COLUMN IF EXISTS id_gestor_backup;

-- 11. Adicionar comentário na coluna
COMMENT ON COLUMN clientes_info.id_gestor IS 'Array de UUIDs dos gestores inscritos para este cliente';

-- 12. Exemplos de uso após a migração:

-- Adicionar um gestor:
-- UPDATE clientes_info SET id_gestor = array_append(id_gestor, 'uuid-do-gestor') WHERE id = 114;

-- Remover um gestor:
-- UPDATE clientes_info SET id_gestor = array_remove(id_gestor, 'uuid-do-gestor') WHERE id = 114;

-- Verificar se um usuário é gestor:
-- SELECT * FROM clientes_info WHERE 'uuid-do-usuario' = ANY(id_gestor);

-- Listar todos os gestores de um cliente:
-- SELECT unnest(id_gestor) as gestor_id FROM clientes_info WHERE id = 114;




