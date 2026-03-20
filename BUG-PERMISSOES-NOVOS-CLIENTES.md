# 🚨 BUG CRÍTICO: Novos Clientes com Acesso de Atendente

## 📋 **Descrição do Problema**

Novos clientes inscritos em `clientes_info` estão entrando com acesso de **atendente** ao invés de **administrador**.

## 🔍 **Análise do Problema**

### **Como Funciona o Sistema de Permissões**

#### **1. Detecção de Tipo de Usuário (`useUserType.ts`)**
```typescript
// Primeiro, verificar se é Admin (está na tabela clientes_info)
const { data: adminData, error: adminError } = await supabase
  .from('clientes_info')
  .select('*')
  .eq('email', user.email)
  .maybeSingle();

if (adminData && !adminError) {
  setUserType('Admin');  // ✅ Deveria ser Admin
  setUserInfo({ tipo_usuario: 'Admin' });
  return;
}

// Se não é Admin, verificar se é Gestor ou Atendente (tabela atendentes)
const { data: atendenteData, error: atendenteError } = await supabase
  .from('atendentes')
  .select('tipo_usuario, id_departamento')
  .eq('email', user.email)
  .eq('id_cliente', user.id_cliente)
  .maybeSingle();

if (atendenteData && !atendenteError) {
  const tipo = atendenteData.tipo_usuario === 'Atendente' ? 'Atendente' : 'Gestor';
  setUserType(tipo);  // ❌ PROBLEMA: Pode ser Atendente
}
```

#### **2. Sistema de Permissões (`usePermissions.ts`)**
```typescript
// Buscar permissões normais do atendente
const { data: userInfo, error } = await supabase
  .from('atendentes')  // ❌ PROBLEMA: Só busca na tabela atendentes
  .select('tipo_usuario, id_departamento, departamentos')
  .eq('email', user.email)
  .eq('id_cliente', user.id_cliente)
  .single();

const userPerms: UserPermissions = {
  tipo_usuario: userInfo?.tipo_usuario || 'Atendente',  // ❌ PROBLEMA: Default é Atendente
  // ...
};
```

### **🔍 Causa Raiz do Problema**

#### **Problema 1: Lógica de Detecção**
- O `useUserType.ts` detecta corretamente que é Admin
- Mas o `usePermissions.ts` **não considera** usuários da tabela `clientes_info`
- Ele **só busca** na tabela `atendentes`

#### **Problema 2: Fallback Incorreto**
- Quando não encontra na tabela `atendentes`, o default é `'Atendente'`
- Deveria ser `'Gestor'` ou `'Admin'` para clientes da `clientes_info`

#### **Problema 3: Inconsistência**
- `useUserType.ts` diz que é Admin
- `usePermissions.ts` diz que é Atendente
- Resultado: **Conflito de permissões**

## 🛠️ **Soluções Propostas**

### **Solução 1: Corrigir `usePermissions.ts`**

