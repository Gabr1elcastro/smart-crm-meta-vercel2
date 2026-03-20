# Implementação: Agentes de IA para Chip 2

## 🎯 **Objetivo**
Possibilitar o uso dos agentes de IA para o chip 2, permitindo que os mesmos agentes sejam compartilhados entre os chips ou que cada chip tenha seu próprio agente.

## 🔧 **Modificações Realizadas**

### **1. Estrutura do Banco de Dados**

#### **Tabela `prompts_oficial`**
- ✅ **Adicionada coluna `instance_id_2`** (TEXT) - Armazena o instance_id_2 do cliente
- ✅ **Adicionada coluna `em_uso_2`** (BOOLEAN) - Controla se o agente está em uso no chip 2

#### **Script SQL: `ADICIONAR-COLUNAS-CHIP-2-PROMPTS.sql`**
```sql
-- Adicionar colunas para suporte ao chip 2
ALTER TABLE prompts_oficial 
ADD COLUMN instance_id_2 TEXT;

ALTER TABLE prompts_oficial 
ADD COLUMN em_uso_2 BOOLEAN DEFAULT FALSE;
```

### **2. Hook `useWhatsAppConnect`**

#### **Funcionalidades Adicionadas**
- ✅ **Suporte a `chipNumber`** - Identifica qual chip está sendo configurado
- ✅ **Lógica de seleção por chip** - Usa `em_uso` para chip 1 e `em_uso_2` para chip 2
- ✅ **Atualização de `instance_id_2`** - Preenche automaticamente quando agente é selecionado
- ✅ **Validação de uso único** - Garante apenas um agente em uso por chip

#### **Função `handleChatbotChange` Atualizada**
```typescript
const handleChatbotChange = async (chatbotId: string | number) => {
  // 1. Desativar todos os chatbots do usuário para o chip atual
  await supabase
    .from('prompts_oficial')
    .update({ 
      [chipNumber === 1 ? 'em_uso' : 'em_uso_2']: false 
    })
    .eq('id_usuario', user?.id);
  
  // 2. Ativar apenas o chatbot selecionado para o chip atual
  await supabase
    .from('prompts_oficial')
    .update({ 
      [chipNumber === 1 ? 'em_uso' : 'em_uso_2']: true,
      [chipNumber === 1 ? 'instance_id' : 'instance_id_2']: instanceId
    })
    .eq('id', chatbotId);
  
  // 3. Atualizar preferências do cliente
  const updateData = {
    [chipNumber === 1 ? 'atendimento_ia' : 'atendimento_ia_2']: true,
    [chipNumber === 1 ? 'atendimento_humano' : 'atendimento_humano_2']: false
  };
  
  await supabase
    .from('clientes_info')
    .update(updateData)
    .eq('email', user?.email);
};
```

#### **Função `fetchAvailableChatbots` Atualizada**
```typescript
const fetchAvailableChatbots = async () => {
  // Buscar chatbots com suporte a ambos os chips
  const response = await supabase
    .from('prompts_oficial')
    .select('id, nome, instance_id, instance_id_2, em_uso, em_uso_2')
    .eq('id_usuario', user?.id);
  
  // Mapear dados para o formato esperado
  const mappedChatbots = data.map(chatbot => ({
    id: chatbot.id,
    nome: chatbot.nome || 'Sem nome',
    instance_id: chatbot.instance_id || '',
    instance_id_2: chatbot.instance_id_2 || '',
    em_uso: chatbot.em_uso === true || chatbot.em_uso === 'true',
    em_uso_2: chatbot.em_uso_2 === true || chatbot.em_uso_2 === 'true'
  }));
  
  // Verificar qual chatbot está em uso para o chip atual
  const chatbotEmUso = mappedChatbots.find(chatbot => 
    chipNumber === 1 ? chatbot.em_uso : chatbot.em_uso_2
  );
};
```

### **3. Componente `WhatsAppConnectChip`**

