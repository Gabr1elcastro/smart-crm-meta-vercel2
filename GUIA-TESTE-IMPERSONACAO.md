# Guia de Teste - Impersonação do Super Admin

## 🎯 **Objetivo**
Testar se o super admin consegue acessar a conta de um cliente e ter acesso completo a todas as funcionalidades, incluindo chatbots e status de conexão.

## 📋 **Pré-requisitos**
1. Super admin logado em `/super-admin`
2. Cliente existente na tabela `clientes_info`
3. **NOVA**: Coluna `id_cliente` (text) adicionada na tabela `prompts_oficial`
4. Console do navegador aberto (F12)

## 🔧 **Configuração Inicial**

### **1. Atualizar Chatbots com id_cliente**
Execute no console do navegador:

```javascript
// Cole o conteúdo de atualizar-chatbots-id-cliente.js
// Depois execute:

// Atualizar chatbots existentes
atualizarChatbotsComIdCliente();

// Verificar resultado
verificarChatbotsAtualizados();
```

### **2. Verificar Estrutura da Tabela**
```sql
-- Verificar se a coluna id_cliente existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'prompts_oficial' 
AND column_name = 'id_cliente';

-- Verificar chatbots com id_cliente
SELECT id, nome, id_usuario, id_cliente 
FROM prompts_oficial 
WHERE id_cliente IS NOT NULL;
```

## 🧪 **Passos para Teste**

### **1. Preparação**
```bash
# Acesse o dashboard do super admin
http://localhost:5173/super-admin
```

### **2. Teste Manual**
1. **Clique em "Acessar" em um cliente**
2. **Verifique se aparece o banner laranja**
3. **Teste todas as funcionalidades da aplicação:**
   - ✅ Dashboard
   - ✅ Conversas
   - ✅ Leads
   - ✅ **Chatbots (agora com id_cliente)**
   - ✅ Status de conexão WhatsApp
   - ✅ Departamentos
   - ✅ Relatórios

### **3. Teste via Console**
Execute no console do navegador:

```javascript
// Cole o conteúdo de teste-impersonacao-completa.js
// Depois execute:

// Simular impersonação completa
simularImpersonacaoCompleta(13, "Bruno 3");

// Recarregar página
location.reload();

// Verificar dados carregados
verificarDadosCarregados();

// Testar componentes
testarComponentes();

// Verificar contexto React
verificarContextoReact();
```

## 🔍 **Pontos de Verificação**

### **✅ Banner de Impersonação**
- [ ] Banner laranja aparece no topo
- [ ] Mostra "Modo Super Admin Ativo"
- [ ] Mostra nome do cliente impersonado
- [ ] Botão "Sair do Modo Super Admin" funciona

### **✅ Contexto de Autenticação**
- [ ] `user.id_cliente` usa o ID do cliente impersonado
- [ ] Não mostra erro "id_cliente não fornecido"
- [ ] Não mostra erro "Cliente não encontrado"
- [ ] Dados completos do cliente são carregados

### **✅ Permissões**
- [ ] Tem permissões de gestor (pode ver todos os departamentos)
- [ ] Pode acessar todas as funcionalidades
- [ ] Não é tratado como atendente

### **✅ Funcionalidades Completas**
- [ ] Dashboard carrega corretamente
- [ ] Conversas aparecem
- [ ] Leads aparecem
- [ ] Relatórios funcionam
- [ ] Configurações acessíveis
- [ ] **Chatbots aparecem e funcionam (usando id_cliente)**
- [ ] **Status de conexão WhatsApp aparece**
- [ ] **Departamentos são carregados**
- [ ] **Dados de instância são exibidos**

### **✅ Dados Específicos**
- [ ] Instance ID correto
- [ ] Instance Name correto
- [ ] Sender Number correto
- [ ] API Key disponível
- [ ] Configurações de atendimento (humano/IA)
- [ ] Chatbot selecionado
- [ ] Departamentos dos chips

### **✅ Chatbots com id_cliente**
- [ ] Chatbots são carregados pelo `id_cliente` correto
- [ ] Chatbots aparecem na lista de seleção
- [ ] Chatbot em uso é destacado
- [ ] Funcionalidade de teste de chatbot funciona

## 🐛 **Problemas Comuns**

