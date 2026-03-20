# 🔍 Debug: Áudio Não Chega ao Destinatário

## Status Atual
- ✅ Upload para Supabase: FUNCIONANDO
- ✅ Evolution API aceita o áudio: FUNCIONANDO (status: PENDING)
- ❌ Áudio não chega no WhatsApp do destinatário

## Possíveis Causas

### 1. Problema na Instância WhatsApp
- A instância pode estar desconectada
- Problemas de sessão com WhatsApp
- Limite de envio atingido

### 2. Formato/Tamanho do Arquivo
- WhatsApp tem limites de tamanho (16MB)
- Formato pode precisar de conversão específica
- Codec não suportado

### 3. Problema no Webhook/n8n
- O n8n pode não estar salvando corretamente
- Pode haver erro no processamento

## Testes para Fazer

### 1. Verificar Status da Instância
```bash
curl -X GET "https://wsapi.dev.usesmartcrm.com/instance/connectionState/smartcrm_6_bruno_cunh" \
-H "apikey: 429683C4C977415CAAFCCE10F7D57E11"
```

### 2. Verificar se o Webhook está Recebendo
- Checar logs do n8n
- Verificar se o webhook está sendo chamado

### 3. Testar com Arquivo Menor
- Gravar áudio de 5 segundos
- Verificar se chega

### 4. Verificar no Banco de Dados
```sql
-- Verificar últimas mensagens de áudio
SELECT * FROM mensagens 
WHERE tipo_mensagem = 'audio' 
ORDER BY created_at DESC 
LIMIT 10;
```

## Informações do Log de Sucesso

```json
{
  "key": {
    "remoteJid": "5511986307655@s.whatsapp.net",
    "fromMe": true,
    "id": "3EB04A25C650104289AC816D47C4E94338993FE8"
  },
  "status": "PENDING",
  "message": {
    "audioMessage": {
      "url": "https://mmg.whatsapp.net/...",
      "mimetype": "audio/ogg",
      "fileSha256": "YXP8pUdR4covmPil6mUSHdUCBs38MlPLz9Bpeu7Um8w=",
      "fileLength": "52680",
      "mediaKey": "8otRDQUT35hAyDOiFcB23R7cWb4GR4wCSm8djlBy7S0="
    }
  }
}
```

O WhatsApp processou e gerou URL própria, mas status está PENDING. 