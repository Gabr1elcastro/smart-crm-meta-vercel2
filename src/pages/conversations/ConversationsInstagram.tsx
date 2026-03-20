// Conversations Instagram Component - Sistema de mensagens Instagram
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
import { Search, Send, Paperclip, MoreVertical, Bot, User, CheckCircle, XCircle, RefreshCw, Mic, TrendingUp, Archive, PlayCircle, MessageSquare, GitBranch, Repeat, Tag, User as UserIcon, X, Info as InfoIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useAuth } from "@/contexts/auth";
import { useUserType } from "@/hooks/useUserType";
import { supabase } from "@/lib/supabase";
import { useSearchParams } from "react-router-dom";
import { NovaConversaNovoContatoForm } from "@/components/NovaConversaNovoContatoForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  DialogDescription } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

// Interfaces para Instagram
interface Contact {
  id: string;
  name: string;
  telefone: string;
  telefone_id: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  instance_id?: string;
  id_instagram_lead?: string;
}

interface Conversation {
  id_mensagem: number;
  id_conversa: string;
  nome_lead: string;
  id_cliente: number;
  id_instagram_cliente: string;
  id_instagram_lead: string;
  mensagem: string;
  fromMe: boolean;
  created_at: string;
}

// Helper para normalizar telefones
const normalizePhone = (phone: string) => {
  return phone.replace(/\D/g, '');
};

// Helper para formatar data (sem ajuste de timezone)
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  
  if (isToday(date)) {
    return 'Hoje';
  } else if (isYesterday(date)) {
    return 'Ontem';
  } else {
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  }
};

// Helper para formatar horário das mensagens
const formatMessageTime = (dateString: string) => {
  const date = new Date(dateString);
  return format(date, 'HH:mm', { locale: ptBR });
};

// Componente para verificar acesso ao Instagram
const InstagramAccessGuard = ({ children }: { children: React.ReactNode }) => {
  // Removida verificação de permissão int_instagram - agora disponível para todos os planos
  return <>{children}</>;
};

