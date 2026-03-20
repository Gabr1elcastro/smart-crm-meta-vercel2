# 🔑 Sistema de Senha Mestra - SmartCRM

## 📋 **Visão Geral**

O sistema de senha mestra permite que administradores e suporte técnico acessem qualquer conta do SmartCRM sem comprometer a segurança individual dos usuários.

## 🚀 **Como Funciona**

### **1. Autenticação Normal:**
- ✅ Cada usuário mantém sua senha individual
- ✅ Login normal funciona como sempre
- ✅ Segurança individual preservada

### **2. Acesso Mestra:**
- 🔑 **Senha mestra** + **Email da conta alvo**
- 🔍 **Validação** da existência da conta
- 📝 **Log de auditoria** de todos os acessos
- 🚫 **Sem exposição** de senhas reais

## ⚙️ **Configuração**

### **1. Variável de Ambiente:**
Crie ou edite o arquivo `.env` na raiz do projeto:

```bash
# Senha Mestra (para acesso administrativo)
VITE_MASTER_PASSWORD=SUA_SENHA_MESTRA_AQUI
```

### **2. Senha Padrão:**
Se não configurar, a senha padrão será: `smartcrm2024`

### **3. Recomendações de Segurança:**
- 🔒 Use uma senha **forte e única**
- 🔐 **Não compartilhe** com usuários comuns
- 📧 **Restrinja** apenas para administradores
- 🔄 **Altere regularmente** (ex: a cada 3 meses)

## 🎯 **Como Usar**

### **1. Na Tela de Login:**
1. Clique no botão **"Acesso Mestra"**
2. Digite o **email da conta** que deseja acessar
3. Digite a **senha mestra**
4. Clique em **"Acessar Conta"**

### **2. Validação:**
- ✅ Email deve existir no sistema
- ✅ Conta deve estar ativa/confirmada
- ✅ Senha mestra deve estar correta

### **3. Acesso Concedido:**
- 🔑 Sistema simula login do usuário alvo
- 📊 Dashboard carrega com dados da conta alvo
- 📝 Log de acesso é registrado para auditoria

## 🔒 **Segurança e Auditoria**

### **1. Logs de Acesso:**
```javascript
// Exemplo de log registrado
{
  timestamp: "2025-01-15T14:30:25.000Z",
  action: "MASTER_ACCESS_GRANTED",
  targetUser: "usuario@exemplo.com",
  masterUser: "admin@smartcrm.com",
  ipAddress: "192.168.1.100",
  userAgent: "Mozilla/5.0..."
}
```

### **2. Validações de Segurança:**
- ✅ **Email válido** e existente
- ✅ **Conta ativa** (não suspensa)
- ✅ **Senha mestra** correta
- ✅ **Rate limiting** para tentativas
- ✅ **Log de auditoria** completo

### **3. Restrições:**
- 🚫 **Não permite** acesso a contas suspensas
- 🚫 **Não expõe** senhas reais dos usuários
- 🚫 **Não permite** alteração de senhas
- 🚫 **Não permite** acesso a dados sensíveis

## 🛠️ **Implementação Técnica**

### **1. Hook Personalizado:**
```typescript
// src/hooks/useMasterPassword.ts
const { 
  masterAccess, 
  authenticateWithMasterPassword,
  logoutMasterAccess 
} = useMasterPassword();
```

### **2. Componente de Login:**
```typescript
// src/components/auth/MasterPasswordLogin.tsx
<MasterPasswordLogin
  onSuccess={handleMasterAccessSuccess}
  onCancel={handleCancel}
/>
```

### **3. Integração no Login:**
```typescript
// src/pages/auth/Login.tsx
<Button onClick={() => setShowMasterLogin(true)}>
  <Shield className="w-4 h-4 mr-2" />
  Acesso Mestra
</Button>
```

## 📱 **Interface do Usuário**

### **1. Botão de Acesso Mestra:**
- 🎨 **Design diferenciado** (roxo/azul)
- 🔒 **Ícone de escudo** para segurança
- 📱 **Responsivo** para mobile

### **2. Modal de Login Mestra:**
- 🎯 **Campo de email** da conta alvo
- 🔐 **Campo de senha mestra**
- 👁️ **Toggle para mostrar/ocultar** senha
- ⚠️ **Alertas de erro** claros
- 📊 **Informações de segurança**

### **3. Feedback Visual:**
- ✅ **Sucesso** com toast notification
- ❌ **Erro** com mensagens claras
- 🔄 **Loading** durante autenticação
- 📱 **Responsivo** para todos os dispositivos

## 🚨 **Casos de Uso**

### **1. Suporte Técnico:**
- 🔧 **Resolver problemas** de usuários
- 📊 **Analisar dados** de contas
- 🛠️ **Configurar** funcionalidades

### **2. Administração:**
- 👥 **Gerenciar** usuários
- 📈 **Monitorar** uso do sistema
- 🔍 **Auditar** atividades

### **3. Emergências:**
- 🚨 **Acesso urgente** a contas críticas
- 🔐 **Recuperação** de dados
- ⚡ **Resolução** de incidentes

## 📋 **Checklist de Implementação**

- [x] **Hook personalizado** para senha mestra
- [x] **Componente de login** mestra
- [x] **Integração** na tela de login
- [x] **Validações** de segurança
- [x] **Logs de auditoria**
- [x] **Interface responsiva**
- [x] **Tratamento de erros**
- [x] **Documentação completa**

## 🔮 **Próximos Passos**

### **1. Melhorias Futuras:**
- 📊 **Dashboard de auditoria** para admins
- 🔔 **Notificações** de acesso mestra
- 📱 **App mobile** com acesso mestra
- 🔐 **2FA** para senha mestra

### **2. Recursos Adicionais:**
- 👥 **Hierarquia** de senhas mestras
- 🕒 **Expiração** automática de acesso
- 🌍 **Geolocalização** de acessos
- 📧 **Alertas** por email

## 📞 **Suporte**

Para dúvidas sobre o sistema de senha mestra:

- 📧 **Email:** suporte@smartcrm.com
- 📱 **WhatsApp:** +55 11 99999-9999
- 🆘 **Ticket:** Sistema de suporte interno

---

**⚠️ IMPORTANTE:** Este sistema deve ser usado apenas para fins legítimos de administração e suporte técnico. O uso inadequado pode resultar em ações disciplinares.

