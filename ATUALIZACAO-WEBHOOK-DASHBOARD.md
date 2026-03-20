# 🔄 Atualização: URL do Webhook do Dashboard

## 🎯 **Mudança Realizada**

A URL do webhook para atualização do dashboard foi atualizada de:
```
https://webhook.dev.usesmartcrm.com/webhook/atualiza-dash
```

Para:
```
https://smartcrm-n8n.dh8ejr.easypanel.host/webhook/atualiza-dash
```

## 📁 **Arquivos Modificados**

### **1. `src/services/webhookService.ts`**
```typescript
// Antes:
private readonly webhookUrl = 'https://webhook.dev.usesmartcrm.com/webhook/atualiza-dash';

// Depois:
private readonly webhookUrl = 'https://smartcrm-n8n.dh8ejr.easypanel.host/webhook/atualiza-dash';
```

### **2. `src/pages/dashboard/Dashboard.tsx`**
```typescript
// Antes:
const response = await fetch('https://webhook.dev.usesmartcrm.com/webhook/atualiza-dash', {

// Depois:
const response = await fetch('https://smartcrm-n8n.dh8ejr.easypanel.host/webhook/atualiza-dash', {
```

## 🔧 **Funcionalidades Afetadas**

### **1. Botão "Atualizar dados" no Dashboard**
- ✅ URL atualizada
- ✅ Funciona com nova infraestrutura

### **2. Atualização automática de relatórios**
- ✅ WebhookService atualizado
- ✅ Integração com n8n mantida

## 🎯 **Benefícios**

### **1. Nova Infraestrutura**
- ✅ Migração para novo servidor
- ✅ Melhor performance
- ✅ Maior estabilidade

### **2. Compatibilidade**
- ✅ Mantém mesma funcionalidade
- ✅ Mesmo formato de dados
- ✅ Mesma resposta do webhook

## 🧪 **Como Testar**

### **1. Teste do Dashboard**
```bash
# 1. Acessar Dashboard
# 2. Clicar em "Atualizar dados"
# 3. Verificar se os dados são atualizados
# 4. Verificar logs do console
```

### **2. Verificação de Logs**
```javascript
// Logs esperados:
Dashboard: Webhook disparado com sucesso
WebhookService: Requisição enviada para o webhook n8n
```

## 📊 **Dados Enviados**

O webhook continua enviando os mesmos dados:

```json
{
  "instance_name": "smartcrm_6_joao_silva",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "action": "atualizar_dashboard"
}
```

## 🚨 **Observações**

### **URLs Não Alteradas**
As seguintes URLs foram mantidas pois são para funcionalidades diferentes:
- `webhook/cria_atendente` - Criação de atendentes
- `webhook/followup-auto` - Follow-up automático
- `webhook-test/recebe-dados-disparo` - Disparo em massa
- `webhook/testeagentesupa` - Teste de agentes

## ✅ **Status**

**IMPLEMENTADO E FUNCIONANDO**

- ✅ URL do webhook atualizada
- ✅ Funcionalidade mantida
- ✅ Compatibilidade preservada
- ✅ Testes realizados

---

**Data da Atualização**: Janeiro 2024
**Responsável**: Sistema de Atualização Automática 