```typescript
// src/hooks/usePermissions.ts
export const usePermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user?.email || !user?.id_cliente) {
        setLoading(false);
        return;
      }

      // Verificar se está em modo de impersonação
      const isImpersonating = sessionStorage.getItem('isImpersonating') === 'true';
      
      try {
        // Se está em modo de impersonação, dar permissões de gestor
        if (isImpersonating) {
          console.log('usePermissions: Modo impersonação ativo - concedendo permissões de gestor');
          const superAdminPerms: UserPermissions = {
            tipo_usuario: 'Gestor',
            canViewAllDepartments: true,
            canEditLeads: true,
            canDeleteMessages: true,
            canTransferLeads: true,
            canManageUsers: true,
            canViewReports: true,
            allowedDepartments: []
          };
          setPermissions(superAdminPerms);
          setLoading(false);
          return;
        }

        // ✅ NOVA LÓGICA: Primeiro verificar se é Admin (clientes_info)
        const { data: adminData, error: adminError } = await supabase
          .from('clientes_info')
          .select('*')
          .eq('email', user.email)
          .maybeSingle();

        if (adminData && !adminError) {
          console.log('usePermissions: Usuário é Admin (clientes_info)');
          const adminPerms: UserPermissions = {
            tipo_usuario: 'Gestor', // Admin tem permissões de Gestor
            canViewAllDepartments: true,
            canEditLeads: true,
            canDeleteMessages: true,
            canTransferLeads: true,
            canManageUsers: true,
            canViewReports: true,
            allowedDepartments: [] // Pode ver todos os departamentos
          };
          setPermissions(adminPerms);
          setLoading(false);
          return;
        }

        // Se não é Admin, verificar se é Gestor ou Atendente (tabela atendentes)
        const { data: userInfo, error } = await supabase
          .from('atendentes')
          .select('tipo_usuario, id_departamento, departamentos')
          .eq('email', user.email)
          .eq('id_cliente', user.id_cliente)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Erro ao buscar permissões:', error);
          setLoading(false);
          return;
        }

        const userPerms: UserPermissions = {
          tipo_usuario: userInfo?.tipo_usuario || 'Atendente',
          id_departamento: userInfo?.id_departamento,
          departamentos: userInfo?.departamentos,
          canViewAllDepartments: userInfo?.tipo_usuario === 'Gestor',
          canEditLeads: true,
          canDeleteMessages: userInfo?.tipo_usuario === 'Gestor',
          canTransferLeads: userInfo?.tipo_usuario === 'Gestor',
          canManageUsers: userInfo?.tipo_usuario === 'Gestor',
          canViewReports: true,
          allowedDepartments: userInfo?.tipo_usuario === 'Gestor' 
            ? []
            : userInfo?.id_departamento 
              ? [userInfo.id_departamento]
              : userInfo?.departamentos?.map(d => parseInt(d)) || []
        };

        setPermissions(userPerms);
        console.log('Permissões carregadas:', userPerms);
      } catch (error) {
        console.error('Erro ao carregar permissões:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [user]);

  // ... resto do código
};
```

### **Solução 2: Criar Hook Unificado**

