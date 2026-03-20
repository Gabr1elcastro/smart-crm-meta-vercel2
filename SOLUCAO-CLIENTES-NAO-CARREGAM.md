# Solução: Clientes Não Carregam

## 🔍 **Diagnóstico Rápido**

### **1. Execute o Script de Debug**
Abra o console do navegador (F12) e cole:
```javascript
// Copie e cole o conteúdo de debug-clientes.js
```

### **2. Execute o Script de Listagem**
```javascript
// Copie e cole o conteúdo de listar-tabelas.js
```

### **3. Execute o Script de Permissões**
```javascript
// Copie e cole o conteúdo de verificar-permissoes.js
```

## 🚨 **Problemas Comuns e Soluções**

### **Problema 1: Tabela não existe**
**Sintoma:** Erro "relation does not exist"
**Solução:** 
1. Verifique o nome correto da tabela no Supabase
2. Execute o script `listar-tabelas.js` para identificar o nome correto
3. Atualize o serviço com o nome correto

### **Problema 2: RLS (Row Level Security) bloqueando**
**Sintoma:** Erro de permissão ou dados não aparecem
**Solução:**
1. Execute no SQL Editor do Supabase:
```sql
-- Desabilitar RLS temporariamente
ALTER TABLE public.clientes_info DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.atendentes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.superadmins DISABLE ROW LEVEL SECURITY;
```

### **Problema 3: Tabela vazia**
**Sintoma:** Estatísticas mostram 0 clientes
**Solução:**
1. Execute o script `inserir-dados-teste.sql` no Supabase
2. Ou insira dados manualmente

### **Problema 4: Estrutura da tabela diferente**
**Sintoma:** Erro de coluna não encontrada
**Solução:**
1. Verifique a estrutura da tabela no Supabase
2. Atualize o serviço com as colunas corretas

## 🔧 **Passos para Resolver**

### **Passo 1: Verificar Tabela**
1. Acesse o Supabase Dashboard
2. Vá para Database > Tables
3. Verifique se `clientes_info` existe
4. Verifique a estrutura das colunas

### **Passo 2: Testar Acesso**
1. Execute no SQL Editor:
```sql
SELECT * FROM public.clientes_info LIMIT 5;
```

### **Passo 3: Inserir Dados de Teste**
1. Execute o script `inserir-dados-teste.sql`
2. Verifique se os dados foram inseridos

### **Passo 4: Corrigir Permissões**
1. Execute o script `corrigir-permissoes-rls.sql`
2. Teste novamente o dashboard

### **Passo 5: Atualizar Serviço (se necessário)**
Se o nome da tabela for diferente, atualize o serviço:
```typescript
// Em src/services/superAdminService.ts
// Altere 'clientes_info' para o nome correto
```

## 📋 **Checklist de Verificação**

- [ ] Tabela `clientes_info` existe no Supabase
- [ ] Tabela tem dados (execute `SELECT COUNT(*) FROM clientes_info`)
- [ ] RLS está desabilitado ou tem políticas corretas
- [ ] Variáveis de ambiente estão configuradas
- [ ] Servidor está rodando (`npm run dev`)
- [ ] Console não mostra erros de rede

## 🎯 **Teste Final**

Após resolver, execute:
```javascript
// Teste final
const { createClient } = await import('@supabase/supabase-js');
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const { data, error } = await supabase
  .from('clientes_info')
  .select('*');

console.log('Resultado:', error ? 'ERRO' : 'OK');
console.log('Registros:', data?.length || 0);
```

## 📞 **Suporte**

Se o problema persistir, forneça:
1. Resultado dos scripts de debug
2. Screenshot do erro no console
3. Estrutura da tabela no Supabase
4. Logs de erro do servidor 