# COMANDOS PARA EXECUTAR IMPLEMENTAÇÃO CHIP-DEPARTAMENTO

## 1. Verificar Estrutura Existente

A coluna `instance_name_chip_associado` já existe na tabela `departamento`. Verifique se está funcionando:

```sql
-- Verificar se a coluna existe
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'departamento' 
AND column_name = 'instance_name_chip_associado';

-- Verificar estrutura atual da tabela departamento
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'departamento'
ORDER BY ordinal_position;
```

## 2. Verificar Implementação

Após executar o script SQL, verifique se a implementação está funcionando:

### 2.1. Verificar se a coluna foi adicionada:
```sql
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'departamento' 
AND column_name = 'instance_name_chip_associado';
```

### 2.2. Verificar chips disponíveis:
```sql
SELECT 
    id,
    name,
    instance_name,
    instance_name_2
FROM clientes_info
WHERE instance_name IS NOT NULL 
   OR instance_name_2 IS NOT NULL;
```

### 2.3. Verificar departamentos existentes:
```sql
SELECT 
    id,
    nome,
    id_cliente,
    instance_name_chip_associado
FROM departamento
ORDER BY nome;
```

## 3. Testar Funcionalidade

### 3.1. Acessar a página de Departamentos
- Vá para a seção "Departamentos" na aplicação
- Verifique se aparece a nova coluna "Chip" na tabela

### 3.2. Criar/Editar Departamento
- Clique em "Novo Departamento" ou edite um existente
- Verifique se aparece o campo "Chip associado" no modal
- Teste selecionar um chip disponível
- **Departamentos configurados em "Meus Chips"**: Devem aparecer como indisponíveis

### 3.3. Verificar Associações
- Após associar um chip, verifique se aparece na tabela
- Teste editar o departamento e verificar se a associação é mantida
- **Múltiplos departamentos**: Podem usar o mesmo chip se selecionado pelo usuário

## 4. Executar Script de Teste

Para executar o script de teste automatizado:

```bash
# No terminal, na pasta do projeto
node teste-chip-departamento.js
```

## 5. Testes de Envio de Mensagens

### 5.1. Testar envio por departamento:
- Execute `teste-envio-departamento.js` no console do navegador
- Vá para a página de Conversas
- Selecione um contato que tenha departamento
- Tente enviar uma mensagem
- Se o departamento não tiver chip configurado, deve aparecer erro específico
- Se o departamento tiver chip, a mensagem deve ser enviada normalmente

### 5.2. Testar cenários de erro:
- Tente enviar mensagem para contato com departamento sem chip
- Verifique se as mensagens de erro são específicas e úteis

### 5.3. Testar leads sem departamento:
- Execute `teste-leads-sem-departamento.js` no console do navegador
- Selecione um contato que NÃO tenha departamento
- Tente enviar uma mensagem
- Se chip 1 estiver configurado, deve enviar normalmente
- Se chip 1 não estiver configurado, deve aparecer: "Chip 1 não configurado para este cliente"

## 6. Próximos Passos

Após confirmar que a implementação está funcionando:

1. **✅ Integrar com sistema de mensagens**: Implementado no `messageService.ts`
2. **Configurar chips**: Implementar interface de configuração de chips
3. **✅ Testes de envio**: Verificar se mensagens usam o chip correto

## 7. Troubleshooting

### Problema: Coluna não foi adicionada
```sql
-- Verificar se a tabela existe
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'departamento';

-- Tentar adicionar novamente
ALTER TABLE public.departamento 
ADD COLUMN instance_name_chip_associado TEXT;
```

### Problema: Chips não aparecem no select
```sql
-- Verificar se existem instâncias configuradas
SELECT id, name, instance_name, instance_name_2 
FROM clientes_info 
WHERE instance_name IS NOT NULL OR instance_name_2 IS NOT NULL;
```

### Problema: Erro ao salvar associação
```sql
-- Verificar permissões da tabela
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'departamento';
```

## 8. Rollback (se necessário)

Se precisar reverter as mudanças:

```sql
-- Remover índice
DROP INDEX IF EXISTS idx_departamento_instance_name_chip;

-- Remover coluna
ALTER TABLE public.departamento 
DROP COLUMN IF EXISTS instance_name_chip_associado;
``` 