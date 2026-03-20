# 🚨 EXECUTE AGORA - IDENTIFICAR RAIZ DA DUPLICAÇÃO

## ⚡ INSTRUÇÕES DIRETAS

### 1️⃣ **INICIAR O PROJETO**
```bash
npm run dev
```

### 2️⃣ **ABRIR CONSOLE DO NAVEGADOR**
- Pressione **F12**
- Clique na aba **Console**

### 3️⃣ **COLAR E EXECUTAR ESTE CÓDIGO**

Cole este código completo no console:

```javascript
// Monitor de inserções no banco de dados
let insertionCounter = 0;
let insertionLog = [];

console.log("🔍 MONITOR DE INSERÇÕES NO BANCO - INICIADO");

const originalFetch = window.fetch;

window.fetch = async function(...args) {
  const [url, options] = args;
  
  if (url && url.includes('supabase') && url.includes('agente_conversacional_whatsapp')) {
    const monitorId = `DB_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (options && options.method === 'POST') {
      insertionCounter++;
      
      console.log(`💾 [${monitorId}] ========== INSERÇÃO NO BANCO #${insertionCounter} ==========`);
      console.log(`🌐 [${monitorId}] URL: ${url}`);
      console.log(`⏰ [${monitorId}] Timestamp: ${new Date().toISOString()}`);
      
      if (options.body) {
        try {
          const bodyData = JSON.parse(options.body);
          console.log(`📦 [${monitorId}] Dados:`, bodyData);
          
          if (Array.isArray(bodyData)) {
            console.warn(`⚠️ [${monitorId}] INSERÇÃO EM LOTE: ${bodyData.length} registros!`);
          }
          
          insertionLog.push({
            id: monitorId,
            timestamp: new Date().toISOString(),
            data: bodyData,
            count: Array.isArray(bodyData) ? bodyData.length : 1
          });
          
        } catch (parseError) {
          console.error(`❌ [${monitorId}] Erro ao fazer parse:`, parseError);
        }
      }
      
      console.trace("Stack trace da inserção:");
    }
  }
  
  return await originalFetch.apply(this, args);
};

window.showReport = function() {
  console.log("📊 ========== RELATÓRIO ==========");
  console.log(`📈 Total inserções: ${insertionCounter}`);
  
  if (insertionLog.length > 0) {
    insertionLog.forEach((entry, index) => {
      console.log(`${index + 1}. [${entry.id}] ${entry.timestamp}`);
      console.log(`   🔢 Quantidade: ${entry.count}`);
      const data = entry.data;
      console.log(`   📱 Telefone: ${data.telefone_id || (Array.isArray(data) ? data[0]?.telefone_id : 'N/A')}`);
      console.log(`   📝 Mensagem: "${data.mensagem || (Array.isArray(data) ? data[0]?.mensagem : 'N/A')}"`);
    });
  }
  
  console.log("===============================");
};

console.log("✅ Monitor ativo! Agora envie uma mensagem...");
```

### 4️⃣ **TESTE DE ENVIO**
1. **Vá para a página de conversas**
2. **Selecione um contato**
3. **Digite**: "TESTE DEBUG 123"
4. **Clique UMA VEZ** em "Enviar"
5. **OBSERVE OS LOGS** no console

### 5️⃣ **VERIFICAR RESULTADO**

No console, execute:
```javascript
showReport()
```

## 🎯 **O QUE PROCURAR**

### ✅ **CENÁRIO NORMAL** (problema resolvido):
```
📈 Total inserções: 1
1. [DB_xxxxx] timestamp
   🔢 Quantidade: 1
   📱 Telefone: número
   📝 Mensagem: "TESTE DEBUG 123"
```

### ❌ **CENÁRIO COM PROBLEMA**:
```
📈 Total inserções: 5+ 
⚠️ INSERÇÃO EM LOTE: X registros!
```

## 📋 **LOGS IMPORTANTES**

Procure também por estes logs automáticos:

### **Frontend:**
```
🚀 [SEND_xxxxx] INÍCIO DO ENVIO DE MENSAGEM
📝 [SEND_xxxxx] Mensagem: "TESTE DEBUG 123"
```

### **API:**
```
🎯 [API_xxxxx] ========== INÍCIO DA FUNÇÃO sendMessage ==========
🚀 [API_xxxxx] ENVIANDO REQUISIÇÃO PARA EVOLUTION API...
```

### **Webhook:**
```
🔄 [PROCESS_xxxxx] ========== NOVA MENSAGEM RECEBIDA DO WEBHOOK ==========
```

## ⚠️ **IMPORTANTE**

- **Execute o monitor ANTES** de enviar a mensagem
- **Envie apenas UMA mensagem** por teste
- **Cole TODOS os logs** que apareceram
- **Execute `showReport()`** após cada teste

---

## 🎯 **RESULTADO ESPERADO**

Após executar, você terá **logs detalhados** mostrando **exatamente onde** e **quantas vezes** a mensagem está sendo processada.

**Cole os logs completos aqui para identificarmos a raiz do problema!** 🔍 