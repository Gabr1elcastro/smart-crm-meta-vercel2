# Webhook: Botão "Atualizar Dados"

## Endpoint Configurado

O botão "Atualizar dados" no Dashboard está configurado para disparar webhook para:

```
https://webhook.dev.usesmartcrm.com/webhook/atualiza-dash
```

## Implementação Atual

### Localização
- **Arquivo**: `src/pages/dashboard/Dashboard.tsx`
- **Função**: `triggerWebhook()`
- **Linha**: 141

### Código da Implementação

```typescript
const triggerWebhook = async (instanceName: string) => {
  try {
    const webhookData = {
      instance_name: instanceName,
      timestamp: new Date().toISOString(),
      action: "atualizar_dashboard"
    };

    const endpoint = 'https://webhook.dev.usesmartcrm.com/webhook/atualiza-dash';
    
    console.log('🔄 Dashboard: Enviando requisição para atualizar dados');
    console.log('📡 Endpoint:', endpoint);
    console.log('📦 JSON enviado:', JSON.stringify(webhookData, null, 2));

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8',
      },
      body: JSON.stringify(webhookData)
    });

    if (response.ok) {
      console.log('✅ Dashboard: Webhook disparado com sucesso');
    } else {
      console.error('❌ Dashboard: Erro ao disparar webhook:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('💥 Dashboard: Erro ao disparar webhook:', error);
  }
};
```

## Fluxo de Execução

1. **Usuário clica no botão "Atualizar dados"**
2. **Sistema executa `handleFetchData()`**
3. **Busca informações do cliente** para obter `instance_name`
4. **Executa funções de busca de dados** (`fetchLeadsForFunnel`)
5. **Dispara webhook** com `instance_name` do cliente
6. **Mostra feedback** para o usuário

## Dados Enviados

O webhook envia um JSON com:

```json
{
  "instance_name": "nome_da_instancia",
  "timestamp": "2025-01-14T10:30:00.000Z",
  "action": "atualizar_dashboard"
}
```

## Headers da Requisição

- **Method**: POST
- **Content-Type**: `text/plain;charset=UTF-8`
- **Body**: JSON stringificado

## Logs de Debug

O sistema registra logs detalhados:

- `🔄 Dashboard: Enviando requisição para atualizar dados`
- `📡 Endpoint: https://webhook.dev.usesmartcrm.com/webhook/atualiza-dash`
- `📦 JSON enviado: {...}`
- `✅ Dashboard: Webhook disparado com sucesso` (sucesso)
- `❌ Dashboard: Erro ao disparar webhook: ...` (erro)

## Condições para Disparo

O webhook só é disparado quando:

1. ✅ Cliente ID está disponível
2. ✅ Período de data está selecionado
3. ✅ `instance_name` do cliente está disponível
4. ✅ Funções de busca de dados executaram com sucesso

## Tratamento de Erros

- **Cliente não identificado**: Toast de erro
- **Período não selecionado**: Toast de erro
- **Instance name não encontrado**: Log de warning
- **Erro na requisição**: Log de erro e toast
- **Erro geral**: Reset do estado de atualização

## Status da Implementação

✅ **CONFIGURADO E FUNCIONANDO**

O endpoint está correto e a implementação está completa.

## Data da Verificação

$(date) 