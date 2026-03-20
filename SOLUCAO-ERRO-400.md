# Solução: Erro 400 - Clientes Não Carregam

## 🚨 **Problema Identificado**
- **Erro**: 400 Bad Request
- **Localização**: `superAdminService.ts:64`
- **Causa**: Problema na query do Supabase

## 🔧 **Soluções Imediatas**

### **1. Execute o Script de Teste**
Abra o console do navegador (F12) e cole:
```javascript
// Copie e cole o conteúdo de teste-tabela-clientes.js
```

### **2. Verifique a Tabela no Supabase**
Execute no SQL Editor do Supabase:
```sql
-- Verificar se a tabela existe
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'clientes_info';

-- Verificar estrutura
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'clientes_info'
ORDER BY ordinal_position;
```

### **3. Desabilite RLS Temporariamente**
Execute no SQL Editor:
```sql
ALTER TABLE public.clientes_info DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.atendentes DISABLE ROW LEVEL SECURITY;
```

### **4. Insira Dados de Teste**
Execute o script `inserir-dados-teste.sql` no Supabase.

## 🎯 **Causas Mais Comuns do Erro 400**

### **Causa 1: RLS (Row Level Security)**
**Sintoma**: Erro 400 sem detalhes específicos
**Solução**: Desabilitar RLS temporariamente

### **Causa 2: Coluna não existe**
**Sintoma**: Erro 400 com mensagem sobre coluna
**Solução**: Verificar estrutura da tabela

### **Causa 3: Tipo de dados incorreto**
**Sintoma**: Erro 400 na ordenação
**Solução**: Remover ordenação temporariamente

### **Causa 4: Permissões insuficientes**
**Sintoma**: Erro 400 de acesso negado
**Solução**: Verificar políticas RLS

## 📋 **Passos para Resolver**

### **Passo 1: Teste Básico**
1. Execute no SQL Editor:
```sql
SELECT * FROM public.clientes_info LIMIT 1;
```

### **Passo 2: Verifique Estrutura**
1. Execute o script `verificar-estrutura-tabela.sql`
2. Confirme se todas as colunas existem

### **Passo 3: Corrija Permissões**
1. Execute:
```sql
ALTER TABLE public.clientes_info DISABLE ROW LEVEL SECURITY;
```

### **Passo 4: Teste o Dashboard**
1. Recarregue a página do super admin
2. Verifique se os clientes aparecem

### **Passo 5: Reabilite RLS (Opcional)**
Se funcionar, reabilite com políticas corretas:
```sql
ALTER TABLE public.clientes_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acesso anônimo" ON public.clientes_info
    FOR SELECT USING (true);
```

## 🔍 **Diagnóstico Detalhado**

### **Execute o Script de Debug**
```javascript
// Cole no console do navegador
const { createClient } = await import('@supabase/supabase-js');
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Teste 1: Query simples
const { data: test1, error: error1 } = await supabase
  .from('clientes_info')
  .select('*')
  .limit(1);

console.log('Teste 1:', error1 ? 'ERRO' : 'OK');
if (error1) console.error('Erro:', error1);

// Teste 2: Query com colunas específicas
const { data: test2, error: error2 } = await supabase
  .from('clientes_info')
  .select('id, nome, email, telefone, status, criado_em, plano')
  .limit(1);

console.log('Teste 2:', error2 ? 'ERRO' : 'OK');
if (error2) console.error('Erro:', error2);
```

## 📞 **Próximos Passos**

Após executar os testes, informe:
1. **Resultado do script de teste**
2. **Se a tabela existe no Supabase**
3. **Se há dados na tabela**
4. **Se RLS está habilitado**

Com essas informações, posso te ajudar de forma mais específica! 