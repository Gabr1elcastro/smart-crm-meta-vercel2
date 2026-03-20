# Debug: Botão Transferir Departamento

## 🔍 **Logs de Debug Adicionados**

Adicionei logs de debug em pontos estratégicos para identificar onde está o problema:

### **1. Clique no Menu "Transferir departamento"**
```javascript
console.log('🖱️ [DEBUG] Menu Transferir departamento clicado');
console.log('🔄 [DEBUG] Contact encontrado:', contact);
console.log('🔄 [DEBUG] Lead encontrado:', lead);
console.log('🔄 [DEBUG] Lead ID definido:', leadId);
```

### **2. Clique no Botão "Transferir"**
```javascript
console.log('🖱️ [DEBUG] Botão Transferir clicado');
```

### **3. Execução da Função handleTransferDepartamento**
```javascript
console.log('🔄 [DEBUG] handleTransferDepartamento chamada');
console.log('🔄 [DEBUG] selectedLeadId:', selectedLeadId);
console.log('🔄 [DEBUG] selectedTransferDepartamento:', selectedTransferDepartamento);
console.log('🔄 [DEBUG] user?.id_cliente:', user?.id_cliente);
```

### **4. Execução do LeadsService**
```javascript
console.log('🔄 [DEBUG] LeadsService.updateLeadDepartamentoHistory chamada');
console.log('🔄 [DEBUG] leadId:', leadId);
console.log('🔄 [DEBUG] clientId:', clientId);
console.log('🔄 [DEBUG] departamentoId:', departamentoId);
```

## 🧪 **Como Testar**

1. **Abra o Console do Navegador** (F12 → Console)
2. **Vá para a página de Conversas**
3. **Selecione um contato que tenha lead associado**
4. **Clique no menu "..." (três pontos)**
5. **Clique em "Transferir departamento"**
6. **Observe os logs no console:**
   - Deve aparecer: `🖱️ [DEBUG] Menu Transferir departamento clicado`
   - Deve aparecer: `🔄 [DEBUG] Contact encontrado:` (com dados do contato)
   - Deve aparecer: `🔄 [DEBUG] Lead encontrado:` (com dados do lead)
   - Deve aparecer: `🔄 [DEBUG] Lead ID definido:` (com o ID do lead)

7. **No modal que abrir:**
   - Selecione um departamento diferente
   - Clique em "Transferir"
   - Observe os logs no console:
     - Deve aparecer: `🖱️ [DEBUG] Botão Transferir clicado`
     - Deve aparecer: `🔄 [DEBUG] handleTransferDepartamento chamada`
     - Deve aparecer os valores dos parâmetros

## 🎯 **O que Procurar**

### **Cenário 1: Menu não está sendo clicado**
- **Sintoma:** Nenhum log aparece quando clica no menu
- **Causa:** Problema com o evento de clique do menu

### **Cenário 2: Lead não está sendo encontrado**
- **Sintoma:** `🔄 [DEBUG] Lead encontrado: null`
- **Causa:** Problema na busca do lead pelo telefone

### **Cenário 3: Botão não está sendo clicado**
- **Sintoma:** Menu funciona, mas botão não gera logs
- **Causa:** Problema com o evento de clique do botão

### **Cenário 4: Validação falhando**
- **Sintoma:** `❌ [DEBUG] Validação falhou - função retornando`
- **Causa:** `selectedLeadId`, `selectedTransferDepartamento` ou `user?.id_cliente` está null/undefined

### **Cenário 5: Erro no Supabase**
- **Sintoma:** `❌ [DEBUG] Erro ao atualizar departamento do lead:`
- **Causa:** Problema na query do Supabase

## 📋 **Próximos Passos**

Com base nos logs que aparecerem no console, poderemos identificar exatamente onde está o problema e corrigi-lo adequadamente.

**Por favor, execute o teste e me informe quais logs aparecem no console!**







