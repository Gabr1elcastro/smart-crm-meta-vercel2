// UAZAPI Service
// Serviço para integração com a API UAZAPI do WhatsApp

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

// Configuração da API UAZAPI
const UAZAPI_BASE_URL = "https://smartcrm.uazapi.com";
const UAZAPI_ADMIN_TOKEN = "4YyhLKg7eUGhy2vhfzJDbtreK4UJbXNEElCYPS5wQBeADxLcyF";

/**
 * Gera um nome de instância consistente seguindo o padrão da Evolution
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
 * Cria uma nova instância na UAZAPI
 */
export async function createUAZAPIInstance(
  params: CreateInstanceParams
): Promise<CreateInstanceResponse> {
  try {
    // Gera o nome da instância seguindo o padrão da Evolution
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
      throw new Error(`Erro ao criar instância UAZAPI: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    console.log("📦 Resposta completa da criação da instância UAZAPI:", data);
    
    // A resposta da UAZAPI deve retornar um token
    const token = data.token || data.data?.token || data.instance?.token || "";
    
    if (!token) {
      throw new Error('Token não retornado pela API UAZAPI');
    }
    
    // O instanceName é o nome que foi enviado na requisição
    const responseInstanceName = data.instanceName || data.data?.instanceName || data.instance?.name || data.name || instanceName;
    
    // Verificar se o QR code já vem na resposta
    const qrcodeFromResponse = data.qrcode || data.data?.qrcode || data.instance?.qrcode || data.code || null;
    
    return {
      token: token,
      instanceName: responseInstanceName,
      instance: data.instance || data.data || data,
      qrcode: qrcodeFromResponse, // Incluir QR code se já vier na resposta
    };
  } catch (error) {
    console.error('Erro ao criar instância UAZAPI:', error);
    throw error;
  }
}

/**
 * Conecta a instância e obtém o QR Code
 * Segundo a documentação: 
 * - POST para /instance/connect
 * - Requer o token de autenticação da instância
 * - Não passa o campo "phone" para gerar QR code
 * - Atualiza o status para "connecting"
 */
export async function connectUAZAPIInstanceAndGetQRCode(
  token: string
): Promise<QRCodeResponse> {
  try {
    // POST para /instance/connect
    // Não passa o campo "phone" para gerar QR code (não número)
    // Usa o token da instância como autenticação (não admin token)
    const response = await fetch(`${UAZAPI_BASE_URL}/instance/connect`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'token': token, // Token da instância no header
      },
      body: JSON.stringify({}), // Body vazio - não passa "phone" para gerar QR code
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao conectar instância UAZAPI: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    console.log("📦 Resposta da conexão UAZAPI:", data);
    
    return {
      qrcode: data.qrcode || data.data?.qrcode || data.instance?.qrcode || data.code,
      instance: data.instance || data.data || data,
    };
  } catch (error) {
    console.error('Erro ao conectar instância UAZAPI:', error);
    throw error;
  }
}

/**
 * Obtém o status da instância
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
        'token': token, // Token da instância no header
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao obter status da instância UAZAPI: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    console.log("📊 Status completo da instância UAZAPI:", data);
    
    // A resposta pode ter status em diferentes lugares
    const instanceStatus = data.status || data.data?.status || data.instance?.status;
    
    return {
      status: instanceStatus,
      connected: instanceStatus === 'connected' || data.connected === true || data.data?.connected === true,
      loggedIn: instanceStatus === 'connected' || data.loggedIn === true || data.data?.loggedIn === true,
      instance: data.instance || data.data || data,
    };
  } catch (error) {
    console.error('Erro ao obter status da instância UAZAPI:', error);
    throw error;
  }
}

/**
 * Configura o webhook da instância
 * Modo simples (recomendado) - gerencia automaticamente um único webhook por instância
 * Endpoint: POST /webhook (não /instance/webhook)
 */
export async function configureUAZAPIWebhook(
  token: string
): Promise<void> {
  console.log("🚀 [WEBHOOK] INÍCIO da função configureUAZAPIWebhook");
  console.log("🚀 [WEBHOOK] Token recebido:", token ? `${token.substring(0, 10)}...` : "null/undefined");
  console.log("🚀 [WEBHOOK] Token completo length:", token?.length || 0);
  
  try {
    // No Vite, variáveis de ambiente devem ser acessadas via import.meta.env
    // Mas como estamos em runtime, vamos usar o valor padrão diretamente
    const webhookUrl = "https://webhook.dev.usesmartcrm.com/webhook/uazapi";
    console.log("🚀 [WEBHOOK] Webhook URL:", webhookUrl);
    
    // Modo simples: não incluir action nem id - cria novo ou atualiza existente automaticamente
    const requestBody = {
      enabled: true,
      url: webhookUrl,
      events: ["messages", "connection"],
      excludeMessages: ["isGroupYes"],
    };

    console.log("🚀 [WEBHOOK] Request Body completo:", JSON.stringify(requestBody, null, 2));
    console.log("🚀 [WEBHOOK] Endpoint:", `${UAZAPI_BASE_URL}/webhook`);
    console.log("🚀 [WEBHOOK] Headers:", {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'token': token ? `${token.substring(0, 10)}...` : "null/undefined"
    });

    console.log("🚀 [WEBHOOK] Enviando requisição fetch...");
    const response = await fetch(`${UAZAPI_BASE_URL}/webhook`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'token': token, // Token da instância no header
      },
      body: JSON.stringify(requestBody),
    });

    console.log("🚀 [WEBHOOK] Resposta recebida - Status:", response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erro ao configurar webhook UAZAPI: ${response.status} - ${errorText}`);
      throw new Error(`Erro ao configurar webhook UAZAPI: ${response.status} - ${errorText}`);
    } else {
      let responseData;
      try {
        responseData = await response.json();
      } catch (parseError) {
        responseData = await response.text();
      }
      console.log("✅ Webhook UAZAPI configurado com sucesso:", responseData);
    }
  } catch (error) {
    console.error('Erro ao configurar webhook UAZAPI:', error);
    throw error; // Relançar erro para que o chamador saiba que falhou
  }
}

