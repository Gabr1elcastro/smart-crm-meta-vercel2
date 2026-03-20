# Tutorial da Agenda Google Calendar

Este componente fornece um tutorial interativo para ajudar os clientes a configurar sua agenda do Google Calendar para integração com a plataforma SmartCRM.

## 🎯 **Fluxo Completo da Configuração**

### **1. Clique em "Configurar"** → Abre o tutorial
### **2. Sair do tutorial** → Abre automaticamente popup para ID da agenda
### **3. Inserir ID** → Salvar configuração

## ✨ **Funcionalidades**

- **Tutorial em 3 passos**: Guia o usuário através do processo completo de configuração
- **Navegação intuitiva**: Botões para avançar, retroceder e pular
- **Barra de progresso**: Mostra o progresso atual do tutorial
- **Design responsivo**: Funciona bem em dispositivos móveis e desktop
- **Opção de pular**: Permite que o usuário ignore o tutorial se desejar
- **Fluxo automático**: Popup para ID da agenda abre automaticamente após o tutorial
- **Validação**: Verifica se o ID está no formato correto

## 📋 **Passos do Tutorial**

### Passo 1: Criar uma nova agenda
- Acessar Google Calendar
- Criar nova agenda com nome descritivo
- Configurar agenda específica para consultas

### Passo 2: Configurar compartilhamento
- Compartilhar agenda com `bruno.cunha@usesmartcrm.com`
- Definir permissões: **Fazer alterações e gerenciar compartilhamento**
- Clicar em **Enviar**

### Passo 3: Obter ID da agenda
- Localizar seção "Integrar agenda"
- Copiar ID único da agenda
- Formato: `[hash]@group.calendar.google.com`

## 🚀 **Como Usar**

### Opção 1: Botão de Configuração (Recomendado)

```tsx
import GoogleCalendarTutorialButton from "@/components/GoogleCalendarTutorialButton";

// Uso básico
<GoogleCalendarTutorialButton />

// Personalizado
<GoogleCalendarTutorialButton 
  variant="outline" 
  size="lg"
  className="w-full"
>
  Configurar Minha Agenda
</GoogleCalendarTutorialButton>
```

### Opção 2: Controle Manual

```tsx
import GoogleCalendarTutorial from "@/components/GoogleCalendarTutorial";

const [isTutorialOpen, setIsTutorialOpen] = useState(false);

<Button onClick={() => setIsTutorialOpen(true)}>
  Configurar
</Button>

<GoogleCalendarTutorial
  isOpen={isTutorialOpen}
  onClose={() => setIsTutorialOpen(false)}
/>
```

### Opção 3: Exemplo Completo

```tsx
import React from "react";
import { Button } from "@/components/ui/button";
import GoogleCalendarTutorialButton from "./GoogleCalendarTutorialButton";

export default function ConfiguracaoAgenda() {
  return (
    <div className="space-y-4">
      <h2>Configuração da Agenda</h2>
      
      <div className="flex gap-2">
        <GoogleCalendarTutorialButton />
        <Button variant="outline">Ver Status</Button>
      </div>
    </div>
  );
}
```

## 🔄 **Fluxo Automático**

### **Sequência de Ações:**

1. **Usuário clica em "Configurar"**
   - Abre o tutorial interativo
   - Mostra os 3 passos detalhados

2. **Usuário sai do tutorial** (concluir, pular ou fechar)
   - Tutorial fecha automaticamente
   - **Popup para ID da agenda abre automaticamente**

3. **Usuário insere o ID da agenda**
   - Campo de texto com placeholder explicativo
   - Validação de formato
   - Botões Salvar/Cancelar

4. **Configuração finalizada**
   - ID salvo na plataforma
   - Usuário pode usar a agenda integrada

## 🎨 **Componentes Disponíveis**

### 1. `GoogleCalendarTutorialButton`
Botão inteligente que gerencia todo o fluxo automaticamente.

**Props:**
- `variant`: Estilo do botão (default, outline, secondary, etc.)
- `size`: Tamanho do botão (default, sm, lg, icon)
- `className`: Classes CSS adicionais
- `children`: Texto do botão

**Funcionalidades:**
- Abre tutorial ao clicar
- Gerencia popup para ID automaticamente
- Valida e salva o ID da agenda

### 2. `GoogleCalendarTutorial`
Modal do tutorial que pode ser controlado manualmente.

**Props:**
- `isOpen`: Controla se o tutorial está aberto
- `onClose`: Função chamada ao fechar o tutorial

### 3. `GoogleCalendarTutorialExample`
Exemplo de implementação com card de configuração.

### 4. `GoogleCalendarTutorialFlow`
Demonstração visual do fluxo completo.

## 💡 **Casos de Uso**

- **Página de configurações**: Botão "Configurar Agenda" que abre o tutorial
- **Formulários de integração**: Campo com botão de ajuda integrado
- **Onboarding**: Tutorial automático para novos usuários
- **Suporte contextual**: Ajuda específica para configuração de agenda
- **Configuração de integrações**: Fluxo completo para APIs externas

## 🔧 **Personalização**

### Modificar passos do tutorial

Edite o array `tutorialSteps` no componente para:
- Alterar o conteúdo dos passos
- Adicionar novos passos
- Modificar ícones e descrições

### Estilização

O componente usa as classes do Tailwind CSS e pode ser personalizado através de:
- Modificação das classes CSS
- Alteração das cores do tema
- Ajuste do tamanho e layout

## 📁 **Estrutura de Arquivos**

```
src/
  components/
    GoogleCalendarTutorial.tsx          # Componente principal do tutorial
    GoogleCalendarTutorialButton.tsx    # Botão inteligente com fluxo automático
    GoogleCalendarTutorialExample.tsx   # Exemplo de implementação
    GoogleCalendarTutorialFlow.tsx      # Demonstração do fluxo completo
    GoogleCalendarTutorialDebug.tsx     # Versão para debug
    GoogleCalendarTutorialSimple.tsx    # Versão simplificada
    GoogleCalendarTutorialTest.tsx      # Teste com diferentes variantes
```

## 🎯 **Benefícios para o Usuário**

1. **Reduz fricção**: Guia passo a passo sem necessidade de suporte
2. **Aumenta conversão**: Usuários conseguem configurar sozinhos
3. **Melhora experiência**: Interface intuitiva e amigável
4. **Reduz erros**: Instruções claras e específicas
5. **Flexibilidade**: Opção de pular para usuários experientes
6. **Fluxo automático**: Popup para ID abre automaticamente
7. **Validação integrada**: Verifica formato do ID antes de salvar

## 🚀 **Próximas Melhorias**

- [ ] Adicionar screenshots dos passos
- [ ] Implementar modo escuro
- [ ] Adicionar animações de transição
- [ ] Suporte a múltiplos idiomas
- [ ] Integração com analytics para rastrear uso
- [ ] Tutorial automático para novos usuários
- [ ] Lembretes periódicos para configuração
- [ ] Salvamento automático do ID no banco de dados
- [ ] Teste de conectividade com a agenda
- [ ] Histórico de configurações anteriores
