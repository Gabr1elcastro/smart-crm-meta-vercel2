# Instruções para Configurar o Super Admin

## 🚀 Passo a Passo

### 1. Configurar Banco de Dados

Execute o SQL para criar a tabela e inserir o super admin:

```sql
-- Criar tabela de super admins
create table public.superadmins (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text not null unique,
  criado_em timestamp with time zone default now()
);

-- Inserir super admin
INSERT INTO public.superadmins (nome, email) 
VALUES ('Bruno Cunha', 'contatobrunohcunha@gmail.com')
ON CONFLICT (email) DO NOTHING;
```

### 2. Criar Conta no Supabase Auth

**Opção A: Via Dashboard do Supabase**
1. Acesse o dashboard do Supabase
2. Vá para Authentication > Users
3. Clique em "Add User"
4. Preencha:
   - Email: `contatobrunohcunha@gmail.com`
   - Password: `SuperAdmin@2024!`
   - Marque "Email confirmed"

**Opção B: Via Script (Recomendado)**
1. Configure as variáveis de ambiente:
   ```bash
   export VITE_SUPABASE_URL="sua_url_do_supabase"
   export SUPABASE_SERVICE_ROLE_KEY="sua_service_role_key"
   ```

2. Execute o script:
   ```bash
   node create-superadmin-user.js
   ```

### 3. Testar o Sistema

1. **Acesse a aplicação**
   ```
   http://localhost:5173/super-admin-login
   ```

2. **Faça login**
   - Email: `contatobrunohcunha@gmail.com`
   - Senha: `SuperAdmin@2024!`

3. **Teste a funcionalidade**
   - Visualize o dashboard
   - Teste a busca de clientes
   - Teste a impersonação de um cliente

## 🔧 Configurações Adicionais

### Variáveis de Ambiente

Certifique-se de que estas variáveis estão configuradas no seu `.env`:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_anon_key
```

### Permissões no Supabase

Verifique se as seguintes permissões estão configuradas:

1. **RLS Policies para `superadmins`**:
   ```sql
   -- Permitir leitura para super admins
   CREATE POLICY "Super admins can read superadmins" ON superadmins
   FOR SELECT USING (true);
   ```

2. **RLS Policies para `clientes_info`**:
   ```sql
   -- Permitir leitura para super admins
   CREATE POLICY "Super admins can read clientes_info" ON clientes_info
   FOR SELECT USING (true);
   ```

## 🧪 Testando

### Teste de Login
```bash
# Acesse a URL
curl http://localhost:5173/super-admin-login
```

### Teste de Dashboard
```bash
# Após fazer login, acesse
curl http://localhost:5173/super-admin
```

### Teste de Impersonação
1. Faça login no super admin
2. Clique em "Acessar" em qualquer cliente
3. Verifique se o banner aparece
4. Teste as funcionalidades como se fosse o cliente

## 🐛 Troubleshooting

### Erro: "Email não autorizado"
- Verifique se o email existe na tabela `superadmins`
- Verifique se a conta existe no Supabase Auth

### Erro: "Credenciais inválidas"
- Verifique se a senha está correta
- Verifique se a conta está confirmada no Supabase Auth

### Erro: "Erro ao carregar clientes"
- Verifique as permissões na tabela `clientes_info`
- Verifique a conexão com o Supabase

### Erro: "Erro interno do servidor"
- Verifique os logs do console
- Verifique as variáveis de ambiente
- Verifique a conectividade com o Supabase

## 📝 Logs Úteis

Para debug, adicione estes logs no console do navegador:

```javascript
// Verificar estado do super admin
console.log('isSuperAdmin:', sessionStorage.getItem('isSuperAdmin'));
console.log('isImpersonating:', sessionStorage.getItem('isImpersonating'));
console.log('superAdminData:', sessionStorage.getItem('superAdminData'));
console.log('impersonatedCliente:', sessionStorage.getItem('impersonatedCliente'));
```

## 🔒 Segurança

### Recomendações

1. **Altere a senha padrão** após o primeiro login
2. **Configure 2FA** se disponível
3. **Monitore os logs** de acesso
4. **Implemente rate limiting** para tentativas de login
5. **Configure timeout de sessão**

### Verificações de Segurança

```sql
-- Verificar super admins ativos
SELECT * FROM superadmins WHERE email = 'contatobrunohcunha@gmail.com';

-- Verificar permissões
SELECT * FROM information_schema.role_table_grants 
WHERE table_name = 'superadmins';
```

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs do console
2. Verifique as configurações do Supabase
3. Teste a conectividade com o banco
4. Entre em contato com a equipe de desenvolvimento

## 🎯 Próximos Passos

Após a configuração inicial:

1. **Teste todas as funcionalidades**
2. **Configure permissões adicionais** se necessário
3. **Implemente as funcionalidades futuras** conforme necessário
4. **Configure monitoramento e alertas**
5. **Documente procedimentos de backup e recuperação** 