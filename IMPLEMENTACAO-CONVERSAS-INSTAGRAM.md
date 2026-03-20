# Implementação - Conversas Instagram

## 📋 Resumo

Foi implementada a página de **Conversas Instagram** com o mesmo layout da página de Conversas existente, mas adaptada para a nova base de dados do Instagram.

## 🗂️ Arquivos Criados/Modificados

### Novos Arquivos
- `src/pages/conversations/ConversationsInstagram.tsx` - Página principal das conversas Instagram
- `ADICIONAR-COLUNA-INT-INSTAGRAM.sql` - Script SQL para adicionar coluna de permissão
- `teste-conversas-instagram.js` - Script de teste da implementação
- `IMPLEMENTACAO-CONVERSAS-INSTAGRAM.md` - Este arquivo de documentação

### Arquivos Modificados
- `src/App.tsx` - Adicionada rota `/conversations-instagram`
- `src/components/layout/Sidebar.tsx` - Adicionado item de menu para Conversas Instagram
- `src/components/layout/AppLayout.tsx` - Adicionado título da página

## 🗄️ Estrutura da Base de Dados

### Tabela: `agente_conversacional_instagram`
```sql
{
  "id_mensagem": 2,
  "id_conversa": "18512763464730498",
  "nome_lead": "Fernando",
  "id_cliente": 176,
  "id_instagram_cliente": "17841475806053898",
  "id_instagram_lead": "671287658676600",
  "mensagem": "Olá",
  "fromMe": false,
  "created_at": "2025-09-10 16:35:47.853426+00"
}
```

### Tabela: `leads_instagram`
- `id_instagram_lead` - ID único do lead no Instagram
- `nome` - Nome do lead

### Tabela: `clientes_info` (modificação)
- `int_instagram` - Boolean que controla acesso às conversas Instagram

## 🔧 Funcionalidades Implementadas

### ✅ Funcionalidades Básicas
- [x] Layout idêntico à página de Conversas
- [x] Lista de contatos com mensagens do Instagram
- [x] Visualização de conversas em tempo real
- [x] Busca de contatos
- [x] Interface responsiva (mobile/desktop)
- [x] Verificação de permissões (int_instagram = TRUE)

### ✅ Funcionalidades Técnicas
- [x] Consulta à tabela `agente_conversacional_instagram`
- [x] Filtro por `id_cliente` (RLS)
- [x] Busca de nomes na tabela `leads_instagram`
- [x] Ajuste de timezone (-3 horas)
- [x] Ordenação cronológica das mensagens
- [x] Sistema de realtime para atualizações

### ✅ Controles de Acesso
- [x] Verificação de `int_instagram = TRUE` em `clientes_info`
- [x] Mensagem de acesso negado para usuários sem permissão
- [x] Item de menu só aparece para usuários autorizados

## 🚀 Como Usar

### 1. Configuração da Base de Dados
```sql
-- Execute o script SQL
\i ADICIONAR-COLUNA-INT-INSTAGRAM.sql

-- Ative o Instagram para clientes específicos
UPDATE clientes_info 
SET int_instagram = TRUE 
WHERE id IN (1, 2, 3);
```

### 2. Acesso à Página
- URL: `/conversations-instagram`
- Menu: "Conversas Instagram" (só aparece se `int_instagram = TRUE`)
- Ícone: Instagram (rosa)

### 3. Teste da Implementação
```bash
# Execute o script de teste
node teste-conversas-instagram.js
```

## 📱 Interface

### Lista de Contatos
- Nome do lead (busca em `leads_instagram`)
- ID do Instagram do lead
- Última mensagem
- Horário da última mensagem (ajustado -3h)
- Badge "Instagram" (rosa)

### Área de Chat
- Mensagens ordenadas cronologicamente
- Diferenciação visual: cliente (azul) vs lead (cinza)
- Horário ajustado (-3 horas)
- Input de mensagem (preparado para envio)

## 🔄 Próximos Passos

### Fase 2 - Envio de Mensagens
- [ ] Implementar função de envio de mensagens
- [ ] Integração com API do Instagram
- [ ] Upload de mídias (imagens, vídeos, áudio)
- [ ] Status de entrega e leitura

### Fase 3 - Funcionalidades Avançadas
- [ ] Etiquetas e departamentos
- [ ] Followup automático
- [ ] Relatórios específicos do Instagram
- [ ] Integração com webhooks

## 🐛 Troubleshooting

### Problema: Página não aparece no menu
**Solução:** Verifique se `int_instagram = TRUE` para o cliente

### Problema: Erro ao carregar conversas
**Solução:** Verifique se as tabelas `agente_conversacional_instagram` e `leads_instagram` existem

### Problema: Horário incorreto
**Solução:** O sistema já ajusta automaticamente -3 horas do horário do Supabase

## 📊 Monitoramento

### Logs Importantes
- `[CONVERSAS INSTAGRAM]` - Logs da página
- `[CONVERSAS INSTAGRAM] Contatos criados` - Lista de contatos
- `[CONVERSAS INSTAGRAM] Mensagens encontradas` - Contagem de mensagens

### Métricas
- Número de conversas ativas
- Mensagens por cliente
- Tempo de resposta
- Taxa de engajamento

## 🔒 Segurança

- RLS (Row Level Security) por `id_cliente`
- Verificação de permissão `int_instagram`
- Validação de dados de entrada
- Sanitização de mensagens

---

**Status:** ✅ Implementação Completa - Fase 1  
**Próxima Fase:** Envio de Mensagens  
**Data:** Janeiro 2025
