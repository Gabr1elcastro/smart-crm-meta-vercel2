# 🚀 COMANDOS PARA EXECUTAR AGORA

## 1️⃣ NO SUPABASE (SQL Editor)

**Cole e execute este código:**

```sql
-- TRIGGER ANTI-DUPLICAÇÃO
CREATE OR REPLACE FUNCTION prevent_duplicate_messages()
RETURNS TRIGGER AS $$
BEGIN
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
    RETURN NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_duplicate_messages ON agente_conversacional_whatsapp;
CREATE TRIGGER trigger_prevent_duplicate_messages
  BEFORE INSERT ON agente_conversacional_whatsapp
  FOR EACH ROW EXECUTE FUNCTION prevent_duplicate_messages();

-- LIMPAR DUPLICATAS EXISTENTES
WITH duplicatas AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY telefone_id, mensagem, 
    DATE_TRUNC('minute', COALESCE(timestamp::timestamp, created_at)), tipo
    ORDER BY created_at ASC
  ) as rn FROM agente_conversacional_whatsapp
)
DELETE FROM agente_conversacional_whatsapp 
WHERE id IN (SELECT id FROM duplicatas WHERE rn > 1);

SELECT 'Trigger ativado e duplicatas removidas!' as status;
```

## 2️⃣ NO NAVEGADOR (Console F12)

**Cole e execute este código:**

```javascript
const fixAllWebhooks = async () => {
  try {
    const API_BASE_URL = "https://wsapi.dev.usesmartcrm.com";
    const API_KEY = "429683C4C977415CAAFCCE10F7D57E11";
    
    const response = await fetch(`${API_BASE_URL}/instance/fetchInstances`, {
      headers: { 'apikey': API_KEY }
    });
    
    const instances = await response.json();
    console.log("🔧 Corrigindo webhooks...");
    
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
            events: ["MESSAGES_UPSERT"],
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
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log("🎉 WEBHOOKS CORRIGIDOS!");
  } catch (error) {
    console.error("❌ Erro:", error);
  }
};

fixAllWebhooks();
```

## 3️⃣ VERIFICAR SE FUNCIONOU

**No Supabase, execute:**

```sql
-- Verificar se ainda há duplicatas
SELECT 
  telefone_id, 
  mensagem, 
  COUNT(*) as duplicatas
FROM agente_conversacional_whatsapp
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY telefone_id, mensagem
HAVING COUNT(*) > 1;
```

**Se não retornar nenhuma linha = PROBLEMA RESOLVIDO! ✅**

---

## ⚠️ ORDEM DE EXECUÇÃO:

1. **Supabase primeiro** (criar trigger)
2. **Navegador depois** (corrigir webhooks)  
3. **Verificar** (testar se funcionou)

**Pronto! Duplicação resolvida para sempre!** 🎉 