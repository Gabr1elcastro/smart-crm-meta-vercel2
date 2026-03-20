# 🎵 Mudança de Endpoint para Arquivos de Áudio

## 📋 Resumo da Mudança

**ANTES**: Os arquivos de áudio eram enviados para a Evolution API (`https://wsapi.dev.usesmartcrm.com/message/sendMedia/{instanceName}`)

**AGORA**: Os arquivos de áudio são enviados para um endpoint específico (`https://webhook.dev.usesmartcrm.com/webhook/audio-teste`)

## 🎯 Motivo da Mudança

- **Separação de responsabilidades**: Áudio agora tem tratamento específico
- **Processamento customizado**: O novo endpoint pode processar áudio de forma diferente
- **Melhor controle**: Endpoint dedicado para áudio permite otimizações específicas
- **Não afeta outros tipos de mídia**: Imagens e documentos continuam usando a Evolution API

## 🔄 O que Mudou

### 1. Função `sendAudioMessage` (messageService.ts)

**Antes:**
```typescript
const apiUrl = `${API_BASE_URL}/message/sendMedia/${instanceName}`;
const requestHeaders = {
    'Content-Type': 'application/json',
    'apikey': clientInfo.apikey || '429683C4C977415CAAFCCE11'
};
```

**Depois:**
```typescript
const audioWebhookUrl = 'https://webhook.dev.usesmartcrm.com/webhook/audio-teste';
// Sem header de apikey (será enviado no payload)
```

### 2. Payload Enviado

**Antes (Evolution API):**
```typescript
const requestBody = {
  number,
  mediatype: 'audio',
  media: audioUrl,
  caption: caption || '',
  fileName: fileName,
  mimetype: mimetype,
  ptt: true
};
```

**Depois (Novo Endpoint):**
```typescript
const requestBody = {
  number,
  mediatype: 'audio',
  media: audioUrl,
  caption: caption || '',
  fileName: fileName,
  mimetype: mimetype,
  ptt: true,
  instanceName,        // ✅ NOVO: Nome da instância
  apikey,             // ✅ NOVO: Chave da API
  user_id,            // ✅ NOVO: ID do usuário
  departamento_id     // ✅ NOVO: ID do departamento
};
```

## 📊 Impacto

### ✅ **O que CONTINUA funcionando:**
- Envio de imagens (via Evolution API)
- Envio de documentos (via Evolution API)
- Envio de mensagens de texto (via Evolution API)
- Todas as outras funcionalidades da plataforma

### 🔄 **O que MUDOU:**
- Apenas o endpoint para envio de áudio
- Payload mais rico com informações adicionais
- Logs atualizados para refletir a mudança

### 🚫 **O que NÃO foi afetado:**
- Interface do usuário
- Gravação de áudio
- Upload para storage
- Processamento de resposta
- Integração com WhatsApp

## 🧪 Como Testar

### 1. Gravar um áudio na plataforma
### 2. Verificar no console do navegador:
```
🎵 [AUDIO_xxxxx] Configuração de áudio: {...}
🔍 [AUDIO_xxxxx] Buscando departamento do lead...
🏢 [AUDIO_xxxxx] Departamento do lead: X
🔍 [AUDIO_xxxxx] Buscando chip associado ao departamento...
📱 [AUDIO_xxxxx] Chip associado: instance-name
🔍 [AUDIO_xxxxx] Buscando informações da instância...
📤 [AUDIO_xxxxx] Payload para novo endpoint de áudio: {...}
✅ [AUDIO_xxxxx] Resposta do novo endpoint de áudio: {...}
```

### 3. Verificar se o áudio chega ao destinatário

## 🔍 Troubleshooting

### Se o áudio não funcionar:

1. **Verificar console do navegador** para logs de erro
2. **Confirmar se o novo endpoint está acessível**
3. **Verificar se o payload está sendo enviado corretamente**
4. **Confirmar se a resposta do endpoint está correta**

### Logs importantes:
- `🎵 Configuração de áudio` - Confirma que a função foi chamada
- `📤 Payload para novo endpoint` - Mostra o que está sendo enviado
- `✅ Resposta do novo endpoint` - Confirma sucesso ou mostra erro

## 📝 Arquivos Modificados

- `src/services/messageService.ts` - Função `sendAudioMessage` atualizada

## 🔗 Endpoints

- **Áudio**: `https://webhook.dev.usesmartcrm.com/webhook/audio-teste`
- **Outros tipos de mídia**: `https://wsapi.dev.usesmartcrm.com/message/sendMedia/{instanceName}`

## 📅 Data da Mudança

**Implementado em**: Dezembro 2024

---

*Esta mudança afeta apenas o envio de arquivos de áudio. Todas as outras funcionalidades continuam funcionando normalmente.*

























