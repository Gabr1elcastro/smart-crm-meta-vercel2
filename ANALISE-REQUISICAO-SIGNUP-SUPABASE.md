# Análise: Requisição ao Supabase após Signup

## Fluxo Completo do Signup

### 1. Início do Processo (Signup.tsx)

```typescript
// src/pages/auth/Signup.tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  // Validações locais
  await signUp(email, password, firstName, lastName, phone);
};
```

### 2. Chamada para AuthContext

```typescript
// src/contexts/auth/AuthContext.tsx
const signUp = async (email: string, password: string, firstName: string, lastName: string, phone: string) => {
  return signUpUser(email, password, firstName, lastName, phone, () => navigate("/login"), setLoading, setError);
};
```

### 3. Implementação Principal (authActions.ts)

#### 3.1 Verificação de Email Existente

```typescript
// Verificar se o e-mail já existe nas tabelas clientes_info e atendentes
const emailCheck = await checkEmailExists(email);

if (emailCheck.exists) {
  const tableName = emailCheck.table === 'clientes_info' ? 'cliente' : 'atendente';
  const errorMessage = `Este e-mail já está vinculado a uma conta de ${tableName}.`;
  setError(errorMessage);
  return;
}
```

**Requisição ao Supabase:**
```sql
-- Verificar na tabela clientes_info
SELECT id FROM clientes_info WHERE email = 'email@exemplo.com' LIMIT 1;

-- Verificar na tabela atendentes  
SELECT id FROM atendentes WHERE email = 'email@exemplo.com' LIMIT 1;
```

#### 3.2 Verificação de Conectividade

```typescript
// Verificar conectividade com o Supabase antes de tentar o cadastro
const { error: pingError } = await supabase
  .from('_pgrst_reserved_relation')
  .select('count', { count: 'exact', head: true });
```

#### 3.3 Criação do Usuário no Supabase Auth

```typescript
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      first_name: firstName,
      last_name: lastName,
      has_connected_whatsapp: false
    }
  }
});
```

**Requisição ao Supabase:**
- Cria o usuário na tabela `auth.users` do Supabase
- Armazena metadados: `first_name`, `last_name`, `has_connected_whatsapp`

#### 3.4 Criação do Registro em clientes_info

```typescript
const userData = {
  user_id_auth: data.user.id,
  email: data.user.email,
  name: `${firstName} ${lastName}`.trim(),
  phone: phone,
  created_at: new Date().toISOString()
};

// Primeiro, inserir o registro na tabela clientes_info
const { data: clienteData, error: clientesError } = await supabase
  .from('clientes_info')
  .upsert(userData, {
    onConflict: 'email'
  })
  .select()
  .single();
```

**Requisição ao Supabase:**
```sql
INSERT INTO clientes_info (user_id_auth, email, name, phone, created_at)
VALUES ('user-uuid', 'email@exemplo.com', 'João Silva', '(11) 99999-9999', '2024-01-01T00:00:00.000Z')
ON CONFLICT (email) DO UPDATE SET
  user_id_auth = EXCLUDED.user_id_auth,
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  created_at = EXCLUDED.created_at
RETURNING *;
```

#### 3.5 Fallback em Caso de Erro

```typescript
if (clientesError) {
  // Tentar novamente com insert simples
  const { data: insertData, error: insertError } = await supabase
    .from('clientes_info')
    .insert(userData)
    .select()
    .single();
}
```

**Requisição ao Supabase:**
```sql
INSERT INTO clientes_info (user_id_auth, email, name, phone, created_at)
VALUES ('user-uuid', 'email@exemplo.com', 'João Silva', '(11) 99999-9999', '2024-01-01T00:00:00.000Z')
RETURNING *;
```

#### 3.6 Atualização dos Metadados do Usuário

```typescript
// Atualizar user_metadata com o id_cliente
if (clienteData?.id) {
  await supabase.auth.updateUser({
    data: { id_cliente: clienteData.id }
  });
}
```

**Requisição ao Supabase:**
```sql
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb), 
  '{id_cliente}', 
  '123'::jsonb
)
WHERE id = 'user-uuid';
```

## Resumo das Requisições ao Supabase

### 1. Verificação de Email (2 requisições)
- `SELECT` em `clientes_info` para verificar email
- `SELECT` em `atendentes` para verificar email

### 2. Verificação de Conectividade (1 requisição)
- `SELECT` em `_pgrst_reserved_relation` para ping

### 3. Criação do Usuário (1 requisição)
- `INSERT` em `auth.users` com metadados

### 4. Criação do Cliente (1-2 requisições)
- `UPSERT` em `clientes_info` (ou `INSERT` em caso de erro)

### 5. Atualização de Metadados (1 requisição)
- `UPDATE` em `auth.users` para adicionar `id_cliente`

## Total de Requisições: 6-7 requisições

## Tratamento de Erros

### Erros de Conectividade
```typescript
if (error.message?.includes("Failed to fetch") || 
    error.name === "AuthRetryableFetchError" || 
    error.message?.includes("NetworkError")) {
  setError("Falha na conexão com o servidor. Verifique sua internet e tente novamente.");
}
```

### Erros de Email Duplicado
```typescript
if (error.message.includes("User already registered")) {
  errorMessage = "Este email já está cadastrado.";
}
```

### Erros de Senha
```typescript
if (error.message.includes("Password should be")) {
  errorMessage = "A senha deve ter pelo menos 6 caracteres.";
}
```

## Estrutura de Dados Criada

### Tabela auth.users
```json
{
  "id": "user-uuid",
  "email": "email@exemplo.com",
  "raw_user_meta_data": {
    "first_name": "João",
    "last_name": "Silva", 
    "has_connected_whatsapp": false,
    "id_cliente": 123
  }
}
```

### Tabela clientes_info
```json
{
  "id": 123,
  "user_id_auth": "user-uuid",
  "email": "email@exemplo.com",
  "name": "João Silva",
  "phone": "(11) 99999-9999",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

## Data da Análise

$(date) 