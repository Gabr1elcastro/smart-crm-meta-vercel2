# 🔄 Fluxo de Envio de Mídia via Webhook

## 📋 Novo Fluxo Implementado

### Fluxo Anterior (Removido)
```
1. Upload → Storage
2. Enviar → Evolution API  
3. Salvar → Banco (direto do frontend) ❌
4. Atualizar → UI
```

### Fluxo Atual (Igual mensagens de texto)
```
1. Upload → Storage (gera URL)
2. Enviar → Evolution API
3. Evolution → Webhook n8n
4. n8n → Salva no banco com tipo=TRUE
5. Subscription → Atualiza UI automaticamente
```

## 🎯 Vantagens do Novo Fluxo

### 1. **Consistência**
- Mesmo padrão das mensagens de texto
- Centralização no n8n
- Fonte única de verdade

### 2. **Conversão de Áudio**
- n8n converte OGG → formato compatível
- URL final já processada
- Sem necessidade de conversão no frontend

### 3. **Controle de Estado**
- `tipo = TRUE`: Mensagem enviada (nós somos remetente)
- `tipo = FALSE`: Mensagem recebida (nós somos destinatário)
- Gerenciado pelo n8n

### 4. **Rastreabilidade**
- Todas mensagens passam pelo webhook
- Log centralizado no n8n
- Facilita debug e monitoramento

## 📊 Campos no Banco

Quando o n8n salvar a mensagem:
```typescript
{
  conversa_id: "telefone_userid",
  mensagem: "🎤 Mensagem de voz" | "📷 Imagem",
  tipo: true, // sempre TRUE para mensagens enviadas
  telefone_id: "5511999999999@s.whatsapp.net",
  instance_id: "instance-name",
  user_id: "user-uuid",
  tipo_mensagem: "audio" | "imagem",
  url_arquivo: "https://...supabase.co/storage/...",
  timestamp: "ISO string",
  created_at: "ISO string"
}
```

## 🔍 Fluxo Detalhado

### Envio de Áudio:
1. **Frontend**: Grava áudio → converte para WAV/MP3
2. **Frontend**: Upload para `audioswpp` bucket
3. **Frontend**: Envia URL para Evolution API
4. **Evolution**: Processa e envia para WhatsApp
5. **Evolution**: Dispara webhook para n8n
6. **n8n**: Salva no banco com `tipo=TRUE`
7. **Frontend**: Recebe via subscription e exibe

### Envio de Imagem:
1. **Frontend**: Seleciona imagem
2. **Frontend**: Upload para `imageswpp` bucket
3. **Frontend**: Envia URL para Evolution API
4. **Evolution**: Processa e envia para WhatsApp
5. **Evolution**: Dispara webhook para n8n
6. **n8n**: Salva no banco com `tipo=TRUE`
7. **Frontend**: Recebe via subscription e exibe

## ⚡ Resultado

- **Fluxo unificado**: Tudo passa pelo n8n
- **Sem duplicação**: Uma única fonte de dados
- **Conversão automática**: n8n processa áudios
- **UI reativa**: Atualização via subscription

## 🚨 Importante

O frontend agora:
- ✅ Faz upload para storage
- ✅ Envia para Evolution API
- ❌ NÃO salva no banco
- ✅ Aguarda mensagem via subscription

Isso garante que TODAS as mensagens (texto, áudio, imagem) sigam o mesmo fluxo! 🎉 