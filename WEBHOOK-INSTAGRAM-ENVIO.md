# Webhook Instagram - Envio de Mensagens

## 📡 Endpoint
```
POST https://webhook.dev.usesmartcrm.com/webhook/envio_ig
```

## 📦 Payload Enviado

```json
{
  "cliente_id": 176,
  "mensagem": "Olá, como posso ajudar?",
  "id_conversa": "18512763464730498",
  "id_instagram_lead": "671287658676600",
  "nome_lead": "Tobias"
}
```

## 🔧 Campos do Payload

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `cliente_id` | number | ID do cliente no sistema | 176 |
| `mensagem` | string | Texto da mensagem a ser enviada | "Olá, como posso ajudar?" |
| `id_conversa` | string | ID único da conversa no Instagram | "18512763464730498" |
| `id_instagram_lead` | string | ID do lead no Instagram | "671287658676600" |
| `nome_lead` | string | Nome do lead | "Tobias" |

## 🔄 Fluxo de Envio

1. **Usuário digita mensagem** no input
2. **Sistema valida** se há contato selecionado e mensagem válida
3. **Busca informações** do contato selecionado
4. **Monta payload** com todos os dados necessários
5. **Envia POST** para o webhook do Instagram
6. **Aguarda resposta** do webhook
7. **Exibe feedback** para o usuário (sucesso/erro)
8. **Atualiza conversas** após 1 segundo

## 📝 Logs de Debug

### Console Logs
```javascript
// Antes do envio
console.log('Enviando mensagem Instagram:', payload);

// Após resposta
console.log('Resposta do webhook Instagram:', result);

// Em caso de erro
console.error('Erro ao enviar mensagem Instagram:', error);
```

### Exemplo de Log
```
Enviando mensagem Instagram: {
  cliente_id: 176,
  mensagem: "Olá, como posso ajudar?",
  id_conversa: "18512763464730498",
  id_instagram_lead: "671287658676600",
  nome_lead: "Tobias"
}

Resposta do webhook Instagram: {
  success: true,
  message_id: "msg_123456"
}
```

## ⚠️ Tratamento de Erros

### Validações
- ✅ Mensagem não pode estar vazia
- ✅ Contato deve estar selecionado
- ✅ Usuário deve estar logado (`id_cliente`)
- ✅ Contato deve existir na lista

### Erros HTTP
- **400** - Bad Request (payload inválido)
- **401** - Unauthorized (não autorizado)
- **500** - Internal Server Error (erro do servidor)

### Feedback ao Usuário
- ✅ **Sucesso**: "Mensagem enviada com sucesso!"
- ❌ **Erro**: "Erro ao enviar mensagem: [detalhes do erro]"

## 🔄 Atualização Automática

Após o envio bem-sucedido:
1. **Toast de sucesso** é exibido
2. **Conversas são atualizadas** automaticamente após 1 segundo
3. **Nova mensagem aparece** na conversa (quando processada pelo webhook)

## 🧪 Teste Manual

1. Acesse `/conversations-instagram`
2. Selecione um contato
3. Digite uma mensagem
4. Clique em "Enviar" ou pressione Enter
5. Verifique os logs no console
6. Confirme se a mensagem aparece na conversa

---

**Status**: ✅ Implementado  
**Data**: Janeiro 2025  
**Versão**: 1.0
