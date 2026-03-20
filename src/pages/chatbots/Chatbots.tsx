import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, 
  Plus, 
  MessageSquare, 
  GitBranch, 
  Edit, 
  Trash,
  X,
  Loader2,
  Trash2
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogTitle,
  DialogHeader,
  DialogDescription
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link } from "react-router-dom";

import { ChatbotConfig } from "./types";
import ChatbotTypeSelector from "./ChatbotTypeSelector";
import ChatbotDetailsForm from "./ChatbotDetailsForm";
import FlowChatbotForm from "./FlowChatbotForm";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth";
import { AdminTools } from "./AdminTools";
import ChatbotTestButton from "@/components/chatbot/ChatbotTestButton";

type CreateDialogState = {
  isOpen: boolean;
  step: 'select_type' | 'details';
  type: 'ia' | 'fluxo';
  selectedAgenteIAType: string;
};

export default function AgentesIA() {
  const [activeTab, setActiveTab] = useState("ia");
  const [createDialog, setCreateDialog] = useState<CreateDialogState>({
    isOpen: false,
    step: 'select_type',
    type: 'ia',
    selectedAgenteIAType: ''
  });
  
  const [agentesIA, setAgentesIA] = useState<ChatbotConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  
  // Estado para edição de agente de IA
  const [editingAgenteIA, setEditingAgenteIA] = useState<ChatbotConfig | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showAdminTools, setShowAdminTools] = useState(false);
  
  // Lista de e-mails de administradores - adicione seu e-mail aqui
  const adminEmails = [
    'admin@example.com',
    'diego@example.com',
    // Adicione mais e-mails de administradores conforme necessário
  ];
  
  // Verificar se o usuário atual é um administrador
  const isAdmin = user && user.email && adminEmails.includes(user.email);
  
  // Função para buscar agentes de IA do Supabase
  const fetchAgentesIA = async () => {
    setIsLoading(true);
    try {
      if (!user) {
        console.error("Usuário não autenticado");
        setIsLoading(false);
        return;
      }

      // Verificar se está em modo de impersonação
      const isImpersonating = sessionStorage.getItem('isImpersonating') === 'true';
      const impersonatedClienteStr = sessionStorage.getItem('impersonatedCliente');
      
      let clientId = user.id;
      let queryField = 'id_usuario';
      
      if (isImpersonating && impersonatedClienteStr) {
        try {
          const impersonatedCliente = JSON.parse(impersonatedClienteStr);
          console.log('AgentesIA.tsx: Buscando agentes de IA para cliente impersonado:', impersonatedCliente.id);
          clientId = impersonatedCliente.id.toString();
          queryField = 'id_cliente';
        } catch (error) {
          console.error('Erro ao parsear dados do cliente impersonado:', error);
        }
      }

      // Buscar todos os tipos de prompt para mapear id -> nome
      let promptTypesMap: Record<string, string> = {};
      try {
        const { data: promptTypes, error: promptTypesError } = await supabase
          .from('prompts_type')
          .select('id, nome');
        if (!promptTypesError && promptTypes) {
          promptTypes.forEach((type: any) => {
            promptTypesMap[String(type.id)] = type.nome;
          });
        }
      } catch (e) {
        console.warn('Não foi possível buscar tipos de prompt:', e);
      }

      // Buscar agentes de IA usando o campo apropriado baseado no modo
      let { data, error } = await supabase
        .from('prompts_oficial')
        .select('*')
        .eq(queryField, clientId);

      if (error) {
        console.error("Error fetching agentes de IA:", error);
        toast.error("Falha ao buscar seus agentes de IA");
        return;
      }

      if (data && data.length > 0) {
        // Map the data to match our AgenteIAConfig type
        const mappedAgentesIA: ChatbotConfig[] = data.map(item => {
          let promptTypeName = promptTypesMap[String(item.prompt_type_id)] || "Personalizado";
          return {
            id: item.id,
            nome: item.nome || "Sem nome",
            nome_empresa: item.nome_empresa || "",
            descricao_empresa: item.descricao_empresa || "",
            endereco: item.endereco || "",
            descricao_produto: item.descricao_produto || "",
            modulos: item.modulos || "",
            diferenciais: item.diferenciais || "",
            garantia: item.garantia || "",
            precos_condicoes: item.precos_condicoes || "",
            acesso: item.acesso || "",
            suporte_contato: item.suporte_contato || "",
            type: "ia",
            active: item.status === true,
            inUse: item.em_uso === true,
            lastEdited: new Date(item.created_at).toLocaleDateString('pt-BR'),
            promptTypeId: item.prompt_type_id,
            promptTypeName: promptTypeName
          };
        });
        setAgentesIA(mappedAgentesIA);
        console.log("Agentes de IA processados:", mappedAgentesIA);
      } else {
        console.log("No agentes de IA found");
      }
    } catch (error) {
      console.error("Failed to fetch agentes de IA:", error);
      toast.error("Erro ao carregar agentes de IA");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch agentes de IA from Supabase when component mounts
  useEffect(() => {
    if (!user) return;
    
    // Primeiro, vamos verificar e inicializar o campo 'status' se necessário
    ensureStatusField().then(() => {
      fetchAgentesIA();
    });
  }, [user]);
  
  // Função para garantir que todos os agentes de IA tenham o campo 'status' definido
  const ensureStatusField = async () => {
    try {
      console.log("Verificando se todos os agentes de IA possuem os campos necessários");
      
      // Verificar se está em modo de impersonação
      const isImpersonating = sessionStorage.getItem('isImpersonating') === 'true';
      const impersonatedClienteStr = sessionStorage.getItem('impersonatedCliente');
      
      let clientId = user.id;
      let queryField = 'id_usuario';
      
      if (isImpersonating && impersonatedClienteStr) {
        try {
          const impersonatedCliente = JSON.parse(impersonatedClienteStr);
          console.log('AgentesIA.tsx (ensureStatusField): Usando cliente impersonado:', impersonatedCliente.id);
          clientId = impersonatedCliente.id.toString();
          queryField = 'id_cliente';
        } catch (error) {
          console.error('Erro ao parsear dados do cliente impersonado:', error);
        }
      }
      
      // Primeiro obter todos os agentes de IA do usuário/cliente
      const { data: allAgentesIA, error: fetchError } = await supabase
        .from('prompts_oficial')
        .select('id, status, em_uso, prompt_type_id, nome')
        .eq(queryField, clientId);
        
      if (fetchError) {
        console.error("Erro ao buscar agentes de IA para verificar campos:", fetchError);
        return;
      }
      
              if (!allAgentesIA || allAgentesIA.length === 0) {
          console.log("Nenhum agente de IA encontrado para verificar");
          return;
        }
        
        console.log("Agentes de IA encontrados para verificação:", allAgentesIA);
        
        // Filtrar agentes de IA sem status, em_uso ou prompt_type_id definidos
        const agentesIAWithoutStatus = allAgentesIA.filter(bot => bot.status === null || bot.status === undefined);
        const agentesIAWithoutEmUso = allAgentesIA.filter(bot => bot.em_uso === null || bot.em_uso === undefined);
        const agentesIAWithoutPromptTypeId = allAgentesIA.filter(bot => bot.prompt_type_id === null || bot.prompt_type_id === undefined);
      
              // Atualizar os agentes de IA sem status
        if (agentesIAWithoutStatus.length > 0) {
          console.log(`Encontrados ${agentesIAWithoutStatus.length} agentes de IA sem status definido. Atualizando...`);
          
          // Atualizar cada agente de IA sem status definido para status=true (ativo)
          for (const bot of agentesIAWithoutStatus) {
            console.log(`Atualizando status do agente de IA ID ${bot.id} para true`);
          
          try {
            const { error: updateError } = await supabase
              .from('prompts_oficial')
              .update({ status: true })
              .eq('id', bot.id);
              
            if (updateError) {
              console.error(`Erro ao atualizar status do agente de IA ${bot.id}:`, updateError);
            } else {
              console.log(`Status do agente de IA ID ${bot.id} atualizado para true`);
            }
          } catch (updateErr) {
            console.error(`Exceção ao atualizar status do agente de IA ${bot.id}:`, updateErr);
          }
        }
        
        console.log("Atualização de status concluída");
      } else {
        console.log("Todos os agentes de IA já possuem o campo status definido");
      }
      
      // Atualizar os agentes de IA sem o campo em_uso
      if (agentesIAWithoutEmUso.length > 0) {
        console.log(`Encontrados ${agentesIAWithoutEmUso.length} agentes de IA sem campo em_uso definido. Atualizando...`);
        
        // Atualizar cada agente de IA sem em_uso definido para em_uso=false (não em uso)
        for (const bot of agentesIAWithoutEmUso) {
          console.log(`Atualizando campo em_uso do agente de IA ID ${bot.id} para false`);
          
          try {
            const { error: updateError } = await supabase
              .from('prompts_oficial')
              .update({ em_uso: false })
              .eq('id', bot.id);
              
            if (updateError) {
              console.error(`Erro ao atualizar campo em_uso do agente de IA ${bot.id}:`, updateError);
            } else {
              console.log(`Campo em_uso do agente de IA ID ${bot.id} atualizado para false`);
            }
          } catch (updateErr) {
            console.error(`Exceção ao atualizar campo em_uso do agente de IA ${bot.id}:`, updateErr);
          }
        }
        
        console.log("Atualização de campo em_uso concluída");
      } else {
        console.log("Todos os agentes de IA já possuem o campo em_uso definido");
      }
      
      // Atualizar os agentes de IA sem campo prompt_type_id definido
      if (agentesIAWithoutPromptTypeId.length > 0) {
        console.log(`Encontrados ${agentesIAWithoutPromptTypeId.length} agentes de IA sem prompt_type_id. Atualizando...`);
        
        // Primeiro, buscar os tipos de prompt disponíveis
        const { data: promptTypes, error: typesError } = await supabase
          .from('prompts_type')
          .select('id, nome');
          
        if (typesError || !promptTypes) {
          console.error("Erro ao buscar tipos de prompt:", typesError);
          console.log("Pulando atualização de prompt_type_id");
          return;
        }
        
        console.log("Tipos de prompts disponíveis:", promptTypes);
        
        // Para cada agente de IA sem prompt_type_id, tentar encontrar uma correspondência
        for (const bot of agentesIAWithoutPromptTypeId) {
          let matchedTypeId = null;
          
          // Se tivermos botType, tentar fazer uma correspondência
          // (botType não existe mais no banco, só use se vier do frontend)
          // if (bot.botType) { ... } // Remover ou comentar este bloco
          
          // Se não encontrou por botType, tentar pelo nome do agente de IA
          if (!matchedTypeId && bot.nome) {
            const lowercaseName = bot.nome.toLowerCase();
            const matchByName = promptTypes.find(type => {
              const typeName = type.nome.toLowerCase();
              return lowercaseName.includes(typeName) || typeName.includes(lowercaseName);
            });
            
            if (matchByName) {
              matchedTypeId = matchByName.id;
              console.log(`Correspondência encontrada por nome para ${bot.id}: ${matchedTypeId}`);
            }
          }
          
          // Se encontrou uma correspondência, atualizar o agente de IA
          if (matchedTypeId) {
            console.log(`Atualizando prompt_type_id do agente de IA ${bot.id} para ${matchedTypeId}`);
            
            try {
              const { error: updateError } = await supabase
                .from('prompts_oficial')
                .update({ prompt_type_id: matchedTypeId })
                .eq('id', bot.id);
                
              if (updateError) {
                console.error(`Erro ao atualizar prompt_type_id do agente de IA ${bot.id}:`, updateError);
              } else {
                console.log(`prompt_type_id do agente de IA ID ${bot.id} atualizado para ${matchedTypeId}`);
              }
            } catch (updateErr) {
              console.error(`Exceção ao atualizar prompt_type_id do agente de IA ${bot.id}:`, updateErr);
            }
          } else {
            console.log(`Não foi possível encontrar correspondência para agente de IA ${bot.id}`);
          }
        }
        
        console.log("Atualização de prompt_type_id concluída");
      } else {
        console.log("Todos os agentes de IA já possuem o campo prompt_type_id definido");
      }
    } catch (error) {
      console.error("Erro ao garantir campos dos agentes de IA:", error);
    }
  };
  
          // Filtrar agentes de IA pelo tipo (ia ou fluxo)
        const filteredAgentesIA = agentesIA.filter(agenteIA => agenteIA.type === activeTab);
  
  const handleCreateAgenteIA = (type: "ia" | "fluxo") => {
    setCreateDialog({
      isOpen: true,
      step: 'select_type',
      type,
      selectedAgenteIAType: ''
    });
  };

  const handleAgenteIATypeSelected = (typeId: number) => {
            console.log("Tipo de agente de IA selecionado:", typeId, typeof typeId);
    setCreateDialog({
      ...createDialog,
      step: 'details',
              selectedAgenteIAType: typeId.toString()
    });
  };

  const handleSaveAgenteIA = (agenteIA: ChatbotConfig) => {
    setAgentesIA(current => [...current, agenteIA]);
    setCreateDialog({
      isOpen: false,
      step: 'select_type',
      type: 'ia',
      selectedAgenteIAType: ''
    });
  };

  const handleCloseDialog = () => {
    setCreateDialog({
      isOpen: false,
      step: 'select_type',
      type: 'ia',
      selectedAgenteIAType: ''
    });
  };

  const isValidId = (id: any) => {
    if (typeof id === 'string') return id.trim().length > 0;
    if (typeof id === 'number') return !isNaN(id);
    return false;
  };

  const handleToggleActive = async (id: number | string) => {
    console.log("DEBUG ativar/desativar ID:", id, "typeof:", typeof id);
    if (!isValidId(id)) {
      toast.error("ID de agente de IA inválido para ativar/desativar");
      return;
    }
    try {
      // Buscar o agente de IA no estado local, comparando IDs como string
      let currentBot = agentesIA.find(bot => String(bot.id) === String(id));
      
      // Se não encontrar no estado local, buscar do Supabase
      if (!currentBot) {
        const { data, error } = await supabase
          .from('prompts_oficial')
          .select('*')
          .eq('id', id)
          .single();
        if (error || !data) {
          toast.error("Agente de IA não encontrado no banco de dados");
          return;
        }
        currentBot = data;
      }
      
      const newActiveState = !currentBot.active;
      console.log(`Tentando atualizar agente de IA ID ${id} para status=${newActiveState}`);
      
      // Atualizar o status no banco de dados
      const updatePayload: any = { status: newActiveState };
      if (!newActiveState) {
        updatePayload.em_uso = false;
      }
      const { error: updateError } = await supabase
        .from('prompts_oficial')
        .update(updatePayload)
        .eq('id', id);
      if (updateError) {
        console.error("Erro ao atualizar status do agente de IA:", updateError);
        toast.error(`Falha ao atualizar status: ${updateError.message}`);
        return;
      }
      
      // Atualizar o estado local
      setAgentesIA(current => 
        current.map(bot => 
          String(bot.id) === String(id)
            ? { ...bot, active: newActiveState, inUse: !newActiveState ? false : bot.inUse }
            : bot
        )
      );
      toast.success(`Agente de IA ${newActiveState ? 'ativado' : 'desativado'} com sucesso!`);
      
      // Atualizar preferências do cliente se necessário
      if (!newActiveState && currentBot.inUse) {
        try {
          const { data: clientInfo, error: clientError } = await supabase
            .from('clientes_info')
            .select('id_agente_ia')
            .eq('id_usuario', user.id)
            .single();
          if (clientError) {
            console.error("Erro ao verificar preferências do cliente:", clientError);
          } else if (clientInfo && clientInfo.id_agente_ia === id) {
            await supabase
              .from('clientes_info')
              .update({ 
                id_agente_ia: null,
                atendimento_ia: false,
                atendimento_humano: true 
              })
              .eq('id_usuario', user.id);
            toast.info('O agente de IA que estava em uso foi desativado. O atendimento foi alterado para modo humano.');
          }
        } catch (clientUpdateError) {
          console.error("Erro ao atualizar preferências do cliente:", clientUpdateError);
        }
      }
    } catch (error) {
      console.error("Erro ao alternar status do agente de IA:", error);
      toast.error(`Erro ao atualizar status: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const handleDeleteAgenteIA = async (id: number | string) => {
    if (!isValidId(id)) {
      toast.error("ID de agente de IA inválido para exclusão");
      return;
    }
    try {
      console.log(`Tentando excluir agente de IA ID ${id} (tipo: ${typeof id})`);
      
      // Tentar excluir sem formatação especial
      toast.info("Excluindo agente de IA...");
      
      try {
        const { error } = await supabase
          .from('prompts_oficial')
          .delete()
          .eq('id', id);
          
        if (error) {
          console.error("Erro ao excluir agente de IA (método principal):", error);
          throw error;
        }
      } catch (initialError) {
        console.warn("Método principal falhou, tentando método alternativo:", initialError);
        
        // Converter para número se necessário
        const numericId = typeof id === 'string' ? Number(id) : id;
        
        // Tentar com tipos diferentes
        if (typeof id === 'string') {
          // Tentar excluir com número
          const { error: numericError } = await supabase
            .from('prompts_oficial')
            .delete()
            .eq('id', numericId);
            
          if (numericError) {
            console.error("Erro ao excluir agente de IA (método numérico):", numericError);
            
            // Tentar com o valor original sem converter
            const { error: stringError } = await supabase
              .from('prompts_oficial')
              .delete()
              .filter('id', 'eq', id);
              
            if (stringError) {
              console.error("Erro ao excluir agente de IA (método string):", stringError);
              throw stringError;
            }
          }
        } else {
          // Se já é number, tentar como string
          const { error: stringError } = await supabase
            .from('prompts_oficial')
            .delete()
            .filter('id', 'eq', String(id));
            
          if (stringError) {
            console.error("Erro ao excluir agente de IA (método string):", stringError);
            throw stringError;
          }
        }
      }
      
      console.log(`Agente de IA ID ${id} excluído com sucesso`);
      
      // Update local state - converter ambos para número para comparação
      setAgentesIA(current => current.filter(bot => Number(bot.id) !== Number(id)));
      toast.success("Agente de IA removido com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir agente de IA:", error);
      toast.error(`Erro ao excluir agente de IA: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };
  
  // Substituir a função handleEditAgenteIA por uma versão assíncrona que busca do Supabase
  const handleEditAgenteIA = async (agenteIA: ChatbotConfig) => {
    console.log("DEBUG editar agente de IA:", agenteIA, "ID:", agenteIA.id);
    if (!isValidId(agenteIA.id)) {
      toast.error("ID de agente de IA inválido para edição");
      return;
    }
    try {
      // Buscar os dados mais atuais do Supabase
      const { data, error } = await supabase
        .from('prompts_oficial')
        .select('*')
        .eq('id', agenteIA.id)
        .single();

      if (error || !data) {
        toast.error('Erro ao buscar dados atualizados do agente de IA');
        return;
      }

      // Montar objeto para o formulário, convertendo os campos para o padrão esperado
      setEditingAgenteIA({
        ...data,
        botType: data.prompt_type_id ? data.prompt_type_id.toString() : "0"
      });
      setIsEditModalOpen(true);
    } catch (err) {
      toast.error('Erro inesperado ao buscar dados do agente de IA');
      console.error(err);
    }
  };
  
  // Adicionar esta função para salvar as edições do agente de IA
  const handleSaveEdit = async (updatedAgenteIA: ChatbotConfig) => {
    try {
      console.log("Salvando edição do agente de IA:", updatedAgenteIA);
      
      // Primeiro, atualizar a interface
      setAgentesIA(current => 
        current.map(bot => 
          String(bot.id) === String(updatedAgenteIA.id) ? updatedAgenteIA : bot
        )
      );
      
      // Preparar dados para atualização no Supabase
      const updateData = {
        nome: updatedAgenteIA.nome || '',
        nome_empresa: updatedAgenteIA.nome_empresa || '',
        descricao_empresa: updatedAgenteIA.descricao_empresa || '',
        endereco: updatedAgenteIA.endereco || '',
        descricao_produto: updatedAgenteIA.descricao_produto || '',
        modulos: updatedAgenteIA.modulos || '',
        diferenciais: updatedAgenteIA.diferenciais || '',
        garantia: updatedAgenteIA.garantia || '',
        precos_condicoes: updatedAgenteIA.precos_condicoes || '',
        acesso: updatedAgenteIA.acesso || '',
        suporte_contato: updatedAgenteIA.suporte_contato || '',
        status: updatedAgenteIA.active,
        prompt_type_id: updatedAgenteIA.promptTypeId ?? null
      };
      // Remover campos que não existem na tabela
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) delete updateData[key];
      });
      console.log("Dados para atualização:", updateData);
      // Atualizar no banco de dados
      const { error } = await supabase
        .from('prompts_oficial')
        .update(updateData)
        .eq('id', updatedAgenteIA.id);
      if (error) {
        console.error("Erro no update:", error, error.message || error.details || error.code);
        throw error;
      }
      
      // Fechar o modal e limpar o estado
      setIsEditModalOpen(false);
              setEditingAgenteIA(null);
      
      toast.success("Agente de IA atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar edição do agente de IA:", error);
      toast.error(`Erro ao atualizar agente de IA: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };
  
  const handleCancelEdit = () => {
    setIsEditModalOpen(false);
    setEditingAgenteIA(null);
  };
  
  // Função simplificada para excluir um agente de IA
  const handleSimpleDelete = async (id: any) => {
    if (!isValidId(id)) {
      toast.error("ID de agente de IA inválido para exclusão rápida");
      return;
    }
    try {
      // Tenta remover apenas da interface - ignora erro de backend
      console.log(`Tentando excluir agente de IA apenas da interface, ID: ${id}`);
      setAgentesIA(current => current.filter(bot => String(bot.id) !== String(id)));
    toast.success("Agente de IA removido com sucesso!");
      
      // Tenta excluir do banco em segundo plano
      setTimeout(async () => {
        try {
          console.log(`Tentando excluir do banco de dados, ID: ${id}`);
          await supabase
            .from('prompts_oficial')
            .delete()
            .eq('id', id);
        } catch (dbError) {
          console.error("Erro ao excluir do banco (ignorado):", dbError);
        }
      }, 500);
    } catch (error) {
      console.error("Erro ao excluir agente de IA:", error);
      toast.error(`Erro ao excluir agente de IA. Tente recarregar a página.`);
    }
  };
  
  const [menuOpen, setMenuOpen] = useState(false);
  
  return (
    <>
      {/* Drawer/Menu lateral para mobile */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Fundo escuro para fechar o menu */}
          <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setMenuOpen(false)} />
          {/* Menu lateral */}
          <div className="relative w-64 max-w-full h-full bg-white shadow-lg flex flex-col p-6 animate-slide-in-left">
            <button className="self-end mb-4 p-2 rounded hover:bg-gray-100" onClick={() => setMenuOpen(false)} aria-label="Fechar menu">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <nav className="flex flex-col gap-4">
              <Link to="/" className="text-lg font-medium text-gray-700 hover:text-primary-600" onClick={() => setMenuOpen(false)}>Dashboard</Link>

              <Link to="/conversations" className="text-lg font-medium text-gray-700 hover:text-primary-600" onClick={() => setMenuOpen(false)}>Conversas</Link>
              <Link to="/contatos" className="text-lg font-medium text-gray-700 hover:text-primary-600" onClick={() => setMenuOpen(false)}>Contatos</Link>
              <Link to="/chatbots" className="text-lg font-medium text-gray-700 hover:text-primary-600" onClick={() => setMenuOpen(false)}>Agentes de IA</Link>
              <Link to="/departamentos" className="text-lg font-medium text-gray-700 hover:text-primary-600" onClick={() => setMenuOpen(false)}>Departamentos</Link>
              <Link to="/followup" className="text-lg font-medium text-gray-700 hover:text-primary-600" onClick={() => setMenuOpen(false)}>Followup Automático</Link>
              <Link to="/settings" className="text-lg font-medium text-gray-700 hover:text-primary-600" onClick={() => setMenuOpen(false)}>Configurações</Link>
            </nav>
          </div>
        </div>
      )}
      {/* Topo com botão de menu (apenas mobile) */}
      <div className="flex items-center gap-2 p-4 border-b bg-white md:hidden sticky top-0 z-40">
        <button
          className="p-2 rounded hover:bg-gray-100"
          onClick={() => setMenuOpen(true)}
          aria-label="Abrir menu"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="ml-2 text-2xl font-semibold">Agentes de IA</span>
      </div>
      <div className="flex flex-col h-screen">
        <div className="space-y-6 flex-1 min-h-0 overflow-y-auto px-2 sm:px-0">
      <div className="flex justify-between items-center">
      <div>
      </div>
        
        {isAdmin && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowAdminTools(!showAdminTools)}
          >
            {showAdminTools ? 'Ocultar Admin' : 'Ferramentas Admin'}
          </Button>
        )}
      </div>
      
      {isAdmin && showAdminTools && <AdminTools />}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center px-4">
          <TabsList>
            <TabsTrigger value="ia">Agente de IA</TabsTrigger>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <TabsTrigger value="fluxo" disabled className="opacity-50 cursor-not-allowed">
                      Agente de IA com Fluxo
                    </TabsTrigger>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-black text-white">
                  <p>Em breve</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </TabsList>
          
          <div className="flex gap-2">
            <Button onClick={() => handleCreateAgenteIA(activeTab as "ia" | "fluxo")}>
              <Plus className="mr-2 h-4 w-4" />
                              Criar Agente de IA
            </Button>
          </div>
        </div>

        <TabsContent value="ia" className="mt-6">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredAgentesIA.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum agente de IA criado. Clique em "Criar Agente de IA" para começar.</p>
            </div>
          ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 px-4">
            {filteredAgentesIA.map((agenteIA) => (
              <Card key={agenteIA.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{agenteIA.nome}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={agenteIA.active}
                        onCheckedChange={() => handleToggleActive(agenteIA.id)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAgentesIA(current => current.filter(bot => String(bot.id) !== String(agenteIA.id)));
                          handleDeleteAgenteIA(agenteIA.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Bot className="h-4 w-4" />
                    <span>IA</span>
                        {agenteIA.inUse && (
                          <Badge className="ml-2 bg-green-500 text-white">
                            Em uso
                          </Badge>
                        )}
                      </div>
                      {agenteIA.promptTypeName && (
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Tipo:</span> {agenteIA.promptTypeName}
                        </div>
                      )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Criado em {agenteIA.lastEdited}</span>
                    <Button variant="outline" size="sm" onClick={async () => await handleEditAgenteIA(agenteIA)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          )}
        </TabsContent>

        <TabsContent value="fluxo" className="mt-6">
          <div className="text-center py-8 text-muted-foreground">
            <p>Funcionalidade em desenvolvimento</p>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={createDialog.isOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {createDialog.type === "ia" ? "Criar Agente de IA" : "Criar Agente de IA com Fluxo"}
            </DialogTitle>
            <DialogDescription>
              {createDialog.step === 'select_type'
                ? "Selecione o tipo de agente de IA que deseja criar"
                : "Configure os detalhes do seu agente de IA"}
            </DialogDescription>
          </DialogHeader>
          
          {createDialog.step === 'select_type' ? (
            <ChatbotTypeSelector 
              onSelectType={(typeId) => {
                console.log("onSelectType chamado com:", typeId, typeof typeId);
                handleAgenteIATypeSelected(typeId);
              }}
              onCancel={handleCloseDialog}
            />
          ) : createDialog.type === 'ia' ? (
            <ChatbotDetailsForm 
              chatbotType={createDialog.selectedAgenteIAType}
              onSave={handleSaveAgenteIA} 
              onCancel={handleCloseDialog}
            />
          ) : (
                        <FlowChatbotForm
              onSave={handleSaveAgenteIA}
              onCancel={handleCloseDialog}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={(open) => !open && handleCancelEdit()}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
                    <DialogTitle>Editar Agente de IA</DialogTitle>
        <DialogDescription>
          Configure os detalhes do seu agente de IA
        </DialogDescription>
      </DialogHeader>
      
      <ChatbotDetailsForm
        chatbotType={editingAgenteIA?.botType || ""}
        onSave={handleSaveEdit}
        onCancel={handleCancelEdit}
        initialValues={editingAgenteIA}
      />
        </DialogContent>
      </Dialog>
      
      {/* Botão flutuante para teste de agente de IA */}
      <ChatbotTestButton />
    </div>
      </div>
    </>
  );
}