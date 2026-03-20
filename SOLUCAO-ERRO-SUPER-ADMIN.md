# Solução para Erro de Acesso Super Admin

## Problemas Comuns e Soluções

### 1. **Erro: "Email não autorizado para acesso super admin"**

**Causa:** O usuário não existe na tabela `superadmins` ou a tabela não foi criada.

**Solução:**
```sql
-- 1. Criar a tabela superadmins (se não existir)
CREATE TABLE IF NOT EXISTS public.superadmins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text NOT NULL UNIQUE,
  criado_em timestamp with time zone DEFAULT now()
);

-- 2. Inserir o usuário super admin
INSERT INTO public.superadmins (nome, email) 
VALUES ('Bruno Cunha', 'contatobrunohcunha@gmail.com')
ON CONFLICT (email) DO NOTHING;
```

### 2. **Erro: "Credenciais inválidas"**

**Causa:** O usuário não existe no Supabase Auth ou a senha está incorreta.

**Solução:**
1. Acesse o painel do Supabase
2. Vá para Authentication > Users
3. Clique em "Add User"
4. Adicione:
   - Email: `contatobrunohcunha@gmail.com`
   - Password: (defina uma senha)
   - Marque "Auto-confirm"

### 3. **Erro: "Erro interno do servidor"**

**Causa:** Problemas de conexão com o Supabase ou variáveis de ambiente.

**Solução:**
1. Verifique se o arquivo `.env` existe na raiz do projeto
2. Confirme que contém:
   ```
   VITE_SUPABASE_URL=sua_url_do_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_anonima
   ```
3. Reinicie o servidor de desenvolvimento

### 4. **Erro: "Página não encontrada" (404)**

**Causa:** As rotas não estão configuradas corretamente.

**Solução:**
1. Verifique se o arquivo `src/App.tsx` contém as rotas do super admin
2. Confirme que os componentes existem:
   - `src/pages/auth/SuperAdminLogin.tsx`
   - `src/pages/super-admin/SuperAdminDashboard.tsx`

### 5. **Erro: "Tabela não encontrada"**

**Causa:** A tabela `superadmins` não foi criada no banco de dados.

**Solução:**
1. Acesse o SQL Editor no Supabase
2. Execute o script `INSERT-SUPERADMIN.sql`
3. Verifique se a tabela foi criada em Database > Tables

## Passos para Configuração Completa

### Passo 1: Configurar o Banco de Dados
```sql
-- Execute no SQL Editor do Supabase
CREATE TABLE IF NOT EXISTS public.superadmins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text NOT NULL UNIQUE,
  criado_em timestamp with time zone DEFAULT now()
);

INSERT INTO public.superadmins (nome, email) 
VALUES ('Bruno Cunha', 'contatobrunohcunha@gmail.com')
ON CONFLICT (email) DO NOTHING;
```

### Passo 2: Criar Usuário no Auth
1. Acesse o painel do Supabase
2. Vá para Authentication > Users
3. Clique em "Add User"
4. Preencha:
   - Email: `contatobrunohcunha@gmail.com`
   - Password: (defina uma senha forte)
   - Marque "Auto-confirm"
5. Clique em "Create User"

### Passo 3: Verificar Variáveis de Ambiente
1. Abra o arquivo `.env` na raiz do projeto
2. Confirme que contém:
   ```
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
   ```

### Passo 4: Testar o Acesso
1. Acesse: `http://localhost:5173/super-admin-login`
2. Use as credenciais:
   - Email: `contatobrunohcunha@gmail.com`
   - Senha: (a senha que você definiu no Passo 2)

## Script de Diagnóstico

Execute este script no console do navegador para identificar problemas:

```javascript
// Copie e cole no console do navegador
console.log('=== DIAGNÓSTICO SUPER ADMIN ===');

// Verificar variáveis de ambiente
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? 'OK' : 'AUSENTE');
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'OK' : 'AUSENTE');

// Testar conexão com Supabase
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Verificar tabela superadmins
supabase.from('superadmins').select('*').then(({data, error}) => {
  console.log('Tabela superadmins:', error ? 'ERRO' : 'OK');
  if (error) console.error('Erro:', error);
  else console.log('Registros:', data?.length || 0);
});

// Verificar usuário específico
supabase.from('superadmins').select('*').eq('email', 'contatobrunohcunha@gmail.com').single().then(({data, error}) => {
  console.log('Usuário super admin:', error ? 'NÃO ENCONTRADO' : 'ENCONTRADO');
  if (error) console.error('Erro:', error);
  else console.log('Dados:', data);
});
```

## Contato para Suporte

Se os problemas persistirem, forneça:
1. A mensagem de erro exata
2. O resultado do script de diagnóstico
3. Screenshots do painel do Supabase (se aplicável) 