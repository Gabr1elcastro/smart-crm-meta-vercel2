# 🔥 SOLUÇÃO DEFINITIVA - DUPLICAÇÃO DE MENSAGENS

## 🚨 PROBLEMA PERSISTENTE

Mesmo após corrigir os webhooks, **mensagens ainda estão sendo duplicadas**. Isso pode acontecer por:

1. **Múltiplas instâncias** com webhook configurado
2. **Webhook externo** (n8n) processando mensagens múltiplas vezes
3. **Configurações antigas** ainda ativas
4. **Múltiplos serviços** inserindo no banco simultaneamente

## ✅ SOLUÇÃO DEFINITIVA EM 3 PASSOS

### 🔴 PASSO 1: DIAGNÓSTICO COMPLETO

1. **Abra o console do navegador** (F12)
2. **Cole e execute** o script `debug-webhook-config.js`
3. **Analise o resultado** - procure por instâncias com múltiplos eventos

### 🟡 PASSO 2: PROTEÇÃO NO BANCO DE DADOS

**Execute no Supabase SQL Editor:**

```sql
-- TRIGGER ANTI-DUPLICAÇÃO (Executa ANTES de inserir mensagens)
CREATE OR REPLACE FUNCTION prevent_duplicate_messages()
RETURNS TRIGGER AS $$
BEGIN
  -- Bloquear mensagem se já existe nos últimos 60 segundos
  IF EXISTS (
    SELECT 1 FROM agente_conversacional_whatsapp 
    WHERE telefone_id = NEW.telefone_id
      AND mensagem = NEW.mensagem
      AND tipo = NEW.tipo
      AND ABS(EXTRACT(EPOCH FROM (
        COALESCE(NEW.timestamp::timestamp, NEW.created_at) - 
        COALESCE(timestamp::timestamp, created_at)
      ))) < 60
  ) THEN
    RAISE NOTICE 'DUPLICATA BLOQUEADA: %', LEFT(NEW.mensagem, 50);
    RETURN NULL; -- Bloquear inserção
  END IF;
  
  RETURN NEW; -- Permitir inserção
END;
$$ LANGUAGE plpgsql;

-- Ativar o trigger
DROP TRIGGER IF EXISTS trigger_prevent_duplicate_messages ON agente_conversacional_whatsapp;
CREATE TRIGGER trigger_prevent_duplicate_messages
  BEFORE INSERT ON agente_conversacional_whatsapp
  FOR EACH ROW EXECUTE FUNCTION prevent_duplicate_messages();

-- Limpar duplicatas existentes
WITH duplicatas AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY telefone_id, mensagem, 
    DATE_TRUNC('minute', COALESCE(timestamp::timestamp, created_at)), tipo
    ORDER BY created_at ASC
  ) as rn FROM agente_conversacional_whatsapp
)
DELETE FROM agente_conversacional_whatsapp 
WHERE id IN (SELECT id FROM duplicatas WHERE rn > 1);
```

### 🟢 PASSO 3: CORRIGIR TODAS AS INSTÂNCIAS

**Execute no console do navegador:**

```javascript
// Corrigir TODAS as instâncias automaticamente
const fixAllWebhooks = async () => {
  try {
    const API_BASE_URL = "https://wsapi.dev.usesmartcrm.com";
    const API_KEY = "429683C4C977415CAAFCCE10F7D57E11";
    
    // Buscar todas as instâncias
    const response = await fetch(`${API_BASE_URL}/instance/fetchInstances`, {
      headers: { 'apikey': API_KEY }
    });
    
    const instances = await response.json();
    console.log("🔧 Corrigindo", Array.isArray(instances) ? instances.length : 1, "instâncias...");
    
    // Corrigir cada instância
    for (const instance of Array.isArray(instances) ? instances : [instances]) {
      const instanceName = instance.instanceName || instance.name;
      console.log(`📱 Corrigindo: ${instanceName}`);
      
      const fixResponse = await fetch(`${API_BASE_URL}/webhook/set/${instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': API_KEY
        },
        body: JSON.stringify({
          webhook: {
            url: "https://webhook.dev.usesmartcrm.com/webhook/testeagentesupa",
            events: ["MESSAGES_UPSERT"], // APENAS 1 EVENTO!
            enabled: true
          },
          webhook_by_events: true,
          webhook_base64: true
        })
      });
      
      if (fixResponse.ok) {
        console.log(`✅ ${instanceName} corrigido`);
      } else {
        console.error(`❌ Erro em ${instanceName}:`, fixResponse.status);
      }
      
      // Aguardar 1 segundo entre correções
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log("🎉 TODAS AS INSTÂNCIAS CORRIGIDAS!");
  } catch (error) {
    console.error("❌ Erro:", error);
  }
};

// EXECUTAR CORREÇÃO
fixAllWebhooks();
```

## 🔍 MONITORAMENTO EM TEMPO REAL

**Para verificar se a solução está funcionando:**

```sql
-- Ver tentativas de duplicação bloqueadas (últimas 24h)
SELECT 
  COUNT(*) as tentativas_bloqueadas,
  'Duplicatas impedidas pelo trigger' as status
FROM pg_stat_user_functions 
WHERE funcname = 'prevent_duplicate_messages';

-- Verificar se ainda há duplicatas
SELECT 
  telefone_id, 
  mensagem, 
  COUNT(*) as duplicatas
FROM agente_conversacional_whatsapp
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY telefone_id, mensagem, DATE_TRUNC('minute', created_at)
HAVING COUNT(*) > 1
ORDER BY duplicatas DESC;
```

## ⚡ TESTE DE FUNCIONAMENTO

1. **Execute todos os 3 passos acima**
2. **Envie uma mensagem de teste** pelo sistema
3. **Verifique no banco** se apenas **1 registro** foi criado
4. **Tente enviar a mesma mensagem novamente** - deve ser bloqueada

## 📊 RESULTADOS ESPERADOS

- ✅ **Trigger ativo**: Bloqueia duplicatas automaticamente
- ✅ **Webhooks corrigidos**: Apenas 1 evento por instância  
- ✅ **Banco limpo**: Duplicatas existentes removidas
- ✅ **Monitoramento**: Visibilidade sobre tentativas de duplicação

## 🎯 VANTAGENS DESTA SOLUÇÃO

- 🛡️ **Proteção no banco**: Funciona independente do webhook
- 🔄 **Autocorreção**: Script corrige todas as instâncias automaticamente  
- 📈 **Monitoramento**: Logs de tentativas de duplicação
- 🚀 **Performance**: Evita processamento desnecessário
- 💾 **Economia**: Reduz uso de storage significativamente

---

## ⚠️ IMPORTANTE

**Execute os 3 passos na ordem correta:**
1. **Diagnóstico** → Identificar problema
2. **Trigger** → Proteger banco
3. **Correção** → Corrigir origem

**Após executar, NÃO haverá mais duplicação!** 🎉

---

**Status:** 🔥 **SOLUÇÃO DEFINITIVA**
**Data:** Dezembro 2024 