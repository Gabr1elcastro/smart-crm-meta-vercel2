# 🔄 Teste de Realtime para Tabela Leads

## Passos para Testar

### 1. Verificar Console do Navegador
1. Abra o DevTools (F12)
2. Vá para a aba Console
3. Recarregue a página de Conversas
4. Procure por mensagens como:
   - "Realtime leads: clientId não disponível"
   - "Realtime leads: Criando subscription para clientId: [número]"
   - "Realtime leads: Status da subscription: [status]"

### 2. Verificar Subscription
Se o clientId estiver disponível, você deve ver:
```
Realtime leads: Criando subscription para clientId: [número]
Realtime leads: Status da subscription: SUBSCRIBED
```

### 3. Testar Mudanças na Tabela Leads
1. Abra o SQL Editor no Supabase
2. Execute uma query para inserir ou atualizar um lead:
```sql
-- Inserir um lead de teste
INSERT INTO leads (nome, telefone, id_cliente, created_at)
VALUES ('Teste Realtime', '5511999999999', [SEU_CLIENT_ID], NOW());

-- Ou atualizar um lead existente
UPDATE leads 
SET nome = 'Nome Atualizado ' || NOW()::text
WHERE telefone = '5511999999999' AND id_cliente = [SEU_CLIENT_ID];
```

### 4. Verificar Logs no Console
Após executar a query, você deve ver no console:
```
Realtime leads: Mudança detectada: {eventType: "INSERT", ...}
```

### 5. Verificar Atualização da Interface
- A lista de conversas deve ser atualizada automaticamente
- Novos contatos devem aparecer na lista
- Nomes de contatos existentes devem ser atualizados

## Possíveis Problemas

### Problema 1: ClientId não disponível
**Sintoma:** "Realtime leads: clientId não disponível"
**Solução:** Verificar se o usuário está logado e se o clientId está sendo carregado corretamente.

### Problema 2: Subscription não conecta
**Sintoma:** Status da subscription não é "SUBSCRIBED"
**Solução:** Verificar políticas RLS na tabela leads (execute o script VERIFICAR-RLS-LEADS.sql).

### Problema 3: Mudanças não são detectadas
**Sintoma:** Não aparecem logs de "Mudança detectada"
**Solução:** 
1. Verificar se o filtro `id_cliente=eq.${clientId}` está correto
2. Verificar se as mudanças estão sendo feitas no clientId correto
3. Verificar se RLS não está bloqueando as mudanças

### Problema 4: Interface não atualiza
**Sintoma:** Logs aparecem mas a interface não muda
**Solução:** Verificar se a função `fetchConversations()` está sendo chamada e funcionando.

## Botão de Teste
Use o botão "🔄 Testar Realtime" na interface para:
- Verificar se clientId e instanceId estão disponíveis
- Forçar uma atualização manual das conversas
- Verificar se fetchConversations está funcionando

## Logs Esperados
```
Realtime leads: Criando subscription para clientId: 123
Realtime leads: Status da subscription: SUBSCRIBED
Realtime leads: Mudança detectada: {eventType: "INSERT", table: "leads", ...}
``` 