/**
 * Atualiza o instance_id nas tabelas relacionadas quando uma nova instância UAZAPI é criada
 * Atualiza apenas os registros que possuíam a instância anterior (Evolution)
 */
export async function updateInstanceIdInRelatedTables(
  userEmail: string,
  oldInstanceId: string | null,
  newInstanceId: string
): Promise<void> {
  console.log(`🔄 [UPDATE INSTANCE_ID] Iniciando atualização nas tabelas relacionadas`);
  console.log(`🔄 [UPDATE INSTANCE_ID] userEmail: ${userEmail}`);
  console.log(`🔄 [UPDATE INSTANCE_ID] oldInstanceId: ${oldInstanceId}`);
  console.log(`🔄 [UPDATE INSTANCE_ID] newInstanceId: ${newInstanceId}`);
  
  try {
    if (!oldInstanceId) {
      console.log("ℹ️ [UPDATE INSTANCE_ID] Nenhuma instância anterior encontrada, não há necessidade de atualizar tabelas relacionadas");
      return;
    }

    console.log(`🔄 [UPDATE INSTANCE_ID] Atualizando instance_id de "${oldInstanceId}" para "${newInstanceId}" nas tabelas relacionadas`);

    // Obter id_cliente do usuário
    const { data: clientInfo, error: clientError } = await supabase
      .from('clientes_info')
      .select('id')
      .eq('email', userEmail)
      .single();

    if (clientError || !clientInfo) {
      console.error("❌ Erro ao obter id_cliente:", clientError);
      return;
    }

    const idCliente = clientInfo.id;

    // Atualizar tabela leads - apenas registros com instance_id antigo e id_cliente correspondente
    console.log(`🔄 [UPDATE INSTANCE_ID] Atualizando tabela leads: WHERE instance_id = '${oldInstanceId}' AND id_cliente = ${idCliente}`);
    try {
      const { error: leadsError } = await supabase
        .from('leads')
        .update({ instance_id: newInstanceId })
        .eq('instance_id', oldInstanceId)
        .eq('id_cliente', idCliente);

      if (leadsError) {
        console.error("❌ [UPDATE INSTANCE_ID] Erro ao atualizar instance_id na tabela leads:", leadsError);
      } else {
        console.log(`✅ [UPDATE INSTANCE_ID] instance_id atualizado na tabela leads`);
      }
    } catch (leadsError) {
      console.error("❌ [UPDATE INSTANCE_ID] Erro ao atualizar instance_id na tabela leads:", leadsError);
    }

    // Atualizar tabela agente_conversacional_whatsapp - apenas registros com instance_id antigo e id_cliente correspondente
    console.log(`🔄 [UPDATE INSTANCE_ID] Atualizando tabela agente_conversacional_whatsapp: WHERE instance_id = '${oldInstanceId}' AND id_cliente = ${idCliente}`);
    try {
      const { error: agenteError } = await supabase
        .from('agente_conversacional_whatsapp')
        .update({ instance_id: newInstanceId })
        .eq('instance_id', oldInstanceId)
        .eq('id_cliente', idCliente);

      if (agenteError) {
        console.error("❌ [UPDATE INSTANCE_ID] Erro ao atualizar instance_id na tabela agente_conversacional_whatsapp:", agenteError);
      } else {
        console.log(`✅ [UPDATE INSTANCE_ID] instance_id atualizado na tabela agente_conversacional_whatsapp`);
      }
    } catch (agenteError) {
      console.error("❌ [UPDATE INSTANCE_ID] Erro ao atualizar instance_id na tabela agente_conversacional_whatsapp:", agenteError);
    }

    // Atualizar tabela prompts_oficial - apenas registros com instance_id antigo e id_cliente correspondente
    console.log(`🔄 [UPDATE INSTANCE_ID] Atualizando tabela prompts_oficial: WHERE instance_id = '${oldInstanceId}' AND id_cliente = ${idCliente}`);
    try {
      const { error: promptsError } = await supabase
        .from('prompts_oficial')
        .update({ instance_id: newInstanceId })
        .eq('instance_id', oldInstanceId)
        .eq('id_cliente', idCliente);

      if (promptsError) {
        console.error("❌ [UPDATE INSTANCE_ID] Erro ao atualizar instance_id na tabela prompts_oficial:", promptsError);
      } else {
        console.log(`✅ [UPDATE INSTANCE_ID] instance_id atualizado na tabela prompts_oficial`);
      }
    } catch (promptsError) {
      console.error("❌ [UPDATE INSTANCE_ID] Erro ao atualizar instance_id na tabela prompts_oficial:", promptsError);
    }

    console.log("✅ Atualização de instance_id nas tabelas relacionadas concluída");
  } catch (error) {
    console.error("❌ Erro ao atualizar instance_id nas tabelas relacionadas:", error);
    // Não lança erro para não bloquear o fluxo
  }
}

