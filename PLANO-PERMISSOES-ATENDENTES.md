# 📋 **PLANO PARA FILTRAR PERMISSÕES DOS ATENDENTES NA SEÇÃO DE CONVERSAS**

## 🎯 **Objetivo**
Implementar um sistema robusto de filtros de permissões para atendentes na seção de conversas, garantindo que cada atendente veja apenas as conversas dos departamentos aos quais tem acesso.

## 📊 **Análise da Situação Atual**

### ✅ **O que já está funcionando:**
1. **Sistema de tipos de usuário**: `Gestor` e `Atendente`
2. **Associação de departamentos**: Atendentes têm `id_departamento` ou `departamentos[]`
3. **Filtros básicos**: Implementados no frontend para leads e departamentos
4. **RLS básico**: Políticas de segurança na tabela `agente_conversacional_whatsapp`

### ❌ **O que precisa ser melhorado:**
1. **RLS inconsistente**: Políticas não consideram departamentos dos atendentes
2. **Filtros incompletos**: Apenas no frontend, não no backend
3. **Segurança**: Atendentes podem potencialmente acessar dados de outros departamentos
4. **Performance**: Consultas sem otimização para filtros por departamento

## 🔧 **PLANO DE IMPLEMENTAÇÃO**

### **FASE 1: Melhorar Políticas RLS (Backend)**

#### **1.1 Criar Políticas RLS Avançadas**

```sql
-- POLITICAS-RLS-ATENDENTES.sql
-- =====================================================
-- POLÍTICAS RLS AVANÇADAS PARA ATENDENTES
-- =====================================================

-- 1. Remover políticas antigas
DROP POLICY IF EXISTS "Leitura consolidada de mensagens" ON public.agente_conversacional_whatsapp;
DROP POLICY IF EXISTS "Inserção consolidada de mensagens" ON public.agente_conversacional_whatsapp;
DROP POLICY IF EXISTS "Atualização de mensagens" ON public.agente_conversacional_whatsapp;
DROP POLICY IF EXISTS "Exclusão de mensagens" ON public.agente_conversacional_whatsapp;

-- 2. Política de SELECT com filtro por departamento
CREATE POLICY "Leitura por departamento e permissões" 
ON public.agente_conversacional_whatsapp
FOR SELECT
USING (
  -- Gestores veem todas as mensagens do cliente
  EXISTS (
    SELECT 1 FROM atendentes a
    WHERE a.email = auth.jwt() ->> 'email'
    AND a.id_cliente = (
      SELECT ci.id FROM clientes_info ci 
      WHERE ci.user_id_auth = auth.uid()
    )
    AND a.tipo_usuario = 'Gestor'
  )
  OR
  -- Atendentes veem apenas mensagens dos seus departamentos
  EXISTS (
    SELECT 1 FROM atendentes a
    WHERE a.email = auth.jwt() ->> 'email'
    AND a.id_cliente = (
      SELECT ci.id FROM clientes_info ci 
      WHERE ci.user_id_auth = auth.uid()
    )
    AND a.tipo_usuario = 'Atendente'
    AND (
      -- Verificar se o telefone da mensagem pertence a um lead do departamento do atendente
      EXISTS (
        SELECT 1 FROM leads l
        WHERE l.telefone = agente_conversacional_whatsapp.telefone_id
        AND l.id_cliente = a.id_cliente
        AND (
          (a.id_departamento IS NOT NULL AND l.id_departamento = a.id_departamento)
          OR
          (a.departamentos IS NOT NULL AND l.id_departamento::text = ANY(a.departamentos))
        )
      )
    )
  )
);

-- 3. Política de INSERT
CREATE POLICY "Inserção por permissões" 
ON public.agente_conversacional_whatsapp
FOR INSERT
WITH CHECK (
  auth.uid() = user_id_auth
);

-- 4. Política de UPDATE
CREATE POLICY "Atualização por permissões" 
ON public.agente_conversacional_whatsapp
FOR UPDATE
USING (
  -- Mesma lógica de SELECT para UPDATE
  EXISTS (
    SELECT 1 FROM atendentes a
    WHERE a.email = auth.jwt() ->> 'email'
    AND a.id_cliente = (
      SELECT ci.id FROM clientes_info ci 
      WHERE ci.user_id_auth = auth.uid()
    )
    AND a.tipo_usuario = 'Gestor'
  )
  OR
  EXISTS (
    SELECT 1 FROM atendentes a
    WHERE a.email = auth.jwt() ->> 'email'
    AND a.id_cliente = (
      SELECT ci.id FROM clientes_info ci 
      WHERE ci.user_id_auth = auth.uid()
    )
    AND a.tipo_usuario = 'Atendente'
    AND (
      EXISTS (
        SELECT 1 FROM leads l
        WHERE l.telefone = agente_conversacional_whatsapp.telefone_id
        AND l.id_cliente = a.id_cliente
        AND (
          (a.id_departamento IS NOT NULL AND l.id_departamento = a.id_departamento)
          OR
          (a.departamentos IS NOT NULL AND l.id_departamento::text = ANY(a.departamentos))
        )
      )
    )
  )
)
WITH CHECK (
  auth.uid() = user_id_auth
);

-- 5. Política de DELETE
CREATE POLICY "Exclusão por permissões" 
ON public.agente_conversacional_whatsapp
FOR DELETE
USING (
  -- Apenas gestores podem deletar mensagens
  EXISTS (
    SELECT 1 FROM atendentes a
    WHERE a.email = auth.jwt() ->> 'email'
    AND a.id_cliente = (
      SELECT ci.id FROM clientes_info ci 
      WHERE ci.user_id_auth = auth.uid()
    )
    AND a.tipo_usuario = 'Gestor'
  )
);
```

