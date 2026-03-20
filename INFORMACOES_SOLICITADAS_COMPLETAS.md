# Informacoes Solicitadas - Conteudo Completo

## 1) src/pages/settings/Settings.tsx
Caminho completo: C:\Users\eg711\OneDrive\Área de Trabalho\smart-crm-meta\smart-crm-meta-vercel2\src\pages\settings\Settings.tsx
```tsx
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth";
import { clientesService, ClienteInfo } from "@/services/clientesService";
import WhatsAppConnectUAZAPI from "@/components/whatsapp/WhatsAppConnectUAZAPI";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Pencil, Save, X, UserRound, Plug, KeyRound, ArrowRight } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<"profile" | "chips">("profile");

  const [clientInfo, setClientInfo] = useState<ClienteInfo | null>(null);
  const [loadingClient, setLoadingClient] = useState(true);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    const fetchClientInfo = async () => {
      if (!user?.id_cliente) {
        setClientInfo(null);
        setLoadingClient(false);
        return;
      }

      setLoadingClient(true);
      try {
        const info = await clientesService.getClienteByIdCliente(user.id_cliente);
        setClientInfo(info);
        setEditName(info?.name || "");
        setEditPhone(info?.phone || "");
      } catch (e) {
        console.error("Erro ao buscar clientes_info:", e);
        toast.error("Erro ao carregar dados do perfil");
      } finally {
        setLoadingClient(false);
      }
    };

    fetchClientInfo();
  }, [user?.id_cliente]);

  const currentPlanLabel = useMemo(() => {
    if (!clientInfo) return null;
    if (clientInfo.trial) return "Trial";
    if (clientInfo.plano_plus) return "Plus";
    if (clientInfo.plano_pro) return "Pro";
    if (clientInfo.plano_starter) return "Start";
    if (clientInfo.plano_agentes) return "Agentes";
    return "Premium";
  }, [clientInfo]);

  const canShowUpgrade = Boolean(clientInfo?.trial);

  const handleStartEdit = () => {
    setEditName(clientInfo?.name || "");
    setEditPhone(clientInfo?.phone || "");
    setIsEditingProfile(true);
  };

  const handleCancelEdit = () => {
    setEditName(clientInfo?.name || "");
    setEditPhone(clientInfo?.phone || "");
    setIsEditingProfile(false);
  };

  const handleSaveProfile = async () => {
    if (!user?.id_cliente) return;

    setSavingProfile(true);
    try {
      const ok = await clientesService.updateClienteProfileByIdCliente(user.id_cliente, {
        name: editName.trim(),
        phone: editPhone.trim(),
      });

      if (!ok) {
        toast.error("NÃ£o foi possÃ­vel salvar as alteraÃ§Ãµes");
        return;
      }

      const refreshed = await clientesService.getClienteByIdCliente(user.id_cliente);
      setClientInfo(refreshed);
      setIsEditingProfile(false);
      toast.success("Perfil atualizado com sucesso");
    } catch (e) {
      console.error("Erro ao salvar perfil:", e);
      toast.error("Erro ao salvar perfil");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!user?.email) return;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast.error("Preencha todos os campos de senha");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error("A confirmaÃ§Ã£o da senha nÃ£o confere");
      return;
    }

    setUpdatingPassword(true);
    try {
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (reauthError) {
        toast.error("Senha atual incorreta");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        console.error("Erro ao atualizar senha:", updateError);
        toast.error(updateError.message || "Erro ao atualizar senha");
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      toast.success("Senha atualizada com sucesso");
    } catch (e) {
      console.error("Erro inesperado ao atualizar senha:", e);
      toast.error("Erro ao atualizar senha");
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
            <div className="sticky top-4 self-start">
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant={activeSection === "profile" ? "default" : "outline"}
                  className="justify-start gap-2"
                  onClick={() => setActiveSection("profile")}
                >
                  <UserRound className="h-4 w-4" />
                  Meu Perfil
                </Button>
                <Button
                  type="button"
                  variant={activeSection === "chips" ? "default" : "outline"}
                  className="justify-start gap-2"
                  onClick={() => setActiveSection("chips")}
                >
                  <Plug className="h-4 w-4" />
                  Chips Conectados
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              {activeSection === "profile" && (
                <>
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle className="text-lg">Meu Perfil</CardTitle>
                        </div>
                        {!loadingClient && (
                          <div className="flex items-center gap-2">
                            {currentPlanLabel && (
                              <Badge variant={clientInfo?.trial ? "secondary" : "default"}>
                                Plano: {currentPlanLabel}
                              </Badge>
                            )}
                            {canShowUpgrade && (
                              <Link to="/plans">
                                <Button size="sm" className="gap-2">
                                  Upgrade <ArrowRight className="h-4 w-4" />
                                </Button>
                              </Link>
                            )}
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {loadingClient ? (
                        <div className="text-sm text-gray-500">Carregando...</div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-sm text-gray-500">Nome</div>
                              {!isEditingProfile ? (
                                <div className="text-base font-medium text-gray-900">
                                  {clientInfo?.name || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "â€”"}
                                </div>
                              ) : (
                                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                              )}
                            </div>
                            {!isEditingProfile ? (
                              <Button type="button" variant="outline" size="sm" className="gap-2" onClick={handleStartEdit}>
                                <Pencil className="h-4 w-4" />
                                Editar
                              </Button>
                            ) : (
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  className="gap-2"
                                  onClick={handleSaveProfile}
                                  disabled={savingProfile}
                                >
                                  <Save className="h-4 w-4" />
                                  {savingProfile ? "Salvando..." : "Salvar"}
                                </Button>
                                <Button type="button" variant="outline" size="sm" className="gap-2" onClick={handleCancelEdit} disabled={savingProfile}>
                                  <X className="h-4 w-4" />
                                  Cancelar
                                </Button>
                              </div>
                            )}
                          </div>

                          <div>
                            <div className="text-sm text-gray-500">E-mail</div>
                            <div className="text-base font-medium text-gray-900">{clientInfo?.email || user?.email || "â€”"}</div>
                            <div className="text-xs text-gray-500 mt-1">O e-mail nÃ£o pode ser editado.</div>
                          </div>

                          <div>
                            <div className="text-sm text-gray-500">Telefone</div>
                            {!isEditingProfile ? (
                              <div className="text-base font-medium text-gray-900">{clientInfo?.phone || "â€”"}</div>
                            ) : (
                              <Input
                                value={editPhone}
                                onChange={(e) => setEditPhone(e.target.value)}
                                placeholder="(00) 00000-0000"
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">Redefinir senha</CardTitle>
                          <CardDescription>Informe sua senha atual e a nova senha</CardDescription>
                        </div>
                        <KeyRound className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <div className="text-sm text-gray-600">Senha atual</div>
                          <Input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm text-gray-600">Nova senha</div>
                          <Input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm text-gray-600">Confirmar nova senha</div>
                          <Input
                            type="password"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button onClick={handleUpdatePassword} disabled={updatingPassword}>
                          {updatingPassword ? "Atualizando..." : "Atualizar senha"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {activeSection === "chips" && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Chips Conectados</CardTitle>
                    <CardDescription>ConexÃ£o Uazapi</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <WhatsAppConnectUAZAPI email={user?.email} id={user?.id} />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
```

