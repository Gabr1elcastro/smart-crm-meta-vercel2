# Normalização de Webhook Paths

## 📋 Resumo

Este documento explica onde o `path` do webhook está armazenado e como normalizá-lo para garantir consistência.

## 🔍 Estrutura do Banco de Dados

### Onde o `webhookPath` está salvo?

O `webhookPath` está armazenado em **dois lugares**:

1. **No campo `nodes`** (array JSON):
   ```json
   {
     "nodes": [
       {
         "id": "inicio-1",
         "type": "inicio",
         "data": {
           "triggerType": "webhook_external",
           "webhookPath": "/gabriel-tester_789c451e"  // ← AQUI
         }
       }
     ]
   }
   ```

2. **No campo `trigger_config`** (JSON):
   ```json
   {
     "trigger_config": {
       "triggerType": "webhook_external",
       "webhookPath": "/gabriel-tester_789c451e",  // ← AQUI (cópia do nodes[].data)
       "label": "Início"
     }
   }
   ```

### Estrutura Real do `trigger_config`

O campo `trigger_config` contém o objeto completo `data` do nó de início:

```json
{
  "label": "Início",
  "triggerType": "webhook_external",
  "webhookPath": "/gabriel-tester_789c451e",
  "keyword": null,
  "config": {}
}
```

**Chave exata:** `trigger_config.webhookPath` ou `trigger_config->>'webhookPath'` (PostgreSQL)

**Formato atual:** O path pode vir **com ou sem `/` no início**, dependendo de quando foi criado.

**Pode ser `null`?** Sim, se o workflow não for do tipo `webhook_external`.

## 🔧 Como Investigar a Estrutura Real

Execute esta query SQL no Supabase SQL Editor:

```sql
-- Ver exemplos de trigger_config e paths
SELECT 
  id,
  nome,
  trigger_config,
  trigger_config->>'webhookPath' as path_from_trigger_config,
  trigger_config->>'triggerType' as trigger_type,
  -- Extrair path do nodes também
  (
    SELECT node->'data'->>'webhookPath'
    FROM jsonb_array_elements(nodes::jsonb) as node
    WHERE (node->>'type' = 'inicio' OR node->>'type' = 'trigger')
      AND (node->'data'->>'triggerType' = 'webhook_external')
    LIMIT 1
  ) as path_from_nodes
FROM workflows
WHERE is_active = true
LIMIT 10;
```

## ✅ Normalização Implementada

### 1. Na Edge Function (Código)

A normalização já foi implementada no código:

- **Função auxiliar:** `normalizeWebhookPath()` remove barras iniciais e espaços
- **Path recebido:** Normalizado logo após obter da URL/body
- **Path do banco:** Normalizado antes da comparação

```typescript
// Normaliza o path recebido
webhookPath = normalizeWebhookPath(webhookPath);

// Normaliza o path do banco antes de comparar
const storedPath = normalizeWebhookPath(startNode?.data?.webhookPath);
return storedPath === webhookPath;
```

### 2. No Banco de Dados (SQL)

Para normalizar os paths **já existentes** no banco, execute o script SQL:

**Arquivo:** `supabase/migrations/investigate_and_normalize_webhook_paths.sql`

Este script:
1. ✅ Cria função auxiliar `normalize_webhook_path()`
2. ✅ Atualiza `trigger_config.webhookPath`
3. ✅ Atualiza `nodes[].data.webhookPath`
4. ✅ Verifica se a normalização funcionou

## 📝 Como Executar a Normalização no Banco

### Opção 1: Executar o Script Completo

1. Abra o Supabase Dashboard
2. Vá em **SQL Editor**
3. Copie e cole o conteúdo de `supabase/migrations/investigate_and_normalize_webhook_paths.sql`
4. Execute o script

### Opção 2: Executar Queries Individuais

#### Passo 1: Criar função auxiliar

