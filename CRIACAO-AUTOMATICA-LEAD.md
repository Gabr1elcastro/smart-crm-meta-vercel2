# 🔄 Criação Automática de Lead

## 📋 **Visão Geral**

A **criação automática de lead** é um mecanismo inteligente que cria automaticamente um registro na tabela `leads` quando um usuário tenta iniciar um atendimento humano para um contato que ainda não possui um lead cadastrado no sistema.

## 🎯 **Quando Acontece**

### **Trigger Principal**
- **Ação**: Usuário clica no botão "Transferir para Humano"
- **Função**: `handleHumanAttendance`
- **Condição**: Lead não existe para o contato específico

### **Fluxo de Verificação**
```typescript
// 1. Busca o lead existente
const { data: leadData, error: fetchError } = await supabase
  .from('leads')
  .select('*')
  .eq('telefone', phoneNumber)
  .eq('id_cliente', user.id_cliente)
  .maybeSingle();

// 2. Se não encontrar lead (leadData é null)
if (!leadData) {
  // ✅ CRIAÇÃO AUTOMÁTICA ACONTECE AQUI
}
```

## 🔧 **Como Funciona**

### **1. Normalização do Telefone**
```typescript
const phoneNumber = normalizePhone(contact.telefone_id);
```
- Remove sufixo `@s.whatsapp.net`
- Padroniza formato do número

### **2. Busca do Lead Existente**
```typescript
const { data: leadData, error: fetchError } = await supabase
  .from('leads')
  .select('*')
  .eq('telefone', phoneNumber)
  .eq('id_cliente', user.id_cliente)
  .maybeSingle();
```
- Busca por telefone + id_cliente
- Usa `maybeSingle()` para não dar erro se não encontrar

### **3. Criação Automática (Se Lead Não Existe)**
```typescript
if (!leadData) {
  console.log('Lead não encontrado, criando novo lead...');
  
  const { data: newLead, error: createError } = await supabase
    .from('leads')
    .insert({
      telefone: phoneNumber,
      nome: contact?.name || `Contato ${phoneNumber.slice(-4)}`,
      id_cliente: user.id_cliente,
      status_conversa: 'Em andamento',
      status: 'Leads',
      origem: 'WhatsApp',
      atendimento_humano: true,    // ✅ Configurado automaticamente
      atendimento_ia: false,       // ✅ Configurado automaticamente
      created_at: new Date().toISOString()
    })
    .select()
    .single();
}
```

## 📊 **Dados Criados Automaticamente**

### **Campos Obrigatórios**
| Campo | Valor | Descrição |
|-------|-------|-----------|
| `telefone` | `phoneNumber` | Número normalizado do contato |
| `nome` | `contact?.name` ou `Contato ${phoneNumber.slice(-4)}` | Nome do contato ou fallback |
| `id_cliente` | `user.id_cliente` | ID do cliente logado |
| `status_conversa` | `'Em andamento'` | Status inicial da conversa |
| `status` | `'Leads'` | Status padrão do lead |
| `origem` | `'WhatsApp'` | Origem da conversa |
| `atendimento_humano` | `true` | ✅ Configurado para atendimento humano |
| `atendimento_ia` | `false` | ✅ Configurado para não ser IA |
| `created_at` | `new Date().toISOString()` | Timestamp de criação |

### **Fallback para Nome**
```typescript
nome: contact?.name || `Contato ${phoneNumber.slice(-4)}`
```
- **Prioridade**: Nome do contato no WhatsApp
- **Fallback**: "Contato" + últimos 4 dígitos do telefone

## 🔄 **Fluxo Completo**

### **Cenário 1: Lead Não Existe**
```
1. Usuário clica "Transferir para Humano"
2. Sistema busca lead por telefone + id_cliente
3. Lead não encontrado (null)
4. ✅ CRIAÇÃO AUTOMÁTICA
   - Insere novo lead com dados básicos
   - Configura atendimento_humano: true
   - Configura atendimento_ia: false
5. Atualiza interface
6. Mostra toast de sucesso
```

### **Cenário 2: Lead Já Existe**
```
1. Usuário clica "Transferir para Humano"
2. Sistema busca lead por telefone + id_cliente
3. Lead encontrado
4. ✅ ATUALIZAÇÃO DO LEAD EXISTENTE
   - Atualiza atendimento_humano: true
   - Atualiza atendimento_ia: false
   - Atualiza status_conversa: 'Em andamento'
5. Atualiza interface
6. Mostra toast de sucesso
```

## 🎯 **Vantagens do Sistema**

### **1. Experiência do Usuário**
- ✅ **Sem interrupção**: Não precisa criar lead manualmente
- ✅ **Fluxo contínuo**: Atendimento inicia imediatamente
- ✅ **Dados automáticos**: Preenche informações básicas

### **2. Integridade dos Dados**
- ✅ **Dados consistentes**: Todos os leads têm campos obrigatórios
- ✅ **Rastreabilidade**: Origem sempre marcada como "WhatsApp"
- ✅ **Status correto**: Sempre inicia como "Em andamento"

### **3. Flexibilidade**
- ✅ **Nome inteligente**: Usa nome do WhatsApp ou fallback
- ✅ **Telefone normalizado**: Formato padronizado
- ✅ **Cliente correto**: Sempre associa ao cliente logado

## ⚠️ **Considerações Importantes**

### **1. Validações**
```typescript
if (!selectedContact || !user?.id_cliente) {
  toast.error('Erro: informações incompletas');
  return;
}
```

### **2. Tratamento de Erros**
```typescript
if (createError) {
  console.error('Erro ao criar lead:', createError);
  toast.error('Erro ao criar novo contato');
  return;
}
```

### **3. Atualização da Interface**
```typescript
// Atualiza mapa de status local
setContactStatusMap(prev => ({
  ...prev,
  [normalizedPhone]: 'Em andamento'
}));

// Recarrega dados de todos os contatos
const phones = contacts.map(c => c.telefone_id);
await fetchAttendancesForContacts(phones);
```

## 🔍 **Logs e Debug**

### **Logs de Criação**
```typescript
console.log('Lead não encontrado, criando novo lead...');
console.log('Lead criado com sucesso:', newLead);
```

### **Logs de Erro**
```typescript
console.error('Erro ao buscar lead:', fetchError);
console.error('Erro ao criar lead:', createError);
```

## 📝 **Exemplo Prático**

### **Cenário Real**
1. **Contato**: João Silva (WhatsApp)
2. **Telefone**: +55 11 99999-8888
3. **Ação**: Usuário clica "Transferir para Humano"
4. **Resultado**: Lead criado automaticamente

### **Lead Criado**
```json
{
  "id": 123,
  "telefone": "11999998888",
  "nome": "João Silva",
  "id_cliente": 6,
  "status_conversa": "Em andamento",
  "status": "Leads",
  "origem": "WhatsApp",
  "atendimento_humano": true,
  "atendimento_ia": false,
  "created_at": "2025-01-27T10:30:00.000Z"
}
```

## ✅ **Resumo**

A **criação automática de lead** é um sistema inteligente que:

1. **Detecta** quando não existe lead para um contato
2. **Cria** automaticamente um lead com dados básicos
3. **Configura** atendimento humano por padrão
4. **Atualiza** a interface sem interrupção
5. **Garante** integridade dos dados

**É uma funcionalidade que melhora significativamente a experiência do usuário, eliminando a necessidade de criação manual de leads durante o atendimento.** 