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
   * 🔐 Buscar email do Supabase se não foi passado como prop
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
          console.log("✅ Email obtido do Supabase:", user.email);
        } else {
          console.warn("⚠️ Nenhum usuário autenticado encontrado");
          setStatus("error");
        }
      } catch (error) {
        console.error("❌ Erro ao buscar email do Supabase:", error);
        setStatus("error");
      }
    };

    fetchUserEmail();
  }, [emailProp]);

  // Buscar departamentos disponíveis
  const fetchDepartamentos = async () => {
    if (!user?.id_cliente) return;
    
    try {
      setLoadingDepartamentos(true);
      const departamentosData = await departamentosService.listar(user.id_cliente);
      
      // Filtrar departamentos: mostrar apenas os criados pelo usuário
      // Se não houver nenhum departamento criado pelo usuário, mostrar apenas "Atendimento"
      const departamentosCriadosPeloUsuario = departamentosData.filter(dep => dep.nome !== 'Atendimento');
      
      let departamentosFiltrados: Departamento[] = [];
      
      if (departamentosCriadosPeloUsuario.length === 0) {
        // Se não há departamentos criados pelo usuário, mostrar apenas "Atendimento"
        const atendimento = departamentosData.find(dep => dep.nome === 'Atendimento');
        departamentosFiltrados = atendimento ? [atendimento] : [];
      } else {
        // Se há departamentos criados pelo usuário, mostrar todos (incluindo "Atendimento" se existir)
        departamentosFiltrados = departamentosData;
      }
      
      // Garantir que o departamento associado ao chip sempre apareça na lista
      // Mesmo que tenha sido filtrado, se estiver associado, deve aparecer
      const departamentosComAssociados = [...departamentosFiltrados];
      
      // Adicionar departamento do chip 1 se não estiver na lista
      if (departamentoChip1) {
        const depChip1 = departamentosData.find(dep => dep.id.toString() === departamentoChip1);
        if (depChip1 && !departamentosComAssociados.find(dep => dep.id === depChip1.id)) {
          departamentosComAssociados.push(depChip1);
        }
      }
      
      // Adicionar departamento do chip 2 se não estiver na lista
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

  // Verificar se há departamentos disponíveis
  const hasDepartamentos = departamentos.length > 0;

  // Verificar se precisa selecionar departamento para conectar
  const needsDepartamentoSelection = () => {
    // Se não há departamentos, precisa criar
    if (!hasDepartamentos) return true;
    
    // Se não tem instanceToken (não conectado), precisa selecionar pelo menos um departamento
    if (!instanceToken) {
      return !departamentoChip1 && !departamentoChip2;
    }
    
    // Se tem instanceToken mas não tem departamento associado, precisa selecionar
    if (instanceToken && !departamentoChip1 && !departamentoChip2) return true;
    
    return false;
  };

  // Verificar se deve mostrar a seção de departamentos
  const shouldShowDepartamentoSection = () => {
    // Sempre mostrar se não há departamentos
    if (!hasDepartamentos) return true;
    
    // Sempre mostrar se há departamentos (para permitir alterações)
    return hasDepartamentos;
  };

  // Função para selecionar departamento para um chip
  const handleSelectDepartamento = async (chip: 'chip1' | 'chip2', departamentoId: string) => {
    // Não permitir valores vazios
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
   * 🔍 Verificar instância existente ao carregar o componente (igual à Evolution)
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
          console.log("✅ Instância existente encontrada ao carregar:", {
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

          // Carregar configurações de atendimento
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
          
          // Verificar status imediatamente (igual à Evolution)
          // Usar o token diretamente, não o estado (que pode ainda não estar atualizado)
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
              
              // Atualizar número do telefone se disponível
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
                  console.error("Erro ao atualizar número:", dbError);
                }
              }
            } else {
              // Não mudar para idle imediatamente - deixar o checkConnectionStatus cuidar disso
              // Só mudar se realmente estiver desconectado
              const isDisconnected = instanceStatus === "disconnected";
              if (isDisconnected) {
                setStatus("idle");
              } else {
                // Se está em "connecting", manter como está ou setar como "qr" se apropriado
                console.log("ℹ️ Status não é connected nem disconnected, mantendo estado atual");
              }
            }
          } catch (statusError) {
            console.error("Erro ao verificar status inicial:", statusError);
            setStatus("idle");
          } finally {
            setCheckingStatus(false);
          }
        } else {
          console.log("ℹ️ Nenhuma instância existente encontrada");
          setStatus("idle");
        }
      } catch (error) {
        console.error("❌ Erro ao verificar instância existente:", error);
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
   * 🔄 Função para verificar status da conexão (similar à Evolution)
   */
  const checkConnectionStatus = useCallback(async () => {
    if (!instanceToken) return;

    try {
      setCheckingStatus(true);
      const statusResp = await getUAZAPIInstanceStatus(instanceToken);
      
      console.log("🔄 [checkConnectionStatus] Resposta completa:", statusResp);
      
      const instanceStatus = statusResp?.status || statusResp?.instance?.status;
      const isConnected = 
        instanceStatus === "connected" || 
        statusResp?.connected === true ||
        statusResp?.loggedIn === true ||
        statusResp?.instance?.status === "connected";

      console.log("🔄 [checkConnectionStatus] instanceStatus:", instanceStatus);
      console.log("🔄 [checkConnectionStatus] isConnected:", isConnected);

      // Atualizar estado baseado no status real
      if (isConnected) {
        setStatus((prevStatus) => {
          console.log("✅ [checkConnectionStatus] Status confirmado como conectado. Status anterior:", prevStatus);
          
          // Atualizar número do telefone se disponível
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
                console.log("✅ Número atualizado:", phoneNumber);
              })
          }
          
          setQrCode(null);
          return "connected";
        });
      } else {
        // Só mudar para idle se realmente estiver desconectado E o status anterior era connected
        // Se o status é "connecting", não mudar para idle
        const isDisconnected = instanceStatus === "disconnected" || statusResp?.connected === false;
        if (isDisconnected) {
          setStatus((prevStatus) => {
            if (prevStatus === "connected") {
              console.log("⚠️ [checkConnectionStatus] Status mudou de conectado para desconectado");
              return "idle";
            }
            return prevStatus;
          });
        } else {
          // Se está em "connecting" ou outro estado, não alterar se já estava conectado
          console.log("ℹ️ [checkConnectionStatus] Status não é conectado nem desconectado, mantendo status anterior");
        }
      }
    } catch (err) {
      console.error("❌ [checkConnectionStatus] Erro ao verificar status:", err);
      // Não mudar o status em caso de erro - manter o status anterior
    } finally {
      setCheckingStatus(false);
    }
  }, [instanceToken, email]);

  /**
   * 🔄 Polling contínuo de status (similar à Evolution)
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
   * 📋 Buscar chatbots disponíveis
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
        toast.error('Erro ao buscar chatbots disponíveis');
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
   * 🔄 useEffect para buscar chatbots quando atendimento IA estiver ativo
   */
  useEffect(() => {
    if (firstAttendance === "ai" && status === "connected" && user?.id) {
      fetchAvailableChatbots();
    }
  }, [firstAttendance, status, user?.id]);

  /**
   * ✅ Atualizar chatbot como "em uso"
   */
  const updateChatbotAsInUse = async (chatbotId: string | number) => {
    try {
      toast.info('Ativando chatbot...');

      // 1. Desativar todos os chatbots do usuário
      const { error: resetError } = await supabase
        .from('prompts_oficial')
        .update({ em_uso: false })
        .eq('id_usuario', user?.id);
        
      if (resetError) {
        console.error('Erro ao resetar status dos chatbots:', resetError);
        toast.error('Erro ao preparar ativação do chatbot');
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
      
      // 3. Atualizar as preferências do cliente
      const { error: clientError } = await supabase
        .from('clientes_info')
        .update({
          id_chatbot: chatbotId,
          atendimento_ia: true,
          atendimento_humano: false
        })
        .eq('email', email);
      
      if (clientError) {
        console.error('Erro ao atualizar preferências do cliente:', clientError);
        toast.error('Erro ao salvar preferências');
        return;
      }
      
      // 4. Atualizar estados locais
      setFirstAttendance("ai");
      
      // 5. Mostrar confirmação
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
   * 🎯 Handler para mudança de chatbot
   */
  const handleChatbotChange = async (chatbotId: string | number) => {
    const isUUID = typeof chatbotId === 'string' && chatbotId.includes('-');
    const id = isUUID ? chatbotId : (typeof chatbotId === 'string' ? parseInt(chatbotId) : chatbotId);
    
    if ((isUUID && typeof id === 'string') || (!isUUID && !isNaN(id as number) && (id as number) > 0)) {
      setSelectedChatbotId(id);
      await updateChatbotAsInUse(id);
    } else {
      console.error('ID de chatbot inválido:', chatbotId);
      toast.error('ID de chatbot inválido');
    }
  };

  /**
   * 👤 Handler para mudança do primeiro atendimento (humano/IA)
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
      toast.error("Erro ao salvar preferência de atendimento");
    }
  };
  
  // ✅ NÃO COLOQUE NENHUM "}" A MAIS AQUI
  // ✅ NÃO REDECLARE hasDepartamentos / needsDepartamentoSelection AQUI
  // ✅ Agora vem o seu initInstance (apenas UMA vez)


const initInstance = async () => {
  // Evitar múltiplas execuções simultâneas
  if (creatingRef.current) return;

  if (!email) {
    console.warn("⚠️ Email não disponível ainda");
    return;
  }

  // Bloqueio explícito por regra de negócio
  if (needsDepartamentoSelection()) {
    toast.error("Selecione um departamento antes de conectar o WhatsApp");
    return;
  }

  creatingRef.current = true;

  try {
    setStatus("creating");

    /**
     * 🔹 Verificar se já existe instância no clientes_info
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

        console.log("✅ Instância existente encontrada:", {
          instance_id: existingToken,
          instance_name: existingInstanceName,
        });
      }
    } catch (dbError) {
      console.warn(
        "⚠️ Erro ao verificar instância existente (seguindo para criação):",
        dbError
      );
    }

    let token: string;
    let instanceNameFinal: string;

    /**
     * 🔁 Reutilizar instância existente
     */
    if (existingToken && existingInstanceName) {
      token = existingToken;
      instanceNameFinal = existingInstanceName;

      setInstanceToken(token);
      setInstanceNameCreated(instanceNameFinal);

      console.log("♻️ Reutilizando instância existente");

      try {
        await configureUAZAPIWebhook(token);
        console.log("✅ Webhook configurado para instância existente");
      } catch (webhookError) {
        console.error(
          "❌ Erro ao configurar webhook (instância existente):",
          webhookError
        );
      }
    } else {
      /**
       * 🆕 Criar nova instância
       */
      console.log("🆕 Criando nova instância");

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
        console.log("✅ Webhook configurado após criação da instância");
      } catch (webhookError) {
        console.error(
          "❌ Erro ao configurar webhook após criação:",
          webhookError
        );
      }

      /**
       * 🔹 Salvar dados no clientes_info
       */
      try {
        await supabase
          .from("clientes_info")
          .update({
            instance_id: token,
            instance_name: instanceNameFinal,
          })
          .eq("email", email);

        console.log("✅ Instância salva no clientes_info");
      } catch (dbError) {
        console.error(
          "❌ Erro ao salvar dados da instância no clientes_info:",
          dbError
        );
      }
    }

    /**
     * 📱 Gerar QR Code
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
      console.error("❌ Erro ao gerar QR Code:", qrError);
      setStatus("error");
    }
  } catch (err) {
    console.error("❌ Erro ao inicializar instância:", err);
    setStatus("error");
  } finally {
    creatingRef.current = false;
  }
};



  /**
   * 🟡 Polling de status real
   * Verifica o status da instância enquanto está aguardando conexão
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

        // Verificar se está conectado - verificar múltiplos campos possíveis
        const instanceStatus = statusResp?.status;
        const isConnected = 
          instanceStatus === "connected" || 
          statusResp?.connected === true || 
          statusResp?.loggedIn === true ||
          statusResp?.instance?.status === "connected";

        if (isConnected) {
          console.log("✅ Instância conectada! Status:", instanceStatus);
          
          /**
           * ✅ Conectado → configurar webhook e atualizar dados
           */
          try {
            await configureUAZAPIWebhook(instanceToken);
            console.log("✅ Webhook configurado com sucesso");
          } catch (webhookError) {
            console.error("❌ Erro ao configurar webhook (não crítico):", webhookError);
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
          
          // Tentar obter o número do telefone se disponível na resposta
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
            console.log("✅ Número do telefone atualizado:", phoneNumber);
          } catch (dbError) {
            console.error("❌ Erro ao atualizar número do telefone:", dbError);
          }
        }

          setStatus("connected");
          setQrCode(null);
          clearInterval(interval);
          // Chamar checkConnectionStatus para garantir que tudo está atualizado
          setTimeout(() => checkConnectionStatus(), 1000);
          return;
        }

        // Se ainda está em "connecting", continuar verificando
        if (instanceStatus === "connecting") {
          console.log("⏳ Ainda conectando... aguardando...");
        }
        
        // Se o status mudou para "disconnected", pode ser um problema
        if (instanceStatus === "disconnected") {
          console.warn("⚠️ Instância desconectada durante o processo");
        }

      } catch (err) {
        console.error("Erro ao verificar status:", err);
        // Não parar o polling em caso de erro temporário
      }

    }, 5000); // Verificar a cada 5 segundos

    return () => clearInterval(interval);

  }, [instanceToken, status]);


  // Removido: conexão automática - agora só conecta via botão



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
            <p className="text-green-600 text-sm">{senderNumber ? `Número: ${senderNumber}` : 'Número conectado'}</p>
          </div>
          {/* Botão de reconectar - oculto para Gestor */}
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
            <p className="text-amber-600 text-sm">Conecte seu WhatsApp para começar</p>
          </div>
        </div>
      )}

      {/* Seção de seleção de departamentos - Chip 1 */}
      {shouldShowDepartamentoSection() && !isGestor && (
        <div className="pt-4 space-y-3">
          {!hasDepartamentos ? (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-red-600" />
                <p className="text-red-700 font-medium text-sm">Nenhum Departamento Encontrado</p>
              </div>
              <p className="text-red-600 text-xs mb-3">
                É necessário criar pelo menos um departamento antes de conectar o WhatsApp.
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
                    ✓ Departamento Ativo
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

      {/* Dropdown para seleção do primeiro atendimento */}
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
      
      {/* Seletor de chatbot (aparece somente quando atendimento por IA está ativado) */}
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
              <p className="text-amber-700">Nenhum chatbot ativo disponível.</p>
              <p className="text-amber-600">Ative algum chatbot na seção de Chatbots.</p>
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
                      {chatbot.nome} {chatbot.em_uso && " ✓"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableChatbots.length === 1 && (
                <div className="text-xs text-gray-500 mt-1">Apenas um chatbot disponível para seleção.</div>
              )}
            </>
          )}
        </div>
      )}

      {/* Botões de ação */}
      <div className="pt-4 flex justify-between">
        {/* Botões de conexão WhatsApp - visíveis apenas para Admin */}
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