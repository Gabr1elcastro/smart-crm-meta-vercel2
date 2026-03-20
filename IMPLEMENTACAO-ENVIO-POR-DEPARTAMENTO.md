# Implementação: Envio de Mensagens por Departamento

## 🎯 **Problema Identificado**
O sistema não estava respeitando a regra de envio baseada na associação entre departamentos e chips. As mensagens eram sempre enviadas pelo chip padrão, independentemente do departamento do lead.

## 🔧 **Solução Implementada**

### **1. Estrutura do Banco de Dados**

#### **Tabela `departamento`**
- ✅ **Coluna existente**: `instance_name_chip_associado` (TEXT) - Armazena o nome da instância associada ao chip
- ✅ **Funcionalidade**: Determina qual chip usar para enviar mensagens para leads deste departamento

#### **Tabela `prompts_oficial`**
- ✅ **Nova coluna**: `instance_name_chip_associado` (TEXT) - Armazena o nome da instância associada ao agente
- ✅ **Funcionalidade**: Permite rastrear qual instância está associada a cada agente

### **2. Lógica de Envio Implementada**

#### **Fluxo de Decisão do Chip**
1. **Lead com departamento**:
   - Busca o departamento do lead pelo telefone
   - Verifica se o departamento tem `instance_name_chip_associado` configurado
   - Se sim: usa o chip associado ao departamento
   - Se não: retorna erro específico

2. **Lead sem departamento**:
   - Usa o chip 1 (`instance_name`) por padrão
   - Funciona para leads que não foram associados a nenhum departamento

3. **Departamento sem chip associado**:
   - Retorna erro: "Nenhum chip configurado para o envio de mensagem por este departamento. Vá na aba Departamentos e selecione um chip."

### **3. Funções Implementadas**

#### **`getDepartamentoLead(telefone: string)`**
```typescript
// Busca o departamento do lead pelo telefone
async function getDepartamentoLead(telefone: string): Promise<number | null> {
  const { data: lead, error } = await supabase
    .from('leads')
    .select('id_departamento')
    .eq('telefone', telefone)
    .single();
  
  return lead?.id_departamento || null;
}
```

#### **`getChipAssociadoDepartamento(idDepartamento: number | null)`**
```typescript
// Obtém o chip associado ao departamento
async function getChipAssociadoDepartamento(idDepartamento: number | null): Promise<string | null> {
  // Se não há departamento, usar chip 1 por padrão
  if (!idDepartamento) {
    return await getChip1Padrao();
  }
  
  // Buscar o departamento e seu chip associado
  const { data: departamento } = await supabase
    .from('departamento')
    .select('instance_name_chip_associado')
    .eq('id', idDepartamento)
    .single();
  
  if (!departamento?.instance_name_chip_associado) {
    throw new Error("Nenhum chip configurado para o envio de mensagem por este departamento. Vá na aba Departamentos e selecione um chip.");
  }
  
  return departamento.instance_name_chip_associado;
}
```

#### **`getChipCorretoParaLead(telefone: string)`**
```typescript
// Função principal que determina qual chip usar
async function getChipCorretoParaLead(telefone: string): Promise<string | null> {
  // 1. Consulta o lead
  const idDepartamento = await getDepartamentoLead(telefone);
  
  // 2. Obtém o chip associado ao departamento
  const instanceName = await getChipAssociadoDepartamento(idDepartamento);
  
  return instanceName;
}
```

### **4. Atualizações no Sistema de Mensagens**

#### **Todas as funções de envio atualizadas**:
- ✅ `sendMessage()` - Mensagens de texto
- ✅ `sendAudioMessage()` - Mensagens de áudio
- ✅ `sendImageMessage()` - Mensagens de imagem
- ✅ `sendDocumentMessage()` - Mensagens de documento

#### **Mudança na lógica**:
```typescript
// ANTES (sempre chip padrão)
const instanceName = await getChipPadraoCliente();

// DEPOIS (chip baseado no departamento)
const instanceName = await getChipCorretoParaLead(number);
```

### **5. Atualização do Hook `useWhatsAppConnect`**

#### **Preenchimento automático da coluna `instance_name_chip_associado`**:
```typescript
// Quando um agente é selecionado, preenche automaticamente
const { data, error } = await supabase
  .from('prompts_oficial')
  .update({ 
    [chipNumber === 1 ? 'em_uso' : 'em_uso_2']: true,
    [chipNumber === 1 ? 'instance_id' : 'instance_id_2']: instanceId,
    instance_name_chip_associado: instanceName  // ← NOVO
  })
  .eq('id', chatbotId);
```

## 🧪 **Testes e Validação**

### **Scripts de Teste Criados**
- ✅ **`teste-envio-por-departamento.js`** - Testa a lógica de seleção de chip
- ✅ **`VERIFICAR-ENVIO-POR-DEPARTAMENTO.sql`** - Verifica estrutura e dados

### **Cenários de Teste**
1. **Lead com departamento configurado** → Usa chip do departamento
2. **Lead com departamento sem chip** → Retorna erro específico
3. **Lead sem departamento** → Usa chip 1 por padrão
4. **Departamento sem chip associado** → Retorna erro específico

## 📋 **Como Usar**

### **1. Executar Scripts SQL**
```sql
-- Adicionar coluna na tabela prompts_oficial
\i ADICIONAR-COLUNA-INSTANCE-NAME-CHIP-ASSOCIADO.sql

-- Verificar implementação
\i VERIFICAR-ENVIO-POR-DEPARTAMENTO.sql
```

### **2. Configurar Departamentos**
1. Vá para a aba "Departamentos"
2. Selecione um chip para cada departamento
3. O sistema salvará o `instance_name_chip_associado`

### **3. Testar Envio**
1. Vá para "Conversas"
2. Selecione um lead com departamento
3. Tente enviar uma mensagem
4. O sistema usará o chip correto automaticamente

## 🎉 **Resultado Final**

- ✅ **Sistema respeita associação departamento-chip**
- ✅ **Leads sem departamento usam chip 1 por padrão**
- ✅ **Departamentos sem chip retornam erro específico**
- ✅ **Todas as funções de envio atualizadas**
- ✅ **Logs detalhados para debug**
- ✅ **Tratamento de erros específico**

## 🔄 **Fluxo de Funcionamento**

### **Cenário 1: Lead com Departamento Configurado**
1. Lead tem `id_departamento = 5`
2. Departamento 5 tem `instance_name_chip_associado = "smartcrm_123_vendas"`
3. Mensagem é enviada usando `smartcrm_123_vendas`

### **Cenário 2: Lead com Departamento sem Chip**
1. Lead tem `id_departamento = 3`
2. Departamento 3 tem `instance_name_chip_associado = NULL`
3. Envio falha com: "Nenhum chip configurado para o envio de mensagem por este departamento. Vá na aba Departamentos e selecione um chip."

### **Cenário 3: Lead sem Departamento**
1. Lead tem `id_departamento = NULL`
2. Sistema usa chip 1 (`instance_name`) por padrão
3. Mensagem é enviada usando o chip 1

## 🚀 **Próximos Passos**

1. **Executar os scripts SQL** para adicionar as colunas necessárias
2. **Testar a funcionalidade** com dados reais
3. **Configurar departamentos** com seus respectivos chips
4. **Verificar se as mensagens** estão sendo enviadas pelo chip correto
5. **Monitorar logs** para identificar possíveis problemas
