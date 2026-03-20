# Implementação do Google Tag Manager

## Visão Geral
Foi implementado o Google Tag Manager (GTM) e Mixpanel no projeto SmartCRM para permitir o gerenciamento centralizado de tags de rastreamento e analytics, além de tracking detalhado de atividade dos usuários.

## Configuração Implementada

### ID do GTM
- **Container ID**: `GTM-T7RX8HF2`
- **URL**: `https://www.googletagmanager.com/gtm.js?id=GTM-T7RX8HF2`

### ID do Mixpanel
- **Project Token**: `3b611854e8d7a0629b0607e6ea9b5169`
- **URL**: `https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js`

### Tags Implementadas

#### 1. Tag no HEAD (JavaScript)
```html
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-T7RX8HF2');</script>
<!-- End Google Tag Manager -->
```

#### 2. Tag no BODY (NoScript)
```html
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-T7RX8HF2"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
```

#### 3. Mixpanel Analytics
```html
<!-- Mixpanel Analytics - SmartCRM User Activity Tracking -->
<script type="text/javascript">
  (function(f,b){
      if(!b.__SV){
          var e,g,i,h;
          window.mixpanel=b;
          b._i=[];
          b.init=function(e,f,c){
              function g(a,d){
                  var b=d.split(".");
                  2==b.length&&(a=a[b[0]],d=b[1]);
                  a[d]=function(){
                      a.push([d].concat(Array.prototype.slice.call(arguments,0)))
                  }
              }
              var a=b;
              "undefined"!==typeof c?a=b[c]=[]:c="mixpanel";
              a.people=a.people||[];
              a.toString=function(a){
                  var d="mixpanel";
                  "mixpanel"!==c&&(d+="."+c);
                  a||(d+=" (stub)");
                  return d
              };
              a.people.toString=function(){
                  return a.toString(1)+".people (stub)"
              };
              i="disable time_event track track_pageview track_links track_forms track_with_groups add_group set_group remove_group register register_once unregister identify alias name_tag set_config reset opt_in_tracking opt_out_tracking has_opted_in_tracking has_opted_out_tracking clear_opt_in_out_tracking get_group".split(" ");
              for(h=0;h<i.length;h++)g(a,i[h]);
              b._i.push([e,f,c])
          };
          b.__SV=1.2;
          e=f.createElement("script");
          e.type="text/javascript";
          e.async=!0;
          e.src="https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js";
          g=f.getElementsByTagName("script")[0];
          g.parentNode.insertBefore(e,g)
      }
  })(document,window.mixpanel||[]);
  mixpanel.init("3b611854e8d7a0629b0607e6ea9b5169");
</script>
<!-- End Mixpanel Analytics -->
```

## Localização das Tags

### Arquivo Principal
- **Arquivo**: `index.html`
- **Tag JavaScript**: Inserida no `<head>` após as meta tags do Twitter
- **Tag NoScript**: Inserida no início do `<body>` antes do `<div id="root">`

## Estrutura do Arquivo HTML

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <!-- Meta tags existentes -->
    
    <!-- Google Tag Manager -->
    <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','GTM-T7RX8HF2');</script>
    <!-- End Google Tag Manager -->
    
    <!-- Meta Pixel Code -->
  </head>

  <body>
    <!-- Google Tag Manager (noscript) -->
    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-T7RX8HF2"
    height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
    <!-- End Google Tag Manager (noscript) -->
    
    <div id="root"></div>
    
    <!-- Scripts existentes -->
  </body>
