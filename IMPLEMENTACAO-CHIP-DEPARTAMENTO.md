# IMPLEMENTAÇÃO: RELAÇÃO ENTRE DEPARTAMENTOS E CHIPS

## Resumo da Implementação

Esta implementação adiciona uma nova funcionalidade que permite associar departamentos a chips específicos (instâncias WhatsApp), determinando por qual instância as mensagens para contatos de cada departamento serão enviadas.

## Mudanças Implementadas

### 1. Estrutura do Banco de Dados

- **Coluna existente**: `instance_name_chip_associado` na tabela `departamento`
- **Tipo**: TEXT (nullable)
- **Funcionalidade**: Armazena o `instance_name` do chip associado ao departamento

### 2. Tipos e Interfaces

- **Arquivo**: `src/services/departamentosService.ts`
- **Mudança**: Atualizado tipo `Departamento` para incluir `instance_name_chip_associado`

- **Arquivo**: `src/services/chipsService.ts` (NOVO)
- **Funcionalidades**:
  - `getChipsDisponiveis()`: Busca chips disponíveis (instance_name não null)
  - `isDepartamentoAssociadoChip()`: Verifica se departamento já está associado
  - `getDepartamentosAssociadosChips()`: Busca departamentos já associados

### 3. Interface do Usuário

#### Lista de Departamentos (Principal)
- **Arquivo**: `src/pages/departamentos/index.tsx`
- **Mudanças**:
  - Adicionada coluna "Chip" na tabela com Select inline
  - Select permite escolher chip diretamente na tabela
  - Departamentos configurados em "Meus Chips" ficam desabilitados
  - Atualização em tempo real do chip associado
  - Indicação visual para departamentos configurados
  - **Layout melhorado**:
    - Distribuição equilibrada das colunas (1/3, 1/3, 1/4, 1/12)
    - Alinhamento centralizado para coluna "Chip"
    - Container responsivo com largura máxima
    - Select compacto (w-32) centralizado
    - Simplificação: mostra apenas "Chip 1" ou "Chip 2"

#### Modal de Departamento
- **Arquivo**: `src/pages/departamentos/DepartamentoModal.tsx`
- **Mudanças**:
  - Removido campo de chip (agora está na tabela principal)
  - Simplificado para apenas nome e descrição

## Lógica de Funcionamento

### 1. Disponibilidade de Chips
- Só mostra chips se `instance_name` (chip 1) ou `instance_name_2` (chip 2) não forem null
- Verifica na tabela `clientes_info` as colunas `instance_name` e `instance_name_2`

### 2. Associação de Departamentos
- **Departamentos configurados em "Meus Chips"**: 
  - Mostram o chip correto (1 ou 2) baseado na configuração
  - Ficam indisponíveis para edição (select desabilitado)
  - Indicados visualmente com fundo laranja
  - Chips são automaticamente definidos baseados em `id_departamento_chip_1` e `id_departamento_chip_2`
- **Outros departamentos**: Podem usar qualquer chip disponível (não é exclusivo 1:1)
- **Múltiplos departamentos**: Podem usar a mesma instância se selecionado pelo usuário

### 3. Persistência
- Ao selecionar um chip, salva o `instance_name` na coluna `instance_name_chip_associado`
- Permite remover associação selecionando "Nenhum chip"
- Departamentos configurados em "Meus Chips" mantêm sua configuração
- **Leads sem departamento**: Usam chip 1 por padrão automaticamente

## Próximos Passos

### 1. Lógica de Envio de Mensagens - IMPLEMENTADA ✅

A lógica foi implementada no `messageService.ts` com as seguintes funcionalidades:

```typescript
// Função para obter o chip associado ao departamento
async function getChipAssociadoDepartamento(idDepartamento: number | null): Promise<string | null> {
  // Se não há departamento, usar chip 1 por padrão
  if (!idDepartamento) {
    try {
      // Obter o usuário atual para buscar informações do cliente
      const { data: { user } } = await supabase.auth.getUser();
      
      // Buscar informações do cliente para obter o chip 1
      const { data: clientInfo } = await supabase
        .from('clientes_info')
        .select('instance_name')
        .eq('email', user.email)
        .single();
      
      if (!clientInfo?.instance_name) {
        throw new Error('Chip 1 não configurado para este cliente');
      }
      
      return clientInfo.instance_name; // Chip 1 por padrão
    } catch (error) {
      throw new Error('Chip 1 não configurado para este cliente');
    }
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

// Função para obter o departamento do lead
async function getDepartamentoLead(telefone: string): Promise<number | null> {
  const { data: lead } = await supabase
    .from('leads')
    .select('id_departamento')
    .eq('telefone', telefone)
    .single();
  
  return lead?.id_departamento || null;
}
```

### 2. Integração com Sistema de Mensagens - IMPLEMENTADA ✅

- **Todas as funções de envio** (`sendMessage`, `sendAudioMessage`, `sendImageMessage`, `sendDocumentMessage`, `sendVideoMessage`) foram atualizadas
- **Fluxo de envio**:
  1. Busca o departamento do lead pelo telefone
  2. Obtém o chip associado ao departamento
  3. **Leads sem departamento**: Usam chip 1 por padrão automaticamente
  4. **Departamentos com chip**: Usam o chip específico configurado
  5. **Departamentos sem chip**: Falham com mensagem específica
- **Mensagem de erro**: "Nenhum chip configurado para o envio de mensagem por este departamento. Vá na aba Departamentos e selecione um chip."

### 3. Configuração de Chips
- Implementar interface para configurar chips na seção de configurações
- Permitir associar departamentos diretamente na configuração do chip

## Execução dos Scripts

1. Execute o script SQL no Supabase:
```sql
-- Executar ADICIONAR-COLUNA-CHIP-DEPARTAMENTO.sql
```

2. Reinicie a aplicação para carregar as novas funcionalidades

## Testes Recomendados

1. **Criar departamento**: Deve funcionar normalmente (sem campo de chip no modal)
2. **Selecionar chip na tabela**: Deve atualizar em tempo real
3. **Departamentos configurados em "Meus Chips"**: Devem aparecer desabilitados
4. **Múltiplos departamentos com mesmo chip**: Deve permitir se selecionado pelo usuário
5. **Remover associação**: Deve permitir selecionar "Nenhum chip" no select
6. **Indicação visual**: Departamentos configurados devem mostrar "(Configurado)"

## Benefícios

- **Controle granular**: Cada departamento pode usar um chip específico
- **Flexibilidade**: Permite diferentes estratégias por departamento
- **Rastreabilidade**: Facilita identificar qual chip enviou cada mensagem
- **Escalabilidade**: Suporta múltiplos chips por cliente 