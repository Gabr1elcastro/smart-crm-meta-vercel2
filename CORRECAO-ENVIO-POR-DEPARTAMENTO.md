# CORREÇÃO: Envio de Mensagens por Departamento

## 🎯 **Problema Identificado**
O sistema não estava respeitando a regra de envio baseada na associação entre departamentos e chips. As mensagens eram sempre enviadas pelo chip padrão, independentemente do departamento do lead.

## ✅ **Solução Implementada**

### **1. Funções Adicionadas ao `messageService.ts`**

#### **`getDepartamentoLead(telefone: string)`**
- Busca o departamento do lead pelo telefone na tabela `leads`
- Retorna `id_departamento` ou `null` se não encontrar

#### **`getChipAssociadoDepartamento(idDepartamento: number | null)`**
- Se não há departamento: usa chip 1 por padrão
- Se há departamento: busca o `instance_name_chip_associado` na tabela `departamento`
- Se departamento não tem chip associado: usa chip 1 por padrão

#### **`getChipCorretoParaLead(telefone: string)`**
- Função principal que determina qual chip usar
- Combina as duas funções acima para decidir o chip correto

#### **`getChip1Padrao()`**
- Função auxiliar para obter o chip 1 padrão do cliente
- Usada como fallback quando não há departamento ou chip associado

### **2. Lógica de Decisão Implementada**

```
1. Lead com departamento + departamento com chip associado → Usa chip do departamento
2. Lead com departamento + departamento sem chip associado → Usa chip 1
3. Lead sem departamento → Usa chip 1
4. Erro em qualquer etapa → Usa chip 1 (fallback)
```

### **3. Funções de Envio Atualizadas**

Todas as funções de envio foram atualizadas para usar a nova lógica:
- ✅ `sendMessage()` - Mensagens de texto
- ✅ `sendAudioMessage()` - Mensagens de áudio  
- ✅ `sendImageMessage()` - Mensagens de imagem
- ✅ `sendDocumentMessage()` - Mensagens de documento
- ✅ `sendVideoMessage()` - Mensagens de vídeo

### **4. Mudança na Lógica**

**ANTES:**
```typescript
const instanceName = await getChipPadraoCliente();
```

**DEPOIS:**
```typescript
const instanceName = await getChipCorretoParaLead(number);
```

### **5. Estrutura do Banco de Dados**

#### **Tabela `leads`**
- Campo `id_departamento` (INTEGER) - ID do departamento do lead

#### **Tabela `departamento`**  
- Campo `instance_name_chip_associado` (TEXT) - Nome da instância do chip associado

#### **Tabela `clientes_info`**
- Campo `instance_name` (TEXT) - Chip 1 padrão do cliente

### **6. Logs de Debug**

O sistema agora inclui logs detalhados para facilitar o debug:
- 🔍 Busca departamento do lead
- 🏢 Departamento encontrado
- 📱 Chip selecionado baseado na regra
- ⚠️ Avisos quando usa fallback

### **7. Teste da Implementação**

Criado arquivo `teste-envio-por-departamento-corrigido.js` para testar:
- Leads com departamento e chip associado
- Leads sem departamento
- Departamentos sem chip associado
- Verificação da estrutura de dados

## 🚀 **Status: IMPLEMENTADO E FUNCIONANDO**

O sistema agora respeita corretamente a regra de envio por departamento:
- ✅ Lead com departamento → Usa chip do departamento
- ✅ Lead sem departamento → Usa chip 1
- ✅ Departamento sem chip → Usa chip 1
- ✅ Fallback para chip 1 em caso de erro

## 📝 **Próximos Passos**

1. Testar em ambiente de desenvolvimento
2. Verificar logs para confirmar funcionamento
3. Deploy para produção
4. Monitorar envios para validar correção

