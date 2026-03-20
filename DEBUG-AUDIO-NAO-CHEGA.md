# 🚨 DEBUG: Áudio não chega no WhatsApp

## 🎯 **PROBLEMA IDENTIFICADO:**
- ✅ Formato OGG correto implementado
- ✅ Upload para Supabase funcionando  
- ❌ **Mensagem não chega no WhatsApp do destinatário**

**Causa provável:** Problema na Evolution API ou configuração da instância

---

## 🔍 **DIAGNÓSTICO PASSO A PASSO:**

### **1. TESTE A EVOLUTION API DIRETAMENTE:**

**Execute o teste direto:**
```bash
# Edite o arquivo test-evolution-audio.js primeiro:
# - Substitua TEST_NUMBER pelo seu número
# - Verifique INSTANCE_NAME
# - Confirme API_KEY

node test-evolution-audio.js
```

**Resultados esperados:**
- ✅ Evolution API rodando
- ✅ Instância encontrada e status "open"
- ✅ Texto enviado e recebido no WhatsApp
- ✅ Áudio enviado e recebido no WhatsApp

---

### **2. VERIFIQUE LOGS DO SISTEMA:**

**No console do navegador (F12), ao enviar áudio:**

#### **✅ Logs que DEVEM aparecer:**
```
🎤 Iniciando envio de áudio para: +5511999999999@s.whatsapp.net
📤 Fazendo upload para storage...
✅ Upload realizado com sucesso
📡 Enviando áudio via Evolution API...
🎤 [AUDIO_xxxxx] sendAudioMessage: +5511999999999@s.whatsapp.net
🎵 Formato detectado: OGG (compatível com WhatsApp)
📄 [AUDIO_xxxxx] Payload: {number, mediatype: "audio", media: "https://..."}
🚀 [AUDIO_xxxxx] Evolution API (Audio): instance_name
✅ [AUDIO_xxxxx] Sucesso Evolution API (Audio): {...}
```

#### **❌ Logs que indicam PROBLEMA:**
```
❌ [AUDIO_xxxxx] Erro HTTP: 400/500
💥 [AUDIO_xxxxx] ERRO sendAudioMessage: ...
❌ Erro ao buscar instância: ...
❌ Instância WhatsApp não encontrada
```

---

### **3. VERIFICAÇÕES CRÍTICAS:**

#### **A. Número de telefone correto?**
```javascript
// No console, verificar formato:
console.log('Número enviado:', 'SEU_NUMERO_AQUI');
// Deve estar como: +5511999999999@s.whatsapp.net
```

#### **B. Instância WhatsApp ativa?**
```bash
# Verificar status:
curl http://localhost:8080/instance/fetchInstances \
  -H "apikey: SUA_API_KEY"
# Status deve ser "open"
```

#### **C. Evolution API acessível?**
```bash
# Teste básico:
curl http://localhost:8080/
# Deve retornar resposta da Evolution
```

#### **D. Configuração correta no código?**
**Verifique em `clientes_info` no Supabase:**
- `instance_name` está correto?
- `apikey` está correta?
- `email` do usuário bate?

---

## 🛠️ **SOLUÇÕES PARA PROBLEMAS COMUNS:**

### **Problema 1: "Instância não encontrada"**
```sql
-- No Supabase, verificar clientes_info:
SELECT instance_name, apikey, email 
FROM clientes_info 
WHERE user_id_auth = 'SEU_USER_ID';
```

### **Problema 2: "Evolution API não responde"**
```bash
# Verificar se está rodando:
netstat -ano | findstr :8080
# Ou reiniciar Evolution API
```

### **Problema 3: "Erro 401 - Unauthorized"**
- API Key incorreta na tabela `clientes_info`
- Verificar se API Key está ativa na Evolution

### **Problema 4: "Erro 404 - Not Found"**
- URL base incorreta (deve ser http://localhost:8080)
- Endpoint `/message/sendMedia/` não existe nesta versão

### **Problema 5: "Status não é 'open'"**
- WhatsApp desconectado
- QR Code precisa ser escaneado novamente
- Instância precisa ser reiniciada

---

## 📱 **TESTE MANUAL VIA CURL:**

**1. Teste envio de texto:**
```bash
curl -X POST "http://localhost:8080/message/sendText/SUA_INSTANCIA" \
  -H "apikey: SUA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "SEU_NUMERO",
    "text": "Teste manual"
  }'
```

**2. Teste envio de áudio:**
```bash
curl -X POST "http://localhost:8080/message/sendMedia/SUA_INSTANCIA" \
  -H "apikey: SUA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "SEU_NUMERO",
    "mediatype": "audio",
    "media": "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
    "fileName": "test.wav"
  }'
```

---

## 🎯 **CHECKLIST DE VERIFICAÇÃO:**

**Evolution API:** ✅ ❌
- [ ] Está rodando na porta 8080
- [ ] Responde ao health check
- [ ] API Key é válida

**Instância WhatsApp:** ✅ ❌
- [ ] Aparece na lista de instâncias
- [ ] Status é "open"
- [ ] Nome correto na base de dados

**Configuração App:** ✅ ❌
- [ ] `instance_name` correto no DB
- [ ] `apikey` correta no DB
- [ ] Usuário logado tem configuração

**Rede/Conectividade:** ✅ ❌
- [ ] App acessa Evolution API
- [ ] URL Supabase é acessível
- [ ] Não há firewall bloqueando

---

## 📞 **PRÓXIMOS PASSOS:**

**1. Execute:** `node test-evolution-audio.js`
**2. Compartilhe:** Resultado completo do teste
**3. Execute:** Um teste de áudio no app com console aberto
**4. Compartilhe:** Logs do console durante o envio

**Com essas informações, posso identificar exatamente onde está falhando!**

---

## 🚨 **SUSPEITAS PRINCIPAIS:**

1. **Instance name incorreto** - mais provável
2. **WhatsApp desconectado** - segunda opção
3. **Evolution API com problema** - menos provável
4. **Formato ainda incorreto** - improvável

**Execute os testes e me informe os resultados!** 🔍📱 