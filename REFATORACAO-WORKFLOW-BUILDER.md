# Refatoração Completa do Workflow Builder

## ✅ Implementações Concluídas

### 1. GATILHOS SIMPLIFICADOS (Node Início)
- ✅ Removidas estatísticas do InicioNode
- ✅ Mantidos apenas 2 triggers:
  - **"Receber Mensagem"**: Dispara quando lead manda mensagem no WhatsApp/Instagram
  - **"Webhook Externo"**: Endpoint POST `/api/workflows/:id/trigger` para sistemas externos

### 2. VARIÁVEL DE CONTROLE workflow_ativo
- ✅ Migration SQL criada: `migrations/add-workflow-ativo-leads.sql`
- ✅ Campo `workflow_ativo` adicionado na tabela `leads` (boolean, default true)
- ✅ Índice criado para performance
- ✅ Validação implementada em `workflowMessageHandler.ts` antes de criar execution
- ⚠️ **Pendente**: Implementar botão "Pausar Automação" na tela de Conversas
- ⚠️ **Pendente**: Auto-pausar quando atendente humano envia mensagem
- ⚠️ **Pendente**: Reset quando `status_conversa = 'fechada'`

### 3. NODE IF (Condição) - Versão Simples
- ✅ Refatorado para comparar `executionContext.lastOutput` com valor configurado
- ✅ Operadores: Igual, Diferente, Maior que, Menor que, Contém
- ✅ Suporte a números e strings
- ✅ 2 handles: "true" (Verdadeiro) e "false" (Falso)

### 4. NODE TIMEOUT (Aguardar/Delay) - Separado
- ✅ Novo node `DelayNode` criado
- ✅ Configurações: Duração (número) + Unidade (minutos/horas)
- ✅ Migration SQL criada: `migrations/add-waiting-until-workflow-executions.sql`
- ✅ Campo `waiting_until` adicionado em `workflow_executions`
- ✅ Status `waiting_timeout` implementado
- ⚠️ **Pendente**: Lógica de verificação periódica de timeout e cancelamento se mensagem chegar antes

### 5. MENU SIMPLIFICADO
- ✅ Removido timeout do MenuNode
- ✅ Mantidas apenas opções numéricas (1, 2, 3...)
- ✅ Saída para cada opção configurada
- ✅ Salva opção escolhida em `lastOutput` para uso em IF node

### 6. NODE MENSAGEM COM SELEÇÃO DE TIPO
- ✅ Refatorado para suportar 5 tipos:
  - **Texto**: Mensagem de texto com variáveis
  - **Áudio**: URL ou Upload (MP3, OGG, WAV, máx 16MB)
  - **Vídeo**: URL ou Upload (MP4, máx 50MB)
  - **Imagem**: URL ou Upload com legenda (JPG, PNG, WEBP, máx 5MB)
  - **Documento**: URL ou Upload com nome (PDF, DOC, DOCX, XLS, XLSX, máx 10MB)
- ✅ Interface condicional no NodeConfigDrawer (mostra apenas campos relevantes)
- ✅ Upload funcional via Supabase Storage
- ✅ Salva mensagem enviada em `lastOutput`

### 7. NODE WEBHOOK
- ✅ Novo node `WebhookNode` criado
- ✅ Configurações: URL, Método (GET/POST/PUT/DELETE), Headers JSON, Body JSON
- ✅ Suporte a variáveis no body (`{{nome}}`, etc)
- ✅ Timeout de 30 segundos (hardcoded)
- ✅ 2 handles: "success" (200-299) e "error" (4xx/5xx/erro de rede)
- ✅ Salva resposta em `lastOutput`

### 8. NODE IA (Inteligência Artificial)
- ✅ Refatorado para usar novos campos:
  - `systemPrompt`: Prompt do sistema (textarea grande)
  - `model`: Modelo opcional
  - `temperature`: 0-1 (default 0.7)
  - `maxTokens`: Número (default 500)
- ✅ Variáveis disponíveis: `{{nome}}`, `{{mensagem_usuario}}`, `{{historico}}`, `{{dados_lead}}`
- ✅ Envia resposta automaticamente para o lead via WhatsApp
- ✅ Salva resposta em `lastOutput`
- ⚠️ **Pendente**: Integração real com API de LLM (OpenAI/Claude/etc) - atualmente simulado

### 9. ENDPOINT WEBHOOK EXTERNO
- ✅ Criado: `POST /api/workflows/:id/trigger`
- ✅ Payload: `{ "phone": "5511999999999", "data": { "nome": "João", "origem": "RD Station" } }`
- ✅ Cria lead automaticamente se não existir
- ✅ Valida `workflow_ativo` antes de iniciar
- ✅ Retorna: `{ "success": true, "execution_id": "uuid" }`

### 10. ATUALIZAÇÕES DE TIPOS E INTERFACES
- ✅ Tipos TypeScript atualizados em `src/types/workflow.ts`
- ✅ Novos tipos: `DelayNodeData`, `WebhookNodeData`
- ✅ Tipos atualizados: `InicioNodeData`, `MessageNodeData`, `MenuNodeData`, `IaNodeData`, `IfNodeData`
- ✅ Status `waiting_timeout` adicionado
- ✅ Campo `waiting_until` adicionado em `WorkflowExecution`

### 11. ATUALIZAÇÕES DE UI
- ✅ `NodeSidebar` atualizado com novos nodes (Delay, Webhook)
- ✅ `NodeConfigDrawer` atualizado com configurações dos novos nodes
- ✅ `WorkflowCanvas` atualizado para incluir novos nodes
- ✅ Ícones e cores apropriados para cada tipo de node

### 12. LÓGICA DE EXECUÇÃO
- ✅ `workflowMessageHandler.ts` atualizado com lógica para novos nodes
- ✅ IF node compara `lastOutput`
- ✅ Delay node cria `waiting_timeout` com `waiting_until`
- ✅ Webhook node faz fetch HTTP e roteia para success/error
- ✅ IA node envia resposta automaticamente
- ✅ Todos os nodes salvam output em `lastOutput` para uso em IF

## 📋 Pendências e Melhorias Futuras

1. **Botão "Pausar Automação"** na tela de Conversas
2. **Auto-pausar workflow** quando atendente humano envia mensagem
3. **Reset workflow_ativo** quando `status_conversa = 'fechada'`
4. **Sistema de verificação periódica** para delay nodes (timeout)
5. **Integração real com API de LLM** para IA node
6. **Suporte a vídeo** no messageService (atualmente apenas áudio/imagem/documento)
7. **Tratamento de erros** mais robusto em todos os nodes
8. **Testes unitários** para novos nodes

## 🗄️ Migrations SQL Necessárias

Execute as seguintes migrations no Supabase:

1. `migrations/add-workflow-ativo-leads.sql` - Adiciona campo `workflow_ativo` em `leads`
2. `migrations/add-waiting-until-workflow-executions.sql` - Adiciona campo `waiting_until` em `workflow_executions`

## 📝 Notas Importantes

- Mantida retrocompatibilidade com workflows existentes
- Padrão de código existente mantido (React Flow, shadcn/ui, Tailwind)
- Logs implementados em `workflow_logs` para debug
- Integração com WhatsApp (Evolution/UAZAPI) mantida

## 🚀 Próximos Passos

1. Executar migrations SQL no Supabase
2. Testar criação de workflows com novos nodes
3. Testar execução de workflows end-to-end
4. Implementar funcionalidades pendentes listadas acima
5. Adicionar testes automatizados