#### **1.2 Criar Políticas RLS para Tabela Leads**

```sql
-- POLITICAS-RLS-LEADS.sql
-- =====================================================
-- POLÍTICAS RLS PARA TABELA LEADS
-- =====================================================

-- Habilitar RLS na tabela leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes
DROP POLICY IF EXISTS "Permitir acesso aos leads do cliente" ON leads;
DROP POLICY IF EXISTS "Permitir inserção de leads" ON leads;
DROP POLICY IF EXISTS "Permitir atualização de leads" ON leads;

-- Política de SELECT para leads
CREATE POLICY "Leitura de leads por departamento" 
ON public.leads
FOR SELECT
USING (
  -- Gestores veem todos os leads do cliente
  EXISTS (
    SELECT 1 FROM atendentes a
    WHERE a.email = auth.jwt() ->> 'email'
    AND a.id_cliente = leads.id_cliente
    AND a.tipo_usuario = 'Gestor'
  )
  OR
  -- Atendentes veem apenas leads dos seus departamentos
  EXISTS (
    SELECT 1 FROM atendentes a
    WHERE a.email = auth.jwt() ->> 'email'
    AND a.id_cliente = leads.id_cliente
    AND a.tipo_usuario = 'Atendente'
    AND (
      (a.id_departamento IS NOT NULL AND leads.id_departamento = a.id_departamento)
      OR
      (a.departamentos IS NOT NULL AND leads.id_departamento::text = ANY(a.departamentos))
    )
  )
);

-- Política de INSERT para leads
CREATE POLICY "Inserção de leads" 
ON public.leads
FOR INSERT
WITH CHECK (
  -- Gestores podem inserir leads em qualquer departamento
  EXISTS (
    SELECT 1 FROM atendentes a
    WHERE a.email = auth.jwt() ->> 'email'
    AND a.id_cliente = leads.id_cliente
    AND a.tipo_usuario = 'Gestor'
  )
  OR
  -- Atendentes podem inserir leads apenas nos seus departamentos
  EXISTS (
    SELECT 1 FROM atendentes a
    WHERE a.email = auth.jwt() ->> 'email'
    AND a.id_cliente = leads.id_cliente
    AND a.tipo_usuario = 'Atendente'
    AND (
      (a.id_departamento IS NOT NULL AND leads.id_departamento = a.id_departamento)
      OR
      (a.departamentos IS NOT NULL AND leads.id_departamento::text = ANY(a.departamentos))
    )
  )
);

-- Política de UPDATE para leads
CREATE POLICY "Atualização de leads" 
ON public.leads
FOR UPDATE
USING (
  -- Mesma lógica de SELECT
  EXISTS (
    SELECT 1 FROM atendentes a
    WHERE a.email = auth.jwt() ->> 'email'
    AND a.id_cliente = leads.id_cliente
    AND a.tipo_usuario = 'Gestor'
  )
  OR
  EXISTS (
    SELECT 1 FROM atendentes a
    WHERE a.email = auth.jwt() ->> 'email'
    AND a.id_cliente = leads.id_cliente
    AND a.tipo_usuario = 'Atendente'
    AND (
      (a.id_departamento IS NOT NULL AND leads.id_departamento = a.id_departamento)
      OR
      (a.departamentos IS NOT NULL AND leads.id_departamento::text = ANY(a.departamentos))
    )
  )
)
WITH CHECK (
  -- Mesma lógica de INSERT
  EXISTS (
    SELECT 1 FROM atendentes a
    WHERE a.email = auth.jwt() ->> 'email'
    AND a.id_cliente = leads.id_cliente
    AND a.tipo_usuario = 'Gestor'
  )
  OR
  EXISTS (
    SELECT 1 FROM atendentes a
    WHERE a.email = auth.jwt() ->> 'email'
    AND a.id_cliente = leads.id_cliente
    AND a.tipo_usuario = 'Atendente'
    AND (
      (a.id_departamento IS NOT NULL AND leads.id_departamento = a.id_departamento)
      OR
      (a.departamentos IS NOT NULL AND leads.id_departamento::text = ANY(a.departamentos))
    )
  )
);
```

