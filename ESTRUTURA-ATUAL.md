# ESTRUTURA ATUAL DO PROJETO - SMART CRM

Este arquivo descreve a estrutura atual do projeto, componentes, serviços e configurações.

## 1. Estrutura de Pastas Completa

```text
.claude/
.git/
migrations/
n8n-workflows/
node_modules/
public/
scripts/
src/
  assets/
  components/
    charts/
    dashboard/
    layout/
    leads/
    settings/
    theme/
    ui/
    whatsapp/
  config/
  contexts/
  hooks/
  lib/
  pages/
    admin/
    auth/
    dashboard/
    leads/
    settings/
  services/
  types/
  utils/
supabase/
  functions/
    check-workflow-timeouts/
    meta-auth/ (Vazio)
    meta-webhook/ (Vazio)
    workflow-message-receiver/
    workflow-webhook-trigger/
  migrations/
.env
.gitignore
components.json
eslint.config.js
index.html
package.json
postcss.config.js
tailwind.config.ts
tsconfig.app.json
tsconfig.json
tsconfig.node.json
vite.config.ts
```

## 2. Componentes WhatsApp (`src/components/whatsapp/`)

- **MyQRCode.tsx**: Componente para exibição de QR Code de conexão.
- **PhoneNumberForm.tsx**: Formulário para entrada e validação de número de telefone.
- **WhatsAppConnect.tsx**: Componente principal para gerenciar conexões WhatsApp (Evolution/UAZAPI).
- **WhatsAppConnectChip.tsx**: Badge/Chip indicador de status da conexão WhatsApp.
- **WhatsAppConnectUAZAPI.tsx**: Interface específica para conexão via UAZAPI.
- **WhatsAppQRCode.tsx**: Renderizador de QR Code para autenticação do WhatsApp.
- **envioSupaBase.tsx**: Componente utilitário para envio de dados/logs para o Supabase.
- **useWhatsAppConnect.ts**: Hook customizado para gerenciar a lógica de conexão e estado do WhatsApp.

> [!NOTE]
> O arquivo `WhatsAppConnectMeta.tsx` não foi encontrado no diretório especificado.

## 3. Páginas de Configurações (`src/pages/settings/Settings.tsx`)

```tsx
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WhatsAppConnect } from "@/components/whatsapp/WhatsAppConnect";
import { toast } from "sonner";
import { User, Lock, Smartphone, Globe, Palette } from "lucide-react";
import { ThemeSelector } from "@/components/theme/ThemeSelector";

const Settings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (user) {
      getProfile();
    }
  }, [user]);

  const getProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("clientes_info")
        .select("name, email, phone")
        .eq("user_id_auth", user?.id)
        .single();

      if (error) throw error;
      if (data) {
        setProfile({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
        });
      }
    } catch (error: any) {
      toast.error("Erro ao carregar perfil: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from("clientes_info")
        .update({
          name: profile.name,
          phone: profile.phone,
        })
        .eq("user_id_auth", user?.id);

      if (error) throw error;
      toast.success("Perfil atualizado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao atualizar perfil: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(user?.email || "", {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;
      toast.success("E-mail de redefinição de senha enviado!");
    } catch (error: any) {
      toast.error("Erro ao solicitar redefinição: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie suas preferências de conta, conexões e aparência.
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[600px] lg:grid-cols-4 mb-8">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Aparência
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Segurança
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Perfil</CardTitle>
              <CardDescription>
                Atualize suas informações básicas de contato.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" value={profile.email} disabled />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">WhatsApp / Telefone</Label>
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
              </div>
              <Button onClick={updateProfile} disabled={loading}>
                Salvar Alterações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whatsapp" className="space-y-4">
          <WhatsAppConnect />
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Aparência</CardTitle>
              <CardDescription>
                Personalize as cores e o tema do seu painel.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ThemeSelector />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Segurança</CardTitle>
              <CardDescription>
                Gerencie sua senha e acesso à conta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2">
                <Label>Senha</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Você receberá um link no seu e-mail para definir uma nova senha.
                </p>
                <Button variant="outline" onClick={handlePasswordReset} disabled={loading}>
                  Redefinir Senha
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
```

