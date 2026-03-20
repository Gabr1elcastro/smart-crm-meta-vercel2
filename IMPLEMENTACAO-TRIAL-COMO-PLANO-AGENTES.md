# 🔧 Implementação: Trial como Plano Agentes

## 🎯 **Objetivo**

Alterar a lógica do sistema para que quando o campo `trial` for `true`, o usuário tenha as mesmas funcionalidades do `plano_agentes = true`.

## ✅ **Mudanças Implementadas**

### **1. Hook usePlanStatus (`src/hooks/usePlanStatus.ts`)**

**Antes:**
```typescript
// Se plano_agentes for TRUE, não deve mostrar página de planos
if (info?.plano_agentes === true) {
  setHasActivePlan(true);
  return;
}
```

**Depois:**
```typescript
// Se plano_agentes for TRUE ou trial for TRUE, não deve mostrar página de planos
// Trial deve funcionar como plano_agentes
if (info?.plano_agentes === true || info?.trial === true) {
  setHasActivePlan(true);
  return;
}
```

### **2. Hook useUserType (`src/hooks/useUserType.ts`)**

**Antes:**
```typescript
setUserInfo({ 
  tipo_usuario: 'Admin',
  plano_agentes: adminData.plano_agentes || false
});
```

**Depois:**
```typescript
setUserInfo({ 
  tipo_usuario: 'Admin',
  // Se trial for true, deve funcionar como plano_agentes true
  plano_agentes: adminData.plano_agentes || adminData.trial || false
});
```

## 🔄 **Lógica de Funcionamento**

### **Condições para acesso total (como plano_agentes):**
- `plano_agentes = true` **OU**
- `trial = true`

### **Redirecionamento da Homepage:**
Quando `trial = true` ou `plano_agentes = true`:
- **Rota `/`** → Redireciona automaticamente para **`/conversations`**
- **Objetivo**: Focar usuários trial nas conversas (funcionalidade principal)
- **Implementação**: `useEffect` no `AppLayout.tsx` detecta e redireciona

### **Funcionalidades afetadas:**

#### **✅ Quando trial = true (mesma lógica de plano_agentes = true):**
- ❌ **Não** redireciona para página de planos
- ❌ **Não** mostra Dashboard no menu
- ❌ **Não** mostra Grupos de disparo
- ❌ **Não** mostra Disparo em Massa
- ❌ **Não** mostra Etiquetas
- ❌ **Não** mostra Followup Automático
- ❌ **Não** mostra Conexões
- ❌ **Não** mostra Meus Chips
- ❌ **Não** mostra Usuários
- ❌ **Não** mostra Ajuda
- ✅ **Mostra** Conversas
- ✅ **Mostra** Contatos
- ✅ **Mostra** Chatbots
- ✅ **Mostra** Departamentos (se tiver permissão)
- ✅ **Mostra** Configurações (se tiver permissão)
- 🔄 **Homepage**: Redireciona automaticamente para `/conversations`

## 📊 **Tabela de Permissões**

| Funcionalidade | trial = false, plano_agentes = false | trial = true OU plano_agentes = true |
|----------------|--------------------------------------|--------------------------------------|
| **Página de Planos** | ✅ Redireciona | ❌ Não redireciona |
| **Homepage (/)**: | ✅ Dashboard | 🔄 Redireciona para /conversations |
| **Dashboard** | ✅ Visível | ❌ Oculto |
| **Conversas** | ✅ Visível | ✅ Visível |
| **Contatos** | ✅ Visível | ✅ Visível |
| **Grupos de disparo** | ✅ Visível | ❌ Oculto |
| **Disparo em Massa** | ✅ Visível | ❌ Oculto |
| **Chatbots** | ✅ Visível | ✅ Visível |
| **Etiquetas** | ✅ Visível | ❌ Oculto |
| **Departamentos** | ✅ Visível* | ✅ Visível* |
| **Followup Automático** | ✅ Visível | ❌ Oculto |
| **Conexões** | ✅ Visível | ❌ Oculto |
| **Meus Chips** | ✅ Visível* | ❌ Oculto |
| **Usuários** | ✅ Visível* | ❌ Oculto |
| **Configurações** | ✅ Visível* | ✅ Visível* |
| **Ajuda** | ✅ Visível | ❌ Oculto |

*\*Depende das permissões do usuário*

## 🧪 **Testes Recomendados**

### **1. Teste com trial = true:**
- ✅ Verificar se não redireciona para /plans
- ✅ Verificar menu lateral (só deve mostrar: Conversas, Contatos, Chatbots, Departamentos*, Configurações*)
- ✅ Verificar acesso direto às páginas

### **2. Teste com trial = false:**
- ✅ Verificar se redireciona para /plans (se não tiver outros planos)
- ✅ Verificar menu lateral completo
- ✅ Verificar funcionalidades normais

### **3. Teste com plano_agentes = true:**
- ✅ Verificar se mantém comportamento anterior
- ✅ Verificar compatibilidade com trial

## ⚠️ **Considerações Importantes**

- **Compatibilidade**: A lógica mantém compatibilidade total com `plano_agentes`
- **Precedência**: Tanto `trial = true` quanto `plano_agentes = true` têm o mesmo efeito
- **Fallback**: Se ambos forem `false`, usa a lógica normal de planos
- **Segurança**: A verificação é feita no backend via hooks

## 🔧 **Arquivos Modificados**

1. `src/hooks/usePlanStatus.ts` - Lógica de redirecionamento
2. `src/hooks/useUserType.ts` - Detecção de permissões
3. `src/components/layout/AppLayout.tsx` - Redirecionamento automático para /conversations
4. `src/components/layout/Sidebar.tsx` - Comentários atualizados

---

**Status:** ✅ Implementado  
**Data:** Dezembro 2024  
**Responsável:** Assistente AI  
**Versão:** 1.0.0