## 2) Componente que renderiza "Chips Conectados"
Arquivo referenciado em Settings: WhatsAppConnectUAZAPI
Caminho completo: C:\Users\eg711\OneDrive\Área de Trabalho\smart-crm-meta\smart-crm-meta-vercel2\src\components\whatsapp\WhatsAppConnectUAZAPI.tsx
```tsx
import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, RefreshCw, CheckCircle, Building2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { departamentosService, Departamento } from "@/services/departamentosService";
import { useAuth } from "@/contexts/auth";
import { useUserType } from "@/hooks/useUserType";

import {
  createUAZAPIInstance,
  connectUAZAPIInstanceAndGetQRCode,
  getUAZAPIInstanceStatus,
  configureUAZAPIWebhook,
  updateInstanceIdInRelatedTables,
  CreateInstanceParams
} from "@/services/uazapiService";

interface WhatsAppConnectUAZAPIProps {
  email?: string;
  id?: string;
  instanceName?: string;
}

export default function WhatsAppConnectUAZAPI({
  email: emailProp,
  id: userIdProp,
  instanceName
}: WhatsAppConnectUAZAPIProps) {
  const { user } = useAuth();
  const { userType } = useUserType();
  const isGestor = userType === 'Gestor';

  const creatingRef = useRef<boolean>(false);

  const [status, setStatus] =
    useState<"idle" | "creating" | "qr" | "connected" | "error">("idle");

  const [qrCode, setQrCode] = useState<string | null>(null);
  const [instanceToken, setInstanceToken] = useState<string | null>(null);
  const [instanceNameCreated, setInstanceNameCreated] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(emailProp || null);
  const [senderNumber, setSenderNumber] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState<boolean>(false);

  // Estados para controle de departamentos dos chips
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [loadingDepartamentos, setLoadingDepartamentos] = useState(false);
  const [departamentoChip1, setDepartamentoChip1] = useState<string | null>(null);
  const [departamentoChip2, setDepartamentoChip2] = useState<string | null>(null);
  const [departamentoChip1Nome, setDepartamentoChip1Nome] = useState<string | null>(null);
  const [departamentoChip2Nome, setDepartamentoChip2Nome] = useState<string | null>(null);

  // Estados para controle de atendimento (humano/IA) e chatbots
  //const [atendimentoHumano, setAtendimentoHumano] = useState<boolean>(true);
  //const [atendimentoIA, setAtendimentoIA] = useState<boolean>(false);
  type FirstAttendance = "human" | "ai";

  const [firstAttendance, setFirstAttendance] =
    useState<FirstAttendance>("human");

  const [selectedChatbotId, setSelectedChatbotId] = useState<string | number | null>(null);
  const [availableChatbots, setAvailableChatbots] = useState<Array<{ id: string | number; nome: string; em_uso: boolean }>>([]);
  const [loadingChatbots, setLoadingChatbots] = useState<boolean>(false);


  /**
   * ðŸ” Buscar email do Supabase se nÃ£o foi passado como prop
   */
  useEffect(() => {
    const fetchUserEmail = async () => {
      if (emailProp) {
        setEmail(emailProp);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          setEmail(user.email);
          console.log("âœ… Email obtido do Supabase:", user.email);
        } else {
          console.warn("âš ï¸ Nenhum usuÃ¡rio autenticado encontrado");
          setStatus("error");
        }
      } catch (error) {
        console.error("âŒ Erro ao buscar email do Supabase:", error);
        setStatus("error");
      }
    };

    fetchUserEmail();
  }, [emailProp]);

  // Buscar departamentos disponÃ­veis
  const fetchDepartamentos = async () => {
    if (!user?.id_cliente) return;
    
    try {
      setLoadingDepartamentos(true);
      const departamentosData = await departamentosService.listar(user.id_cliente);
      
      // Filtrar departamentos: mostrar apenas os criados pelo usuÃ¡rio
      // Se nÃ£o houver nenhum departamento criado pelo usuÃ¡rio, mostrar apenas "Atendimento"
      const departamentosCriadosPeloUsuario = departamentosData.filter(dep => dep.nome !== 'Atendimento');
      
      let departamentosFiltrados: Departamento[] = [];
      
      if (departamentosCriadosPeloUsuario.length === 0) {
        // Se nÃ£o hÃ¡ departamentos criados pelo usuÃ¡rio, mostrar apenas "Atendimento"
        const atendimento = departamentosData.find(dep => dep.nome === 'Atendimento');
        departamentosFiltrados = atendimento ? [atendimento] : [];
      } else {
        // Se hÃ¡ departamentos criados pelo usuÃ¡rio, mostrar todos (incluindo "Atendimento" se existir)
        departamentosFiltrados = departamentosData;
      }
      
      // Garantir que o departamento associado ao chip sempre apareÃ§a na lista
      // Mesmo que tenha sido filtrado, se estiver associado, deve aparecer
      const departamentosComAssociados = [...departamentosFiltrados];
      
      // Adicionar departamento do chip 1 se nÃ£o estiver na lista
      if (departamentoChip1) {
        const depChip1 = departamentosData.find(dep => dep.id.toString() === departamentoChip1);
        if (depChip1 && !departamentosComAssociados.find(dep => dep.id === depChip1.id)) {
          departamentosComAssociados.push(depChip1);
        }
      }
      
      // Adicionar departamento do chip 2 se nÃ£o estiver na lista
      if (departamentoChip2) {
        const depChip2 = departamentosData.find(dep => dep.id.toString() === departamentoChip2);
        if (depChip2 && !departamentosComAssociados.find(dep => dep.id === depChip2.id)) {
          departamentosComAssociados.push(depChip2);
        }
      }
      
      setDepartamentos(departamentosComAssociados);
    } catch (error) {
      console.error('Erro ao buscar departamentos:', error);
      toast.error('Erro ao carregar departamentos');
    } finally {
      setLoadingDepartamentos(false);
    }
  };

  // Buscar nome do departamento pelo ID
  const fetchDepartamentoNome = async (departamentoId: string) => {
    if (!departamentoId) return null;
    
    try {
      const { data, error } = await supabase
        .from('departamento')
        .select('nome')
        .eq('id', departamentoId)
        .single();
      
      if (error) {
        console.error('Erro ao buscar nome do departamento:', error);
        return null;
      }
      
      return data?.nome || null;
    } catch (error) {
      console.error('Erro ao buscar nome do departamento:', error);
      return null;
    }
  };

  // Verificar se hÃ¡ departamentos disponÃ­veis
  const hasDepartamentos = departamentos.length > 0;

  // Verificar se precisa selecionar departamento para conectar
  const needsDepartamentoSelection = () => {
    // Se nÃ£o hÃ¡ departamentos, precisa criar
    if (!hasDepartamentos) return true;
    
    // Se nÃ£o tem instanceToken (nÃ£o conectado), precisa selecionar pelo menos um departamento
    if (!instanceToken) {
      return !departamentoChip1 && !departamentoChip2;
    }
    
    // Se tem instanceToken mas nÃ£o tem departamento associado, precisa selecionar
    if (instanceToken && !departamentoChip1 && !departamentoChip2) return true;
    
    return false;
  };

  // Verificar se deve mostrar a seÃ§Ã£o de departamentos
  const shouldShowDepartamentoSection = () => {
    // Sempre mostrar se nÃ£o hÃ¡ departamentos
    if (!hasDepartamentos) return true;
    
    // Sempre mostrar se hÃ¡ departamentos (para permitir alteraÃ§Ãµes)
    return hasDepartamentos;
  };

  // FunÃ§Ã£o para selecionar departamento para um chip
  const handleSelectDepartamento = async (chip: 'chip1' | 'chip2', departamentoId: string) => {
    // NÃ£o permitir valores vazios
    if (!departamentoId || departamentoId === '') {
      return;
    }

    try {
      const updateData: any = {};
      
      if (chip === 'chip1') {
        updateData.id_departamento_chip_1 = departamentoId;
        setDepartamentoChip1(departamentoId);
        // Buscar nome do departamento
        const nome = await fetchDepartamentoNome(departamentoId);
        setDepartamentoChip1Nome(nome);
      } else {
        updateData.id_departamento_chip_2 = departamentoId;
        setDepartamentoChip2(departamentoId);
        // Buscar nome do departamento
        const nome = await fetchDepartamentoNome(departamentoId);
        setDepartamentoChip2Nome(nome);
      }

      const { error } = await supabase
        .from('clientes_info')
        .update(updateData)
        .eq('email', email);

      if (error) {
        console.error('Erro ao atualizar departamento do chip:', error);
        toast.error('Erro ao salvar departamento');
      } else {
        toast.success(`Departamento associado ao ${chip === 'chip1' ? 'Chip 1' : 'Chip 2'}`);
      }
    } catch (error) {
      console.error('Erro ao selecionar departamento:', error);
      toast.error('Erro ao selecionar departamento');
    }
  };

  /**
   * ðŸ” Verificar instÃ¢ncia existente ao carregar o componente (igual Ã  Evolution)
   */
  useEffect(() => {
    const checkExistingInstance = async () => {
      if (!email) return;

      try {
        const { data: clientInfo, error: clientInfoError } = await supabase
          .from('clientes_info')
          .select('instance_id, instance_name, sender_number, id_departamento_chip_1, id_departamento_chip_2,atendimento_ia, atendimento_humano, id_chatbot')
          .eq('email', email)
          .single();

        if (!clientInfoError && clientInfo?.instance_id && clientInfo?.instance_name) {
          console.log("âœ… InstÃ¢ncia existente encontrada ao carregar:", {
            instance_id: clientInfo.instance_id,
            instance_name: clientInfo.instance_name,
          });

          const token = clientInfo.instance_id;
          const instanceName = clientInfo.instance_name;
          
          setInstanceToken(token);
          setInstanceNameCreated(instanceName);
          setSenderNumber(clientInfo.sender_number || null);

          // Carregar departamentos dos chips
          setDepartamentoChip1(clientInfo.id_departamento_chip_1 || null);
          setDepartamentoChip2(clientInfo.id_departamento_chip_2 || null);
          
          // Buscar nomes dos departamentos
          if (clientInfo.id_departamento_chip_1) {
            const nome1 = await fetchDepartamentoNome(clientInfo.id_departamento_chip_1);
            setDepartamentoChip1Nome(nome1);
          }
          if (clientInfo.id_departamento_chip_2) {
            const nome2 = await fetchDepartamentoNome(clientInfo.id_departamento_chip_2);
            setDepartamentoChip2Nome(nome2);
          }

          // Carregar configuraÃ§Ãµes de atendimento
          //setAtendimentoHumano(clientInfo.atendimento_humano !== null ? !!clientInfo.atendimento_humano : true);
          //setAtendimentoIA(clientInfo.atendimento_ia !== null ? !!clientInfo.atendimento_ia : false);
          //if (clientInfo.id_chatbot) {
          //  setSelectedChatbotId(clientInfo.id_chatbot);
          //}
          if (clientInfo.atendimento_ia === true) {
            setFirstAttendance("ai");
          } else {
            setFirstAttendance("human");
          }
          
          if (clientInfo.id_chatbot) {
            setSelectedChatbotId(String(clientInfo.id_chatbot));
          }
          
          // Verificar status imediatamente (igual Ã  Evolution)
          // Usar o token diretamente, nÃ£o o estado (que pode ainda nÃ£o estar atualizado)
          try {
            setCheckingStatus(true);
            const statusResp = await getUAZAPIInstanceStatus(token);
            
            const instanceStatus = statusResp?.status;
            const isConnected = 
              instanceStatus === "connected" || 
              statusResp?.connected === true ||
              statusResp?.loggedIn === true;
            
            if (isConnected) {
              setStatus("connected");
              setQrCode(null);
              
              // Atualizar nÃºmero do telefone se disponÃ­vel
              const phoneNumber = (statusResp as any)?.instance?.phone ||
                (statusResp as any)?.instance?.number ||
                (statusResp as any)?.instance?.ownerJid?.split('@')[0] ||
                null;

              if (phoneNumber && email) {
                try {
                  await supabase
                    .from('clientes_info')
                    .update({ sender_number: phoneNumber })
                    .eq('email', email);
                  setSenderNumber(phoneNumber);
                } catch (dbError) {
                  console.error("Erro ao atualizar nÃºmero:", dbError);
                }
              }
            } else {
              // NÃ£o mudar para idle imediatamente - deixar o checkConnectionStatus cuidar disso
              // SÃ³ mudar se realmente estiver desconectado
              const isDisconnected = instanceStatus === "disconnected";
              if (isDisconnected) {
                setStatus("idle");
              } else {
                // Se estÃ¡ em "connecting", manter como estÃ¡ ou setar como "qr" se apropriado
                console.log("â„¹ï¸ Status nÃ£o Ã© connected nem disconnected, mantendo estado atual");
              }
            }
          } catch (statusError) {
            console.error("Erro ao verificar status inicial:", statusError);
            setStatus("idle");
          } finally {
            setCheckingStatus(false);
          }
        } else {
          console.log("â„¹ï¸ Nenhuma instÃ¢ncia existente encontrada");
          setStatus("idle");
        }
      } catch (error) {
        console.error("âŒ Erro ao verificar instÃ¢ncia existente:", error);
        setStatus("idle");
      }
    };

    if (email) {
      checkExistingInstance();
    }
  }, [email, user?.id_cliente]);

  // Carregar departamentos quando os departamentos associados mudarem
  useEffect(() => {
    if (user?.id_cliente) {
      fetchDepartamentos();
    }
  }, [user?.id_cliente, departamentoChip1, departamentoChip2]);

  /**
   * ðŸ”„ FunÃ§Ã£o para verificar status da conexÃ£o (similar Ã  Evolution)
   */
  const checkConnectionStatus = useCallback(async () => {
    if (!instanceToken) return;

    try {
      setCheckingStatus(true);
      const statusResp = await getUAZAPIInstanceStatus(instanceToken);
      
      console.log("ðŸ”„ [checkConnectionStatus] Resposta completa:", statusResp);
      
      const instanceStatus = statusResp?.status || statusResp?.instance?.status;
      const isConnected = 
        instanceStatus === "connected" || 
        statusResp?.connected === true ||
        statusResp?.loggedIn === true ||
        statusResp?.instance?.status === "connected";

      console.log("ðŸ”„ [checkConnectionStatus] instanceStatus:", instanceStatus);
      console.log("ðŸ”„ [checkConnectionStatus] isConnected:", isConnected);

      // Atualizar estado baseado no status real
      if (isConnected) {
        setStatus((prevStatus) => {
          console.log("âœ… [checkConnectionStatus] Status confirmado como conectado. Status anterior:", prevStatus);
          
          // Atualizar nÃºmero do telefone se disponÃ­vel
          const phoneNumber = (statusResp as any)?.instance?.phone ||
            (statusResp as any)?.instance?.number ||
            (statusResp as any)?.instance?.ownerJid?.split('@')[0] ||
            null;
          
          if (phoneNumber && email) {
            supabase
              .from('clientes_info')
              .update({ sender_number: phoneNumber })
              .eq('email', email)
              .then(() => {
                setSenderNumber(phoneNumber);
                console.log("âœ… NÃºmero atualizado:", phoneNumber);
              })
          }
          
          setQrCode(null);
          return "connected";
        });
      } else {
        // SÃ³ mudar para idle se realmente estiver desconectado E o status anterior era connected
        // Se o status Ã© "connecting", nÃ£o mudar para idle
        const isDisconnected = instanceStatus === "disconnected" || statusResp?.connected === false;
        if (isDisconnected) {
          setStatus((prevStatus) => {
            if (prevStatus === "connected") {
              console.log("âš ï¸ [checkConnectionStatus] Status mudou de conectado para desconectado");
              return "idle";
            }
            return prevStatus;
          });
        } else {
          // Se estÃ¡ em "connecting" ou outro estado, nÃ£o alterar se jÃ¡ estava conectado
          console.log("â„¹ï¸ [checkConnectionStatus] Status nÃ£o Ã© conectado nem desconectado, mantendo status anterior");
        }
      }
    } catch (err) {
      console.error("âŒ [checkConnectionStatus] Erro ao verificar status:", err);
      // NÃ£o mudar o status em caso de erro - manter o status anterior
    } finally {
      setCheckingStatus(false);
    }
  }, [instanceToken, email]);

  /**
   * ðŸ”„ Polling contÃ­nuo de status (similar Ã  Evolution)
   * Chama checkConnectionStatus imediatamente ao carregar e depois a cada 30 segundos
   */
  useEffect(() => {
    if (!instanceToken || !email) return;

    // Chamar imediatamente ao carregar
    checkConnectionStatus();
    
    // Configurar intervalo para verificar periodicamente
    const STATUS_CHECK_INTERVAL = 30000; // 30 segundos
    const statusInterval = setInterval(() => {
      checkConnectionStatus();
    }, STATUS_CHECK_INTERVAL);

    return () => clearInterval(statusInterval);
  }, [instanceToken, email, checkConnectionStatus]);

  /**
   * ðŸ“‹ Buscar chatbots disponÃ­veis
   */
  const fetchAvailableChatbots = async () => {
    if (loadingChatbots) return;
    
    setLoadingChatbots(true);
    try {
      const { data: chatbots, error } = await supabase
        .from('prompts_oficial')
        .select('id, nome, em_uso')
        .eq('status', true)
        .eq('id_usuario', user?.id);
      
      if (error) {
        console.error('Erro ao buscar chatbots:', error);
        toast.error('Erro ao buscar chatbots disponÃ­veis');
        return;
      }
      
      if (chatbots && chatbots.length > 0) {
        const mappedChatbots = chatbots.map(chatbot => ({
          id: chatbot.id,
          nome: chatbot.nome || 'Sem nome',
          em_uso: chatbot.em_uso === true || chatbot.em_uso === 'true'
        }));
        
        setAvailableChatbots(mappedChatbots);
        
        const chatbotEmUso = mappedChatbots.find(chatbot => chatbot.em_uso);
        if (chatbotEmUso) {
          setSelectedChatbotId(chatbotEmUso.id);
        }
      } else {
        setAvailableChatbots([]);
      }
    } catch (error) {
      console.error('Erro ao buscar chatbots:', error);
      toast.error('Erro ao carregar lista de chatbots');
    } finally {
      setLoadingChatbots(false);
    }
  };

  /**
   * ðŸ”„ useEffect para buscar chatbots quando atendimento IA estiver ativo
   */
  useEffect(() => {
    if (firstAttendance === "ai" && status === "connected" && user?.id) {
      fetchAvailableChatbots();
    }
  }, [firstAttendance, status, user?.id]);

  /**
   * âœ… Atualizar chatbot como "em uso"
   */
  const updateChatbotAsInUse = async (chatbotId: string | number) => {
    try {
      toast.info('Ativando chatbot...');

      // 1. Desativar todos os chatbots do usuÃ¡rio
      const { error: resetError } = await supabase
        .from('prompts_oficial')
        .update({ em_uso: false })
        .eq('id_usuario', user?.id);
        
      if (resetError) {
        console.error('Erro ao resetar status dos chatbots:', resetError);
        toast.error('Erro ao preparar ativaÃ§Ã£o do chatbot');
        return;
      }
      
      // 2. Ativar apenas o chatbot selecionado
      const { data, error } = await supabase
        .from('prompts_oficial')
        .update({ em_uso: true })
        .eq('id', chatbotId)
        .select('nome');
        
      if (error) {
        console.error('Erro ao ativar chatbot:', error);
        toast.error('Erro ao ativar chatbot');
        return;
      }
      
      // 3. Atualizar as preferÃªncias do cliente
      const { error: clientError } = await supabase
        .from('clientes_info')
        .update({
          id_chatbot: chatbotId,
          atendimento_ia: true,
          atendimento_humano: false
        })
        .eq('email', email);
      
      if (clientError) {
        console.error('Erro ao atualizar preferÃªncias do cliente:', clientError);
        toast.error('Erro ao salvar preferÃªncias');
        return;
      }
      
      // 4. Atualizar estados locais
      setFirstAttendance("ai");
      
      // 5. Mostrar confirmaÃ§Ã£o
      const botName = data?.[0]?.nome || 'Selecionado';
      toast.success(`Chatbot "${botName}" ativado com sucesso`);
      
      // 6. Atualizar lista localmente
      setAvailableChatbots(prev => 
        prev.map(bot => ({
          ...bot,
          em_uso: bot.id === chatbotId
        }))
      );
      
    } catch (err) {
      console.error('Erro inesperado ao ativar chatbot:', err);
      toast.error('Erro ao ativar chatbot');
    }
  };

  /**
   * ðŸŽ¯ Handler para mudanÃ§a de chatbot
   */
  const handleChatbotChange = async (chatbotId: string | number) => {
    const isUUID = typeof chatbotId === 'string' && chatbotId.includes('-');
    const id = isUUID ? chatbotId : (typeof chatbotId === 'string' ? parseInt(chatbotId) : chatbotId);
    
    if ((isUUID && typeof id === 'string') || (!isUUID && !isNaN(id as number) && (id as number) > 0)) {
      setSelectedChatbotId(id);
      await updateChatbotAsInUse(id);
    } else {
      console.error('ID de chatbot invÃ¡lido:', chatbotId);
      toast.error('ID de chatbot invÃ¡lido');
    }
  };

  /**
   * ðŸ‘¤ Handler para mudanÃ§a do primeiro atendimento (humano/IA)
   */
  const handleFirstAttendanceChange = async (value: "human" | "ai") => {
    setFirstAttendance(value);
  
    // Se mudar para humano, limpar chatbot local
    if (value === "human") {
      setSelectedChatbotId(null);
    }
  
    const { error } = await supabase
      .from("clientes_info")
      .update({
        atendimento_humano: value === "human",
        atendimento_ia: value === "ai",
        id_chatbot: value === "human" ? null : selectedChatbotId,
      })
      .eq("email", email);
  
    if (error) {
      toast.error("Erro ao salvar preferÃªncia de atendimento");
    }
  };
  
  // âœ… NÃƒO COLOQUE NENHUM "}" A MAIS AQUI
  // âœ… NÃƒO REDECLARE hasDepartamentos / needsDepartamentoSelection AQUI
  // âœ… Agora vem o seu initInstance (apenas UMA vez)


const initInstance = async () => {
  // Evitar mÃºltiplas execuÃ§Ãµes simultÃ¢neas
  if (creatingRef.current) return;

  if (!email) {
    console.warn("âš ï¸ Email nÃ£o disponÃ­vel ainda");
    return;
  }

  // Bloqueio explÃ­cito por regra de negÃ³cio
  if (needsDepartamentoSelection()) {
    toast.error("Selecione um departamento antes de conectar o WhatsApp");
    return;
  }

  creatingRef.current = true;

  try {
    setStatus("creating");

    /**
     * ðŸ”¹ Verificar se jÃ¡ existe instÃ¢ncia no clientes_info
     */
    let existingToken: string | null = null;
    let existingInstanceName: string | null = null;

    try {
      const { data: clientInfo, error } = await supabase
        .from("clientes_info")
        .select("instance_id, instance_name")
        .eq("email", email)
        .single();

      if (!error && clientInfo?.instance_id && clientInfo?.instance_name) {
        existingToken = clientInfo.instance_id;
        existingInstanceName = clientInfo.instance_name;

        console.log("âœ… InstÃ¢ncia existente encontrada:", {
          instance_id: existingToken,
          instance_name: existingInstanceName,
        });
      }
    } catch (dbError) {
      console.warn(
        "âš ï¸ Erro ao verificar instÃ¢ncia existente (seguindo para criaÃ§Ã£o):",
        dbError
      );
    }

    let token: string;
    let instanceNameFinal: string;

    /**
     * ðŸ” Reutilizar instÃ¢ncia existente
     */
    if (existingToken && existingInstanceName) {
      token = existingToken;
      instanceNameFinal = existingInstanceName;

      setInstanceToken(token);
      setInstanceNameCreated(instanceNameFinal);

      console.log("â™»ï¸ Reutilizando instÃ¢ncia existente");

      try {
        await configureUAZAPIWebhook(token);
        console.log("âœ… Webhook configurado para instÃ¢ncia existente");
      } catch (webhookError) {
        console.error(
          "âŒ Erro ao configurar webhook (instÃ¢ncia existente):",
          webhookError
        );
      }
    } else {
      /**
       * ðŸ†• Criar nova instÃ¢ncia
       */
      console.log("ðŸ†• Criando nova instÃ¢ncia");

      const params: CreateInstanceParams = {
        email,
        id: userIdProp,
        instanceName,
      };

      const instance = await createUAZAPIInstance(params);

      token = instance.token;
      instanceNameFinal = instance.instanceName;

      setInstanceToken(token);
      setInstanceNameCreated(instanceNameFinal);

      try {
        await configureUAZAPIWebhook(token);
        console.log("âœ… Webhook configurado apÃ³s criaÃ§Ã£o da instÃ¢ncia");
      } catch (webhookError) {
        console.error(
          "âŒ Erro ao configurar webhook apÃ³s criaÃ§Ã£o:",
          webhookError
        );
      }

      /**
       * ðŸ”¹ Salvar dados no clientes_info
       */
      try {
        await supabase
          .from("clientes_info")
          .update({
            instance_id: token,
            instance_name: instanceNameFinal,
          })
          .eq("email", email);

        console.log("âœ… InstÃ¢ncia salva no clientes_info");
      } catch (dbError) {
        console.error(
          "âŒ Erro ao salvar dados da instÃ¢ncia no clientes_info:",
          dbError
        );
      }
    }

    /**
     * ðŸ“± Gerar QR Code
     */
    try {
      const connectResp = await connectUAZAPIInstanceAndGetQRCode(token);

      setQrCode(
        connectResp?.qrcode ||
          connectResp?.instance?.qrcode ||
          null
      );

      setStatus("qr");
    } catch (qrError) {
      console.error("âŒ Erro ao gerar QR Code:", qrError);
      setStatus("error");
    }
  } catch (err) {
    console.error("âŒ Erro ao inicializar instÃ¢ncia:", err);
    setStatus("error");
  } finally {
    creatingRef.current = false;
  }
};



  /**
   * ðŸŸ¡ Polling de status real
   * Verifica o status da instÃ¢ncia enquanto estÃ¡ aguardando conexÃ£o
   */
  useEffect(() => {

    if (!instanceToken) return;
    if (status !== "qr" && status !== "creating") return;

    const interval = setInterval(async () => {

      try {

        const statusResp = await getUAZAPIInstanceStatus(instanceToken);

        console.log("[STATUS UAZAPI] Resposta completa:", statusResp);
        console.log("[STATUS UAZAPI] Status value:", statusResp?.status);
        console.log("[STATUS UAZAPI] Connected value:", statusResp?.connected);

        // Verificar se estÃ¡ conectado - verificar mÃºltiplos campos possÃ­veis
        const instanceStatus = statusResp?.status;
        const isConnected = 
          instanceStatus === "connected" || 
          statusResp?.connected === true || 
          statusResp?.loggedIn === true ||
          statusResp?.instance?.status === "connected";

        if (isConnected) {
          console.log("âœ… InstÃ¢ncia conectada! Status:", instanceStatus);
          
          /**
           * âœ… Conectado â†’ configurar webhook e atualizar dados
           */
          try {
            await configureUAZAPIWebhook(instanceToken);
            console.log("âœ… Webhook configurado com sucesso");
          } catch (webhookError) {
            console.error("âŒ Erro ao configurar webhook (nÃ£o crÃ­tico):", webhookError);
          }
          
          type UazapiStatusResp = {
            status?: string;
            connected?: boolean;
            loggedIn?: boolean;
            instance?: {
              phone?: string | number | null;
              number?: string | number | null;
              ownerJid?: string | null;
              status?: string;
              qrcode?: string | null;
            };
          };
          
          const statusResp = (await getUAZAPIInstanceStatus(instanceToken)) as UazapiStatusResp;
          
          // Tentar obter o nÃºmero do telefone se disponÃ­vel na resposta
          const phoneNumberRaw =
            statusResp?.instance?.phone ??
            statusResp?.instance?.number ??
            statusResp?.instance?.ownerJid?.split("@")?.[0] ??
            null;

          // Normalizar para string (evita number quebrar split/concat)
          const phoneNumber = phoneNumberRaw != null ? String(phoneNumberRaw) : null;

          if (phoneNumber && email) {
          try {
            await supabase
              .from("clientes_info")
              .update({ sender_number: phoneNumber })
              .eq("email", email);

            setSenderNumber(phoneNumber);
            console.log("âœ… NÃºmero do telefone atualizado:", phoneNumber);
          } catch (dbError) {
            console.error("âŒ Erro ao atualizar nÃºmero do telefone:", dbError);
          }
        }

          setStatus("connected");
          setQrCode(null);
          clearInterval(interval);
          // Chamar checkConnectionStatus para garantir que tudo estÃ¡ atualizado
          setTimeout(() => checkConnectionStatus(), 1000);
          return;
        }

        // Se ainda estÃ¡ em "connecting", continuar verificando
        if (instanceStatus === "connecting") {
          console.log("â³ Ainda conectando... aguardando...");
        }
        
        // Se o status mudou para "disconnected", pode ser um problema
        if (instanceStatus === "disconnected") {
          console.warn("âš ï¸ InstÃ¢ncia desconectada durante o processo");
        }

      } catch (err) {
        console.error("Erro ao verificar status:", err);
        // NÃ£o parar o polling em caso de erro temporÃ¡rio
      }

    }, 5000); // Verificar a cada 5 segundos

    return () => clearInterval(interval);

  }, [instanceToken, status]);


  // Removido: conexÃ£o automÃ¡tica - agora sÃ³ conecta via botÃ£o



  return (
    <>
      <Card>
      <CardHeader className="pb-3">
        <CardTitle>Conectar WhatsApp</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
      {status === "connected" ? (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-center space-x-3">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <div>
            <p className="text-green-700 font-medium">WhatsApp conectado</p>
            <p className="text-green-600 text-sm">{senderNumber ? `NÃºmero: ${senderNumber}` : 'NÃºmero conectado'}</p>
          </div>
          {/* BotÃ£o de reconectar - oculto para Gestor */}
          {!isGestor && (
            <div className="ml-auto">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={async () => {
                  if (!instanceToken) return;
                  try {
                    setStatus("creating");
                    const connectResp = await connectUAZAPIInstanceAndGetQRCode(instanceToken);
                    setQrCode(
                      connectResp?.qrcode ||
                      connectResp?.instance?.qrcode ||
                      null
                    );
                    setStatus("qr");
                  } catch (err) {
                    console.error("Erro ao gerar novo QR Code:", err);
                    setStatus("error");
                  }
                }}
                className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
              >
                Reconectar
              </Button>
            </div>
          )}
        </div>
      ) : status === "qr" || status === "creating" ? (
        <>
          {status === "creating" && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 flex items-center">
              <div className="flex-1">
                <p className="text-blue-700 font-medium">Conectando WhatsApp</p>
                <p className="text-blue-600 text-sm">Escaneie o QR Code abaixo com seu celular</p>
              </div>
              <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
            </div>
          )}
          {/* QR Code */}
          {qrCode && status === "qr" && (
            <div className="flex justify-center py-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <img
                  src={qrCode}
                  alt="QR Code UAZAPI"
                  className="w-[280px] h-[280px]"
                />
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-amber-500 mr-3" />
          <div className="flex-1">
            <p className="text-amber-700 font-medium">WhatsApp desconectado</p>
            <p className="text-amber-600 text-sm">Conecte seu WhatsApp para comeÃ§ar</p>
          </div>
        </div>
      )}

      {/* SeÃ§Ã£o de seleÃ§Ã£o de departamentos - Chip 1 */}
      {shouldShowDepartamentoSection() && !isGestor && (
        <div className="pt-4 space-y-3">
          {!hasDepartamentos ? (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-red-600" />
                <p className="text-red-700 font-medium text-sm">Nenhum Departamento Encontrado</p>
              </div>
              <p className="text-red-600 text-xs mb-3">
                Ã‰ necessÃ¡rio criar pelo menos um departamento antes de conectar o WhatsApp.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open('/departamentos', '_blank')}
                className="w-full"
              >
                Criar Departamento
              </Button>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                <p className="text-blue-700 font-medium text-sm">Chip 1</p>
                {departamentoChip1 && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    âœ“ Departamento Ativo
                  </span>
                )}
              </div>
              <p className="text-blue-600 text-xs mb-3">
                {departamentoChip1 
                  ? `Departamento associado ao Chip 1: ${departamentoChip1Nome || `Departamento ${departamentoChip1}`}`
                  : 'Selecione um departamento para associar ao Chip 1'
                }
              </p>
              <Select
                value={departamentoChip1 || ""}
                onValueChange={(value) => {
                  if (value === "create") {
                    window.open('/departamentos', '_blank');
                  } else {
                    handleSelectDepartamento('chip1', value);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {departamentoChip1 
                      ? departamentoChip1Nome || `Departamento ${departamentoChip1}`
                      : "Selecione um departamento"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {departamentos.map((departamento) => (
                    <SelectItem 
                      key={departamento.id} 
                      value={departamento.id.toString()}
                      disabled={departamentoChip2 === departamento.id.toString()}
                    >
                      {departamento.nome}
                      {departamentoChip2 === departamento.id.toString() && " (Em uso no Chip 2)"}
                    </SelectItem>
                  ))}
                  <SelectItem value="create" className="text-blue-600 font-medium">
                    + Criar novo departamento
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* Dropdown para seleÃ§Ã£o do primeiro atendimento */}
      {status === "connected" && (
        <div className="pt-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Selecionar primeiro atendimento
          </label>
          <Select
            //value={atendimentoHumano ? "human" : "ai"}
            //onValueChange={handleFirstAttendanceChange}
            value={firstAttendance}
            onValueChange={handleFirstAttendanceChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione o tipo de primeiro atendimento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="human">Atendimento humano</SelectItem>
              {/* <SelectItem value="ai">Atendimento por IA</SelectItem> */}
            </SelectContent>
          </Select>
        </div>
      )}
      
      {/* Seletor de chatbot (aparece somente quando atendimento por IA estÃ¡ ativado) */}
      {status === "connected" && firstAttendance === "ai" && (
        <div className="pt-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Selecionar chatbot para atendimento
          </label>
          
          {loadingChatbots ? (
            <div className="flex items-center space-x-2 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Carregando chatbots...</span>
            </div>
          ) : availableChatbots.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-2 text-sm">
              <p className="text-amber-700">Nenhum chatbot ativo disponÃ­vel.</p>
              <p className="text-amber-600">Ative algum chatbot na seÃ§Ã£o de Chatbots.</p>
            </div>
          ) : (
            <>
              <Select
                value={selectedChatbotId ? String(selectedChatbotId) : undefined}
                onValueChange={handleChatbotChange}
              >
                <SelectTrigger className="w-full hover:border-green-500 focus:ring-green-500">
                  <SelectValue placeholder="Selecione um chatbot" />
                </SelectTrigger>
                <SelectContent>
                  {availableChatbots.map((chatbot) => (
                    <SelectItem 
                      key={String(chatbot.id)} 
                      value={String(chatbot.id)}
                      className={chatbot.em_uso ? "font-bold text-green-600" : ""}
                    >
                      {chatbot.nome} {chatbot.em_uso && " âœ“"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableChatbots.length === 1 && (
                <div className="text-xs text-gray-500 mt-1">Apenas um chatbot disponÃ­vel para seleÃ§Ã£o.</div>
              )}
            </>
          )}
        </div>
      )}

      {/* BotÃµes de aÃ§Ã£o */}
      <div className="pt-4 flex justify-between">
        {/* BotÃµes de conexÃ£o WhatsApp - visÃ­veis apenas para Admin */}
        {!isGestor && ((status !== "connected" && !qrCode) || needsDepartamentoSelection()) && (
          <Button
            variant="default"
            onClick={initInstance}
            disabled={status === "creating" || !email || needsDepartamentoSelection()}
            className="w-full"
          >
            {status === "creating" ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Carregando...
              </>
            ) : needsDepartamentoSelection() ? (
              <>
                <Building2 className="h-4 w-4 mr-2" />
                {status === "connected" ? 'Selecione Departamento para Continuar' : 'Selecione um Departamento'}
              </>
            ) : (
              <>
                <Smartphone className="h-4 w-4 mr-2" />
                Conectar WhatsApp
              </>
            )}
          </Button>
        )}
        
        {!isGestor && status !== "connected" && qrCode && (
          <Button 
            variant="outline" 
            onClick={async () => {
              if (!instanceToken) return;
              try {
                setStatus("creating");
                const connectResp = await connectUAZAPIInstanceAndGetQRCode(instanceToken);
                setQrCode(
                  connectResp?.qrcode ||
                  connectResp?.instance?.qrcode ||
                  null
                );
                setStatus("qr");
              } catch (err) {
                console.error("Erro ao atualizar QR Code:", err);
                setStatus("error");
              }
            }}
            disabled={status === "creating"} 
            className="w-full"
          >
            {status === "creating" ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Carregando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Novo QR Code
              </>
            )}
          </Button>
        )}
      </div>
        </div>
      </CardContent>
    </Card>
    </>
  );
}
```

