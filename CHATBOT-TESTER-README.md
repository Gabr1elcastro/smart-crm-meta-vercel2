# Funcionalidade de Teste de Chatbot

## Visão Geral

A funcionalidade de teste de chatbot permite aos usuários testar seus chatbots diretamente na interface, sem precisar configurar um ambiente externo. O teste é realizado através de um chat flutuante que aparece no canto inferior direito da página de chatbots.

## Componentes Criados

### 1. ChatbotTester.tsx
Componente principal que renderiza o chat flutuante com as seguintes funcionalidades:
- Seleção de chatbot para teste
- Interface de chat em tempo real
- Minimização/maximização do chat
- Troca de chatbot durante o teste
- Reset automático ao fechar

### 2. ChatbotTestButton.tsx
Botão flutuante que fica no canto inferior direito da página de chatbots:
- Ícone de chat (MessageSquare)
- Abre o ChatbotTester quando clicado
- Posicionamento fixo com z-index adequado

### 3. ChatbotEmptyState.tsx
Componente para mostrar estado vazio quando não há chatbots disponíveis:
- Interface amigável para usuários sem chatbots
- Botões para criar chatbot ou ir para a página de chatbots
- Design consistente com o resto da aplicação

### 4. useChatbotTest.ts
Hook personalizado para gerenciar o estado do teste:
- Busca de chatbots disponíveis
- Gerenciamento de mensagens
- Envio de mensagens
- Reset do chat
- Seleção de chatbot

## Funcionalidades Implementadas

### ✅ Frontend Completo
- [x] Botão flutuante no canto inferior direito
- [x] Chat pop-up com interface moderna
- [x] Seleção de chatbot
- [x] Interface de mensagens em tempo real
- [x] Minimização/maximização
- [x] Troca de chatbot durante o teste
- [x] Reset automático ao fechar
- [x] Estado vazio quando não há chatbots
- [x] Auto-scroll para última mensagem
- [x] Indicador de carregamento
- [x] Formatação de horário
- [x] Responsividade

### 🔄 Backend (Próxima Fase)
- [ ] API para processar mensagens dos chatbots
- [ ] Integração com IA (GPT/Claude)
- [ ] Processamento de fluxos de chatbot
- [ ] Histórico de conversas
- [ ] Métricas de teste

## Como Usar

1. **Acesse a página de Chatbots** (`/chatbots`)
2. **Clique no botão flutuante** no canto inferior direito
3. **Selecione um chatbot** da lista disponível
4. **Digite mensagens** e veja as respostas
5. **Troque de chatbot** usando o botão de configurações
6. **Feche o chat** para resetar automaticamente

## Estrutura de Arquivos

```
src/
├── components/
│   └── chatbot/
│       ├── ChatbotTester.tsx      # Componente principal do chat
│       ├── ChatbotTestButton.tsx   # Botão flutuante
│       ├── ChatbotEmptyState.tsx   # Estado vazio
│       └── index.ts               # Exportações
├── hooks/
│   └── useChatbotTest.ts          # Hook personalizado
└── pages/
    └── chatbots/
        └── Chatbots.tsx           # Página principal (integração)
```

## Próximos Passos

### Backend
1. Criar API endpoint para processar mensagens
2. Integrar com serviços de IA (OpenAI, Claude)
3. Implementar processamento de fluxos
4. Adicionar autenticação e autorização
5. Implementar rate limiting

### Frontend
1. Adicionar suporte a diferentes tipos de mídia
2. Implementar histórico de conversas
3. Adicionar métricas de teste
4. Melhorar UX com animações
5. Adicionar suporte a múltiplos idiomas

## Tecnologias Utilizadas

- **React** com TypeScript
- **Tailwind CSS** para estilização
- **Lucide React** para ícones
- **Supabase** para dados
- **Sonner** para notificações
- **React Router** para navegação

## Considerações de Performance

- Chat minimizado para economizar espaço
- Auto-scroll otimizado
- Debounce no input
- Lazy loading de componentes
- Reset automático para limpar memória

## Considerações de UX

- Interface intuitiva e familiar
- Feedback visual para todas as ações
- Estados de carregamento claros
- Mensagens de erro amigáveis
- Design responsivo
- Acessibilidade (ARIA labels, navegação por teclado) 