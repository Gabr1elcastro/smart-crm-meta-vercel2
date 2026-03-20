# Verificação Rápida - Super Admin

## 🔍 Diagnóstico Rápido

### 1. **Acesse a URL**
```
http://localhost:5173/super-admin-login
```

### 2. **Execute o Script de Diagnóstico**
Abra o console do navegador (F12) e cole:

```javascript
// Script de diagnóstico rápido
console.log('=== DIAGNÓSTICO RÁPIDO ===');

// Verificar variáveis de ambiente
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ OK' : '❌ AUSENTE');
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ OK' : '❌ AUSENTE');

// Testar Supabase
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Verificar tabela
supabase.from('superadmins').select('*').then(({data, error}) => {
  console.log('Tabela superadmins:', error ? '❌ ERRO' : '✅ OK');
  if (error) console.error('Erro:', error);
  else console.log('Registros:', data?.length || 0);
});

// Verificar usuário
supabase.from('superadmins').select('*').eq('email', 'contatobrunohcunha@gmail.com').single().then(({data, error}) => {
  console.log('Usuário super admin:', error ? '❌ NÃO ENCONTRADO' : '✅ ENCONTRADO');
  if (error) console.error('Erro:', error);
  else console.log('Dados:', data);
});
```

## 🚨 Problemas Comuns

### **Erro: "Email não autorizado"**
**Solução:** Execute no SQL Editor do Supabase:
```sql
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

### **Erro: "Credenciais inválidas"**
**Solução:** 
1. Acesse o painel do Supabase
2. Vá para Authentication > Users
3. Clique em "Add User"
4. Email: `contatobrunohcunha@gmail.com`
5. Defina uma senha
6. Marque "Auto-confirm"

### **Erro: "Página não encontrada"**
**Solução:** Verifique se o servidor está rodando:
```bash
npm run dev
```

### **Erro: "Variáveis de ambiente não encontradas"**
**Solução:** Crie/verifique o arquivo `.env` na raiz:
```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

## ✅ Checklist de Configuração

- [ ] Arquivo `.env` configurado
- [ ] Servidor rodando (`npm run dev`)
- [ ] Tabela `superadmins` criada no Supabase
- [ ] Usuário inserido na tabela `superadmins`
- [ ] Usuário criado no Auth do Supabase
- [ ] Rota `/super-admin-login` acessível
- [ ] Login funcionando com credenciais corretas

## 🔧 Configuração Automatizada

Execute este script no console para configuração automática:

```javascript
// Copie e cole no console do navegador
fetch('/setup-super-admin.js').then(r => r.text()).then(eval);
```

## 📞 Suporte

Se o problema persistir, forneça:
1. A mensagem de erro exata
2. O resultado do script de diagnóstico
3. Screenshots do painel do Supabase 