-- Script para inserir chatbots de teste
-- Execute este script no SQL Editor do Supabase

-- Verificar se há chatbots para o cliente
SELECT id, nome, id_usuario, id_cliente, em_uso 
FROM prompts_oficial 
WHERE id_cliente = '13';

-- Inserir chatbots de teste para o cliente ID 13
INSERT INTO prompts_oficial (
  nome, 
  id_usuario, 
  id_cliente, 
  em_uso, 
  status, 
  instance_id,
  prompt,
  created_at
) VALUES 
(
  'Chatbot Teste 1',
  '11fcd12c-8c54-4f8a-b9f2-19f8633f479b', -- user_id_auth do cliente
  '13', -- id_cliente
  true,
  true,
  '1e010913-bc1b-489e-a034-d11dc208789d', -- instance_id do cliente
  'Olá! Sou o chatbot de teste. Como posso ajudar você?',
  NOW()
),
(
  'Chatbot Teste 2',
  '11fcd12c-8c54-4f8a-b9f2-19f8633f479b',
  '13',
  false,
  true,
  '1e010913-bc1b-489e-a034-d11dc208789d',
  'Olá! Sou o segundo chatbot de teste. Como posso ajudar você?',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Verificar se os chatbots foram inseridos
SELECT id, nome, id_usuario, id_cliente, em_uso 
FROM prompts_oficial 
WHERE id_cliente = '13'
ORDER BY created_at DESC;

-- Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'prompts_oficial'
ORDER BY ordinal_position; 