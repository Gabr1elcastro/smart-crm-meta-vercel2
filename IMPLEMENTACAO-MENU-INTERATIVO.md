# 📋 Implementação Completa do Menu Interativo com Lógica de Entrada Condicional

## ✅ Componentes Implementados

### 1. **Tipos TypeScript** (`src/types/workflow.ts`)
- ✅ `MenuNodeData`: Interface para dados do node de menu
- ✅ `WorkflowExecution`: Interface para execuções de workflow
- ✅ `WorkflowExecutionStatus`: Tipo para status de execução
- ✅ `WorkflowMenuLog`: Interface para logs de menu

### 2. **Componente Visual** (`src/components/workflow-builder/nodes/MenuNode.tsx`)
- ✅ Node visual com preview das opções
- ✅ Handles de saída dinâmicos (um para cada opção + timeout)
- ✅ Ícone e estilo consistente com outros nodes

### 3. **UI do Builder**
- ✅ `NodeSidebar`: Botão "Menu Interativo" adicionado
- ✅ `NodeConfigDrawer`: Interface completa de configuração do menu
- ✅ `WorkflowCanvas`: Suporte para criar e editar nodes de menu

### 4. **Banco de Dados** (`migrations/create-workflow-menu-tables.sql`)
- ✅ Tabela `workflow_executions`: Armazena execuções com estado
- ✅ Tabela `workflow_menu_logs`: Histórico de menus enviados e respostas
- ✅ Coluna `closer_momento_da_ultima_msg` na tabela `leads` (se não existir)
- ✅ Índices e constraints para performance

### 5. **Lógica de Execução** (`src/services/workflowService.ts`)
- ✅ `canTriggerWorkflow()`: Verifica se lead pode iniciar workflow
- ✅ `executeNodeMenu()`: Executa menu e pausa workflow
- ✅ `resumeWorkflow()`: Retoma workflow após resposta
- ✅ `getWaitingExecution()`: Busca execuções aguardando input
- ✅ `createOrUpdateExecution()`: Gerencia execuções

### 6. **Handler de Mensagens** (`src/services/workflowMessageHandler.ts`)
- ✅ `processReceivedMessage()`: Processa mensagens recebidas
- ✅ Integração com lógica de entrada condicional
- ✅ Inicia ou retoma workflows automaticamente

### 7. **Edge Function** (`supabase/functions/check-workflow-timeouts/`)
- ✅ Verifica timeouts de execuções waiting_input
- ✅ Executa ações configuradas (encerrar ou voltar início)
- ✅ Atualiza status de leads

## 🚀 Como Usar

### Passo 1: Executar Migration SQL

Execute o arquivo `migrations/create-workflow-menu-tables.sql` no Supabase SQL Editor:

```sql
-- O arquivo já está pronto, apenas execute no Supabase Dashboard
```

### Passo 2: Deploy da Edge Function

```bash
# No diretório do projeto
supabase functions deploy check-workflow-timeouts
```

### Passo 3: Configurar Cron Job

No Supabase Dashboard:
1. Vá em **Database > Cron Jobs**
2. Crie novo job:
   - **Name**: `check_workflow_timeouts`
   - **Schedule**: `*/5 * * * *` (a cada 5 minutos)
   - **SQL**:
```sql
SELECT net.http_post(
  url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-workflow-timeouts',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer YOUR_ANON_KEY'
  ),
  body := '{}'::jsonb
);
```

### Passo 4: Integrar Handler de Mensagens

No seu webhook que processa mensagens recebidas (n8n ou outro), adicione:

```typescript
import { processReceivedMessage } from '@/services/workflowMessageHandler';

// Quando mensagem é recebida
await processReceivedMessage({
  phone: messageData.phone,
  message: messageData.text,
  idCliente: messageData.id_cliente,
  instanceId: messageData.instance_id,
  timestamp: messageData.timestamp,
});
```

**Exemplo para n8n:**
1. Após salvar mensagem no banco
2. Adicione um nó "Function" ou "HTTP Request" que chame a função
3. Ou integre diretamente no código do webhook

## 📝 Regras de Negócio Implementadas

### ✅ Variável de Controle
- **Lead novo**: SEMPRE passa pelo menu no primeiro contato
- **Lead existente**: SÓ passa se:
  - `status_conversa = 'fechada'` OU
  - `agora - closer_momento_da_ultima_msg > 2 horas`