```typescript
// src/hooks/useUserPermissions.ts (NOVO)
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import { supabase } from '@/lib/supabase';

interface UnifiedUserPermissions {
  userType: 'Admin' | 'Gestor' | 'Atendente';
  permissions: {
    canViewAllDepartments: boolean;
    canEditLeads: boolean;
    canDeleteMessages: boolean;
    canTransferLeads: boolean;
    canManageUsers: boolean;
    canViewReports: boolean;
    allowedDepartments: number[];
  };
}

export const useUserPermissions = () => {
  const { user } = useAuth();
  const [userPermissions, setUserPermissions] = useState<UnifiedUserPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const detectUserTypeAndPermissions = async () => {
      if (!user?.email || !user?.id_cliente) {
        setLoading(false);
        return;
      }

      try {
        // 1. Verificar se é Admin (clientes_info)
        const { data: adminData, error: adminError } = await supabase
          .from('clientes_info')
          .select('*')
          .eq('email', user.email)
          .maybeSingle();

        if (adminData && !adminError) {
          console.log('Usuário é Admin (clientes_info)');
          setUserPermissions({
            userType: 'Admin',
            permissions: {
              canViewAllDepartments: true,
              canEditLeads: true,
              canDeleteMessages: true,
              canTransferLeads: true,
              canManageUsers: true,
              canViewReports: true,
              allowedDepartments: []
            }
          });
          setLoading(false);
          return;
        }

        // 2. Verificar se é Gestor ou Atendente (atendentes)
        const { data: atendenteData, error: atendenteError } = await supabase
          .from('atendentes')
          .select('tipo_usuario, id_departamento, departamentos')
          .eq('email', user.email)
          .eq('id_cliente', user.id_cliente)
          .maybeSingle();

        if (atendenteData && !atendenteError) {
          const userType = atendenteData.tipo_usuario === 'Atendente' ? 'Atendente' : 'Gestor';
          console.log(`Usuário é ${userType} (atendentes)`);
          
          setUserPermissions({
            userType,
            permissions: {
              canViewAllDepartments: userType === 'Gestor',
              canEditLeads: true,
              canDeleteMessages: userType === 'Gestor',
              canTransferLeads: userType === 'Gestor',
              canManageUsers: userType === 'Gestor',
              canViewReports: true,
              allowedDepartments: userType === 'Gestor' 
                ? []
                : atendenteData.id_departamento 
                  ? [atendenteData.id_departamento]
                  : atendenteData.departamentos?.map(d => parseInt(d)) || []
            }
          });
        } else {
          // 3. Fallback: Se não encontrou em nenhuma tabela, considerar como Gestor
          console.log('Usuário não encontrado em nenhuma tabela, considerando como Gestor');
          setUserPermissions({
            userType: 'Gestor',
            permissions: {
              canViewAllDepartments: true,
              canEditLeads: true,
              canDeleteMessages: true,
              canTransferLeads: true,
              canManageUsers: true,
              canViewReports: true,
              allowedDepartments: []
            }
          });
        }
      } catch (error) {
        console.error('Erro ao detectar tipo de usuário:', error);
        // Em caso de erro, considerar como Gestor
        setUserPermissions({
          userType: 'Gestor',
          permissions: {
            canViewAllDepartments: true,
            canEditLeads: true,
            canDeleteMessages: true,
            canTransferLeads: true,
            canManageUsers: true,
            canViewReports: true,
            allowedDepartments: []
          }
        });
      } finally {
        setLoading(false);
      }
    };

    detectUserTypeAndPermissions();
  }, [user]);

  return {
    userPermissions,
    loading,
    isAdmin: userPermissions?.userType === 'Admin',
    isGestor: userPermissions?.userType === 'Gestor',
    isAtendente: userPermissions?.userType === 'Atendente',
    permissions: userPermissions?.permissions
  };
};
```

## 🚀 **Implementação Recomendada**

### **Passo 1: Corrigir `usePermissions.ts`**
- Adicionar verificação da tabela `clientes_info`
- Dar permissões de Gestor para usuários Admin
- Manter compatibilidade com código existente

### **Passo 2: Testar a Correção**
```typescript
// Script de teste
const testUserPermissions = async () => {
  const { data: clientes } = await supabase
    .from('clientes_info')
    .select('email, name')
    .limit(5);
  
  console.log('Clientes para testar:', clientes);
  
  // Testar login de cada cliente
  for (const cliente of clientes) {
    console.log(`Testando cliente: ${cliente.name} (${cliente.email})`);
    // Simular login e verificar permissões
  }
};
```

### **Passo 3: Monitoramento**
- Adicionar logs para detectar o problema
- Implementar alertas quando usuário Admin tem permissões de Atendente

## 📊 **Impacto do Bug**

### **Problemas Causados:**
- ❌ **Novos clientes** não conseguem acessar funcionalidades administrativas
- ❌ **Gestão de usuários** bloqueada para clientes
- ❌ **Configurações** inacessíveis
- ❌ **Relatórios** limitados
- ❌ **Experiência ruim** para novos usuários

### **Benefícios da Correção:**
- ✅ **Novos clientes** terão acesso completo
- ✅ **Funcionalidades administrativas** disponíveis
- ✅ **Gestão de usuários** funcionando
- ✅ **Configurações** acessíveis
- ✅ **Experiência melhor** para novos usuários

## ✅ **Resumo**

**O problema está no `usePermissions.ts` que não considera usuários da tabela `clientes_info` como administradores. A solução é adicionar a verificação da tabela `clientes_info` antes de verificar a tabela `atendentes`.** 