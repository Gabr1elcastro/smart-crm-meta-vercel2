# 🔍 GUIA DE DEBUGGING - RAIZ DA DUPLICAÇÃO

## 🎯 OBJETIVO

Identificar **exatamente onde** e **quantas vezes** as mensagens estão sendo criadas no banco de dados através de logs detalhados em cada etapa do processo.

## 🚀 COMO USAR

### 1️⃣ **ATIVAR LOGS DETALHADOS**

1. **Compile o projeto** com os logs implementados:
   ```bash
   npm run build
   npm run dev
   ```

2. **Abra o console do navegador** (F12 → Console)

3. **Cole e execute** o monitor de inserções:
   ```javascript
   // Cole o conteúdo do arquivo monitor-database-inserts.js
   ```

### 2️⃣ **TESTAR ENVIO DE MENSAGEM**

1. **Acesse a página de conversas**
2. **Selecione um contato**
3. **Digite uma mensagem de teste** (ex: "Teste Debug 123")
4. **Clique em Enviar UMA VEZ**
5. **Observe os logs no console**

### 3️⃣ **ANALISAR OS LOGS**

Os logs aparecerão em sequência. Procure por:

#### 🚀 **LOGS DE ENVIO (Frontend)**
```
🚀 [SEND_xxxxx] INÍCIO DO ENVIO DE MENSAGEM
📝 [SEND_xxxxx] Mensagem: "Teste Debug 123"
📞 [SEND_xxxxx] Contato selecionado: xxxxx
```

#### 🎯 **LOGS DE API (Evolution)**
```
🎯 [API_xxxxx] ========== INÍCIO DA FUNÇÃO sendMessage ==========
📞 [API_xxxxx] Parâmetros recebidos:
🚀 [API_xxxxx] ENVIANDO REQUISIÇÃO PARA EVOLUTION API...
✅ [API_xxxxx] RESPOSTA DA EVOLUTION API:
```

#### 🔄 **LOGS DE WEBHOOK (Recebimento)**
```
🔄 [PROCESS_xxxxx] ========== NOVA MENSAGEM RECEBIDA DO WEBHOOK ==========
📨 [PROCESS_xxxxx] Dados brutos recebidos:
```

#### 💾 **LOGS DE INSERÇÃO (Banco)**
```
💾 [DB_xxxxx] ========== INSERÇÃO NO BANCO DETECTADA #X ==========
📦 [DB_xxxxx] Dados sendo inseridos:
```

### 4️⃣ **IDENTIFICAR O PROBLEMA**

#### ✅ **CENÁRIO NORMAL** (1 mensagem no banco):
```
1x 🚀 INÍCIO DO ENVIO DE MENSAGEM
1x 🎯 INÍCIO DA FUNÇÃO sendMessage  
1x 🚀 ENVIANDO REQUISIÇÃO PARA EVOLUTION API
1x ✅ RESPOSTA DA EVOLUTION API
1x 🔄 NOVA MENSAGEM RECEBIDA DO WEBHOOK
1x 💾 INSERÇÃO NO BANCO DETECTADA
```

#### ❌ **CENÁRIO COM PROBLEMA**:

**Se você ver:**
- **Múltiplos `🚀 INÍCIO DO ENVIO`** → **Frontend enviando várias vezes**
- **Múltiplos `🎯 INÍCIO DA FUNÇÃO sendMessage`** → **Função sendo chamada várias vezes**
- **Múltiplos `🚀 ENVIANDO REQUISIÇÃO`** → **API sendo chamada várias vezes**
- **Múltiplos `🔄 NOVA MENSAGEM RECEBIDA`** → **Webhook sendo executado várias vezes**
- **Múltiplos `💾 INSERÇÃO NO BANCO`** → **Banco recebendo várias inserções**

### 5️⃣ **GERAR RELATÓRIO**

No console, execute:
```javascript
showInsertionReport()
```

Isso mostrará:
- **Total de inserções** detectadas
- **Detalhes de cada inserção**
- **Duplicatas identificadas**

## 🔍 **POSSÍVEIS CAUSAS E DIAGNÓSTICO**

### **Causa 1: Cliques Duplos no Frontend** 🖱️
**Sintoma:** Múltiplos `🚀 INÍCIO DO ENVIO` com poucos ms de diferença
**Logs:** `⚠️ POSSÍVEL CLIQUE DUPLO: Xms desde o último clique`

### **Causa 2: Múltiplas Chamadas da API** 🌐
**Sintoma:** Múltiplos `🎯 INÍCIO DA FUNÇÃO sendMessage`
**Logs:** Vários requests para Evolution API

### **Causa 3: Webhook Executando Múltiplas Vezes** 🔄
**Sintoma:** 1x API call, mas múltiplos `🔄 NOVA MENSAGEM RECEBIDA`
**Logs:** Webhook n8n/Make processando várias vezes

### **Causa 4: Evolution API Processando Múltiplas Vezes** ⚡
**Sintoma:** 1x request, mas Evolution retorna múltiplas mensagens
**Logs:** Uma requisição gerando vários webhooks

### **Causa 5: Múltiplas Instâncias ou Configurações** 🔧
**Sintoma:** Mensagem aparece várias vezes simultaneamente
**Logs:** Vários webhooks de instâncias diferentes

## 📋 **CHECKLIST DE DEBUGGING**

- [ ] **Logs do frontend** estão aparecendo?
- [ ] **Quantos `🚀 INÍCIO DO ENVIO`** aparecem por mensagem?
- [ ] **Quantos `🎯 sendMessage`** são executados?
- [ ] **Quantos `🔄 WEBHOOK`** são recebidos?
- [ ] **Quantos `💾 INSERÇÃO`** acontecem no banco?
- [ ] **Há gaps de tempo** entre os logs?
- [ ] **showInsertionReport()** foi executado?

## 🎯 **PRÓXIMOS PASSOS**

1. **Execute o teste** seguindo este guia
2. **Cole os logs** completos 
3. **Execute `showInsertionReport()`**
4. **Identifique o padrão** de duplicação
5. **Relate onde** está o problema (frontend, API, webhook, etc.)

---

**Com estes logs detalhados, conseguiremos identificar EXATAMENTE onde está a raiz do problema!** 🔍✨ 