## 3) src/services/messageService.ts (funcao sendMessage e funcoes relacionadas ao envio WhatsApp)
Caminho completo: C:\Users\eg711\OneDrive\Área de Trabalho\smart-crm-meta\smart-crm-meta-vercel2\src\services\messageService.ts
```ts
import { API_BASE_URL } from '@/config';
import { supabase } from '@/lib/supabase';

interface SendMessageParams {
  number: string;
  text: string;
  idCliente?: number; // ID do cliente para busca do lead
  telefone?: string; // Telefone do lead para busca
}

// FunÃ§Ã£o para limpar o telefone removendo @s.whatsapp.net e mantendo apenas nÃºmeros
function limparTelefone(telefone: string): string {
  // Remover @s.whatsapp.net se existir
  let telefoneLimpo = telefone.replace('@s.whatsapp.net', '');
  
  // Manter apenas nÃºmeros
  telefoneLimpo = telefoneLimpo.replace(/\D/g, '');
  
  return telefoneLimpo;
}

// Retorna 'admin' se o usuÃ¡rio Ã© admin (clientes_info), senÃ£o o nome do atendente (atendentes)
export async function getNomeAtendente(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return null;

    const { data: adminData } = await supabase
      .from('clientes_info')
      .select('id')
      .eq('email', user.email)
      .maybeSingle();

    if (adminData) return 'admin';

    const { data: atendenteData } = await supabase
      .from('atendentes')
      .select('nome')
      .eq('email', user.email)
      .maybeSingle();

    return atendenteData?.nome ?? null;
  } catch {
    return null;
  }
}

// Atualiza nome_atendente na Ãºltima mensagem enviada (tipo=true) para o telefone/instÃ¢ncias do cliente
async function updateNomeAtendenteParaUltimaMensagem(telefone: string, nomeAtendente: string | null): Promise<void> {
  if (!nomeAtendente) return;
  try {
    const idCliente = await getIdClienteLogado();
    if (!idCliente) return;

    const { data: cliente } = await supabase
      .from('clientes_info')
      .select('instance_id, instance_id_2')
      .eq('id', idCliente)
      .single();
    if (!cliente?.instance_id && !cliente?.instance_id_2) return;

    const instanceIds = [cliente.instance_id, cliente.instance_id_2].filter(Boolean) as string[];
    const telefoneLimpo = limparTelefone(telefone);
    const telefoneComSufixo = `${telefoneLimpo}@s.whatsapp.net`;
    const doisMinAtras = new Date(Date.now() - 2 * 60 * 1000).toISOString();

    const { data: rows } = await supabase
      .from('agente_conversacional_whatsapp')
      .select('id')
      .in('instance_id', instanceIds)
      .eq('tipo', true)
      .or(`telefone_id.eq.${telefoneLimpo},telefone_id.eq.${telefoneComSufixo}`)
      .gte('created_at', doisMinAtras)
      .order('created_at', { ascending: false })
      .limit(1);

    const id = rows?.[0]?.id;
    if (!id) return;

    await supabase
      .from('agente_conversacional_whatsapp')
      .update({ nome_atendente: nomeAtendente })
      .eq('id', id);
  } catch {
    // silenciar; nÃ£o falhar o envio
  }
}

// FunÃ§Ã£o para obter o id_cliente do usuÃ¡rio logado
async function getIdClienteLogado(): Promise<number | null> {
  try {
    // Obter o usuÃ¡rio atual para buscar informaÃ§Ãµes do cliente
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('UsuÃ¡rio nÃ£o autenticado');
    }

    // Primeiro, verificar se o usuÃ¡rio Ã© um atendente/gestor
    const { data: atendenteData, error: atendenteError } = await supabase
      .from('atendentes')
      .select('id_cliente')
      .eq('email', user.email)
      .single();

    if (atendenteData) {
      return atendenteData.id_cliente;
    }

    // UsuÃ¡rio Ã© cliente, buscar diretamente na tabela clientes_info
    const { data: clientesInfo, error: clientError } = await supabase
      .from('clientes_info')
      .select('id')
      .eq('email', user.email)
      .order('id', { ascending: true })
      .limit(1);
    
    if (clientError || !clientesInfo || clientesInfo.length === 0) {
      return null;
    }
    
    return clientesInfo[0].id;

  } catch (error) {
    return null;
  }
}

// FunÃ§Ã£o para buscar dicionÃ¡rio departamento â†’ instÃ¢ncia (FILTRADO POR CLIENTE)
async function getDepartamentoInstanciaMap(idCliente: number): Promise<Record<number, string>> {
  try {
    const { data: departamentos, error } = await supabase
      .from('departamento')
      .select('id, instance_name_chip_associado')
      .eq('id_cliente', idCliente)
      .not('instance_name_chip_associado', 'is', null);

    if (error) {
      return {};
    }

    const map: Record<number, string> = {};
    departamentos?.forEach(dept => {
      if (dept.instance_name_chip_associado) {
        map[dept.id] = dept.instance_name_chip_associado;
      }
    });

    return map;

  } catch (error) {
    return {};
  }
}

// FunÃ§Ã£o para obter a primeira instÃ¢ncia disponÃ­vel (fallback)
async function getPrimeiraInstancia(): Promise<string | null> {
  try {
    // Obter o usuÃ¡rio atual para buscar informaÃ§Ãµes do cliente
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('UsuÃ¡rio nÃ£o autenticado');
    }

    // Primeiro, verificar se o usuÃ¡rio Ã© um atendente/gestor
    const { data: atendenteData, error: atendenteError } = await supabase
      .from('atendentes')
      .select('id_cliente')
      .eq('email', user.email)
      .single();

    if (atendenteData) {
      // UsuÃ¡rio Ã© atendente/gestor, buscar informaÃ§Ãµes do cliente
      const { data: clientInfo, error: clientError } = await supabase
        .from('clientes_info')
        .select('instance_name')
        .eq('id', atendenteData.id_cliente)
        .single();
        
      if (clientError || !clientInfo?.instance_name) {
        return null;
      }
      
      return clientInfo.instance_name;
    }

    // UsuÃ¡rio Ã© cliente, buscar diretamente na tabela clientes_info
    const { data: clientesInfo, error: clientError } = await supabase
      .from('clientes_info')
      .select('instance_name')
      .eq('email', user.email)
      .order('id', { ascending: true })
      .limit(1);
    
    if (clientError || !clientesInfo || clientesInfo.length === 0) {
      return null;
    }
    
    return clientesInfo[0].instance_name;

  } catch (error) {
    return null;
  }
}

// FunÃ§Ã£o auxiliar para validar se uma instÃ¢ncia pertence a um cliente
async function validateInstanceBelongsToClient(instanceName: string, idCliente: number): Promise<boolean> {
  try {
    const { data: clientInfo, error } = await supabase
      .from('clientes_info')
      .select('instance_name, instance_name_2')
      .eq('id', idCliente)
      .single();

    if (error || !clientInfo) {
      return false;
    }

    // Verificar se a instÃ¢ncia Ã© o chip 1 ou chip 2 do cliente
    return clientInfo.instance_name === instanceName || clientInfo.instance_name_2 === instanceName;
  } catch (error) {
    return false;
  }
}

// FunÃ§Ã£o para obter o chip correto baseado no departamento do lead (LÃ“GICA DINÃ‚MICA)
async function getChipByDepartment(idCliente: number, telefone: string): Promise<string | null> {
  try {
    // ETAPA 1: Buscar informaÃ§Ãµes do lead usando id_cliente + telefone
    const { data: leadData, error: leadError } = await supabase
      .from('leads')
      .select('id_departamento')
      .eq('telefone', telefone)
      .eq('id_cliente', idCliente)
      .single();

    if (leadError || !leadData) {
      return await getPrimeiraInstancia();
    }

    // Se o lead nÃ£o tem departamento, usar primeira instÃ¢ncia
    if (!leadData.id_departamento) {
      return await getPrimeiraInstancia();
    }

    // ETAPA 2: Buscar dicionÃ¡rio departamento â†’ instÃ¢ncia (FILTRADO POR CLIENTE)
    const departamentoInstanciaMap = await getDepartamentoInstanciaMap(idCliente);

    // ETAPA 3: Decidir qual instÃ¢ncia usar e VALIDAR que ela pertence ao cliente
    if (departamentoInstanciaMap[leadData.id_departamento]) {
      const instanceName = departamentoInstanciaMap[leadData.id_departamento];
      
      // VALIDAÃ‡ÃƒO CRÃTICA: Verificar se a instÃ¢ncia realmente pertence ao cliente
      const isValid = await validateInstanceBelongsToClient(instanceName, idCliente);
      
      if (isValid) {
        return instanceName;
      } else {
        // Se a instÃ¢ncia nÃ£o pertence ao cliente, logar erro e usar fallback
        console.warn(`âš ï¸ InstÃ¢ncia "${instanceName}" do departamento ${leadData.id_departamento} nÃ£o pertence ao cliente ${idCliente}. Usando instÃ¢ncia padrÃ£o.`);
        return await getPrimeiraInstancia();
      }
    } else {
      return await getPrimeiraInstancia();
    }

  } catch (error) {
    return await getPrimeiraInstancia();
  }
}

// FunÃ§Ã£o para obter o chip padrÃ£o do cliente (DESABILITADA RELAÃ‡ÃƒO COM DEPARTAMENTOS)
async function getChipPadraoCliente(): Promise<string | null> {
  try {
    // Obter o usuÃ¡rio atual para buscar informaÃ§Ãµes do cliente
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('UsuÃ¡rio nÃ£o autenticado');
    }
    
    
    // Primeiro, verificar se o usuÃ¡rio Ã© um atendente/gestor
    const { data: atendenteData, error: atendenteError } = await supabase
      .from('atendentes')
      .select('id_cliente')
      .eq('email', user.email)
      .single();

    if (atendenteData) {
      // UsuÃ¡rio Ã© atendente/gestor, buscar informaÃ§Ãµes do cliente
      
      const { data: clientInfo, error: clientError } = await supabase
        .from('clientes_info')
        .select('instance_name')
        .eq('id', atendenteData.id_cliente)
        .single();
        
      if (clientError || !clientInfo?.instance_name) {
        throw new Error('InstÃ¢ncia do WhatsApp nÃ£o encontrada para o cliente associado');
      }
      
      return clientInfo.instance_name;
    }

    // UsuÃ¡rio Ã© cliente, buscar diretamente na tabela clientes_info
    
    // Buscar todos os registros com este email e pegar o mais antigo (ID menor)
    const { data: clientesInfo, error: clientError } = await supabase
      .from('clientes_info')
      .select('instance_name')
      .eq('email', user.email)
      .order('id', { ascending: true })
      .limit(1);
    
    if (clientError) {
      throw new Error('Erro ao buscar informaÃ§Ãµes do cliente');
    }
    
    if (!clientesInfo || clientesInfo.length === 0) {
      throw new Error('Cliente nÃ£o encontrado');
    }
    
    const clientInfo = clientesInfo[0];
    
    if (!clientInfo?.instance_name) {
      throw new Error('Chip padrÃ£o nÃ£o configurado para este cliente');
    }
    
    return clientInfo.instance_name;
  } catch (error) {
    throw new Error('Chip padrÃ£o nÃ£o configurado para este cliente');
  }
}

// FunÃ§Ã£o auxiliar para buscar informaÃ§Ãµes da instÃ¢ncia WhatsApp baseada no nome da instÃ¢ncia
async function getWhatsAppInstanceInfoByInstanceName(userEmail: string, instanceName: string) {
  // Primeiro, verificar se o usuÃ¡rio Ã© um atendente/gestor
  const { data: atendenteData, error: atendenteError } = await supabase
    .from('atendentes')
    .select('id_cliente')
    .eq('email', userEmail)
    .single();

  if (atendenteData) {
    // UsuÃ¡rio Ã© atendente/gestor, buscar informaÃ§Ãµes do cliente
    
    const { data: clientInfo, error: clientError } = await supabase
      .from('clientes_info')
      .select('instance_name, instance_name_2, apikey')
      .eq('id', atendenteData.id_cliente)
      .single();
      
    if (clientError || !clientInfo) {
      throw new Error('InstÃ¢ncia do WhatsApp nÃ£o encontrada para o cliente associado');
    }
    
    // Verificar se a instÃ¢ncia solicitada Ã© o chip 1 ou chip 2
    if (clientInfo.instance_name === instanceName) {
      return {
        instance_name: clientInfo.instance_name,
        apikey: clientInfo.apikey
      };
    } else if (clientInfo.instance_name_2 === instanceName) {
      // Para chip 2, precisamos buscar a apikey especÃ­fica ou usar a mesma
      return {
        instance_name: clientInfo.instance_name_2,
        apikey: clientInfo.apikey // Assumindo que ambos os chips usam a mesma apikey
      };
    } else {
      throw new Error(`InstÃ¢ncia ${instanceName} nÃ£o encontrada para este cliente`);
    }
  }

  // UsuÃ¡rio Ã© cliente, buscar diretamente na tabela clientes_info
  
  const { data: clientesInfo, error: clientError } = await supabase
    .from('clientes_info')
    .select('instance_name, instance_name_2, apikey')
    .eq('email', userEmail)
    .order('id', { ascending: true })
    .limit(1);
  
  if (clientError || !clientesInfo || clientesInfo.length === 0) {
    throw new Error('Erro ao buscar informaÃ§Ãµes do cliente');
  }
  
  const clientInfo = clientesInfo[0];
  
  // Verificar se a instÃ¢ncia solicitada Ã© o chip 1 ou chip 2
  if (clientInfo.instance_name === instanceName) {
    return {
      instance_name: clientInfo.instance_name,
      apikey: clientInfo.apikey
    };
  } else if (clientInfo.instance_name_2 === instanceName) {
    return {
      instance_name: clientInfo.instance_name_2,
      apikey: clientInfo.apikey
    };
  } else {
    throw new Error(`InstÃ¢ncia ${instanceName} nÃ£o encontrada para este cliente`);
  }
}

// FunÃ§Ã£o auxiliar para buscar informaÃ§Ãµes da instÃ¢ncia WhatsApp
async function getWhatsAppInstanceInfo(userEmail: string) {
  // Primeiro, verificar se o usuÃ¡rio Ã© um atendente/gestor
  const { data: atendenteData, error: atendenteError } = await supabase
    .from('atendentes')
    .select('id_cliente')
    .eq('email', userEmail)
    .single();

  if (atendenteData) {
    // UsuÃ¡rio Ã© atendente/gestor, buscar informaÃ§Ãµes do cliente
    
    const { data: clientInfo, error: clientError } = await supabase
      .from('clientes_info')
      .select('instance_name, apikey')
      .eq('id', atendenteData.id_cliente)
      .single();
      
    if (clientError || !clientInfo?.instance_name) {
      console.error(`âŒ [${userEmail}] Erro ao buscar instÃ¢ncia do cliente:`, clientError);
      throw new Error('InstÃ¢ncia do WhatsApp nÃ£o encontrada para o cliente associado');
    }
    
    return clientInfo;
  }

  // UsuÃ¡rio Ã© cliente, buscar diretamente na tabela clientes_info
  
  const { data: clientInfo, error: clientError } = await supabase
    .from('clientes_info')
    .select('instance_name, apikey')
    .eq('email', userEmail)
    .single();
    
  if (clientError || !clientInfo?.instance_name) {
    throw new Error('InstÃ¢ncia do WhatsApp nÃ£o encontrada para este usuÃ¡rio');
  }
  
  return clientInfo;
}

// FunÃ§Ã£o de conveniÃªncia para enviar mensagem para um lead especÃ­fico
export async function sendMessageToLead(leadId: number, text: string) {
  try {
    // Buscar informaÃ§Ãµes do lead para obter o telefone
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('UsuÃ¡rio nÃ£o autenticado');

    // Buscar informaÃ§Ãµes do lead
    const { data: leadData, error: leadError } = await supabase
      .from('leads')
      .select('telefone, id_cliente')
      .eq('id', leadId)
      .single();

    if (leadError || !leadData) {
      throw new Error('Lead nÃ£o encontrado');
    }

    if (!leadData.telefone) {
      throw new Error('Lead nÃ£o possui telefone cadastrado');
    }

    // Limpar o telefone antes de enviar
    const telefoneLimpo = limparTelefone(leadData.telefone);
    
    // Enviar mensagem usando a funÃ§Ã£o principal, passando idCliente e telefone limpo para busca
    return await sendMessage(leadData.telefone, text, leadData.id_cliente, telefoneLimpo);
  } catch (error) {
    throw error;
  }
}

export async function sendMessage(number: string, text: string, idCliente?: number, telefone?: string) {
  // Obter o usuÃ¡rio atual
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('UsuÃ¡rio nÃ£o autenticado');
  }
  
  // Buscar id_cliente automaticamente se nÃ£o fornecido
  let clienteId = idCliente;
  if (!clienteId) {
    clienteId = await getIdClienteLogado();
  }
  
  // Usar o number como telefone se telefone nÃ£o for fornecido
  let telefoneParaBusca = telefone || number;
  
  // Limpar o telefone para busca
  let telefoneLimpo = limparTelefone(telefoneParaBusca);
  
  let instanceName: string | null;
  
  if (clienteId && telefoneLimpo) {
    // Usar lÃ³gica dinÃ¢mica baseada no departamento
    instanceName = await getChipByDepartment(clienteId, telefoneLimpo);
  } else {
    // Usar primeira instÃ¢ncia como fallback
    instanceName = await getPrimeiraInstancia();
  }
  
  // Validar se instanceName Ã© vÃ¡lido
  if (!instanceName) {
    throw new Error('Nome da instÃ¢ncia nÃ£o encontrado');
  }
  
  // Buscar informaÃ§Ãµes da instÃ¢ncia WhatsApp
  const clientInfo = await getWhatsAppInstanceInfoByInstanceName(user.email, instanceName);
  
  // Preparar dados da requisiÃ§Ã£o Evolution
  const apiUrl = `${API_BASE_URL}/message/sendText/${instanceName}`;
  const requestHeaders = {
    'Content-Type': 'application/json',
    'apikey': clientInfo.apikey || 'MI8J85niN3Ir70htmScnxGpGKl2jZgwa'
  };
  const requestBody = {
    number,
    text
  };
  
  // Tentar enviar para Evolution API
  const evolutionPromise = fetch(apiUrl, {
    method: 'POST',
    headers: requestHeaders,
    body: JSON.stringify(requestBody)
  }).then(async (response) => {
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (parseError) {
        errorData = { message: 'Erro desconhecido' };
      }
      throw new Error(`Erro ao enviar mensagem Evolution: ${response.status} - ${JSON.stringify(errorData)}`);
    }
    return response.json();
  });

  // Tentar enviar para UAZAPI em paralelo
  const uazapiPromise = (async () => {
    try {
      const { sendUAZAPITextMessage } = await import('./uazapiService');
      return await sendUAZAPITextMessage({
        number,
        text
      }, user.email!);
    } catch (error) {
      throw new Error(`Erro ao enviar mensagem UAZAPI: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  })();

  // Executar ambas em paralelo e aguardar resultados
  const results = await Promise.allSettled([evolutionPromise, uazapiPromise]);
  
  const evolutionResult = results[0];
  const uazapiResult = results[1];
  
  // Se pelo menos uma funcionou, registrar nome_atendente e retornar
  if (evolutionResult.status === 'fulfilled') {
    console.log('âœ… Mensagem enviada com sucesso pela Evolution API');
    getNomeAtendente().then((nome) => {
      setTimeout(() => updateNomeAtendenteParaUltimaMensagem(number, nome), 1500);
    }).catch(() => {});
    return evolutionResult.value;
  }

  if (uazapiResult.status === 'fulfilled') {
    console.log('âœ… Mensagem enviada com sucesso pela UAZAPI');
    getNomeAtendente().then((nome) => {
      setTimeout(() => updateNomeAtendenteParaUltimaMensagem(number, nome), 1500);
    }).catch(() => {});
    return uazapiResult.value;
  }

  // Se ambas falharam, lanÃ§ar erro combinado
  const evolutionError = evolutionResult.status === 'rejected' ? evolutionResult.reason : null;
  const uazapiError = uazapiResult.status === 'rejected' ? uazapiResult.reason : null;

  const errorMessages = [];
  if (evolutionError) {
    errorMessages.push(`Evolution: ${evolutionError.message || evolutionError}`);
  }
  if (uazapiError) {
    errorMessages.push(`UAZAPI: ${uazapiError.message || uazapiError}`);
  }

  throw new Error(`Erro ao enviar mensagem (ambas APIs falharam): ${errorMessages.join(' | ')}`);
}

