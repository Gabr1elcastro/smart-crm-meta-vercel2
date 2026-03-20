# Solução: Cliente ID Incorreto no Login

## Problema Identificado

O cliente com email `bbf.materiais@gmail.com` (ID 6) estava sendo identificado como ID 132 ao fazer login.

## Causa Raiz

O problema estava na lógica de busca do cliente no `AuthContext.tsx`. O código estava usando `.single()` para buscar o cliente por email:

```typescript
const { data: clienteInfo } = await supabase
  .from('clientes_info')
  .select('id')
  .eq('email', supabaseUser.email)
  .single(); // ← PROBLEMA: Retorna apenas um registro
```

Quando há múltiplos registros com o mesmo email na tabela `clientes_info`, o método `.single()` pode retornar qualquer um dos registros, não necessariamente o mais antigo/correto.

## Solução Implementada

### 1. Modificação na Busca do Cliente

Substituído o método `.single()` por uma busca ordenada que retorna o registro mais antigo (ID menor):

```typescript
// ANTES (problemático)
const { data: clienteInfo } = await supabase
  .from('clientes_info')
  .select('id')
  .eq('email', supabaseUser.email)
  .single();

// DEPOIS (corrigido)
const { data: clientesInfo } = await supabase
  .from('clientes_info')
  .select('id')
  .eq('email', supabaseUser.email)
  .order('id', { ascending: true }) // Ordena por ID crescente
  .limit(1); // Pega apenas o primeiro (mais antigo)

if (clientesInfo && clientesInfo.length > 0) {
  const clienteInfo = clientesInfo[0];
  // ... resto da lógica
}
```

### 2. Aplicação em Dois Locais

A correção foi aplicada em dois locais do `AuthContext.tsx`:

1. **Função `initSession`** (linha ~80): Para quando a sessão é inicializada
2. **Listener `onAuthStateChange`** (linha ~180): Para quando o usuário faz login

## Benefícios da Solução

### ✅ **Consistência**
- Sempre retorna o registro mais antigo (ID menor)
- Garante que o cliente correto seja identificado

### ✅ **Robustez**
- Funciona mesmo com múltiplos registros duplicados
- Não quebra se houver inconsistências no banco

### ✅ **Rastreabilidade**
- Logs adicionados para debug: `"AuthProvider: id_cliente corrigido para:"`
- Fácil identificação de quando a correção é aplicada

## Comportamento Atual

1. **Login do usuário**: Sistema busca o cliente por email
2. **Múltiplos registros**: Retorna o registro com ID menor (mais antigo)
3. **Atualização de metadados**: Atualiza `user_metadata` com o ID correto
4. **Log de debug**: Mostra qual ID foi usado

## Arquivos Modificados

- `src/contexts/auth/AuthContext.tsx`
  - Função `initSession`: Busca ordenada por ID
  - Listener `onAuthStateChange`: Busca ordenada por ID

## Teste da Solução

Para testar se a correção funcionou:

1. Fazer logout do usuário
2. Fazer login novamente com `bbf.materiais@gmail.com`
3. Verificar nos logs se aparece: `"AuthProvider: id_cliente corrigido para: 6"`
4. Confirmar que o sistema usa o ID 6 em vez do 132

## Data da Implementação

$(date) 