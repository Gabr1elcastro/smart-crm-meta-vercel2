# Solução: Chatbots Não Aparecem Durante Impersonação

## 🎯 **Problema Identificado**
Os chatbots não estão sendo carregados quando o super admin acessa a conta de um cliente em modo de impersonação.

## 🔍 **Diagnóstico**

### **1. Verificar se está em modo de impersonação**
```javascript
// Execute no console do navegador
console.log('isImpersonating:', sessionStorage.getItem('isImpersonating'));
console.log('impersonatedCliente:', sessionStorage.getItem('impersonatedCliente'));
```

### **2. Verificar se há chatbots no banco**
```javascript
// Execute no console do navegador
// Cole o conteúdo de teste-chatbots-impersonacao.js
testarChatbotsImpersonacao();
```

### **3. Verificar se a coluna id_cliente existe**
```sql
-- Execute no SQL Editor do Supabase
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'prompts_oficial' 
AND column_name = 'id_cliente';
```

## 🔧 **Soluções**

### **Solução 1: Atualizar Chatbots com id_cliente**
Se os chatbots não têm `id_cliente` preenchido:

```javascript
// Execute no console do navegador
// Cole o conteúdo de atualizar-chatbots-id-cliente.js
atualizarChatbotsComIdCliente();
```

### **Solução 2: Inserir Chatbots de Teste**
Se não há chatbots para o cliente:

```sql
-- Execute no SQL Editor do Supabase
-- Cole o conteúdo de inserir-chatbots-teste.sql
```

### **Solução 3: Verificar Estrutura da Tabela**
```sql
-- Execute no SQL Editor do Supabase
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'prompts_oficial'
ORDER BY ordinal_position;
```

## 🧪 **Testes**

### **Teste 1: Verificar Impersonação**
```javascript
// Execute no console do navegador
simularImpersonacaoCompleta(13, "Bruno 3");
location.reload();
```

### **Teste 2: Verificar Chatbots**
```javascript
// Execute no console do navegador
testarChatbotsImpersonacao();
```

### **Teste 3: Verificar Componentes**
```javascript
// Execute no console do navegador
testarComponentesChatbot();
```

## 📋 **Passos para Resolver**

### **Passo 1: Verificar Dados**
1. Execute `testarChatbotsImpersonacao()` no console
2. Verifique se há chatbots para o cliente
3. Verifique se os chatbots têm `id_cliente` preenchido

### **Passo 2: Atualizar Chatbots (se necessário)**
1. Execute `atualizarChatbotsComIdCliente()` no console
2. Verifique o resultado com `verificarChatbotsAtualizados()`

### **Passo 3: Inserir Chatbots de Teste (se necessário)**
1. Execute o script `inserir-chatbots-teste.sql` no Supabase
2. Verifique se os chatbots foram inseridos

### **Passo 4: Testar Impersonação**
1. Execute `simularImpersonacaoCompleta(13, "Bruno 3")`
2. Recarregue a página
3. Verifique se os chatbots aparecem

### **Passo 5: Verificar Componentes**
1. Execute `testarComponentesChatbot()`
2. Verifique se há elementos de chatbot na página

## 🐛 **Problemas Comuns**

### **Problema 1: "Nenhum chatbot encontrado"**
**Causa**: Não há chatbots para o cliente ou não têm `id_cliente`
**Solução**: 
1. Execute `atualizarChatbotsComIdCliente()`
2. Ou execute `inserir-chatbots-teste.sql`

### **Problema 2: "Erro ao buscar chatbots"**
**Causa**: Problema na query ou permissões
**Solução**:
1. Verifique se a coluna `id_cliente` existe
2. Verifique as permissões RLS da tabela

### **Problema 3: "Chatbots não aparecem na interface"**
**Causa**: Problema no componente ou estado
**Solução**:
1. Verifique os logs do console
2. Execute `testarComponentesChatbot()`

## 🔍 **Debug Detalhado**

### **Verificar Logs do Console**
Procure por estas mensagens:
- "ChatbotTester: Buscando chatbots para cliente impersonado"
- "WhatsAppConnect: Buscando chatbots para cliente impersonado"
- "Chatbots encontrados para cliente impersonado"

### **Verificar Dados no Banco**
```sql
-- Verificar chatbots do cliente
SELECT id, nome, id_usuario, id_cliente, em_uso 
FROM prompts_oficial 
WHERE id_cliente = '13';

-- Verificar chatbots sem id_cliente
SELECT id, nome, id_usuario, id_cliente 
FROM prompts_oficial 
WHERE id_cliente IS NULL OR id_cliente = '';
```

### **Verificar Componentes**
```javascript
// Verificar se o componente está carregando
console.log('ChatbotTester:', document.querySelector('[data-testid="chatbot-tester"]'));
console.log('WhatsAppConnect:', document.querySelector('[data-testid="whatsapp-connect"]'));
```

## ✅ **Resultado Esperado**

Após aplicar as soluções:
1. ✅ Chatbots aparecem na lista de seleção
2. ✅ Chatbot em uso é destacado
3. ✅ Funcionalidade de teste de chatbot funciona
4. ✅ Status de conexão WhatsApp aparece
5. ✅ Todos os dados do cliente são carregados

## 🚀 **Teste Rápido**

Para um teste rápido, execute no console:

```javascript
// 1. Verificar se precisa atualizar chatbots
atualizarChatbotsSeNecessario();

// 2. Simular impersonação
simularImpersonacaoCompleta(13, "Bruno 3");

// 3. Recarregar página
location.reload();

// 4. Verificar chatbots
setTimeout(() => {
  testarChatbotsImpersonacao();
  testarComponentesChatbot();
}, 2000);
```

## 📞 **Próximos Passos**

Se o problema persistir:
1. 🔍 **Debug detalhado** - Use os scripts de teste
2. 🐛 **Verificar logs** - Procure por erros no console
3. 🗄️ **Verificar banco** - Confirme dados no Supabase
4. 🧪 **Teste manual** - Verifique cada componente

Com essas informações, posso te ajudar de forma mais específica! 