# 🚀 Integração RD Station - Implementação Completa

## 📋 **Visão Geral**

A integração com RD Station foi implementada com um fluxo completo em 3 etapas que permite aos usuários conectar sua conta, escolher um funil padrão e configurar palavras-chave para atualização automática.

## 🏗️ **Arquitetura Implementada**

### 1. **Banco de Dados**

#### **Tabela `funis_rd`**
```sql
- id (SERIAL PRIMARY KEY)
- id_cliente (INTEGER NOT NULL)
- id_funil_rd (VARCHAR(255) NOT NULL) -- ID do funil no RD Station
- nome_funil (VARCHAR(255) NOT NULL)
- funil_padrao (BOOLEAN DEFAULT FALSE)
- created_at (TIMESTAMP WITH TIME ZONE)
- updated_at (TIMESTAMP WITH TIME ZONE)
```

#### **Tabela `etapas_funis_rd`**
```sql
- id (SERIAL PRIMARY KEY)
- id_cliente (INTEGER NOT NULL)
- id_funil_rd (VARCHAR(255) NOT NULL) -- ID do funil no RD Station
- nome_etapa (VARCHAR(255) NOT NULL)
- palavra_chave (TEXT) -- Palavras-chave para atualização automática
- created_at (TIMESTAMP WITH TIME ZONE)
```

### 2. **Serviços Implementados**

#### **FunisRdService** (`src/services/funisRdService.ts`)
```typescript
// Buscar todos os funis RD do cliente
static async getFunisRd(): Promise<FunilRD[]>

// Buscar funil RD específico com suas etapas
static async getFunilRdComEtapas(id: number): Promise<FunilRDComEtapas | null>

// Definir funil RD como padrão
static async setFunilRdPadrao(id: number): Promise<boolean>

// Atualizar palavras-chave das etapas
static async atualizarPalavrasChaveEtapas(etapas: { id: number; palavra_chave: string }[]): Promise<boolean>

// Verificar se há funis RD disponíveis
static async hasFunisRd(): Promise<boolean>

// Buscar funil RD padrão
static async getFunilRdPadrao(): Promise<FunilRD | null>
```

#### **ClientesService** (atualizado)
- **Método `setRdStationToken`** agora dispara webhook automaticamente
- Envia `id_cliente` e `token` para `https://webhook.dev.usesmartcrm.com/webhook/conectando_funis`

### 3. **Interface do Usuário**

#### **RdStationIntegrationModal** (`src/components/modals/RdStationIntegrationModal.tsx`)
Modal avançado com 4 etapas:

1. **Etapa 1 - Token**: Usuário insere o token do RD Station
2. **Etapa 2 - Carregamento**: Animação enquanto busca funis via webhook
3. **Etapa 3 - Seleção**: Usuário escolhe qual funil será padrão
4. **Etapa 4 - Configuração**: Usuário define palavras-chave para cada etapa

## 🔄 **Fluxo de Integração**

### **Passo 1: Conexão Inicial**
1. Usuário clica em "Conectar" no RD Station
2. Modal abre na etapa de inserção do token
3. Usuário insere o token e clica em "Conectar"

### **Passo 2: Processamento Webhook**
1. Token é salvo no banco de dados
2. Webhook é disparado para `https://webhook.dev.usesmartcrm.com/webhook/conectando_funis`
3. Webhook busca funis e etapas no RD Station
4. Dados são salvos nas tabelas `funis_rd` e `etapas_funis_rd`
5. Modal mostra animação de carregamento

### **Passo 3: Seleção do Funil Padrão**
1. Modal exibe lista de funis encontrados
2. Usuário seleciona qual funil será padrão
3. Usuário clica em "Configurar Palavras-chave"

### **Passo 4: Configuração de Palavras-chave**
1. Modal exibe todas as etapas do funil selecionado
2. Usuário pode definir palavras-chave para cada etapa (opcional)
3. Usuário clica em "Salvar e Finalizar"
4. Funil é definido como padrão
5. Palavras-chave são salvas no banco

## 🎯 **Funcionalidades Principais**

### **Integração Automática**
- ✅ Disparo automático de webhook ao conectar
- ✅ Busca automática de funis e etapas
- ✅ Salvamento automático no banco de dados

### **Interface Intuitiva**
- ✅ Modal com etapas claras e progressivas
- ✅ Animações de carregamento
- ✅ Feedback visual para cada ação
- ✅ Validação de dados em tempo real

### **Configuração Flexível**
- ✅ Escolha do funil padrão
- ✅ Configuração opcional de palavras-chave
- ✅ Suporte a múltiplos funis por cliente

### **Segurança e Performance**
- ✅ RLS (Row Level Security) habilitado
- ✅ Índices para performance
- ✅ Validação de permissões por cliente
- ✅ Constraint para apenas um funil padrão por cliente

## 📝 **Como Usar**

### **Para Desenvolvedores**

1. **Execute o script SQL**:
   ```sql
   -- Execute o arquivo CRIAR-TABELAS-FUNIS-RD.sql no Supabase
   ```

2. **Importe o modal**:
   ```typescript
   import RdStationIntegrationModal from '@/components/modals/RdStationIntegrationModal';
   ```

3. **Use o serviço**:
   ```typescript
   import { FunisRdService } from '@/services/funisRdService';
   
   // Buscar funis RD
   const funis = await FunisRdService.getFunisRd();
   
   // Definir funil padrão
   await FunisRdService.setFunilRdPadrao(funilId);
   ```

### **Para Usuários**

1. Acesse **Conexões** no menu lateral
2. Clique em **"Conectar"** no card do RD Station
3. Insira seu token do RD Station
4. Aguarde o carregamento dos funis
5. Escolha o funil que será padrão
6. Configure as palavras-chave (opcional)
7. Finalize a configuração

## 🔧 **Configuração do Webhook**

O webhook `https://webhook.dev.usesmartcrm.com/webhook/conectando_funis` deve:

1. **Receber**: `{ id_cliente: number, token: string }`
2. **Buscar**: Funis e etapas no RD Station usando o token
3. **Salvar**: Dados nas tabelas `funis_rd` e `etapas_funis_rd`
4. **Responder**: `'Workflow Completed'` quando finalizado

## 🚨 **Observações Importantes**

- O webhook é disparado de forma assíncrona e não bloqueia a interface
- Se o webhook falhar, a conexão ainda é salva (apenas os funis não são carregados)
- Apenas um funil pode ser padrão por cliente
- As palavras-chave são opcionais mas recomendadas para atualização automática
- Todas as operações respeitam as políticas RLS do Supabase

## 📊 **Estrutura de Dados**

### **FunilRD**
```typescript
interface FunilRD {
  id: number;
  id_cliente: number;
  id_funil_rd: string;
  nome_funil: string;
  funil_padrao: boolean;
  created_at: string;
  updated_at: string;
}
```

### **EtapaFunilRD**
```typescript
interface EtapaFunilRD {
  id: number;
  id_cliente: number;
  id_funil_rd: string;
  nome_etapa: string;
  palavra_chave?: string;
  created_at: string;
}
```

## ✅ **Status da Implementação**

- [x] Criação das tabelas no banco de dados
- [x] Implementação dos serviços
- [x] Disparo automático do webhook
- [x] Modal com 4 etapas de configuração
- [x] Animações de carregamento
- [x] Seleção de funil padrão
- [x] Configuração de palavras-chave
- [x] Integração com a página de conexões
- [x] Políticas RLS e segurança
- [x] Documentação completa

A integração está **100% funcional** e pronta para uso! 🎉