</html>
```

## Funcionalidades do GTM

### 1. Rastreamento Automático
- **Page Views**: Rastreamento automático de visualizações de página
- **Events**: Captura de eventos personalizados
- **User Interactions**: Rastreamento de cliques, formulários e navegação

### 2. Gerenciamento Centralizado
- **Tags**: Google Analytics, Facebook Pixel, etc.
- **Triggers**: Condições para disparar tags
- **Variables**: Dados dinâmicos para personalização

### 3. Debug e Preview
- **Preview Mode**: Teste de tags antes da publicação
- **Data Layer**: Inspeção de dados em tempo real
- **Console**: Logs de execução das tags

## Integração com Sistema Existente

### Compatibilidade
- ✅ **Meta Pixel**: Mantido funcionando junto com GTM
- ✅ **React Router**: Compatível com SPA
- ✅ **Build Process**: Não interfere no processo de build
- ✅ **Performance**: Carregamento assíncrono

### Posicionamento
- **JavaScript**: Carregado no `<head>` para execução precoce
- **NoScript**: Fallback para usuários sem JavaScript
- **Ordem**: Após meta tags, antes de outros scripts

## Configurações Recomendadas

### 1. Triggers Padrão
- **All Pages**: Para rastreamento universal
- **Form Submissions**: Para conversões
- **Button Clicks**: Para ações importantes
- **Scroll Depth**: Para engajamento

### 2. Variables Úteis
- **Page URL**: URL atual da página
- **Page Title**: Título da página
- **User ID**: ID do usuário logado (se aplicável)
- **Custom Events**: Eventos específicos da aplicação

### 3. Tags Recomendadas
- **Google Analytics 4**: Rastreamento de analytics
- **Facebook Pixel**: Retargeting e conversões
- **Google Ads**: Remarketing e conversões
- **Hotjar**: Análise de comportamento

## Testes e Validação

### 1. Verificação de Instalação
- ✅ **Console**: Verificar se `dataLayer` está definido
- ✅ **Network**: Confirmar carregamento do `gtm.js`
- ✅ **Preview Mode**: Ativar modo de preview no GTM

### 2. Testes de Funcionalidade
- ✅ **Page Views**: Navegar entre páginas
- ✅ **Events**: Disparar eventos personalizados
- ✅ **Data Layer**: Verificar dados sendo enviados

### 3. Ferramentas de Debug
- **GTM Preview**: Modo de preview integrado
- **Data Layer Helper**: Extensão do Chrome
- **Console Logs**: Verificar execução das tags

## Próximos Passos

### 1. Configuração no GTM
- Acessar [Google Tag Manager](https://tagmanager.google.com/)
- Configurar container `GTM-T7RX8HF2`
- Criar tags, triggers e variables necessários

### 2. Implementação de Eventos
- **Login/Logout**: Rastrear autenticação
- **Cadastro de Usuário**: Evento `user_signed_up` após confirmação do backend
- **Conversas**: Monitorar uso do chat
- **Uploads**: Rastrear carregamento de arquivos
- **Conversões**: Objetivos de negócio

### 3. Integração com Analytics
- **Google Analytics 4**: Configurar propriedade
- **Facebook Pixel**: Manter funcionando via GTM
- **Conversões**: Configurar objetivos

## Segurança e Privacidade

### 1. GDPR/CCPA
- **Consent Mode**: Implementar se necessário
- **Data Retention**: Configurar retenção de dados
- **User Rights**: Respeitar direitos de privacidade

### 2. Performance
- **Async Loading**: Carregamento não-bloqueante
- **Resource Hints**: Otimizações de performance
- **Caching**: Aproveitar cache do navegador

## Eventos Implementados

### 1. Evento de Cadastro de Usuário
```typescript
// Disparado após cadastro bem-sucedido no backend
window.dataLayer.push({
  event: 'user_signed_up',
  signupMethod: 'email',
  // NUNCA envie e-mail para GA4. Se for usar no Meta Pixel, use hashing no GTM/Pixel.
});
```

**Localização**: `src/pages/auth/Signup.tsx` - Após confirmação do webhook
**Trigger**: Cadastro bem-sucedido no Supabase
**Dados**: Método de cadastro (email)

### 2. Tipos Globais
**Arquivo**: `src/types/global.d.ts`
- Declaração do `window.dataLayer` para TypeScript
- Declaração do `window.fbq` para Facebook Pixel
- Declaração do `window.mixpanel` para Mixpanel Analytics

## Conclusão

A implementação do Google Tag Manager foi concluída com sucesso, fornecendo uma base sólida para:

- **Rastreamento**: Analytics e conversões
- **Marketing**: Retargeting e campanhas
- **Análise**: Comportamento do usuário
- **Otimização**: Melhorias baseadas em dados
- **Eventos Customizados**: Cadastro de usuários
- **User Activity Tracking**: Monitoramento detalhado via Mixpanel

O GTM está configurado para funcionar em conjunto com o sistema existente, mantendo a compatibilidade e adicionando capacidades avançadas de rastreamento e marketing.