### **Problema 1: "id_cliente não fornecido"**
**Causa**: AuthContext não está usando o ID do cliente impersonado
**Solução**: Verificar se o `sessionStorage` tem os dados corretos

### **Problema 2: "Cliente não encontrado"**
**Causa**: RealtimeContext não está usando o cliente correto
**Solução**: Verificar se a impersonação está ativa

### **Problema 3: Permissões de atendente**
**Causa**: usePermissions não detecta modo de impersonação
**Solução**: Verificar se `isImpersonating` está sendo lido corretamente

### **Problema 4: Banner não aparece**
**Causa**: Dados de impersonação não estão no sessionStorage
**Solução**: Verificar se o botão "Acessar" está funcionando

### **Problema 5: Chatbots não aparecem**
**Causa**: Chatbots não têm `id_cliente` preenchido ou página Chatbots.tsx não está usando `id_cliente`
**Solução**: 
1. Executar `atualizarChatbotsComIdCliente()`
2. Verificar se a página Chatbots.tsx foi atualizada para usar `id_cliente` durante impersonação
3. Execute o script `teste-chatbots-pagina.js` na página `/chatbots` para debug específico

### **Problema 6: Status de conexão não aparece**
**Causa**: WhatsAppConnect não está usando dados do cliente correto
**Solução**: Verificar se `getClientInfo` está funcionando

## 🔧 **Debug**

### **Verificar SessionStorage**
```javascript
console.log('isImpersonating:', sessionStorage.getItem('isImpersonating'));
console.log('impersonatedCliente:', sessionStorage.getItem('impersonatedCliente'));
```

### **Verificar Contexto**
```javascript
// No React DevTools, verificar:
// - AuthContext.user.id_cliente
// - usePermissions.permissions.tipo_usuario
// - WhatsAppConnect.clientInfo
// - ChatbotTester.clientId
```

### **Verificar Logs**
```javascript
// Procurar por logs no console:
// - "Modo impersonação ativo"
// - "ID do cliente definido"
// - "Permissões de gestor"
// - "Dados completos do cliente carregados"
// - "Usando dados do cliente impersonado"
// - "Buscando chatbots para cliente impersonado"
```

### **Verificar Dados no Banco**
```javascript
// Execute no console:
verificarDadosCarregados();
```

### **Verificar Chatbots com id_cliente**
```javascript
// Execute no console:
verificarChatbotsAtualizados();

// Para debug específico da página Chatbots.tsx:
// Execute na página /chatbots:
// Cole o conteúdo de teste-chatbots-pagina.js
```

## 📊 **Resultado Esperado**

### **Antes da Impersonação**
- Super admin vê dashboard de super admin
- Não tem acesso às funcionalidades dos clientes

### **Durante a Impersonação**
- Banner laranja aparece
- Acesso completo às funcionalidades do cliente
- Permissões de gestor
- Contexto usa ID do cliente correto
- **Chatbots aparecem e funcionam (usando id_cliente)**
- **Status de conexão WhatsApp é exibido**
- **Todos os dados do cliente são carregados**

### **Após Sair da Impersonação**
- Banner desaparece
- Volta para dashboard do super admin
- SessionStorage limpo

## 🎯 **Próximos Passos**

Se tudo funcionar:
1. ✅ **Teste completo** - Impersonação funcionando
2. 🔄 **Teste com diferentes clientes** - Verificar se funciona para todos
3. 🛡️ **Teste de segurança** - Verificar se não há vazamentos
4. 📝 **Documentação** - Atualizar documentação do sistema

Se houver problemas:
1. 🔍 **Debug detalhado** - Usar scripts de teste
2. 🐛 **Correção** - Identificar e corrigir problemas
3. 🧪 **Reteste** - Executar testes novamente

## 🚀 **Teste Rápido**

Para um teste rápido, execute no console:

```javascript
// 1. Atualizar chatbots (se necessário)
atualizarChatbotsComIdCliente();

// 2. Simular impersonação
simularImpersonacaoCompleta(13, "Bruno 3");

// 3. Recarregar página
location.reload();

// 4. Verificar tudo
setTimeout(() => {
  verificarDadosCarregados();
  testarComponentes();
  verificarContextoReact();
}, 2000);
``` 