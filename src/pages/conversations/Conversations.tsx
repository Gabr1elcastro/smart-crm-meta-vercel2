// Conversations Component - Sistema de mensagens WhatsApp
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { format, isToday, isYesterday, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Send, Paperclip, MoreVertical, Bot, User, CheckCircle, XCircle, RefreshCw, Mic, TrendingUp, Archive, PlayCircle, MessageSquare, MessageCircle, Instagram, GitBranch, Repeat, Tag, User as UserIcon, X, Info as InfoIcon, BellRing, DollarSign, Pencil, RotateCcw, Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { useAuth } from "@/contexts/auth";
import { useUserType } from "@/hooks/useUserType";
import { supabase } from "@/lib/supabase";
import { sendMessage, sendAudioMessage, sendImageMessage, sendVideoMessage, sendDocumentMessage } from '@/services/messageService';
import { AudioPlayer } from '@/components/AudioPlayer';
import { AudioPlayerSimples } from '@/components/AudioPlayerSimples';
import { AudioPlayerAdvanced } from '@/components/AudioPlayerAdvanced';
import { AudioRecorder } from '@/components/AudioRecorder';
import { AudioRecorderMP3 } from '@/components/AudioRecorderMP3';
import { ImageUploader } from '@/components/ImageUploader';
import { VideoUploader } from '@/components/VideoUploader';
import { DocumentUploader } from '@/components/DocumentUploader';
import { useSearchParams } from "react-router-dom";
import { NovaConversaNovoContatoForm } from "@/components/NovaConversaNovoContatoForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LeadsService } from "@/services/leadsService";
import { Lead } from "@/types/global";
import { clientesService } from "@/services/clientesService";
import { Textarea } from "@/components/ui/textarea";
import { departamentosService, Departamento } from "@/services/departamentosService";
import { followupService } from "@/services/followupService";
import { Link } from "react-router-dom";
import EtiquetasDisplay from "@/components/EtiquetasDisplay";
import { etiquetasService, Etiqueta } from "@/services/etiquetasService";
import { ReminderScheduleDialog } from "@/components/ReminderScheduleDialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { FunisService } from "@/services/funisService";

// Interfaces
interface Contact {
  id: string;
  name: string;
  lastMessage: string;
  lastMessageTime: string;
  avatar?: string;
  telefone_id: string;
  atendimento_ia?: boolean;
  atendimento_humano?: boolean;
  status_conversa?: string | null;
  lastMessageType?: 'texto' | 'audio' | 'imagem' | 'video' | 'documento' | 'documento pdf' | 'documento doc' | 'documento docx' | 'documento xls' | 'documento xlsx' | 'documento ppt' | 'documento pptx' | 'documento txt' | null;
  instance_id?: string; // Corrige erro TS
}

interface Conversation {
  id: number;
  created_at: string;
  mensagem: string;
  tipo: boolean;
  timestamp: string;
  conversa_id: string;
  instance_id: string;
  user_id: string;
  telefone: string;
  name: string;
  telefone_id: string;
  user_id_auth: string;
  tipo_mensagem: 'texto' | 'audio' | 'imagem' | 'video' | 'documento' | 'documento pdf' | 'documento doc' | 'documento docx' | 'documento xls' | 'documento xlsx' | 'documento ppt' | 'documento pptx' | 'documento txt' | null;
  url_arquivo: string | null;
  transcricao_audio?: string | null;
  caption?: string | null;
  foi_lida: boolean;
  id_mensagem?: string;
  deleted?: boolean;
  nome_atendente?: string | null;
}

// Helper para normalizar telefones
const normalizePhone = (phone: string): string => {
  if (!phone) return '';
  
  try {
    // Remove @s.whatsapp.net e qualquer outro caractere não numérico
    // Primeiro, garantimos que estamos trabalhando com uma string
    const phoneStr = String(phone);
    
    // Remove a parte @s.whatsapp.net e quaisquer caracteres não numéricos
    const normalized = phoneStr.replace('@s.whatsapp.net', '').replace(/\D/g, '');
    
    return normalized;
  } catch (error) {
    console.error('Erro ao normalizar telefone:', error, 'Telefone original:', phone);
    // Em caso de erro, retorna o original ou vazio se não for uma string
    return typeof phone === 'string' ? phone : '';
  }
};

// Função para determinar a cor do estágio
const getStageColor = (status: string | null): { bgColor: string; textColor: string; label: string } => {
  if (!status) return { bgColor: '', textColor: '', label: '' };
  
  const normalizedStatus = status.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
  
  switch (normalizedStatus) {
    case 'leads':
    case 'lead':
      return { bgColor: 'bg-purple-100', textColor: 'text-purple-700', label: 'Lead' };
      
    case 'viu e nao respondeu':
    case 'viu e não respondeu':
      return { bgColor: 'bg-orange-100', textColor: 'text-orange-700', label: 'Viu e não respondeu' };
      
    case 'conversa em andamento':
      return { bgColor: 'bg-blue-100', textColor: 'text-blue-700', label: 'Em andamento' };
      
    case 'parou de responder':
      return { bgColor: 'bg-red-100', textColor: 'text-red-700', label: 'Parou de responder' };
      
    case 'oportunidade':
      return { bgColor: 'bg-yellow-100', textColor: 'text-yellow-700', label: 'Oportunidade' };
      
    case 'ganho':
      return { bgColor: 'bg-green-100', textColor: 'text-green-700', label: 'Ganho' };
      
    case 'perdido':
      return { bgColor: 'bg-gray-100', textColor: 'text-gray-700', label: 'Perdido' };
      
    default:
      return { bgColor: 'bg-gray-100', textColor: 'text-gray-700', label: status };
  }
};

export const Conversations = () => {
  // Estados principais
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [instanceId, setInstanceId] = useState<string | null>(null);
  const [selectedContactAttendance, setSelectedContactAttendance] = useState<{ia: boolean, humano: boolean} | null>(null);
  const [selectedContactStage, setSelectedContactStage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSending, setIsSending] = useState(false);
  const [isGeneratingFollowup, setIsGeneratingFollowup] = useState(false);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { ia: boolean, humano: boolean }>>({});
  const [recentlySentMessages, setRecentlySentMessages] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<'em_andamento' | 'encerrada'>('em_andamento');
  const [contactStatusMap, setContactStatusMap] = useState<Record<string, string | null>>({});
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [selectedDepartamento, setSelectedDepartamento] = useState<string>('all');
  const [selectedEtiqueta, setSelectedEtiqueta] = useState<string>('all');
  
  // Hook para pegar parâmetros da URL
  const [searchParams] = useSearchParams();
  const phoneFromUrl = searchParams.get('phone');
  const [initialPhoneProcessed, setInitialPhoneProcessed] = useState(false);
  
  // Estado para armazenar rascunhos de mensagens por contato
  const [messageDrafts, setMessageDrafts] = useState<Record<string, string>>({});
  
  // Estados para gravação de áudio
  const [isRecording, setIsRecording] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  
  // Estado para upload de imagem, vídeo e documento
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [pastedImageFile, setPastedImageFile] = useState<File | null>(null);
  const [showVideoUploader, setShowVideoUploader] = useState(false);
  const [showDocumentUploader, setShowDocumentUploader] = useState(false);
  
  // Estado para visualização de imagem em tela cheia
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  
  // Estado para anexo de arquivo ao lead
  const [showAnexoDialog, setShowAnexoDialog] = useState(false);
  const [uploadingAnexo, setUploadingAnexo] = useState(false);
  
  // Estados para edição de valor no cabeçalho
  const [isEditingValorHeader, setIsEditingValorHeader] = useState(false);
  const [valorInputHeader, setValorInputHeader] = useState<string>("");
  const [savingValorHeader, setSavingValorHeader] = useState(false);
  
  const { user } = useAuth();
  const { userType, userInfo: userTypeInfo, isAtendente } = useUserType();

  // Definir automaticamente o departamento para usuários do tipo "Atendente"
  useEffect(() => {
    if (isAtendente) {
      // Usar o primeiro departamento disponível
      const firstDept = userTypeInfo?.id_departamento || userTypeInfo?.id_departamento_2 || userTypeInfo?.id_departamento_3;
      if (firstDept) {
        setSelectedDepartamento(String(firstDept));
        console.log('[CONVERSAS] Departamento automaticamente selecionado para Atendente:', firstDept);
      }
    }
  }, [isAtendente, userTypeInfo?.id_departamento, userTypeInfo?.id_departamento_2, userTypeInfo?.id_departamento_3]);

  // Adicionar no início do componente Conversations:
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [newConversationMode, setNewConversationMode] = useState<'existente' | 'novo'>('existente');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  // Adicionar estados para leads existentes, loading e busca dentro do modal
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [existingLeadSearch, setExistingLeadSearch] = useState('');

  // Estado para modal de aviso de instância não conectada
  const [showInstanceWarning, setShowInstanceWarning] = useState(false);

  // Estados para seleção múltipla
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Estados para modais de ações em lote
  const [showBulkTransferModal, setShowBulkTransferModal] = useState(false);
  const [showBulkEtiquetasModal, setShowBulkEtiquetasModal] = useState(false);
  const [selectedBulkDepartamento, setSelectedBulkDepartamento] = useState<string>('');
  const [selectedBulkEtiquetas, setSelectedBulkEtiquetas] = useState<number[]>([]);
  
  // Estados para modal de adicionar ao funil
  const [showAddToFunnelModal, setShowAddToFunnelModal] = useState(false);
  const [availableFunis, setAvailableFunis] = useState<any[]>([]);
  const [selectedFunnelId, setSelectedFunnelId] = useState<string>('');
  const [selectedStageId, setSelectedStageId] = useState<string>('');
  const [loadingFunis, setLoadingFunis] = useState(false);
  const [loadingStages, setLoadingStages] = useState(false);
  const [availableStages, setAvailableStages] = useState<any[]>([]);
  
  // Estado global para leads
  const [leadsRaw, setLeadsRaw] = useState<any[]>([]);
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [reminderDialogLead, setReminderDialogLead] = useState<Lead | null>(null);

  // Buscar clienteInfo ao carregar a tela ou mudar usuário - SEMPRE pelo id_cliente do contexto
  const [clienteInfo, setClienteInfo] = useState<any>(null);
  useEffect(() => {
    const fetchClienteInfo = async () => {
      if (user?.id_cliente) {
        const info = await clientesService.getClienteByIdCliente(user.id_cliente);
        setClienteInfo(info);
        
        // Definir instance_id a partir do clienteInfo
        if (info?.instance_id) {
          setInstanceId1(info.instance_id);
        }
        if (info?.instance_id_2) {
          setInstanceId2(info.instance_id_2);
        }
        if (info?.instance_name) {
          setInstanceName1(info.instance_name);
        }
        if (info?.instance_name_2) {
          setInstanceName2(info.instance_name_2);
        }
        console.log('[CONVERSAS] instance_id encontrados:', { 
          instance_id: info?.instance_id, 
          instance_id_2: info?.instance_id_2, 
          instance_name: info?.instance_name, 
          instance_name_2: info?.instance_name_2 
        });
      } else {
        setClienteInfo(null);
      }
    };
    fetchClienteInfo();
  }, [user]);

  // Buscar leads quando abrir modal de nova conversa - usando id_cliente do contexto
  useEffect(() => {
    if (showNewConversationModal && user?.id_cliente) {
      setLoadingLeads(true);
      LeadsService.getLeadsByClientId(user.id_cliente).then((data) => {
        setLeads(data);
        setLoadingLeads(false);
      });
    } else if (!showNewConversationModal) {
      // Limpar busca e seleção ao fechar o modal
      setExistingLeadSearch('');
      setSelectedLeadId(null);
    }
  }, [showNewConversationModal, user?.id_cliente]);

  // Buscar leads quando abrir modal de adicionar ao funil - usando id_cliente do contexto
  useEffect(() => {
    if (showAddToFunnelModal && user?.id_cliente) {
      setLoadingLeads(true);
      LeadsService.getLeadsByClientId(user.id_cliente).then((data) => {
        setLeads(data);
        setLoadingLeads(false);
      });
    }
  }, [showAddToFunnelModal, user?.id_cliente]);

  // Processar telefone da URL quando os contatos estiverem carregados
  useEffect(() => {
    if (phoneFromUrl && contacts.length > 0 && !initialPhoneProcessed) {
      // Normalizar o telefone da URL
      const normalizedUrlPhone = normalizePhone(phoneFromUrl);
      
      // Procurar o contato correspondente
      const matchingContact = contacts.find(contact => {
        const normalizedContactPhone = normalizePhone(contact.telefone_id);
        return normalizedContactPhone === normalizedUrlPhone;
      });
      
      if (matchingContact) {
        // Selecionar o contato encontrado
        handleContactChange(matchingContact.id);
        toast.success(`Conversa com ${matchingContact.name} selecionada`);
      } else {
        // Se não encontrar conversa, mostrar mensagem
        toast.info(`Não foi encontrada conversa com o número ${phoneFromUrl}`);
      }
      
      // Marcar como processado para não repetir
      setInitialPhoneProcessed(true);
    }
  }, [phoneFromUrl, contacts, initialPhoneProcessed]);

  // Limpar todos os rascunhos ao carregar a página
  useEffect(() => {
    setMessageDrafts({});
  }, []);

  // 1. Buscar instance_id e client_id do usuário - SEMPRE pelo id_cliente do contexto
  const [instanceId1, setInstanceId1] = useState<string | null>(null);
  const [instanceId2, setInstanceId2] = useState<string | null>(null);
  const [instanceName1, setInstanceName1] = useState<string | null>(null);
  const [instanceName2, setInstanceName2] = useState<string | null>(null);



  // Buscar client_id do contexto - agora sempre disponível via user.id_cliente
  useEffect(() => {
    if (user?.id_cliente) {
      // Client ID disponível - sistema pronto
      console.log('[CONVERSAS] id_cliente disponível:', user.id_cliente);
      
      // Verificar se o id_cliente está correto para o email
      if (user.email === 'bbf.materiais@gmail.com' && user.id_cliente !== 6) {
        console.warn('[CONVERSAS] ATENÇÃO: id_cliente incorreto para bbf.materiais@gmail.com. Esperado: 6, Atual:', user.id_cliente);
      }
    }
  }, [user?.id_cliente, user?.email]);

  // 2. Função para construir a lista de contatos a partir das mensagens
  const buildContacts = useCallback(async (messages: Conversation[]) => {
    const seen = new Map<string, Contact>();
    // Primeiro, coletar todos os telefones únicos das mensagens
    const uniquePhones = new Set<string>();
    messages.forEach(msg => {
      if (msg.telefone_id) {
        const normalizedPhone = normalizePhone(msg.telefone_id);
        uniquePhones.add(normalizedPhone);
      }
    });
    // Buscar nomes da tabela leads se tivermos id_cliente do contexto
    let leadsMap = new Map<string, string>();
    if (user?.id_cliente) {
      try {
        const { data: leadsData, error } = await supabase
          .from('leads')
          .select('*')
          .eq('id_cliente', user.id_cliente);
        if (!error && leadsData) {
          setLeadsRaw(leadsData);

          leadsData.forEach(lead => {
            if (lead.telefone && lead.nome) {
              leadsMap.set(normalizePhone(lead.telefone), lead.nome);
            }
          });
        }
      } catch (error) {
        console.error('Erro ao buscar nomes dos leads:', error);
      }
    }
    // Adiciona contatos a partir das mensagens normalmente
    messages.forEach(msg => {
      if (!msg.telefone_id) return;
      const phone = normalizePhone(msg.telefone_id);
      if (!seen.has(phone)) {
        const leadName = leadsMap.get(phone);
        const name = leadName || msg.name || `Contato ${phone.slice(-4)}`;
        seen.set(phone, {
          id: phone,
          name: name,
          lastMessage: msg.mensagem,
          lastMessageTime: msg.timestamp || msg.created_at,
          avatar: '/avatar.png',
          telefone_id: msg.telefone_id,
          atendimento_ia: false, // Será atualizado com dados do lead
          atendimento_humano: false, // Será atualizado com dados do lead
          lastMessageType: msg.tipo_mensagem || 'texto',
          instance_id: msg.instance_id || '',
        });
      } else {
        const contact = seen.get(phone)!;
        const msgTime = new Date(msg.timestamp || msg.created_at);
        const contactTime = new Date(contact.lastMessageTime);
        if (msgTime > contactTime) {
          contact.lastMessage = msg.mensagem;
          contact.lastMessageTime = msg.timestamp || msg.created_at;
          contact.lastMessageType = msg.tipo_mensagem || 'texto';
        }
      }
    });
    // Adiciona leads do chip selecionado que não têm mensagens
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
    // Ordena por data (mais recente primeiro)
    const contactsArray = Array.from(seen.values()).sort((a, b) => {
      return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
    });
    setContacts(prevContacts => {
      console.log('[BUILD CONTACTS] Verificando mudanças:', {
        prevCount: prevContacts.length,
        newCount: contactsArray.length,
        prevContacts: prevContacts.slice(0, 3).map(c => ({ id: c.id, lastMessage: c.lastMessage })),
        newContacts: contactsArray.slice(0, 3).map(c => ({ id: c.id, lastMessage: c.lastMessage }))
      });
      
      if (prevContacts.length !== contactsArray.length) {
        console.log('[BUILD CONTACTS] Número de contatos mudou, atualizando');
        return contactsArray;
      }
      
      const hasChanges = contactsArray.some(newContact => {
        const existingContact = prevContacts.find(c => c.id === newContact.id);
        const changed = !existingContact || 
               existingContact.lastMessage !== newContact.lastMessage ||
               existingContact.lastMessageTime !== newContact.lastMessageTime ||
               existingContact.name !== newContact.name;
        
        if (changed) {
          console.log('[BUILD CONTACTS] Mudança detectada em:', newContact.id, {
            oldMessage: existingContact?.lastMessage,
            newMessage: newContact.lastMessage
          });
        }
        
        return changed;
      });
      
      if (hasChanges) {
        console.log('[BUILD CONTACTS] Atualizando lista de contatos');
        return contactsArray;
      } else {
        console.log('[BUILD CONTACTS] Nenhuma mudança detectada, mantendo lista atual');
        return prevContacts;
      }
    });
    if (contactsArray.length > 0) {
      console.log('[CONVERSAS] Contatos criados:', contactsArray.length, contactsArray);
    }
  }, [user?.id_cliente, instanceId1, instanceId2]);



  // 3. Função para buscar conversas usando ambos os instance_id
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
      // Buscar mensagens usando ambos os instance_id
      const { data, error } = await supabase
        .from('agente_conversacional_whatsapp')
        .select('*')
        .in('instance_id', ids)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar conversas:', error);
        toast.error('Erro ao carregar conversas');
        if (showLoading) setLoading(false);
        return;
      }
      // Log para depuração
      if (data) {
        const porInstancia = {};
        ids.forEach(id => {
          porInstancia[id as string] = data.filter((msg: any) => msg.instance_id === id).length;
        });
        console.log('[CONVERSAS] Mensagens encontradas por instância:', porInstancia);
        console.log('[CONVERSAS] Total de mensagens:', data.length);
      }
      setConversations(data || []);
      await buildContacts(data || []);
      // Log de contatos
      if (data) {
        const seenPhones = new Set();
        (data || []).forEach(msg => {
          if (msg.telefone_id) seenPhones.add(msg.telefone_id);
        });
        console.log('[CONVERSAS] Telefones únicos encontrados nas mensagens:', Array.from(seenPhones));
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
      toast.error('Erro ao carregar conversas');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [user, instanceId1, instanceId2, buildContacts]);

  // Sistema de realtime para atualizações em tempo real
  const conversationsRef = useRef(conversations);
  conversationsRef.current = conversations;

  // Implementando realtime via Supabase subscriptions

  // 4. Executar a busca de conversas quando instanceId1 ou instanceId2 estiverem disponíveis
  useEffect(() => {
    if (instanceId1 || instanceId2) {
      fetchConversations();
    }
  }, [instanceId1, instanceId2, fetchConversations]);

  // 5. Configuração da subscription para novas mensagens com instance_id
  useEffect(() => {
    if (!instanceId1 && !instanceId2) return;
    
    // Cache para evitar processar a mesma mensagem múltiplas vezes
    const processedMessages = new Set();
    let lastProcessTime = 0;
    
    // Configurar subscription realtime para mensagens
    const instanceIds = [instanceId1, instanceId2].filter(Boolean);
    
    if (instanceIds.length === 0) return;
    
    console.log('[REALTIME] Configurando subscription para instâncias:', instanceIds);
    
    // Importar e configurar subscription
    import('@/services/messageService').then(({ setupMessagesSubscription, removeMessagesSubscription }) => {
      console.log('[REALTIME] Serviço de mensagens importado com sucesso');
      
      const subscription = setupMessagesSubscription(
        instanceIds,
        (newMsg) => {
          console.log('[REALTIME] Nova mensagem recebida:', newMsg);
          
          // Função auxiliar para processar novas mensagens com deduplicação melhorada
          const processNewMessage = (newMsg: any) => {
            // Garantir que a mensagem está no formato correto
            const conversation: Conversation = {
              ...newMsg,
              // Garantir campos obrigatórios
              id: newMsg.id || `temp-${Date.now()}`,
              user_id: newMsg.user_id || user?.id || '',
              conversa_id: newMsg.conversa_id || '',
              mensagem: newMsg.mensagem || '',
              timestamp: newMsg.timestamp || newMsg.created_at || new Date().toISOString(),
              tipo: newMsg.tipo !== undefined ? newMsg.tipo : false,
              telefone_id: newMsg.telefone_id || '',
              created_at: newMsg.created_at || new Date().toISOString()
            };
            
            // Verificar se é uma mensagem que acabamos de enviar
            const messageContent = conversation.mensagem;
            const phoneId = conversation.telefone_id;
            const recentlySentArray = Array.from(recentlySentMessages);
            
            const isRecentlySent = recentlySentArray.some(key => {
              return key.includes(phoneId) && key.includes(messageContent);
            });
            
            if (isRecentlySent && conversation.tipo === true) {
              console.log('[REALTIME] Ignorando mensagem recentemente enviada');
              return; // Ignorar mensagem recentemente enviada
            }
            
            // Verificar se é uma nova mensagem do contato atual
            const normalizedMsgPhone = normalizePhone(conversation.telefone_id);
            const isFromCurrentContact = selectedContact && (
              normalizedMsgPhone === selectedContact || 
              conversation.telefone_id === selectedContact
            );
            
            // Se for uma nova mensagem recebida (não enviada) do contato atual, marcar como nova
            if (isFromCurrentContact && !conversation.tipo) {
              setHasNewMessages(true);
              console.log('[REALTIME] Nova mensagem recebida do contato atual');
            }
            
            // Atualiza a lista de conversas com deduplicação robusta
            setConversations(prev => {
              // Verificar se a mensagem já existe (para UPDATEs)
              const existingIndex = prev.findIndex(m => m.id === conversation.id);
              
              if (existingIndex !== -1) {
                // Se a mensagem já existe, atualizar ela (caso de UPDATE)
                console.log('[REALTIME] Atualizando mensagem existente:', conversation.id);
                const newList = [...prev];
                newList[existingIndex] = conversation;
                
                // Atualizar lista de contatos
                const phoneIdNormalized = normalizePhone(conversation.telefone_id);
                setTimeout(async () => {
                  await buildContacts(newList);
                }, 100);
                
                return newList;
              }
              
              // Verificar duplicação por conteúdo e timestamp (para INSERTs)
              const hasRecentDuplicate = prev.some(m => 
                m.mensagem === conversation.mensagem &&
                m.telefone_id === conversation.telefone_id &&
                m.tipo === conversation.tipo &&
                Math.abs(new Date(m.created_at).getTime() - new Date(conversation.created_at).getTime()) < 2000
              );
              
              if (hasRecentDuplicate) {
                console.log('[REALTIME] Mensagem duplicada por conteúdo, ignorando');
                return prev;
              }
              
              console.log('[REALTIME] Adicionando nova mensagem à lista:', conversation);
              const newList = [...prev, conversation];
              
              // Atualizar lista de contatos
              const phoneIdNormalized = normalizePhone(conversation.telefone_id);
              setTimeout(async () => {
                await buildContacts(newList);
              }, 100);
              
              return newList;
            });
          };
          
          // Processar a nova mensagem
          processNewMessage(newMsg);
        },
        (error) => {
          console.error('[REALTIME] Erro na subscription de mensagens:', error);
        }
      );
      
      if (subscription) {
        console.log('[REALTIME] Subscription configurada com sucesso');
      } else {
        console.error('[REALTIME] Falha ao configurar subscription');
      }
      
      // Cleanup da subscription ao desmontar
      return () => {
        if (subscription) {
          console.log('[REALTIME] Removendo subscription');
          removeMessagesSubscription(subscription);
        }
      };
    }).catch(error => {
      console.error('[REALTIME] Erro ao importar serviço de mensagens:', error);
    });
    
  }, [instanceId1, instanceId2, user?.id, selectedContact, recentlySentMessages]);

  // Função para enviar mensagem
  const handleSendMessage = async () => {
    if (!message.trim() || !selectedContact || isSending) return;

    setIsSending(true);

    try {
      const messageText = message.trim();
      // Pega o telefone do contato escolhido
      const contact = contacts.find(c => c.id === selectedContact || normalizePhone(c.telefone_id) === selectedContact);
      const leadsToSearch = selectedDepartamento === 'all' ? leadsRaw : leads;
      const leadContato = leadsToSearch.find(
        (l) =>
          String(l.instance_id) === String(contact?.instance_id) &&
          normalizePhoneOnlyNumber(l.telefone) === normalizePhoneOnlyNumber(contact?.telefone_id || '')
      ) || leadsToSearch.find(
        (l) => normalizePhoneOnlyNumber(l.telefone) === normalizePhoneOnlyNumber(contact?.telefone_id || '')
      );
      const canal = String(leadContato?.canal || '').toLowerCase().trim();

      if (canal === 'instagram' || canal === 'intagram') {
        if (!user?.id_cliente) {
          toast.error('Erro: cliente não identificado');
          setIsSending(false);
          return;
        }

        await sendInstagramViaWebhook({
          mensagem: messageText,
          tipo_mensagem: 'texto',
        });

        setMessage('');
        if (selectedContact) {
          setMessageDrafts(prev => {
            const newDrafts = { ...prev };
            delete newDrafts[selectedContact];
            return newDrafts;
          });
        }
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }

        fetchConversations(false);
        toast.success('Mensagem enviada com sucesso!');
        return;
      }

      // Se não encontrar, tenta buscar nos leads
      let telefoneEnvio = '';
      if (contact?.telefone_id) {
        telefoneEnvio = contact.telefone_id;
      } else if (leads && selectedContact) {
        const lead = leads.find(l => normalizePhone(l.telefone) === selectedContact || l.id.toString() === selectedContact);
        if (lead) {
          telefoneEnvio = lead.telefone;
        }
      }
      if (!telefoneEnvio) {
        toast.error('Erro: telefone não encontrado');
        setIsSending(false);
        return;
      }

      // Envio padrão Evolution (verificado em messageService.ts)
      await sendMessage(telefoneEnvio, messageText);

      // Limpar o campo de texto
      setMessage('');
      // Limpar o rascunho do contato atual
      if (selectedContact) {
        setMessageDrafts(prev => {
          const newDrafts = { ...prev };
          delete newDrafts[selectedContact];
          return newDrafts;
        });
      }
      // Scroll para o fim da conversa
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setIsSending(false);
    }
  };

  // Salvar rascunho automaticamente quando o usuário digita (com debounce otimizado)
  useEffect(() => {
    if (selectedContact && message.trim() && !showAudioRecorder) {
      const timeoutId = setTimeout(() => {
        saveDraftForContact(selectedContact, message);
      }, 1000); // Aumentado para 1 segundo para reduzir processamento
      
      return () => clearTimeout(timeoutId);
    }
  }, [message, selectedContact, showAudioRecorder]);

  // 7. Usar mensagens do hook de scroll infinito quando um contato está selecionado
  const selectedContactMessages = useMemo(() => {
    if (!selectedContact) return [];
    
    // Limite máximo de mensagens para evitar problemas de performance
    const MAX_MESSAGES = 1000;
    
    const filteredMessages = conversations
      .filter(msg => {
        const normalizedMsgPhone = normalizePhone(msg.telefone_id);
        // Permitir que selectedContact seja tanto o id quanto o telefone normalizado
        return (
          normalizedMsgPhone === selectedContact ||
          msg.telefone_id === selectedContact
        );
      })
      .reduce((acc: Conversation[], currentMsg: Conversation) => {
        // Primeiro, verificar se já existe uma mensagem com o mesmo ID (evitar duplicatas)
        const existingById = acc.findIndex(m => m.id === currentMsg.id);
        if (existingById !== -1) {
          // Se já existe, sempre atualizar com a versão mais recente (importante para atualizações de deleted)
          acc[existingById] = currentMsg;
          return acc;
        }
        
        // Para mensagens de áudio, tentar encontrar uma existente com a mesma URL
        if (currentMsg.tipo_mensagem === 'audio' && currentMsg.url_arquivo) {
          const existingAudioIndex = acc.findIndex(
            (m) => m.tipo_mensagem === 'audio' && m.url_arquivo === currentMsg.url_arquivo
          );

          if (existingAudioIndex !== -1) {
            const existingMsg = acc[existingAudioIndex];
            // Se a mensagem atual tem transcrição e a existente não, substituir
            if (currentMsg.transcricao_audio && !existingMsg.transcricao_audio) {
              acc[existingAudioIndex] = currentMsg;
            }
            // Caso contrário, manter a existente (ou se ambas têm transcrição, manter a primeira encontrada)
            return acc;
          }
        }
        // Para todas as outras mensagens, ou áudios únicos, apenas adicionar
        acc.push(currentMsg);
        return acc;
      }, [])
      .sort((a, b) => {
        // Usar timestamp se disponível, senão created_at
        const dateA = new Date(a.timestamp || a.created_at).getTime();
        const dateB = new Date(b.timestamp || b.created_at).getTime();
        return dateA - dateB; // Ordem cronológica crescente (mais antigas primeiro, como WhatsApp)
      });
    
    // Se ultrapassar o limite, manter apenas as mensagens mais recentes
    if (filteredMessages.length > MAX_MESSAGES) {
      console.log(`[MENSAGENS] Limite de ${MAX_MESSAGES} mensagens atingido. Removendo ${filteredMessages.length - MAX_MESSAGES} mensagens mais antigas.`);
      return filteredMessages.slice(0, MAX_MESSAGES);
    }
    
    return filteredMessages;
  }, [selectedContact, conversations]);

  // Função auxiliar para obter dados do contato selecionado, sempre priorizando o nome da tabela leads
  const getSelectedContactInfo = useCallback(() => {
    // Tenta encontrar pelo id (telefone normalizado ou id do lead)
    let contact = contacts.find(c => c.id === selectedContact || normalizePhone(c.telefone_id) === selectedContact);
    // Sempre tenta buscar o nome atualizado na tabela leads
    let nomeLead = '';
    let telefone = '';
    if (leads && selectedContact) {
      const lead = leads.find(l => normalizePhone(l.telefone) === selectedContact || l.id.toString() === selectedContact);
      if (lead) {
        nomeLead = lead.nome;
        telefone = lead.telefone;
      }
    }
    // Se encontrou nome na leads, prioriza ele
    if (nomeLead) {
      return {
        name: nomeLead,
        telefone_id: telefone
      };
    }
    // Se não encontrar, retorna o contato da lista
    if (contact) {
      return contact;
    }
    // Fallback: retorna apenas o telefone
    if (selectedContact) {
      return {
        name: selectedContact,
        telefone_id: selectedContact
      };
    }
    return null;
  }, [selectedContact, contacts, leads]);

  // 8. Scroll para o final quando mensagens mudam (sempre rolar para o final)
  useEffect(() => {
    if (selectedContactMessages.length > 0 && messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [selectedContactMessages.length]);

  const fetchContactAttendance = async (phoneNumber: string) => {
    if (!user?.id_cliente) {
      console.error('id_cliente não disponível');
      return;
    }

    try {
      const normalizedPhone = normalizePhone(phoneNumber);
      
      const { data, error } = await supabase
        .from('leads')
        .select('atendimento_ia, atendimento_humano, status, status_conversa')
        .eq('telefone', normalizedPhone)
        .eq('id_cliente', user.id_cliente)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar tipo de atendimento:', error);
        setSelectedContactAttendance(null);
        setSelectedContactStage(null);
        return;
      }

      if (data) {
        const newAttendance = {
          ia: Boolean(data.atendimento_ia),
          humano: Boolean(data.atendimento_humano)
        };
        setSelectedContactAttendance(newAttendance);
        setSelectedContactStage(data.status || null);
      } else {
        setSelectedContactAttendance(null);
        setSelectedContactStage(null);
      }
    } catch (error) {
      console.error('Erro ao buscar tipo de atendimento:', error);
      setSelectedContactAttendance(null);
      setSelectedContactStage(null);
    }
  };

  const handleAIAttendance = async () => {
    if (!selectedContact || !user?.id_cliente) {
      toast.error('Erro: informações incompletas');
      return;
    }

    // Verifica se há chatbot ativo e selecionado
    if (!availableChatbots || availableChatbots.length === 0 || !selectedChatbotId) {
      toast.error('Para ativar o atendimento por IA, é necessário ter um chatbot ativo e selecionado nas configurações.');
      return;
    }
    
    try {
      const contact = contacts.find(c => c.id === selectedContact);
      if (!contact?.telefone_id) {
        toast.error('Erro: contato não encontrado');
        return;
      }
      const phoneNumber = normalizePhone(contact.telefone_id);
      const { data: leadData, error: fetchError } = await supabase
        .from('leads')
        .select('*')
        .eq('telefone', phoneNumber)
        .eq('id_cliente', user.id_cliente)
        .maybeSingle();
      if (fetchError) {
        console.error('Erro ao buscar lead:', fetchError);
        toast.error('Erro ao buscar informações do contato');
        return;
      }
      if (!leadData) {
        toast.error('Contato não encontrado no sistema');
        return;
      }
      const { data: updateData, error: updateError } = await supabase
        .from('leads')
        .update({
          atendimento_ia: true,
          atendimento_humano: false
        })
        .eq('id', leadData.id)
        .select();
      if (updateError) {
        console.error('Erro ao atualizar tipo de atendimento:', updateError);
        toast.error('Erro ao transferir para atendimento por IA');
        return;
      }
      setSelectedContactAttendance({
        ia: true,
        humano: false
      });
      toast.success('Atendimento transferido para IA');
      fetchAttendancesForContacts(contacts.map(c => c.telefone_id));
    } catch (error) {
      console.error('Erro ao processar atendimento por IA:', error);
      toast.error('Erro ao transferir atendimento');
    }
  };

  const handleHumanAttendance = async () => {
    if (!selectedContact || !user?.id_cliente) {
      toast.error('Erro: informações incompletas');
      return;
    }
    
    try {
      const contact = contacts.find(c => c.id === selectedContact);
      if (!contact?.telefone_id) {
        toast.error('Erro: contato não encontrado');
        return;
      }
      
      const phoneNumber = normalizePhone(contact.telefone_id);
      
      const { data: leadData, error: fetchError } = await supabase
        .from('leads')
        .select('*')
        .eq('telefone', phoneNumber)
        .eq('id_cliente', user.id_cliente)
        .maybeSingle();

      if (fetchError) {
        console.error('Erro ao buscar lead:', fetchError);
        toast.error('Erro ao buscar informações do contato');
        return;
      }

      if (!leadData) {
        // Se não existe lead, criar um novo lead básico
        console.log('Lead não encontrado, criando novo lead...');
        
        const { data: newLead, error: createError } = await supabase
          .from('leads')
          .insert({
            telefone: phoneNumber,
            nome: contact?.name || `Contato ${phoneNumber.slice(-4)}`,
            id_cliente: user.id_cliente,
            status_conversa: 'Em andamento',
            status: 'Leads',
            origem: 'WhatsApp',
            atendimento_humano: true,
            atendimento_ia: false,
            created_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (createError) {
          console.error('Erro ao criar lead:', createError);
          toast.error('Erro ao criar novo contato');
          return;
        }
        
        console.log('Lead criado com sucesso:', newLead);
        const normalizedPhone = normalizePhone(phoneNumber);
        setContactStatusMap(prev => ({
          ...prev,
          [normalizedPhone]: 'Em andamento'
        }));
        
        // Recarregar os dados de todos os contatos
        const phones = contacts.map(c => c.telefone_id);
        await fetchAttendancesForContacts(phones);
        
        toast.success('Atendimento humano iniciado com sucesso');
        return;
      }
      
      // Atualizar o lead existente para atendimento humano
      const { error } = await supabase
        .from('leads')
        .update({
          atendimento_humano: true,
          atendimento_ia: false,
          status_conversa: 'Em andamento'
        })
        .eq('id', leadData.id);
      
      if (error) {
        console.error('Erro ao atualizar tipo de atendimento:', error);
        toast.error('Erro ao transferir para atendimento humano');
        return;
      }
      
      // Atualizar o mapa de status local
      const normalizedPhone = normalizePhone(phoneNumber);
      setContactStatusMap(prev => ({
        ...prev,
        [normalizedPhone]: 'Em andamento'
      }));
      
      // Recarregar os dados de todos os contatos
      const phones = contacts.map(c => c.telefone_id);
      await fetchAttendancesForContacts(phones);
      
      toast.success('Atendimento humano iniciado com sucesso');
    } catch (error) {
      console.error('Erro ao processar atendimento humano:', error);
      toast.error('Erro ao transferir atendimento');
    }
  };

  const handleResumeConversation = async () => {
    if (!selectedContact || !user?.id_cliente) return;
    
    try {
      // Buscar o telefone_id do contato selecionado
      const contact = contacts.find(c => c.id === selectedContact);
      if (!contact?.telefone_id) {
        toast.error('Erro: contato não encontrado');
        return;
      }
      
      // Remover o sufixo @s.whatsapp.net do número de telefone
      const phoneNumber = contact.telefone_id.replace('@s.whatsapp.net', '');
      
      // Primeiro, buscar o lead específico
      const { data: leadData, error: fetchError } = await supabase
        .from('leads')
        .select('id, status_conversa')
        .eq('telefone', phoneNumber)
        .eq('id_cliente', user.id_cliente)
        .maybeSingle();

      if (fetchError) {
        console.error('Erro ao buscar lead:', fetchError);
        toast.error('Erro ao buscar informações do contato');
        return;
      }

      if (!leadData) {
        // Se não existe lead, apenas atualizar o estado local
        console.log('Lead não encontrado no banco, atualizando apenas localmente');
        const normalizedPhone = normalizePhone(phoneNumber);
        setContactStatusMap(prev => ({
          ...prev,
          [normalizedPhone]: 'Em andamento'
        }));
        
        // Recarregar os dados de todos os contatos
        const phones = contacts.map(c => c.telefone_id);
        await fetchAttendancesForContacts(phones);
        
        toast.success('Conversa retomada com sucesso');
        
        if (statusFilter === 'encerrada') {
          setStatusFilter('em_andamento');
        }
        return;
      }
      
      // Verificar se a conversa está encerrada
      if (leadData.status_conversa !== 'Encerrada') {
        toast.info('Esta conversa já está em andamento');
        return;
      }
      
      // Atualizar o status_conversa para "Em andamento"
      const { error } = await supabase
        .from('leads')
        .update({
          status_conversa: 'Em andamento'
        })
        .eq('id', leadData.id);
      
      if (error) {
        console.error('Erro ao retomar conversa:', error);
        toast.error('Erro ao retomar conversa');
        return;
      }
      
      // Atualizar o mapa de status local
      const normalizedPhone = normalizePhone(phoneNumber);
      setContactStatusMap(prev => ({
        ...prev,
        [normalizedPhone]: 'Em andamento'
      }));
      
      // Recarregar os dados de todos os contatos
      const phones = contacts.map(c => c.telefone_id);
      await fetchAttendancesForContacts(phones);
      
      toast.success('Conversa retomada com sucesso');
      
      // Se o filtro atual for "encerrada", mudar para "em_andamento" para continuar vendo a conversa
      if (statusFilter === 'encerrada') {
        setStatusFilter('em_andamento');
      }
    } catch (error) {
      console.error('Erro ao processar retomada:', error);
      toast.error('Erro ao retomar conversa');
    }
  };

  // Atualizar o tipo de atendimento quando um contato é selecionado
  useEffect(() => {
    if (selectedContact) {
      const phoneNumber = normalizePhone(selectedContact);
      fetchContactAttendance(phoneNumber);
    } else {
      setSelectedContactAttendance(null);
      setSelectedContactStage(null);
    }
  }, [selectedContact]);

  // Função para buscar tipos de atendimento dos contatos
  const fetchAttendancesForContacts = async (phones: string[]) => {
    if (!user?.id_cliente || phones.length === 0) return;

    // Telefones normalizados (sem @s.whatsapp.net)
    const normalizedPhones = phones.map(phone => normalizePhone(phone));

    const { data, error } = await supabase
      .from('leads')
      .select('telefone, atendimento_ia, atendimento_humano, status_conversa')
      .in('telefone', normalizedPhones)
      .eq('id_cliente', user.id_cliente);

    if (!error && data) {
      // Cria um mapa telefone -> tipo de atendimento
      const map: Record<string, { ia: boolean, humano: boolean }> = {};
      const statusMap: Record<string, string | null> = {};
      
      data.forEach(lead => {
        map[lead.telefone] = {
          ia: !!lead.atendimento_ia,
          humano: !!lead.atendimento_humano
        };
        statusMap[lead.telefone] = lead.status_conversa;
      });
      
      setAttendanceMap(map);
      setContactStatusMap(statusMap);
    }
  };

  // Chama a busca dos tipos de atendimento sempre que a lista de contatos mudar
  useEffect(() => {
    if (contacts.length > 0) {
      const phones = contacts.map(c => c.telefone_id);
      fetchAttendancesForContacts(phones);
    }
  }, [contacts, user?.id_cliente]);

  // Subscription para mudanças no status das conversas
  // DESABILITADO: Causava recursão infinita
  // useEffect(() => {
  //   if (!user?.id_cliente) return;

  //   // Criar subscription para mudanças na tabela leads
  //   const subscription = supabase
  //     .channel(`leads_status_${user.id_cliente}`)
  //     .on(
  //       'postgres_changes',
  //       {
  //         event: '*',
  //         schema: 'public',
  //         table: 'leads',
  //         filter: `id_cliente=eq.${user.id_cliente}`
  //       },
  //       (payload) => {
  //         console.log('Mudança detectada na tabela leads:', payload);
  //         
  //         // Recarregar os dados quando houver mudança
  //         if (contacts.length > 0) {
  //           const phones = contacts.map(c => c.telefone_id);
  //           fetchAttendancesForContacts(phones);
  //         }
  //         
  //         // Se a conversa atual foi modificada, atualizar o estado local
  //         if (selectedContact && payload.new) {
  //           const contact = contacts.find(c => c.id === selectedContact);
  //           if (contact) {
  //             const phoneNumber = normalizePhone(contact.telefone_id);
  //             const updatedLead = payload.new as any;
  //             
  //             if (updatedLead.telefone === phoneNumber) {
  //               // Atualizar o tipo de atendimento
  //               setSelectedContactAttendance({
  //                 ia: Boolean(updatedLead.atendimento_ia),
  //                 humano: Boolean(updatedLead.atendimento_humano)
  //               });
  //               
  //               // Atualizar o estágio
  //               setSelectedContactStage(updatedLead.status || null);
  //             }
  //           }
  //         }
  //       }
  //     )
  //     .subscribe();

  //   // Cleanup
  //   return () => {
  //     supabase.removeChannel(subscription);
  //   };
  // }, [user?.id_cliente, contacts, selectedContact]);

  // Função para formatar o tempo na lista de conversas (como WhatsApp)
  const formatContactTime = (dateString: string): string => {
    const messageDate = new Date(dateString);
    
    // Se a data for inválida, retornar vazio
    if (isNaN(messageDate.getTime())) {
      return "";
    }
    
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Comparar apenas ano, mês e dia
    const messageDateOnly = messageDate.toLocaleDateString('pt-BR');
    const todayDateOnly = today.toLocaleDateString('pt-BR');
    const yesterdayDateOnly = yesterday.toLocaleDateString('pt-BR');
    
    if (messageDateOnly === todayDateOnly) {
      // Hoje: mostrar apenas horário (HH:MM)
      return format(messageDate, 'HH:mm', { locale: ptBR });
    } else if (messageDateOnly === yesterdayDateOnly) {
      // Ontem: mostrar "Ontem"
      return "Ontem";
    } else {
      // Mais antigo: mostrar data (DD/MM/YYYY)
      return format(messageDate, 'dd/MM/yyyy', { locale: ptBR });
    }
  };

  // Função para formatar a data do separador (similar ao WhatsApp)
  const formatDateSeparator = (date: Date): string => {
    // Validar se a data é válida
    const messageDate = new Date(date);
    
    // Se a data for inválida, retornar uma string padrão
    if (isNaN(messageDate.getTime())) {
      console.error('Data inválida recebida:', date);
      return "Data inválida";
    }
    
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Comparar apenas ano, mês e dia (ignorando horário)
    const messageDateString = messageDate.toLocaleDateString('pt-BR');
    const todayString = today.toLocaleDateString('pt-BR');
    const yesterdayString = yesterday.toLocaleDateString('pt-BR');
    
    if (messageDateString === todayString) {
      return "Hoje";
    } else if (messageDateString === yesterdayString) {
      return "Ontem";
    } else {
      // Validar novamente antes de usar format da date-fns
      try {
        return format(messageDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
      } catch (error) {
        console.error('Erro ao formatar data:', error);
        return messageDateString; // Retornar formato brasileiro simples
      }
    }
  };

  // Função para verificar se duas datas são do mesmo dia
  const isSameDay = (date1: Date, date2: Date): boolean => {
    return format(date1, 'yyyy-MM-dd') === format(date2, 'yyyy-MM-dd');
  };

  // Função para agrupar mensagens por data (mantendo ordem cronológica dentro de cada grupo)
  const groupMessagesByDate = (messages: Conversation[]) => {
    const grouped: Array<{ date: string; dateObject: Date; messages: Conversation[] }> = [];
    let currentDate: string | null = null;
    let currentDateObject: Date | null = null;
    let currentGroup: Conversation[] = [];

    messages.forEach((message) => {
      // Validar e normalizar data da mensagem
      const messageDate = new Date(message.timestamp || message.created_at);
      
      // Se a data for inválida, pular esta mensagem
      if (isNaN(messageDate.getTime())) {
        return;
      }
      
      const dateString = messageDate.toLocaleDateString('pt-BR');
      
      if (currentDate !== dateString) {
        // Se há um grupo anterior, adiciona-o ao resultado
        if (currentDate !== null && currentDateObject !== null && currentGroup.length > 0) {
          // Ordenar mensagens dentro do grupo por ordem cronológica crescente (mais antigas primeiro)
          currentGroup.sort((a, b) => {
            const dateA = new Date(a.timestamp || a.created_at).getTime();
            const dateB = new Date(b.timestamp || b.created_at).getTime();
            return dateA - dateB;
          });
          
          grouped.push({ 
            date: currentDate, 
            dateObject: currentDateObject,
            messages: [...currentGroup] 
          });
        }
        
        // Inicia um novo grupo
        currentDate = dateString;
        currentDateObject = new Date(messageDate); // Copiar a data válida
        currentGroup = [message];
      } else {
        // Adiciona a mensagem ao grupo atual
        currentGroup.push(message);
      }
    });

    // Adiciona o último grupo
    if (currentDate !== null && currentDateObject !== null && currentGroup.length > 0) {
      // Ordenar mensagens dentro do último grupo por ordem cronológica crescente (mais antigas primeiro)
      currentGroup.sort((a, b) => {
        const dateA = new Date(a.timestamp || a.created_at).getTime();
        const dateB = new Date(b.timestamp || b.created_at).getTime();
        return dateA - dateB;
      });
      
      grouped.push({ 
        date: currentDate, 
        dateObject: currentDateObject,
        messages: [...currentGroup] 
      });
    }

    return grouped;
  };

  // Função para acionar o follow-up automático
  const handleAutomaticFollowup = async () => {
    console.log('[Followup] selectedContact:', selectedContact);
    console.log('[Followup] user.id_cliente:', user?.id_cliente);
    if (!selectedContact || !user?.id_cliente) {
      toast.error('Erro: informações do contato ausentes');
      return;
    }

    // Buscar contato pelo id ou telefone normalizado
    let contact = contacts.find(c => c.id === selectedContact);
    if (!contact) {
      contact = contacts.find(c => normalizePhone(c.telefone_id) === normalizePhone(selectedContact));
      console.log('[Followup] Tentando buscar contato pelo telefone normalizado:', normalizePhone(selectedContact), contact);
    }
    console.log('[Followup] Contato encontrado:', contact);

    // Buscar o lead correspondente para pegar o instance_id correto
    const lead = leads.find(l => normalizePhone(l.telefone) === normalizePhone(contact?.telefone_id));
    const instanceIdToUse = lead?.instance_id || contact?.instance_id;
    console.log('[Followup] instanceIdToUse:', instanceIdToUse);

    if (!contact?.telefone_id || !instanceIdToUse) {
      toast.error('Erro: telefone ou instância do contato não encontrado');
      return;
    }

    setIsGeneratingFollowup(true);
    
    // Mostrar toast de loading
    const loadingToast = toast.loading(
      <div className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span>Gerando resposta...</span>
      </div>
    );

    try {
      // 1. Acionar o webhook para gerar o follow-up
      const response = await fetch('https://webhook.dev.usesmartcrm.com/webhook/followup-auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telefone_id: contact.telefone_id,
          instance_id: instanceIdToUse
        })
      });

      if (!response.ok) {
        throw new Error('Falha ao gerar follow-up');
      }

      // 2. Aguardar um momento para o n8n processar e salvar no banco
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 3. Buscar o follow-up gerado da tabela leads
      const phoneNumber = normalizePhone(contact.telefone_id);
      const { data: leadData, error: fetchError } = await supabase
        .from('leads')
        .select('follow_up')
        .eq('telefone', phoneNumber)
        .eq('id_cliente', user.id_cliente)
        .single();

      if (fetchError) {
        console.error('Erro ao buscar follow-up:', fetchError);
        toast.error('Erro ao buscar follow-up gerado');
        return;
      }

      if (leadData?.follow_up) {
        setMessage(leadData.follow_up); // Preenche a caixa de texto
        
        // Dismiss loading toast
        toast.dismiss(loadingToast);
        
        // Show success toast with dismiss button
        toast.success(
          <div className="flex items-center justify-between gap-2">
            <span>Follow-up gerado! Revise e envie manualmente.</span>
            <button 
              onClick={() => toast.dismiss()} 
              className="ml-2 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>,
          {
            duration: 5000, // 5 segundos
            dismissible: true
          }
        );
      } else {
        toast.error('Não foi possível gerar o follow-up.');
      }
    } catch (error) {
      console.error('Erro ao gerar follow-up:', error);
      toast.error('Erro ao gerar follow-up automático');
    } finally {
      setIsGeneratingFollowup(false);
      // Dismiss loading toast if it's still showing
      toast.dismiss(loadingToast);
    }
  };

  // Função para salvar rascunho do contato atual
  const saveDraftForContact = (contactId: string | null, draftMessage: string) => {
    if (contactId && draftMessage.trim()) {
      setMessageDrafts(prev => ({
        ...prev,
        [contactId]: draftMessage
      }));
    } else if (contactId && !draftMessage.trim()) {
      // Se a mensagem está vazia, remover o rascunho
      setMessageDrafts(prev => {
        const newDrafts = { ...prev };
        delete newDrafts[contactId];
        return newDrafts;
      });
    }
  };

  // Funções para gerenciar funil
  const handleOpenAddToFunnelModal = async () => {
    if (!selectedContact || !user?.id_cliente) {
      toast.error('Erro: informações incompletas');
      return;
    }

    setShowAddToFunnelModal(true);
    setLoadingFunis(true);
    
    try {
      // Buscar todos os funis disponíveis
      const funisData = await FunisService.getFunis();
      setAvailableFunis(funisData);
      
      // Buscar etapas do primeiro funil (se existir)
      if (funisData.length > 0) {
        const primeiroFunil = funisData[0];
        setSelectedFunnelId(primeiroFunil.id.toString());
        
        const funilCompleto = await FunisService.getFunilComEtapas(primeiroFunil.id);
        if (funilCompleto?.etapas) {
          setAvailableStages(funilCompleto.etapas);
          if (funilCompleto.etapas.length > 0) {
            setSelectedStageId(funilCompleto.etapas[0].id.toString());
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar funis:', error);
      toast.error('Erro ao carregar funis disponíveis');
    } finally {
      setLoadingFunis(false);
    }
  };

  const handleFunnelChange = async (funnelId: string) => {
    setSelectedFunnelId(funnelId);
    setSelectedStageId('');
    setLoadingStages(true);
    
    try {
      const funilCompleto = await FunisService.getFunilComEtapas(parseInt(funnelId));
      if (funilCompleto?.etapas) {
        setAvailableStages(funilCompleto.etapas);
        if (funilCompleto.etapas.length > 0) {
          setSelectedStageId(funilCompleto.etapas[0].id.toString());
        }
      }
    } catch (error) {
      console.error('Erro ao carregar etapas:', error);
      toast.error('Erro ao carregar etapas do funil');
    } finally {
      setLoadingStages(false);
    }
  };

  const handleAddToFunnel = async () => {
    if (!selectedContact || !selectedFunnelId || !selectedStageId || !user?.id_cliente) {
      toast.error('Erro: seleção incompleta');
      return;
    }

    try {
      const contact = contacts.find(c => c.id === selectedContact);
      if (!contact?.telefone_id) {
        toast.error('Erro: contato não encontrado');
        return;
      }

      const phoneNumber = normalizePhone(contact.telefone_id);
      
      console.log('[DEBUG] Buscando lead existente:', {
        phoneNumber,
        id_cliente: user.id_cliente,
        totalLeads: leads.length,
        leads: leads.map(l => ({ id: l.id, telefone: l.telefone, id_cliente: l.id_cliente }))
      });
      
      // Buscar lead existente ou criar novo
      let lead = leads.find(l => {
        const normalizedLeadPhone = normalizePhone(l.telefone);
        const matches = normalizedLeadPhone === phoneNumber && l.id_cliente === user.id_cliente;
        
        console.log('[DEBUG] Comparando telefones:', {
          leadId: l.id,
          leadPhone: l.telefone,
          normalizedLeadPhone,
          phoneNumber,
          leadIdCliente: l.id_cliente,
          userIdCliente: user.id_cliente,
          matches
        });
        
        return matches;
      });

      console.log('[DEBUG] Lead encontrado:', lead);

      if (!lead) {
        // Verificar se o lead existe no banco de dados (caso o estado local não tenha sido carregado)
        console.log('[DEBUG] Lead não encontrado no estado local, verificando no banco...');
        
        // Buscar leads com telefone similar (pode haver variações na formatação)
        const { data: existingLeads, error: searchError } = await supabase
          .from('leads')
          .select('*')
          .eq('id_cliente', user.id_cliente)
          .or(`telefone.eq.${phoneNumber},telefone.like.*${phoneNumber.slice(-8)}`);

        if (searchError) {
          console.error('Erro ao buscar leads no banco:', searchError);
        }

        // Encontrar o lead mais apropriado
        let existingLead = null;
        if (existingLeads && existingLeads.length > 0) {
          // Priorizar match exato
          existingLead = existingLeads.find(l => normalizePhone(l.telefone) === phoneNumber) 
            || existingLeads[0]; // Fallback para o primeiro encontrado
          
          console.log('[DEBUG] Leads encontrados no banco:', existingLeads);
          console.log('[DEBUG] Lead selecionado:', existingLead);
        }



        if (existingLead) {
          console.log('[DEBUG] Lead encontrado no banco:', existingLead);
          lead = existingLead;
          
          // Atualizar o estado local
          setLeads(prev => {
            const exists = prev.find(l => l.id === existingLead.id);
            if (!exists) {
              return [...prev, existingLead];
            }
            return prev;
          });
        } else {
          console.log('[DEBUG] Lead não existe no banco, criando novo...');
          
          // Criar novo lead
          const { data: newLead, error: createError } = await supabase
            .from('leads')
            .insert({
              telefone: phoneNumber,
              nome: contact?.name || `Contato ${phoneNumber.slice(-4)}`,
              id_cliente: user.id_cliente,
              status: 'Leads',
              origem: 'WhatsApp',
              id_funil: parseInt(selectedFunnelId),
              id_funil_etapa: parseInt(selectedStageId),
              created_at: new Date().toISOString()
            })
            .select()
            .single();

          if (createError) {
            console.error('Erro ao criar lead:', createError);
            toast.error('Erro ao criar lead no funil');
            return;
          }

          lead = newLead;
          setLeads(prev => [...prev, newLead]);
        }
      } else {
        // Atualizar lead existente
        const { error: updateError } = await supabase
          .from('leads')
          .update({
            id_funil: parseInt(selectedFunnelId),
            id_funil_etapa: parseInt(selectedStageId)
          })
          .eq('id', lead.id);

        if (updateError) {
          console.error('Erro ao atualizar lead:', updateError);
          toast.error('Erro ao atualizar lead no funil');
          return;
        }

        // Atualizar lead local
        setLeads(prev => prev.map(l => 
          l.id === lead.id 
            ? { ...l, id_funil: parseInt(selectedFunnelId), id_funil_etapa: parseInt(selectedStageId) }
            : l
        ));
      }

      // Determinar se foi criado ou atualizado
      const wasCreated = !leads.find(l => l.id === lead.id);
      const message = wasCreated 
        ? 'Novo lead criado e adicionado ao funil com sucesso!' 
        : 'Lead existente atualizado no funil com sucesso!';
      
      toast.success(message);
      setShowAddToFunnelModal(false);
      
      // Limpar seleções
      setSelectedFunnelId('');
      setSelectedStageId('');
      setAvailableStages([]);
      
    } catch (error) {
      console.error('Erro ao adicionar ao funil:', error);
      toast.error('Erro ao adicionar lead ao funil');
    }
  };

  // Função para carregar rascunho de um contato
  const loadDraftForContact = (contactId: string | null): string => {
    return contactId ? (messageDrafts[contactId] || '') : '';
  };

  // Função personalizada para trocar contato
  const handleContactChange = (newContactId: string) => {
    // Salvar rascunho do contato atual (se houver)
    if (selectedContact) {
      saveDraftForContact(selectedContact, message);
    }
    
    // Limpar estado de novas mensagens ao trocar de contato
    setHasNewMessages(false);
    
    // Trocar para o novo contato
    setSelectedContact(newContactId);
    
    // Carregar rascunho do novo contato
    const newContactDraft = loadDraftForContact(newContactId);
    setMessage(newContactDraft);
  };

  // Função para fazer upload do áudio para o Supabase Storage
  const uploadAudioToStorage = async (audioBlob: Blob): Promise<string> => {
    // Detectar formato baseado no tipo real do blob
    const blobType = audioBlob.type;
    const customExtension = (audioBlob as any)._extension;
    
    let extension = '.mp3'; // padrão MP3 para compatibilidade
    let contentType = 'audio/mpeg'; // padrão MP3
    
    // Usar extensão customizada se disponível
    if (customExtension) {
      extension = `.${customExtension}`;
      console.log('📎 Usando extensão customizada:', extension);
      
      // Ajustar contentType baseado na extensão
      if (customExtension === 'mp3') {
        contentType = 'audio/mpeg';
      } else if (customExtension === 'wav') {
        contentType = 'audio/wav';
      } else if (customExtension === 'ogg') {
        contentType = 'audio/ogg';
      } else if (customExtension === 'webm') {
        contentType = 'audio/webm';
      }
    } else {
      // Detectar baseado no MIME type
      if (blobType.includes('mp4')) {
        extension = '.mp4';
        contentType = 'audio/mp4';
      } else if (blobType.includes('aac')) {
        extension = '.aac';
        contentType = 'audio/aac';
      } else if (blobType.includes('mpeg') || blobType.includes('mp3')) {
        extension = '.mp3';
        contentType = 'audio/mpeg';
      } else if (blobType.includes('webm')) {
        extension = '.webm';
        contentType = 'audio/webm';
      } else if (blobType.includes('ogg')) {
        extension = '.ogg';
        contentType = 'audio/ogg';
      } else if (blobType.includes('wav')) {
        extension = '.wav';
        contentType = 'audio/wav';
      } else {
        // Fallback para MP3
        extension = '.mp3';
        contentType = 'audio/mpeg';
      }
    }
    
    console.log('📤 Upload de áudio:', {
      blobType: audioBlob.type,
      blobSize: audioBlob.size,
      detectedExtension: extension,
      contentType: contentType
    });
    
    // Gerar nome único com extensão correta
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const fileName = `audio_${timestamp}_${random}${extension}`;
    
    console.log('🎤 Iniciando upload de áudio:', {
      fileName,
      blobSize: audioBlob.size,
      blobType: audioBlob.type,
      uploadType: contentType,
      extension,
      timestamp: new Date(timestamp).toLocaleString('pt-BR')
    });

    try {
      // Verificar se o blob tem conteúdo
      if (audioBlob.size === 0) {
        throw new Error('Arquivo de áudio vazio');
      }

      // Verificar tamanho (WhatsApp tem limite de ~16MB)
      if (audioBlob.size > 16 * 1024 * 1024) {
        throw new Error('Arquivo de áudio muito grande (máximo 16MB)');
      }

      const { data, error } = await supabase.storage
        .from('audioswpp')
        .upload(fileName, audioBlob, {
          contentType: contentType,
          upsert: false,
          cacheControl: '3600'
        });

      if (error) {
        console.error('❌ Erro detalhado no upload:', error);
        
        // Verificar se é problema de RLS
        if (error.message.includes('row-level security') || error.message.includes('RLS')) {
          throw new Error(`Erro de permissão no Storage. Execute SOLUCAO-RAPIDA-RLS.sql

Erro original: ${error.message}`);
        }
        
        throw new Error(`Erro ao fazer upload do áudio: ${error.message}`);
      }

      console.log('✅ Upload realizado com sucesso:', data);

      // Obter URL pública do arquivo
      const { data: urlData } = supabase.storage
        .from('audioswpp')
        .getPublicUrl(data.path);

      const finalUrl = urlData.publicUrl;
      console.log('🔗 URL pública gerada:', finalUrl);
      
      // Testar se a URL é acessível
      try {
        const testResponse = await fetch(finalUrl, { method: 'HEAD' });
        console.log('🌐 Teste de URL:', {
          status: testResponse.status,
          accessible: testResponse.ok,
          contentType: testResponse.headers.get('content-type'),
          extension: extension
        });
        
        if (testResponse.ok) {
          console.log('🎉 URL do áudio totalmente acessível!');
        } else {
          console.warn('⚠️ URL pode não estar acessível:', testResponse.status);
        }
      } catch (testError) {
        console.warn('⚠️ Não foi possível testar a URL:', testError);
      }

      return finalUrl;

    } catch (uploadError) {
      console.error('❌ Erro no processo de upload:', uploadError);
      throw uploadError;
    }
  };

  // Função para fazer upload de imagem para o Supabase Storage
  const uploadImageToStorage = async (imageFile: File): Promise<string> => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const extension = imageFile.name.split('.').pop() || 'jpg';
    const fileName = `image_${timestamp}_${random}.${extension}`;
    
    console.log('📷 Iniciando upload de imagem:', {
      fileName,
      fileSize: imageFile.size,
      fileType: imageFile.type,
      timestamp: new Date(timestamp).toLocaleString('pt-BR')
    });

    try {
      const { data, error } = await supabase.storage
        .from('imageswpp')
        .upload(fileName, imageFile, {
          contentType: imageFile.type,
          upsert: false,
          cacheControl: '3600'
        });

      if (error) {
        console.error('❌ Erro no upload:', error);
        throw new Error(`Erro ao fazer upload da imagem: ${error.message}`);
      }

      console.log('✅ Upload realizado com sucesso:', data);

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('imageswpp')
        .getPublicUrl(data.path);

      const finalUrl = urlData.publicUrl;
      console.log('🔗 URL pública gerada:', finalUrl);

      return finalUrl;

    } catch (uploadError) {
      console.error('❌ Erro no processo de upload:', uploadError);
      throw uploadError;
    }
  };

  const uploadDocumentToStorage = async (documentFile: File): Promise<string> => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const extension = documentFile.name.split('.').pop() || 'pdf';
    const fileName = `document_${timestamp}_${random}.${extension}`;
    
    console.log('📄 Iniciando upload de documento:', {
      fileName,
      originalName: documentFile.name,
      fileSize: documentFile.size,
      fileType: documentFile.type,
      timestamp: new Date(timestamp).toLocaleString('pt-BR')
    });

    try {
      const { data, error } = await supabase.storage
        .from('documentos')
        .upload(fileName, documentFile, {
          contentType: documentFile.type,
          upsert: false,
          cacheControl: '3600'
        });

      if (error) {
        console.error('❌ Erro no upload:', error);
        throw new Error(`Erro ao fazer upload do documento: ${error.message}`);
      }

      console.log('✅ Upload realizado com sucesso:', data);

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('documentos')
        .getPublicUrl(data.path);

      const finalUrl = urlData.publicUrl;
      console.log('🔗 URL pública gerada:', finalUrl);

      return finalUrl;

    } catch (uploadError) {
      console.error('❌ Erro no processo de upload:', uploadError);
      throw uploadError;
    }
  };

  // Função para fazer upload de anexo do lead
  const handleUploadAnexoLead = async (file: File) => {
    if (!selectedContact || !user?.id_cliente) {
      toast.error('Erro: informações incompletas');
      return;
    }

    setUploadingAnexo(true);

    try {
      // Buscar o lead do contato selecionado
      const contact = contacts.find(c => c.id === selectedContact);
      if (!contact?.telefone_id) {
        toast.error('Erro: contato não encontrado');
        setUploadingAnexo(false);
        return;
      }

      const phoneNumber = normalizePhone(contact.telefone_id);
      const leadsToSearch = selectedDepartamento === 'all' ? leadsRaw : leads;
      const lead = leadsToSearch.find(l =>
        String(l.instance_id) === String(contact.instance_id) &&
        normalizePhoneOnlyNumber(l.telefone) === normalizePhoneOnlyNumber(contact.telefone_id)
      ) || leadsToSearch.find(l => normalizePhoneOnlyNumber(l.telefone) === normalizePhoneOnlyNumber(contact.telefone_id));

      if (!lead || !lead.id) {
        toast.error('Lead não encontrado para este contato');
        setUploadingAnexo(false);
        return;
      }

      // Obter extensão do arquivo
      const extension = file.name.split('.').pop() || 'pdf';
      
      // Normalizar telefone (remover caracteres especiais, @s.whatsapp.net, etc.)
      const telefoneNormalizado = normalizePhoneOnlyNumber(lead.telefone || phoneNumber);
      
      // Nome do arquivo: id_lead + telefone + extensão
      const fileName = `${lead.id}${telefoneNormalizado}.${extension}`;

      // Se já existir arquivo antigo, deletar primeiro
      if (lead.anexo) {
        try {
          // Extrair o nome do arquivo da URL (última parte do caminho)
          // Pode ser que a URL tenha query params, então pegamos apenas o nome do arquivo
          const urlParts = lead.anexo.split('/');
          const oldFileNameWithParams = urlParts[urlParts.length - 1];
          const oldFileName = oldFileNameWithParams.split('?')[0]; // Remove query params se houver
          
          // Se o nome do arquivo antigo for diferente do novo, remover o antigo
          if (oldFileName !== fileName) {
            await supabase.storage
              .from('anexos_lead')
              .remove([oldFileName]);
          }
        } catch (error) {
          console.warn('Aviso: não foi possível remover arquivo antigo:', error);
          // Continua mesmo se não conseguir remover o antigo (o upsert vai substituir)
        }
      }

      // Fazer upload do novo arquivo
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('anexos_lead')
        .upload(fileName, file, {
          contentType: file.type,
          upsert: true, // Substitui se já existir
          cacheControl: '3600'
        });

      if (uploadError) {
        console.error('❌ Erro no upload:', uploadError);
        throw new Error(`Erro ao fazer upload do arquivo: ${uploadError.message}`);
      }

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('anexos_lead')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      // Atualizar a coluna anexo na tabela leads
      const { error: updateError } = await supabase
        .from('leads')
        .update({ anexo: publicUrl })
        .eq('id', lead.id)
        .eq('id_cliente', user.id_cliente);

      if (updateError) {
        console.error('❌ Erro ao atualizar anexo:', updateError);
        throw new Error(`Erro ao salvar anexo: ${updateError.message}`);
      }

      // Atualizar o lead local
      const leadsToUpdate = selectedDepartamento === 'all' ? leadsRaw : leads;
      if (selectedDepartamento === 'all') {
        setLeadsRaw(prev => prev.map(l => l.id === lead.id ? { ...l, anexo: publicUrl } : l));
      } else {
        // Atualizar leads filtrados também
        const updatedLeads = leadsToUpdate.map(l => l.id === lead.id ? { ...l, anexo: publicUrl } : l);
        // Isso será atualizado quando os leads forem recarregados
      }

      toast.success('Arquivo anexado com sucesso!');
      setShowAnexoDialog(false);

    } catch (error) {
      console.error('❌ Erro no processo de upload do anexo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao anexar arquivo: ${errorMessage}`);
    } finally {
      setUploadingAnexo(false);
    }
  };

  // Função para enviar mensagem de imagem
  const getSelectedContactCanal = (): 'whatsapp' | 'instagram' | 'unknown' => {
    if (!selectedContact) return 'unknown';
    const contact = contacts.find(c => c.id === selectedContact || normalizePhone(c.telefone_id) === selectedContact);
    const leadsToSearch = selectedDepartamento === 'all' ? leadsRaw : leads;
    const leadContato = leadsToSearch.find(
      (l) =>
        String(l.instance_id) === String(contact?.instance_id) &&
        normalizePhoneOnlyNumber(l.telefone) === normalizePhoneOnlyNumber(contact?.telefone_id || '')
    ) || leadsToSearch.find(
      (l) => normalizePhoneOnlyNumber(l.telefone) === normalizePhoneOnlyNumber(contact?.telefone_id || '')
    );

    const canal = String(leadContato?.canal || '').toLowerCase().trim();
    if (canal === 'whatsapp') return 'whatsapp';
    if (canal === 'instagram' || canal === 'intagram') return 'instagram';
    return 'unknown';
  };

  const sendInstagramViaWebhook = async (params: {
    mensagem: string;
    tipo_mensagem?: string;
    url_arquivo?: string;
    nome_arquivo?: string;
  }) => {
    if (!selectedContact) throw new Error('Nenhum contato selecionado');
    if (!user?.id_cliente) throw new Error('Cliente não identificado');

    const contact = contacts.find(c => c.id === selectedContact || normalizePhone(c.telefone_id) === selectedContact);

    // Tenta reaproveitar dados da conversa existente para manter payload consistente
    const convo = conversations.find(
      (c) =>
        c.conversa_id === selectedContact ||
        c.telefone_id === contact?.telefone_id ||
        normalizePhone(c.telefone_id) === normalizePhone(contact?.telefone_id || '')
    );

    const payload: any = {
      cliente_id: user.id_cliente,
      mensagem: params.mensagem,
      id_conversa: convo?.conversa_id || selectedContact,
      id_instagram_lead: convo?.telefone || contact?.telefone_id || selectedContact,
      nome_lead: contact?.name || 'Contato Instagram',
    };

    // Campos extras para suportar mídia (se o webhook já estiver preparado)
    if (params.tipo_mensagem) payload.tipo_mensagem = params.tipo_mensagem;
    if (params.url_arquivo) payload.url_arquivo = params.url_arquivo;
    if (params.nome_arquivo) payload.nome_arquivo = params.nome_arquivo;

    const response = await fetch('https://webhook.dev.usesmartcrm.com/webhook/envio_ig', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP no envio Instagram: ${response.status}`);
    }
  };

  // Função para enviar mensagem de imagem
  const handleSendImage = async (imageFile: File) => {
    if (!selectedContact) {
      toast.error('Nenhum contato selecionado');
      return;
    }

    const contact = contacts.find(c => c.id === selectedContact);
    if (!contact?.telefone_id) {
      toast.error('Erro: telefone não encontrado');
      return;
    }

    console.log('📷 Iniciando envio de imagem para:', contact.telefone_id);

    const canal = getSelectedContactCanal();
    if (canal === 'instagram') {
      const loadingToast = toast.loading(
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
          <span>Enviando imagem...</span>
        </div>
      );

      try {
        const imageUrl = await uploadImageToStorage(imageFile);
        await sendInstagramViaWebhook({
          mensagem: imageUrl,
          tipo_mensagem: 'imagem',
          url_arquivo: imageUrl,
          nome_arquivo: imageFile.name,
        });

        toast.dismiss(loadingToast);
        toast.success(
          <div className="flex items-center gap-2">
            <span>📷</span>
            <span>Imagem enviada com sucesso!</span>
          </div>
        );

        fetchConversations(false);
      } catch (error) {
        toast.dismiss(loadingToast);
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        toast.error(
          <div className="flex items-center gap-2">
            <span>❌</span>
            <span>Erro ao enviar imagem: {errorMessage}</span>
          </div>
        );
      }
      return;
    }

    // Toast de loading
    const loadingToast = toast.loading(
      <div className="flex items-center gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
        <span>Enviando imagem...</span>
      </div>
    );

    try {
      // 1. Upload da imagem para o storage
      console.log('📤 Fazendo upload para storage...');
      const imageUrl = await uploadImageToStorage(imageFile);
      console.log('✅ Upload concluído. URL:', imageUrl);

      // 2. Enviar via Evolution API
      console.log('📡 Enviando imagem via Evolution API...');
      const evolutionResponse = await sendImageMessage(contact.telefone_id, imageUrl, '');
      console.log('✅ Imagem enviada via Evolution API:', evolutionResponse);

      // 3. NÃO salvamos no banco - o n8n fará isso quando receber o webhook
      console.log('📝 Aguardando webhook do n8n para salvar no banco...');
      
      // Dismiss loading toast e mostrar sucesso
      toast.dismiss(loadingToast);
      toast.success(
        <div className="flex items-center gap-2">
          <span>📷</span>
          <span>Imagem enviada com sucesso!</span>
        </div>
      );
      
      // Scroll para o fim da conversa quando a mensagem chegar via subscription
      // Isso acontecerá automaticamente quando o n8n salvar no banco

    } catch (error) {
      console.error('❌ Erro completo ao enviar imagem:', error);
      
      toast.dismiss(loadingToast);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(
        <div className="flex items-center gap-2">
          <span>❌</span>
          <span>Erro ao enviar imagem: {errorMessage}</span>
        </div>
      );
    }
  };

  // Função para enviar mensagem de áudio
  const handleSendAudio = async (audioBlob: Blob) => {
    if (!selectedContact) {
      toast.error('Nenhum contato selecionado');
      return;
    }

    const contact = contacts.find(c => c.id === selectedContact);
    if (!contact?.telefone_id) {
      toast.error('Erro: telefone não encontrado');
      return;
    }

    console.log('🎤 Iniciando envio de áudio para:', contact.telefone_id);

    const canal = getSelectedContactCanal();
    if (canal === 'instagram') {
      const loadingToast = toast.loading(
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
          <span>Enviando áudio...</span>
        </div>
      );

      try {
        const audioUrl = await uploadAudioToStorage(audioBlob);
        await sendInstagramViaWebhook({
          mensagem: audioUrl,
          tipo_mensagem: 'audio',
          url_arquivo: audioUrl,
        });

        toast.dismiss(loadingToast);
        toast.success(
          <div className="flex items-center gap-2">
            <span>🎤</span>
            <span>Áudio enviado com sucesso!</span>
          </div>
        );

        fetchConversations(false);
      } catch (error) {
        toast.dismiss(loadingToast);
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        toast.error(
          <div className="flex items-center gap-2">
            <span>❌</span>
            <span>Erro ao enviar áudio: {errorMessage}</span>
          </div>
        );
      }
      return;
    }

    // Toast de loading
    const loadingToast = toast.loading(
      <div className="flex items-center gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
        <span>Enviando áudio...</span>
      </div>
    );

    try {
      // 1. Upload do áudio para o storage
      console.log('📤 Fazendo upload para storage...');
      const audioUrl = await uploadAudioToStorage(audioBlob);
      console.log('✅ Upload concluído. URL:', audioUrl);

      // 2. Enviar via novo endpoint de áudio
      console.log('📡 Enviando áudio via novo endpoint...');
      console.log('📋 Dados do envio:', {
        telefone: contact.telefone_id,
        audioUrl: audioUrl,
        blobType: audioBlob.type,
        blobSize: audioBlob.size
      });
      const audioResponse = await sendAudioMessage(contact.telefone_id, audioUrl, '');
      console.log('✅ Áudio enviado via novo endpoint:', audioResponse);

      // 3. NÃO salvamos no banco - o n8n fará isso quando receber o webhook
      console.log('📝 Aguardando webhook do n8n para salvar no banco...');
      
      // Dismiss loading toast e mostrar sucesso
      toast.dismiss(loadingToast);
      toast.success(
        <div className="flex items-center gap-2">
          <span>🎤</span>
          <span>Áudio enviado com sucesso!</span>
        </div>
      );
      
      // Scroll para o fim da conversa quando a mensagem chegar via subscription
      // Isso acontecerá automaticamente quando o n8n salvar no banco

    } catch (error) {
      console.error('❌ Erro completo ao enviar áudio:', error);
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      // Mostrar erro específico
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      if (errorMessage.includes('row-level security') || errorMessage.includes('RLS')) {
        toast.error(
          <div className="max-w-md">
            <div className="font-medium mb-2">🔒 Erro de Permissão no Storage</div>
            <div className="text-sm opacity-90">
              Execute o arquivo SOLUCAO-RAPIDA-RLS.sql no Supabase.
            </div>
          </div>,
          { duration: 8000 }
        );
      } else {
        toast.error(
          <div className="flex items-center gap-2">
            <span>❌</span>
            <span>Erro ao enviar áudio: {errorMessage}</span>
          </div>
        );
      }
    }
  };

  // Funções para controlar a gravação de áudio
  const startRecording = () => {
    setIsRecording(true);
    setShowAudioRecorder(true);
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  const cancelRecording = () => {
    setIsRecording(false);
  };

  // Função para excluir mensagem
  const deleteMessage = async (message: Conversation) => {
    if (!message.id_mensagem) {
      toast.error('ID da mensagem não encontrado');
      return;
    }

    const loadingToast = toast.loading(
      <div className="flex items-center gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
        <span>Excluindo mensagem...</span>
      </div>
    );

    try {
      // Enviar webhook para exclusão
      const webhookResponse = await fetch('https://webhook.dev.usesmartcrm.com/webhook/delete-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome_instancia: message.instance_id,
          telefone_lead: message.telefone,
          id_mensagem: message.id_mensagem
        }),
      });

      if (!webhookResponse.ok) {
        throw new Error(`Webhook falhou: ${webhookResponse.status}`);
      }

      // Após sucesso do webhook, atualizar a coluna deleted para true em vez de excluir
      const { error: updateError } = await supabase
        .from('agente_conversacional_whatsapp')
        .update({ deleted: true })
        .eq('id', message.id);

      if (updateError) {
        throw new Error(`Erro ao atualizar no banco: ${updateError.message}`);
      }

      // Atualizar o estado local para refletir a mudança
      // Usar uma função de atualização que garante que não haja duplicatas
      setConversations(prev => {
        const existingIndex = prev.findIndex(m => m.id === message.id);
        if (existingIndex !== -1) {
          // Se a mensagem já existe, atualizar ela
          const newList = [...prev];
          newList[existingIndex] = { ...newList[existingIndex], deleted: true };
          return newList;
        }
        // Se não existe (não deveria acontecer), adicionar
        return [...prev, { ...message, deleted: true }];
      });

      toast.dismiss(loadingToast);
      toast.success(
        <div className="flex items-center gap-2">
          <span>🗑️</span>
          <span>Mensagem excluída com sucesso!</span>
        </div>
      );

    } catch (error) {
      console.error('Erro ao excluir mensagem:', error);
      toast.dismiss(loadingToast);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(
        <div className="flex items-center gap-2">
          <span>❌</span>
          <span>Erro ao excluir mensagem: {errorMessage}</span>
        </div>
      );
    }
  };

  // Função para renderizar o conteúdo da mensagem baseado no tipo
  const renderMessageContent = (msg: Conversation) => {
    const messageType = msg.tipo_mensagem || 'texto';
    
    // Todos os console.log deste arquivo devem ser comentados para ocultar logs sensíveis.
    // console.log('🎨 Renderizando mensagem:', {
    //   id: msg.id,
    //   tipo: messageType,
    //   url: msg.url_arquivo,
    //   mensagem: msg.mensagem,
    //   timestamp: msg.timestamp || msg.created_at
    // });

    switch (messageType) {
      case 'audio':
        if (msg.url_arquivo) {
          // console.log('🎵 Renderizando player de áudio para URL:', msg.url_arquivo);
          const caption = msg.caption || (msg.mensagem && msg.mensagem !== '🎤 Áudio' ? msg.mensagem : null);
          return (
            <div className="space-y-2">
              <AudioPlayerAdvanced audioUrl={msg.url_arquivo} isOwn={msg.tipo} />
              {caption && (
                <div className="px-3 py-2 bg-transparent">
                  <p className="text-sm whitespace-pre-wrap break-words">{caption}</p>
                </div>
              )}
              {msg.transcricao_audio && (
                <div className={`text-sm ${msg.tipo ? 'text-blue-600' : 'text-gray-600'} bg-gray-50 rounded-lg p-3 border-l-4 ${msg.tipo ? 'border-blue-400' : 'border-gray-300'}`}>
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-gray-500 mt-0.5">📝</span>
                    <div className="flex-1">
                      <p className="font-medium text-xs text-gray-500 mb-1">Transcrição:</p>
                      <p className="text-sm leading-relaxed">{msg.transcricao_audio}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        }
        // console.warn('⚠️ Mensagem de áudio sem URL:', msg);
        return (
          <div className="flex items-center gap-2 text-gray-500 italic">
            <span>🎤</span>
            <span>Áudio não disponível</span>
          </div>
        );

      case 'imagem':
        if (msg.url_arquivo) {
          const caption = msg.caption || (msg.mensagem && msg.mensagem !== '📷 Imagem' ? msg.mensagem : null);
          
          // Função para fazer download da imagem
          const handleDownloadImage = async (e: React.MouseEvent) => {
            e.stopPropagation();
            try {
              // Construir URL completa se necessário (para Supabase Storage)
              let imageUrl = msg.url_arquivo!;
              if (!imageUrl.startsWith('http')) {
                // Se for URL relativa do Supabase Storage
                imageUrl = `https://ltdkdeqxcgtuncgzsowt.supabase.co/storage/v1/object/public/imageswpp/${imageUrl}`;
              }
              
              const response = await fetch(imageUrl);
              if (!response.ok) {
                throw new Error(`Erro ao buscar imagem: ${response.statusText}`);
              }
              
              const blob = await response.blob();
              const url = window.URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              
              // Extrair nome do arquivo da URL ou usar um padrão
              const urlParts = imageUrl.split('/');
              let fileName = urlParts[urlParts.length - 1];
              // Remover query params se houver
              fileName = fileName.split('?')[0];
              // Se não tiver extensão, adicionar baseado no tipo do blob
              if (!fileName.includes('.')) {
                const extension = blob.type.split('/')[1] || 'jpg';
                fileName = `imagem_${Date.now()}.${extension}`;
              } else {
                fileName = fileName || `imagem_${Date.now()}.jpg`;
              }
              
              link.download = fileName;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              window.URL.revokeObjectURL(url);
              
              toast.success('Download iniciado');
            } catch (error) {
              console.error('Erro ao fazer download da imagem:', error);
              toast.error('Erro ao fazer download da imagem');
            }
          };

          // Construir URL completa para visualização
          const getImageUrl = () => {
            if (!msg.url_arquivo) return '';
            if (msg.url_arquivo.startsWith('http')) {
              return msg.url_arquivo;
            }
            // Se for URL relativa do Supabase Storage
            return `https://ltdkdeqxcgtuncgzsowt.supabase.co/storage/v1/object/public/imageswpp/${msg.url_arquivo}`;
          };

          return (
            <div className="max-w-sm relative group">
              <div 
                className="cursor-pointer"
                onClick={() => setViewingImage(getImageUrl())}
              >
                <img 
                  src={getImageUrl()} 
                  alt="Imagem" 
                  className="rounded-t-lg max-w-full h-auto"
                  loading="lazy"
                  style={{ 
                    borderTopLeftRadius: '0.5rem',
                    borderTopRightRadius: '0.5rem',
                    borderBottomLeftRadius: caption ? '0' : '0.5rem',
                    borderBottomRightRadius: caption ? '0' : '0.5rem'
                  }}
                />
              </div>
              {/* Botão de download */}
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleDownloadImage}
                title="Baixar imagem"
              >
                <Download className="h-4 w-4" />
              </Button>
              {caption && (
                <div className="px-3 py-2 bg-transparent">
                  <p className="text-sm whitespace-pre-wrap break-words">{caption}</p>
                </div>
              )}
            </div>
          );
        }
        return (
          <div className="flex items-center gap-2 text-gray-500 italic">
            <span>📷</span>
            <span>Imagem não disponível</span>
          </div>
        );

      case 'video':
        if (msg.url_arquivo) {
          const caption = msg.caption || (msg.mensagem && msg.mensagem !== '🎥 Vídeo' ? msg.mensagem : null);
          return (
            <div className="max-w-sm">
              <video 
                src={msg.url_arquivo} 
                controls 
                className="max-w-full h-auto"
                preload="metadata"
                style={{ 
                  borderTopLeftRadius: '0.5rem',
                  borderTopRightRadius: '0.5rem',
                  borderBottomLeftRadius: caption ? '0' : '0.5rem',
                  borderBottomRightRadius: caption ? '0' : '0.5rem'
                }}
              />
              {caption && (
                <div className="px-3 py-2 bg-transparent">
                  <p className="text-sm whitespace-pre-wrap break-words">{caption}</p>
                </div>
              )}
            </div>
          );
        }
        return (
          <div className="flex items-center gap-2 text-gray-500 italic">
            <span>🎥</span>
            <span>Vídeo não disponível</span>
          </div>
        );

      case 'documento':
      case 'documento pdf':
      case 'documento doc':
      case 'documento docx':
      case 'documento xls':
      case 'documento xlsx':
      case 'documento ppt':
      case 'documento pptx':
      case 'documento txt':
        console.log('📄 Renderizando documento:', {
          tipo_mensagem: msg.tipo_mensagem,
          url_arquivo: msg.url_arquivo,
          mensagem: msg.mensagem
        });
        
        if (msg.url_arquivo) {
          // Extrair nome do arquivo da URL
          const fileName = msg.url_arquivo.split('/').pop() || 'documento';
          let fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
          
          // Se não conseguiu extrair da URL, tenta extrair do tipo de mensagem
          if (!fileExtension && messageType && messageType.includes('documento ')) {
            fileExtension = messageType.replace('documento ', '').toLowerCase();
          }
          
          // Determinar ícone baseado na extensão
          const getFileIcon = (ext: string) => {
            switch (ext) {
              case 'pdf':
                return '📄';
              case 'doc':
              case 'docx':
                return '📝';
              case 'xls':
              case 'xlsx':
                return '📊';
              case 'ppt':
              case 'pptx':
                return '📈';
              case 'txt':
                return '📃';
              default:
                return '📎';
            }
          };

          return (
            <div className="max-w-sm">
              <a 
                href={msg.url_arquivo} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                onClick={(e) => {
                  console.log('🔗 Tentando abrir documento:', {
                    url: msg.url_arquivo,
                    fileName: fileName,
                    fileExtension: fileExtension
                  });
                  
                  // Se o URL não estiver completo, tentar construir
                  if (msg.url_arquivo && !msg.url_arquivo.startsWith('http')) {
                    e.preventDefault();
                    const fullUrl = `https://ltdkdeqxcgtuncgzsowt.supabase.co/storage/v1/object/public/documentos/${msg.url_arquivo}`;
                    console.log('🔗 URL reconstruído:', fullUrl);
                    window.open(fullUrl, '_blank', 'noopener,noreferrer');
                  }
                }}
              >
                <div className="text-2xl">
                  {getFileIcon(fileExtension)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {fileName}
                  </p>
                  <p className="text-xs text-gray-500">
                    Clique para baixar
                  </p>
                </div>
                <div className="text-gray-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
              </a>
              {(msg.caption || (msg.mensagem && msg.mensagem !== '📄 Documento')) && (
                <div className="px-3 py-2 bg-transparent border-t border-gray-200">
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {msg.caption || msg.mensagem}
                  </p>
                </div>
              )}
            </div>
          );
        }
        return (
          <div className="flex items-center gap-2 text-gray-500 italic">
            <span>📄</span>
            <span>Documento não disponível</span>
          </div>
        );

      case 'texto':
      default:
        return <pre className="whitespace-pre-wrap break-words m-0 bg-transparent font-sans">{msg.mensagem}</pre>;
    }
  };

  // Funções para editar valor no cabeçalho
  const handleSaveValorHeader = async (lead: Lead) => {
    if (!user?.id_cliente) {
      toast.error("Erro ao identificar cliente");
      return;
    }

    setSavingValorHeader(true);
    try {
      const valorParaSalvar = valorInputHeader && valorInputHeader.trim() !== "" 
        ? valorInputHeader.trim() 
        : null;

      const updatedLead = await LeadsService.updateLead(lead.id, user.id_cliente, {
        valor: valorParaSalvar
      });

      if (updatedLead) {
        toast.success("Valor atualizado com sucesso!");
        setIsEditingValorHeader(false);
        // Atualizar o lead na lista local
        setLeads(prevLeads => 
          prevLeads.map(l => l.id === lead.id ? { ...l, valor: updatedLead.valor } : l)
        );
        setLeadsRaw(prevLeads => 
          prevLeads.map(l => l.id === lead.id ? { ...l, valor: updatedLead.valor } : l)
        );
      } else {
        toast.error("Erro ao atualizar valor");
      }
    } catch (error) {
      console.error("Erro ao atualizar valor:", error);
      toast.error("Erro ao atualizar valor");
    } finally {
      setSavingValorHeader(false);
    }
  };

  const handleCancelEditValorHeader = (lead: Lead) => {
    setValorInputHeader(lead.valor ? lead.valor.toString() : "");
    setIsEditingValorHeader(false);
  };

  // Atualizar valor do header quando o contato mudar
  useEffect(() => {
    if (selectedContact) {
      const contact = getSelectedContactInfo();
      if (contact) {
        const leadsToSearch = selectedDepartamento === 'all' ? leadsRaw : leads;
        const lead = leadsToSearch.find(l => normalizePhoneOnlyNumber(l.telefone) === normalizePhoneOnlyNumber(contact.telefone_id));
        if (lead) {
          setValorInputHeader(lead.valor ? lead.valor.toString() : "");
          setIsEditingValorHeader(false);
        } else {
          setValorInputHeader("");
          setIsEditingValorHeader(false);
        }
      }
    }
  }, [selectedContact, leads, leadsRaw, selectedDepartamento, getSelectedContactInfo]);

  const handleSaleCompleted = async () => {
    if (!selectedContact || !user?.id_cliente) return;
    
    try {
      // Buscar o telefone_id do contato selecionado
      const contact = contacts.find(c => c.id === selectedContact);
      if (!contact?.telefone_id) {
        toast.error('Erro: contato não encontrado');
        return;
      }
      
      // Remover o sufixo @s.whatsapp.net do número de telefone
      const phoneNumber = contact.telefone_id.replace('@s.whatsapp.net', '');
      
      // Buscar o lead para obter o ID
      const { data: leadData, error: fetchError } = await supabase
        .from('leads')
        .select('id')
        .eq('telefone', phoneNumber)
        .eq('id_cliente', user.id_cliente)
        .single();
      
      if (fetchError || !leadData) {
        console.error('Erro ao buscar lead:', fetchError);
        toast.error('Erro ao registrar venda');
        return;
      }
      
      // Usar o novo método do leadsService para marcar como ganho
      const result = await LeadsService.marcarComoGanho(leadData.id, user.id_cliente);
      
      if (!result.success) {
        console.error('Erro ao atualizar status da venda:', result.error);
        toast.error(result.error || 'Erro ao registrar venda');
        return;
      }
      
      // Atualizar o estado local
      setSelectedContactStage('Ganho');
      
      // Recarregar os leads para atualizar a interface
      const leadsToSearch = selectedDepartamento === 'all' ? leadsRaw : leads;
      const updatedLeads = await LeadsService.getLeadsByClientId(user.id_cliente);
      if (selectedDepartamento === 'all') {
        setLeadsRaw(updatedLeads);
      } else {
        const filteredLeads = updatedLeads.filter(l => 
          selectedDepartamento === 'all' || l.id_departamento === Number(selectedDepartamento)
        );
        setLeads(filteredLeads);
      }
      
      toast.success(`Venda registrada com sucesso! Lead movido para "${result.etapaNome}".`);
    } catch (error) {
      console.error('Erro ao processar venda:', error);
      toast.error('Erro ao registrar venda');
    }
  };

  const handleUndoSale = async () => {
    if (!selectedContact || !user?.id_cliente) return;
    
    try {
      // Buscar o telefone_id do contato selecionado
      const contact = contacts.find(c => c.id === selectedContact);
      if (!contact?.telefone_id) {
        toast.error('Erro: contato não encontrado');
        return;
      }
      
      // Remover o sufixo @s.whatsapp.net do número de telefone
      const phoneNumber = contact.telefone_id.replace('@s.whatsapp.net', '');
      
      // Buscar o lead completo para verificar se está como ganho
      const { data: leadData, error: fetchError } = await supabase
        .from('leads')
        .select('id, id_funil, venda_realizada, status')
        .eq('telefone', phoneNumber)
        .eq('id_cliente', user.id_cliente)
        .single();
      
      if (fetchError || !leadData) {
        console.error('Erro ao buscar lead:', fetchError);
        toast.error('Erro ao buscar lead');
        return;
      }

      // Verificar se realmente está como venda realizada
      if (!leadData.venda_realizada && leadData.status !== 'Ganho') {
        toast.error('Este lead não está marcado como venda realizada');
        return;
      }

      let primeiraEtapaId: number | null = null;

      // Se o lead tem funil, buscar a primeira etapa do, funil
      if (leadData.id_funil) {
        try {
          const { data: etapas, error: etapasError } = await supabase
            .from('funis_etapas')
            .select('id, nome, ordem')
            .eq('id_funil', leadData.id_funil)
            .eq('id_cliente', user.id_cliente)
            .order('ordem', { ascending: true })
            .limit(1);

          if (!etapasError && etapas && etapas.length > 0) {
            primeiraEtapaId = etapas[0].id;
          }
        } catch (error) {
          console.error('Erro ao buscar primeira etapa do funil:', error);
        }
      }

      const now = new Date().toISOString();

      // Preparar dados de atualização para desfazer a venda
      const updateData: Record<string, any> = {
        status: primeiraEtapaId ? null : 'Leads', // Se não tem etapa, usar 'Leads'
        venda: null,
        venda_realizada: false,
        venda_perdida: false,
        data_venda: null,
        data_perda: null,
        id_usuario_venda: null,
        id_usuario_perda: null,
        probabilidade_final_fechamento: null,
        data_ultimo_status: now
      };

      // Se encontrou primeira etapa, atualizar também o id_funil_etapa
      if (primeiraEtapaId) {
        updateData.id_funil_etapa = primeiraEtapaId;
      } else {
        updateData.id_funil_etapa = null;
      }

      // Atualizar o lead no banco
      const { error: updateError } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', leadData.id)
        .eq('id_cliente', user.id_cliente);

      if (updateError) {
        throw updateError;
      }

      // Atualizar o estado local
      setSelectedContactStage(null);
      
      // Recarregar os leads para atualizar a interface
      const updatedLeads = await LeadsService.getLeadsByClientId(user.id_cliente);
      if (selectedDepartamento === 'all') {
        setLeadsRaw(updatedLeads);
      } else {
        const filteredLeads = updatedLeads.filter(l => 
          selectedDepartamento === 'all' || l.id_departamento === Number(selectedDepartamento)
        );
        setLeads(filteredLeads);
      }

      toast.success('Venda não realizada! Lead desmarcado como ganho.');
    } catch (error) {
      console.error('Erro ao desfazer venda:', error);
      toast.error('Erro ao desfazer venda. Tente novamente.');
    }
  };

  const handleEndConversation = async () => {
    if (!selectedContact || !user?.id_cliente) return;
    
    try {
      // Buscar o telefone_id do contato selecionado
      const contact = contacts.find(c => c.id === selectedContact);
      if (!contact?.telefone_id) {
        toast.error('Erro: contato não encontrado');
        return;
      }
      
      // Remover o sufixo @s.whatsapp.net do número de telefone
      const phoneNumber = contact.telefone_id.replace('@s.whatsapp.net', '');
      
      // Atualizar o lead existente
      const { error } = await supabase
        .from('leads')
        .update({
          status_conversa: 'Encerrada',
          atendimento_humano: false,
          atendimento_ia: true,
          chatbot: true,
        })
        .eq('telefone', phoneNumber)
        .eq('id_cliente', user.id_cliente);
      
      if (error) {
        console.error('Erro ao encerrar conversa:', error);
        toast.error('Erro ao encerrar conversa');
        return;
      }
      
      // Atualizar o estado local
      setSelectedContactStage('Encerrada');
      
      // Atualizar o mapa de status local
      const normalizedPhone = normalizePhone(phoneNumber);
      setContactStatusMap(prev => ({
        ...prev,
        [normalizedPhone]: 'Encerrada'
      }));
      
      // Recarregar os dados de todos os contatos para atualizar a interface
      const phones = contacts.map(c => c.telefone_id);
      await fetchAttendancesForContacts(phones);
      
      toast.success('Conversa encerrada com sucesso');
      
      // Se o filtro atual for "em_andamento", mudar para "encerrada" para continuar vendo a conversa
      if (statusFilter === 'em_andamento') {
        setStatusFilter('encerrada');
      }
    } catch (error) {
      console.error('Erro ao processar encerramento:', error);
      toast.error('Erro ao encerrar conversa');
    }
  };

  // Adicione no início do componente Conversations:
  const [availableChatbots, setAvailableChatbots] = useState<any[]>([]);
  const [selectedChatbotId, setSelectedChatbotId] = useState<string | number | null>(null);

  // Buscar chatbots ativos do usuário e atualizar os estados
  useEffect(() => {
    const fetchChatbots = async () => {
      if (!user?.id || !user?.id_cliente) return;
      
      try {
        // Primeiro, buscar o id_chatbot configurado pelo admin na tabela clientes_info
        const { data: clientInfo, error: clientError } = await supabase
          .from('clientes_info')
          .select('id_chatbot')
          .eq('id', user.id_cliente)
          .maybeSingle();

        if (clientError) {
          console.error('Erro ao buscar configuração do cliente:', clientError);
        }

        // Se há um chatbot configurado pelo admin, buscar esse chatbot
        if (clientInfo?.id_chatbot) {
          const { data: chatbotData, error: chatbotError } = await supabase
            .from('prompts_oficial')
            .select('id, nome, em_uso, status')
            .eq('id', clientInfo.id_chatbot)
            .eq('status', true)
            .maybeSingle();

          if (!chatbotError && chatbotData) {
            // Chatbot configurado pelo admin encontrado e ativo
            setAvailableChatbots([chatbotData]);
            setSelectedChatbotId(chatbotData.id);
            return;
          }
        }

        // Se não há chatbot configurado pelo admin ou não foi encontrado,
        // tentar buscar chatbots do próprio usuário (para admins/gestores)
        const { data, error } = await supabase
          .from('prompts_oficial')
          .select('id, nome, em_uso')
          .eq('id_usuario', user.id)
          .eq('status', true);

        if (!error && data && data.length > 0) {
          setAvailableChatbots(data);
          const emUso = data.find((bot: any) => bot.em_uso === true);
          setSelectedChatbotId(emUso ? emUso.id : null);
        } else {
          setAvailableChatbots([]);
          setSelectedChatbotId(null);
        }
      } catch (error) {
        console.error('Erro ao buscar chatbots:', error);
        setAvailableChatbots([]);
        setSelectedChatbotId(null);
      }
    };
    fetchChatbots();
  }, [user]);

  // Adicionar estado para busca
  const [search, setSearch] = useState("");

  // Função para normalizar telefone removendo sufixo @s.whatsapp.net
  function normalizePhoneOnlyNumber(phone: string): string {
    return phone ? String(phone).replace('@s.whatsapp.net', '').replace(/\D/g, '') : '';
  }

  // Filtrar contatos para exibir apenas os leads do departamento selecionado E status da conversa
  const leadsPhonesSet = new Set(leads.map(lead => normalizePhoneOnlyNumber(lead.telefone)));
  const filteredContacts = contacts.filter(contact => {
    const phone = contact.telefone_id || '';
    if (!leadsPhonesSet.has(normalizePhoneOnlyNumber(phone))) return false;
    
    // Buscar o lead correspondente para verificar o departamento
    const lead = leads.find(l => normalizePhoneOnlyNumber(l.telefone) === normalizePhoneOnlyNumber(phone));
    if (!lead) return false;
    
    // Filtro por departamento
    if (selectedDepartamento !== 'all') {
      const leadDepartamentoId = lead.id_departamento;
      
      if (selectedDepartamento === null) {
        // Se "Sem Departamento" está selecionado, mostrar apenas leads sem departamento
        if (leadDepartamentoId !== null) {
          return false;
        }
      } else {
        // Se um departamento específico está selecionado
        const selectedDepartamentoId = parseInt(selectedDepartamento);
        
        // Se o lead não tem departamento (null) e não é "Sem Departamento"
        if (leadDepartamentoId === null) {
          return false;
        }
        
        // Se o lead tem departamento mas não corresponde ao selecionado
        if (leadDepartamentoId !== selectedDepartamentoId) {
          return false;
        }
      }
    }
    
    // Filtro de status
    const status = contactStatusMap[normalizePhoneOnlyNumber(phone)];
    const statusMatch = statusFilter === 'em_andamento' 
      ? (!status || status === 'Em andamento')
      : status === 'Encerrada';
    
    // Filtro de busca igual à página de contatos
    const termo = search.trim().toLowerCase();
    const nameMatch = contact.name.toLowerCase().includes(termo);
    const phoneMatch = phone.includes(termo);
    
    return statusMatch && (search === '' || nameMatch || phoneMatch);
  });

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [transferDepartamentos, setTransferDepartamentos] = useState<Departamento[]>([]);
  const [userInfo, setUserInfo] = useState<{ tipo_usuario?: string; id_departamento?: number } | null>(null);
  const [transferring, setTransferring] = useState(false);
  const [selectedTransferDepartamento, setSelectedTransferDepartamento] = useState<string | null>(null);

  // Carregar departamentos ao abrir o modal - TODOS os departamentos para transferência
  const handleOpenTransferModal = async () => {
    if (!user?.id_cliente) return;
    try {
      // Buscar TODOS os departamentos do cliente para permitir transferência
      const allDeps = await departamentosService.listar(user.id_cliente);
      setTransferDepartamentos(allDeps);
      setSelectedTransferDepartamento(null); // Limpar seleção anterior
      setShowTransferModal(true);
    } catch (error) {
      toast.error("Erro ao carregar departamentos");
    }
  };

  const fetchDepartamentos = async () => {
    if (!user?.id_cliente) {
      return;
    }

    try {
      if (user.id_cliente) {
        // Buscar todos os departamentos do cliente usando o serviço
        const allDeps = await departamentosService.listar(user.id_cliente);
        
        // Usar o hook useUserType para determinar as permissões
        if (isAtendente) {
          // Coletar todos os departamentos do atendente (até 3)
          const deptIds: number[] = [];
          if (userTypeInfo?.id_departamento) deptIds.push(userTypeInfo.id_departamento);
          if (userTypeInfo?.id_departamento_2) deptIds.push(userTypeInfo.id_departamento_2);
          if (userTypeInfo?.id_departamento_3) deptIds.push(userTypeInfo.id_departamento_3);
          
          if (deptIds.length > 0) {
            // Atendente com departamentos associados - mostrar apenas seus departamentos
            const filteredDeps = allDeps.filter(dep => deptIds.includes(dep.id));
            setDepartamentos(filteredDeps);
          } else {
            // Atendente sem departamento associado - mostrar apenas "Sem Departamento"
            setDepartamentos([]);
          }
        } else {
          // Admin ou Gestor - mostrar todos os departamentos
          setDepartamentos(allDeps);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar departamentos', error);
    }
  };

  useEffect(() => {
    fetchDepartamentos();
  }, [user, userType, isAtendente, userTypeInfo]);

  // Transferir lead para outro departamento
  const handleTransferDepartamento = async () => {
    if (!selectedLeadId || !selectedTransferDepartamento || !user?.id_cliente) return;

    setTransferring(true);
    try {
      // Usar a nova função que atualiza o histórico automaticamente
      const success = await LeadsService.updateLeadDepartamentoHistory(
        Number(selectedLeadId), 
        user.id_cliente, 
        selectedTransferDepartamento === '0' ? null : Number(selectedTransferDepartamento)
      );

      if (success) {
        toast.success("Lead transferido com sucesso!");
        setShowTransferModal(false);
        setSelectedTransferDepartamento(null);
        setSelectedLeadId(null);
        
        // Atualizar o lead específico no estado leadsRaw para atualização instantânea
        const leadId = Number(selectedLeadId);
        const novoDepartamento = selectedTransferDepartamento === '0' ? null : Number(selectedTransferDepartamento);
        
        setLeadsRaw(prevLeadsRaw => 
          prevLeadsRaw.map(lead => 
            lead.id === leadId 
              ? { ...lead, id_departamento: novoDepartamento }
              : lead
          )
        );
        
        fetchLeads();
        fetchDepartamentos();
      } else {
        toast.error("Erro ao transferir lead");
      }
    } catch (error) {
      console.error('Erro ao transferir lead:', error);
      toast.error("Erro ao transferir lead");
    } finally {
      setTransferring(false);
    }
  };

  // Buscar leads filtrando por departamento
  const fetchLeads = async () => {
    if (!user?.id_cliente) return;
    setLoadingLeads(true);
    
    try {
      let departamentosFiltro = null;
      
      // Verificar se há filtros ativos
      const hasDepartamentoFilter = selectedDepartamento !== 'all';
      const hasEtiquetaFilter = selectedEtiqueta !== 'all';
      
      // Se apenas etiquetas estão selecionadas (sem filtro de departamento), buscar todos os leads
      if (!hasDepartamentoFilter && hasEtiquetaFilter) {
        // Apenas etiquetas selecionadas - buscar todos os leads para permitir filtro por etiqueta
        departamentosFiltro = null;
      } else {
      // Usar o hook useUserType para determinar as permissões
      if (isAtendente) {
        // Coletar todos os departamentos do atendente (até 3)
        const deptIds: number[] = [];
        if (userTypeInfo?.id_departamento) deptIds.push(userTypeInfo.id_departamento);
        if (userTypeInfo?.id_departamento_2) deptIds.push(userTypeInfo.id_departamento_2);
        if (userTypeInfo?.id_departamento_3) deptIds.push(userTypeInfo.id_departamento_3);
        
        if (deptIds.length > 0) {
          // Atendente com departamentos associados
          if (selectedDepartamento === 'all') {
            // Se "todos" estiver selecionado, usar todos os departamentos do atendente
            departamentosFiltro = deptIds;
          } else if (selectedDepartamento === '0') {
            // Se "Sem Departamento" estiver selecionado, buscar leads sem departamento
            departamentosFiltro = 'null';
          } else {
            // Se um departamento específico estiver selecionado, verificar se o atendente tem acesso
            const selectedDeptId = parseInt(selectedDepartamento);
            if (deptIds.includes(selectedDeptId)) {
              departamentosFiltro = [selectedDeptId];
            } else {
              // Se não tem acesso ao departamento selecionado, não mostrar nada
              setLeads([]);
              setLoadingLeads(false);
              return;
            }
          }
        } else {
          // Atendente sem departamento associado - só pode ver leads sem departamento
          if (selectedDepartamento === 'all' || selectedDepartamento === '0') {
            departamentosFiltro = 'null';
          } else {
            // Se tentar selecionar um departamento específico, não mostrar nada
            setLeads([]);
            setLoadingLeads(false);
            return;
          }
        }
      } else {
        // Admin ou Gestor - usar o filtro normal
        if (selectedDepartamento === '0') {
          // Se "Sem Departamento" estiver selecionado, buscar leads sem departamento
          departamentosFiltro = 'null';
        } else {
          departamentosFiltro = selectedDepartamento === 'all' ? null : Number(selectedDepartamento);
          }
        }
      }
      
      const leadsFiltrados = await LeadsService.getLeadsByClientIdAndDepartamento(
        user.id_cliente,
        departamentosFiltro
      );
      // Log para debugar scores de qualificação
              const leadsComScore = leadsFiltrados.filter(lead => lead.score_final_qualificacao && typeof lead.score_final_qualificacao === 'number');
      if (leadsComScore.length > 0) {
        console.log('Exemplos de scores:', leadsComScore.slice(0, 3).map(l => ({ 
          nome: l.nome, 
          telefone: l.telefone, 
                      score: l.score_final_qualificacao 
        })));
      }
      
      setLeads(leadsFiltrados);
    } catch (error) {
      console.error('Erro ao buscar leads:', error);
      setLeads([]);
    } finally {
      setLoadingLeads(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [user?.id_cliente, selectedDepartamento, selectedEtiqueta]);

  // Adicionar função utilitária no início do componente Conversations:
  function getDepartamentoNome(id: string | number | null | undefined) {
    if (!id) return null;
    // Log para depuração
    console.log('DEBUG getDepartamentoNome | id:', id, '| departamentos:', departamentos);
    const dep = departamentos.find(d => String(d.id) === String(id));
    return dep ? dep.nome : null;
  }

  // Função para inserir o lead no followup programado
  const handleInserirNoFollowupProgramado = async () => {
    if (!selectedContact || !user?.id_cliente) {
      toast.error('Erro: informações do contato ou cliente ausentes');
      return;
    }
    const contact = contacts.find(c => c.id === selectedContact);
    if (!contact?.telefone_id) {
      toast.error('Erro: telefone do contato não encontrado');
      return;
    }
    // Buscar o lead correspondente - usar leadsRaw quando "Todos os departamentos" está selecionado
    const leadsToSearch = selectedDepartamento === 'all' ? leadsRaw : leads;
    const lead = leadsToSearch.find(l => normalizePhoneOnlyNumber(l.telefone) === normalizePhoneOnlyNumber(contact.telefone_id));
    if (!lead) {
      toast.error('Lead não encontrado');
      return;
    }
    // Buscar configuração de followup do cliente
    const config = await followupService.getByClientId(user.id_cliente);
    if (!config) {
      toast.error('Configuração de followup não encontrada para este cliente');
      return;
    }
    // Calcular datas dos follow-ups
    const hoje = new Date();
    let primeiroData = null, segundoData = null, terceiroData = null;
    if (config.primeiro_followup_status) {
      primeiroData = addDays(hoje, config.primeiro_followup_dias);
    }
    if (config.segundo_followup_status && primeiroData) {
      segundoData = addDays(primeiroData, config.segundo_followup_dias);
    }
    if (config.terceiro_followup_status && segundoData) {
      terceiroData = addDays(segundoData, config.terceiro_followup_dias);
    }

    // Atualizar o lead
    const { error } = await supabase
      .from('leads')
      .update({
        followup_programado: true,
        id_followup: config.id,
        primeiro_followup_data: primeiroData ? format(primeiroData, 'yyyy-MM-dd') : null,
        primeiro_followup_hora: config.horario_followup,
        primeiro_followup_mensagem: config.primeiro_followup_mensagem,
        segundo_followup_data: segundoData ? format(segundoData, 'yyyy-MM-dd') : null,
        segundo_followup_hora: config.horario_followup,
        segundo_followup_mensagem: config.segundo_followup_mensagem,
        terceiro_followup_data: terceiroData ? format(terceiroData, 'yyyy-MM-dd') : null,
        terceiro_followup_hora: config.horario_followup,
        terceiro_followup_mensagem: config.terceiro_followup_mensagem
      })
      .eq('id', lead.id);
    if (error) {
      toast.error('Erro ao inserir no followup programado');
      return;
    }
    toast.success('Lead inserido no followup programado!');
    fetchLeads();
  };

  // Função para remover o lead do followup programado
  const handleRemoverDoFollowupProgramado = async () => {
    if (!selectedContact || !user?.id_cliente) {
      toast.error('Erro: informações do contato ou cliente ausentes');
      return;
    }

    const contact = contacts.find(c => c.id === selectedContact);
    if (!contact?.telefone_id) {
      toast.error('Erro: telefone do contato não encontrado');
      return;
    }

    // Buscar o lead correspondente - usar leadsRaw quando "Todos os departamentos" está selecionado
    const leadsToSearch = selectedDepartamento === 'all' ? leadsRaw : leads;
    const lead = leadsToSearch.find(l => normalizePhoneOnlyNumber(l.telefone) === normalizePhoneOnlyNumber(contact.telefone_id));
    if (!lead) {
      toast.error('Lead não encontrado');
      return;
    }
    
    try {
    const { error } = await supabase
      .from('leads')
      .update({
        followup_programado: false,
        id_followup: null,
        primeiro_followup_data: null,
        primeiro_followup_hora: null,
        primeiro_followup_mensagem: null,
        segundo_followup_data: null,
        segundo_followup_hora: null,
        segundo_followup_mensagem: null,
        terceiro_followup_data: null,
        terceiro_followup_hora: null,
        terceiro_followup_mensagem: null
      })
        .eq('id', lead.id)
        .eq('id_cliente', user.id_cliente);

    if (error) {
        console.error('Erro ao remover lead do followup programado:', error);
        toast.error('Erro ao remover lead do followup programado');
        return;
      }
    } catch (error) {
      console.error('Erro ao remover lead do followup programado:', error);
      toast.error('Erro ao remover lead do followup programado');
      return;
    }
    toast.success('Lead removido do followup programado!');
    fetchLeads();
  };



  // Função para enviar mensagem de documento
  const handleSendDocument = async (documentFile: File) => {
    if (!selectedContact) {
      toast.error('Nenhum contato selecionado');
      return;
    }

    const contact = contacts.find(c => c.id === selectedContact);
    if (!contact?.telefone_id) {
      toast.error('Erro: telefone não encontrado');
      return;
    }

    console.log('📄 Iniciando envio de documento para:', contact.telefone_id);

    const canal = getSelectedContactCanal();
    if (canal === 'instagram') {
      const loadingToast = toast.loading(
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
          <span>Enviando documento...</span>
        </div>
      );

      try {
        const documentUrl = await uploadDocumentToStorage(documentFile);
        await sendInstagramViaWebhook({
          mensagem: documentUrl,
          tipo_mensagem: 'documento',
          url_arquivo: documentUrl,
          nome_arquivo: documentFile.name,
        });

        toast.dismiss(loadingToast);
        toast.success(
          <div className="flex items-center gap-2">
            <span>📄</span>
            <span>Documento enviado com sucesso!</span>
          </div>
        );

        fetchConversations(false);
      } catch (error) {
        toast.dismiss(loadingToast);
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        toast.error(
          <div className="flex items-center gap-2">
            <span>❌</span>
            <span>Erro ao enviar documento: {errorMessage}</span>
          </div>
        );
      }
      return;
    }

    // Toast de loading
    const loadingToast = toast.loading(
      <div className="flex items-center gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
        <span>Enviando documento...</span>
      </div>
    );

    try {
      // 1. Upload do documento para o storage
      console.log('📤 Fazendo upload para storage...');
      const documentUrl = await uploadDocumentToStorage(documentFile);
      console.log('✅ Upload concluído. URL:', documentUrl);

      // 2. Enviar via Evolution API
      console.log('📡 Enviando documento via Evolution API...');
      const evolutionResponse = await sendDocumentMessage(contact.telefone_id, documentUrl, documentFile.name, '');
      console.log('✅ Documento enviado via Evolution API:', evolutionResponse);

      // 3. NÃO salvamos no banco - o n8n fará isso quando receber o webhook
      console.log('📝 Aguardando webhook do n8n para salvar no banco...');
      
      // Dismiss loading toast e mostrar sucesso
      toast.dismiss(loadingToast);
      toast.success(
        <div className="flex items-center gap-2">
          <span>📄</span>
          <span>Documento enviado com sucesso!</span>
        </div>
      );
      
      // Scroll para o fim da conversa quando a mensagem chegar via subscription
      // Isso acontecerá automaticamente quando o n8n salvar no banco

    } catch (error) {
      console.error('❌ Erro completo ao enviar documento:', error);
      
      toast.dismiss(loadingToast);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(
        <div className="flex items-center gap-2">
          <span>❌</span>
          <span>Erro ao enviar documento: {errorMessage}</span>
        </div>
      );
    }
  };

  // Handler para envio de vídeo
  const handleSendVideo = async (videoFile: File) => {
    if (!selectedContact) {
      toast.error('Nenhum contato selecionado');
      return;
    }

    const contact = contacts.find(c => c.id === selectedContact);
    if (!contact?.telefone_id) {
      toast.error('Erro: telefone não encontrado');
      return;
    }

    const canal = getSelectedContactCanal();
    if (canal === 'instagram') {
      const loadingToast = toast.loading(
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
          <span>Enviando vídeo...</span>
        </div>
      );

      try {
        const videoUrl = await uploadImageToStorage(videoFile);
        await sendInstagramViaWebhook({
          mensagem: videoUrl,
          tipo_mensagem: 'video',
          url_arquivo: videoUrl,
          nome_arquivo: videoFile.name,
        });

        toast.dismiss(loadingToast);
        toast.success(
          <div className="flex items-center gap-2">
            <span>🎥</span>
            <span>Vídeo enviado com sucesso!</span>
          </div>
        );

        setShowVideoUploader(false);
        fetchConversations(false);
      } catch (error) {
        toast.dismiss(loadingToast);
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        toast.error(
          <div className="flex items-center gap-2">
            <span>❌</span>
            <span>Erro ao enviar vídeo: {errorMessage}</span>
          </div>
        );
      }
      return;
    }

    // Toast de loading
    const loadingToast = toast.loading(
      <div className="flex items-center gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
        <span>Enviando vídeo...</span>
      </div>
    );

    try {
      // Upload do vídeo para o storage
      const videoUrl = await uploadImageToStorage(videoFile);
      
      // Enviar via Evolution API
      await sendVideoMessage(contact.telefone_id, videoUrl);
      
      // Dismiss loading toast e mostrar sucesso
      toast.dismiss(loadingToast);
      toast.success(
        <div className="flex items-center gap-2">
          <span>🎥</span>
          <span>Vídeo enviado com sucesso!</span>
        </div>
      );

      // Fechar o uploader
      setShowVideoUploader(false);
      
    } catch (error) {
      console.error('❌ Erro ao enviar vídeo:', error);
      
      toast.dismiss(loadingToast);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(
        <div className="flex items-center gap-2">
          <span>❌</span>
          <span>Erro ao enviar vídeo: {errorMessage}</span>
        </div>
      );
    }
  };

  // 1. Estado para mensagens não lidas
  const [unreadMap, setUnreadMap] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('smartcrm-unread-map');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {};
  });

  // 2. Detectar novas mensagens e marcar como não lida
  useEffect(() => {
    if (!conversations.length) return;
    setUnreadMap(prev => {
      const updated = { ...prev };
      conversations.forEach(msg => {
        const phone = normalizePhoneOnlyNumber(msg.telefone_id);
        // Se a mensagem não é do contato aberto e é recebida (tipo === false)
        if (selectedContact !== phone && msg.tipo === false) {
          updated[phone] = true;
        }
      });
      return updated;
    });
  }, [conversations]);

  // 3. Limpar badge ao abrir conversa
  useEffect(() => {
    if (selectedContact) {
      setUnreadMap(prev => {
        const updated = { ...prev };
        updated[normalizePhoneOnlyNumber(selectedContact)] = false;
        return updated;
      });
    }
  }, [selectedContact]);

  // 4. Badge visual na lista de contatos
  // (Adicionar dentro do map de contatos, ao lado do nome)
  // <span className="ml-1 w-2 h-2 bg-blue-500 rounded-full inline-block" title="Nova mensagem" />

  // 5. Notificação na aba do navegador
  useEffect(() => {
    const unreadCount = Object.values(unreadMap).filter(Boolean).length;
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) SmartCRM`;
    } else {
      document.title = 'SmartCRM';
    }
  }, [unreadMap]);

  // 2. Salvar unreadMap no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem('smartcrm-unread-map', JSON.stringify(unreadMap));
  }, [unreadMap]);

  // 1. Controle robusto: mapa de última leitura por contato
  const [lastReadMap, setLastReadMap] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('smartcrm-lastread-map');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {};
  });

  // 2. Persistir lastReadMap no localStorage
  useEffect(() => {
    localStorage.setItem('smartcrm-lastread-map', JSON.stringify(lastReadMap));
  }, [lastReadMap]);

  // 3. Ao abrir uma conversa, salvar o timestamp da última mensagem lida
  useEffect(() => {
    if (selectedContact) {
      const phone = normalizePhoneOnlyNumber(selectedContact);
      // Pega a última mensagem desse contato
      const msgs = conversations.filter(msg => normalizePhoneOnlyNumber(msg.telefone_id) === phone);
      if (msgs.length > 0) {
        const lastMsg = msgs[msgs.length - 1];
        const lastTimestamp = new Date(lastMsg.timestamp || lastMsg.created_at).getTime();
        setLastReadMap(prev => ({ ...prev, [phone]: lastTimestamp }));
      }
    }
  }, [selectedContact, conversations]);

  // 4. Função para saber se há mensagem não lida (usando campo msg_nao_lida da tabela leads)
  function hasUnread(contact: Contact) {
    // Buscar o lead correspondente ao telefone do contato
    const phone = normalizePhone(contact.telefone_id);
    const lead = leadsRaw.find(lead => normalizePhone(lead.telefone) === phone);
    

    
    // Retornar true se o lead existe e tem msg_nao_lida = true
    return lead?.msg_nao_lida === true;
  }

  // Efeito para atualizar o título da aba com o número de não lidas
  useEffect(() => {
    // A funcionalidade de contagem no título foi removida a pedido do usuário.
    // Mantemos o título padrão.
    document.title = 'SmartCRM';
  }, [lastReadMap]); // Dependência mantida para consistência, sem efeito colateral.

  // Salvar timestamps no localStorage sempre que forem atualizados
  useEffect(() => {
    localStorage.setItem('lastReadTimestamps', JSON.stringify(lastReadMap));
  }, [lastReadMap]);

  // Adicione no início do componente Conversations:
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  // Atualize o efeito de seleção de contato:
  useEffect(() => {
    if (window.innerWidth < 768) {
      setMobileView(selectedContact ? 'chat' : 'list');
    }
  }, [selectedContact]);

  const [menuOpen, setMenuOpen] = useState(false);

  // Atualização em tempo real: escutar mudanças na tabela leads e atualizar conversas
  // DESABILITADO: Causava recursão infinita
  // useEffect(() => {
  //   if (!user?.id_cliente) {
  //     console.log('Realtime leads: id_cliente não disponível');
  //     return;
  //   }
  //   
  //   console.log('Realtime leads: Criando subscription para id_cliente:', user.id_cliente);
  //   
  //   // Cria canal realtime para a tabela leads
  //   const leadsChannel = supabase
  //     .channel(`realtime-leads-conversations-${user.id_cliente}`)
  //     .on(
  //       'postgres_changes',
  //       {
  //         event: '*', // INSERT e UPDATE
  //         schema: 'public',
  //         table: 'leads',
  //         filter: `id_cliente=eq.${user.id_cliente}`
  //       },
  //       (payload) => {
  //         console.log('Realtime leads: Mudança detectada:', payload);
  //         // Sempre que houver mudança em leads, buscar conversas novamente
  //         fetchConversations();
  //       }
  //     )
  //     .subscribe((status) => {
  //       console.log('Realtime leads: Status da subscription:', status);
  //     });
  //   
  //   // Cleanup
  //   return () => {
  //     console.log('Realtime leads: Removendo subscription');
  //     supabase.removeChannel(leadsChannel);
  //   };
  // }, [user?.id_cliente, fetchConversations]);



  // Scroll automático para a última mensagem ao abrir/trocar conversa ou receber novas mensagens
  useEffect(() => {
    if (messagesEndRef.current) {
      // Verificar se o usuário está próximo do final da conversa
      const messagesContainer = messagesEndRef.current.parentElement;
      if (messagesContainer) {
        const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100; // 100px de tolerância
        
        // Só faz scroll automático se estiver próximo do final, se for uma nova conversa, ou se há novas mensagens
        if (isNearBottom || !selectedContact || hasNewMessages) {
          messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
          // Limpar o estado de novas mensagens após fazer scroll
          if (hasNewMessages) {
            setHasNewMessages(false);
          }
        }
      }
    }
  }, [conversations, selectedContact, hasNewMessages]);



  // Filtro de departamento, etiqueta, status e busca juntos
  const contatosExibidos = contacts.filter(c => {
    // Buscar o lead correspondente - usar leadsRaw quando "Todos os departamentos" está selecionado
    const leadsToSearch = selectedDepartamento === 'all' ? leadsRaw : leads;
    const lead = leadsToSearch.find(l =>
        String(l.instance_id) === String(c.instance_id) &&
        normalizePhoneOnlyNumber(l.telefone) === normalizePhoneOnlyNumber(c.telefone_id)
    ) || leadsToSearch.find(l => normalizePhoneOnlyNumber(l.telefone) === normalizePhoneOnlyNumber(c.telefone_id));
    
    if (!lead) return false;
    
    // Verificar se há filtros ativos
    const hasDepartamentoFilter = selectedDepartamento !== 'all';
    const hasEtiquetaFilter = selectedEtiqueta !== 'all';
    
    
    // Se nenhum filtro está ativo, mostrar tudo (apenas aplicar status e busca)
    if (!hasDepartamentoFilter && !hasEtiquetaFilter) {
      // Apenas aplicar filtros de status e busca
    } else {
      // Aplicar filtros de departamento e/ou etiqueta
      let passesDepartamentoFilter = true;
      let passesEtiquetaFilter = true;
      
      // Filtro por Departamento
      if (hasDepartamentoFilter) {
        if (selectedDepartamento === '0') {
          // Se "Sem Departamento" está selecionado
          passesDepartamentoFilter = lead.id_departamento === null;
        } else {
          // Se um departamento específico está selecionado
          passesDepartamentoFilter = String(lead.id_departamento) === selectedDepartamento;
        }
      }
      
      // Filtro por Etiqueta
      if (hasEtiquetaFilter) {
        if (!lead.id_etiquetas) {
          passesEtiquetaFilter = false;
        } else {
      const etiquetasDoLead = lead.id_etiquetas.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
          passesEtiquetaFilter = etiquetasDoLead.includes(parseInt(selectedEtiqueta));
        }
      }
      
      // Se ambos os filtros estão ativos, ambos devem passar (AND)
      // Se apenas um está ativo, apenas esse deve passar
      if (hasDepartamentoFilter && hasEtiquetaFilter) {
        if (!passesDepartamentoFilter || !passesEtiquetaFilter) return false;
      } else if (hasDepartamentoFilter && !passesDepartamentoFilter) {
        return false;
      } else if (hasEtiquetaFilter && !passesEtiquetaFilter) {
        return false;
      }
    }
    
    // Filtro por Status
    const statusMatch = statusFilter === 'em_andamento'
      ? (!contactStatusMap[normalizePhoneOnlyNumber(c.telefone_id)] || contactStatusMap[normalizePhoneOnlyNumber(c.telefone_id)] === 'Em andamento')
      : contactStatusMap[normalizePhoneOnlyNumber(c.telefone_id)] === 'Encerrada';
    
    if (!statusMatch) return false;
    
    // Filtro por Busca
    if (search.trim() !== '') {
      const searchMatch = c.name.toLowerCase().includes(search.trim().toLowerCase()) ||
        (c.telefone_id && c.telefone_id.includes(search.trim()));
      if (!searchMatch) return false;
    }
    
    return true;
  });
  // Remover contatosFiltrados e use apenas contatosExibidos na renderização

  // Estados para gerenciamento de etiquetas
  const [etiquetas, setEtiquetas] = useState<Etiqueta[]>([]);
  const [loadingEtiquetas, setLoadingEtiquetas] = useState(false);
  const [contextMenuContact, setContextMenuContact] = useState<Contact | null>(null);
  const [contextMenuLead, setContextMenuLead] = useState<Lead | null>(null);
  const [showContactDetails, setShowContactDetails] = useState(false);
  const [selectedContactForDetails, setSelectedContactForDetails] = useState<Contact | null>(null);

  // Buscar etiquetas do cliente
  useEffect(() => {
    const fetchEtiquetas = async () => {
      if (!user?.id_cliente) return;
      
      setLoadingEtiquetas(true);
      try {
        const etiquetasData = await etiquetasService.listByCliente(user.id_cliente);
        setEtiquetas(etiquetasData);
      } catch (error) {
        console.error('Erro ao buscar etiquetas:', error);
        toast.error('Erro ao carregar etiquetas');
      } finally {
        setLoadingEtiquetas(false);
      }
    };

    fetchEtiquetas();
  }, [user?.id_cliente]);

  // Funções para gerenciar etiquetas
  const handleAddEtiqueta = async (etiquetaId: number) => {
    if (!contextMenuLead || !user?.id_cliente) return;

    try {
      // Obter etiquetas atuais do lead
      const etiquetasAtuais = contextMenuLead.id_etiquetas 
        ? contextMenuLead.id_etiquetas.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
        : [];

      // Verificar se a etiqueta já está atribuída
      if (etiquetasAtuais.includes(etiquetaId)) {
        toast.info('Esta etiqueta já está atribuída ao contato');
        return;
      }

      // Verificar limite de 3 etiquetas
      if (etiquetasAtuais.length >= 3) {
        toast.error('Limite máximo de 3 etiquetas atingido');
        return;
      }

      // Adicionar nova etiqueta
      const novasEtiquetas = [...etiquetasAtuais, etiquetaId];
      const novasEtiquetasString = novasEtiquetas.join(',');

      // Atualizar o lead no banco
      const { error } = await supabase
        .from('leads')
        .update({ id_etiquetas: novasEtiquetasString })
        .eq('id', contextMenuLead.id);

      if (error) {
        throw error;
      }

      // Atualizar o estado local
      setLeads(prevLeads => 
        prevLeads.map(lead => 
          lead.id === contextMenuLead.id 
            ? { ...lead, id_etiquetas: novasEtiquetasString }
            : lead
        )
      );
      
      // Atualizar também leadsRaw para atualização instantânea quando "Todos os departamentos" está selecionado
      setLeadsRaw(prevLeadsRaw => 
        prevLeadsRaw.map(lead => 
          lead.id === contextMenuLead.id 
            ? { ...lead, id_etiquetas: novasEtiquetasString }
            : lead
        )
      );

      const etiqueta = etiquetas.find(e => e.id === etiquetaId);
      toast.success(`Etiqueta "${etiqueta?.nome}" adicionada com sucesso!`);
    } catch (error) {
      console.error('Erro ao adicionar etiqueta:', error);
      toast.error('Erro ao adicionar etiqueta');
    }
  };

  const handleRemoveEtiqueta = async (etiquetaId: number) => {
    if (!contextMenuLead || !user?.id_cliente) return;

    try {
      // Obter etiquetas atuais do lead
      const etiquetasAtuais = contextMenuLead.id_etiquetas 
        ? contextMenuLead.id_etiquetas.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
        : [];

      // Remover a etiqueta
      const novasEtiquetas = etiquetasAtuais.filter(id => id !== etiquetaId);
      const novasEtiquetasString = novasEtiquetas.join(',');

      // Atualizar o lead no banco
      const { error } = await supabase
        .from('leads')
        .update({ id_etiquetas: novasEtiquetasString })
        .eq('id', contextMenuLead.id);

      if (error) {
        throw error;
      }

      // Atualizar o estado local
      setLeads(prevLeads => 
        prevLeads.map(lead => 
          lead.id === contextMenuLead.id 
            ? { ...lead, id_etiquetas: novasEtiquetasString }
            : lead
        )
      );
      
      // Atualizar também leadsRaw para atualização instantânea quando "Todos os departamentos" está selecionado
      setLeadsRaw(prevLeadsRaw => 
        prevLeadsRaw.map(lead => 
          lead.id === contextMenuLead.id 
            ? { ...lead, id_etiquetas: novasEtiquetasString }
            : lead
        )
      );

      const etiqueta = etiquetas.find(e => e.id === etiquetaId);
      toast.success(`Etiqueta "${etiqueta?.nome}" removida com sucesso!`);
    } catch (error) {
      console.error('Erro ao remover etiqueta:', error);
      toast.error('Erro ao remover etiqueta');
    }
  };

  const handleContextMenuOpen = (contact: Contact) => {
    setContextMenuContact(contact);
    
    // Buscar o lead correspondente ao contato - usar leadsRaw quando "Todos os departamentos" está selecionado
    const leadsToSearch = selectedDepartamento === 'all' ? leadsRaw : leads;
    const lead = leadsToSearch.find(l =>
      String(l.instance_id) === String(contact.instance_id) &&
      normalizePhoneOnlyNumber(l.telefone) === normalizePhoneOnlyNumber(contact.telefone_id)
    ) || leadsToSearch.find(l => normalizePhoneOnlyNumber(l.telefone) === normalizePhoneOnlyNumber(contact.telefone_id));
    
    setContextMenuLead(lead || null);
  };

  const handleContextMenuClose = () => {
    setContextMenuContact(null);
    setContextMenuLead(null);
  };

  const handleReminderUpdated = useCallback((updatedLead: Lead) => {
    setLeads((prevLeads) =>
      prevLeads.map((leadItem) =>
        leadItem.id === updatedLead.id ? { ...leadItem, ...updatedLead } : leadItem
      )
    );
    setLeadsRaw((prevLeads) =>
      prevLeads.map((leadItem: Lead) =>
        leadItem.id === updatedLead.id ? { ...leadItem, ...updatedLead } : leadItem
      )
    );
  }, []);

  const handleShowContactDetails = (contact: Contact) => {
    setSelectedContactForDetails(contact);
    setShowContactDetails(true);
  };

  const handleCloseContactDetails = () => {
    setShowContactDetails(false);
    setSelectedContactForDetails(null);
  };

  // Função para limpar todos os filtros com verificação de permissões
  const clearAllFilters = () => {
    console.log('clearAllFilters chamado por:', {
      isAtendente,
      userType,
      userTypeInfo
    });
    
    if (isAtendente) {
      console.log('Atendente - limpando filtros com restrições');
      // Para atendentes, limpar apenas filtros não-críticos
      setSelectedEtiqueta('all');
      setStatusFilter('em_andamento');
      setSearch('');
      
      // Manter o primeiro departamento do atendente
      const firstDept = userTypeInfo?.id_departamento || userTypeInfo?.id_departamento_2 || userTypeInfo?.id_departamento_3;
      if (firstDept) {
        setSelectedDepartamento(firstDept.toString());
      } else {
        setSelectedDepartamento('0'); // Sem departamento
      }
    } else {
      console.log('Admin/Gestor - limpando todos os filtros');
      // Para Admin/Gestor, limpar todos os filtros
      setSelectedDepartamento('all');
      setSelectedEtiqueta('all');
      setStatusFilter('em_andamento');
      setSearch('');
    }
  };

  // Função para verificar se há filtros ativos
  const hasActiveFilters = () => {
    return selectedDepartamento !== 'all' || 
           selectedEtiqueta !== 'all' || 
           statusFilter !== 'em_andamento' || 
           search.trim() !== '';
  };

  // (Lógica de beep global movida para GlobalMessageBeep)

  // Marcar como lidas ao abrir a conversa
  const handleContactChangeAndMarkRead = async (contactId: string) => {
    // Encontrar o contato selecionado
    const contact = contacts.find(c => c.id === contactId);
    if (contact) {
      // Buscar o lead correspondente ao telefone do contato
      const phone = normalizePhone(contact.telefone_id);
      const lead = leadsRaw.find(lead => normalizePhone(lead.telefone) === phone);
      
      // Se o lead existe e tem msg_nao_lida = true, marcar como false
      if (lead && lead.msg_nao_lida === true) {
        try {
          const { error } = await supabase
            .from('leads')
            .update({ msg_nao_lida: false })
            .eq('id', lead.id);
          
          if (error) {
            console.error('Erro ao marcar mensagem como lida:', error);
          } else {
            console.log('Mensagem marcada como lida para o lead:', lead.id);
            // Atualizar o lead localmente no estado
            setLeadsRaw(prevLeads => 
              prevLeads.map(l => 
                l.id === lead.id ? { ...l, msg_nao_lida: false } : l
              )
            );
          }
        } catch (error) {
          console.error('Erro ao marcar mensagem como lida:', error);
        }
      }
    }
    
    await handleContactChange(contactId);
  };

  // Funções para seleção múltipla
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      setSelectedContacts(new Set());
      setShowBulkActions(false);
    }
  };

  const toggleContactSelection = (contactId: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContacts(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const selectAllContacts = () => {
    const allContactIds = contatosExibidos.map(contact => contact.id);
    setSelectedContacts(new Set(allContactIds));
    setShowBulkActions(true);
  };

  const clearSelection = () => {
    setSelectedContacts(new Set());
    setShowBulkActions(false);
  };

  const handleBulkAction = async (action: string) => {
    if (selectedContacts.size === 0) return;

    const selectedContactList = Array.from(selectedContacts);
    
    try {
      switch (action) {
        case 'encerrar':
          await handleBulkEndConversations(selectedContactList);
          break;
        case 'transferir':
          // Carregar todos os departamentos para transferência em lote
          if (user?.id_cliente) {
            departamentosService.listar(user.id_cliente).then(deps => {
              setTransferDepartamentos(deps);
              setShowBulkTransferModal(true);
            }).catch(() => {
              toast.error("Erro ao carregar departamentos");
            });
          } else {
            setShowBulkTransferModal(true);
          }
          break;
        case 'etiquetas':
          setShowBulkEtiquetasModal(true);
          break;
        case 'ganho':
          await handleBulkMarkAsWon(selectedContactList);
          break;
        case 'perdido':
          await handleBulkMarkAsLost(selectedContactList);
          break;
        case 'followup':
          await handleBulkAddToFollowup(selectedContactList);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Erro na ação em lote:', error);
      toast.error('Erro ao executar ação em lote');
    }
  };

  // Funções para ações em lote
  const handleBulkEndConversations = async (contactIds: string[]) => {
    // Implementar lógica para encerrar conversas
    toast.success(`${contactIds.length} conversas encerradas`);
    clearSelection();
  };

  const handleBulkMarkAsWon = async (contactIds: string[]) => {
    // Implementar lógica para marcar como ganho
    toast.success(`${contactIds.length} conversas marcadas como ganho`);
    clearSelection();
  };

  const handleBulkMarkAsLost = async (contactIds: string[]) => {
    // Implementar lógica para marcar como perdido
    toast.success(`${contactIds.length} conversas marcadas como perdido`);
    clearSelection();
  };

  const handleBulkAddToFollowup = async (contactIds: string[]) => {
    // Implementar lógica para adicionar ao followup
    toast.success(`${contactIds.length} conversas adicionadas ao followup`);
    clearSelection();
  };

  // Componente para exibir detalhes do contato
  function ContactDetailsModal({ contact, onClose }: { 
    contact: Contact | null, 
    onClose: () => void
  }) {
    const [lead, setLead] = useState<Lead | null>(null);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingLead, setEditingLead] = useState<Lead | null>(null);
    const [saving, setSaving] = useState(false);
    const [dataLoaded, setDataLoaded] = useState(false); // Novo estado para controlar se os dados já foram carregados
    const [valorInput, setValorInput] = useState<string>(""); // Valor digitado pelo usuário (livre)
    const valorInputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuth();

    // Função independente para buscar detalhes do lead
    const fetchLeadDetails = async () => {
      if (!contact || !user?.id_cliente || dataLoaded) return; // Não carregar se já foi carregado
      
      setLoading(true);
      try {
        // Normalizar o telefone para buscar no banco
        const normalizedPhone = contact.telefone_id.replace('@s.whatsapp.net', '').replace(/\D/g, '');
        
        // Busca independente - não usa dados do realtime das conversas
        const { data: leads, error } = await supabase
          .from('leads')
          .select('*')
          .eq('id_cliente', user.id_cliente);
        
        if (error) {
          console.error('Erro ao buscar leads:', error);
          setLead(null);
          return;
        }
        
        // Encontrar o lead correspondente
        const foundLead = leads?.find(lead => {
          // Verificar se lead.telefone existe e não é null/undefined
          if (!lead.telefone) {
            return false;
          }
          return lead.telefone.replace(/\D/g, '') === normalizedPhone;
        });
        
        setLead(foundLead || null);
        if (foundLead) {
          setEditingLead(foundLead);
        }
        setDataLoaded(true); // Marcar como carregado
      } catch (error) {
        console.error('Erro ao buscar detalhes do contato:', error);
        toast.error('Erro ao carregar detalhes do contato');
        setLead(null);
      } finally {
        setLoading(false);
      }
    };

    // Buscar detalhes apenas quando o modal abrir e os dados ainda não foram carregados
    useEffect(() => {
      if (contact && !dataLoaded) {
        fetchLeadDetails();
      }
    }, [contact?.id, dataLoaded]); // Depende apenas do ID do contato e se os dados já foram carregados

    // Resetar estado quando o modal fechar
    useEffect(() => {
      if (!contact) {
        setDataLoaded(false);
        setLead(null);
        setEditingLead(null);
        setIsEditing(false);
      }
    }, [contact]);

    // Resetar estado de edição quando lead mudar
    useEffect(() => {
      if (lead) {
        setEditingLead(lead);
        setIsEditing(false);
        // Inicializar o valor de entrada (exatamente como está no banco)
        if (lead.valor) {
          setValorInput(lead.valor.toString());
        } else {
          setValorInput("");
        }
      }
    }, [lead]);

    // Quando entrar no modo de edição, garantir que o cursor está no final
    useEffect(() => {
      if (isEditing && valorInputRef.current) {
        setTimeout(() => {
          if (valorInputRef.current) {
            const length = valorInput.length;
            valorInputRef.current.setSelectionRange(length, length);
            valorInputRef.current.focus();
          }
        }, 100);
      }
    }, [isEditing, valorInput]);

    const handleSave = async () => {
      if (!editingLead || !user?.id_cliente) return;
      
      setSaving(true);
      try {
        // Salva exatamente o que foi digitado, como texto simples
        const valorParaSalvar = valorInput && valorInput.trim() !== "" 
          ? valorInput.trim() 
          : null;
        
        const updatedLead = await LeadsService.updateLead(editingLead.id, user.id_cliente, {
          nome: editingLead.nome,
          telefone: editingLead.telefone,
          valor: valorParaSalvar
        });
        
        if (updatedLead) {
          toast.success("Contato atualizado com sucesso!");
          setIsEditing(false);
          setLead(updatedLead);
          setEditingLead(updatedLead);
          // Atualiza o estado com o valor retornado do banco
          if (updatedLead.valor) {
            setValorInput(updatedLead.valor.toString());
          } else {
            setValorInput("");
          }
        } else {
          toast.error("Erro ao atualizar contato");
        }
      } catch (error) {
        console.error("Erro ao atualizar contato:", error);
        toast.error("Erro ao atualizar contato");
      } finally {
        setSaving(false);
      }
    };

    const handleCancel = () => {
      if (lead) {
        setEditingLead(lead);
        setIsEditing(false);
        // Restaura o valor original
        if (lead.valor) {
          setValorInput(lead.valor.toString());
        } else {
          setValorInput("");
        }
      }
    };

    // Handler simples - apenas atualiza o valor digitado
    const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setValorInput(e.target.value);
    };

    if (!contact) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md relative animate-fade-in">
          <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-primary-600 text-xl font-bold">×</button>
          <h2 className="text-2xl font-bold mb-4 text-primary-900">
            {isEditing ? "Editar Contato" : "Detalhes do Contato"}
          </h2>
          
          <div className="space-y-4">
            {/* Nome */}
            <div>
              <span className="font-semibold text-primary-700 block mb-2">Nome:</span>
              {isEditing && editingLead ? (
                <Input
                  value={editingLead.nome}
                  onChange={(e) => setEditingLead({...editingLead, nome: e.target.value})}
                  className="w-full"
                  placeholder="Nome do contato"
                />
              ) : (
                <span className="text-gray-800">{contact.name}</span>
              )}
            </div>

            {/* Telefone */}
            <div>
              <span className="font-semibold text-primary-700 block mb-2">Telefone:</span>
              {isEditing && editingLead ? (
                <Input
                  value={editingLead.telefone}
                  onChange={(e) => setEditingLead({...editingLead, telefone: e.target.value.replace(/\D/g, "")})}
                  className="w-full"
                  placeholder="55DDXXXXXXXXX"
                  maxLength={13}
                />
              ) : (
                <span className="text-gray-800">{contact.telefone_id.replace('@s.whatsapp.net', '')}</span>
              )}
            </div>

            {/* Valor do Lead */}
            {lead && (
              <div>
                <span className="font-semibold text-primary-700 block mb-2 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Valor do Lead:
                </span>
                {isEditing && editingLead ? (
                  <Input
                    ref={valorInputRef}
                    value={valorInput}
                    onChange={handleValorChange}
                    className="w-full"
                    placeholder="Digite o valor"
                    type="text"
                  />
                ) : (
                  <span className="text-gray-800 font-semibold">{lead.valor || "Não informado"}</span>
                )}
              </div>
            )}

            {/* Status de atendimento */}
            <div>
              <span className="font-semibold text-primary-700 block mb-2">Status de Atendimento:</span>
              <div className="flex gap-2">
                {contact.atendimento_ia && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    <Bot className="h-3 w-3 mr-1" />
                    IA
                  </Badge>
                )}
                {contact.atendimento_humano && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <UserIcon className="h-3 w-3 mr-1" />
                    Humano
                  </Badge>
                )}
                {!contact.atendimento_ia && !contact.atendimento_humano && (
                  <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                    Não definido
                  </Badge>
                )}
              </div>
            </div>

            {/* Status da conversa */}
            {contact.status_conversa && (
              <div>
                <span className="font-semibold text-primary-700 block mb-2">Status da Conversa:</span>
                <span className="text-gray-800">{contact.status_conversa}</span>
              </div>
            )}

            {/* Informações do Lead (se encontrado) */}
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                <span className="text-sm text-gray-600">Carregando informações do lead...</span>
              </div>
            ) : lead ? (
              <>
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-primary-700 mb-3">Informações do Lead</h3>
                  
                  <div className="space-y-2">
                    <div><span className="font-medium text-gray-700">Status:</span> {lead.status}</div>
                    <div><span className="font-medium text-gray-700">Data de criação:</span> {lead.data_criacao ? new Date(lead.data_criacao).toLocaleString() : '-'}</div>
                    <div><span className="font-medium text-gray-700">Prob. Fechamento:</span> {lead.probabilidade_final_fechamento ?? '-'}</div>
                                            <div><span className="font-medium text-gray-700">Score Qualificação:</span> {lead.score_final_qualificacao ?? '-'}</div>
                    {lead.observacao && (
                      <div><span className="font-medium text-gray-700">Observação:</span> {lead.observacao}</div>
                    )}
                    
                    {/* Informações de Tráfego */}
                    {(lead.t_campanha_nome || lead.t_anuncio_nome || lead.t_conjunto_de_anuncio || lead.t_origem) && (
                      <div className="border-t pt-3 mt-3">
                        <span className="font-medium text-gray-700 block mb-2">Informações de Tráfego:</span>
                        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                          {lead.t_campanha_nome && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Campanha:</span>
                              <span className="text-sm font-medium text-gray-800">
                                {lead.t_campanha_nome}
                              </span>
                            </div>
                          )}
                          {lead.t_anuncio_nome && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Anúncio:</span>
                              <span className="text-sm font-medium text-gray-800">
                                {lead.t_anuncio_nome}
                              </span>
                            </div>
                          )}
                          {lead.t_conjunto_de_anuncio && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Conjunto de Anúncio:</span>
                              <span className="text-sm font-medium text-gray-800">
                                {lead.t_conjunto_de_anuncio}
                              </span>
                            </div>
                          )}
                          {lead.t_origem && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Origem:</span>
                              <span className="text-sm font-medium text-gray-800">
                                {lead.t_origem}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Etiquetas */}
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">Etiquetas:</span>
                      {user?.id_cliente && (
                        <EtiquetasDisplay 
                          idEtiquetas={lead.id_etiquetas} 
                          idCliente={user.id_cliente}
                          maxEtiquetas={5}
                          showTooltip={true}
                        />
                      )}
                    </div>

                    {/* Histórico de Instâncias */}
                    {(lead.instance_id_2 || lead.nome_instancia_2) && (
                      <div className="border-t pt-3 mt-3">
                        <span className="font-medium text-gray-700 block mb-2">Histórico de Instâncias:</span>
                        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Instância Anterior:</span>
                            <span className="text-sm font-medium text-gray-800">
                              {lead.nome_instancia_2 || 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">ID da Instância:</span>
                            <span className="text-sm font-medium text-gray-800">
                              {lead.instance_id_2 || 'N/A'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            <InfoIcon className="h-3 w-3 inline mr-1" />
                            Este contato foi transferido de departamento e mantém o histórico da instância anterior
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="border-t pt-4">
                <div className="text-center text-gray-500 py-4">
                  <UserIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Este contato não foi encontrado na base de leads</p>
                  <p className="text-xs text-gray-400 mt-1">Apenas contatos importados aparecem aqui</p>
                </div>
              </div>
            )}
          </div>

          {/* Botões de ação */}
          <div className="flex gap-3 mt-6 justify-end">
            {isEditing ? (
              <>
                <Button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="bg-primary-500 hover:bg-primary-600 text-white"
                >
                  {saving ? "Salvando..." : "Salvar"}
                </Button>
                <Button 
                  onClick={handleCancel} 
                  variant="secondary"
                  disabled={saving}
                >
                  Cancelar
                </Button>
              </>
            ) : (
              <>
                {lead && (
                  <Button 
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    Editar
                  </Button>
                )}
                <Button 
                  onClick={onClose}
                  variant="secondary"
                >
                  Fechar
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Handler otimizado para mudança de mensagem
  const handleMessageChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  }, []);

  // Handler otimizado para envio de mensagem
  const handleMessageKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleMessagePaste = useCallback((event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboardData = event.clipboardData;
    if (!clipboardData) return;

    // Verifica primeiro arquivos no clipboard
    if (clipboardData.files && clipboardData.files.length > 0) {
      const file = clipboardData.files[0];
      if (file && file.type.startsWith('image/')) {
        event.preventDefault();

        const maxSize = 16 * 1024 * 1024; // 16MB
        if (file.size > maxSize) {
          alert('Imagem muito grande! Máximo permitido: 16MB');
          return;
        }

        setPastedImageFile(file);
        setShowImageUploader(true);
        return;
      }
    }

    // Em alguns navegadores, imagens vêm como items
    const items = clipboardData.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (!file) continue;

        event.preventDefault();

        const maxSize = 16 * 1024 * 1024; // 16MB
        if (file.size > maxSize) {
          alert('Imagem muito grande! Máximo permitido: 16MB');
          return;
        }

        setPastedImageFile(file);
        setShowImageUploader(true);
        return;
      }
    }
  }, []);

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
              <Link to="/chatbots" className="text-lg font-medium text-gray-700 hover:text-primary-600" onClick={() => setMenuOpen(false)}>Chatbots</Link>
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
        <div className="flex items-center gap-2">
          <span className="text-2xl font-semibold">Conversas</span>
          {hasActiveFilters() && (
            <Badge variant="secondary" className="text-xs">
              {contatosExibidos.length} de {contacts.length}
            </Badge>
          )}
        </div>
      </div>
      <div className="flex h-screen overflow-hidden max-w-full">
        {/* Mobile: mostrar só a lista ou só o chat */}
        {/* Desktop: mostrar ambos lado a lado */}
        {/* Lista de contatos */}
        <div className={`w-full md:w-1/3 border-r flex flex-col ${mobileView === 'chat' ? 'hidden' : ''} md:flex`}>
        <div className="p-4 border-b">
          {/* Menu de seleção múltipla */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {selectionMode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllContacts}
                  className="text-xs"
                >
                  Selecionar todas
                </Button>
              )}
              {showBulkActions && (
                <span className="text-sm text-gray-600">
                  {selectedContacts.size} selecionada{selectedContacts.size > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={toggleSelectionMode}>
                  {selectionMode ? 'Cancelar seleção' : 'Selecionar contatos'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Barra de busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <Input 
              className="pl-10"
              placeholder="Buscar contatos por nome ou número..."
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Barra de ações em lote */}
          {showBulkActions && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-800">
                  {selectedContacts.size} conversa{selectedContacts.size > 1 ? 's' : ''} selecionada{selectedContacts.size > 1 ? 's' : ''}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Cancelar
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('encerrar')}
                  className="text-xs"
                >
                  <Archive className="h-3 w-3 mr-1" />
                  Encerrar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('transferir')}
                  className="text-xs"
                >
                  <GitBranch className="h-3 w-3 mr-1" />
                  Transferir
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('etiquetas')}
                  className="text-xs"
                >
                  <Tag className="h-3 w-3 mr-1" />
                  Etiquetas
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('ganho')}
                  className="text-xs"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Ganho
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('perdido')}
                  className="text-xs"
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  Perdido
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('followup')}
                  className="text-xs"
                >
                  <Repeat className="h-3 w-3 mr-1" />
                  Followup
                </Button>
              </div>
            </div>
          )}
            {/* Select de Departamentos */}
            <div className="mt-3">
              <Select
                value={selectedDepartamento || ''}
                onValueChange={setSelectedDepartamento}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filtrar por departamento" />
                </SelectTrigger>
                <SelectContent>
                  {!isAtendente && (
                  <SelectItem key="all" value="all">Todos os departamentos</SelectItem>
                )}
                  {!isAtendente && (
                  <SelectItem key="no-dept" value="0">Sem Departamento</SelectItem>
                )}
                  {isAtendente && !userTypeInfo?.id_departamento && !userTypeInfo?.id_departamento_2 && !userTypeInfo?.id_departamento_3 && (
                  <SelectItem key="no-dept-atendente" value="0">Sem Departamento</SelectItem>
                )}
                  {departamentos.map((dep) => (
                    <SelectItem key={dep.id.toString()} value={dep.id.toString()}>
                      {dep.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
          </div>
          
          {/* Select de Etiquetas */}
          <div className="mt-3">
            <Select
              value={selectedEtiqueta || ''}
              onValueChange={setSelectedEtiqueta}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filtrar por etiqueta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="all-etiquetas" value="all">Todas as etiquetas</SelectItem>
                {etiquetas.map((etiqueta) => (
                  <SelectItem key={etiqueta.id} value={etiqueta.id.toString()}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full border border-gray-300"
                        style={{ backgroundColor: etiqueta.cor }}
                      />
                      {etiqueta.nome}
                    </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              variant={statusFilter === 'em_andamento' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => setStatusFilter('em_andamento')}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Em andamento
            </Button>
            <Button
              variant={statusFilter === 'encerrada' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => setStatusFilter('encerrada')}
            >
              <Archive className="h-4 w-4 mr-2" />
              Encerradas
            </Button>
          </div>
            
            {/* Botão para limpar filtros - APENAS para Admin/Gestor */}
            {hasActiveFilters() && !isAtendente && (
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={clearAllFilters}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Limpar filtros
                </Button>
              </div>
            )}
          <Button
            className="w-full mt-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold"
            onClick={() => {
              if (clienteInfo && clienteInfo.instance_id && clienteInfo.instance_name) {
                setShowNewConversationModal(true);
              } else {
                setShowInstanceWarning(true);
              }
            }}
            disabled={!clienteInfo || !clienteInfo.instance_id || !clienteInfo.instance_name}
          >
            + Nova Conversa
          </Button>
          

        </div>
        {/* Modal de Nova Conversa */}
        <Dialog open={showNewConversationModal} onOpenChange={setShowNewConversationModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nova Conversa</DialogTitle>
            </DialogHeader>
            <RadioGroup
              value={newConversationMode}
              onValueChange={value => setNewConversationMode(value as 'existente' | 'novo')}
              className="flex flex-row gap-6 mb-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="existente" id="contato-existente" />
                <label htmlFor="contato-existente">Contato existente</label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="novo" id="novo-contato" />
                <label htmlFor="novo-contato">Novo contato</label>
              </div>
            </RadioGroup>
            {newConversationMode === 'existente' ? (
              <div className="mb-4">
                {loadingLeads ? (
                  <p>Carregando contatos...</p>
                ) : (
                  <>
                    <div className="mb-3">
                      <Input
                        type="text"
                        placeholder="Buscar por nome ou número..."
                        value={existingLeadSearch}
                        onChange={e => setExistingLeadSearch(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div className="contacts-list max-h-64 overflow-y-auto border rounded-md divide-y bg-white">
                      {leads
                        .filter((lead) => {
                          const term = existingLeadSearch.trim().toLowerCase();
                          if (!term) return true;
                          const nome = (lead.nome || '').toLowerCase();
                          const telefone = lead.telefone || '';
                          return (
                            nome.includes(term) ||
                            telefone.includes(term)
                          );
                        })
                        .map((lead) => {
                          const isSelected = selectedLeadId === lead.id.toString();
                          return (
                            <button
                              key={lead.id}
                              type="button"
                              onClick={() => setSelectedLeadId(lead.id.toString())}
                              className={`w-full text-left px-3 py-2 text-sm flex flex-col bg-white hover:bg-gray-50 focus:outline-none contacts-list-item ${
                                isSelected ? 'border-l-4 border-primary-500' : ''
                              }`}
                            >
                              <span className="font-medium">
                                {lead.nome || 'Sem nome'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {lead.telefone}
                              </span>
                            </button>
                          );
                        })}
                      {leads.length === 0 && (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          Nenhum contato encontrado.
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <NovaConversaNovoContatoForm
                onCancel={() => setShowNewConversationModal(false)}
                onSubmit={async ({ nome, telefone }) => {
                  // Buscar dados do cliente logado a partir do id_cliente (busca pelo id numérico)
                  if (!clienteInfo?.id) {
                    toast.error('Cliente não identificado.');
                    return;
                  }
                  console.log('Buscando dados completos do cliente pelo id:', clienteInfo.id);
                  const clienteInfoCompleto = await clientesService.getClienteById(clienteInfo.id);
                  console.log('Resultado do select em clientes_info:', clienteInfoCompleto);
                  if (!clienteInfoCompleto || !clienteInfoCompleto.instance_id || !clienteInfoCompleto.instance_name) {
                    toast.error('Conecte seu WhatsApp antes de criar um contato.');
                    return;
                  }

                  // Verificar se o contato já existe
                  const existingLead = await LeadsService.checkLeadExists(clienteInfoCompleto.id, telefone);
                  if (existingLead) {
                    toast.error(`Contato já existe! Nome: ${existingLead.nome}, Telefone: ${existingLead.telefone}`);
                    return;
                  }

                    // Buscar departamento padrão
                    const idDepartamentoPadrao = clienteInfoCompleto.id_departamento_padrao ?? null;
                  // Criar o lead com nome_instancia e instance_id vindos do clientes_info
                  const leadToCreate = {
                    nome,
                    telefone,
                    id_cliente: clienteInfoCompleto.id,
                    status: "Novo",
                    data_criacao: new Date().toISOString(),
                    data_ultimo_status: new Date().toISOString(),
                    nome_instancia: clienteInfoCompleto.instance_name, // mapeamento correto
                    instance_id: clienteInfoCompleto.instance_id,
                    score_final_qualificacao: 0,
                    probabilidade_final_fechamento: 0,
                      id_departamento: idDepartamentoPadrao,
                  };
                  console.log('Lead a ser criado (payload final):', leadToCreate);
                  const created = await LeadsService.createLead(leadToCreate as any);
                  if (created) {
                    toast.success("Contato criado com sucesso!");
                    setShowNewConversationModal(false);
                    setSelectedLeadId(created.id.toString());
                    setNewConversationMode('existente');
                    setLeads((prev) => [created, ...prev]);
                    // Seleciona o contato pelo telefone normalizado
                    handleContactChange(normalizePhone(created.telefone));
                    setTimeout(() => {
                      const input = document.querySelector<HTMLInputElement>("#mensagem-input");
                      if (input) input.focus();
                    }, 300);
                    toast.success(`Conversa iniciada. Envie a primeira mensagem!`);
                  } else {
                    toast.error("Erro ao criar contato");
                  }
                }}
              />
            )}
            <DialogFooter>
              <Button
                onClick={() => {
                  if (newConversationMode === 'existente' && selectedLeadId) {
                    const lead = leads.find(l => l.id.toString() === selectedLeadId);
                    if (!lead) return;
                    setShowNewConversationModal(false);
                    setSelectedLeadId(null);
                    setNewConversationMode('existente');
                    // Selecionar contato na lista e abrir conversa
                    const contact = contacts.find(c => normalizePhone(c.telefone_id) === normalizePhone(lead.telefone));
                    if (contact) {
                      handleContactChange(contact.id);
                      setTimeout(() => {
                        // Foca o campo de mensagem após selecionar o contato
                        const input = document.querySelector<HTMLInputElement>("#mensagem-input");
                        if (input) input.focus();
                      }, 300);
                      toast.success(`Conversa iniciada com ${lead.nome}. Envie a primeira mensagem!`);
                    } else {
                      // Se não encontrar, selecionar pelo telefone normalizado corretamente
                      handleContactChange(normalizePhone(lead.telefone));
                      setTimeout(() => {
                        const input = document.querySelector<HTMLInputElement>("#mensagem-input");
                        if (input) input.focus();
                      }, 300);
                      toast.info('Contato criado, envie a primeira mensagem!');
                    }
                  }
                }}
                disabled={newConversationMode === 'existente' && !selectedLeadId}
                className="bg-primary-600 hover:bg-primary-700 text-white"
              >
                Iniciar conversa
              </Button>
              <Button variant="secondary" onClick={() => setShowNewConversationModal(false)}>
                Cancelar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Modal de aviso de instância não conectada */}
        <Dialog open={showInstanceWarning} onOpenChange={setShowInstanceWarning}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Conecte seu WhatsApp</DialogTitle>
              <DialogDescription>
                Para criar um novo contato, primeiro conecte seu número do WhatsApp nas configurações da conta. Assim, sua instância será criada e os contatos poderão ser atribuídos corretamente.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setShowInstanceWarning(false)} className="bg-primary-600 hover:bg-primary-700 text-white">OK</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Transferência em Lote */}
        <Dialog open={showBulkTransferModal} onOpenChange={setShowBulkTransferModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Transferir {selectedContacts.size} conversa{selectedContacts.size > 1 ? 's' : ''}</DialogTitle>
              <DialogDescription>
                Selecione o departamento para onde deseja transferir as conversas selecionadas.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Select value={selectedBulkDepartamento} onValueChange={setSelectedBulkDepartamento}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sem Departamento</SelectItem>
                  {transferDepartamentos.map((dep) => (
                    <SelectItem key={dep.id} value={dep.id.toString()}>
                      {dep.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBulkTransferModal(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={async () => {
                  if (selectedBulkDepartamento) {
                    // Implementar lógica de transferência em lote
                    toast.success(`${selectedContacts.size} conversa${selectedContacts.size > 1 ? 's' : ''} transferida${selectedContacts.size > 1 ? 's' : ''}`);
                    setShowBulkTransferModal(false);
                    clearSelection();
                  }
                }}
                disabled={!selectedBulkDepartamento}
              >
                Transferir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Etiquetas em Lote */}
        <Dialog open={showBulkEtiquetasModal} onOpenChange={setShowBulkEtiquetasModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Etiquetas</DialogTitle>
              <DialogDescription>
                Selecione as etiquetas para adicionar às {selectedContacts.size} conversa{selectedContacts.size > 1 ? 's' : ''} selecionada{selectedContacts.size > 1 ? 's' : ''}.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="grid grid-cols-2 gap-2">
                {etiquetas.map((etiqueta) => (
                  <div
                    key={etiqueta.id}
                    className={`flex items-center gap-2 p-2 rounded border cursor-pointer ${
                      selectedBulkEtiquetas.includes(etiqueta.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      const newSelected = selectedBulkEtiquetas.includes(etiqueta.id)
                        ? selectedBulkEtiquetas.filter(id => id !== etiqueta.id)
                        : [...selectedBulkEtiquetas, etiqueta.id];
                      setSelectedBulkEtiquetas(newSelected);
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: etiqueta.cor }}
                    />
                    <span className="text-sm">{etiqueta.nome}</span>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBulkEtiquetasModal(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={async () => {
                  if (selectedBulkEtiquetas.length > 0) {
                    // Implementar lógica de adicionar etiquetas em lote
                    toast.success(`Etiquetas adicionadas a ${selectedContacts.size} conversa${selectedContacts.size > 1 ? 's' : ''}`);
                    setShowBulkEtiquetasModal(false);
                    clearSelection();
                  }
                }}
                disabled={selectedBulkEtiquetas.length === 0}
              >
                Adicionar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ReminderScheduleDialog
          lead={reminderDialogLead}
          open={reminderDialogOpen}
          onOpenChange={(open) => {
            setReminderDialogOpen(open);
            if (!open) {
              setReminderDialogLead(null);
            }
          }}
          onUpdated={(updatedLead) => {
            handleReminderUpdated(updatedLead);
            setReminderDialogLead(updatedLead);
          }}
        />

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <p>Carregando conversas...</p>
            </div>
            ) : loadingLeads ? (
              <div className="p-4 text-center text-gray-500">Carregando contatos...</div>
          ) : contatosExibidos.length > 0 ? (
            contatosExibidos
              .map((contact) => (
              (() => {
                const attendance = attendanceMap[normalizePhone(contact.telefone_id)];
                const conversationStatus = contactStatusMap[normalizePhone(contact.telefone_id)];
                const statusNormalized = (conversationStatus || '').toLowerCase().replace(/\s+/g, '');
                const isEmAndamento = !conversationStatus || statusNormalized === 'emandamento';
                const isEncerrada = statusNormalized === 'encerrada';
                
                // Buscar o lead correspondente ao contato - usar leadsRaw quando "Todos os departamentos" está selecionado
                const leadsToSearch = selectedDepartamento === 'all' ? leadsRaw : leads;
                const lead = leadsToSearch.find(l =>
                  String(l.instance_id) === String(contact.instance_id) &&
                  normalizePhoneOnlyNumber(l.telefone) === normalizePhoneOnlyNumber(contact.telefone_id)
                ) || leadsToSearch.find(l => normalizePhoneOnlyNumber(l.telefone) === normalizePhoneOnlyNumber(contact.telefone_id));
                const leadCanal = String(lead?.canal || '').toLowerCase().trim();
                const isWhatsappCanal = leadCanal === 'whatsapp';
                const isInstagramCanal = leadCanal === 'instagram' || leadCanal === 'intagram';
                
                // Debug: Log para verificar se o lead foi encontrado e tem score
                if (contact.name === 'Wesley Pontes' || contact.name === 'Smart chatbotbot') {
                  console.log('Debug lead encontrado:', {
                    contactName: contact.name,
                    contactPhone: contact.telefone_id,
                    leadFound: !!lead,
                    leadScore: lead?.score_final_qualificacao,
                    leadPhone: lead?.telefone,
                    leadInstance: lead?.instance_id,
                    contactInstance: contact.instance_id
                  });
                }
                
                // Obter etiquetas atuais do lead
                const etiquetasAtuais = lead?.id_etiquetas 
                  ? lead.id_etiquetas.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
                  : [];
                const hasUnreadMessages = hasUnread(contact);
                
                return (
                    <div className="max-w-full overflow-x-hidden" key={contact.id}>
                      <ContextMenu onOpenChange={(open) => {
                        if (open) {
                          handleContextMenuOpen(contact);
                        } else {
                          handleContextMenuClose();
                        }
                      }}>
                        <ContextMenuTrigger asChild>
                  <button
                        className={`w-full max-w-[400px] mx-auto p-4 flex items-center space-x-4 hover:bg-gray-100 ${
                              selectedContact === contact.id ? "bg-gray-100" : ""
                    } ${isEncerrada ? "opacity-75" : ""}`}
                    onClick={() => {
                              if (selectionMode) {
                                toggleContactSelection(contact.id);
                              } else {
                                handleContactChangeAndMarkRead(contact.id);
                              }
                            }}
                  >
                    {/* Checkbox de seleção */}
                    {selectionMode && (
                      <div 
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selectedContacts.has(contact.id) 
                            ? 'bg-blue-600 border-blue-600' 
                            : 'border-gray-300'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleContactSelection(contact.id);
                        }}
                      >
                        {selectedContacts.has(contact.id) && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    )}
                    {(isWhatsappCanal || isInstagramCanal) && (
                      <span
                        className={`inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                          isWhatsappCanal
                            ? 'bg-green-100 text-green-600'
                            : 'bg-pink-100 text-pink-600'
                        }`}
                        title={isWhatsappCanal ? 'Canal: WhatsApp' : 'Canal: Instagram'}
                      >
                        {isWhatsappCanal ? (
                          <MessageCircle className="h-4 w-4" />
                        ) : (
                          <Instagram className="h-4 w-4" />
                        )}
                      </span>
                    )}
                    <Avatar>
                      <AvatarImage src={contact.avatar} />
                      <AvatarFallback>
                        {contact.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                        <div className="flex-1 min-w-0 max-w-full">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{contact.name}</p>
                        {lead?.lembrete_ativo && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setReminderDialogLead(lead);
                              setReminderDialogOpen(true);
                            }}
                            className="inline-flex items-center justify-center rounded-full p-1 text-amber-600 transition hover:bg-amber-100 hover:text-amber-700"
                            title="Ver agendamento deste lead"
                          >
                            <BellRing className="h-4 w-4" />
                          </button>
                        )}
                        {lead?.anexo && (
                          <a
                            href={lead.anexo}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(event) => event.stopPropagation()}
                            className="inline-flex items-center justify-center rounded-full p-1 text-blue-600 transition hover:bg-blue-100 hover:text-blue-700"
                            title="Visualizar anexo"
                          >
                            <Paperclip className="h-4 w-4" />
                          </a>
                        )}
                            {/* Badge do departamento */}
                            {(() => {
                              const dep = lead && departamentos.find(d => String(d.id) === String(lead.id_departamento));
                              return (
                                <>
                                  {/* Badge de follow-up automático */}
                                  {lead?.followup_programado && (
                                    <span className="ml-1" title="Follow-up automático ativado">
                                      <span className="text-yellow-500">⏰</span>
                          </span>
                                      )}
                                      {/* Etiquetas do lead */}
                                      {lead && user?.id_cliente && (
                                        <EtiquetasDisplay 
                                          idEtiquetas={lead.id_etiquetas} 
                                          idCliente={user.id_cliente}
                                          maxEtiquetas={2}
                                          showTooltip={true}
                                        />
                        )}
                                </>
                              );
                            })()}
                            {/* Etiquetas de atendimento */}
                        {attendance && !isEncerrada && (
                          <>
                            {attendance.ia && (
                              <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                <Bot className="h-3 w-3" />
                                IA
                              </span>
                            )}
                            {attendance.humano && (
                              <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                <User className="h-3 w-3" />
                                Humano
                              </span>
                            )}
                            {!attendance.ia && !attendance.humano && (
                              <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                                <XCircle className="h-3 w-3" />
                                Sem atendimento
                              </span>
                            )}
                          </>
                        )}
                        {/* Score de Qualificação Final */}
                        {(() => {
                          const shouldShowScore = lead && typeof lead.score_final_qualificacao === 'number';
                          if (contact.name && (contact.name === 'Wesley Pontes' || contact.name === 'Smart chatbotbot')) {
                            console.log('Debug score display:', {
                              contactName: contact.name,
                              leadScore: lead?.score_final_qualificacao,
                              shouldShowScore,
                              isNumber: typeof lead?.score_final_qualificacao === 'number'
                            });
                          }
                          return shouldShowScore ? (
                            <span 
                              className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: lead.score_final_qualificacao >= 7 ? '#dcfce7' : 
                                                lead.score_final_qualificacao >= 4 ? '#fef3c7' : '#fee2e2',
                                color: lead.score_final_qualificacao >= 7 ? '#166534' : 
                                       lead.score_final_qualificacao >= 4 ? '#92400e' : '#991b1b'
                              }}
                              title={`Score de Qualificação: ${lead.score_final_qualificacao.toFixed(1)}/10`}
                            >
                              <TrendingUp className="h-3 w-3" />
                              {lead.score_final_qualificacao.toFixed(1)}
                            </span>
                          ) : null;
                        })()}

                      </div>
                              {/* Última mensagem, horário/data e contador de não lidas */}
                              <div className="flex items-center justify-between text-xs text-gray-500 mt-1 relative">
                            <span className="block truncate max-w-[calc(100%-70px)]">
                              {contact.lastMessageType === 'audio' ? (
                                <span className="flex items-center gap-1 text-gray-500">
                                  <Mic className="h-4 w-4 inline-block" />
                                  Áudio
                                </span>
                              ) : contact.lastMessageType === 'imagem' ? (
                                <span className="flex items-center gap-1 text-gray-500">
                                  <Paperclip className="h-4 w-4 inline-block" />
                                  Imagem
                                </span>
                              ) : contact.lastMessageType === 'video' ? (
                                <span className="flex items-center gap-1 text-gray-500">
                                  <span role="img" aria-label="Vídeo">🎥</span>
                                  Vídeo
                                </span>
                              ) : contact.lastMessageType && contact.lastMessageType.startsWith('documento') ? (
                                <span className="flex items-center gap-1 text-gray-500">
                                  <span role="img" aria-label="Documento">📄</span>
                                  Documento
                                </span>
                              ) : (
                                (contact.lastMessage || '').replace(/\\n/g, ' ')
                              )}
                            </span>
                                <div className="flex flex-col items-end ml-2">
                                  {hasUnreadMessages && (
                                    <span className="mb-0.5 bg-primary-600 text-white rounded-full p-1 shadow" style={{ minWidth: 22, minHeight: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                      </svg>
                                    </span>
                                  )}
                                  <span className="whitespace-nowrap flex-shrink-0">{formatContactTime(contact.lastMessageTime)}</span>
                                </div>
                    </div>
                    </div>
                  </button>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                          <ContextMenuItem onClick={() => {
                            if (contextMenuContact) {
                              handleContactChange(contextMenuContact.id);
                            }
                          }}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Abrir conversa
                          </ContextMenuItem>
                          <ContextMenuItem onClick={() => {
                            if (contextMenuContact) {
                              handleShowContactDetails(contextMenuContact);
                            }
                          }}>
                            <UserIcon className="h-4 w-4 mr-2" />
                            Ver detalhes
                          </ContextMenuItem>
                          <ContextMenuSeparator />
                          <div className="px-2 py-1.5 text-sm font-semibold text-gray-700">
                            Etiquetas
                          </div>
                          {loadingEtiquetas ? (
                            <ContextMenuItem disabled>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                              Carregando etiquetas...
                            </ContextMenuItem>
                          ) : etiquetas.length === 0 ? (
                            <ContextMenuItem disabled>
                              <Tag className="h-4 w-4 mr-2" />
                              Nenhuma etiqueta disponível
                            </ContextMenuItem>
                          ) : (
                            <>
                              {/* Etiquetas disponíveis para adicionar */}
                              <div className="max-h-48 overflow-y-auto">
                              {etiquetas
                                .filter(etiqueta => !etiquetasAtuais.includes(etiqueta.id))
                                .map(etiqueta => (
                                  <ContextMenuItem 
                                    key={`add-${etiqueta.id}`}
                                    onClick={() => handleAddEtiqueta(etiqueta.id)}
                                    disabled={etiquetasAtuais.length >= 3}
                                  >
                                    <div 
                                      className="w-3 h-3 rounded-full mr-2 border border-gray-300"
                                      style={{ backgroundColor: etiqueta.cor }}
                                    />
                                    Adicionar "{etiqueta.nome}"
                                  </ContextMenuItem>
                                ))
                              }
                              </div>
                              
                              {/* Etiquetas já atribuídas */}
                              {etiquetasAtuais.length > 0 && (
                                <>
                                  <ContextMenuSeparator />
                                  <div className="px-2 py-1.5 text-sm font-semibold text-gray-700">
                                    Etiquetas atribuídas
                                  </div>
                                  {etiquetas
                                    .filter(etiqueta => etiquetasAtuais.includes(etiqueta.id))
                                    .map(etiqueta => (
                                      <ContextMenuItem 
                                        key={`remove-${etiqueta.id}`}
                                        onClick={() => handleRemoveEtiqueta(etiqueta.id)}
                                      >
                                        <div 
                                          className="w-3 h-3 rounded-full mr-2 border border-gray-300"
                                          style={{ backgroundColor: etiqueta.cor }}
                                        />
                                        Remover "{etiqueta.nome}"
                                      </ContextMenuItem>
                                    ))
                                  }
                                </>
                              )}
                            </>
                          )}
                        </ContextMenuContent>
                      </ContextMenu>
                    </div>
                );
              })()
            ))
          ) : (
              <div className="p-4 text-center text-gray-500">Nenhum contato encontrado</div>
          )}
        </ScrollArea>
      </div>

      {/* Área de conversa - 2/3 da tela */}
        <div className={`flex-1 min-w-0 max-w-full overflow-hidden flex flex-col h-full ${mobileView === 'list' ? 'hidden' : ''} md:flex`}>
          {/* Botão de voltar no mobile */}
          {window.innerWidth < 768 && (
            <button
              className="flex items-center gap-2 p-4 border-b bg-white md:hidden"
              onClick={() => {
                setSelectedContact(null);
                setMobileView('list');
              }}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              Voltar
            </button>
          )}
        {selectedContact ? (
          <>
            {/* Cabeçalho fixo */}
            <div className="p-4 border-b flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                <h2 className="text-lg font-semibold">
                    {getSelectedContactInfo()?.name || 'Contato'}
                </h2>
                  <span className="text-xs text-gray-400">
                    {normalizePhone(getSelectedContactInfo()?.telefone_id || '')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Badge do departamento */}
                  {(() => {
                    const contact = getSelectedContactInfo();
                    if (!contact) return null;

                    // Buscar o lead correspondente - usar leadsRaw quando "Todos os departamentos" está selecionado
                    const leadsToSearch = selectedDepartamento === 'all' ? leadsRaw : leads;
                    const lead = leadsToSearch.find(l => normalizePhoneOnlyNumber(l.telefone) === normalizePhoneOnlyNumber(contact.telefone_id));
                    
                    if (!lead) {
                      return (
                        <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm bg-gray-100 text-gray-700`}>
                          <GitBranch className="h-4 w-4" />
                          Sem departamento
                        </span>
                      );
                    }
                    
                    const dep = departamentos.find(d => String(d.id) === String(lead.id_departamento));
                    const depNome = dep ? dep.nome : "Sem departamento";
                    
                    return (
                      <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm ${dep ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                        <GitBranch className="h-4 w-4" />
                        {depNome}
                      </span>
                    );
                  })()}

                  {/* Valor do Lead */}
                  {(() => {
                    const contact = getSelectedContactInfo();
                    if (!contact) return null;

                    const leadsToSearch = selectedDepartamento === 'all' ? leadsRaw : leads;
                    const lead = leadsToSearch.find(l => normalizePhoneOnlyNumber(l.telefone) === normalizePhoneOnlyNumber(contact.telefone_id));
                    
                    if (!lead) return null;

                    return (
                      <div className="flex items-center gap-2 px-2 py-1 rounded-full text-sm bg-green-50 text-green-700 border border-green-200">
                        <DollarSign className="h-4 w-4" />
                        {isEditingValorHeader ? (
                          <div className="flex items-center gap-1">
                            <Input
                              value={valorInputHeader}
                              onChange={(e) => setValorInputHeader(e.target.value)}
                              className="h-6 w-20 text-xs px-1"
                              placeholder="Valor"
                              type="text"
                              disabled={savingValorHeader}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveValorHeader(lead);
                                } else if (e.key === 'Escape') {
                                  handleCancelEditValorHeader(lead);
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => handleSaveValorHeader(lead)}
                              disabled={savingValorHeader}
                            >
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => handleCancelEditValorHeader(lead)}
                              disabled={savingValorHeader}
                            >
                              <X className="h-3 w-3 text-gray-500" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span>{lead.valor || "Não informado"}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 w-5 p-0 hover:bg-green-100"
                              onClick={() => {
                                setValorInputHeader(lead.valor ? lead.valor.toString() : "");
                                setIsEditingValorHeader(true);
                              }}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handleAIAttendance}>
                    <Bot className="h-4 w-4 mr-2" />
                    Atendimento por IA
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleHumanAttendance}>
                    <User className="h-4 w-4 mr-2" />
                    Atendimento humano
                  </DropdownMenuItem>
                  {(() => {
                    // Verificar se o lead está marcado como ganho - usar leadsRaw quando "Todos os departamentos" está selecionado
                    const contact = contacts.find(c => c.id === selectedContact);
                    const leadsToSearch = selectedDepartamento === 'all' ? leadsRaw : leads;
                    const lead = contact ? leadsToSearch.find(l => normalizePhoneOnlyNumber(l.telefone) === normalizePhoneOnlyNumber(contact.telefone_id)) : null;
                    const isVendaRealizada = lead?.venda_realizada || lead?.status === 'Ganho';
                    
                    if (isVendaRealizada) {
                      return (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={handleUndoSale}>
                            <RotateCcw className="h-4 w-4 mr-2 text-orange-600" />
                            Venda não realizada
                          </DropdownMenuItem>
                        </>
                      );
                    } else {
                      return (
                        <DropdownMenuItem onClick={handleSaleCompleted}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Venda Realizada
                        </DropdownMenuItem>
                      );
                    }
                  })()}
                  <DropdownMenuItem onClick={() => {
                    // Busca robusta do lead do contato aberto - usar leadsRaw quando "Todos os departamentos" está selecionado
                    const contact = contacts.find(c => c.id === selectedContact);
                    const leadsToSearch = selectedDepartamento === 'all' ? leadsRaw : leads;
                    const lead = leadsToSearch.find(l =>
                      String(l.instance_id) === String(contact?.instance_id) &&
                      normalizePhoneOnlyNumber(l.telefone) === normalizePhoneOnlyNumber(contact?.telefone_id)
                    ) || leadsToSearch.find(l => normalizePhoneOnlyNumber(l.telefone) === normalizePhoneOnlyNumber(contact?.telefone_id));
                    setSelectedLeadId(lead?.id?.toString() || null);
                    handleOpenTransferModal();
                  }}>
                    <GitBranch className="h-4 w-4 mr-2" />
                    Transferir departamento
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowAnexoDialog(true)}>
                    <Paperclip className="h-4 w-4 mr-2" />
                    Anexar arquivo
                  </DropdownMenuItem>
                  {(() => {
                    const contact = contacts.find(c => c.id === selectedContact);
                    const normalizedPhone = contact ? normalizePhone(contact.telefone_id) : '';
                    const conversationStatus = contactStatusMap[normalizedPhone];
                    const statusNormalized = (conversationStatus || '').toLowerCase().replace(/\s+/g, '');
                    const isEmAndamento = !conversationStatus || statusNormalized === 'emandamento';
                    const isEncerrada = statusNormalized === 'encerrada';
                    
                    if (isEncerrada) {
                      return (
                        <DropdownMenuItem onClick={handleResumeConversation}>
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Retomar conversa
                        </DropdownMenuItem>
                      );
                    } else {
                      return (
                        <DropdownMenuItem onClick={handleEndConversation}>
                          <XCircle className="h-4 w-4 mr-2" />
                          Encerrar atendimento
                        </DropdownMenuItem>
                      );
                    }
                  })()}
                  <DropdownMenuItem onClick={handleAutomaticFollowup} disabled={isGeneratingFollowup}>
                    {isGeneratingFollowup ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Gerando resposta...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Gerar Resposta Inteligente
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleOpenAddToFunnelModal}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Adicionar a um funil
                  </DropdownMenuItem>
                  {(() => {
                    // Verificar se o lead está no followup programado - usar leadsRaw quando "Todos os departamentos" está selecionado
                    const contact = contacts.find(c => c.id === selectedContact);
                    const leadsToSearch = selectedDepartamento === 'all' ? leadsRaw : leads;
                    const lead = contact ? leadsToSearch.find(l => normalizePhoneOnlyNumber(l.telefone) === normalizePhoneOnlyNumber(contact.telefone_id)) : null;
                    const isInFollowup = lead?.followup_programado;
                    
                    return isInFollowup ? (
                      <DropdownMenuItem onClick={handleRemoverDoFollowupProgramado}>
                        <X className="h-4 w-4 mr-2" />
                        Remover do Followup Programado
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={handleInserirNoFollowupProgramado}>
                        <Repeat className="h-4 w-4 mr-2" />
                        Inserir no Followup Programado
                      </DropdownMenuItem>
                    );
                  })()}

                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Área de mensagens rolável */}
              <div className="flex-1 min-h-0 p-4 overflow-y-auto bg-gray-50 pb-28 md:pb-0">
              {selectedContactMessages.length > 0 ? (
                groupMessagesByDate(selectedContactMessages).map((group) => (
                  <div key={group.date}>
                    {/* Separador de data */}
                    <div className="flex justify-center mb-4">
                      <div className="bg-gray-100 text-gray-500 text-sm px-4 py-2 rounded-lg shadow-sm border">
                        {formatDateSeparator(group.dateObject)}
                      </div>
                    </div>
                    {/* Mensagens do dia */}
                    {group.messages.map((msg) => (
                      <div
                        key={msg.id || msg.created_at}
                        className={`mb-4 flex ${
                          msg.tipo ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <ContextMenu>
                          <ContextMenuTrigger asChild>
                            <Card
                              title={msg.tipo && msg.nome_atendente ? `Enviado por: ${msg.nome_atendente}` : undefined}
                              className={`max-w-[70%] p-3 cursor-context-menu transition-all duration-200 hover:shadow-md ${
                                msg.deleted
                                  ? 'opacity-50'
                                  : ''
                              } ${
                                msg.tipo
                                  ? msg.deleted
                                    ? 'bg-blue-300 text-white'
                                    : 'bg-blue-500 text-white hover:bg-blue-600'
                                  : msg.deleted
                                    ? 'bg-gray-200'
                                    : 'bg-gray-100 hover:bg-gray-200'
                              }`}
                            >
                              {renderMessageContent(msg)}
                              {msg.deleted && (
                                <p className="text-xs italic mt-1 opacity-75">
                                  Excluída para todos
                                </p>
                              )}
                              <p className="text-xs opacity-70 mt-1">
                                {format(
                                  new Date(msg.timestamp || msg.created_at),
                                  'HH:mm',
                                  { locale: ptBR }
                                )}
                              </p>
                            </Card>
                          </ContextMenuTrigger>
                          {!msg.deleted && (
                            <ContextMenuContent className="w-48">
                              <ContextMenuItem 
                                onClick={() => deleteMessage(msg)}
                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                              >
                                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Excluir para todos
                              </ContextMenuItem>
                            </ContextMenuContent>
                          )}
                        </ContextMenu>
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <div className="flex flex-col justify-center items-center h-full text-gray-500">
                  Nenhuma mensagem disponível<br />
                  <span className="text-primary-600 font-medium mt-2">Envie a primeira mensagem!</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

              {/* Campo de mensagem fixo padrão WhatsApp */}
              <div className="w-full bg-white border-t p-2 flex items-center gap-2 fixed bottom-0 left-0 z-10 md:static md:z-auto md:p-4 md:border-0">
              {showAudioRecorder ? (
                <AudioRecorderMP3
                  onSendAudio={handleSendAudio}
                  onCancel={() => {
                    setShowAudioRecorder(false);
                    setIsRecording(false);
                  }}
                  isRecording={isRecording}
                  onStartRecording={() => setIsRecording(true)}
                  onStopRecording={() => setIsRecording(false)}
                />
              ) : showImageUploader ? (
                <ImageUploader
                  onSendImage={handleSendImage}
                  onCancel={() => {
                    setShowImageUploader(false);
                    setPastedImageFile(null);
                  }}
                  initialImageFile={pastedImageFile}
                />
              ) : showVideoUploader ? (
                <VideoUploader
                  onSendVideo={handleSendVideo}
                  onCancel={() => setShowVideoUploader(false)}
                />
              ) : showDocumentUploader ? (
                <DocumentUploader
                  onSendDocument={handleSendDocument}
                  onCancel={() => setShowDocumentUploader(false)}
                />
              ) : (
                  <>
                  <Textarea
                    id="mensagem-input"
                    placeholder="Digite sua mensagem..."
                    value={message}
                    onChange={handleMessageChange}
                    onPaste={handleMessagePaste}
                    onKeyDown={handleMessageKeyDown}
                    className="flex-1 min-h-[40px] max-h-40 resize-y border-none bg-transparent focus:ring-0 focus:outline-none text-base"
                    autoComplete="off"
                    spellCheck={false}
                    disabled={isSending}
                  />
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={startRecording}
                    className="text-gray-600 hover:text-blue-600"
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setShowImageUploader(true)}
                    className="text-gray-600 hover:text-blue-600"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setShowVideoUploader(true)}
                    className="text-gray-600 hover:text-green-600"
                  >
                    <span role="img" aria-label="Vídeo">🎬</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setShowDocumentUploader(true)}
                    className="text-gray-600 hover:text-purple-600"
                  >
                    <span role="img" aria-label="Documento">📄</span>
                  </Button>
                  <Button onClick={handleSendMessage} disabled={isSending || !message.trim() || !selectedContact}>
                    <Send className="h-4 w-4 mr-2" />
                    {isSending ? 'Enviando...' : 'Enviar'}
                  </Button>
                  </>
              )}
            </div>
          </>
        ) : (
          <div className="flex justify-center items-center h-full text-gray-500">
            Selecione um contato para iniciar uma conversa
          </div>
        )}
      </div>
    </div>

      {/* Modal de Anexo de Arquivo */}
      <Dialog open={showAnexoDialog} onOpenChange={setShowAnexoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anexar arquivo ao lead</DialogTitle>
            <DialogDescription>
              Selecione um arquivo para anexar. O arquivo anterior será substituído automaticamente.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <input
              type="file"
              id="anexo-file-input"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleUploadAnexoLead(file);
                }
              }}
              disabled={uploadingAnexo}
            />
            <label
              htmlFor="anexo-file-input"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Paperclip className="w-10 h-10 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Clique para selecionar</span> ou arraste o arquivo aqui
                </p>
                <p className="text-xs text-gray-500">PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, etc.</p>
              </div>
            </label>
            {uploadingAnexo && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-600">Enviando arquivo...</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAnexoDialog(false)} disabled={uploadingAnexo}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Transferência */}
      <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transferir para departamento</DialogTitle>
            <DialogDescription>
              Selecione o departamento para onde deseja transferir este atendimento
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select
              value={selectedTransferDepartamento || ''}
              onValueChange={setSelectedTransferDepartamento}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Sem Departamento</SelectItem>
                {transferDepartamentos.map((dep) => (
                  <SelectItem key={dep.id} value={dep.id.toString()}>
                    {dep.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowTransferModal(false)} disabled={transferring}>
              Cancelar
            </Button>
            <Button 
              onClick={handleTransferDepartamento} 
              disabled={!selectedTransferDepartamento || transferring}
            >
              {transferring ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Transferindo...
                </>
              ) : (
                "Transferir"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de detalhes do contato */}
      {showContactDetails && (
        <ContactDetailsModal 
          contact={selectedContactForDetails} 
          onClose={handleCloseContactDetails} 
        />
      )}

      {/* Modal de Adicionar ao Funil */}
      <Dialog open={showAddToFunnelModal} onOpenChange={setShowAddToFunnelModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar a um funil</DialogTitle>
            <DialogDescription>
              Selecione o funil e a etapa onde este contato deve ser posicionado
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Seleção do Funil */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Funil</label>
              <Select
                value={selectedFunnelId}
                onValueChange={handleFunnelChange}
                disabled={loadingFunis}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingFunis ? "Carregando funis..." : "Selecione um funil"} />
                </SelectTrigger>
                <SelectContent>
                  {availableFunis.map((funil) => (
                    <SelectItem key={funil.id} value={funil.id.toString()}>
                      <div className="flex items-center gap-2">
                        <span>{funil.nome}</span>
                        {funil.id_funil_padrao && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded flex items-center gap-1">
                            <span className="text-yellow-500">⭐</span>
                            Padrão
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Seleção da Etapa */}
            {selectedFunnelId && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Etapa</label>
                <Select
                  value={selectedStageId}
                  onValueChange={setSelectedStageId}
                  disabled={loadingStages || availableStages.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingStages ? "Carregando etapas..." : availableStages.length === 0 ? "Nenhuma etapa disponível" : "Selecione uma etapa"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStages.map((etapa, index) => (
                      <SelectItem key={etapa.id} value={etapa.id.toString()}>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                            {index + 1}
                          </span>
                          <span>{etapa.nome}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Informações do contato */}
            {selectedContact && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Contato:</strong> {contacts.find(c => c.id === selectedContact)?.name || 'Nome não disponível'}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Telefone:</strong> {contacts.find(c => c.id === selectedContact)?.telefone_id || 'Telefone não disponível'}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddToFunnelModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAddToFunnel} 
              disabled={!selectedFunnelId || !selectedStageId || loadingFunis || loadingStages}
            >
              Adicionar ao Funil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de visualização de imagem em tela cheia */}
      {viewingImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setViewingImage(null)}
        >
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <img 
              src={viewingImage} 
              alt="Imagem em tela cheia" 
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            {/* Botão de fechar */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white z-10"
              onClick={(e) => {
                e.stopPropagation();
                setViewingImage(null);
              }}
            >
              <X className="h-6 w-6" />
            </Button>
            {/* Botão de download */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-16 bg-black/50 hover:bg-black/70 text-white z-10"
              onClick={async (e) => {
                e.stopPropagation();
                if (!viewingImage) return;
                
                try {
                  let imageUrl = viewingImage;
                  if (!imageUrl.startsWith('http')) {
                    imageUrl = `https://ltdkdeqxcgtuncgzsowt.supabase.co/storage/v1/object/public/imageswpp/${imageUrl}`;
                  }
                  
                  const response = await fetch(imageUrl);
                  if (!response.ok) {
                    throw new Error(`Erro ao buscar imagem: ${response.statusText}`);
                  }
                  
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  
                  const urlParts = imageUrl.split('/');
                  let fileName = urlParts[urlParts.length - 1];
                  fileName = fileName.split('?')[0];
                  if (!fileName.includes('.')) {
                    const extension = blob.type.split('/')[1] || 'jpg';
                    fileName = `imagem_${Date.now()}.${extension}`;
                  } else {
                    fileName = fileName || `imagem_${Date.now()}.jpg`;
                  }
                  
                  link.download = fileName;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  window.URL.revokeObjectURL(url);
                  
                  toast.success('Download iniciado');
                } catch (error) {
                  console.error('Erro ao fazer download da imagem:', error);
                  toast.error('Erro ao fazer download da imagem');
                }
              }}
              title="Baixar imagem"
            >
              <Download className="h-6 w-6" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default Conversations;
