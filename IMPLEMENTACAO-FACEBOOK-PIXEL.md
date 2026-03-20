# 🎯 Implementação do Facebook Pixel

## 📱 **Visão Geral**

O Facebook Pixel foi implementado no sistema SmartCRM para rastrear conversões e otimizar campanhas publicitárias.

## 🔧 **Configuração Atual**

### **1. Pixel Principal (index.html)**
- **ID**: `1533586457803445`
- **Evento Padrão**: `PageView`
- **Localização**: `index.html` (linhas 18-31 e 37-41)

```html
<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '1533586457803445');
fbq('track', 'PageView');
</script>
<!-- End Meta Pixel Code -->
```

### **2. Evento Lead (Signup.tsx)**
- **Evento**: `Lead`
- **Localização**: `src/pages/auth/Signup.tsx`
- **Trigger**: Clique no botão "Cadastrar"

```typescript
// 🎯 RASTREAMENTO FACEBOOK PIXEL - EVENTO LEAD
if (typeof window !== 'undefined' && window.fbq) {
  window.fbq('track', 'Lead', {
    content_name: 'Cadastro de Usuário',
    content_category: 'Signup',
    value: 1,
    currency: 'BRL'
  });
  console.log('🎯 Facebook Pixel: Evento Lead rastreado');
}
```

## 🚀 **Eventos Implementados**

### **✅ PageView**
- **Descrição**: Rastreia visualizações de página
- **Trigger**: Automático em todas as páginas
- **Parâmetros**: Padrão do Facebook

### **✅ Lead**
- **Descrição**: Rastreia cadastros de usuários
- **Trigger**: Submit do formulário de cadastro
- **Parâmetros**:
  - `content_name`: 'Cadastro de Usuário'
  - `content_category`: 'Signup'
  - `value`: 1
  - `currency`: 'BRL'

## 📊 **Como Funciona**

1. **Carregamento**: O script do Facebook é carregado automaticamente em todas as páginas
2. **Inicialização**: `fbq('init', '1533586457803445')` inicializa o pixel
3. **Rastreamento**: Eventos são disparados conforme ações do usuário
4. **Relatórios**: Dados aparecem no Facebook Ads Manager

## 🎯 **Próximos Eventos Recomendados**

### **🔄 Eventos de Engajamento**
- `ViewContent`: Visualização de páginas específicas
- `AddToCart`: Adição de produtos ao carrinho
- `Purchase`: Compra/assinatura de plano

### **🔄 Eventos de Conversão**
- `CompleteRegistration`: Cadastro completo
- `Subscribe`: Assinatura de newsletter
- `Contact`: Envio de mensagem

## 🔍 **Debug e Teste**

### **1. Verificar no Console**
```javascript
// Verificar se o pixel está carregado
console.log('Facebook Pixel:', window.fbq);

// Testar evento manualmente
window.fbq('track', 'Lead');
```

### **2. Facebook Pixel Helper**
- Instalar extensão "Facebook Pixel Helper" no Chrome
- Verificar eventos sendo disparados
- Validar parâmetros enviados

### **3. Logs do Sistema**
- Console mostra: `🎯 Facebook Pixel: Evento Lead rastreado`
- Verificar se aparece após cada cadastro

## ⚠️ **Considerações Importantes**

### **🔒 Privacidade**
- Usuários devem ser informados sobre rastreamento
- Considerar implementar banner de cookies
- Respeitar LGPD/GDPR

### **🌐 Compatibilidade**
- Verificação `typeof window !== 'undefined'` para SSR
- Fallback para usuários sem JavaScript
- Suporte a diferentes navegadores

### **📱 Performance**
- Script carregado de forma assíncrona
- Não bloqueia renderização da página
- Otimizado para carregamento rápido

## 🛠️ **Manutenção**

### **📝 Atualizações**
- Manter ID do pixel atualizado
- Adicionar novos eventos conforme necessário
- Testar após mudanças no código

### **🔍 Monitoramento**
- Verificar eventos no Facebook Ads Manager
- Monitorar conversões e ROI
- Ajustar parâmetros conforme resultados

---

**📅 Última Atualização**: $(date)
**👨‍💻 Desenvolvido por**: SmartCRM Team
**🎯 Status**: ✅ Implementado e Funcionando
