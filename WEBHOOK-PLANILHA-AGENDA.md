# Webhook da Planilha de Agenda

## Visão Geral

Quando um usuário conecta o Google Agenda, além de salvar o ID da agenda no banco de dados, o sistema dispara automaticamente um webhook para o endpoint `https://webhook.dev.usesmartcrm.com/webhook/planilha-agenda` com todas as informações relevantes do cliente.

## Funcionalidade

### 1. **Trigger Automático**
- **Quando**: Ao clicar em "Salvar" na conexão do Google Agenda
- **Onde**: Modal de configuração do Google Agenda
- **Condição**: Após sucesso no salvamento no banco de dados

### 2. **Dados Enviados**
O webhook envia um payload JSON com as seguintes informações:

```json
{
  "cliente_id": 123,
  "user_id_auth": "uuid-do-usuario",
  "nome": "Nome do Cliente",
  "email": "cliente@email.com",
  "id_agenda": "agenda-id-google",
  "plano_starter": false,
  "plano_pro": false,
  "plano_plus": true,
  "plano_agentes": false,
  "trial": false,
  "data_conexao": "2024-01-15T10:30:00.000Z",
  "tipo_conexao": "google_agenda"
}
```

### 3. **Campos do Payload**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `cliente_id` | number | ID único do cliente no sistema |
| `user_id_auth` | string | ID de autenticação do usuário |
| `nome` | string | Nome completo do cliente |
| `email` | string | Email do cliente |
| `id_agenda` | string | ID da agenda do Google fornecida |
| `plano_starter` | boolean | Se possui plano Starter |
| `plano_pro` | boolean | Se possui plano Pro |
| `plano_plus` | boolean | Se possui plano Plus |
| `plano_agentes` | boolean | Se possui plano Agentes |
| `trial` | boolean | Se está em período de teste |
| `data_conexao` | string | Data/hora da conexão (ISO 8601) |
| `tipo_conexao` | string | Tipo de conexão (sempre "google_agenda") |

## Implementação Técnica

### 1. **Serviço de Clientes**
```typescript
// src/services/clientesService.ts
async dispararWebhookAgenda(userId: string, idAgenda: string): Promise<boolean>
```

### 2. **Página de Conexões**
```typescript
// src/pages/channels/Conexoes.tsx
const webhookSuccess = await clientesService.dispararWebhookAgenda(user.id, googleAgendaId.trim());
```

### 3. **Endpoint do Webhook**
```
POST https://webhook.dev.usesmartcrm.com/webhook/planilha-agenda
```

## Fluxo de Execução

1. **Usuário insere ID da agenda** no modal
2. **Sistema salva no banco** (`setIdAgenda`)
3. **Se sucesso, dispara webhook** (`dispararWebhookAgenda`)
4. **Atualiza interface** para mostrar status "Conectado"
5. **Fecha modal** e limpa campos

## Tratamento de Erros

### 1. **Webhook Falha**
- **Ação**: Log de warning no console
- **Impacto**: Conexão é salva, mas webhook falha
- **Status**: Usuário vê "Conectado" mesmo com falha no webhook

### 2. **Cliente Não Encontrado**
- **Ação**: Log de erro no console
- **Impacto**: Webhook não é disparado
- **Status**: Conexão falha completamente

### 3. **Erro de Rede**
- **Ação**: Log de erro no console
- **Impacto**: Webhook falha por timeout/conexão
- **Status**: Conexão é salva, webhook falha

## Logs e Monitoramento

### 1. **Console do Navegador**
```
✅ Google Agenda conectado e webhook disparado com sucesso
⚠️ Google Agenda conectado, mas webhook falhou
❌ Erro ao disparar webhook da agenda: [erro]
```

### 2. **Verificação de Funcionamento**
- Console mostra sucesso/falha do webhook
- Dados chegam no endpoint especificado
- Planilha é atualizada com informações do cliente

## Casos de Uso

### 1. **Integração com Planilhas**
- Atualização automática de planilhas do Google
- Relatórios de clientes conectados
- Análise de conversão por plano

### 2. **Sistemas Externos**
- CRMs externos
- Ferramentas de marketing
- Análise de dados

### 3. **Auditoria e Compliance**
- Rastreamento de conexões
- Histórico de integrações
- Relatórios de uso

## Configuração e Manutenção

### 1. **Endpoint Configurável**
- Atualmente hardcoded no serviço
- Pode ser movido para variáveis de ambiente
- Fácil alteração para diferentes ambientes

### 2. **Retry e Fallback**
- Não implementado atualmente
- Pode ser adicionado para maior robustez
- Considerar fila de webhooks falhados

### 3. **Monitoramento**
- Logs no console do navegador
- Pode ser integrado com sistema de logs
- Alertas para falhas recorrentes

## Próximas Melhorias

1. **Configuração por Ambiente**
2. **Sistema de Retry**
3. **Fila de Webhooks**
4. **Métricas de Performance**
5. **Alertas Automáticos**
6. **Dashboard de Monitoramento**
