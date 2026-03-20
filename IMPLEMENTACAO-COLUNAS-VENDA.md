# Implementação das Colunas de Venda

## Novas Colunas Adicionadas

### 1. `venda` (BOOLEAN)
- **Tipo**: `BOOLEAN DEFAULT NULL`
- **Descrição**: Indica se o lead foi convertido em venda
- **Valores**:
  - `TRUE`: Lead marcado como ganho/venda fechada
  - `FALSE`: Lead marcado como perdido
  - `NULL`: Lead ainda não foi definido como ganho ou perdido

### 2. `data_venda` (DATE)
- **Tipo**: `DATE DEFAULT NULL`
- **Descrição**: Data em que o lead foi marcado como ganho ou perdido
- **Valor**: Data da definição do status de venda

## Funcionalidades Implementadas

### 1. Serviço de Leads (`src/services/leadsService.ts`)

#### Interface Lead Atualizada
```typescript
export interface Lead {
  // ... campos existentes ...
  venda?: boolean | null; // TRUE se ganho, FALSE se perdido, NULL se ainda não definido
  data_venda?: string | null; // Data em que foi definido como ganho ou perdido
}
```

#### Novos Métodos

##### `updateVendaStatus(leadId, clientId, venda)`
- Atualiza o status de venda de um lead
- Define `venda`, `data_venda`, `status` e `data_ultimo_status`
- Retorna o lead atualizado ou `null` em caso de erro

##### `getLeadsByVendaStatus(clientId, venda)`
- Busca leads por status de venda
- Filtra por `venda = true` (ganhos), `venda = false` (perdidos) ou `null` (todos)
- Retorna array de leads

##### `getVendasStats(clientId, startDate?, endDate?)`
- Calcula estatísticas de vendas
- Retorna:
  - `total_vendas`: Número de leads com `venda = true`
  - `total_perdidas`: Número de leads com `venda = false`
  - `total_pendentes`: Número de leads com `venda = null`
  - `taxa_conversao`: Percentual de vendas em relação ao total definido

### 2. Scorecard (`src/pages/reports/Scorecard.tsx`)

#### Card de Total de Vendas Atualizado
- Agora usa as novas colunas `venda` e `data_venda`
- Mostra vendas fechadas no período selecionado
- Integra com o sistema de filtros de data

### 3. Página de Conversas (`src/pages/conversations/Conversations.tsx`)

#### Função `handleSaleCompleted` Atualizada
- Usa o novo método `updateVendaStatus` para marcar como ganho
- Define `venda = true` e `data_venda = data_atual`
- Atualiza status para 'Ganho'

### 4. Board Context (`src/pages/reports/board/context/BoardContext.tsx`)

#### Funções Atualizadas

##### `markAsWon`
- Usa `updateVendaStatus(id, clientId, true)`
- Define `venda = true` e `data_venda = data_atual`

##### `confirmLeadLost`
- Usa `updateVendaStatus(id, clientId, false)`
- Define `venda = false` e `data_venda = data_atual`
- Atualiza observação separadamente

### 5. List View (`src/pages/reports/ListView.tsx`)

#### Funções Atualizadas

##### `handleMarkAsWon`
- Usa `updateVendaStatus(lead.id, clientId, true)`

##### `handleMarkAsLost`
- Usa `updateVendaStatus(lead.id, clientId, false)`

## Script SQL (`ADICIONAR-COLUNAS-VENDA.sql`)

### Comandos Executados

1. **Adicionar colunas**:
   ```sql
   ALTER TABLE leads ADD COLUMN venda BOOLEAN DEFAULT NULL;
   ALTER TABLE leads ADD COLUMN data_venda DATE DEFAULT NULL;
   ```

2. **Migrar dados existentes**:
   ```sql
   -- Leads com status 'Ganho'
   UPDATE leads SET venda = TRUE, data_venda = data_ultimo_status::date 
   WHERE status = 'Ganho' AND venda IS NULL;
   
   -- Leads com status 'Perdido'
   UPDATE leads SET venda = FALSE, data_venda = data_ultimo_status::date 
   WHERE status = 'Perdido' AND venda IS NULL;
   ```

3. **Criar índices**:
   ```sql
   CREATE INDEX idx_leads_venda ON leads(venda);
   CREATE INDEX idx_leads_data_venda ON leads(data_venda);
   ```

## Benefícios da Implementação

### 1. Rastreamento Preciso
- Data exata de quando a venda foi fechada ou perdida
- Histórico completo do ciclo de vendas

### 2. Relatórios Melhorados
- Estatísticas de vendas por período
- Taxa de conversão real
- Análise de performance de vendas

### 3. Integridade dos Dados
- Separação clara entre status de venda e outros status
- Dados consistentes em todas as funcionalidades

### 4. Performance
- Índices otimizados para consultas de vendas
- Consultas mais eficientes

## Como Usar

### 1. Marcar Lead como Ganho
```typescript
// Via conversas
await leadsService.updateVendaStatus(leadId, clientId, true);

// Via board
markAsWon(leadId);

// Via list view
handleMarkAsWon(lead);
```

### 2. Marcar Lead como Perdido
```typescript
// Via board
markAsLost(leadId);
confirmLeadLost(leadId, observacao);

// Via list view
handleMarkAsLost(lead);
```

### 3. Buscar Estatísticas
```typescript
const stats = await leadsService.getVendasStats(clientId, startDate, endDate);
console.log(`Vendas: ${stats.total_vendas}, Perdidas: ${stats.total_perdidas}`);
```

## Compatibilidade

- ✅ Não afeta funcionalidades existentes
- ✅ Migração automática de dados existentes
- ✅ Backward compatibility mantida
- ✅ Todas as interfaces existentes continuam funcionando

## Arquivos Modificados

1. `src/services/leadsService.ts` - Interface e métodos novos
2. `src/pages/reports/Scorecard.tsx` - Card de vendas atualizado
3. `src/pages/conversations/Conversations.tsx` - Função de venda atualizada
4. `src/pages/reports/board/context/BoardContext.tsx` - Funções de ganho/perda atualizadas
5. `src/pages/reports/ListView.tsx` - Funções de ganho/perda atualizadas
6. `ADICIONAR-COLUNAS-VENDA.sql` - Script de migração
7. `IMPLEMENTACAO-COLUNAS-VENDA.md` - Esta documentação 