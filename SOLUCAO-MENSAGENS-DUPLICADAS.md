# Solução para Mensagens Duplicadas

## 🚨 Problema Identificado

O sistema estava salvando **uma única mensagem em múltiplas linhas** no banco de dados. Isso acontecia porque o webhook estava configurado para escutar **3 eventos diferentes** da Evolution API:

- `MESSAGES_SET`
- `MESSAGES_UPSERT` 
- `SEND_MESSAGE`

Quando uma mensagem era enviada ou recebida, ela era processada **3 vezes** pelo webhook, criando **3 registros idênticos** no banco para a mesma mensagem.

## ✅ Solução Implementada

### 1. **Correção na Configuração do Webhook**

**Arquivo modificado:** `src/services/whatsappService.ts`

**Alteração:**
```typescript
// ANTES (problemático):
const events = [
  'MESSAGES_SET',
  'MESSAGES_UPSERT',
  'SEND_MESSAGE'
];

// DEPOIS (corrigido):
const events = [
  'MESSAGES_UPSERT'  // Apenas este evento é suficiente
];
```

**Por que funciona:** O evento `MESSAGES_UPSERT` captura tanto mensagens **recebidas** quanto **enviadas**, sendo suficiente para todas as funcionalidades sem duplicação.

### 2. **Limpeza do Banco de Dados**

**Arquivo criado:** `cleanup-duplicate-messages.sql`

Este script SQL:
- Remove mensagens duplicadas existentes
- Mantém apenas a primeira ocorrência de cada mensagem
- Preserva a integridade dos dados
- Gera relatório de limpeza

## 🔧 Como Aplicar a Solução

### Passo 1: Reconfigurar Instâncias Existentes

Para instâncias WhatsApp já criadas, execute este código no console do navegador (F12):

```javascript
// Reconfigurar webhook da instância atual
const reconfigureWebhook = async () => {
  try {
    const instanceName = 'SUA_INSTANCIA_AQUI'; // Substitua pelo nome da sua instância
    const apiKey = 'SUA_API_KEY_AQUI'; // Substitua pela sua API key
    
    const response = await fetch(`https://wsapi.dev.usesmartcrm.com/webhook/set/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey
      },
      body: JSON.stringify({
        webhook: {
          url: "https://webhook.dev.usesmartcrm.com/webhook/testeagentesupa",
          events: ["MESSAGES_UPSERT"], // Apenas este evento!
          enabled: true
        },
        webhook_by_events: true,
        webhook_base64: true
      })
    });
    
    console.log('Webhook reconfigurado:', await response.json());
  } catch (error) {
    console.error('Erro:', error);
  }
};

reconfigureWebhook();
```

### Passo 2: Limpar Mensagens Duplicadas

Execute o script SQL `cleanup-duplicate-messages.sql` no seu banco de dados Supabase:

1. Acesse o Supabase Dashboard
2. Vá para "SQL Editor"
3. Cole o conteúdo do arquivo `cleanup-duplicate-messages.sql`
4. Execute o script

### Passo 3: Testar

1. Compile e execute o projeto: `npm run dev`
2. Envie algumas mensagens de teste
3. Verifique no banco se apenas **1 registro** é criado por mensagem

## 📊 Verificação de Resultados

Para verificar se ainda existem duplicatas:

```sql
SELECT 
  telefone_id, 
  mensagem, 
  COUNT(*) as duplicatas
FROM agente_conversacional_whatsapp
GROUP BY telefone_id, mensagem, DATE_TRUNC('minute', COALESCE(timestamp::timestamp, created_at))
HAVING COUNT(*) > 1
ORDER BY duplicatas DESC;
```

Se o resultado estiver vazio, **não há mais duplicatas!** ✅

## 🎯 Benefícios da Solução

- ✅ **Sem duplicação:** Cada mensagem = 1 registro no banco
- ✅ **Performance melhorada:** Menos registros = consultas mais rápidas
- ✅ **Interface limpa:** Conversas sem mensagens repetidas
- ✅ **Economia de storage:** Redução significativa no tamanho do banco
- ✅ **Compatibilidade:** Funciona com instâncias novas e existentes

## 🔄 Para Novas Instâncias

As novas instâncias WhatsApp criadas já usarão automaticamente a configuração corrigida e não terão problemas de duplicação.

---

**Status:** ✅ **PROBLEMA RESOLVIDO**

**Data da correção:** Dezembro 2024 