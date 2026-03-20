# 🎯 Exemplo de Uso - Funil Padrão

## 📋 **Como Marcar um Funil como Padrão**

### **1. Marcar Funil como Padrão**
```typescript
import { FunisService } from '@/services/funisService';

// Marcar funil ID 123 como padrão
await FunisService.marcarFunilComoPadrao(123);
```

### **2. Verificar se um Funil é Padrão**
```typescript
// Verificar se o funil ID 123 é padrão
const isPadrao = await FunisService.isFunilPadrao(123);
console.log('É padrão:', isPadrao); // true ou false
```

### **3. Buscar Funil Padrão**
```typescript
// Buscar o funil padrão do cliente atual
const funilPadrao = await FunisService.getFunilPadrao();
if (funilPadrao) {
  console.log('Funil padrão:', funilPadrao.nome);
  console.log('Etapas:', funilPadrao.etapas);
} else {
  console.log('Nenhum funil padrão configurado');
}
```

### **4. Desmarcar Funil como Padrão**
```typescript
// Desmarcar funil ID 123 como padrão
await FunisService.desmarcarFunilComoPadrao(123);
```

## 🔄 **Fluxo Completo de Troca de Funil Padrão**

```typescript
// 1. Marcar novo funil como padrão (automaticamente desmarca o antigo)
await FunisService.marcarFunilComoPadrao(456);

// 2. Verificar se foi marcado corretamente
const isNovoPadrao = await FunisService.isFunilPadrao(456);
console.log('Novo funil é padrão:', isNovoPadrao); // true

// 3. Verificar se o antigo foi desmarcado
const isAntigoPadrao = await FunisService.isFunilPadrao(123);
console.log('Antigo funil é padrão:', isAntigoPadrao); // false

// 4. Buscar o funil padrão atual
const funilAtual = await FunisService.getFunilPadrao();
console.log('Funil padrão atual:', funilAtual?.nome); // Nome do funil 456
```

## 🎨 **Interface do Usuário**

### **No BoardContent (CRM):**
- ✅ Funil padrão aparece primeiro na lista
- ✅ Badge "Padrão" é exibido no funil padrão
- ✅ Funil padrão é selecionado automaticamente

### **No Dashboard:**
- ✅ Funil de vendas usa as etapas do funil padrão
- ✅ Fallback para etapas padrão se não houver funil padrão

## 🧪 **Teste Manual**

### **1. Verificar no Banco:**
```sql
-- Verificar funis do cliente
SELECT id, nome, funil_padrao 
FROM funis 
WHERE id_cliente = 123 
ORDER BY funil_padrao DESC, created_at DESC;
```

### **2. Marcar como Padrão:**
```sql
-- Desmarcar todos
UPDATE funis SET funil_padrao = false WHERE id_cliente = 123;

-- Marcar um específico
UPDATE funis SET funil_padrao = true WHERE id = 456 AND id_cliente = 123;
```

### **3. Verificar no Frontend:**
1. Acesse a página CRM
2. Verifique se o funil padrão aparece primeiro
3. Verifique se tem o badge "Padrão"
4. Acesse o Dashboard e verifique se o funil de vendas usa as etapas corretas

## ⚠️ **Importante**

- ✅ **Apenas um funil** pode ser padrão por cliente
- ✅ **Marcar novo padrão** automaticamente desmarca o antigo
- ✅ **Funil padrão** aparece primeiro na lista
- ✅ **Dashboard** usa automaticamente o funil padrão
- ✅ **Fallback** para etapas padrão se não houver funil padrão
