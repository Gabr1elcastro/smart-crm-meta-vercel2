# Correção de Conteúdo das Páginas para Gestores Inscritos

## 🚨 Problema Identificado

Os gestores inscritos conseguiam ver os itens no sidebar, mas ao clicar neles, as páginas não mostravam conteúdo (configurações, chips logados, etc.).

## 🔍 Causa Raiz

O problema estava nas **páginas específicas** que faziam verificações diretas na tabela `clientes_info` usando o email do usuário, mas para gestores inscritos:

1. **Email não está na tabela `clientes_info`** - apenas no campo `id_gestor`
2. **Método `getClienteByUserId`** só buscava por `user_id_auth`
3. **Verificações de planos** não consideravam gestores inscritos

## ✅ Correções Implementadas

### **1. Página MeusChips (`src/pages/meus-chips/MeusChips.tsx`)**

#### **Problema:**
```typescript
// ANTES - Só verificava por email (Admin)
const { data, error } = await supabase
  .from('clientes_info')
  .select('plano_pro, plano_plus')
  .eq('email', user.email)  // ❌ Gestores não têm email na tabela
  .single();
```

#### **Solução:**
```typescript
// DEPOIS - Verifica Admin E Gestor inscrito
// Primeiro, verificar se é Admin
const { data: adminData, error: adminError } = await supabase
  .from('clientes_info')
  .select('plano_pro, plano_plus')
  .eq('email', user.email)
  .single();

if (adminData && !adminError) {
  // Usuário é Admin - usar planos diretos
  setHasProOrPlusPlan(hasPro || hasPlus);
} else {
  // Verificar se é Gestor inscrito
  const { data: gestorData, error: gestorError } = await supabase
    .from('clientes_info')
    .select('plano_pro, plano_plus')
    .contains('id_gestor', [user.id])  // ✅ Busca por ID no array
    .eq('id', user.id_cliente)
    .single();

  if (gestorData && !gestorError) {
    // Usuário é Gestor inscrito - herdar planos do cliente
    setHasProOrPlusPlan(hasPro || hasPlus);
  }
}
```

#### **Função `logUserInstances` também corrigida:**
```typescript
// ANTES - Só por email
.eq('email', userEmail)

// DEPOIS - Admin E Gestor
// Admin
.eq('email', userEmail)
// OU Gestor
.contains('id_gestor', [userId])
```

### **2. Serviço ClientesService (`src/services/clientesService.ts`)**

#### **Problema:**
```typescript
// ANTES - Só buscava por user_id_auth (Admin)
const { data, error } = await supabase
  .from('clientes_info')
  .select('*')
  .eq('user_id_auth', userId)  // ❌ Gestores não têm user_id_auth
  .single();
```

#### **Solução:**
```typescript
// DEPOIS - Busca Admin E Gestor inscrito
// Primeiro, buscar pelo user_id_auth (Admin)
const { data: adminData, error: adminError } = await supabase
  .from('clientes_info')
  .select('*')
  .eq('user_id_auth', userId)
  .single();

if (adminData && !adminError) {
  // Usuário é Admin - retornar dados diretos
  return adminData;
}

// Se não é Admin, verificar se é Gestor inscrito
const { data: gestorData, error: gestorError } = await supabase
  .from('clientes_info')
  .select('*')
  .contains('id_gestor', [userId])  // ✅ Busca por ID no array
  .single();

if (gestorData && !gestorError) {
  // Usuário é Gestor inscrito - retornar dados do cliente
  return gestorData;
}
```

## 🎯 Impacto das Correções

### **Páginas Afetadas:**

1. **✅ MeusChips** (`/meus-chips`)
   - Agora mostra chips corretamente para gestores
   - Verifica planos Pro/Plus herdados do cliente
   - Exibe instâncias do cliente

2. **✅ Conexões** (`/conexoes`)
   - Agora mostra status das conexões do cliente
   - Funciona via `clientesService.getClienteByUserId()` corrigido

3. **✅ Configurações** (`/settings`)
   - Já funcionava (apenas exibe dados do usuário)

4. **✅ Agentes de IA** (`/chatbots`)
   - Já funcionava (não faz verificações específicas de cliente)

### **Funcionalidades Restauradas:**

- ✅ **Chips logados** - Gestores veem instâncias do cliente
- ✅ **Status das conexões** - Instagram, RD Station, Kommo, etc.
- ✅ **Planos herdados** - Pro, Plus, etc. do cliente
- ✅ **Configurações** - Acesso completo às configurações
- ✅ **Todas as funcionalidades** - Acesso completo como Admin

## 🧪 Teste das Correções

### **Cenário de Teste:**
```json
{
  "id": 114,
  "name": "Financeiro EA",
  "email": "diego.almeida@basicobemfeito.com",
  "id_gestor": "29",
  "plano_pro": true,
  "instance_id": "c4eb3239-371d-4f3e-bfbe-af5454b83455",
  "instance_name": "smartcrm_114_financeiro"
}
```

### **Resultado Esperado:**
- ✅ **Usuário ID "29"** deve ver conteúdo completo
- ✅ **MeusChips** - Mostra Chip 1 e Chip 2 (se plano Pro/Plus)
- ✅ **Conexões** - Mostra status das integrações do cliente
- ✅ **Configurações** - Acesso completo
- ✅ **Agentes de IA** - Acesso completo

### **Verificação no Console:**
```typescript
// MeusChips - deve mostrar:
console.log('Plano do Gestor (herdado):', {
  email: user.email,
  cliente_id: user.id_cliente,
  plano_pro: gestorData?.plano_pro,
  plano_plus: gestorData?.plano_plus,
  hasProOrPlusPlan: hasPro || hasPlus
});

// Conexões - deve mostrar:
console.log('Cliente encontrado:', cliente);
// Deve retornar dados do cliente 114
```

## 🔧 Troubleshooting

### **Problema: Gestor ainda não vê conteúdo**
**Solução:**
```sql
-- Verificar se o gestor está no campo id_gestor
SELECT id, name, id_gestor FROM clientes_info WHERE id = 114;

-- Verificar se o usuário está sendo detectado como gestor
SELECT * FROM clientes_info WHERE '29' = ANY(id_gestor);
```

### **Problema: Planos não são herdados**
**Solução:**
```typescript
// Verificar se os planos estão sendo detectados
const { userType, plano_pro, plano_plus } = useUserType();
console.log('UserType:', userType);
console.log('Plano Pro:', plano_pro);
console.log('Plano Plus:', plano_plus);
```

### **Problema: Cache não está sendo limpo**
**Solução:**
```typescript
// Limpar cache manualmente se necessário
clientesService.clearCache(user.id);
```

## 📊 Status das Correções

- ✅ **MeusChips** - Corrigido para gestores
- ✅ **ClienteService** - Corrigido para gestores
- ✅ **Verificações de planos** - Corrigidas para gestores
- ✅ **Instâncias** - Corrigidas para gestores
- ✅ **Conexões** - Funcionando via serviço corrigido
- ✅ **Compatibilidade** - Mantida para Admins

## 🎉 Resultado Final

**Gestores inscritos agora têm acesso completo ao conteúdo das páginas:**
- ✅ **Meus Chips** - Vê chips e instâncias do cliente
- ✅ **Conexões** - Vê status das integrações do cliente
- ✅ **Configurações** - Acesso completo
- ✅ **Agentes de IA** - Acesso completo
- ✅ **Todas as funcionalidades** - Funcionam como Admin

---

**Problema resolvido!** 🎉

Os gestores inscritos agora conseguem ver e usar todo o conteúdo das páginas, com acesso completo às funcionalidades do cliente.




