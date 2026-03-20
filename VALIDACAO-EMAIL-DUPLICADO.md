# Validação de E-mail Duplicado

## Problema Resolvido

Antes de criar um usuário (seja via signup ou criação de atendente), o sistema agora verifica se o e-mail já existe nas tabelas `clientes_info` e `atendentes` para evitar duplicação.

## Implementação

### 1. Função de Validação

A função `checkEmailExists` foi implementada em dois locais:

- **`src/contexts/auth/authActions.ts`** - Para validação no signup
- **`src/services/atendentesService.ts`** - Para validação na criação de atendentes

```typescript
async function checkEmailExists(email: string): Promise<{ exists: boolean; table: string | null }> {
  try {
    // Verificar na tabela clientes_info
    const { data: clienteData, error: clienteError } = await supabase
      .from('clientes_info')
      .select('id')
      .eq('email', email)
      .single();

    if (clienteData) {
      return { exists: true, table: 'clientes_info' };
    }

    // Verificar na tabela atendentes
    const { data: atendenteData, error: atendenteError } = await supabase
      .from('atendentes')
      .select('id')
      .eq('email', email)
      .single();

    if (atendenteData) {
      return { exists: true, table: 'atendentes' };
    }

    return { exists: false, table: null };
  } catch (error) {
    // Se não encontrou em nenhuma tabela, o e-mail está disponível
    return { exists: false, table: null };
  }
}
```

### 2. Validação no Signup

No arquivo `authActions.ts`, a validação é executada antes do `supabase.auth.signUp`:

```typescript
// Verificar se o e-mail já existe nas tabelas clientes_info e atendentes
console.log("Verificando se o e-mail já existe...");
const emailCheck = await checkEmailExists(email);

if (emailCheck.exists) {
  const tableName = emailCheck.table === 'clientes_info' ? 'cliente' : 'atendente';
  const errorMessage = `Este e-mail já está vinculado a uma conta de ${tableName}.`;
  console.error("E-mail já existe:", emailCheck);
  setError(errorMessage);
  return;
}
```

### 3. Validação na Criação de Atendentes

No arquivo `atendentesService.ts`, a validação é executada antes de chamar o webhook:

```typescript
// Verificar se o e-mail já existe antes de criar
console.log("Verificando se o e-mail já existe antes de criar atendente...");
const emailCheck = await checkEmailExists(email);

if (emailCheck.exists) {
  const tableName = emailCheck.table === 'clientes_info' ? 'cliente' : 'atendente';
  throw new Error(`Este e-mail já está vinculado a uma conta de ${tableName}.`);
}
```

## Mensagens de Erro

### Para Signup:
- **E-mail de cliente**: "Este e-mail já está vinculado a uma conta de cliente."
- **E-mail de atendente**: "Este e-mail já está vinculado a uma conta de atendente."

### Para Criação de Atendentes:
- **E-mail de cliente**: "Este e-mail já está vinculado a uma conta de cliente."
- **E-mail de atendente**: "Este e-mail já está vinculado a uma conta de atendente."

## Script de Teste

Foi criado o script `test-email-validation.cjs` para testar a validação:

### Comandos Disponíveis:

#### Listar todos os e-mails cadastrados:
```bash
node test-email-validation.cjs list
```

#### Verificar e-mail específico:
```bash
node test-email-validation.cjs check usuario@exemplo.com
```

#### Testar com e-mails de exemplo:
```bash
node test-email-validation.cjs test
```

## Fluxo de Validação

1. **Usuário tenta cadastrar** (signup ou criar atendente)
2. **Sistema verifica** se o e-mail existe em `clientes_info`
3. **Se não encontrou**, verifica em `atendentes`
4. **Se encontrou em qualquer tabela**, retorna erro específico
5. **Se não encontrou em nenhuma**, permite o cadastro

## Tabelas Verificadas

### clientes_info
- Campo: `email`
- Tipo: Cliente principal (usuário "pai")

### atendentes
- Campo: `email`
- Tipo: Atendentes/collaboradores

## Benefícios

1. **Evita duplicação** de e-mails no sistema
2. **Mensagens claras** sobre onde o e-mail já existe
3. **Validação consistente** em todos os pontos de criação
4. **Previne conflitos** entre clientes e atendentes
5. **Melhora a experiência** do usuário com feedback claro

## Testes Recomendados

1. **Testar signup** com e-mail de cliente existente
2. **Testar signup** com e-mail de atendente existente
3. **Testar criação de atendente** com e-mail de cliente existente
4. **Testar criação de atendente** com e-mail de atendente existente
5. **Testar com e-mails novos** (deve permitir cadastro)

## Logs de Debug

A validação inclui logs detalhados para debug:

```
Verificando se o e-mail já existe...
Verificando na tabela clientes_info...
Verificando na tabela atendentes...
E-mail não encontrado em nenhuma tabela - disponível para uso
```

Ou em caso de e-mail existente:

```
E-mail já existe: { exists: true, table: 'clientes_info' }
```

## Próximos Passos

1. **Testar a implementação** com o script fornecido
2. **Verificar mensagens de erro** na interface
3. **Monitorar logs** para identificar possíveis problemas
4. **Considerar validação em tempo real** no frontend (opcional) 