### **FASE 2: Otimizar Consultas Frontend**

#### **2.1 Melhorar Função fetchConversations**

```typescript
// MELHORIAS-CONVERSATIONS.tsx
// =====================================================
// MELHORIAS PARA FILTROS DE PERMISSÕES
// =====================================================

// Função otimizada para buscar conversas com filtros de permissão
const fetchConversations = useCallback(async (showLoading = true) => {
  if (!user || (!instanceId1 && !instanceId2)) {
    if (showLoading) setLoading(false);
    return;
  }

  if (showLoading) setLoading(true);

  try {
    const ids = [instanceId1, instanceId2].filter(Boolean);
    if (ids.length === 0) {
      setConversations([]);
      if (showLoading) setLoading(false);
      return;
    }

    // Buscar informações do usuário para aplicar filtros
    const { data: userInfoData, error: userError } = await supabase
      .from('atendentes')
      .select('tipo_usuario, id_departamento, departamentos')
      .eq('email', user.email)
      .eq('id_cliente', user.id_cliente)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('Erro ao buscar informações do usuário:', userError);
    }

    // Construir query base
    let query = supabase
      .from('agente_conversacional_whatsapp')
      .select('*')
      .in('instance_id', ids)
      .order('created_at', { ascending: true });

    // Se for atendente, aplicar filtros adicionais
    if (userInfoData?.tipo_usuario === 'Atendente') {
      console.log('Aplicando filtros de atendente:', {
        id_departamento: userInfoData.id_departamento,
        departamentos: userInfoData.departamentos
      });

      // Buscar telefones dos leads dos departamentos permitidos
      const { data: allowedPhones, error: phonesError } = await supabase
        .from('leads')
        .select('telefone')
        .eq('id_cliente', user.id_cliente)
        .or(
          userInfoData.id_departamento 
            ? `id_departamento.eq.${userInfoData.id_departamento}`
            : `id_departamento.in.(${userInfoData.departamentos?.join(',') || ''})`
        );

      if (phonesError) {
        console.error('Erro ao buscar telefones permitidos:', phonesError);
        setConversations([]);
        if (showLoading) setLoading(false);
        return;
      }

      const allowedPhoneNumbers = allowedPhones?.map(l => l.telefone) || [];
      console.log('Telefones permitidos para atendente:', allowedPhoneNumbers.length);

      if (allowedPhoneNumbers.length > 0) {
        query = query.in('telefone_id', allowedPhoneNumbers);
      } else {
        // Se não há telefones permitidos, não mostrar conversas
        setConversations([]);
        if (showLoading) setLoading(false);
        return;
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao carregar conversas:', error);
      toast.error('Erro ao carregar conversas');
      if (showLoading) setLoading(false);
      return;
    }

    console.log('Conversas carregadas com filtros:', data?.length || 0);
    setConversations(data || []);
    await buildContacts(data || []);

  } catch (error) {
    console.error('Erro ao carregar conversas:', error);
    toast.error('Erro ao carregar conversas');
  } finally {
    if (showLoading) setLoading(false);
  }
}, [user, instanceId1, instanceId2, buildContacts]);
```

