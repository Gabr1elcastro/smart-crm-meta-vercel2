# Integração Backend - Teste de Chatbot

## Visão Geral

A funcionalidade de teste de chatbot agora está completamente integrada com o backend, seguindo o fluxo especificado:

1. **Seleção de Chatbot** → Lista chatbots do usuário (prompts_oficial)
2. **Iniciar Simulação** → Gera id_conversa único para o par (id_cliente, id_prompt_oficial)
3. **Enviar Mensagem** → Salva na tabela simulacoes_chatbot
4. **Webhook** → Envia JSON para processar IA
5. **Resposta** → Recebe e exibe no chat

## Estrutura da Tabela

```sql
create table public.simulacoes_chatbot (
  id_conversa text not null,
  id_cliente text not null,
  id_prompt_oficial text not null,
  data_mensagem date not null,
  hora_mensagem time not null,
  mensagem text not null,
  from_me boolean not null
);
```

## Componentes Criados

### 1. ChatbotSimulationService.ts
Serviço principal para gerenciar simulações:

#### Métodos Principais:
- `getChatbotsByUser(userId)` - Busca chatbots do usuário
- `startSimulation(idCliente, idPromptOficial)` - Inicia simulação e gera id_conversa
- `saveMessage(simulation)` - Salva mensagem na tabela
- `sendMessageToWebhook(idCliente, idConversa, message)` - Envia para webhook
- `getConversationHistory(idCliente, idPromptOficial)` - Busca histórico

#### Geração de ID de Conversa:
```typescript
private static generateConversationId(idCliente: bigint, idPromptOficial: string): bigint {
  const combined = `${idCliente}_${idPromptOficial}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return BigInt(Math.abs(hash));
}
```

### 2. useChatbotSimulation.ts
Hook personalizado para gerenciar estado da simulação:

#### Estados Gerenciados:
- `messages` - Mensagens da conversa
- `selectedChatbot` - Chatbot selecionado
- `simulationStarted` - Se a simulação foi iniciada
- `currentConversationId` - ID da conversa atual
- `clientId` - ID do cliente

#### Funções Principais:
- `startSimulation()` - Inicia simulação
- `sendMessage(message)` - Envia mensagem
- `selectChatbot(chatbot)` - Seleciona chatbot
- `resetSimulation()` - Reseta simulação

### 3. ChatbotTester.tsx (Atualizado)
Componente principal com integração completa:

#### Fluxo de Uso:
1. **Seleção** - Usuário seleciona chatbot da lista
2. **Início** - Clica em "Iniciar Simulação"
3. **Chat** - Interface de chat com histórico
4. **Envio** - Mensagens são salvas e enviadas para webhook
5. **Resposta** - Resposta do IA é exibida

## Fluxo de Dados

### 1. Início de Simulação
```typescript
// 1. Gera ID de conversa único
const conversationId = await ChatbotSimulationService.startSimulation(
  clientId,
  selectedChatbot.id
);

// 2. Carrega histórico se existir
const history = await ChatbotSimulationService.getConversationHistory(
  clientId,
  selectedChatbot.id
);
```

### 2. Envio de Mensagem
```typescript
// 1. Salva mensagem do usuário
await ChatbotSimulationService.saveMessage({
  id_cliente: clientId,
  id_prompt_oficial: selectedChatbot.id,
  data_mensagem: now.toISOString().split('T')[0],
  hora_mensagem: now.toTimeString().split(' ')[0],
  mensagem: messageText,
  fromMe: true,
});

// 2. Envia para webhook
const botResponse = await ChatbotSimulationService.sendMessageToWebhook(
  clientId,
  currentConversationId,
  messageText
);

// 3. Salva resposta do bot
await ChatbotSimulationService.saveMessage({
  id_cliente: clientId,
  id_prompt_oficial: selectedChatbot.id,
  data_mensagem: now.toISOString().split('T')[0],
  hora_mensagem: now.toTimeString().split(' ')[0],
  mensagem: botResponse,
  fromMe: false,
});
```

### 3. Webhook
```typescript
// JSON enviado para webhook
{
  "id_cliente": 123,
  "id_conversa": 456789,
  "mensagem": "Olá, como posso ajudar?"
}
```

## Endpoint do Webhook

**URL:** `https://webhook.dev.usesmartcrm.com/webhook-test/teste_chatbot`

**Método:** POST

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "id_cliente": 123,
  "id_conversa": 456789,
  "mensagem": "Mensagem do usuário"
}
```

**Resposta Esperada:**
```json
{
  "resposta": "Resposta do chatbot",
  "status": "success"
}
```

## Funcionalidades Implementadas

### ✅ Backend Integration
- [x] Busca chatbots do usuário (prompts_oficial)
- [x] Geração de ID de conversa único
- [x] Salvamento de mensagens na tabela
- [x] Comunicação com webhook
- [x] Carregamento de histórico
- [x] Tratamento de erros

### ✅ Frontend Features
- [x] Seleção de chatbot
- [x] Botão "Iniciar Simulação"
- [x] Interface de chat com histórico
- [x] Envio de mensagens
- [x] Recebimento de respostas
- [x] Estados de carregamento
- [x] Tratamento de erros

### ✅ UX/UI
- [x] Tela de seleção de chatbot
- [x] Tela de início de simulação
- [x] Interface de chat responsiva
- [x] Indicadores de carregamento
- [x] Mensagens de erro/sucesso
- [x] Auto-scroll para última mensagem

## Como Testar

1. **Acesse** a página de Chatbots (`/chatbots`)
2. **Clique** no botão flutuante
3. **Selecione** um chatbot da lista
4. **Clique** em "Iniciar Simulação"
5. **Digite** uma mensagem e veja a resposta
6. **Verifique** se as mensagens estão sendo salvas na tabela

## Próximos Passos

### Backend
1. Implementar processamento de IA no webhook
2. Adicionar autenticação no webhook
3. Implementar rate limiting
4. Adicionar logs de debug
5. Implementar retry em caso de falha

### Frontend
1. Adicionar suporte a diferentes tipos de mídia
2. Implementar métricas de teste
3. Adicionar exportação de conversas
4. Implementar busca no histórico
5. Adicionar configurações de teste

## Considerações Técnicas

### Performance
- ID de conversa gerado deterministicamente
- Histórico carregado apenas quando necessário
- Mensagens salvas em batch quando possível

### Segurança
- Validação de dados antes de salvar
- Verificação de permissões do usuário
- Sanitização de mensagens

### Escalabilidade
- Estrutura preparada para múltiplos chatbots
- Sistema de IDs únicos escalável
- Separação clara entre frontend e backend 