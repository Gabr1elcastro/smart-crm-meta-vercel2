# Instruções: Teste do Botão Transferir Departamento

## 🎯 **Fluxo Correto do Teste**

O botão "Transferir" só funciona **DEPOIS** que você:
1. **Clica no menu "..." (três pontos)** do contato
2. **Clica em "Transferir departamento"** 
3. **Seleciona um departamento** no modal
4. **Clica no botão "Transferir"**

## 🧪 **Teste Passo a Passo**

### **Passo 1: Abrir o Modal**
1. **Abra o Console do Navegador** (F12 → Console)
2. **Vá para Conversas**
3. **Selecione um contato que tenha lead associado**
4. **Clique no menu "..." (três pontos) do contato**
5. **Clique em "Transferir departamento"**

**Logs esperados:**
```
🖱️ [DEBUG] Menu Transferir departamento clicado
🔄 [DEBUG] selectedContact: [ID do contato]
🔄 [DEBUG] Contact encontrado: [dados do contato]
🔄 [DEBUG] Lead encontrado (busca correta): [lead ou null]
🔄 [DEBUG] Lead ID definido: [ID do lead ou null]
🔄 [DEBUG] handleOpenTransferModal chamada
🔄 [DEBUG] selectedLeadId antes de abrir modal: [ID do lead ou null]
✅ [DEBUG] Modal aberto com sucesso
```

### **Passo 2: Selecionar Departamento**
1. **No modal que abriu, selecione um departamento**
2. **Clique no botão "Transferir"**

**Logs esperados:**
```
🖱️ [DEBUG] Botão Transferir clicado
🔄 [DEBUG] handleTransferDepartamento chamada
🔄 [DEBUG] selectedLeadId: [ID do lead - NÃO deve ser null]
🔄 [DEBUG] selectedTransferDepartamento: [ID do departamento]
🔄 [DEBUG] user?.id_cliente: [ID do cliente]
✅ [DEBUG] Validação passou - iniciando transferência
```

## ❌ **Problema Atual**

Você está pulando o **Passo 1** e indo direto para o **Passo 2**. Por isso:
- `selectedLeadId` está `null`
- A validação falha
- A transferência não acontece

## 🔍 **O que Investigar**

Se você seguir o fluxo correto e ainda assim o `selectedLeadId` for `null`, então o problema está na busca do lead no **Passo 1**.

**Por favor, siga o fluxo completo e me informe todos os logs que aparecem!**







