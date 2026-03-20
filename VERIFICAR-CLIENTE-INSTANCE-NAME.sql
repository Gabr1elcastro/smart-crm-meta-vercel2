-- Script para verificar e corrigir problemas de instance_name
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar todos os clientes e seus instance_name
SELECT 
    id,
    email,
    name,
    instance_name,
    instance_id,
    apikey,
    created_at
FROM clientes_info 
WHERE email = 'bruno.cunha+001@usesmartcrm.com'
ORDER BY id;

-- 2. Verificar se há registros duplicados
SELECT 
    email,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN instance_name IS NOT NULL THEN 1 END) as com_instance_name,
    COUNT(CASE WHEN instance_name IS NULL THEN 1 END) as sem_instance_name
FROM clientes_info 
WHERE email = 'bruno.cunha+001@usesmartcrm.com'
GROUP BY email;

-- 3. Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'clientes_info'
AND column_name IN ('instance_name', 'instance_id', 'apikey')
ORDER BY ordinal_position;

-- 4. Verificar se o cliente tem WhatsApp configurado
SELECT 
    c.id,
    c.email,
    c.name,
    c.instance_name,
    c.instance_id,
    c.apikey,
    CASE 
        WHEN c.instance_name IS NOT NULL AND c.instance_id IS NOT NULL THEN 'Configurado'
        WHEN c.instance_name IS NULL AND c.instance_id IS NULL THEN 'Não configurado'
        ELSE 'Parcialmente configurado'
    END as status_whatsapp
FROM clientes_info c
WHERE c.email = 'bruno.cunha+001@usesmartcrm.com'
ORDER BY c.id;

-- 5. Verificar atendentes associados
SELECT 
    a.id,
    a.email,
    a.id_cliente,
    c.instance_name,
    c.instance_id
FROM atendentes a
LEFT JOIN clientes_info c ON c.id = a.id_cliente
WHERE a.email = 'bruno.cunha+001@usesmartcrm.com';

-- 6. Se necessário, atualizar instance_name (DESCOMENTE E AJUSTE CONFORME NECESSÁRIO)
-- UPDATE clientes_info 
-- SET instance_name = 'smartcrm_bruno_cunha_001'
-- WHERE email = 'bruno.cunha+001@usesmartcrm.com' 
-- AND instance_name IS NULL;

-- 7. Verificar resultado após atualização
-- SELECT id, email, instance_name, instance_id 
-- FROM clientes_info 
-- WHERE email = 'bruno.cunha+001@usesmartcrm.com';
