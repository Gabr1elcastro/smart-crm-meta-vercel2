# 🎨 Sistema White Label - Implementação Completa

## 📋 **Visão Geral**

O sistema White Label permite que clientes personalizem a aparência da plataforma com suas próprias cores, fontes e logo. A personalização é aplicada automaticamente após o login, mantendo a tela de login com o layout padrão.

## 🏗️ **Arquitetura Implementada**

### 1. **Banco de Dados**
- **Tabela**: `temas`
- **Campos**:
  - `id_cliente` (int) - ID do cliente
  - `cor_primaria` (string) - Cor principal (usada como background)
  - `cor_secundaria` (string) - Cor secundária (usada em botões, elementos secundários)
  - `cor_texto` (string) - Cor do texto (para legibilidade)
  - `logo_url` (string|null) - URL da logo personalizada
  - `fonte` (string) - Família de fonte personalizada
  - `dominio` (string|null) - Domínio personalizado (futuro)

### 2. **Componentes Criados**

#### **TemaService** (`src/services/temaService.ts`)
```typescript
// Buscar tema por ID do cliente
TemaService.getTemaByClienteId(idCliente: number): Promise<Tema | null>

// Buscar tema por ID do usuário
TemaService.getTemaByUserId(userId: string): Promise<Tema | null>

// Verificar se tem tema personalizado
TemaService.hasTemaPersonalizado(idCliente: number): Promise<boolean>
```

#### **useTema Hook** (`src/hooks/useTema.ts`)
```typescript
const { 
  tema, 
  temaAplicado, 
  loading, 
  hasTemaPersonalizado,
  aplicarTema,
  removerTema 
} = useTema();
```

#### **TemaProvider** (`src/components/TemaProvider.tsx`)
- Aplica estilos CSS dinâmicos baseados no tema
- Gerencia variáveis CSS customizadas
- Aplica classe `tema-personalizado` no body

#### **TemaDebug** (`src/components/TemaDebug.tsx`)
- Componente para debug (apenas em desenvolvimento)
- Mostra informações do tema ativo

### 3. **Integração no Sistema**

#### **AppLayout** (`src/components/layout/AppLayout.tsx`)
- `<TemaProvider />` integrado após o login
- Aplicação automática do tema quando usuário loga

## 🎯 **Como Funciona**

### **Fluxo de Aplicação do Tema:**

1. **Usuário faz login** → Sistema verifica se tem tema na tabela `temas`
2. **Se tem tema** → Aplica estilos personalizados
3. **Se não tem tema** → Mantém layout padrão
4. **Tela de login** → Sempre mantém layout padrão

### **Aplicação de Estilos:**

```css
/* Variáveis CSS aplicadas dinamicamente */
:root {
  --primary-color: #FFD700;    /* Cor primária */
  --secondary-color: #FF8C00;  /* Cor secundária */
  --text-color: #FFFFFF;       /* Cor do texto */
  --font-family: Arial, Helvetica, sans-serif;
}

/* Classe aplicada no body */
.tema-personalizado {
  /* Todos os estilos personalizados */
}
```

## 🎨 **Modos de Personalização**

### **1. Apenas Logo** 🖼️
- **Quando**: Tabela `temas` contém apenas `logo_url` (sem cores/fonte)
- **Comportamento**: 
  - ✅ Mantém layout padrão da plataforma
  - ✅ Altera apenas a logo no Sidebar
  - ✅ Não aplica cores ou fontes personalizadas
  - ✅ Não adiciona classe `.tema-personalizado`

### **2. Tema Completo** 🎨
- **Quando**: Tabela `temas` contém cores ou fonte
- **Comportamento**:
  - ✅ Aplica cores personalizadas
  - ✅ Aplica fonte personalizada
  - ✅ Altera logo
  - ✅ Adiciona classe `.tema-personalizado`

### **3. Layout Padrão** 🔧
- **Quando**: Não há registro na tabela `temas`
- **Comportamento**:
  - ✅ Usa logo padrão do SmartCRM
  - ✅ Mantém cores e fontes padrão
  - ✅ Layout original da plataforma

## 🎨 **Elementos Personalizados**

### **Cores Aplicadas:**
- **Cor Primária**: **Background de toda a página**, botões primários, sidebar
- **Cor Secundária**: Botões secundários, elementos de apoio, cards
- **Cor do Texto**: Textos principais, links, títulos

### **Elementos Afetados:**
- ✅ **Backgrounds** (sidebar, headers, cards)
- ✅ **Botões** (primários e secundários)
- ✅ **Textos** (títulos, links, conteúdo)
- ✅ **Inputs** (focus states)
- ✅ **Badges** e **Tags**
- ✅ **Logo** (sidebar e header)
- ✅ **Modais** e **Dropdowns**
- ✅ **Tabelas** e **Progress bars**
- ✅ **Fontes** (aplicadas globalmente)

## 🖼️ **Logo Personalizada**

### **Como Funciona:**
- A logo é carregada automaticamente da tabela `temas.logo_url`
- Se não houver logo personalizada, usa a logo padrão do SmartCRM
- Fallback automático em caso de erro no carregamento da imagem
- Aplicada em **Sidebar** e **Header** da aplicação

### **Componente:**
```tsx
import { LogoPersonalizada } from '@/components/LogoPersonalizada';

<LogoPersonalizada 
  alt="Minha Logo" 
  className="h-10" 
  fallbackSrc="/logo-padrao.png" // opcional
/>
```

## 📊 **Exemplo de Uso**

### **Tema na Tabela `temas`:**
```json
{
  "id": 1,
  "id_cliente": 114,
  "cor_primaria": "#FFD700",
  "cor_secundaria": "#FF8C00", 
  "cor_texto": "#FFFFFF",
  "logo_url": null,
  "fonte": "Arial, Helvetica, sans-serif"
}
```

### **Resultado Visual:**
- **Background**: Dourado (#FFD700)
- **Botões**: Laranja (#FF8C00)
- **Texto**: Branco (#FFFFFF)
- **Fonte**: Arial

## 🔧 **Configuração**

### **Para Adicionar Tema Personalizado:**

1. **Inserir na tabela `temas`:**
```sql
INSERT INTO temas (id_cliente, cor_primaria, cor_secundaria, cor_texto, fonte)
VALUES (114, '#FFD700', '#FF8C00', '#FFFFFF', 'Arial, Helvetica, sans-serif');
```

2. **O sistema aplicará automaticamente** após o próximo login

### **Para Remover Tema:**
```sql
DELETE FROM temas WHERE id_cliente = 114;
```

## 🎯 **Benefícios**

- ✅ **Personalização completa** da aparência
- ✅ **Aplicação automática** após login
- ✅ **Tela de login preservada** (layout padrão)
- ✅ **Legibilidade garantida** (cores contrastantes)
- ✅ **Sistema flexível** (fácil adição/remoção)
- ✅ **Performance otimizada** (CSS dinâmico)
- ✅ **Debug integrado** (modo desenvolvimento)

## 🚀 **Próximos Passos**

- **Logo personalizada**: Implementar exibição da logo_url
- **Domínio personalizado**: Suporte a domínios customizados
- **Temas múltiplos**: Suporte a vários temas por cliente
- **Editor visual**: Interface para criar temas
- **Preview**: Visualização antes de aplicar

## 🧪 **Como Testar**

1. **Adicionar tema** na tabela `temas` para um cliente
2. **Fazer login** com usuário desse cliente
3. **Verificar** se os estilos foram aplicados
4. **Remover tema** da tabela
5. **Fazer logout/login** para verificar volta ao padrão

O sistema está pronto e funcionando! 🎉