export async function sendAudioMessage(number: string, audioUrl: string, caption: string = '') {
  // ID Ãºnico para rastrear esta requisiÃ§Ã£o
  const requestId = `AUDIO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // ðŸŽ¯ SEMPRE USAR MP3 PARA COMPATIBILIDADE MÃXIMA
    const fileName = `audio_${Date.now()}.mp3`;
    const mimetype = 'audio/mpeg';
    const formatInfo = { nome: 'MP3 (Universal)', whatsappCompatible: true };
    
    // Log detalhado para debug
    console.log(`ðŸŽµ [${requestId}] ConfiguraÃ§Ã£o de Ã¡udio (EXCLUSIVAMENTE para novo endpoint):`, {
      audioUrl,
      fileName,
      mimetype,
      formatInfo: formatInfo.nome
    });
    
    // Obter o usuÃ¡rio atual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error(`âŒ [${requestId}] UsuÃ¡rio nÃ£o autenticado`);
      throw new Error('UsuÃ¡rio nÃ£o autenticado');
    }
    
    // Obter o chip padrÃ£o do cliente (relaÃ§Ã£o com departamentos desabilitada)
    console.log(`ðŸ” [${requestId}] Buscando chip padrÃ£o do cliente...`);
    const instanceName = await getChipPadraoCliente();
    console.log(`ðŸ“± [${requestId}] Chip padrÃ£o:`, instanceName);
    
    // Buscar informaÃ§Ãµes da instÃ¢ncia WhatsApp
    console.log(`ðŸ” [${requestId}] Buscando informaÃ§Ãµes da instÃ¢ncia...`);
    const clientInfo = await getWhatsAppInstanceInfo(user.email);
    
    // Payload otimizado para WhatsApp - SEMPRE MP3
    const requestBody = {
      number,
      mediatype: 'audio',
      media: audioUrl,
      caption: caption || '',
      fileName: fileName,
      mimetype: mimetype,
      ptt: true  // Push To Talk - mensagem de voz
    };
    
    // Log do payload para debug
    console.log(`ðŸ“¤ [${requestId}] Payload para novo endpoint de Ã¡udio:`, {
      number,
      mediatype: requestBody.mediatype,
      media: audioUrl,
      fileName: requestBody.fileName,
      mimetype: requestBody.mimetype,
      ptt: requestBody.ptt,
      instanceName,
      user_id: user.id
    });

    // ðŸŽ¯ ENVIAR EXCLUSIVAMENTE PARA O NOVO ENDPOINT DE ÃUDIO
    const audioWebhookUrl = 'https://webhook.dev.usesmartcrm.com/webhook/audio-teste';
    
    // Payload para o novo endpoint (mesmo payload + informaÃ§Ãµes adicionais)
    const webhookPayload = {
      ...requestBody,
      instanceName,        // Nome da instÃ¢ncia
      apikey: clientInfo.apikey || 'MI8J85niN3Ir70htmScnxGpGKl2jZgwa', // Chave da API
      user_id: user.id     // ID do usuÃ¡rio
    };
    
    console.log(`ðŸ“¤ [${requestId}] Payload para novo endpoint de Ã¡udio:`, webhookPayload);
    
    // Enviar EXCLUSIVAMENTE para o novo endpoint de Ã¡udio (nÃ£o mais para Evolution API)
    try {
      const webhookResponse = await fetch(audioWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(webhookPayload)
      });
      
      if (webhookResponse.ok) {
        const webhookData = await webhookResponse.json();
        console.log(`âœ… [${requestId}] Resposta do novo endpoint de Ã¡udio:`, webhookData);
        getNomeAtendente().then((nome) => {
          setTimeout(() => updateNomeAtendenteParaUltimaMensagem(number, nome), 1500);
        }).catch(() => {});
        return webhookData;
      } else {
        console.error(`âŒ [${requestId}] Erro no novo endpoint de Ã¡udio: ${webhookResponse.status}`);
      
      let errorData;
      try {
          errorData = await webhookResponse.json();
        console.error(`ðŸ“„ [${requestId}] Detalhes do erro:`, errorData);
      } catch (parseError) {
        errorData = { message: 'Erro desconhecido' };
      }
      
        throw new Error(`Erro ao enviar Ã¡udio ${formatInfo.nome}: ${webhookResponse.status} - ${JSON.stringify(errorData)}`);
      }
    } catch (webhookError) {
      console.error(`ðŸ’¥ [${requestId}] ERRO ao enviar para novo endpoint de Ã¡udio:`, webhookError);
      throw new Error(`Falha ao enviar Ã¡udio para o novo endpoint: ${webhookError.message}`);
    }
    
  } catch (error) {
    console.error(`ðŸ’¥ [${requestId}] ERRO sendAudioMessage:`, error.message);
    throw error;
  }
}

export async function sendImageMessage(number: string, imageUrl: string, caption?: string) {
  // ID Ãºnico para rastrear esta requisiÃ§Ã£o
  const requestId = `IMAGE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Detectar formato da imagem
  let fileName = `image_${Date.now()}`;
  let mimetype = 'image/jpeg'; // padrÃ£o
  
  if (imageUrl.includes('.png')) {
    fileName += '.png';
    mimetype = 'image/png';
  } else if (imageUrl.includes('.jpg') || imageUrl.includes('.jpeg')) {
    fileName += '.jpg';
    mimetype = 'image/jpeg';
  } else if (imageUrl.includes('.gif')) {
    fileName += '.gif';
    mimetype = 'image/gif';
  } else if (imageUrl.includes('.webp')) {
    fileName += '.webp';
    mimetype = 'image/webp';
  } else {
    // Fallback
    fileName += '.jpg';
    mimetype = 'image/jpeg';
  }
  
  // Obter o usuÃ¡rio atual
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error(`âŒ [${requestId}] UsuÃ¡rio nÃ£o autenticado`);
    throw new Error('UsuÃ¡rio nÃ£o autenticado');
  }
  
  // Obter o chip padrÃ£o do cliente (relaÃ§Ã£o com departamentos desabilitada)
  console.log(`ðŸ” [${requestId}] Buscando chip padrÃ£o do cliente...`);
  const instanceName = await getChipPadraoCliente();
  console.log(`ðŸ“± [${requestId}] Chip padrÃ£o:`, instanceName);
  
  // Buscar informaÃ§Ãµes da instÃ¢ncia WhatsApp
  console.log(`ðŸ” [${requestId}] Buscando informaÃ§Ãµes da instÃ¢ncia...`);
  const clientInfo = await getWhatsAppInstanceInfo(user.email);
  
  // Preparar requisiÃ§Ã£o Evolution
  const apiUrl = `${API_BASE_URL}/message/sendMedia/${instanceName}`;
  const requestHeaders = {
    'Content-Type': 'application/json',
    'apikey': clientInfo.apikey || 'MI8J85niN3Ir70htmScnxGpGKl2jZgwa'
  };
  
  const requestBody = {
    number,
    mediatype: 'image',
    media: imageUrl,
    caption: caption || '',
    fileName: fileName,
    mimetype: mimetype
  };
  
  console.log(`ðŸ“· [${requestId}] sendImageMessage: ${number} - URL: ${imageUrl} - File: ${fileName}`);
  
  // Tentar enviar para Evolution API
  const evolutionPromise = fetch(apiUrl, {
    method: 'POST',
    headers: requestHeaders,
    body: JSON.stringify(requestBody)
  }).then(async (response) => {
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (parseError) {
        errorData = { message: 'Erro desconhecido' };
      }
      throw new Error(`Erro ao enviar imagem Evolution: ${response.status} - ${JSON.stringify(errorData)}`);
    }
    return response.json();
  });

  // Tentar enviar para UAZAPI em paralelo
  const uazapiPromise = (async () => {
    try {
      const { sendUAZAPIMediaMessage } = await import('./uazapiService');
      return await sendUAZAPIMediaMessage({
        number,
        type: 'image',
        file: imageUrl,
        text: caption,
        mimetype: mimetype
      }, user.email!);
    } catch (error) {
      throw new Error(`Erro ao enviar imagem UAZAPI: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  })();

  // Executar ambas em paralelo e aguardar resultados
  const results = await Promise.allSettled([evolutionPromise, uazapiPromise]);
  
  const evolutionResult = results[0];
  const uazapiResult = results[1];
  
  // Se pelo menos uma funcionou, retornar sucesso
  if (evolutionResult.status === 'fulfilled') {
    console.log(`âœ… [${requestId}] Imagem enviada com sucesso pela Evolution API`);
    getNomeAtendente().then((nome) => {
      setTimeout(() => updateNomeAtendenteParaUltimaMensagem(number, nome), 1500);
    }).catch(() => {});
    return evolutionResult.value;
  }

  if (uazapiResult.status === 'fulfilled') {
    console.log(`âœ… [${requestId}] Imagem enviada com sucesso pela UAZAPI`);
    getNomeAtendente().then((nome) => {
      setTimeout(() => updateNomeAtendenteParaUltimaMensagem(number, nome), 1500);
    }).catch(() => {});
    return uazapiResult.value;
  }

  const evolutionError = evolutionResult.status === 'rejected' ? evolutionResult.reason : null;
  const uazapiError = uazapiResult.status === 'rejected' ? uazapiResult.reason : null;
  const errorMessages = [];
  if (evolutionError) {
    errorMessages.push(`Evolution: ${evolutionError.message || evolutionError}`);
  }
  if (uazapiError) {
    errorMessages.push(`UAZAPI: ${uazapiError.message || uazapiError}`);
  }
  throw new Error(`Erro ao enviar imagem (ambas APIs falharam): ${errorMessages.join(' | ')}`);
}

export async function sendDocumentMessage(number: string, documentUrl: string, fileName: string, caption: string = '') {
  // ID Ãºnico para rastrear esta requisiÃ§Ã£o
  const requestId = `DOC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // Detectar formato do documento
    let mimetype = 'application/pdf'; // padrÃ£o
    
    if (fileName.toLowerCase().endsWith('.pdf')) {
      mimetype = 'application/pdf';
    } else if (fileName.toLowerCase().endsWith('.doc')) {
      mimetype = 'application/msword';
    } else if (fileName.toLowerCase().endsWith('.docx')) {
      mimetype = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (fileName.toLowerCase().endsWith('.xls')) {
      mimetype = 'application/vnd.ms-excel';
    } else if (fileName.toLowerCase().endsWith('.xlsx')) {
      mimetype = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else if (fileName.toLowerCase().endsWith('.ppt')) {
      mimetype = 'application/vnd.ms-powerpoint';
    } else if (fileName.toLowerCase().endsWith('.pptx')) {
      mimetype = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    } else if (fileName.toLowerCase().endsWith('.txt')) {
      mimetype = 'text/plain';
    } else {
      // Fallback
      mimetype = 'application/octet-stream';
    }
    
    // Obter o usuÃ¡rio atual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error(`âŒ [${requestId}] UsuÃ¡rio nÃ£o autenticado`);
      throw new Error('UsuÃ¡rio nÃ£o autenticado');
    }
    
    // Obter o chip padrÃ£o do cliente (relaÃ§Ã£o com departamentos desabilitada)
    console.log(`ðŸ” [${requestId}] Buscando chip padrÃ£o do cliente...`);
    const instanceName = await getChipPadraoCliente();
    console.log(`ðŸ“± [${requestId}] Chip padrÃ£o:`, instanceName);
    
    // Buscar informaÃ§Ãµes da instÃ¢ncia WhatsApp
    console.log(`ðŸ” [${requestId}] Buscando informaÃ§Ãµes da instÃ¢ncia...`);
    const clientInfo = await getWhatsAppInstanceInfo(user.email);
    
    // Preparar requisiÃ§Ã£o Evolution
    const apiUrl = `${API_BASE_URL}/message/sendMedia/${instanceName}`;
    const requestHeaders = {
      'Content-Type': 'application/json',
      'apikey': clientInfo.apikey || 'MI8J85niN3Ir70htmScnxGpGKl2jZgwa'
    };
    
    const requestBody = {
      number,
      mediatype: 'document',
      media: documentUrl,
      caption: caption || '',
      fileName: fileName,
      mimetype: mimetype
    };
    
    console.log(`ðŸ“„ [${requestId}] sendDocumentMessage: ${number} - URL: ${documentUrl} - File: ${fileName}`);
    
    // Tentar enviar para Evolution API
    const evolutionPromise = fetch(apiUrl, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(requestBody)
    }).then(async (response) => {
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          errorData = { message: 'Erro desconhecido' };
        }
        throw new Error(`Erro ao enviar documento Evolution: ${response.status} - ${JSON.stringify(errorData)}`);
      }
      return response.json();
    });

    // Tentar enviar para UAZAPI em paralelo
    const uazapiPromise = (async () => {
      try {
        const { sendUAZAPIMediaMessage } = await import('./uazapiService');
        return await sendUAZAPIMediaMessage({
          number,
          type: 'document',
          file: documentUrl,
          text: caption,
          docName: fileName,
          mimetype: mimetype
        }, user.email!);
      } catch (error) {
        throw new Error(`Erro ao enviar documento UAZAPI: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    })();

    // Executar ambas em paralelo e aguardar resultados
    const results = await Promise.allSettled([evolutionPromise, uazapiPromise]);
    
    const evolutionResult = results[0];
    const uazapiResult = results[1];
    
    // Se pelo menos uma funcionou, registrar nome_atendente e retornar
    if (evolutionResult.status === 'fulfilled') {
      console.log(`âœ… [${requestId}] Documento enviado com sucesso pela Evolution API`);
      getNomeAtendente().then((nome) => {
        setTimeout(() => updateNomeAtendenteParaUltimaMensagem(number, nome), 1500);
      }).catch(() => {});
      return evolutionResult.value;
    }

    if (uazapiResult.status === 'fulfilled') {
      console.log(`âœ… [${requestId}] Documento enviado com sucesso pela UAZAPI`);
      getNomeAtendente().then((nome) => {
        setTimeout(() => updateNomeAtendenteParaUltimaMensagem(number, nome), 1500);
      }).catch(() => {});
      return uazapiResult.value;
    }

    // Se ambas falharam, lanÃ§ar erro combinado
    const evolutionError = evolutionResult.status === 'rejected' ? evolutionResult.reason : null;
    const uazapiError = uazapiResult.status === 'rejected' ? uazapiResult.reason : null;
    
    const errorMessages = [];
    if (evolutionError) {
      errorMessages.push(`Evolution: ${evolutionError.message || evolutionError}`);
    }
    if (uazapiError) {
      errorMessages.push(`UAZAPI: ${uazapiError.message || uazapiError}`);
    }
    
    throw new Error(`Erro ao enviar documento (ambas APIs falharam): ${errorMessages.join(' | ')}`);
  } catch (error) {
    console.error(`ðŸ’¥ [${requestId}] ERRO sendDocumentMessage:`, error);
    throw error;
  }
}

export async function sendVideoMessage(number: string, videoUrl: string, caption: string = '') {
  // ID Ãºnico para rastrear esta requisiÃ§Ã£o
  const requestId = `VIDEO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Detectar formato do vÃ­deo
  let fileName = `video_${Date.now()}`;
  let mimetype = 'video/mp4'; // padrÃ£o

  if (videoUrl.includes('.mp4')) {
    fileName += '.mp4';
    mimetype = 'video/mp4';
  } else if (videoUrl.includes('.mov')) {
    fileName += '.mov';
    mimetype = 'video/quicktime';
  } else if (videoUrl.includes('.webm')) {
    fileName += '.webm';
    mimetype = 'video/webm';
  } else if (videoUrl.includes('.avi')) {
    fileName += '.avi';
    mimetype = 'video/x-msvideo';
  } else if (videoUrl.includes('.mkv')) {
    fileName += '.mkv';
    mimetype = 'video/x-matroska';
  } else {
    // Fallback
    fileName += '.mp4';
    mimetype = 'video/mp4';
  }

  // Obter o usuÃ¡rio atual
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error(`âŒ [${requestId}] UsuÃ¡rio nÃ£o autenticado`);
    throw new Error('UsuÃ¡rio nÃ£o autenticado');
  }
  
  // Obter o chip padrÃ£o do cliente (relaÃ§Ã£o com departamentos desabilitada)
  console.log(`ðŸ” [${requestId}] Buscando chip padrÃ£o do cliente...`);
  const instanceName = await getChipPadraoCliente();
  console.log(`ðŸ“± [${requestId}] Chip padrÃ£o:`, instanceName);
  
  // Buscar informaÃ§Ãµes da instÃ¢ncia WhatsApp
  console.log(`ðŸ” [${requestId}] Buscando informaÃ§Ãµes da instÃ¢ncia...`);
  const clientInfo = await getWhatsAppInstanceInfo(user.email);
  
  // Preparar requisiÃ§Ã£o Evolution
  const apiUrl = `${API_BASE_URL}/message/sendMedia/${instanceName}`;
  const requestHeaders = {
    'Content-Type': 'application/json',
    'apikey': clientInfo.apikey || 'MI8J85niN3Ir70htmScnxGpGKl2jZgwa'
  };
  const requestBody = {
    number,
    mediatype: 'video',
    media: videoUrl,
    caption: caption || '',
    fileName: fileName,
    mimetype: mimetype
  };
  
  // Tentar enviar para Evolution API
  const evolutionPromise = fetch(apiUrl, {
    method: 'POST',
    headers: requestHeaders,
    body: JSON.stringify(requestBody)
  }).then(async (response) => {
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (parseError) {
        errorData = { message: 'Erro desconhecido' };
      }
      throw new Error(`Erro ao enviar vÃ­deo Evolution: ${response.status} - ${JSON.stringify(errorData)}`);
    }
    return response.json();
  });

  // Tentar enviar para UAZAPI em paralelo
  const uazapiPromise = (async () => {
    try {
      const { sendUAZAPIMediaMessage } = await import('./uazapiService');
      return await sendUAZAPIMediaMessage({
        number,
        type: 'video',
        file: videoUrl,
        text: caption,
        mimetype: mimetype
      }, user.email!);
    } catch (error) {
      throw new Error(`Erro ao enviar vÃ­deo UAZAPI: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  })();

  // Executar ambas em paralelo e aguardar resultados
  const results = await Promise.allSettled([evolutionPromise, uazapiPromise]);
  
  const evolutionResult = results[0];
  const uazapiResult = results[1];
  
  // Se pelo menos uma funcionou, registrar nome_atendente e retornar
  if (evolutionResult.status === 'fulfilled') {
    console.log(`âœ… [${requestId}] VÃ­deo enviado com sucesso pela Evolution API`);
    getNomeAtendente().then((nome) => {
      setTimeout(() => updateNomeAtendenteParaUltimaMensagem(number, nome), 1500);
    }).catch(() => {});
    return evolutionResult.value;
  }

  if (uazapiResult.status === 'fulfilled') {
    console.log(`âœ… [${requestId}] VÃ­deo enviado com sucesso pela UAZAPI`);
    getNomeAtendente().then((nome) => {
      setTimeout(() => updateNomeAtendenteParaUltimaMensagem(number, nome), 1500);
    }).catch(() => {});
    return uazapiResult.value;
  }

  // Se ambas falharam, lanÃ§ar erro combinado
  const evolutionError = evolutionResult.status === 'rejected' ? evolutionResult.reason : null;
  const uazapiError = uazapiResult.status === 'rejected' ? uazapiResult.reason : null;
  
  const errorMessages = [];
  if (evolutionError) {
    errorMessages.push(`Evolution: ${evolutionError.message || evolutionError}`);
  }
  if (uazapiError) {
    errorMessages.push(`UAZAPI: ${uazapiError.message || uazapiError}`);
  }
  
  throw new Error(`Erro ao enviar vÃ­deo (ambas APIs falharam): ${errorMessages.join(' | ')}`);
}

export async function sendMessageWithInstance(instanceName: string, number: string, text: string) {
  const apiUrl = `${API_BASE_URL}/message/sendText/${instanceName}`;
  const requestHeaders = {
    'Content-Type': 'application/json',
    'apikey': 'MI8J85niN3Ir70htmScnxGpGKl2jZgwa'
  };
  const requestBody = { number, text };
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: requestHeaders,
    body: JSON.stringify(requestBody)
  });
  if (!response.ok) {
    throw new Error('Erro ao enviar mensagem');
  }
  return response.json();
}

// FunÃ§Ã£o para buscar mensagens com paginaÃ§Ã£o e scroll infinito
export async function fetchMessagesWithPagination(
  instanceIds: string[],
  phoneNumber?: string,
  page: number = 0,
  limit: number = 50,
  fromDate?: string
) {
  try {
    let query = supabase
      .from('agente_conversacional_whatsapp')
      .select('*')
      .in('instance_id', instanceIds)
      .order('created_at', { ascending: false });

    // Filtrar por telefone se especificado
    if (phoneNumber) {
      query = query.eq('telefone_id', phoneNumber);
    }

    // Filtrar por data se especificado (para carregar mensagens mais antigas)
    if (fromDate) {
      query = query.lt('created_at', fromDate);
    }

    // Aplicar paginaÃ§Ã£o
    const from = page * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar mensagens:', error);
      throw new Error(`Erro ao buscar mensagens: ${error.message}`);
    }

    // Inverter a ordem para mostrar as mais antigas primeiro (cronolÃ³gica)
    const messages = data ? data.reverse() : [];

    return {
      messages,
      hasMore: data && data.length === limit,
      totalCount: count || 0
    };
  } catch (error) {
    console.error('Erro ao buscar mensagens com paginaÃ§Ã£o:', error);
    throw error;
  }
}

// FunÃ§Ã£o para buscar as Ãºltimas mensagens de um contato especÃ­fico
export async function fetchRecentMessages(
  instanceIds: string[],
  phoneNumber: string,
  limit: number = 500
) {
  try {
    const { data, error } = await supabase
      .from('agente_conversacional_whatsapp')
      .select('*')
      .in('instance_id', instanceIds)
      .eq('telefone_id', phoneNumber)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar mensagens recentes:', error);
      throw new Error(`Erro ao buscar mensagens recentes: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar mensagens recentes:', error);
    throw error;
  }
}

// FunÃ§Ã£o para configurar subscription em tempo real para mensagens
export function setupMessagesSubscription(
  instanceIds: string[],
  onNewMessage: (message: any) => void,
  onError?: (error: any) => void
) {
  try {
    // Criar canal Ãºnico para evitar duplicaÃ§Ãµes
    const channelName = `messages_${instanceIds.join('_')}_${Date.now()}`;
    
    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agente_conversacional_whatsapp',
          filter: `instance_id=in.(${instanceIds.map(id => `"${id}"`).join(',')})`
        },
        (payload) => {
          console.log('Nova mensagem recebida via subscription:', payload);
          onNewMessage(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'agente_conversacional_whatsapp',
          filter: `instance_id=in.(${instanceIds.map(id => `"${id}"`).join(',')})`
        },
        (payload) => {
          console.log('Mensagem atualizada via subscription:', payload);
          onNewMessage(payload.new);
        }
      )
      .subscribe((status) => {
        console.log('Status da subscription de mensagens:', status);
        if (status === 'CHANNEL_ERROR' && onError) {
          onError(new Error('Erro na subscription de mensagens'));
        }
      });

    return subscription;
  } catch (error) {
    console.error('Erro ao configurar subscription de mensagens:', error);
    if (onError) onError(error);
    return null;
  }
}

// FunÃ§Ã£o para remover subscription
export function removeMessagesSubscription(subscription: any) {
  if (subscription) {
    try {
      supabase.removeChannel(subscription);
      console.log('Subscription de mensagens removida');
    } catch (error) {
      console.error('Erro ao remover subscription:', error);
    }
  }
}

// FunÃ§Ã£o para marcar mensagens como lidas
export async function markMessagesAsRead(phoneNumber: string, instanceIds: string[]) {
  try {
    const { error } = await supabase
      .from('agente_conversacional_whatsapp')
      .update({ foi_lida: true })
      .eq('telefone_id', phoneNumber)
      .in('instance_id', instanceIds)
      .eq('tipo', false) // Apenas mensagens recebidas
      .eq('foi_lida', false); // Apenas mensagens nÃ£o lidas

    if (error) {
      console.error('Erro ao marcar mensagens como lidas:', error);
      throw new Error(`Erro ao marcar mensagens como lidas: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error('Erro ao marcar mensagens como lidas:', error);
    throw error;
  }
}

// FunÃ§Ã£o para buscar estatÃ­sticas de mensagens nÃ£o lidas
export async function getUnreadMessageCounts(instanceIds: string[]) {
  try {
    // Buscar todas as mensagens nÃ£o lidas
    const { data, error } = await supabase
      .from('agente_conversacional_whatsapp')
      .select('telefone_id')
      .in('instance_id', instanceIds)
      .eq('tipo', false) // Apenas mensagens recebidas
      .eq('foi_lida', false); // Apenas mensagens nÃ£o lidas

    if (error) {
      console.error('Erro ao buscar contagem de mensagens nÃ£o lidas:', error);
      throw new Error(`Erro ao buscar contagem de mensagens nÃ£o lidas: ${error.message}`);
    }

    // Contar mensagens por telefone
    const unreadCounts: Record<string, number> = {};
    data?.forEach(item => {
      unreadCounts[item.telefone_id] = (unreadCounts[item.telefone_id] || 0) + 1;
    });

    return unreadCounts;
  } catch (error) {
    console.error('Erro ao buscar contagem de mensagens nÃ£o lidas:', error);
    throw error;
  }
}
```

### Arquivo relacionado ao envio WhatsApp via UAZAPI
Caminho completo: C:\Users\eg711\OneDrive\Área de Trabalho\smart-crm-meta\smart-crm-meta-vercel2\src\services\uazapiService.ts
```ts
// UAZAPI Service
// ServiÃ§o para integraÃ§Ã£o com a API UAZAPI do WhatsApp

import { supabase } from "@/lib/supabase";

export interface CreateInstanceParams {
  email?: string;
  id?: string;
  instanceName?: string;
}

export interface CreateInstanceResponse {
  token: string;
  instanceName: string;
  qrcode?: string | null;
  instance?: {
    token?: string;
    qrcode?: string;
    name?: string;
  };
}

export interface InstanceStatusResponse {
  status?: string;
  connected?: boolean;
  loggedIn?: boolean;
  instance?: {
    status?: string;
  };
}

export interface QRCodeResponse {
  qrcode?: string;
  instance?: {
    qrcode?: string;
  };
}

// ConfiguraÃ§Ã£o da API UAZAPI
const UAZAPI_BASE_URL = "https://smartcrm.uazapi.com";
const UAZAPI_ADMIN_TOKEN = "4YyhLKg7eUGhy2vhfzJDbtreK4UJbXNEElCYPS5wQBeADxLcyF";

/**
 * Gera um nome de instÃ¢ncia consistente seguindo o padrÃ£o da Evolution
 */
const createConsistentInstanceName = async (params: CreateInstanceParams): Promise<string> => {
  if (params.instanceName) {
    return params.instanceName;
  }
  
  if (params.email) {
    const { data: clientInfo, error } = await supabase
      .from('clientes_info')
      .select('id, name')
      .eq('email', params.email)
      .single();

    if (!error && clientInfo) {
      const sanitizedName = clientInfo.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .substring(0, 10);
      
      const instanceName = `smartcrm_${clientInfo.id}_${sanitizedName}`;
      return instanceName;
    }
    
    const sanitizedEmail = params.email
      .replace(/@/g, '_at_')
      .replace(/\./g, '_dot_')
      .replace(/[^a-zA-Z0-9_]/g, '')
      .substring(0, 20 - 8);
    
    return `smartcrm_${sanitizedEmail}`;
  }
  
  const instanceName = `smartcrm_${params.id?.replace(/-/g, '') || ''}`;
  return instanceName;
};

/**
 * Cria uma nova instÃ¢ncia na UAZAPI
 */
export async function createUAZAPIInstance(
  params: CreateInstanceParams
): Promise<CreateInstanceResponse> {
  try {
    // Gera o nome da instÃ¢ncia seguindo o padrÃ£o da Evolution
    const instanceName = await createConsistentInstanceName(params);

    const requestBody = {
      name: instanceName,
    };

    const response = await fetch(`${UAZAPI_BASE_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'admintoken': UAZAPI_ADMIN_TOKEN,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao criar instÃ¢ncia UAZAPI: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    console.log("ðŸ“¦ Resposta completa da criaÃ§Ã£o da instÃ¢ncia UAZAPI:", data);
    
    // A resposta da UAZAPI deve retornar um token
    const token = data.token || data.data?.token || data.instance?.token || "";
    
    if (!token) {
      throw new Error('Token nÃ£o retornado pela API UAZAPI');
    }
    
    // O instanceName Ã© o nome que foi enviado na requisiÃ§Ã£o
    const responseInstanceName = data.instanceName || data.data?.instanceName || data.instance?.name || data.name || instanceName;
    
    // Verificar se o QR code jÃ¡ vem na resposta
    const qrcodeFromResponse = data.qrcode || data.data?.qrcode || data.instance?.qrcode || data.code || null;
    
    return {
      token: token,
      instanceName: responseInstanceName,
      instance: data.instance || data.data || data,
      qrcode: qrcodeFromResponse, // Incluir QR code se jÃ¡ vier na resposta
    };
  } catch (error) {
    console.error('Erro ao criar instÃ¢ncia UAZAPI:', error);
    throw error;
  }
}

/**
 * Conecta a instÃ¢ncia e obtÃ©m o QR Code
 * Segundo a documentaÃ§Ã£o: 
 * - POST para /instance/connect
 * - Requer o token de autenticaÃ§Ã£o da instÃ¢ncia
 * - NÃ£o passa o campo "phone" para gerar QR code
 * - Atualiza o status para "connecting"
 */
export async function connectUAZAPIInstanceAndGetQRCode(
  token: string
): Promise<QRCodeResponse> {
  try {
    // POST para /instance/connect
    // NÃ£o passa o campo "phone" para gerar QR code (nÃ£o nÃºmero)
    // Usa o token da instÃ¢ncia como autenticaÃ§Ã£o (nÃ£o admin token)
    const response = await fetch(`${UAZAPI_BASE_URL}/instance/connect`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'token': token, // Token da instÃ¢ncia no header
      },
      body: JSON.stringify({}), // Body vazio - nÃ£o passa "phone" para gerar QR code
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao conectar instÃ¢ncia UAZAPI: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    console.log("ðŸ“¦ Resposta da conexÃ£o UAZAPI:", data);
    
    return {
      qrcode: data.qrcode || data.data?.qrcode || data.instance?.qrcode || data.code,
      instance: data.instance || data.data || data,
    };
  } catch (error) {
    console.error('Erro ao conectar instÃ¢ncia UAZAPI:', error);
    throw error;
  }
}

/**
 * ObtÃ©m o status da instÃ¢ncia
 * GET /instance/status
 * Retorna: disconnected, connecting, connected
 */
export async function getUAZAPIInstanceStatus(
  token: string
): Promise<InstanceStatusResponse> {
  try {
    const response = await fetch(`${UAZAPI_BASE_URL}/instance/status`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'token': token, // Token da instÃ¢ncia no header
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao obter status da instÃ¢ncia UAZAPI: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    console.log("ðŸ“Š Status completo da instÃ¢ncia UAZAPI:", data);
    
    // A resposta pode ter status em diferentes lugares
    const instanceStatus = data.status || data.data?.status || data.instance?.status;
    
    return {
      status: instanceStatus,
      connected: instanceStatus === 'connected' || data.connected === true || data.data?.connected === true,
      loggedIn: instanceStatus === 'connected' || data.loggedIn === true || data.data?.loggedIn === true,
      instance: data.instance || data.data || data,
    };
  } catch (error) {
    console.error('Erro ao obter status da instÃ¢ncia UAZAPI:', error);
    throw error;
  }
}

/**
 * Configura o webhook da instÃ¢ncia
 * Modo simples (recomendado) - gerencia automaticamente um Ãºnico webhook por instÃ¢ncia
 * Endpoint: POST /webhook (nÃ£o /instance/webhook)
 */
export async function configureUAZAPIWebhook(
  token: string
): Promise<void> {
  console.log("ðŸš€ [WEBHOOK] INÃCIO da funÃ§Ã£o configureUAZAPIWebhook");
  console.log("ðŸš€ [WEBHOOK] Token recebido:", token ? `${token.substring(0, 10)}...` : "null/undefined");
  console.log("ðŸš€ [WEBHOOK] Token completo length:", token?.length || 0);
  
  try {
    // No Vite, variÃ¡veis de ambiente devem ser acessadas via import.meta.env
    // Mas como estamos em runtime, vamos usar o valor padrÃ£o diretamente
    const webhookUrl = "https://webhook.dev.usesmartcrm.com/webhook/uazapi";
    console.log("ðŸš€ [WEBHOOK] Webhook URL:", webhookUrl);
    
    // Modo simples: nÃ£o incluir action nem id - cria novo ou atualiza existente automaticamente
    const requestBody = {
      enabled: true,
      url: webhookUrl,
      events: ["messages", "connection"],
      excludeMessages: ["isGroupYes"],
    };

    console.log("ðŸš€ [WEBHOOK] Request Body completo:", JSON.stringify(requestBody, null, 2));
    console.log("ðŸš€ [WEBHOOK] Endpoint:", `${UAZAPI_BASE_URL}/webhook`);
    console.log("ðŸš€ [WEBHOOK] Headers:", {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'token': token ? `${token.substring(0, 10)}...` : "null/undefined"
    });

    console.log("ðŸš€ [WEBHOOK] Enviando requisiÃ§Ã£o fetch...");
    const response = await fetch(`${UAZAPI_BASE_URL}/webhook`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'token': token, // Token da instÃ¢ncia no header
      },
      body: JSON.stringify(requestBody),
    });

    console.log("ðŸš€ [WEBHOOK] Resposta recebida - Status:", response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`âŒ Erro ao configurar webhook UAZAPI: ${response.status} - ${errorText}`);
      throw new Error(`Erro ao configurar webhook UAZAPI: ${response.status} - ${errorText}`);
    } else {
      let responseData;
      try {
        responseData = await response.json();
      } catch (parseError) {
        responseData = await response.text();
      }
      console.log("âœ… Webhook UAZAPI configurado com sucesso:", responseData);
    }
  } catch (error) {
    console.error('Erro ao configurar webhook UAZAPI:', error);
    throw error; // RelanÃ§ar erro para que o chamador saiba que falhou
  }
}

/**
 * Atualiza o instance_id nas tabelas relacionadas quando uma nova instÃ¢ncia UAZAPI Ã© criada
 * Atualiza apenas os registros que possuÃ­am a instÃ¢ncia anterior (Evolution)
 */
export async function updateInstanceIdInRelatedTables(
  userEmail: string,
  oldInstanceId: string | null,
  newInstanceId: string
): Promise<void> {
  console.log(`ðŸ”„ [UPDATE INSTANCE_ID] Iniciando atualizaÃ§Ã£o nas tabelas relacionadas`);
  console.log(`ðŸ”„ [UPDATE INSTANCE_ID] userEmail: ${userEmail}`);
  console.log(`ðŸ”„ [UPDATE INSTANCE_ID] oldInstanceId: ${oldInstanceId}`);
  console.log(`ðŸ”„ [UPDATE INSTANCE_ID] newInstanceId: ${newInstanceId}`);
  
  try {
    if (!oldInstanceId) {
      console.log("â„¹ï¸ [UPDATE INSTANCE_ID] Nenhuma instÃ¢ncia anterior encontrada, nÃ£o hÃ¡ necessidade de atualizar tabelas relacionadas");
      return;
    }

    console.log(`ðŸ”„ [UPDATE INSTANCE_ID] Atualizando instance_id de "${oldInstanceId}" para "${newInstanceId}" nas tabelas relacionadas`);

    // Obter id_cliente do usuÃ¡rio
    const { data: clientInfo, error: clientError } = await supabase
      .from('clientes_info')
      .select('id')
      .eq('email', userEmail)
      .single();

    if (clientError || !clientInfo) {
      console.error("âŒ Erro ao obter id_cliente:", clientError);
      return;
    }

    const idCliente = clientInfo.id;

    // Atualizar tabela leads - apenas registros com instance_id antigo e id_cliente correspondente
    console.log(`ðŸ”„ [UPDATE INSTANCE_ID] Atualizando tabela leads: WHERE instance_id = '${oldInstanceId}' AND id_cliente = ${idCliente}`);
    try {
      const { error: leadsError } = await supabase
        .from('leads')
        .update({ instance_id: newInstanceId })
        .eq('instance_id', oldInstanceId)
        .eq('id_cliente', idCliente);

      if (leadsError) {
        console.error("âŒ [UPDATE INSTANCE_ID] Erro ao atualizar instance_id na tabela leads:", leadsError);
      } else {
        console.log(`âœ… [UPDATE INSTANCE_ID] instance_id atualizado na tabela leads`);
      }
    } catch (leadsError) {
      console.error("âŒ [UPDATE INSTANCE_ID] Erro ao atualizar instance_id na tabela leads:", leadsError);
    }

    // Atualizar tabela agente_conversacional_whatsapp - apenas registros com instance_id antigo e id_cliente correspondente
    console.log(`ðŸ”„ [UPDATE INSTANCE_ID] Atualizando tabela agente_conversacional_whatsapp: WHERE instance_id = '${oldInstanceId}' AND id_cliente = ${idCliente}`);
    try {
      const { error: agenteError } = await supabase
        .from('agente_conversacional_whatsapp')
        .update({ instance_id: newInstanceId })
        .eq('instance_id', oldInstanceId)
        .eq('id_cliente', idCliente);

      if (agenteError) {
        console.error("âŒ [UPDATE INSTANCE_ID] Erro ao atualizar instance_id na tabela agente_conversacional_whatsapp:", agenteError);
      } else {
        console.log(`âœ… [UPDATE INSTANCE_ID] instance_id atualizado na tabela agente_conversacional_whatsapp`);
      }
    } catch (agenteError) {
      console.error("âŒ [UPDATE INSTANCE_ID] Erro ao atualizar instance_id na tabela agente_conversacional_whatsapp:", agenteError);
    }

    // Atualizar tabela prompts_oficial - apenas registros com instance_id antigo e id_cliente correspondente
    console.log(`ðŸ”„ [UPDATE INSTANCE_ID] Atualizando tabela prompts_oficial: WHERE instance_id = '${oldInstanceId}' AND id_cliente = ${idCliente}`);
    try {
      const { error: promptsError } = await supabase
        .from('prompts_oficial')
        .update({ instance_id: newInstanceId })
        .eq('instance_id', oldInstanceId)
        .eq('id_cliente', idCliente);

      if (promptsError) {
        console.error("âŒ [UPDATE INSTANCE_ID] Erro ao atualizar instance_id na tabela prompts_oficial:", promptsError);
      } else {
        console.log(`âœ… [UPDATE INSTANCE_ID] instance_id atualizado na tabela prompts_oficial`);
      }
    } catch (promptsError) {
      console.error("âŒ [UPDATE INSTANCE_ID] Erro ao atualizar instance_id na tabela prompts_oficial:", promptsError);
    }

    console.log("âœ… AtualizaÃ§Ã£o de instance_id nas tabelas relacionadas concluÃ­da");
  } catch (error) {
    console.error("âŒ Erro ao atualizar instance_id nas tabelas relacionadas:", error);
    // NÃ£o lanÃ§a erro para nÃ£o bloquear o fluxo
  }
}

/**
 * ObtÃ©m o token da instÃ¢ncia UAZAPI do cliente (retorna null se nÃ£o existir)
 */
export async function getUAZAPIInstanceToken(userEmail: string): Promise<string | null> {
  try {
    // Primeiro, verificar se o usuÃ¡rio Ã© um atendente/gestor
    const { data: atendenteData, error: atendenteError } = await supabase
      .from('atendentes')
      .select('id_cliente')
      .eq('email', userEmail)
      .single();

    if (atendenteData && !atendenteError) {
      // UsuÃ¡rio Ã© atendente/gestor, buscar informaÃ§Ãµes do cliente
      const { data: clientInfo, error: clientError } = await supabase
        .from('clientes_info')
        .select('instance_id')
        .eq('id', atendenteData.id_cliente)
        .single();
        
      if (clientError || !clientInfo?.instance_id) {
        console.warn('Token da instÃ¢ncia UAZAPI nÃ£o encontrado para o cliente associado');
        return null;
      }
      
      return clientInfo.instance_id;
    }

    // UsuÃ¡rio Ã© cliente, buscar diretamente na tabela clientes_info
    const { data: clientInfo, error: clientError } = await supabase
      .from('clientes_info')
      .select('instance_id')
      .eq('email', userEmail)
      .order('id', { ascending: true })
      .limit(1);
    
    if (clientError || !clientInfo || clientInfo.length === 0) {
      console.warn('Token da instÃ¢ncia UAZAPI nÃ£o encontrado para este usuÃ¡rio ou nÃ£o configurado');
      return null;
    }
    
    if (!clientInfo[0]?.instance_id) {
      console.warn('Token da instÃ¢ncia UAZAPI nÃ£o configurado');
      return null;
    }
    
    return clientInfo[0].instance_id;
  } catch (error) {
    console.error('Erro ao obter token da instÃ¢ncia UAZAPI:', error);
    return null;
  }
}

export interface SendTextMessageParams {
  number: string;
  text: string;
  linkPreview?: boolean;
  linkPreviewTitle?: string;
  linkPreviewDescription?: string;
  linkPreviewImage?: string;
  linkPreviewLarge?: boolean;
  replyid?: string;
  mentions?: string;
  readchat?: boolean;
  readmessages?: boolean;
  delay?: number;
  forward?: boolean;
  track_source?: string;
  track_id?: string;
}

export interface SendMediaMessageParams {
  number: string;
  type: 'image' | 'video' | 'document' | 'audio' | 'myaudio' | 'ptt' | 'ptv' | 'sticker';
  file: string; // URL ou base64
  text?: string;
  docName?: string;
  thumbnail?: string;
  mimetype?: string;
  replyid?: string;
  mentions?: string;
  readchat?: boolean;
  readmessages?: boolean;
  delay?: number;
  forward?: boolean;
  track_source?: string;
  track_id?: string;
}

/**
 * Envia uma mensagem de texto via UAZAPI
 */
export async function sendUAZAPITextMessage(
  params: SendTextMessageParams,
  userEmail?: string
): Promise<any> {
  // Obter o token da instÃ¢ncia
  let token: string | null;
  if (userEmail) {
    token = await getUAZAPIInstanceToken(userEmail);
  } else {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('UsuÃ¡rio nÃ£o autenticado');
    }
    token = await getUAZAPIInstanceToken(user.email!);
  }

  // Se nÃ£o tem token UAZAPI configurado, lanÃ§ar erro (serÃ¡ tratado pelo Promise.allSettled)
  if (!token) {
    throw new Error('Token UAZAPI nÃ£o configurado');
  }

  const requestBody: any = {
    number: params.number,
    text: params.text,
  };

  // Adicionar campos opcionais
  if (params.linkPreview !== undefined) requestBody.linkPreview = params.linkPreview;
  if (params.linkPreviewTitle) requestBody.linkPreviewTitle = params.linkPreviewTitle;
  if (params.linkPreviewDescription) requestBody.linkPreviewDescription = params.linkPreviewDescription;
  if (params.linkPreviewImage) requestBody.linkPreviewImage = params.linkPreviewImage;
  if (params.linkPreviewLarge !== undefined) requestBody.linkPreviewLarge = params.linkPreviewLarge;
  if (params.replyid) requestBody.replyid = params.replyid;
  if (params.mentions) requestBody.mentions = params.mentions;
  if (params.readchat !== undefined) requestBody.readchat = params.readchat;
  if (params.readmessages !== undefined) requestBody.readmessages = params.readmessages;
  if (params.delay !== undefined) requestBody.delay = params.delay;
  if (params.forward !== undefined) requestBody.forward = params.forward;
  if (params.track_source) requestBody.track_source = params.track_source;
  if (params.track_id) requestBody.track_id = params.track_id;

  const response = await fetch(`${UAZAPI_BASE_URL}/send/text`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'token': token, // Token da instÃ¢ncia no header
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao enviar mensagem de texto UAZAPI: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Envia uma mensagem de mÃ­dia via UAZAPI
 */
export async function sendUAZAPIMediaMessage(
  params: SendMediaMessageParams,
  userEmail?: string
): Promise<any> {
  // Obter o token da instÃ¢ncia
  let token: string | null;
  if (userEmail) {
    token = await getUAZAPIInstanceToken(userEmail);
  } else {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('UsuÃ¡rio nÃ£o autenticado');
    }
    token = await getUAZAPIInstanceToken(user.email!);
  }

  // Se nÃ£o tem token UAZAPI configurado, lanÃ§ar erro (serÃ¡ tratado pelo Promise.allSettled)
  if (!token) {
    throw new Error('Token UAZAPI nÃ£o configurado');
  }

  const requestBody: any = {
    number: params.number,
    type: params.type,
    file: params.file,
  };

  // Adicionar campos opcionais
  if (params.text) requestBody.text = params.text;
  if (params.docName) requestBody.docName = params.docName;
  if (params.thumbnail) requestBody.thumbnail = params.thumbnail;
  if (params.mimetype) requestBody.mimetype = params.mimetype;
  if (params.replyid) requestBody.replyid = params.replyid;
  if (params.mentions) requestBody.mentions = params.mentions;
  if (params.readchat !== undefined) requestBody.readchat = params.readchat;
  if (params.readmessages !== undefined) requestBody.readmessages = params.readmessages;
  if (params.delay !== undefined) requestBody.delay = params.delay;
  if (params.forward !== undefined) requestBody.forward = params.forward;
  if (params.track_source) requestBody.track_source = params.track_source;
  if (params.track_id) requestBody.track_id = params.track_id;

  const response = await fetch(`${UAZAPI_BASE_URL}/send/media`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'token': token, // Token da instÃ¢ncia no header
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao enviar mÃ­dia UAZAPI: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data;
}
```

## 4) URL do webhook do n8n/UAZAPI e onde esta configurada
- Nao foram encontrados arquivos `.env`/`.env.*` no workspace.
- UAZAPI webhook (recebe eventos de mensagens/conexao da UAZAPI):
  - Arquivo: C:\Users\eg711\OneDrive\Área de Trabalho\smart-crm-meta\smart-crm-meta-vercel2\src\services\uazapiService.ts
  - Valor: `https://webhook.dev.usesmartcrm.com/webhook/uazapi`
- n8n webhook (workflow IA):
  - Arquivo: C:\Users\eg711\OneDrive\Área de Trabalho\smart-crm-meta\smart-crm-meta-vercel2\src\services\workflowMessageHandler.ts
  - Valor: `https://webhook.dev.usesmartcrm.com/webhook/workflow-ai`
- Configuracao de webhook n8n via env:
  - Arquivo: C:\Users\eg711\OneDrive\Área de Trabalho\smart-crm-meta\smart-crm-meta-vercel2\src\services\workflowService.ts
  - Chave: `VITE_N8N_WEBHOOK_URL`

### src/services/workflowMessageHandler.ts (completo)
```ts
/**
 * ServiÃ§o para processar mensagens recebidas e integrar com workflows
 * Este serviÃ§o deve ser chamado quando uma mensagem Ã© recebida via webhook
 */

import { supabase } from '@/lib/supabase';
import { WorkflowService } from './workflowService';
import { Lead } from '@/types/global';
import { IfNodeData, WorkflowEdge } from '@/types/workflow';

interface MessageReceivedData {
  phone: string;
  /** Pode vir como string ou objeto JSON (ex: { text, conversation }) do webhook */
  message: string | { text?: string; conversation?: string };
  idCliente: number;
  instanceId?: string;
  timestamp?: string;
  fromMe?: boolean; // Indica se a mensagem foi enviada pelo prÃ³prio sistema
}

/**
 * Processa mensagem recebida e verifica se deve iniciar/retomar workflow
 * Esta funÃ§Ã£o deve ser chamada quando uma mensagem Ã© recebida via webhook
 */
export async function processReceivedMessage(data: MessageReceivedData): Promise<void> {
  try {
    const { phone, message, idCliente, fromMe } = data;

    // Ignorar mensagens enviadas pelo prÃ³prio sistema para evitar loop infinito
    if (fromMe === true) {
      console.log('[Workflow] Mensagem do sistema ignorada (fromMe=true)');
      return;
    }

    // Normalizar message: pode vir como objeto JSON {"text":"...","contextInfo":{}} ou string
    const messageText = typeof message === 'string'
      ? message
      : (message as { text?: string; conversation?: string })?.text
        || (message as { text?: string; conversation?: string })?.conversation
        || String(message ?? '');

    // Normalizar telefone
    const normalizedPhone = phone.replace(/\D/g, '');

    // Buscar lead por telefone
    const lead = await WorkflowService.getLeadByPhone(normalizedPhone, idCliente);

    // Buscar workflow ativo para este cliente
    const { data: workflows } = await supabase
      .from('workflows')
      .select('*')
      .eq('id_cliente', idCliente)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    const activeWorkflow = workflows?.[0];

    // Verificar se a mensagem corresponde a um gatilho do workflow ativo
    let isTriggerMatch = false;
    if (activeWorkflow && messageText) {
      const startNode = activeWorkflow.nodes.find(
        (n: any) => n.type === 'inicio' || n.type === 'trigger'
      );
      const triggerConfig = activeWorkflow.trigger_config || startNode?.data || {};

      if (triggerConfig.keyword) {
        const keyword = String(triggerConfig.keyword).toLowerCase();
        if (messageText.toLowerCase().includes(keyword)) {
          isTriggerMatch = true;
          console.log('[Workflow] Gatilho detectado via palavra-chave:', keyword);
        }
      }
    }

    // Verificar se existe execuÃ§Ã£o waiting_input para este lead
    const waitingExecution = await WorkflowService.getWaitingExecution(
      lead?.id || 0,
      undefined
    );

    if (waitingExecution) {
      // Verificar se a execuÃ§Ã£o waiting expirou (mais de 1 hora parada)
      const isExpired = waitingExecution.updated_at &&
        (Date.now() - new Date(waitingExecution.updated_at).getTime() > 60 * 60 * 1000);

      if (isExpired || isTriggerMatch) {
        console.log(`[Workflow] Abortando menu anterior (expirado: ${isExpired}, gatilho: ${isTriggerMatch}).`);
        // Finalizar a execuÃ§Ã£o antiga
        await supabase
          .from('workflow_executions')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', waitingExecution.id);
        // Continuar para iniciar nova execuÃ§Ã£o
      } else {
        // Retomar workflow existente
        console.log('[Workflow] Retomando workflow para lead:', lead?.id);
        await handleWorkflowResume(waitingExecution.id, messageText, idCliente);
        return;
      }
    }

    // [TESTE] Regra "Ativo" comentada - religar depois dos testes
    // Verificar workflow_ativo do lead
    // if (lead && lead.workflow_ativo === false) {
    //   console.log('[Workflow] Workflow pausado para este lead - ignorando');
    //   return;
    // }

    if (!activeWorkflow) {
      console.log('[Workflow] Nenhum workflow ativo encontrado');
      return;
    }

    const workflow = activeWorkflow;

    // Validar tipo de gatilho: Webhook Externo sÃ³ dispara via webhook, nunca por mensagem do usuÃ¡rio
    const startNode = workflow.nodes?.find(
      (n: any) => n.type === 'inicio' || n.type === 'trigger'
    );
    const triggerConfigForValidation = workflow.trigger_config || startNode?.data || {};
    const triggerType = startNode?.data?.triggerType ?? workflow.trigger_config?.triggerType ?? 'message_received';

    if (triggerType === 'webhook_external') {
      console.log('[Workflow] Workflow acionado por Webhook Externo - nÃ£o iniciar por mensagem do usuÃ¡rio');
      return;
    }

    // Gatilho "Receber Mensagem": sÃ³ inicia se lead atende requisitos (chatbot === true)
    const canTrigger = await WorkflowService.canTriggerWorkflow(lead, idCliente);
    if (!canTrigger) {
      console.log('[Workflow] Lead nÃ£o pode iniciar workflow (chatbot deve ser true) - processamento normal');
      return;
    }

    // Se hÃ¡ palavra-chave configurada, a mensagem deve conter a palavra-chave
    if (triggerConfigForValidation.keyword && !isTriggerMatch) {
      console.log('[Workflow] Mensagem nÃ£o contÃ©m a palavra-chave do gatilho - processamento normal');
      return;
    }

    // Criar lead se nÃ£o existir
    let finalLead: Lead;
    if (!lead) {
      console.log('[Workflow] Criando novo lead...');
      const { data: newLead, error: createError } = await supabase
        .from('leads')
        .insert({
          telefone: normalizedPhone,
          nome: `Contato ${normalizedPhone.slice(-4)}`,
          id_cliente: idCliente,
          status_conversa: 'em_atendimento',
          status: 'Leads',
          origem: 'WhatsApp',
          closer_momento_da_ultima_msg: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError || !newLead) {
        console.error('[Workflow] Erro ao criar lead:', createError);
        return;
      }

      finalLead = newLead;
    } else {
      // Atualizar lead existente
      const agora = new Date().toISOString();
      const { data: updatedLead, error: updateError } = await supabase
        .from('leads')
        .update({
          status_conversa: 'em_atendimento',
          closer_momento_da_ultima_msg: agora,
        })
        .eq('id', lead.id)
        .select()
        .single();

      if (updateError || !updatedLead) {
        console.error('[Workflow] Erro ao atualizar lead:', updateError);
        return;
      }

      finalLead = updatedLead;
    }

    // Iniciar workflow
    console.log('[Workflow] Iniciando workflow para lead:', finalLead.id);
    await startWorkflow(workflow, finalLead, normalizedPhone);
  } catch (error) {
    console.error('[Workflow] Erro ao processar mensagem recebida:', error);
  }
}

/**
 * Inicia execuÃ§Ã£o de workflow
 */
async function startWorkflow(workflow: any, lead: Lead, phone: string): Promise<void> {
  try {
    // Encontrar nÃ³ inicial
    const startNode = workflow.nodes.find(
      (n: any) => n.type === 'inicio' || n.type === 'trigger'
    );

    if (!startNode) {
      console.error('[Workflow] Workflow sem nÃ³ inicial');
      return;
    }

    // Criar execuÃ§Ã£o inicial
    const execution = await WorkflowService.createOrUpdateExecution(
      workflow.id,
      lead.id,
      'running',
      startNode.id,
      { leadId: lead.id, phone, leadData: lead },
      null,
      null
    );

    // Log: inÃ­cio do workflow
    await WorkflowService.logWorkflowStart(workflow.id, lead.id, execution.id);

    // Executar workflow a partir do nÃ³ inicial
    await executeWorkflowFromNode(
      workflow,
      execution,
      startNode.id,
      { leadId: lead.id, phone, leadData: lead }
    );
  } catch (error: any) {
    console.error('[Workflow] Erro ao iniciar workflow:', error);
    // Log de erro
    const execution = await supabase
      .from('workflow_executions')
      .select('id')
      .eq('workflow_id', workflow.id)
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (execution.data?.id) {
      await WorkflowService.logError(
        execution.data.id,
        'workflow_start',
        error.message || 'Erro ao iniciar workflow',
        { error: String(error), stack: error.stack }
      );
    }
  }
}

/**
 * Executa workflow a partir de um nÃ³ especÃ­fico
 */
export async function executeWorkflowFromNode(
  workflow: any,
  execution: any,
  nodeId: string,
  context: { leadId: number; phone: string; leadData: Lead }
): Promise<void> {
  try {
    let currentNodeId: string | null = nodeId;
    const executedNodes = new Set<string>();

    while (currentNodeId) {
      // Prevenir loops
      if (executedNodes.has(currentNodeId)) {
        console.error('[Workflow] Loop detectado no workflow');
        break;
      }
      executedNodes.add(currentNodeId);

      const node = workflow.nodes.find((n: any) => n.id === currentNodeId);
      if (!node) break;

      const startTime = Date.now();

      // Log: entrada no node
      await WorkflowService.logNodeExecution(
        execution.id,
        node.id,
        node.type,
        {
          leadId: context.leadId,
          phone: context.phone,
          context: execution.context || {},
        }
      );

      try {
        // Executar nÃ³ baseado no tipo
        if (node.type === 'menu') {
          // Executar menu e pausar
          await WorkflowService.executeNodeMenu(node, {
            workflowId: workflow.id,
            leadId: context.leadId,
            phone: context.phone,
            leadData: context.leadData,
          });

          // Log: menu aguardando input
          await WorkflowService.logNodeWaiting(
            execution.id,
            node.id,
            'Aguardando resposta do usuÃ¡rio',
            { leadId: context.leadId }
          );

          // Salvar opÃ§Ã£o escolhida no contexto quando menu for respondido
          // (isso serÃ¡ feito no resumeWorkflow)

          // Menu pausa execuÃ§Ã£o - sair do loop
          return;
        } else if (node.type === 'message') {
          // Executar mensagem
          const messageData = node.data as {
            message: string;
            messageType?: string;
            variables?: string[];
            fileUrl?: string;
            audioUrl?: string;
            fileName?: string;
            fileType?: string;
          };

          const { sendMessage, sendAudioMessage, sendImageMessage, sendDocumentMessage } = await import('./messageService');

          // Verificar se Ã© mensagem com arquivo
          if (messageData.messageType === 'audio' && (messageData.audioUrl || messageData.fileUrl)) {
            const audioUrl = messageData.audioUrl || messageData.fileUrl || '';
            const caption = messageData.message
              ? WorkflowService.replaceVariables(messageData.message, {
                nome: context.leadData.nome || 'Cliente',
                telefone: context.phone,
                etapa: context.leadData.id_funil_etapa?.toString() || '',
                vendedor: context.leadData.nome_vendedor || '',
              })
              : '';
            await sendAudioMessage(context.phone, audioUrl, caption);
          } else if (
            (messageData.messageType === 'image' || messageData.fileType === 'image') &&
            messageData.fileUrl
          ) {
            const caption = messageData.message
              ? WorkflowService.replaceVariables(messageData.message, {
                nome: context.leadData.nome || 'Cliente',
                telefone: context.phone,
                etapa: context.leadData.id_funil_etapa?.toString() || '',
                vendedor: context.leadData.nome_vendedor || '',
              })
              : undefined;
            await sendImageMessage(context.phone, messageData.fileUrl, caption);
          } else if (messageData.messageType === 'file' && messageData.fileUrl) {
            const caption = messageData.message
              ? WorkflowService.replaceVariables(messageData.message, {
                nome: context.leadData.nome || 'Cliente',
                telefone: context.phone,
                etapa: context.leadData.id_funil_etapa?.toString() || '',
                vendedor: context.leadData.nome_vendedor || '',
              })
              : '';
            const fileName = messageData.fileName || 'arquivo.pdf';
            await sendDocumentMessage(context.phone, messageData.fileUrl, fileName, caption);
          } else {
            // Mensagem de texto normal
            const formattedMessage = WorkflowService.replaceVariables(messageData.message || '', {
              nome: context.leadData.nome || 'Cliente',
              telefone: context.phone,
              etapa: context.leadData.id_funil_etapa?.toString() || '',
              vendedor: context.leadData.nome_vendedor || '',
            });
            await sendMessage(context.phone, formattedMessage, context.leadData.id_cliente);
          }

          // Salvar mensagem enviada no contexto como lastOutput
          let messageOutput = `Mensagem ${messageData.messageType || 'text'} enviada`;
          if (messageData.messageType === 'text') {
            messageOutput = WorkflowService.replaceVariables(messageData.message || '', {
              nome: context.leadData.nome || 'Cliente',
              telefone: context.phone,
              etapa: context.leadData.id_funil_etapa?.toString() || '',
              vendedor: context.leadData.nome_vendedor || '',
            });
          }

          const updatedContext = {
            ...execution.context,
            lastOutput: messageOutput,
          };

          // Log: mensagem enviada com sucesso
          const executionTime = Date.now() - startTime;
          await WorkflowService.logNodeCompletion(
            execution.id,
            node.id,
            {
              message_sent: true,
              message_type: messageData.messageType || 'text',
              has_file: !!(messageData.fileUrl || messageData.audioUrl),
            },
            executionTime
          );

          // Atualizar contexto com lastOutput
          await supabase
            .from('workflow_executions')
            .update({
              context: updatedContext,
              updated_at: new Date().toISOString(),
            })
            .eq('id', execution.id);
        } else if (node.type === 'condition') {
          // IF Node simplificado - compara mensagem do usuÃ¡rio
          const ifData = node.data as IfNodeData;
          const mensagemUsuario =
            execution.context?.lastMessage ||
            execution.context?.mensagem_usuario ||
            '';

          // Comparar mensagem do usuÃ¡rio com valor configurado
          let result = false;
          const compareValue = String(ifData.value || '').toLowerCase();
          const mensagemUsuarioStr = String(mensagemUsuario || '').toLowerCase();

          switch (ifData.operator) {
            case 'equals':
              result = mensagemUsuarioStr === compareValue;
              break;
            case 'contains':
              result = mensagemUsuarioStr.includes(compareValue);
              break;
            case 'starts_with':
              result = mensagemUsuarioStr.startsWith(compareValue);
              break;
            case 'ends_with':
              result = mensagemUsuarioStr.endsWith(compareValue);
              break;
          }

          // Salvar resultado no contexto
          const updatedContext = {
            ...execution.context,
            lastOutput: String(result), // Converter para string para uso em outros nodes se necessÃ¡rio
          };

          const nextId = WorkflowService.getNextNodeForCondition(
            node.id,
            result,
            (workflow.edges || []) as WorkflowEdge[]
          );

          // Log: condiÃ§Ã£o avaliada
          const executionTime = Date.now() - startTime;
          await WorkflowService.logNodeCompletion(
            execution.id,
            node.id,
            { condition_result: result, mensagem_usuario: mensagemUsuario, next_node: nextId || null },
            executionTime
          );

          if (!nextId) {
            // Sem saÃ­da configurada para o resultado: considerar como fim silencioso
            await supabase
              .from('workflow_executions')
              .update({
                status: 'completed',
                updated_at: new Date().toISOString(),
              })
              .eq('id', execution.id);
            return;
          }

          currentNodeId = nextId;

          await supabase
            .from('workflow_executions')
            .update({
              current_node_id: currentNodeId,
              context: updatedContext,
              updated_at: new Date().toISOString(),
            })
            .eq('id', execution.id);

          // Ir para o prÃ³ximo loop jÃ¡ com o novo nÃ³
          continue;
        } else if (node.type === 'delay') {
          // Delay Node - aguardar tempo determinado
          const delayData = node.data as { duration: number; unit: 'seconds' | 'minutes' | 'hours' };
          let durationSeconds = 0;
          switch (delayData.unit) {
            case 'seconds':
              durationSeconds = delayData.duration;
              break;
            case 'minutes':
              durationSeconds = delayData.duration * 60;
              break;
            case 'hours':
              durationSeconds = delayData.duration * 3600;
              break;
          }

          const waitingUntil = new Date(Date.now() + durationSeconds * 1000).toISOString();

          // Atualizar execuÃ§Ã£o para waiting_timeout
          await supabase
            .from('workflow_executions')
            .update({
              status: 'waiting_timeout',
              waiting_until: waitingUntil,
              updated_at: new Date().toISOString(),
            })
            .eq('id', execution.id);

          // Log: delay iniciado
          const unitLabel = delayData.unit === 'hours' ? 'horas' : delayData.unit === 'minutes' ? 'minutos' : 'segundos';
          await WorkflowService.logNodeWaiting(
            execution.id,
            node.id,
            `Aguardando ${delayData.duration} ${unitLabel}`,
            { waiting_until: waitingUntil, duration: delayData.duration, unit: delayData.unit }
          );

          // Delay pausa execuÃ§Ã£o - sair do loop
          // O sistema deve verificar waiting_until periodicamente e retomar quando chegar o tempo
          return;
        } else if (node.type === 'ia') {
          // IA Node - chamar n8n que processa a IA e retorna a resposta
          const iaData = node.data as { systemPrompt: string };

          try {
            // Buscar instance_id do cliente na tabela clientes_info
            const { data: clienteInfo } = await supabase
              .from('clientes_info')
              .select('instance_id, instance_name')
              .eq('id', context.leadData.id_cliente)
              .single();

            const instanceId = clienteInfo?.instance_id || clienteInfo?.instance_name || '';

            // Buscar histÃ³rico de mensagens (Ãºltimas 50, ordem crescente)
            const telefoneLimpo = context.phone.replace(/\D/g, '');
            const telefoneComSufixo = `${telefoneLimpo}@s.whatsapp.net`;

            const { data: historicoRaw } = await supabase
              .from('agente_conversacional_whatsapp')
              .select('mensagem, tipo, timestamp')
              .eq('id_cliente', context.leadData.id_cliente)
              .or(`telefone_id.eq.${telefoneLimpo},telefone_id.eq.${telefoneComSufixo}`)
              .order('timestamp', { ascending: true })
              .limit(50);

            const historico = (historicoRaw || []).map((msg: any) => ({
              role: msg.tipo ? 'assistant' : 'user',
              content: msg.mensagem,
            }));

            // Montar payload conforme contrato com n8n
            const payload = {
              execution_id: execution.id,
              workflow_id: execution.workflow_id || workflow.id,
              node_id: node.id,
              lead_id: context.leadId,
              telefone: context.phone,
              id_cliente: context.leadData.id_cliente,
              instance_id: instanceId,
              config: {
                system_prompt: iaData.systemPrompt || '',
              },
              context: {
                nome: context.leadData.nome || 'Cliente',
                mensagem_usuario: execution.context?.mensagem_usuario || execution.context?.lastMessage || '',
                dados_lead: context.leadData,
                historico,
              },
            };

            // Chamar n8n com timeout de 30 segundos
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            let aiResponse: string;

            try {
              const httpResponse = await fetch(
                'https://webhook.dev.usesmartcrm.com/webhook/workflow-ai',
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload),
                  signal: controller.signal,
                }
              );

              clearTimeout(timeoutId);

              const result = await httpResponse.json();

              if (!result.success) {
                throw new Error(result.error || 'n8n retornou success: false');
              }

              aiResponse = result.response;
            } catch (fetchError: any) {
              clearTimeout(timeoutId);
              if (fetchError.name === 'AbortError') {
                throw new Error('Timeout: IA nÃ£o respondeu em 30 segundos');
              }
              throw fetchError;
            }

            // Enviar resposta para o lead via WhatsApp
            const { sendMessage } = await import('./messageService');
            await sendMessage(context.phone, aiResponse, context.leadData.id_cliente);

            // Atualizar contexto com a resposta da IA
            const updatedContext = {
              ...execution.context,
              lastOutput: aiResponse,
            };

            // Encontrar prÃ³ximo nÃ³ (primeiro tenta handle 'response', depois qualquer edge)
            const nextEdge =
              workflow.edges.find((e: any) => e.source === node.id && e.sourceHandle === 'response') ||
              workflow.edges.find((e: any) => e.source === node.id);
            const nextNodeId = nextEdge?.target || null;

            // Log: IA executada com sucesso
            const executionTime = Date.now() - startTime;
            await WorkflowService.logNodeCompletion(
              execution.id,
              node.id,
              {
                ai_response_sent: true,
                response_length: aiResponse.length,
                next_node: nextNodeId,
              },
              executionTime
            );

            if (!nextNodeId) {
              await supabase
                .from('workflow_executions')
                .update({
                  status: 'completed',
                  context: updatedContext,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', execution.id);
              return;
            }

            currentNodeId = nextNodeId;
            await supabase
              .from('workflow_executions')
              .update({
                current_node_id: currentNodeId,
                context: updatedContext,
                updated_at: new Date().toISOString(),
              })
              .eq('id', execution.id);

            continue;
          } catch (error: any) {
            await WorkflowService.logError(
              execution.id,
              node.id,
              `Erro na IA: ${error.message}`,
              { error: String(error) }
            );
            break;
          }

        } else if (node.type === 'end') {
          // Log: fim do workflow
          const executionTime = Date.now() - startTime;
          await WorkflowService.logNodeCompletion(
            execution.id,
            node.id,
            { workflow_completed: true },
            executionTime
          );

          // Finalizar workflow
          await supabase
            .from('workflow_executions')
            .update({
              status: 'completed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', execution.id);

          // Atualizar status do lead: fechar conversa e desativar chatbot
          await supabase
            .from('leads')
            .update({
              status_conversa: 'fechada',
              closer_momento_da_ultima_msg: new Date().toISOString(),
              chatbot: false,
            })
            .eq('id', context.leadId);

          return;
        }

        if (node.type === 'transfer_department') {
          const transferData = node.data as { id_departamento?: number | string | null };
          const raw = transferData.id_departamento;
          const idDepartamento =
            raw != null && raw !== ''
              ? (() => {
                  const n = Number(raw);
                  return Number.isNaN(n) ? null : n;
                })()
              : null;

          if (idDepartamento != null) {
            const numero = context.phone.replace(/\D/g, '');
            const targetId = context.leadData?.id || context.leadId || null;

            let query = supabase
              .from('leads')
              .update({ id_departamento: idDepartamento, updated_at: new Date().toISOString() })
              .eq('id_cliente', context.leadData.id_cliente);

            if (targetId != null) {
              query = query.eq('id', targetId);
            } else {
              query = query.or(`telefone.eq.${numero},telefone.eq.+${numero}`);
            }

            await query;
          }
          const executionTime = Date.now() - startTime;
          await WorkflowService.logNodeCompletion(
            execution.id,
            node.id,
            { transfer_department: idDepartamento },
            executionTime
          );
          const nextEdge = workflow.edges.find((e: any) => e.source === currentNodeId);
          currentNodeId = nextEdge?.target || null;
          if (currentNodeId) {
            await supabase
              .from('workflow_executions')
              .update({
                current_node_id: currentNodeId,
                status: 'running',
                updated_at: new Date().toISOString(),
              })
              .eq('id', execution.id);
          }
          continue;
        }

        // Log: node genÃ©rico completado (para nodes nÃ£o tratados acima)
        const executionTime = Date.now() - startTime;
        await WorkflowService.logNodeCompletion(
          execution.id,
          node.id,
          { node_type: node.type, completed: true },
          executionTime
        );

        // Encontrar prÃ³ximo nÃ³
        const nextEdge = workflow.edges.find((e: any) => e.source === currentNodeId);
        currentNodeId = nextEdge?.target || null;

        // Atualizar execuÃ§Ã£o com prÃ³ximo nÃ³
        if (currentNodeId) {
          await supabase
            .from('workflow_executions')
            .update({
              current_node_id: currentNodeId,
              updated_at: new Date().toISOString(),
            })
            .eq('id', execution.id);
        }
      } catch (nodeError: any) {
        // Log: erro no node
        const executionTime = Date.now() - startTime;
        await WorkflowService.logError(
          execution.id,
          node?.id || 'unknown',
          nodeError.message || 'Erro ao executar node',
          {
            error: String(nodeError),
            stack: nodeError.stack,
            node_type: node?.type,
            context: execution.context || {},
          }
        );
        // NÃ£o re-throw para nÃ£o interromper o workflow - apenas logar e continuar
        console.error(`[Workflow] Erro no node ${node?.id}:`, nodeError);
        break; // Sair do loop em caso de erro crÃ­tico
      }
    }
  } catch (error: any) {
    console.error('[Workflow] Erro ao executar workflow:', error);
    // Log: erro geral
    if (execution?.id) {
      await WorkflowService.logError(
        execution.id,
        'workflow_execution',
        error.message || 'Erro ao executar workflow',
        { error: String(error), stack: error.stack }
      );
    }
  }
}

/**
 * Retoma workflow apÃ³s resposta do usuÃ¡rio
 */
async function handleWorkflowResume(
  executionId: string,
  userInput: string,
  idCliente: number
): Promise<void> {
  try {
    // Retomar workflow
    const { execution, nextNodeId } = await WorkflowService.resumeWorkflow(
      executionId,
      userInput
    );

    if (!nextNodeId) {
      // Resposta invÃ¡lida ou workflow finalizado
      return;
    }

    // Buscar workflow
    const { data: workflow } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', execution.workflow_id)
      .single();

    if (!workflow) {
      console.error('[Workflow] Workflow nÃ£o encontrado');
      return;
    }

    // Buscar lead
    const { data: lead } = await supabase
      .from('leads')
      .select('*')
      .eq('id', execution.lead_id)
      .single();

    if (!lead) {
      console.error('[Workflow] Lead nÃ£o encontrado');
      return;
    }

    // Continuar execuÃ§Ã£o a partir do prÃ³ximo nÃ³
    await executeWorkflowFromNode(
      workflow,
      execution,
      nextNodeId,
      {
        leadId: lead.id,
        phone: lead.telefone || '',
        leadData: lead,
      }
    );
  } catch (error) {
    console.error('[Workflow] Erro ao retomar workflow:', error);
  }
}
```

### src/services/workflowService.ts (completo)
```ts
import { supabase } from '@/lib/supabase';
import { Workflow, WorkflowExecutionPayload, WorkflowExecution, WorkflowExecutionStatus, MenuNodeData, IfNodeData, WorkflowEdge } from '@/types/workflow';
import { sendMessage } from './messageService';
import { Lead } from '@/types/global';

export class WorkflowService {
  // CRUD Operations
  static async getById(id: string): Promise<Workflow | null> {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async getByClient(idCliente: number): Promise<Workflow[]> {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('id_cliente', idCliente)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async create(workflow: Omit<Workflow, 'id' | 'created_at' | 'updated_at'>): Promise<Workflow> {
    const { data, error } = await supabase
      .from('workflows')
      .insert(workflow)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(id: string, workflow: Partial<Workflow>): Promise<Workflow> {
    const { data, error } = await supabase
      .from('workflows')
      .update({ ...workflow, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // ExecuÃ§Ã£o local (para testes rÃ¡pidos)
  static async executeLocal(
    workflow: Workflow,
    triggerData: { phone: string; nome?: string; leadId?: number }
  ): Promise<void> {
    const { nodes, edges } = workflow;

    // Encontra nÃ³ inicial (inicio ou trigger legado)
    const startNode = nodes.find(n => n.type === 'inicio' || (n as { type: string }).type === 'trigger');
    if (!startNode) throw new Error('Workflow sem gatilho');

    // Executa sequencialmente
    let currentNodeId: string | undefined = startNode.id;
    const executedNodes = new Set<string>();

    while (currentNodeId) {
      if (executedNodes.has(currentNodeId)) {
        throw new Error('Loop detectado no workflow');
      }
      executedNodes.add(currentNodeId);

      const node = nodes.find(n => n.id === currentNodeId);
      if (!node) break;

      // Executa aÃ§Ã£o do nÃ³
      if (node.type === 'message') {
        const messageData = node.data as { message: string; useTemplate?: boolean };
        const formattedMessage = this.replaceVariables(messageData.message, {
          nome: triggerData.nome || 'Cliente',
          telefone: triggerData.phone,
        });

        await sendMessage(triggerData.phone, formattedMessage);
      }

      // PrÃ³ximo nÃ³
      const nextEdge = edges.find(e => e.source === currentNodeId);
      currentNodeId = nextEdge?.target;
    }
  }

  // ExecuÃ§Ã£o via n8n (produÃ§Ã£o)
  static async triggerExecution(payload: WorkflowExecutionPayload): Promise<any> {
    const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;

    if (!N8N_WEBHOOK_URL) {
      throw new Error('VITE_N8N_WEBHOOK_URL nÃ£o configurado');
    }

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Falha ao executar workflow: ${error}`);
    }

    return response.json();
  }

  // UtilitÃ¡rios
  static replaceVariables(template: string, variables: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => variables[key] || match);
  }

  static extractVariables(text: string): string[] {
    const matches = text.match(/\{\{(\w+)\}\}/g);
    return matches ? [...new Set(matches)] : [];
  }

  // ========== FUNÃ‡Ã•ES PARA MENU INTERATIVO ==========

  /**
   * Verifica se um lead pode iniciar/retomar um workflow
   * Regra: sÃ³ inicia se lead.chatbot === true. Se chatbot === false ou lead nÃ£o existe, nÃ£o inicia.
   */
  static async canTriggerWorkflow(lead: Lead | null, idCliente: number): Promise<boolean> {
    if (!lead) {
      return false;
    }
    return lead.chatbot === true;
  }

  /**
   * Busca lead por telefone e id_cliente
   */
  static async getLeadByPhone(phone: string, idCliente: number): Promise<Lead | null> {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('telefone', phone.replace(/\D/g, ''))
        .eq('id_cliente', idCliente)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar lead:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar lead:', error);
      return null;
    }
  }

  /**
   * Atualiza status do lead quando menu Ã© enviado
   */
  static async updateLeadStatusForMenu(leadId: number): Promise<void> {
    try {
      const agora = new Date().toISOString();
      const { error } = await supabase
        .from('leads')
        .update({
          status_conversa: 'em_atendimento',
          closer_momento_da_ultima_msg: agora,
        })
        .eq('id', leadId);

      if (error) {
        console.error('Erro ao atualizar status do lead:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erro ao atualizar status do lead:', error);
      throw error;
    }
  }

  /**
   * Cria ou atualiza execuÃ§Ã£o de workflow
   */
  static async createOrUpdateExecution(
    workflowId: string,
    leadId: number,
    status: WorkflowExecutionStatus,
    currentNodeId: string | null = null,
    context: Record<string, any> = {},
    waitingSince: string | null = null,
    expectedOptions: string[] | null = null
  ): Promise<WorkflowExecution> {
    try {
      // Verificar se jÃ¡ existe execuÃ§Ã£o waiting_input para este lead+workflow
      const { data: existing } = await supabase
        .from('workflow_executions')
        .select('*')
        .eq('workflow_id', workflowId)
        .eq('lead_id', leadId)
        .eq('status', 'waiting_input')
        .maybeSingle();

      if (existing) {
        // Atualizar execuÃ§Ã£o existente
        const { data, error } = await supabase
          .from('workflow_executions')
          .update({
            status,
            current_node_id: currentNodeId,
            context,
            waiting_since: waitingSince,
            expected_options: expectedOptions,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Criar nova execuÃ§Ã£o
        const { data, error } = await supabase
          .from('workflow_executions')
          .insert({
            workflow_id: workflowId,
            lead_id: leadId,
            status,
            current_node_id: currentNodeId,
            context,
            waiting_since: waitingSince,
            expected_options: expectedOptions,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Erro ao criar/atualizar execuÃ§Ã£o:', error);
      throw error;
    }
  }

  /**
   * Executa nÃ³ de menu interativo
   * Envia mensagem e pausa execuÃ§Ã£o aguardando resposta
   */
  static async executeNodeMenu(
    node: { id: string; data: MenuNodeData },
    executionContext: {
      workflowId: string;
      leadId: number;
      phone: string;
      leadData: Lead;
    }
  ): Promise<WorkflowExecution> {
    try {
      const menuData = node.data;
      const { workflowId, leadId, phone, leadData } = executionContext;

      // Formatar mensagem com variÃ¡veis
      const formattedMessage = this.replaceVariables(menuData.message, {
        nome: leadData.nome || 'Cliente',
        telefone: phone,
        etapa: leadData.id_funil_etapa?.toString() || '',
        vendedor: leadData.nome_vendedor || '',
      });

      // Enviar mensagem via WhatsApp
      await sendMessage(phone, formattedMessage, leadData.id_cliente);

      // Extrair opÃ§Ãµes vÃ¡lidas (IDs numÃ©ricos)
      const expectedOptions = menuData.options.map(opt => opt.id);

      // Criar/atualizar execuÃ§Ã£o com status waiting_input
      const execution = await this.createOrUpdateExecution(
        workflowId,
        leadId,
        'waiting_input',
        node.id,
        { ...executionContext, menuNodeId: node.id },
        new Date().toISOString(),
        expectedOptions
      );

      // Atualizar status do lead
      await this.updateLeadStatusForMenu(leadId);

      // Registrar log do menu
      await supabase
        .from('workflow_menu_logs')
        .insert({
          execution_id: execution.id,
          lead_id: leadId,
          menu_sent_at: new Date().toISOString(),
          is_valid_response: false,
        });

      return execution;
    } catch (error) {
      console.error('Erro ao executar menu:', error);
      throw error;
    }
  }

  /**
   * Retoma workflow apÃ³s resposta do usuÃ¡rio
   */
  static async resumeWorkflow(
    executionId: string,
    userInput: string
  ): Promise<{ execution: WorkflowExecution; nextNodeId: string | null }> {
    try {
      // Buscar execuÃ§Ã£o
      const { data: execution, error: execError } = await supabase
        .from('workflow_executions')
        .select('*')
        .eq('id', executionId)
        .single();

      if (execError || !execution) {
        throw new Error('ExecuÃ§Ã£o nÃ£o encontrada');
      }

      if (execution.status !== 'waiting_input') {
        throw new Error('ExecuÃ§Ã£o nÃ£o estÃ¡ aguardando input');
      }

      // Normalizar input para comparaÃ§Ã£o (remove espaÃ§os, caracteres especiais, lowercase)
      const normalizeInput = (input: string): string => {
        if (!input) return '';
        return input
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '') // Remove todos os espaÃ§os
          .replace(/\n/g, '') // Remove quebras de linha
          .replace(/\r/g, '') // Remove carriage return
          .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove caracteres invisÃ­veis
          .normalize('NFD') // Normaliza para remover acentos
          .replace(/[\u0300-\u036f]/g, ''); // Remove diacrÃ­ticos
      };

      const normalizedInput = normalizeInput(userInput);
      const trimmedInput = userInput.trim();
      const asNumber = parseInt(trimmedInput, 10);

      // Verificar se input estÃ¡ nas opÃ§Ãµes esperadas (comparaÃ§Ã£o normalizada)
      const expectedOptions = execution.expected_options || [];
      const normalizedExpectedOptions = expectedOptions.map(opt => normalizeInput(String(opt)));
      const isValidResponse = normalizedExpectedOptions.includes(normalizedInput) ||
        (!isNaN(asNumber) && asNumber >= 1 && asNumber <= expectedOptions.length);

      // Atualizar log do menu
      await supabase
        .from('workflow_menu_logs')
        .update({
          user_response: normalizedInput,
          option_chosen: isValidResponse ? normalizedInput : null,
          is_valid_response: isValidResponse,
        })
        .eq('execution_id', executionId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!isValidResponse) {
        // Resposta invÃ¡lida - finalizar para evitar loop infinito de opÃ§Ãµes invÃ¡lidas
        const { data: lead } = await supabase
          .from('leads')
          .select('telefone, id_cliente')
          .eq('id', execution.lead_id)
          .single();

        if (lead) {
          const errorMessage = `OpÃ§Ã£o invÃ¡lida. Digite: ${expectedOptions.join(', ')}`;
          await sendMessage(lead.telefone || '', errorMessage, lead.id_cliente);
        }

        // Atualizar status para completed
        await supabase
          .from('workflow_executions')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', executionId);

        // Retornar finalizado
        return { execution, nextNodeId: null };
      }

      // Resposta vÃ¡lida - continuar workflow
      // Buscar workflow e node para identificar prÃ³ximo nÃ³
      const { data: workflow } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', execution.workflow_id)
        .single();

      if (!workflow) {
        throw new Error('Workflow nÃ£o encontrado');
      }

      // Buscar node atual (menu)
      const currentNode = workflow.nodes.find(n => n.id === execution.current_node_id);
      if (!currentNode || currentNode.type !== 'menu') {
        throw new Error('Node de menu nÃ£o encontrado');
      }

      const menuData = currentNode.data as MenuNodeData;
      
      // Buscar opÃ§Ã£o por ID normalizado ou nÃºmero sequencial
      let selectedOption = menuData.options.find(opt => {
        const optionId = normalizeInput(String(opt.id || ''));
        return optionId === normalizedInput;
      });
      
      // Fallback: buscar por nÃºmero sequencial
      if (!selectedOption && !isNaN(asNumber) && asNumber >= 1 && asNumber <= menuData.options.length) {
        selectedOption = menuData.options[asNumber - 1];
      }

      // Encontrar prÃ³ximo node baseado na opÃ§Ã£o escolhida
      let nextNodeId: string | null = null;
      if (selectedOption?.nextNodeId) {
        nextNodeId = selectedOption.nextNodeId;
      } else {
        // Buscar edge conectado ao handle da opÃ§Ã£o
        const edge = workflow.edges.find(
          e => e.source === currentNode.id && e.sourceHandle === `option-${normalizedInput}`
        );
        nextNodeId = edge?.target || null;
      }

      // Atualizar execuÃ§Ã£o para running
      const { data: updatedExecution, error: updateError } = await supabase
        .from('workflow_executions')
        .update({
          status: 'running',
          current_node_id: nextNodeId,
          context: {
            ...execution.context,
            selectedOption: normalizedInput,
            optionLabel: selectedOption?.label,
            resposta_menu: normalizedInput,
            mensagem_usuario: normalizedInput, // Salvar mensagem do usuÃ¡rio para nÃ³ de condiÃ§Ã£o
            lastOutput: normalizedInput, // Manter para compatibilidade
          },
          waiting_since: null,
          expected_options: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', executionId)
        .select()
        .single();

      if (updateError) throw updateError;

      return { execution: updatedExecution, nextNodeId };
    } catch (error) {
      console.error('Erro ao retomar workflow:', error);
      throw error;
    }
  }

  /**
   * Busca execuÃ§Ã£o waiting_input para um lead
   */
  static async getWaitingExecution(leadId: number, workflowId?: string): Promise<WorkflowExecution | null> {
    try {
      let query = supabase
        .from('workflow_executions')
        .select('*')
        .eq('lead_id', leadId)
        .eq('status', 'waiting_input');

      if (workflowId) {
        query = query.eq('workflow_id', workflowId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('Erro ao buscar execuÃ§Ã£o:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar execuÃ§Ã£o:', error);
      return null;
    }
  }

  // ========== FUNÃ‡Ã•ES PARA NÃ“ CONDICIONAL (IF) ==========

  /** Tipo da condiÃ§Ã£o avaliada (estrutura completa com fieldType/fieldKey; IfNodeData Ã© simplificado) */
  static evaluateCondition(
    condition: {
      fieldType?: 'lead_field' | string;
      fieldKey?: string;
      operator: string;
      value: any;
      valueType?: 'string' | 'number' | 'boolean';
    },
    lead: Lead | null,
    executionContext: Record<string, any>
  ): boolean {
    const { fieldType, fieldKey, operator, value, valueType } = condition;

    let actualValue: any;

    if (fieldType === 'lead_field') {
      actualValue = lead ? (lead as any)[fieldKey] : undefined;
    } else {
      actualValue = executionContext ? executionContext[fieldKey] : undefined;
    }

    const castValue = (val: any) => {
      if (val === null || val === undefined) return val;
      switch (valueType) {
        case 'number':
          return Number(val);
        case 'boolean':
          if (typeof val === 'boolean') return val;
          if (typeof val === 'string') {
            return val.toLowerCase() === 'true';
          }
          return Boolean(val);
        case 'string':
        default:
          return String(val);
      }
    };

    const left = castValue(actualValue);
    const right = castValue(value);

    switch (operator) {
      case 'equals':
        return left === right;
      case 'not_equals':
        return left !== right;
      case 'greater_than':
        return Number(left) > Number(right);
      case 'less_than':
        return Number(left) < Number(right);
      case 'contains':
        if (left === null || left === undefined) return false;
        return String(left).toLowerCase().includes(String(right).toLowerCase());
      case 'exists':
        return actualValue !== null && actualValue !== undefined && actualValue !== '';
      case 'is_empty':
        return actualValue === null || actualValue === undefined || actualValue === '';
      default:
        return false;
    }
  }

  static getNextNodeForCondition(
    nodeId: string,
    conditionResult: boolean,
    edges: WorkflowEdge[]
  ): string | null {
    const handleId = conditionResult ? 'true' : 'false';

    const edge = edges.find(
      (e) => e.source === nodeId && e.sourceHandle === handleId
    );

    return edge?.target || null;
  }

  // ========== FUNÃ‡Ã•ES DE LOGGING E DEBUG ==========

  /**
   * ObtÃ©m o id_cliente do usuÃ¡rio logado
   */
  private static async getCurrentClientId(): Promise<number | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const idCliente = user.user_metadata?.id_cliente ||
        user.user_metadata?.raw_user_meta_data?.id_cliente;
      return idCliente ? Number(idCliente) : null;
    } catch (error) {
      console.error('Erro ao obter id_cliente:', error);
      return null;
    }
  }

  /**
   * Sanitiza dados sensÃ­veis antes de logar (mascara telefones, etc)
   */
  private static sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') return data;

    const sanitized = { ...data };

    // Mascarar telefones
    if (sanitized.phone || sanitized.telefone) {
      const phone = sanitized.phone || sanitized.telefone;
      if (typeof phone === 'string' && phone.length > 4) {
        const masked = phone.slice(0, 2) + '****' + phone.slice(-2);
        if (sanitized.phone) sanitized.phone = masked;
        if (sanitized.telefone) sanitized.telefone = masked;
      }
    }

    // Mascarar telefones em objetos aninhados
    if (sanitized.leadData?.telefone) {
      const phone = sanitized.leadData.telefone;
      if (typeof phone === 'string' && phone.length > 4) {
        sanitized.leadData.telefone = phone.slice(0, 2) + '****' + phone.slice(-2);
      }
    }

    return sanitized;
  }

  /**
   * Registra o inÃ­cio de uma execuÃ§Ã£o de workflow
   */
  static async logWorkflowStart(
    workflowId: string,
    leadId: number | null,
    executionId: string
  ): Promise<void> {
    try {
      const idCliente = await this.getCurrentClientId();
      if (!idCliente) {
        console.warn('NÃ£o foi possÃ­vel obter id_cliente para log');
        return;
      }

      await supabase.from('workflow_logs').insert({
        workflow_id: workflowId,
        execution_id: executionId,
        lead_id: leadId,
        node_id: 'workflow_start',
        node_type: 'workflow',
        status: 'started',
        input_data: { workflow_id: workflowId, lead_id: leadId },
        id_cliente: idCliente,
      });
    } catch (error) {
      // Log nÃ£o deve bloquear execuÃ§Ã£o - apenas logar erro
      console.error('Erro ao logar inÃ­cio do workflow:', error);
    }
  }

  /**
   * Registra a entrada em um node (antes de executar)
   */
  static async logNodeExecution(
    executionId: string,
    nodeId: string,
    nodeType: string,
    inputData: any
  ): Promise<void> {
    try {
      const idCliente = await this.getCurrentClientId();
      if (!idCliente) return;

      const sanitized = this.sanitizeData(inputData);

      await supabase.from('workflow_logs').insert({
        execution_id: executionId,
        node_id: nodeId,
        node_type: nodeType,
        status: 'started',
        input_data: sanitized,
        id_cliente: idCliente,
      });
    } catch (error) {
      console.error('Erro ao logar execuÃ§Ã£o do node:', error);
    }
  }

  /**
   * Registra a conclusÃ£o de um node (apÃ³s executar com sucesso)
   */
  static async logNodeCompletion(
    executionId: string,
    nodeId: string,
    outputData: any,
    executionTimeMs: number
  ): Promise<void> {
    try {
      const idCliente = await this.getCurrentClientId();
      if (!idCliente) return;

      const sanitized = this.sanitizeData(outputData);

      await supabase.from('workflow_logs').insert({
        execution_id: executionId,
        node_id: nodeId,
        status: 'completed',
        output_data: sanitized,
        execution_time_ms: executionTimeMs,
        id_cliente: idCliente,
      });
    } catch (error) {
      console.error('Erro ao logar conclusÃ£o do node:', error);
    }
  }

  /**
   * Registra um erro durante a execuÃ§Ã£o
   */
  static async logError(
    executionId: string,
    nodeId: string,
    errorMessage: string,
    context?: any
  ): Promise<void> {
    try {
      const idCliente = await this.getCurrentClientId();
      if (!idCliente) return;

      const sanitized = this.sanitizeData(context || {});

      await supabase.from('workflow_logs').insert({
        execution_id: executionId,
        node_id: nodeId,
        status: 'error',
        error_message: errorMessage,
        output_data: sanitized,
        id_cliente: idCliente,
      });
    } catch (error) {
      console.error('Erro ao logar erro do workflow:', error);
    }
  }

  /**
   * Registra que um node estÃ¡ aguardando input (ex: menu interativo)
   */
  static async logNodeWaiting(
    executionId: string,
    nodeId: string,
    waitReason: string,
    context?: any
  ): Promise<void> {
    try {
      const idCliente = await this.getCurrentClientId();
      if (!idCliente) return;

      const sanitized = this.sanitizeData(context || {});

      await supabase.from('workflow_logs').insert({
        execution_id: executionId,
        node_id: nodeId,
        status: 'waiting',
        input_data: { wait_reason: waitReason, ...sanitized },
        id_cliente: idCliente,
      });
    } catch (error) {
      console.error('Erro ao logar espera do node:', error);
    }
  }

  /**
   * Busca logs de um workflow com filtros opcionais
   */
  static async getWorkflowLogs(
    workflowId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      status?: string;
      leadId?: number;
      executionId?: string;
    }
  ): Promise<any[]> {
    try {
      const idCliente = await this.getCurrentClientId();
      if (!idCliente) return [];

      let query = supabase
        .from('workflow_logs')
        .select('*')
        .eq('workflow_id', workflowId)
        .eq('id_cliente', idCliente)
        .order('created_at', { ascending: false });

      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.leadId) {
        query = query.eq('lead_id', filters.leadId);
      }
      if (filters?.executionId) {
        query = query.eq('execution_id', filters.executionId);
      }

      const { data, error } = await query.limit(1000);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar logs do workflow:', error);
      return [];
    }
  }

  /**
   * Recupera o trace completo de uma execuÃ§Ã£o especÃ­fica
   */
  static async getExecutionTrace(executionId: string): Promise<any[]> {
    try {
      const idCliente = await this.getCurrentClientId();
      if (!idCliente) return [];

      const { data, error } = await supabase
        .from('workflow_logs')
        .select('*')
        .eq('execution_id', executionId)
        .eq('id_cliente', idCliente)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar trace da execuÃ§Ã£o:', error);
      return [];
    }
  }
}
```