## 4. Componente WhatsAppConnectMeta

> [!WARNING]
> O arquivo `src/components/whatsapp/WhatsAppConnectMeta.tsx` não foi localizado no projeto.

## 5. Edge Functions (`supabase/functions/`)

Funções listadas:
- `check-workflow-timeouts`
- `meta-auth` (Vazio)
- `meta-webhook` (Vazio)
- `workflow-message-receiver`
- `workflow-webhook-trigger`

> [!CAUTION]
> Os arquivos `supabase/functions/meta-auth/index.ts` e `supabase/functions/meta-webhook/index.ts` não foram encontrados. Os diretórios existem, mas parecem não conter os arquivos de implementação solicitados.

## 6. Serviços (`src/services/`)

- **atendentesService.ts**: Gerencia dados, criação e remoção de atendentes.
- **authService.ts**: Gerencia recuperação de senha e troca de sessões.
- **chatbotSimulationService.ts**: Lógica para simulação de chatbot e armazenamento de mensagens.
- **chipsService.ts**: Gerencia disponibilidade de chips WhatsApp e associação com departamentos.
- **clientesService.ts**: Gerencia informações do cliente, planos e integrações.
- **dashboardPersonalService.ts**: Provê dados estatísticos de vendas e oportunidades para o dashboard.
- **departamentosService.ts**: Gerencia a estrutura de departamentos da empresa.
- **documentosCatalogoService.ts**: Gerencia upload de arquivos e entradas no catálogo de documentos.
- **etiquetasService.ts**: Operações de CRUD para etiquetas de organização de leads.
- **facebookGastosService.ts**: Monitoramento de gastos com anúncios no Facebook Ads.
- **followupService.ts**: Configuração e gestão de fluxos de follow-up.
- **funisRdService.ts**: Integração e gestão de funis do RD Station.
- **funisService.ts**: Gestão de funis de venda e suas respectivas etapas.
- **gestorService.ts**: Gerencia a atribuição de gestores aos clientes.
- **leadsService.ts**: Gestão completa de leads (pipeline, status, movimentação).
- **messageService.ts**: Serviço central para envio de mensagens via WhatsApp (integrado com Evolution/UAZAPI).
- **metricasFbService.ts**: Coleta e análise de métricas provenientes do Facebook Ads.
- **storageService.ts**: Gerencia uploads e exclusões de arquivos no Supabase Storage (assets de workflow).
- **superAdminService.ts**: Funcionalidades administrativas globais para visualização de clientes e usuários.
- **temaService.ts**: Gerencia temas e domínios personalizados para os clientes.
- **uazapiService.ts**: Implementação técnica da integração com a API UAZAPI do WhatsApp.
- **webhookService.ts**: Gerencia o envio de dados para webhooks externos (leads, cadastros, contatos).
- **whatsappService.ts**: Gerencia instâncias, estados de conexão e webhooks da API Baileys/Evolution.
- **workflowMessageHandler.ts**: Processa mensagens recebidas via webhook e aciona/retoma fluxos de workflow.
- **workflowService.ts**: Lógica centralizada para gestão e execução de fluxos automatizados (Workflows).

## 7. Variáveis de ambiente (`.env`)

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 8. package.json (Dependências Principais)

```json
"dependencies": {
  "@radix-ui/react-*": "^1.x.x",
  "@supabase/supabase-js": "^2.49.8",
  "@tanstack/react-query": "^5.56.2",
  "@xyflow/react": "^12.5.5",
  "axios": "^1.9.0",
  "lucide-react": "^0.462.0",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.26.2",
  "recharts": "^2.12.7",
  "sonner": "^1.5.0",
  "zod": "^3.23.8",
  "vite": "^5.4.18"
}
```
