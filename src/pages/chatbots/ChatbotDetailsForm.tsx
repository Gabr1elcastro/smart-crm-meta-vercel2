import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Wand2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { fetchFromWebhook } from "@/api/webhook";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth";

interface ChatbotDetailsFormProps {
  chatbotType: string;
  onSave: (chatbot: any) => void;
  onCancel: () => void;
  initialValues?: {
    id?: number | string;
    nome?: string;
    nome_empresa?: string;
    descricao_empresa?: string;
    endereco?: string;
    descricao_produto?: string;
    modulos?: string;
    diferenciais?: string;
    garantia?: string;
    precos_condicoes?: string;
    acesso?: string;
    suporte_contato?: string;
    active?: boolean;
    promptTypeId?: number;
  };
}

interface AIFormResponse {
  name: string | null;
  description: string | null;
  address: string | null;
  mainProduct: string | null;
}

// Função para gerar um UUID v4
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const ChatbotDetailsForm: React.FC<ChatbotDetailsFormProps> = ({ 
  chatbotType, 
  onSave, 
  onCancel,
  initialValues
}) => {
  const [nome, setNome] = useState(initialValues?.nome || '');
  const [nomeEmpresa, setNomeEmpresa] = useState(initialValues?.nome_empresa || '');
  const [descricaoEmpresa, setDescricaoEmpresa] = useState(initialValues?.descricao_empresa || '');
  const [endereco, setEndereco] = useState(initialValues?.endereco || '');
  const [descricaoProduto, setDescricaoProduto] = useState(initialValues?.descricao_produto || '');
  const [modulos, setModulos] = useState(initialValues?.modulos || '');
  const [diferenciais, setDiferenciais] = useState(initialValues?.diferenciais || '');
  const [garantia, setGarantia] = useState(initialValues?.garantia || '');
  const [precosCondicoes, setPrecosCondicoes] = useState(initialValues?.precos_condicoes || '');
  const [acesso, setAcesso] = useState(initialValues?.acesso || '');
  const [suporteContato, setSuporteContato] = useState(initialValues?.suporte_contato || '');
  const [active, setActive] = useState(initialValues?.active ?? true);
  const [prompt, setPrompt] = useState(initialValues?.descricao_produto || ''); // Inicializar com descricao_produto se disponível
  
  // Estados para o preenchimento com IA
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPromptId, setCurrentPromptId] = useState<string | null>(null);
  
  // Estados para indicar quais campos estão sendo preenchidos
  const [isNameLoading, setIsNameLoading] = useState(false);
  const [isDescriptionLoading, setIsDescriptionLoading] = useState(false);
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [isMainProductLoading, setIsMainProductLoading] = useState(false);
  
  // Estado para modo de falha (quando o Supabase não está funcionando)
  const [isDirectMode, setIsDirectMode] = useState(false);
  
  // Get current user from auth context
  const { user } = useAuth();

  // Efeito para inicializar o campo prompt quando editing um chatbot do tipo "Criar do zero"
  useEffect(() => {
    console.log("DEBUG useEffect - initialValues:", initialValues);
    console.log("DEBUG useEffect - chatbotType:", chatbotType);
    console.log("DEBUG useEffect - descricao_produto:", initialValues?.descricao_produto);
    
    if (initialValues && chatbotType === "11" && initialValues.descricao_produto) {
      console.log("DEBUG - Preenchendo campo prompt com:", initialValues.descricao_produto);
      setPrompt(initialValues.descricao_produto);
    }
  }, [initialValues, chatbotType]);

  // Efeito para configurar o listener do Supabase para atualizações em tempo real
  useEffect(() => {
    if (!currentPromptId || isDirectMode) return;

    // Quando temos um ID de prompt válido e iniciamos o preenchimento,
    // marcamos todos os campos como "carregando"
    setIsNameLoading(true);
    setIsDescriptionLoading(true);
    setIsAddressLoading(true);
    setIsMainProductLoading(true);

    console.log('Configurando listener para atualizações em tempo real no prompt ID:', currentPromptId);
    
    // DESABILITADO: Causava recursão infinita
    // Inscrever-se para atualizações em tempo real
    // const promptsChannel = supabase
    //   .channel('prompts_realtime')
    //   .on('postgres_changes', {
    //     event: 'UPDATE',
    //     schema: 'public',
    //     table: 'prompts_personalizados',
    //     filter: `id_prompt=eq.${currentPromptId}`,
    //   }, (payload) => {
    //     console.log('Recebida atualização em tempo real:', payload);
    //     const newData = payload.new;

    //     // Atualizar os campos do formulário com os dados do Supabase
    //     if (newData.nome_prompt) {
    //       setNome(newData.nome_prompt);
    //       setIsNameLoading(false);
    //     }
    //     
    //     if (newData.descricao) {
    //       setDescricaoEmpresa(newData.descricao);
    //       setIsDescriptionLoading(false);
    //     }
    //     
    //     if (newData.endereco) {
    //       setEndereco(newData.endereco);
    //       setIsAddressLoading(false);
    //     }
    //     
    //     if (newData.produto_principal) {
    //       setDescricaoProduto(newData.produto_principal);
    //       setIsMainProductLoading(false);
    //     }
    //     
    //     // Se todos os campos foram preenchidos, notificar o usuário
    //     if (
    //       newData.nome_prompt && 
    //       newData.descricao && 
    //       newData.endereco && 
    //       newData.produto_principal
    //     ) {
    //       toast.success("Todos os campos foram preenchidos com sucesso!");
    //     }
    //   })
    //   .subscribe((status) => {
    //     console.log('Status da inscrição em tempo real:', status);
    //     
    //     // Se houver um erro na inscrição, alternar para modo direto
    //     if (status !== 'SUBSCRIBED') {
    //       console.error('Erro na inscrição em tempo real, alternando para modo direto');
    //       setIsDirectMode(true);
    //       
    //       // Desativar indicadores de carregamento
    //       setIsNameLoading(false);
    //       setIsDescriptionLoading(false);
    //       setIsAddressLoading(false);
    //       setIsMainProductLoading(false);
    //     }
    //   });

    // Timeout para falha na atualização em tempo real (backup)
    const timeoutId = setTimeout(() => {
      console.warn('Timeout na atualização em tempo real, alternando para modo direto');
      setIsDirectMode(true);
      
      // Desativar indicadores de carregamento
      setIsNameLoading(false);
      setIsDescriptionLoading(false);
      setIsAddressLoading(false);
      setIsMainProductLoading(false);
      
      // Tentar obter os dados diretamente
      fetchDirectData(websiteUrl);
    }, 10000); // 10 segundos de timeout

    // Cleanup function
    return () => {
      console.log('Removendo listener de tempo real');
      clearTimeout(timeoutId);
      // DESABILITADO: Causava recursão infinita
      // supabase.removeChannel(promptsChannel);
      
      // Resetar os estados de carregamento quando o componente é desmontado
      setIsNameLoading(false);
      setIsDescriptionLoading(false);
      setIsAddressLoading(false);
      setIsMainProductLoading(false);
    };
  }, [currentPromptId, isDirectMode, websiteUrl]);

  // Função para obter dados diretamente (modo de fallback)
  const fetchDirectData = async (url: string) => {
    try {
      console.log('Obtendo dados diretamente para URL:', url);
      const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
      
      // Chamar a função sem depender do Supabase
      const data = await fetchFromWebhook(formattedUrl);
      
      // Atualizar os campos diretamente
      setNome(data.name || '');
      setDescricaoEmpresa(data.description || '');
      setEndereco(data.address || '');
      setDescricaoProduto(data.mainProduct || '');
      
      toast.success("Dados preenchidos com sucesso usando IA!");
    } catch (error) {
      console.error('Erro ao obter dados diretamente:', error);
      toast.error('Não foi possível obter dados do site. Tente novamente mais tarde.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome) {
      toast.error("O nome do chatbot é obrigatório");
      return;
    }
    
    // Se é uma edição (tem initialValues.id), apenas enviamos os dados atualizados para o callback
    if (initialValues?.id) {
      const updatedChatbot = {
        id: initialValues.id,
        nome,
        nome_empresa: chatbotType === "11" ? null : nomeEmpresa,
        descricao_empresa: chatbotType === "11" ? null : descricaoEmpresa,
        endereco: chatbotType === "11" ? null : endereco,
        descricao_produto: chatbotType === "11" ? prompt : descricaoProduto,
        modulos: chatbotType === "11" ? null : modulos,
        diferenciais: chatbotType === "11" ? null : diferenciais,
        garantia: chatbotType === "11" ? null : garantia,
        precos_condicoes: chatbotType === "11" ? null : precosCondicoes,
        acesso: chatbotType === "11" ? null : acesso,
        suporte_contato: chatbotType === "11" ? null : suporteContato,
        // Para o tipo "Criar do zero", usar o prompt
        prompt: chatbotType === "11" ? prompt : null,
        type: 'ia',
        botType: chatbotType,
        active,
        promptTypeId: initialValues.promptTypeId || (chatbotType !== "0" ? parseInt(chatbotType) : null),
        promptTypeName: getPromptTypeName(initialValues.promptTypeId || (chatbotType !== "0" ? parseInt(chatbotType) : null)),
        lastEdited: new Date().toLocaleDateString('pt-BR')
      };
      onSave(updatedChatbot);
      return;
    }
    
    // Se não for edição, continua o fluxo de criação normal
    // Primeiro, salvar o chatbot no Supabase na tabela prompts_oficial
    try {
      // Mostrar um indicador de carregamento
      toast.info("Criando chatbot...");
      
      if (!user || !user.id) {
        toast.error("Usuário não autenticado. Faça login novamente.");
        return;
      }
      
      // Obter o instance_id e id_cliente do usuário da tabela clientes_info
      console.log("Obtendo instance_id e id_cliente da tabela clientes_info para o usuário:", user.email);
      
      let instance_id = null;
      let id_cliente = null;
      try {
        // Buscar todos os registros com este email e pegar o mais antigo (ID menor)
        const { data: clientesInfo, error: clientError } = await supabase
          .from('clientes_info')
          .select('instance_id, id')
          .eq('email', user.email)
          .order('id', { ascending: true })
          .limit(1);
        
        if (clientError) {
          console.error("Erro ao buscar dados do cliente:", clientError);
        } else if (clientesInfo && clientesInfo.length > 0) {
          const clientInfo = clientesInfo[0];
          instance_id = clientInfo.instance_id;
          id_cliente = clientInfo.id;
          console.log("Instance ID encontrado:", instance_id);
          console.log("ID Cliente encontrado:", id_cliente);
        } else {
          console.log("Nenhum cliente encontrado para o usuário");
        }
      } catch (instanceError) {
        console.error("Erro ao buscar dados do cliente:", instanceError);
      }
      
      // Preparar payload para o Supabase com os campos necessários
      const officialPayload = {
        nome,
        nome_empresa: chatbotType === "11" ? null : nomeEmpresa,
        descricao_empresa: chatbotType === "11" ? null : descricaoEmpresa,
        endereco: chatbotType === "11" ? null : endereco,
        descricao_produto: chatbotType === "11" ? prompt : descricaoProduto,
        modulos: chatbotType === "11" ? null : modulos,
        diferenciais: chatbotType === "11" ? null : diferenciais,
        garantia: chatbotType === "11" ? null : garantia,
        precos_condicoes: chatbotType === "11" ? null : precosCondicoes,
        acesso: chatbotType === "11" ? null : acesso,
        suporte_contato: chatbotType === "11" ? null : suporteContato,
        // Para o tipo "Criar do zero", salvar o prompt na coluna descricao_produto
        descricao: null,
        id_usuario: user.id,
        id_cliente: id_cliente,
        prompt_type_id: chatbotType !== "0" ? parseInt(chatbotType) : null,
        instance_id: instance_id,
        status: active,
        em_uso: false
      };
      
      console.log("[DEBUG] Payload para tabela prompts_oficial:", officialPayload);
      
      // Salvar no Supabase
      const { data, error } = await supabase
        .from('prompts_oficial')
        .insert([officialPayload])
        .select();
      
      if (error) {
        console.error("[ERRO] Falha ao salvar chatbot:", error);
        toast.error(`Erro ao criar chatbot: ${error.message}`);
        return;
      }
      
      console.log("[SUCESSO] Chatbot salvo com sucesso:", data);
      
      // Construir o objeto chatbot com os dados recebidos do Supabase
      const chatbot = {
        id: data?.[0]?.id || Date.now(),
        nome,
        nome_empresa: nomeEmpresa,
        descricao_empresa: descricaoEmpresa,
        endereco,
        descricao_produto: descricaoProduto,
        modulos,
        diferenciais,
        garantia,
        precos_condicoes: precosCondicoes,
        acesso,
        suporte_contato: suporteContato,
        apiKey: "sk-default-key",
        gptModel: "gpt-4o",
        temperature: 0.7,
        type: 'ia',
        botType: chatbotType,
        active: data?.[0]?.status === true,
        promptTypeId: chatbotType !== "0" ? parseInt(chatbotType) : null,
        promptTypeName: getPromptTypeName(chatbotType !== "0" ? parseInt(chatbotType) : null),
        lastEdited: "Agora mesmo"
      };
      
      onSave(chatbot);
      toast.success("Chatbot com IA criado com sucesso!");
    } catch (error) {
      console.error("[ERRO] Exceção ao criar chatbot:", error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao criar chatbot: ${errorMessage}`);
    }
  };

  const handleFillWithAI = async () => {
    // Validar que a URL foi informada
    if (!websiteUrl || websiteUrl.trim() === '') {
      toast.error("Por favor, informe a URL do site");
      return;
    }

    // Iniciar o processo de preenchimento
    setIsLoading(true);

    try {
      // Formatar a URL corretamente
      let formattedUrl = websiteUrl.trim();
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = `https://${formattedUrl}`;
      }
      
      // Validar a URL
      try {
        new URL(formattedUrl);
      } catch (e) {
        throw new Error("URL inválida. Por favor, insira uma URL válida.");
      }
      
      // Log para debug
      console.log("[DEBUG] URL formatada:", formattedUrl);

      // Informar ao usuário
      toast.info("Conectando à IA para extrair informações...");
      
      // Ativar modo direto e indicadores de carregamento
      setIsDirectMode(true);
      setIsNameLoading(true);
      setIsDescriptionLoading(true);
      setIsAddressLoading(true);
      setIsMainProductLoading(true);
      
      // Fechar o diálogo para mostrar o processo de carregamento
      setIsAIDialogOpen(false);
      
      // Obter os dados do site
      const data = await fetchFromWebhook(formattedUrl);
      console.log("[DEBUG] Dados obtidos da análise:", data);
      
      // Preencher os campos com os dados obtidos da IA
      if (data.name) setNome(data.name);
      if (data.description) {
        if (chatbotType === "11") {
          // Para o tipo "Criar do zero", usar a descrição como prompt
          setPrompt(data.description);
        } else {
          setDescricaoEmpresa(data.description);
        }
      }
      if (data.address) setEndereco(data.address);
      if (data.mainProduct) {
        if (chatbotType === "11") {
          // Para o tipo "Criar do zero", adicionar o produto principal ao prompt
          setPrompt(prev => prev ? `${prev}\n\nProduto principal: ${data.mainProduct}` : `Produto principal: ${data.mainProduct}`);
        } else {
          setDescricaoProduto(data.mainProduct);
        }
      }
      
      // Salvar no Supabase se tivermos um usuário autenticado
      if (user && user.id) {
        saveDataToSupabase(formattedUrl, data);
      }
    } catch (error) {
      console.error("[ERRO] Falha ao preencher com IA:", error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido. Tente novamente mais tarde.';
      toast.error(`Erro ao preencher com IA: ${errorMessage}`);
      
      // Desativar todos os indicadores de carregamento
      setIsNameLoading(false);
      setIsDescriptionLoading(false);
      setIsAddressLoading(false);
      setIsMainProductLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Função separada para salvar dados no Supabase
  const saveDataToSupabase = async (formattedUrl: string, data: AIFormResponse) => {
    if (!user) {
      console.warn('[AVISO] Sem usuário autenticado para salvar dados');
      return;
    }
    
    try {
      console.log("[DEBUG] Iniciando salvamento no Supabase com URL:", formattedUrl);
      
      // Extrair o domínio para uso em fallbacks
      let siteDomain;
      try {
        siteDomain = new URL(formattedUrl).hostname;
      } catch {
        siteDomain = formattedUrl.replace(/https?:\/\//i, '').split('/')[0];
      }
      
      // Preparar o payload para o Supabase - Importante: Use os nomes exatos das colunas
      const payload = {
        url_site: formattedUrl,
        nome_prompt: data.name || '',
        produto_princ: data.mainProduct || '',  // Usando produto_princ como na alteração anterior
        servicos_oferec: 'Serviços variados',
        planos_oferec: 'Planos personalizados',
        links_uties: `https://${siteDomain}/contato`,
        endereco: data.address || '',
        descricao: data.description || '',
        id_usuario: user.id
      };
      
      console.log("[DEBUG] Payload para Supabase:", payload);
      
      // Tentar primeiro na tabela prompts_personalizados
      let error;
      try {
        const result = await supabase
          .from('prompts_personalizados')
          .insert([payload]);
        error = result.error;
      } catch (insertError) {
        console.error("[ERRO] Exceção ao inserir em prompts_personalizados:", insertError);
        error = insertError;
      }
      
      // Se falhar, tentar na tabela prompts_auxiliar como fallback
      if (error) {
        console.warn("[AVISO] Falha ao inserir em prompts_personalizados, tentando em prompts_auxiliar:", error);
        
        try {
          const auxiliarResult = await supabase
            .from('prompts_auxiliar')
            .insert([payload]);
          
          if (auxiliarResult.error) {
            console.error("[ERRO] Falha ao inserir em prompts_auxiliar:", auxiliarResult.error);
            throw auxiliarResult.error;
          } else {
            console.log("[SUCESSO] Dados salvos na tabela prompts_auxiliar");
            toast.success("Dados salvos no banco de dados com sucesso!");
            return;
          }
        } catch (auxiliarError) {
          console.error("[ERRO] Exceção ao tentar em prompts_auxiliar:", auxiliarError);
          error = auxiliarError;
        }
      } else {
        console.log("[SUCESSO] Dados salvos na tabela prompts_personalizados");
        toast.success("Dados salvos no banco de dados com sucesso!");
        return;
      }
      
      // Se chegou aqui, ambas as tentativas falharam
      console.error("[ERRO] Falha ao inserir no Supabase em ambas as tabelas");
      
      // Fallback para localStorage
      const localStorageKey = `prompt_${siteDomain.replace(/\./g, '_')}`;
      localStorage.setItem(localStorageKey, JSON.stringify(payload));
      console.log("[DEBUG] Dados salvos localmente como fallback");
      toast.info("Dados salvos localmente. O banco de dados está temporariamente indisponível.");
    } catch (error) {
      console.error("[ERRO] Exceção global ao salvar no Supabase:", error);
      toast.error("Não foi possível salvar os dados no banco de dados, mas o formulário foi preenchido corretamente.");
    }
  };

  // Função para renderizar um indicador de carregamento ao lado de um campo
  const renderLoadingIndicator = (isFieldLoading: boolean) => {
    if (isFieldLoading) {
      return <Loader2 className="h-4 w-4 ml-2 animate-spin text-muted-foreground" />;
    }
    return null;
  };
  
  // Função para testar diretamente a conexão com Supabase
  const testSupabaseConnection = async () => {
    try {
      toast.info('Testando conexão com o Supabase...');
      
      // Verificar apenas se conseguimos conectar ao Supabase - testar ambas as tabelas
      const { data: dataPers, error: errorPers } = await supabase.from('prompts_personalizados').select('count');
      const { data: dataAux, error: errorAux } = await supabase.from('prompts_auxiliar').select('count');
      
      if (errorPers && errorAux) {
        console.error('Erro ao conectar com Supabase:', errorPers, errorAux);
        toast.error(`Conexão falhou em ambas as tabelas`);
      } else {
        const tablesInfo = {
          prompts_personalizados: errorPers ? 'Erro' : 'OK',
          prompts_auxiliar: errorAux ? 'Erro' : 'OK'
        };
        console.log('Conexão OK:', tablesInfo);
        toast.success(`Conexão com Supabase funcionando! Tabelas: ${JSON.stringify(tablesInfo)}`);
        
        // Testar inserção - iniciar com a tabela que estiver disponível
        let targetTable = !errorPers ? 'prompts_personalizados' : 'prompts_auxiliar';
        
        // Testar inserção com apenas os campos mínimos e obrigatórios
        const testPayload = {
          url_site: 'https://teste-simples.com',
          id_usuario: user?.id || 'teste-simples'
        };
        
        console.log(`Testando inserção simples em ${targetTable}:`, testPayload);
        
        const { error: insertError } = await supabase
          .from(targetTable)
          .insert([testPayload]);
        
        if (insertError) {
          console.error(`Erro na inserção de teste em ${targetTable}:`, insertError);
          toast.error(`Inserção falhou: ${insertError.message}`);
          
          // Testar inserção mais completa com as colunas corretas
          const fullTestPayload = {
            url_site: 'https://teste-completo.com',
            id_usuario: user?.id || 'teste-completo',
            nome_prompt: 'Teste',
            produto_princ: 'Teste', // Corrigido: produto_princ em vez de produto_principal
            servicos_oferec: 'Teste',
            planos_oferec: 'Teste',
            links_uties: 'https://teste.com/contato',
            endereco: 'Teste',
            descricao: 'Teste',
            prompt: 'Teste'
          };
          
          console.log(`Testando inserção completa em ${targetTable}:`, fullTestPayload);
          
          const { error: fullInsertError } = await supabase
            .from(targetTable)
            .insert([fullTestPayload]);
          
          if (fullInsertError) {
            console.error(`Erro na inserção completa em ${targetTable}:`, fullInsertError);
            
            // Tentar na outra tabela como fallback
            const otherTable = targetTable === 'prompts_personalizados' ? 'prompts_auxiliar' : 'prompts_personalizados';
            console.log(`Tentando inserção na tabela alternativa ${otherTable}`);
            
            const { error: altInsertError } = await supabase
              .from(otherTable)
              .insert([fullTestPayload]);
            
            if (altInsertError) {
              console.error(`Erro na inserção na tabela alternativa ${otherTable}:`, altInsertError);
              toast.error(`Inserção falhou em ambas as tabelas`);
            } else {
              console.log(`Inserção completa bem-sucedida na tabela alternativa ${otherTable}!`);
              toast.success(`Inserção funcionou na tabela ${otherTable}!`);
            }
          } else {
            console.log(`Inserção completa bem-sucedida em ${targetTable}!`);
            toast.success(`Inserção completa funcionou em ${targetTable}!`);
          }
        } else {
          console.log(`Inserção de teste bem-sucedida em ${targetTable}!`);
          toast.success(`Inserção de teste funcionou em ${targetTable}!`);
        }
      }
    } catch (error) {
      console.error('Erro no teste de conexão:', error);
      toast.error('Erro ao testar conexão');
    }
  };

  // Adicionar função auxiliar para buscar o nome do tipo
  const getPromptTypeName = (id: string | number | undefined) => {
    if (!id) return '';
    const types = [
      { id: 1, nome: "Infoprodutores" },
      { id: 2, nome: "Escritórios de Advocacia" },
      { id: 3, nome: "Mentor / Professor" },
      { id: 4, nome: "Clinica de Estética" },
      { id: 5, nome: "Clinica Médica" },
      { id: 6, nome: "Marketing Digital" },
      { id: 7, nome: "Imobiliária" },
      { id: 8, nome: "Serviços Financeiros" },
      { id: 9, nome: "Hotéis" },
      { id: 10, nome: "Negócios Digitais" },
      { id: 11, nome: "Criar do zero" }
    ];
    const found = types.find(t => String(t.id) === String(id));
    return found ? found.nome : '';
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Detalhes do Chatbot</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Chatbot</Label>
            <Input 
              id="nome" 
              placeholder="Dê um nome para o seu chatbot"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>
          
          {/* Campos específicos para o tipo "Criar do zero" (ID 11) */}
          {chatbotType === "11" ? (
            <div className="space-y-2">
              <Label htmlFor="prompt">Prompt</Label>
              <Textarea 
                id="prompt" 
                placeholder="Digite o prompt personalizado para o seu chatbot"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                required
                className="min-h-[200px]"
              />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="nomeEmpresa">Nome da Empresa</Label>
                <Input 
                  id="nomeEmpresa" 
                  placeholder="Informe o nome da empresa"
                  value={nomeEmpresa}
                  onChange={(e) => setNomeEmpresa(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricaoEmpresa">Descrição da Empresa</Label>
                <Textarea 
                  id="descricaoEmpresa" 
                  placeholder="Fale um pouco sobre a empresa, sua missão e atividade"
                  value={descricaoEmpresa}
                  onChange={(e) => setDescricaoEmpresa(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input 
                  id="endereco" 
                  placeholder="Informe o endereço da empresa"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricaoProduto">Descrição de Produtos</Label>
                <Textarea 
                  id="descricaoProduto" 
                  placeholder="Descreva o seu produto: conteúdo, público alvo, objetivos, resultados"
                  value={descricaoProduto}
                  onChange={(e) => setDescricaoProduto(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modulos">Módulos</Label>
                <Input 
                  id="modulos" 
                  placeholder="Descreva quantos e quais módulos o seu produto tem"
                  value={modulos}
                  onChange={(e) => setModulos(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="diferenciais">Benefícios e Diferenciais</Label>
                <Textarea 
                  id="diferenciais" 
                  placeholder="Descreva os benefícios e diferenciais do seu produto"
                  value={diferenciais}
                  onChange={(e) => setDiferenciais(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="garantia">Garantia e Reembolso</Label>
                <Input 
                  id="garantia" 
                  placeholder="Informe o período de garantia e a forma como é feito o reembolso"
                  value={garantia}
                  onChange={(e) => setGarantia(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="precosCondicoes">Preços e Condições</Label>
                <Input 
                  id="precosCondicoes" 
                  placeholder="Informe os preços e condições dos seus produtos"
                  value={precosCondicoes}
                  onChange={(e) => setPrecosCondicoes(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="acesso">Acesso</Label>
                <Input 
                  id="acesso" 
                  placeholder="Informe por onde o seu cliente terá acesso ao produto"
                  value={acesso}
                  onChange={(e) => setAcesso(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="suporteContato">Suporte ao Cliente</Label>
                <Input 
                  id="suporteContato" 
                  placeholder="Informe os canais de atendimento e contatos para o suporte ao Cliente"
                  value={suporteContato}
                  onChange={(e) => setSuporteContato(e.target.value)}
                />
              </div>
            </>
          )}
          
          <div className="flex items-center gap-2">
            <Switch 
              id="active" 
              checked={active}
              onCheckedChange={setActive}
            />
            <Label htmlFor="active">Ativar chatbot</Label>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button onClick={handleSubmit}>
            {initialValues?.id ? 'Salvar Alterações' : 'Criar Chatbot'}
          </Button>
        </CardFooter>
      </Card>

      {/* Dialog para preenchimento com IA */}
      <Dialog open={isAIDialogOpen} onOpenChange={setIsAIDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Preencher com IA</DialogTitle>
            <DialogDescription>
              Informe a URL do seu site para que a IA possa preencher automaticamente os campos do chatbot.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="websiteUrl">URL do Site</Label>
              <Input
                id="websiteUrl"
                placeholder="https://www.example.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAIDialogOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleFillWithAI} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Pesquisando...
                </>
              ) : (
                'Pesquisar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChatbotDetailsForm; 