#### **2.2 Melhorar Função buildContacts**

```typescript
// Função otimizada para construir contatos com filtros de permissão
const buildContacts = useCallback(async (conversations: Conversation[]) => {
  if (!user?.id_cliente || conversations.length === 0) return;

  try {
    // Buscar informações do usuário
    const { data: userInfoData, error: userError } = await supabase
      .from('atendentes')
      .select('tipo_usuario, id_departamento, departamentos')
      .eq('email', user.email)
      .eq('id_cliente', user.id_cliente)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('Erro ao buscar informações do usuário:', userError);
    }

    // Buscar leads com filtros de permissão
    let leadsQuery = supabase
      .from('leads')
      .select('*')
      .eq('id_cliente', user.id_cliente);

    // Se for atendente, filtrar por departamento
    if (userInfoData?.tipo_usuario === 'Atendente') {
      if (userInfoData.id_departamento) {
        leadsQuery = leadsQuery.eq('id_departamento', userInfoData.id_departamento);
      } else if (userInfoData.departamentos && userInfoData.departamentos.length > 0) {
        leadsQuery = leadsQuery.in('id_departamento', userInfoData.departamentos);
      }
    }

    const { data: leadsRaw, error: leadsError } = await leadsQuery;

    if (leadsError) {
      console.error('Erro ao buscar leads:', leadsError);
      return;
    }

    // Construir contatos apenas dos leads permitidos
    const seen = new Map<string, Contact>();
    const chipsAtivos = [instanceId1, instanceId2].filter(Boolean);

    leadsRaw.forEach(lead => {
      const phone = normalizePhone(lead.telefone);
      if (
        chipsAtivos.includes(lead.instance_id) &&
        !seen.has(phone)
      ) {
        seen.set(phone, {
          id: phone,
          name: lead.nome || `Contato ${phone.slice(-4)}`,
          lastMessage: '',
          lastMessageTime: lead.data_criacao || lead.created_at || '',
          avatar: '/avatar.png',
          telefone_id: lead.telefone,
          atendimento_ia: lead.atendimento_ia,
          atendimento_humano: lead.atendimento_humano,
          lastMessageType: 'texto',
          instance_id: lead.instance_id || '',
        });
      }
    });

    const contactsArray = Array.from(seen.values()).sort((a, b) => {
      return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
    });

    setContacts(prevContacts => {
      if (prevContacts.length !== contactsArray.length) {
        return contactsArray;
      }
      const hasChanges = contactsArray.some(newContact => {
        const existingContact = prevContacts.find(c => c.id === newContact.id);
        return !existingContact || 
               existingContact.lastMessage !== newContact.lastMessage ||
               existingContact.lastMessageTime !== newContact.lastMessageTime ||
               existingContact.name !== newContact.name;
      });
      return hasChanges ? contactsArray : prevContacts;
    });

    console.log('Contatos construídos com filtros:', contactsArray.length);

  } catch (error) {
    console.error('Erro ao construir contatos:', error);
  }
}, [user?.id_cliente, instanceId1, instanceId2]);
```

### **FASE 3: Implementar Índices Otimizados**

