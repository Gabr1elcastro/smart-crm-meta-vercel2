# Implementação do Google Agenda na Página de Conexões

## Visão Geral
Foi implementada a funcionalidade para conectar o Google Agenda na página de conexões do sistema. Os usuários podem agora inserir o ID da sua agenda do Google e o sistema salva essa informação na base de dados e dispara um webhook para atualização de planilhas.

## Funcionalidades Implementadas

### 1. **Card do Google Agenda**
- **Localização**: Página de Conexões (`/channels/conexoes`)
- **Aparência**: Card verde com ícone de calendário
- **Status**: Mostra se está conectado ou desconectado
- **Ação**: Botão para conectar/configurar

### 2. **Modal de Configuração**
- **Campo**: Input para inserir o ID da agenda
- **Validação**: Campo obrigatório para salvar
- **Instruções**: Texto explicativo sobre como encontrar o ID
- **Botões**: Cancelar e Salvar

### 3. **Integração com Banco de Dados**
- **Tabela**: `clientes_info`
- **Coluna**: `id_agenda` (VARCHAR(255))
- **Serviço**: `clientesService.setIdAgenda()`

### 4. **Webhook Automático**
- **Endpoint**: `https://webhook.dev.usesmartcrm.com/webhook/planilha-agenda`
- **Trigger**: Após sucesso no salvamento do ID da agenda
- **Dados**: Informações completas do cliente e conexão
- **Serviço**: `clientesService.dispararWebhookAgenda()`

## Arquivos Modificados

### 1. `src/services/clientesService.ts`
- Adicionado campo `id_agenda` na interface `ClienteInfo`
- Implementado método `setIdAgenda()` para salvar o ID
- Implementado método `dispararWebhookAgenda()` para webhook

### 2. `src/pages/channels/Conexoes.tsx`
- Adicionado card do Google Agenda
- Implementado modal de configuração
- Adicionada lógica de estado e conexão
- Integração com o serviço de clientes
- Disparo automático do webhook após conexão

### 3. `ADICIONAR-COLUNA-ID-AGENDA.sql`
- Script SQL para criar a coluna `id_agenda`

### 4. `WEBHOOK-PLANILHA-AGENDA.md`
- Documentação completa do webhook

## Como Usar

### Para o Usuário Final:
1. Acessar a página de Conexões
2. Clicar no card "Google Agenda"
3. Inserir o ID da agenda no campo
4. Clicar em "Salvar"
5. Sistema salva no BD e dispara webhook automaticamente

### Para o Desenvolvedor:
1. Executar o script SQL para criar a coluna
2. A funcionalidade já está integrada e funcionando
3. Webhook é disparado automaticamente após conexão

## Como Encontrar o ID da Agenda

1. Acessar o Google Calendar
2. Clicar no nome da agenda (lado esquerdo)
3. Clicar em "Configurações da agenda"
4. Copiar o ID que aparece na URL ou nas configurações

## Status da Conexão

- **Desconectado**: Quando `id_agenda` é NULL ou vazio
- **Conectado**: Quando `id_agenda` possui um valor
- **Última Sincronização**: Mostra "Conectado" ou "Nunca sincronizado"

## Webhook da Planilha

### **Dados Enviados**
```json
{
  "cliente_id": 123,
  "user_id_auth": "uuid-do-usuario",
  "nome": "Nome do Cliente",
  "email": "cliente@email.com",
  "id_agenda": "agenda-id-google",
  "plano_starter": false,
  "plano_pro": false,
  "plano_plus": true,
  "plano_agentes": false,
  "trial": false,
  "data_conexao": "2024-01-15T10:30:00.000Z",
  "tipo_conexao": "google_agenda"
}
```

### **Fluxo de Execução**
1. Usuário insere ID da agenda e clica em Salvar
2. Sistema salva ID no banco de dados
3. Se sucesso, dispara webhook automaticamente
4. Atualiza interface para mostrar "Conectado"
5. Fecha modal e limpa campos

### **Tratamento de Erros**
- **Webhook falha**: Conexão é salva, mas webhook falha (warning no console)
- **Cliente não encontrado**: Conexão falha completamente
- **Erro de rede**: Conexão é salva, webhook falha

## Logs e Monitoramento

### **Console do Navegador**
```
✅ Google Agenda conectado e webhook disparado com sucesso
⚠️ Google Agenda conectado, mas webhook falhou
❌ Erro ao disparar webhook da agenda: [erro]
```

### **Verificação de Funcionamento**
- Console mostra sucesso/falha do webhook
- Dados chegam no endpoint especificado
- Planilha é atualizada com informações do cliente

## Próximos Passos Sugeridos

1. **Sincronização Real**: Implementar sincronização real com a API do Google Calendar
2. **Validação de ID**: Adicionar validação para verificar se o ID é válido
3. **Testes**: Criar testes automatizados para a funcionalidade
4. **Logs**: Adicionar logs para auditoria das conexões
5. **Webhook**: Implementar sistema de retry para webhooks falhados
6. **Configuração**: Mover endpoint do webhook para variáveis de ambiente

## Notas Técnicas

- A implementação usa o padrão de estado local do React
- O cache do serviço de clientes é limpo após atualizações
- O modal é responsivo e acessível
- A funcionalidade segue o padrão visual existente do sistema
- Webhook é disparado de forma assíncrona sem bloquear a interface
- Tratamento robusto de erros para garantir experiência do usuário
