# Teste do Sistema de Gestores

## 🧪 Como Testar com Dados Atuais

### **Dados do Exemplo:**
```json
{
  "id": 114,
  "name": "Financeiro EA",
  "email": "diego.almeida@basicobemfeito.com",
  "user_id_auth": "61935c17-a3be-43da-9c5b-9507d448f131",
  "id_gestor": "29"
}
```

## 🔍 Teste 1: Verificar se Usuário ID "29" é Gestor

### **Passos:**
1. **Fazer login** com usuário que tenha ID "29"
2. **Verificar** se tem acesso de gestor
3. **Confirmar** permissões completas

### **Código de Teste:**
```typescript
// No console do navegador ou em um componente de teste
import { gestorService } from '@/services/gestorService';

// Verificar se usuário "29" é gestor do cliente "114"
const isGestor = await gestorService.isGestor('114', '29');
console.log('Usuário 29 é gestor?', isGestor); // Deve retornar true
```

## 🔍 Teste 2: Listar Gestores do Cliente

### **Passos:**
1. **Buscar** gestores do cliente 114
2. **Verificar** se retorna o usuário "29"
3. **Confirmar** informações do gestor

### **Código de Teste:**
```typescript
// Listar gestores do cliente
const gestores = await gestorService.listarGestores('114');
console.log('Gestores encontrados:', gestores);

// Deve retornar array com informações do usuário ID "29"
```

## 🔍 Teste 3: Adicionar Novo Gestor

### **Passos:**
1. **Adicionar** novo gestor ao cliente
2. **Verificar** conversão automática para array
3. **Confirmar** que ambos os gestores têm acesso

### **Código de Teste:**
```typescript
// Adicionar novo gestor (substitua 'novo-gestor-id' por um ID real)
const sucesso = await gestorService.adicionarGestor('114', 'novo-gestor-id');
console.log('Gestor adicionado?', sucesso);

// Verificar estrutura atual
const cliente = await gestorService.buscarClienteComGestores('114');
console.log('Estrutura id_gestor:', cliente?.id_gestor);
// Deve mostrar array: ["29", "novo-gestor-id"]
```

## 🔍 Teste 4: Remover Gestor

### **Passos:**
1. **Remover** um gestor do cliente
2. **Verificar** se foi removido corretamente
3. **Confirmar** que perdeu acesso

### **Código de Teste:**
```typescript
// Remover gestor
const sucesso = await gestorService.removerGestor('114', 'novo-gestor-id');
console.log('Gestor removido?', sucesso);

// Verificar estrutura após remoção
const cliente = await gestorService.buscarClienteComGestores('114');
console.log('Estrutura id_gestor após remoção:', cliente?.id_gestor);
// Deve mostrar: "29" (volta para string)
```

## 🔍 Teste 5: Interface de Gerenciamento

### **Passos:**
1. **Acessar** página de gerenciamento de gestores
2. **Verificar** se lista o gestor atual
3. **Testar** adição/remoção via interface

### **Componente de Teste:**
```tsx
import React from 'react';
import { GestorManager } from '@/components/admin/GestorManager';

function TesteGestorManager() {
  return (
    <div className="p-6">
      <h1>Teste - Gerenciador de Gestores</h1>
      <GestorManager
        clienteId="114"
        clienteNome="Financeiro EA"
        onUpdate={() => console.log('Gestores atualizados!')}
      />
    </div>
  );
}

export default TesteGestorManager;
```

## 🔍 Teste 6: Verificar Permissões

### **Passos:**
1. **Fazer login** com usuário gestor
2. **Verificar** se tem acesso a todas as funcionalidades
3. **Confirmar** herança de planos do cliente

### **Código de Teste:**
```typescript
// Verificar permissões via hook
import { usePermissions } from '@/hooks/usePermissions';
import { useUserType } from '@/hooks/useUserType';

function TestePermissoes() {
  const { permissions, isGestor } = usePermissions();
  const { userType, plano_agentes, plano_crm } = useUserType();

  console.log('Tipo de usuário:', userType); // Deve ser "Gestor"
  console.log('É gestor?', isGestor()); // Deve ser true
  console.log('Permissões:', permissions);
  console.log('Plano agentes:', plano_agentes); // Deve herdar do cliente
  console.log('Plano CRM:', plano_crm); // Deve herdar do cliente

  return (
    <div>
      <p>Tipo: {userType}</p>
      <p>É Gestor: {isGestor() ? 'Sim' : 'Não'}</p>
      <p>Plano Agentes: {plano_agentes ? 'Sim' : 'Não'}</p>
      <p>Plano CRM: {plano_crm ? 'Sim' : 'Não'}</p>
    </div>
  );
}
```

## 🚨 Cenários de Teste

### **Cenário 1: Cliente sem Gestor**
```sql
-- Testar com cliente que não tem gestor
UPDATE clientes_info SET id_gestor = NULL WHERE id = 999;
```

### **Cenário 2: Cliente com Array de Gestores**
```sql
-- Após migração, testar com múltiplos gestores
UPDATE clientes_info SET id_gestor = ARRAY['29', '30', '31'] WHERE id = 114;
```

### **Cenário 3: Dados Inválidos**
```sql
-- Testar com dados inválidos
UPDATE clientes_info SET id_gestor = '' WHERE id = 114;
UPDATE clientes_info SET id_gestor = 'invalid-uuid' WHERE id = 114;
```

## 📊 Resultados Esperados

### **✅ Sucesso:**
- Usuário ID "29" é detectado como gestor
- Permissões completas são concedidas
- Herança de planos funciona
- Interface de gerenciamento funciona
- Adição/remoção de gestores funciona
- Conversão automática string → array funciona

### **❌ Falha:**
- Usuário não é detectado como gestor
- Permissões não são concedidas
- Erros na interface
- Falha na adição/remoção de gestores

## 🔧 Troubleshooting

### **Problema: Usuário não é detectado como gestor**
**Solução:**
```sql
-- Verificar se o ID está correto
SELECT id, name, id_gestor FROM clientes_info WHERE id = 114;
```

### **Problema: Erro ao adicionar gestor**
**Solução:**
```typescript
// Verificar se o usuário existe no Supabase Auth
const { data: users } = await supabase.auth.admin.listUsers();
console.log('Usuários disponíveis:', users.users.map(u => ({ id: u.id, email: u.email })));
```

### **Problema: Interface não carrega**
**Solução:**
```typescript
// Verificar se o componente está importado corretamente
import { GestorManager } from '@/components/admin/GestorManager';
```

## 📝 Checklist de Testes

- [ ] Usuário ID "29" é detectado como gestor
- [ ] Permissões completas são concedidas
- [ ] Herança de planos funciona
- [ ] Interface lista gestores corretamente
- [ ] Adição de gestor funciona
- [ ] Remoção de gestor funciona
- [ ] Conversão string → array funciona
- [ ] Validações de segurança funcionam
- [ ] Tratamento de erros funciona
- [ ] Performance está adequada

---

**Execute estes testes para validar a funcionalidade completa!** 🧪