### ✅ Prevenção de Duplicidade
- Constraint `unique_active_execution` garante apenas uma execução `waiting_input` por lead+workflow
- Verificação antes de criar nova execução

### ✅ Atualização de Status
- Quando menu é enviado: `status_conversa = 'em_atendimento'`
- Quando workflow completa/timeout: `status_conversa = 'fechada'`
- `closer_momento_da_ultima_msg` atualizado automaticamente

### ✅ Validação de Respostas
- Respostas válidas: avançam para próximo node
- Respostas inválidas: enviam erro e continuam aguardando
- Timeout: executa ação configurada

## 🧪 Checklist de Teste

- [ ] **Lead novo recebe mensagem** → entra no menu (cria execution waiting_input)
- [ ] **Lead existente com status 'fechada'** → entra no menu
- [ ] **Lead existente com última msg há 3 horas** → entra no menu
- [ ] **Lead existente com última msg há 10 minutos e status 'aberta'** → NÃO entra no menu
- [ ] **Responder opção válida (1)** → avança para node correto
- [ ] **Responder opção inválida (5)** → recebe erro e continua no mesmo menu
- [ ] **Aguardar 30min sem responder** → recebe msg timeout e encerra
- [ ] **Multi-tenant**: executions isoladas por id_cliente

## 🔧 Estrutura de Dados

### MenuNodeData
```typescript
{
  label: string;
  message: string; // Mensagem com variáveis {{nome}}, {{telefone}}, etc
  options: Array<{
    id: string; // "1", "2", "3"...
    label: string; // "Suporte", "Vendas", etc
    nextNodeId?: string; // Opcional: node específico para esta opção
    color?: string; // Opcional: cor do handle
  }>;
  timeout_minutes: number; // Padrão: 30
  timeout_action: 'encerrar' | 'voltar_inicio';
  timeout_message?: string; // Mensagem enviada no timeout
  variables?: string[]; // Variáveis detectadas na mensagem
}
```

### WorkflowExecution
```typescript
{
  id: string;
  workflow_id: string;
  lead_id: number;
  status: 'running' | 'waiting_input' | 'completed' | 'timeout';
  current_node_id: string | null;
  context: Record<string, any>; // Contexto da execução
  waiting_since: string | null; // Timestamp quando entrou em waiting_input
  expected_options: string[] | null; // Opções válidas quando waiting_input
  created_at: string;
  updated_at: string;
}
```

## 🐛 Troubleshooting

### Menu não está sendo enviado
1. Verifique se workflow está `is_active = true`
2. Verifique se `processReceivedMessage()` está sendo chamado
3. Verifique logs do console para erros

### Respostas não estão sendo processadas
1. Verifique se `processReceivedMessage()` está sendo chamado para TODAS as mensagens recebidas
2. Verifique se `expected_options` está correto na execução
3. Verifique logs de `resumeWorkflow()`

### Timeouts não estão funcionando
1. Verifique se Edge Function foi deployada
2. Verifique se Cron Job está configurado e rodando
3. Verifique logs da Edge Function no Supabase Dashboard

## 📚 Arquivos Criados/Modificados

### Novos Arquivos
- `src/components/workflow-builder/nodes/MenuNode.tsx`
- `src/services/workflowMessageHandler.ts`
- `supabase/functions/check-workflow-timeouts/index.ts`
- `supabase/functions/check-workflow-timeouts/README.md`
- `migrations/create-workflow-menu-tables.sql`
- `IMPLEMENTACAO-MENU-INTERATIVO.md` (este arquivo)

### Arquivos Modificados
- `src/types/workflow.ts` - Tipos adicionados
- `src/services/workflowService.ts` - Funções de execução
- `src/components/workflow-builder/NodeSidebar.tsx` - Botão menu
- `src/components/workflow-builder/NodeConfigDrawer.tsx` - Configuração menu
- `src/components/workflow-builder/WorkflowCanvas.tsx` - Suporte menu
- `src/components/workflow-builder/nodes/index.ts` - Export MenuNode

## 🎯 Próximos Passos (Opcional)

1. **Dashboard de Monitoramento**: Visualizar execuções em tempo real
2. **Estatísticas**: Métricas de conversão por opção do menu
3. **A/B Testing**: Testar diferentes mensagens de menu
4. **Integração com IA**: Respostas automáticas baseadas em contexto

---

**Implementação concluída!** 🎉

Todas as funcionalidades solicitadas foram implementadas seguindo as regras de negócio especificadas.