```sql
CREATE OR REPLACE FUNCTION normalize_webhook_path(path_text TEXT)
RETURNS TEXT AS $$
BEGIN
  IF path_text IS NULL THEN
    RETURN NULL;
  END IF;
  -- Remove barras no início e espaços
  RETURN regexp_replace(trim(path_text), '^/+', '');
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

#### Passo 2: Normalizar `trigger_config.webhookPath`

```sql
UPDATE workflows
SET trigger_config = jsonb_set(
  trigger_config,
  '{webhookPath}',
  to_jsonb(normalize_webhook_path(trigger_config->>'webhookPath'))
)
WHERE trigger_config IS NOT NULL
  AND trigger_config->>'webhookPath' IS NOT NULL
  AND trigger_config->>'webhookPath' != normalize_webhook_path(trigger_config->>'webhookPath');
```

#### Passo 3: Normalizar `nodes[].data.webhookPath`

```sql
UPDATE workflows w
SET nodes = (
  SELECT jsonb_agg(
    CASE 
      WHEN (node->>'type' = 'inicio' OR node->>'type' = 'trigger')
        AND (node->'data'->>'triggerType' = 'webhook_external')
        AND node->'data'->>'webhookPath' IS NOT NULL
      THEN jsonb_set(
        node,
        '{data,webhookPath}',
        to_jsonb(normalize_webhook_path(node->'data'->>'webhookPath'))
      )
      ELSE node
    END
  )
  FROM jsonb_array_elements(w.nodes::jsonb) as node
)::text
WHERE w.nodes IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(w.nodes::jsonb) as node
    WHERE (node->>'type' = 'inicio' OR node->>'type' = 'trigger')
      AND (node->'data'->>'triggerType' = 'webhook_external')
      AND node->'data'->>'webhookPath' IS NOT NULL
      AND node->'data'->>'webhookPath' != normalize_webhook_path(node->'data'->>'webhookPath')
  );
```

#### Passo 4: Verificar resultado

```sql
SELECT 
  id,
  nome,
  trigger_config->>'webhookPath' as normalized_trigger_config_path,
  (
    SELECT node->'data'->>'webhookPath'
    FROM jsonb_array_elements(nodes::jsonb) as node
    WHERE (node->>'type' = 'inicio' OR node->>'type' = 'trigger')
      AND (node->'data'->>'triggerType' = 'webhook_external')
    LIMIT 1
  ) as normalized_nodes_path
FROM workflows
WHERE is_active = true
  AND (
    trigger_config->>'triggerType' = 'webhook_external'
    OR EXISTS (
      SELECT 1
      FROM jsonb_array_elements(nodes::jsonb) as node
      WHERE (node->>'type' = 'inicio' OR node->>'type' = 'trigger')
        AND (node->'data'->>'triggerType' = 'webhook_external')
    )
  )
LIMIT 20;
```

## 🎯 Resultado Esperado

Após a normalização:

- ✅ `/gabriel-tester_789c451e` → `gabriel-tester_789c451e`
- ✅ `gabriel-tester_789c451e` → `gabriel-tester_789c451e`
- ✅ ` /gabriel-tester_789c451e ` → `gabriel-tester_789c451e`

## ⚠️ Importante

1. **Backup:** Faça backup do banco antes de executar as queries de UPDATE
2. **Teste:** Execute primeiro em um ambiente de desenvolvimento
3. **Verificação:** Use as queries de verificação para confirmar que funcionou
4. **Consistência:** O código da Edge Function já normaliza ambos os lados na comparação, então mesmo sem normalizar o banco, deve funcionar. Mas é recomendado normalizar para consistência.

## 📚 Referências

- Edge Function: `supabase/functions/workflow-webhook-trigger/index.ts`
- Script SQL: `supabase/migrations/investigate_and_normalize_webhook_paths.sql`
- Código de salvamento: `src/pages/workflows/index.tsx` (linha 76)
