# 🎵 Implementação: Envio Duplo de Áudio

## 📋 Resumo da Implementação

**OBJETIVO**: Os áudios gravados pela plataforma agora são enviados para **DOIS endpoints simultaneamente**:

1. **Evolution API** (endpoint original) - `https://wsapi.dev.usesmartcrm.com/message/sendMedia/{instanceName}`
2. **Novo Endpoint de Áudio** - `https://webhook.dev.usesmartcrm.com/webhook/audio-teste`

## 🎯 Motivo da Implementação

- **Processamento paralelo**: O novo endpoint pode processar áudio de forma diferente
- **Backup e redundância**: Se um endpoint falhar, o outro continua funcionando
- **Análise e monitoramento**: O novo endpoint pode ter funcionalidades específicas para áudio
- **Não afeta funcionalidade**: O usuário continua recebendo áudio normalmente

## 🔄 Fluxo de Envio Atualizado

### **Antes (Apenas Evolution API):**
```
1. Gravar áudio → Blob
2. Upload para Supabase Storage → URL
3. Enviar URL para Evolution API → /message/sendMedia/
4. Evolution API processa → Envia para WhatsApp
```

### **Agora (Duplo Envio):**
```
1. Gravar áudio → Blob
2. Upload para Supabase Storage → URL
3. 🆕 Enviar para novo endpoint → /webhook/audio-teste
4. Enviar para Evolution API → /message/sendMedia/
5. Evolution API processa → Envia para WhatsApp
```

## 📡 Endpoints e Payloads

### **1. Novo Endpoint de Áudio**
```
POST https://webhook.dev.usesmartcrm.com/webhook/audio-teste
```

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Payload (enriquecido):**
```json
{
  "number": "5511999999999@s.whatsapp.net",
  "mediatype": "audio",
  "media": "https://...supabase.co/storage/...",
  "caption": "",
  "fileName": "audio_1703123456789.mp3",
  "mimetype": "audio/mpeg",
  "ptt": true,
  "instanceName": "instance-name",
  "apikey": "429683C4C977415CAAFCCE10F7D57E11",
  "user_id": "user-uuid",
  "departamento_id": "dept-uuid"
}
```

### **2. Evolution API (mantido)**
```
POST https://wsapi.dev.usesmartcrm.com/message/sendMedia/{instanceName}
```

**Headers:**
```json
{
  "Content-Type": "application/json",
  "apikey": "429683C4C977415CAAFCCE10F7D57E11"
}
```

**Payload (original):**
```json
{
  "number": "5511999999999@s.whatsapp.net",
  "mediatype": "audio",
  "media": "https://...supabase.co/storage/...",
  "caption": "",
  "fileName": "audio_1703123456789.mp3",
  "mimetype": "audio/mpeg",
  "ptt": true
}
```

## 🔍 Logs e Monitoramento

### **Logs de Debug:**
```
🎵 [AUDIO_xxxxx] Configuração de áudio: {...}
🔍 [AUDIO_xxxxx] Buscando departamento do lead...
🏢 [AUDIO_xxxxx] Departamento do lead: X
🔍 [AUDIO_xxxxx] Buscando chip associado ao departamento...
📱 [AUDIO_xxxxx] Chip associado: instance-name
🔍 [AUDIO_xxxxx] Buscando informações da instância...
📤 [AUDIO_xxxxx] Payload para Evolution API: {...}
📤 [AUDIO_xxxxx] Payload para novo endpoint de áudio: {...}
✅ [AUDIO_xxxxx] Resposta do novo endpoint de áudio: {...}
✅ [AUDIO_xxxxx] Resposta da Evolution API: {...}
```

### **Tratamento de Erros:**
- **Novo endpoint falha**: Apenas log de warning, não afeta o envio
- **Evolution API falha**: Erro é propagado para o usuário
- **Ambos funcionam**: Logs de sucesso para ambos

## 📊 Impacto na Plataforma

### ✅ **O que CONTINUA funcionando:**
- Envio de áudio para WhatsApp (via Evolution API)
- Upload para storage
- Interface do usuário
- Todas as outras funcionalidades

### 🆕 **O que foi ADICIONADO:**
- Envio paralelo para novo endpoint
- Payload enriquecido com metadados
- Logs detalhados para ambos endpoints
- Tratamento de erro independente

### 🚫 **O que NÃO foi afetado:**
- Performance (envio paralelo)
- Experiência do usuário
- Funcionalidade existente
- Outros tipos de mídia

## 🧪 Como Testar

### **1. Gravar um áudio na plataforma**
### **2. Verificar no console do navegador:**
```
📤 [AUDIO_xxxxx] Payload para novo endpoint de áudio: {...}
✅ [AUDIO_xxxxx] Resposta do novo endpoint de áudio: {...}
📤 [AUDIO_xxxxx] Payload para Evolution API: {...}
✅ [AUDIO_xxxxx] Resposta da Evolution API: {...}
```

### **3. Verificar se o áudio chega ao destinatário**
### **4. Verificar se o novo endpoint recebeu o payload**

## 🔍 Troubleshooting

### **Se o áudio não funcionar:**
1. **Verificar console do navegador** para logs de erro
2. **Confirmar se ambos endpoints estão acessíveis**
3. **Verificar se o payload está sendo enviado corretamente**
4. **Confirmar se a Evolution API está funcionando**

### **Se apenas o novo endpoint falhar:**
- O áudio continuará funcionando normalmente
- Apenas log de warning será exibido
- Não afeta a funcionalidade principal

## 📝 Arquivos Modificados

- `src/services/messageService.ts` - Função `sendAudioMessage` atualizada

## 🔗 Endpoints

- **Áudio (novo)**: `https://webhook.dev.usesmartcrm.com/webhook/audio-teste`
- **Áudio (original)**: `https://wsapi.dev.usesmartcrm.com/message/sendMedia/{instanceName}`
- **Outros tipos de mídia**: `https://wsapi.dev.usesmartcrm.com/message/sendMedia/{instanceName}`

## 📅 Data da Implementação

**Implementado em**: Dezembro 2024

## 🚀 Próximos Passos

1. **Monitorar logs** para confirmar funcionamento
2. **Testar com diferentes tipos de áudio**
3. **Verificar se o novo endpoint está processando corretamente**
4. **Considerar migração completa** se o novo endpoint for mais eficiente

---

**Nota**: Esta implementação mantém 100% de compatibilidade com o sistema existente, adicionando funcionalidade sem quebrar nada.