/**
 * Obtém o token da instância UAZAPI do cliente (retorna null se não existir)
 */
export async function getUAZAPIInstanceToken(userEmail: string): Promise<string | null> {
  try {
    // Primeiro, verificar se o usuário é um atendente/gestor
    const { data: atendenteData, error: atendenteError } = await supabase
      .from('atendentes')
      .select('id_cliente')
      .eq('email', userEmail)
      .single();

    if (atendenteData && !atendenteError) {
      // Usuário é atendente/gestor, buscar informações do cliente
      const { data: clientInfo, error: clientError } = await supabase
        .from('clientes_info')
        .select('instance_id')
        .eq('id', atendenteData.id_cliente)
        .single();
        
      if (clientError || !clientInfo?.instance_id) {
        console.warn('Token da instância UAZAPI não encontrado para o cliente associado');
        return null;
      }
      
      return clientInfo.instance_id;
    }

    // Usuário é cliente, buscar diretamente na tabela clientes_info
    const { data: clientInfo, error: clientError } = await supabase
      .from('clientes_info')
      .select('instance_id')
      .eq('email', userEmail)
      .order('id', { ascending: true })
      .limit(1);
    
    if (clientError || !clientInfo || clientInfo.length === 0) {
      console.warn('Token da instância UAZAPI não encontrado para este usuário ou não configurado');
      return null;
    }
    
    if (!clientInfo[0]?.instance_id) {
      console.warn('Token da instância UAZAPI não configurado');
      return null;
    }
    
    return clientInfo[0].instance_id;
  } catch (error) {
    console.error('Erro ao obter token da instância UAZAPI:', error);
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
  // Obter o token da instância
  let token: string | null;
  if (userEmail) {
    token = await getUAZAPIInstanceToken(userEmail);
  } else {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }
    token = await getUAZAPIInstanceToken(user.email!);
  }

  // Se não tem token UAZAPI configurado, lançar erro (será tratado pelo Promise.allSettled)
  if (!token) {
    throw new Error('Token UAZAPI não configurado');
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
      'token': token, // Token da instância no header
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
 * Envia uma mensagem de mídia via UAZAPI
 */
export async function sendUAZAPIMediaMessage(
  params: SendMediaMessageParams,
  userEmail?: string
): Promise<any> {
  // Obter o token da instância
  let token: string | null;
  if (userEmail) {
    token = await getUAZAPIInstanceToken(userEmail);
  } else {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }
    token = await getUAZAPIInstanceToken(user.email!);
  }

  // Se não tem token UAZAPI configurado, lançar erro (será tratado pelo Promise.allSettled)
  if (!token) {
    throw new Error('Token UAZAPI não configurado');
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
      'token': token, // Token da instância no header
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao enviar mídia UAZAPI: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data;
}