const ConversationsInstagram = () => {
  // Estados principais
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedContactAttendance, setSelectedContactAttendance] = useState<{ia: boolean, humano: boolean} | null>(null);
  const [selectedContactStage, setSelectedContactStage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSending, setIsSending] = useState(false);
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
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  // Estados para upload de arquivos
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [showVideoUploader, setShowVideoUploader] = useState(false);
  const [showDocumentUploader, setShowDocumentUploader] = useState(false);
  
  // Estados para modal de nova conversa
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  
  // Estados para busca
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  
  // Estados para seleção múltipla
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  
  // Estado para indicar se realtime está ativo
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  
  // Hooks
  const { user } = useAuth();
  const { userType } = useUserType();

  // Função para construir lista de contatos
  const buildContacts = useCallback(async (messages: Conversation[]) => {
    if (!messages || messages.length === 0) {
      setContacts([]);
      return;
    }

    try {
      // Agrupar mensagens por id_conversa (todas as mensagens de uma conversa ficam juntas)
      const conversationsMap = new Map<string, Conversation[]>();
      messages.forEach(msg => {
        const conversationId = msg.id_conversa.trim(); // Remover espaços em branco
        if (!conversationsMap.has(conversationId)) {
          conversationsMap.set(conversationId, []);
        }
        conversationsMap.get(conversationId)!.push(msg);
      });

      console.log('[CONVERSAS INSTAGRAM] Conversas agrupadas:', conversationsMap.size);

      // Buscar nomes dos leads na tabela leads_instagram
      const instagramLeadIds = Array.from(new Set(messages.map(msg => msg.id_instagram_lead)));
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads_instagram')
        .select('id_instagram_lead, nome')
        .in('id_instagram_lead', instagramLeadIds);

      if (leadsError) {
        console.error('Erro ao buscar leads Instagram:', leadsError);
      }

      // Criar mapa de nomes dos leads
      const leadsMap = new Map<string, string>();
      if (leadsData) {
        leadsData.forEach(lead => {
          leadsMap.set(lead.id_instagram_lead, lead.nome);
        });
      }

      // Construir lista de contatos
      const contactsArray: Contact[] = [];
      conversationsMap.forEach((conversationMessages, conversationId) => {
        // Ordenar mensagens por data (todas as mensagens da conversa)
        const sortedMessages = conversationMessages.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        const firstMessage = sortedMessages[0];
        const lastMessage = sortedMessages[sortedMessages.length - 1];
        
        // Buscar nome do lead
        const leadName = leadsMap.get(firstMessage.id_instagram_lead) || firstMessage.nome_lead || 'Contato Instagram';

        const contact: Contact = {
          id: conversationId,
          name: leadName,
          telefone: firstMessage.id_instagram_lead,
          telefone_id: firstMessage.id_instagram_lead,
          lastMessage: lastMessage.mensagem,
          lastMessageTime: lastMessage.created_at,
          unreadCount: 0, // Por enquanto, sempre 0
          id_instagram_lead: firstMessage.id_instagram_lead,
        };

        contactsArray.push(contact);
        
        console.log(`[CONVERSAS INSTAGRAM] Conversa ${conversationId}: ${sortedMessages.length} mensagens`);
      });

      // Ordenar contatos por última mensagem
      contactsArray.sort((a, b) => {
        if (!a.lastMessageTime || !b.lastMessageTime) return 0;
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
      });

      setContacts(contactsArray);
      console.log('[CONVERSAS INSTAGRAM] Contatos criados:', contactsArray.length, contactsArray);
    } catch (error) {
      console.error('Erro ao construir contatos:', error);
    }
  }, []);

  // Função para buscar conversas
  const fetchConversations = useCallback(async (showLoading = true) => {
    if (!user?.id_cliente) {
      if (showLoading) setLoading(false);
      return;
    }

    if (showLoading) setLoading(true);

    try {
      // Buscar mensagens do Instagram para o cliente
      const { data, error } = await supabase
        .from('agente_conversacional_instagram')
        .select('*')
        .eq('id_cliente', user.id_cliente)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar conversas Instagram:', error);
        toast.error('Erro ao carregar conversas do Instagram');
        if (showLoading) setLoading(false);
        return;
      }

      console.log('[CONVERSAS INSTAGRAM] Mensagens encontradas:', data?.length || 0);
      setConversations(data || []);
    } catch (error) {
      console.error('Erro ao carregar conversas Instagram:', error);
      toast.error('Erro ao carregar conversas do Instagram');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [user?.id_cliente]);

  // Carregar conversas na inicialização
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Construir contatos quando as conversas mudarem
  useEffect(() => {
    if (conversations.length > 0) {
      buildContacts(conversations);
    } else {
      setContacts([]);
    }
  }, [conversations, buildContacts]);

  // Memoizar a função de envio de mensagem para evitar re-renderizações
  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || !selectedContact || isSending || !user?.id_cliente) return;

    setIsSending(true);
    const messageText = message.trim();
    setMessage('');

    try {
      // Buscar informações do contato selecionado
      const contactInfo = contacts.find(contact => contact.id === selectedContact);
      if (!contactInfo) {
        throw new Error('Contato não encontrado');
      }

      // Preparar payload para envio
      const payload = {
        cliente_id: user.id_cliente,
        mensagem: messageText,
        id_conversa: selectedContact,
        id_instagram_lead: contactInfo.id_instagram_lead,
        nome_lead: contactInfo.name
      };

      console.log('Enviando mensagem Instagram:', payload);

      // Enviar para o webhook do Instagram
      const response = await fetch('https://webhook.dev.usesmartcrm.com/webhook/envio_ig', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log('Resposta do webhook Instagram:', result);

      toast.success('Mensagem enviada com sucesso!');
      
      // Atualizar conversas imediatamente (realtime deve pegar a nova mensagem)
      fetchConversations(false);
    } catch (error) {
      console.error('Erro ao enviar mensagem Instagram:', error);
      toast.error(`Erro ao enviar mensagem: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  }, [message, selectedContact, isSending, user?.id_cliente, contacts, fetchConversations]);

  // Sistema de polling para atualizações (fallback do realtime)
  useEffect(() => {
    if (!user?.id_cliente) return;

    console.log('[CONVERSAS INSTAGRAM] Configurando polling para cliente:', user.id_cliente);
    setRealtimeStatus('connected');

    // Polling a cada 5 segundos
    const pollingInterval = setInterval(() => {
      console.log('[CONVERSAS INSTAGRAM] Executando polling...');
      fetchConversations(false);
    }, 5000);

    return () => {
      console.log('[CONVERSAS INSTAGRAM] Removendo polling');
      clearInterval(pollingInterval);
      setRealtimeStatus('disconnected');
    };
  }, [user?.id_cliente, fetchConversations]);

  // Sistema de realtime para atualizações em tempo real (desabilitado temporariamente)
  useEffect(() => {
    if (!user?.id_cliente) return;

    console.log('[CONVERSAS INSTAGRAM] Realtime desabilitado, usando polling');

    // Código do realtime comentado temporariamente
    /*
    const channel = supabase
      .channel('conversations_instagram_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agente_conversacional_instagram',
          filter: `id_cliente=eq.${user.id_cliente}`,
        },
        (payload) => {
          console.log('[CONVERSAS INSTAGRAM] Mudança detectada:', payload);
          fetchConversations(false);
        }
      )
      .subscribe((status) => {
        console.log('[CONVERSAS INSTAGRAM] Status do canal realtime:', status);
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('connected');
        } else if (status === 'CHANNEL_ERROR') {
          setRealtimeStatus('disconnected');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
    */
  }, [user?.id_cliente, fetchConversations]);

  // Processar telefone da URL na inicialização
  useEffect(() => {
    if (phoneFromUrl && !initialPhoneProcessed && contacts.length > 0) {
      const normalizedUrlPhone = normalizePhone(phoneFromUrl);
      const matchingContact = contacts.find(contact => 
        normalizePhone(contact.telefone) === normalizedUrlPhone
      );
      
      if (matchingContact) {
        setSelectedContact(matchingContact.id);
        setMobileView('chat');
      }
      
      setInitialPhoneProcessed(true);
    }
  }, [phoneFromUrl, contacts, initialPhoneProcessed]);


  // Função para selecionar contato
  const handleSelectContact = (contactId: string) => {
    setSelectedContact(contactId);
    setMobileView('chat');
    
    // Limpar rascunho quando selecionar outro contato
    if (selectedContact && selectedContact !== contactId) {
      setMessageDrafts(prev => ({
        ...prev,
        [selectedContact]: message
      }));
      setMessage(messageDrafts[contactId] || '');
    }
  };

  // Função para voltar à lista no mobile
  const handleBackToList = () => {
    setMobileView('list');
    setSelectedContact(null);
  };

  // Filtrar contatos por busca
  const filteredContacts = useMemo(() => {
    if (!searchTerm) return contacts;
    
    return contacts.filter(contact =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.telefone.includes(searchTerm)
    );
  }, [contacts, searchTerm]);

  // Obter mensagens do contato selecionado com separadores de data
  const selectedContactMessages = useMemo(() => {
    if (!selectedContact) return [];
    
    const filteredMessages = conversations
      .filter(conv => conv.id_conversa.trim() === selectedContact)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    console.log(`[CONVERSAS INSTAGRAM] Mensagens para conversa ${selectedContact}:`, filteredMessages.length);
    console.log('[CONVERSAS INSTAGRAM] Detalhes das mensagens:', filteredMessages.map(msg => ({
      id: msg.id_mensagem,
      fromMe: msg.fromMe,
      mensagem: msg.mensagem,
      created_at: msg.created_at
    })));
    
    // Agrupar mensagens por data e adicionar separadores
    const messagesWithSeparators: (Conversation | { type: 'separator', date: string })[] = [];
    let lastDate = '';
    
    filteredMessages.forEach((msg, index) => {
      const messageDate = formatDate(msg.created_at);
      
      // Adicionar separador de data se mudou
      if (messageDate !== lastDate) {
        messagesWithSeparators.push({
          type: 'separator',
          date: messageDate
        });
        lastDate = messageDate;
      }
      
      messagesWithSeparators.push(msg);
    });
    
    return messagesWithSeparators;
  }, [conversations, selectedContact]);

  // Obter informações do contato selecionado
  const selectedContactInfo = useMemo(() => {
    if (!selectedContact) return null;
    return contacts.find(contact => contact.id === selectedContact);
  }, [contacts, selectedContact]);

  // Função para alternar seleção múltipla
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedContacts(new Set());
  };

  // Função para selecionar todos os contatos
  const selectAllContacts = () => {
    if (selectedContacts.size === filteredContacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(filteredContacts.map(contact => contact.id)));
    }
  };

  // Verificar se deve mostrar ações em lote
  const showBulkActions = selectionMode && selectedContacts.size > 0;

  // Scroll para o final das mensagens
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedContactMessages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Carregando conversas do Instagram...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar conversas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Lista de contatos */}
          <ScrollArea className="flex-1">
            <div className="p-2">
              {filteredContacts.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma conversa encontrada</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {searchTerm ? 'Tente ajustar sua busca' : 'Inicie uma nova conversa'}
                  </p>
                </div>
              ) : (
                filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors mb-2 ${
                      selectedContact === contact.id
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleSelectContact(contact.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-pink-100 text-pink-600">
                          {contact.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900 truncate">
                            {contact.name}
                          </h3>
                          {contact.lastMessageTime && (
                            <span className="text-xs text-gray-500">
                              {formatDate(contact.lastMessageTime)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {contact.lastMessage || 'Nenhuma mensagem'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Área de chat */}
        <div className={`flex-1 flex flex-col h-full ${mobileView === 'list' ? 'hidden' : ''} md:flex`}>
          {selectedContact ? (
            <>
              {/* Header do chat - fixo no topo */}
              <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToList}
                    className="md:hidden"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-pink-100 text-pink-600">
                      {selectedContactInfo?.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {selectedContactInfo?.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Instagram: {selectedContactInfo?.telefone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Mensagens - área flexível com scroll */}
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full p-4">
                  <div className="space-y-4">
                    {selectedContactMessages.map((item, index) => {
                      // Separador de data
                      if ('type' in item && item.type === 'separator') {
                        return (
                          <div key={`separator-${index}`} className="flex justify-center">
                            <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                              {item.date}
                            </div>
                          </div>
                        );
                      }
                      
                      // Mensagem normal
                      const msg = item as Conversation;
                      return (
                        <div
                          key={msg.id_mensagem}
                          className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              msg.fromMe
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{msg.mensagem}</p>
                            <p className={`text-xs mt-1 text-right ${
                              msg.fromMe ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {formatMessageTime(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </div>

              {/* Input de mensagem - fixo na parte inferior */}
              <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={isSending}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || isSending}
                    size="sm"
                  >
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Selecione uma conversa
                </h3>
                <p className="text-gray-500">
                  Escolha uma conversa do Instagram para começar a conversar
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de nova conversa */}
      <Dialog open={showNewConversationModal} onOpenChange={setShowNewConversationModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Conversa Instagram</DialogTitle>
            <DialogDescription>
              Funcionalidade em desenvolvimento. Em breve você poderá iniciar novas conversas pelo Instagram.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowNewConversationModal(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Componente principal com verificação de acesso
const ConversationsInstagramWithGuard = () => {
  return (
    <InstagramAccessGuard>
      <ConversationsInstagram />
    </InstagramAccessGuard>
  );
};

export default ConversationsInstagramWithGuard;