```sql
-- INDICES-PERMISSOES-ATENDENTES.sql
-- =====================================================
-- ÍNDICES OTIMIZADOS PARA FILTROS DE PERMISSÕES
-- =====================================================

-- 1. Índices para agente_conversacional_whatsapp
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agente_telefone_instance 
ON public.agente_conversacional_whatsapp (telefone_id, instance_id) 
WHERE telefone_id IS NOT NULL AND instance_id IS NOT NULL;

-- 2. Índices para leads com departamento
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_departamento_cliente 
ON public.leads (id_departamento, id_cliente) 
WHERE id_departamento IS NOT NULL AND id_cliente IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_telefone_departamento 
ON public.leads (telefone, id_departamento, id_cliente) 
WHERE telefone IS NOT NULL AND id_departamento IS NOT NULL;

-- 3. Índices para atendentes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_atendentes_email_cliente 
ON public.atendentes (email, id_cliente) 
WHERE email IS NOT NULL AND id_cliente IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_atendentes_tipo_departamento 
ON public.atendentes (tipo_usuario, id_departamento) 
WHERE tipo_usuario = 'Atendente' AND id_departamento IS NOT NULL;

-- 4. Índices para clientes_info
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clientes_user_id 
ON public.clientes_info (user_id_auth) 
WHERE user_id_auth IS NOT NULL;
```

### **FASE 4: Implementar Componente de Controle de Permissões**

```typescript
// src/hooks/usePermissions.ts
// =====================================================
// HOOK PARA GERENCIAR PERMISSÕES DE ATENDENTES
// =====================================================

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import { supabase } from '@/lib/supabase';

interface UserPermissions {
  tipo_usuario: 'Gestor' | 'Atendente';
  id_departamento?: number;
  departamentos?: string[];
  canViewAllDepartments: boolean;
  canEditLeads: boolean;
  canDeleteMessages: boolean;
  canTransferLeads: boolean;
  allowedDepartments: number[];
}

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

      try {
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
          canEditLeads: true, // Atendentes podem editar leads dos seus departamentos
          canDeleteMessages: userInfo?.tipo_usuario === 'Gestor',
          canTransferLeads: userInfo?.tipo_usuario === 'Gestor',
          allowedDepartments: userInfo?.tipo_usuario === 'Gestor' 
            ? [] // Gestores podem ver todos os departamentos
            : userInfo?.id_departamento 
              ? [userInfo.id_departamento]
              : userInfo?.departamentos?.map(d => parseInt(d)) || []
        };

        setPermissions(userPerms);
      } catch (error) {
        console.error('Erro ao carregar permissões:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [user]);

  const canAccessDepartment = (departmentId: number): boolean => {
    if (!permissions) return false;
    if (permissions.canViewAllDepartments) return true;
    return permissions.allowedDepartments.includes(departmentId);
  };

  const canAccessLead = (leadDepartmentId: number): boolean => {
    return canAccessDepartment(leadDepartmentId);
  };

  const canAccessConversation = (phoneNumber: string): Promise<boolean> => {
    return new Promise(async (resolve) => {
      if (!permissions || !user?.id_cliente) {
        resolve(false);
        return;
      }

      if (permissions.canViewAllDepartments) {
        resolve(true);
        return;
      }

      try {
        const { data: lead } = await supabase
          .from('leads')
          .select('id_departamento')
          .eq('telefone', phoneNumber)
          .eq('id_cliente', user.id_cliente)
          .single();

        resolve(lead ? canAccessDepartment(lead.id_departamento) : false);
      } catch (error) {
        console.error('Erro ao verificar acesso à conversa:', error);
        resolve(false);
      }
    });
  };

  return {
    permissions,
    loading,
    canAccessDepartment,
    canAccessLead,
    canAccessConversation
  };
};
```

### **FASE 5: Implementar Validações no Frontend**

```typescript
// src/components/PermissionGuard.tsx
// =====================================================
// COMPONENTE PARA PROTEGER ELEMENTOS POR PERMISSÃO
// =====================================================

import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermission?: keyof UserPermissions;
  departmentId?: number;
  fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  requiredPermission,
  departmentId,
  fallback = null
}) => {
  const { permissions, loading, canAccessDepartment } = usePermissions();

  if (loading) {
    return <div className="animate-pulse">Carregando...</div>;
  }

  if (!permissions) {
    return fallback;
  }

  // Verificar permissão específica
  if (requiredPermission && !permissions[requiredPermission]) {
    return fallback;
  }

  // Verificar acesso ao departamento
  if (departmentId && !canAccessDepartment(departmentId)) {
    return fallback;
  }

  return <>{children}</>;
};

// Exemplo de uso:
// <PermissionGuard requiredPermission="canDeleteMessages">
//   <Button onClick={handleDelete}>Deletar</Button>
// </PermissionGuard>
```