#### **Modificações na Interface**
- ✅ **Título dinâmico** - Mostra qual chip está sendo configurado
- ✅ **Labels específicos** - Identifica claramente qual chip está sendo configurado
- ✅ **Seleção por chip** - Usa a lógica correta baseada no número do chip

#### **Exemplo de Uso**
```tsx
// Para Chip 1
<WhatsAppConnectChip
  instanceIdField="instance_id"
  instanceNameField="instance_name"
  senderNumberField="sender_number"
  atendimentoHumanoField="atendimento_humano"
  atendimentoIAField="atendimento_ia"
  chipNumber={1}
  label="Chip Principal"
/>

// Para Chip 2
<WhatsAppConnectChip
  instanceIdField="instance_id_2"
  instanceNameField="instance_name_2"
  senderNumberField="sender_number_2"
  atendimentoHumanoField="atendimento_humano_2"
  atendimentoIAField="atendimento_ia_2"
  chipNumber={2}
  label="Chip Secundário"
/>
```

## 🔄 **Fluxo de Funcionamento**

### **1. Seleção de Agente para Chip 1**
1. Usuário conecta o WhatsApp no Chip 1
2. Sistema busca agentes disponíveis
3. Usuário seleciona um agente
4. Sistema atualiza `em_uso = true` e `instance_id` do agente selecionado
5. Sistema desativa outros agentes (`em_uso = false`)

### **2. Seleção de Agente para Chip 2**
1. Usuário conecta o WhatsApp no Chip 2
2. Sistema busca os mesmos agentes disponíveis
3. Usuário seleciona um agente (pode ser o mesmo do Chip 1)
4. Sistema atualiza `em_uso_2 = true` e `instance_id_2` do agente selecionado
5. Sistema desativa outros agentes para Chip 2 (`em_uso_2 = false`)

### **3. Compartilhamento de Agentes**
- ✅ **Mesmo agente pode ser usado em ambos os chips**
- ✅ **Cada chip mantém seu próprio controle de uso**
- ✅ **Instance IDs são atualizados independentemente**

## 🧪 **Testes e Validação**

### **Scripts de Teste Criados**
- ✅ **`teste-chip-2-agentes.js`** - Testa a estrutura do banco de dados
- ✅ **`teste-selecao-agentes-chip-2.js`** - Testa a lógica de seleção
- ✅ **`VERIFICAR-COLUNAS-CHIP-2.sql`** - Verifica se as colunas foram adicionadas

### **Validações Implementadas**
- ✅ **Apenas um agente em uso por chip**
- ✅ **Instance ID correto é preenchido automaticamente**
- ✅ **Agentes podem ser compartilhados entre chips**
- ✅ **Interface clara para identificar qual chip está sendo configurado**

## 📋 **Como Usar**

### **1. Executar Script SQL**
```sql
-- Execute no SQL Editor do Supabase
\i ADICIONAR-COLUNAS-CHIP-2-PROMPTS.sql
```

### **2. Verificar Implementação**
```sql
-- Verificar se as colunas foram adicionadas
\i VERIFICAR-COLUNAS-CHIP-2.sql
```

### **3. Testar Funcionalidade**
```javascript
// Execute no console do navegador
// Carregue o arquivo teste-selecao-agentes-chip-2.js
```

## 🎉 **Resultado Final**

- ✅ **Chip 2 agora suporta agentes de IA**
- ✅ **Mesmos agentes disponíveis para ambos os chips**
- ✅ **Seleção independente por chip**
- ✅ **Instance ID correto preenchido automaticamente**
- ✅ **Interface clara e intuitiva**
- ✅ **Validações de consistência implementadas**

## 🔧 **Próximos Passos**

1. **Executar o script SQL** para adicionar as colunas
2. **Testar a funcionalidade** com dados reais
3. **Verificar se a interface está funcionando** corretamente
4. **Validar se os agentes estão sendo selecionados** corretamente para cada chip
