# Como as mensagens são salvas sem n8n

Este documento explica, no estado atual do projeto, como as mensagens ficam persistidas **sem depender do n8n**.

## Resumo direto

- A tabela principal de conversa é `agente_conversacional_whatsapp`.
- O fluxo **sem n8n** identificado no código é o de envio via **Meta Cloud API**.
- Nesse caso, após envio bem-sucedido para a Meta, o frontend grava direto no Supabase com `insert`.
- Nos fluxos de envio por Evolution/UAZAPI (texto, imagem, documento, vídeo), o código atual não faz `insert` direto do frontend; ele espera persistência externa (webhook).

## Onde está implementado

Arquivo principal:

- `src/services/messageService.ts`

Trecho-chave:

1. A função `sendMessage(...)` verifica se existe conexão Meta ativa para o cliente:
   - consulta `meta_connections` (`access_token`, `needs_reauth`)
   - consulta `wa_numbers` (`phone_number_id`)
2. Se a Meta estiver disponível, envia para:
   - `https://graph.facebook.com/v21.0/{phone_number_id}/messages`
3. Se a resposta for `ok`, persiste no banco em `agente_conversacional_whatsapp` com `insert` direto.

Campos gravados nesse insert:

- `instance_id`: `instance_id` ou `instance_id_2` de `clientes_info` (primeiro disponível)
- `telefone_id`: número normalizado com sufixo `@s.whatsapp.net`
- `mensagem`: texto enviado
- `tipo`: `true` (mensagem enviada por nós)
- `foi_lida`: `true`

Observação:

- O `id_cliente` não é preenchido explicitamente nesse `insert` específico; isso depende do schema/regra do banco (default, trigger, ou campo opcional).

## Fluxo completo sem n8n (texto via Meta)

1. Tela de conversa chama `sendMessage(...)`:
   - `src/pages/conversations/Conversations.tsx`
2. `sendMessage` tenta Meta primeiro.
3. Meta retorna sucesso.
4. O próprio app faz `insert` em `agente_conversacional_whatsapp`.
5. A UI atualiza via subscription realtime dessa mesma tabela.

## Realtime e exibição na UI

A tela consome realtime em:

- `setupMessagesSubscription(...)` em `src/services/messageService.ts`

Ela escuta `INSERT`/`UPDATE` da tabela `agente_conversacional_whatsapp`, então qualquer gravação direta já aparece na conversa sem passar por n8n.

## O que NÃO está sendo salvo direto do frontend (sem n8n)

Ainda em `src/services/messageService.ts`:

- `sendMessage` (ramo Evolution/UAZAPI, fallback quando Meta não resolve)
- `sendImageMessage`
- `sendDocumentMessage`
- `sendVideoMessage`
- `sendAudioMessage` (envia para webhook de áudio)

Nesses casos, o código atual não contém `insert` direto em `agente_conversacional_whatsapp` no frontend para registrar a mensagem enviada. A persistência fica dependente do sistema externo que recebe o webhook.

## Pontos importantes para diagnóstico

Se a Meta estiver ativa:

- Mensagem de texto enviada deve aparecer mesmo sem n8n, porque há `insert` direto do frontend.

Se cair no fallback Evolution/UAZAPI:

- A mensagem só aparece se algum webhook/processo externo salvar no banco.

Sinal prático:

- Se envio “funciona” mas conversa não atualiza, geralmente faltou a etapa externa de persistência (ou erro de webhook), porque não existe `insert` direto do frontend para esse ramo.

## Arquivos relacionados para consulta rápida

- `src/services/messageService.ts` (envio + persistência direta do frontend no ramo Meta)
- `src/pages/conversations/Conversations.tsx` (chamada de envio)
- `src/services/messageService.ts` (`setupMessagesSubscription`, `fetchRecentMessages`)
- `supabase/functions/workflow-message-receiver/index.ts` (workflow; não é o ponto principal de persistência direta do frontend das mensagens de chat sem n8n)
- `supabase/functions/workflow-webhook-trigger/index.ts` (workflow; não substitui o `insert` direto do frontend no ramo Meta)

## Conclusão

No código atual, o caminho sólido de salvamento de mensagens **sem n8n** está no envio de texto via **Meta Cloud API**, com gravação direta na tabela `agente_conversacional_whatsapp`.  
Para os demais canais/rotas (Evolution/UAZAPI/mídias), a persistência continua dependente de webhook externo.
