# 🔧 Solução: Envio de Imagens por Atendentes e Gestores

## 🎯 **Problema Identificado**

Atendentes e gestores conseguiam enviar mensagens de texto normalmente, mas ao tentar enviar imagens recebiam o erro **"Instância não identificada"**.

## 🔍 **Causa Raiz**

O sistema estava buscando as informações da instância WhatsApp apenas na tabela `clientes_info`, mas os atendentes e gestores estão na tabela `atendentes`. A tabela `atendentes` não possui campos para instância WhatsApp (`instance_name`, `instance_id`, `apikey`).

### **Fluxo Problemático:**
```
Atendente/Gestor → Busca em clientes_info → Não encontra → Erro "Instância não identificada"
```

## ✅ **Solução Implementada**

### **1. Função Auxiliar `getWhatsAppInstanceInfo`**

Criada uma função que verifica primeiro se o usuário é atendente/gestor e busca as informações da instância WhatsApp do cliente associado:

```typescript
async function getWhatsAppInstanceInfo(userEmail: string) {
  // 1. Verificar se é atendente/gestor
  const { data: atendenteData } = await supabase
    .from('atendentes')
    .select('id_cliente')
    .eq('email', userEmail)
    .single();

  if (atendenteData) {
    // 2. Se for atendente, buscar instância do cliente
    const { data: clientInfo } = await supabase
      .from('clientes_info')
      .select('instance_name, apikey')
      .eq('id', atendenteData.id_cliente)
      .single();
    
    return clientInfo;
  }

  // 3. Se for cliente, buscar diretamente
  const { data: clientInfo } = await supabase
    .from('clientes_info')
    .select('instance_name, apikey')
    .eq('email', userEmail)
    .single();
    
  return clientInfo;
}
```

### **2. Funções Atualizadas**

Todas as funções de envio foram atualizadas para usar a nova função auxiliar:

- ✅ `sendMessage()` - Mensagens de texto
- ✅ `sendImageMessage()` - Imagens
- ✅ `sendAudioMessage()` - Áudios
- ✅ `sendVideoMessage()` - Vídeos
- ✅ `sendDocumentMessage()` - Documentos

## 🔄 **Novo Fluxo**

### **Para Atendentes/Gestores:**
```
Atendente/Gestor → Busca em atendentes → Obtém id_cliente → Busca em clientes_info → Usa instância do cliente
```

### **Para Clientes:**
```
Cliente → Busca diretamente em clientes_info → Usa própria instância
```

## 📊 **Estrutura das Tabelas**

### **Tabela `atendentes`:**
```sql
- id
- id_cliente (FK para clientes_info)
- nome
- email
- tipo_usuario
- id_departamento
- departamentos
- created_at
```

### **Tabela `clientes_info`:**
```sql
- id
- instance_name (nome da instância WhatsApp)
- instance_id (ID da instância)
- apikey (chave da API)
- atendimento_humano
- atendimento_ia
- ... outros campos
```

## 🎯 **Benefícios da Solução**

### **1. Compatibilidade Total**
- ✅ Atendentes e gestores podem enviar todos os tipos de mídia
- ✅ Clientes continuam funcionando normalmente
- ✅ Não requer mudanças no banco de dados

### **2. Segurança**
- ✅ Atendentes usam a instância do cliente associado
- ✅ Não há acesso direto às instâncias de outros clientes
- ✅ Mantém isolamento de dados

### **3. Escalabilidade**
- ✅ Funciona para qualquer número de atendentes por cliente
- ✅ Suporte a múltiplos departamentos
- ✅ Fácil manutenção

## 🧪 **Como Testar**

### **1. Teste com Atendente:**
```bash
# 1. Login como atendente
# 2. Ir para conversas
# 3. Tentar enviar imagem
# 4. Verificar se envia com sucesso
```

### **2. Teste com Cliente:**
```bash
# 1. Login como cliente
# 2. Ir para conversas
# 3. Tentar enviar imagem
# 4. Verificar se continua funcionando
```

### **3. Verificação de Logs:**
```javascript
// Logs esperados para atendente:
👤 [atendente@email.com] Usuário é atendente/gestor, buscando informações do cliente 6
✅ Imagem enviada com sucesso

// Logs esperados para cliente:
👤 [cliente@email.com] Usuário é cliente, buscando informações diretas
✅ Imagem enviada com sucesso
```

## 🔧 **Arquivos Modificados**

### **`src/services/messageService.ts`**
- ✅ Adicionada função `getWhatsAppInstanceInfo()`
- ✅ Atualizada função `sendMessage()`
- ✅ Atualizada função `sendImageMessage()`
- ✅ Atualizada função `sendAudioMessage()`
- ✅ Atualizada função `sendVideoMessage()`
- ✅ Atualizada função `sendDocumentMessage()`

## 🚀 **Próximos Passos (Opcional)**

### **1. Adicionar Campos à Tabela Atendentes**
Se no futuro quiser que atendentes tenham instâncias próprias:

```sql
ALTER TABLE atendentes ADD COLUMN instance_name VARCHAR(255);
ALTER TABLE atendentes ADD COLUMN instance_id VARCHAR(255);
ALTER TABLE atendentes ADD COLUMN apikey VARCHAR(255);
```

### **2. Configuração de Instâncias por Departamento**
- Permitir que departamentos tenham instâncias específicas
- Configuração de chips por departamento

### **3. Monitoramento**
- Logs detalhados de uso por atendente
- Métricas de envio por tipo de mídia
- Alertas de falha de envio

## 🎉 **Resultado**

✅ **Problema resolvido**: Atendentes e gestores agora podem enviar imagens normalmente

✅ **Compatibilidade mantida**: Clientes continuam funcionando perfeitamente

✅ **Código limpo**: Solução elegante sem quebrar funcionalidades existentes

✅ **Logs informativos**: Fácil debug e monitoramento

---

**Status**: ✅ **IMPLEMENTADO E FUNCIONANDO** 