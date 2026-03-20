# Sistema de Super Admin

## Visão Geral

O sistema de Super Admin permite que administradores do sistema tenham acesso completo a todas as contas de clientes para fins de suporte, configuração e monitoramento.

## Funcionalidades Implementadas

### ✅ Funcionalidades Atuais

1. **Login de Super Admin**
   - Rota: `/super-admin-login`
   - Autenticação via Supabase Auth
   - Verificação de autorização na tabela `superadmins`

2. **Dashboard de Super Admin**
   - Rota: `/super-admin`
   - Visualização de todos os clientes
   - Estatísticas gerais do sistema
   - Busca e filtros de clientes

3. **Impersonação de Clientes**
   - Acesso "ver como" a qualquer conta de cliente
   - Banner de aviso durante a impersonação
   - Botão para sair do modo impersonação

### 🚧 Funcionalidades Futuras

1. **Gestão de Contas de Clientes**
   - ✅ Acessar qualquer conta (modo "ver como" / impersonate)
   - 🔄 Bloquear ou suspender contas
   - 🔄 Forçar logout de sessões ativas
   - 🔄 Editar dados da conta (nome, e-mail, plano, status)

2. **Gestão de Usuários e Permissões**
   - 🔄 Criar / excluir usuários dos clientes
   - 🔄 Alterar permissões de usuários (ex: atendente, gestor, etc.)
   - 🔄 Bloquear usuários específicos
   - 🔄 Ver auditoria de ações por usuário (log de atividades)

## Configuração Inicial

### 1. Criar Tabela de Super Admins

```sql
create table public.superadmins (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text not null unique,
  criado_em timestamp with time zone default now()
);
```

### 2. Inserir Super Admin

```sql
INSERT INTO public.superadmins (nome, email) 
VALUES ('Bruno Cunha', 'contatobrunohcunha@gmail.com')
ON CONFLICT (email) DO NOTHING;
```

### 3. Criar Conta no Supabase Auth

O super admin precisa ter uma conta no Supabase Auth com o mesmo email da tabela `superadmins`.

## Como Usar

### 1. Acesso ao Sistema

1. Acesse a rota `/super-admin-login`
2. Faça login com as credenciais do super admin
3. Será redirecionado para `/super-admin`

### 2. Dashboard Principal

O dashboard mostra:
- **Estatísticas**: Total de clientes, clientes ativos, suspensos, total de usuários
- **Lista de Clientes**: Tabela com todos os clientes do sistema
- **Busca**: Filtro por nome, email ou telefone
- **Ações**: Botão para acessar cada conta

### 3. Impersonação de Cliente

1. Clique em "Acessar" na linha do cliente desejado
2. Confirme a ação no modal
3. Será redirecionado para o dashboard principal com banner de aviso
4. Use o botão "Sair do Modo" para voltar ao dashboard do super admin

## Estrutura de Arquivos

```
src/
├── pages/
│   ├── auth/
│   │   └── SuperAdminLogin.tsx          # Página de login
│   └── super-admin/
│       └── SuperAdminDashboard.tsx      # Dashboard principal
├── components/
│   └── SuperAdminBanner.tsx             # Banner de impersonação
├── hooks/
│   └── useSuperAdmin.ts                 # Hook para gerenciar estado
├── services/
│   └── superAdminService.ts             # Serviços do super admin
└── App.tsx                              # Rotas atualizadas
```

## Segurança

### Verificações Implementadas

1. **Autenticação**: Login via Supabase Auth
2. **Autorização**: Verificação na tabela `superadmins`
3. **Sessão**: Dados armazenados em `sessionStorage`
4. **Impersonação**: Banner de aviso durante o modo

### Recomendações de Segurança

1. **RLS Policies**: Implementar Row Level Security no Supabase
2. **Auditoria**: Log de todas as ações do super admin
3. **Rate Limiting**: Limitar tentativas de login
4. **2FA**: Implementar autenticação de dois fatores
5. **Sessões**: Implementar timeout de sessão

## Próximos Passos

### Prioridade Alta
1. Implementar bloqueio/suspensão de contas
2. Adicionar edição de dados de clientes
3. Implementar forçar logout de sessões

### Prioridade Média
1. Gestão de usuários por cliente
2. Alteração de permissões
3. Sistema de auditoria

### Prioridade Baixa
1. Relatórios avançados
2. Notificações automáticas
3. Integração com sistemas externos

## Troubleshooting

### Problemas Comuns

1. **Erro de Login**
   - Verificar se o email existe na tabela `superadmins`
   - Verificar se a conta existe no Supabase Auth
   - Verificar permissões de acesso

2. **Erro ao Carregar Clientes**
   - Verificar permissões na tabela `clientes_info`
   - Verificar conexão com Supabase

3. **Erro de Impersonação**
   - Verificar se o cliente existe
   - Verificar permissões de acesso aos dados

### Logs Úteis

```javascript
// Verificar estado do super admin
console.log('isSuperAdmin:', sessionStorage.getItem('isSuperAdmin'));
console.log('isImpersonating:', sessionStorage.getItem('isImpersonating'));
console.log('superAdminData:', sessionStorage.getItem('superAdminData'));
console.log('impersonatedCliente:', sessionStorage.getItem('impersonatedCliente'));
```

## Contato

Para dúvidas ou suporte sobre o sistema de Super Admin, entre em contato com a equipe de desenvolvimento. 