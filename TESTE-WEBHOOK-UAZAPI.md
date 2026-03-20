# Teste Webhook UAZAPI

Para testar o webhook UAZAPI diretamente, copie e cole o código abaixo no console do navegador:

```javascript
async function testarWebhookUAZAPI(token) {
  const requestBody = {
    enabled: true,
    url: 'https://webhook.dev.usesmartcrm.com/webhook/uazapi',
    events: ['messages', 'connection'],
    excludeMessages: ['wasSentByApi', 'isGroupYes']
  };

  console.log('🔧 Testando configuração de webhook UAZAPI');
  console.log('Token:', token);
  console.log('Request Body:', JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch('https://smartcrm.uazapi.com/webhook', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'token': token
      },
      body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();
    console.log('Status:', response.status, response.statusText);
    console.log('Response:', responseText);

    if (response.ok) {
      console.log('✅ Webhook configurado com sucesso!');
      try {
        const jsonResponse = JSON.parse(responseText);
        console.log('Response JSON:', jsonResponse);
      } catch (e) {
        console.log('Response (texto):', responseText);
      }
    } else {
      console.error('❌ Erro ao configurar webhook:', response.status, responseText);
    }

    return { status: response.status, response: responseText };
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
    throw error;
  }
}

// Testar com o token fornecido
testarWebhookUAZAPI('3926eec2-c2ca-48fa-ab19-a0c0e745c06f');
```