### **FASE 6: Implementar Logs de Auditoria**

```sql
-- AUDITORIA-PERMISSOES.sql
-- =====================================================
-- SISTEMA DE AUDITORIA PARA PERMISSÕES
-- =====================================================

-- Criar tabela de auditoria
CREATE TABLE IF NOT EXISTS public.auditoria_permissoes (
  id SERIAL PRIMARY KEY,
  user_id_auth UUID REFERENCES auth.users(id),
  email TEXT NOT NULL,
  acao TEXT NOT NULL,
  tabela TEXT NOT NULL,
  registro_id TEXT,
  departamento_id INTEGER,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  detalhes JSONB
);

-- Função para registrar auditoria
CREATE OR REPLACE FUNCTION registrar_auditoria_permissoes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.auditoria_permissoes (
    user_id_auth,
    email,
    acao,
    tabela,
    registro_id,
    departamento_id,
    detalhes
  ) VALUES (
    auth.uid(),
    auth.jwt() ->> 'email',
    TG_OP,
    TG_TABLE_NAME,
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.id::text
      ELSE NEW.id::text
    END,
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.id_departamento
      ELSE NEW.id_departamento
    END,
    jsonb_build_object(
      'old', CASE WHEN TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
      'new', CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers para auditoria
CREATE TRIGGER auditoria_leads
  AFTER INSERT OR UPDATE OR DELETE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION registrar_auditoria_permissoes();

CREATE TRIGGER auditoria_mensagens
  AFTER INSERT OR UPDATE OR DELETE ON public.agente_conversacional_whatsapp
  FOR EACH ROW EXECUTE FUNCTION registrar_auditoria_permissoes();
```

## 🚀 **PLANO DE EXECUÇÃO**

### **Semana 1: Backend**
1. ✅ Executar `POLITICAS-RLS-ATENDENTES.sql`
2. ✅ Executar `POLITICAS-RLS-LEADS.sql`
3. ✅ Executar `INDICES-PERMISSOES-ATENDENTES.sql`
4. ✅ Executar `AUDITORIA-PERMISSOES.sql`

### **Semana 2: Frontend**
1. ✅ Implementar `usePermissions.ts`
2. ✅ Implementar `PermissionGuard.tsx`
3. ✅ Atualizar `Conversations.tsx` com filtros otimizados
4. ✅ Testar todas as funcionalidades

### **Semana 3: Testes e Validação**
1. ✅ Testes de segurança
2. ✅ Testes de performance
3. ✅ Validação de permissões
4. ✅ Documentação final

## 📊 **MÉTRICAS DE SUCESSO**

### **Segurança:**
- ✅ 100% das consultas filtradas por departamento
- ✅ Zero acesso não autorizado a dados
- ✅ Logs de auditoria completos

### **Performance:**
- ✅ Consultas otimizadas com índices
- ✅ Tempo de resposta < 100ms
- ✅ Cache de permissões no frontend

### **Usabilidade:**
- ✅ Interface clara sobre permissões
- ✅ Feedback visual para ações não permitidas
- ✅ Experiência consistente para gestores e atendentes

## 🔒 **BENEFÍCIOS ESPERADOS**

1. **Segurança Aprimorada**: Filtros em múltiplas camadas (RLS + Frontend)
2. **Performance Otimizada**: Índices específicos para filtros de permissão
3. **Auditoria Completa**: Rastreamento de todas as ações
4. **Manutenibilidade**: Código organizado e reutilizável
5. **Escalabilidade**: Sistema preparado para crescimento

Este plano garante que as permissões dos atendentes sejam aplicadas de forma robusta e eficiente em toda a seção de conversas. 