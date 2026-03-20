import { API_BASE_URL } from '@/config';
import { supabase } from '@/lib/supabase';

interface SendMessageParams {
  number: string;
  text: string;
  idCliente?: number; // ID do cliente para busca do lead
  telefone?: string; // Telefone do lead para busca
}

// Função para limpar o telefone removendo @s.whatsapp.net e mantendo apenas números
function limparTelefone(telefone: string): string {
  // Remover @s.whatsapp.net se existir
  let telefoneLimpo = telefone.replace('@s.whatsapp.net', '');
  
  // Manter apenas números
  telefoneLimpo = telefoneLimpo.replace(/\D/g, '');
  
  return telefoneLimpo;
}

// Retorna 'admin' se o usuário é admin (clientes_info), senão o nome do atendente (atendentes)
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

// Atualiza nome_atendente na última mensagem enviada (tipo=true) para o telefone/instâncias do cliente
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
    // silenciar; não falhar o envio
  }
}

// Função para obter o id_cliente do usuário logado
async function getIdClienteLogado(): Promise<number | null> {
  try {
    // Obter o usuário atual para buscar informações do cliente
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    // Primeiro, verificar se o usuário é um atendente/gestor
    const { data: atendenteData, error: atendenteError } = await supabase
      .from('atendentes')
      .select('id_cliente')
      .eq('email', user.email)
      .single();

    if (atendenteData) {
      return atendenteData.id_cliente;
    }

    // Usuário é cliente, buscar diretamente na tabela clientes_info
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

// Função para buscar dicionário departamento → instância (FILTRADO POR CLIENTE)
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

// Função para obter a primeira instância disponível (fallback)
async function getPrimeiraInstancia(): Promise<string | null> {
  try {
    // Obter o usuário atual para buscar informações do cliente
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    // Primeiro, verificar se o usuário é um atendente/gestor
    const { data: atendenteData, error: atendenteError } = await supabase
      .from('atendentes')
      .select('id_cliente')
      .eq('email', user.email)
      .single();

    if (atendenteData) {
      // Usuário é atendente/gestor, buscar informações do cliente
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

    // Usuário é cliente, buscar diretamente na tabela clientes_info
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

// Função auxiliar para validar se uma instância pertence a um cliente
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

    // Verificar se a instância é o chip 1 ou chip 2 do cliente
    return clientInfo.instance_name === instanceName || clientInfo.instance_name_2 === instanceName;
  } catch (error) {
    return false;
  }
}

// Função para obter o chip correto baseado no departamento do lead (LÓGICA DINÂMICA)
async function getChipByDepartment(idCliente: number, telefone: string): Promise<string | null> {
  try {
    // ETAPA 1: Buscar informações do lead usando id_cliente + telefone
    const { data: leadData, error: leadError } = await supabase
      .from('leads')
      .select('id_departamento')
      .eq('telefone', telefone)
      .eq('id_cliente', idCliente)
      .single();

    if (leadError || !leadData) {
      return await getPrimeiraInstancia();
    }

    // Se o lead não tem departamento, usar primeira instância
    if (!leadData.id_departamento) {
      return await getPrimeiraInstancia();
    }

    // ETAPA 2: Buscar dicionário departamento → instância (FILTRADO POR CLIENTE)
    const departamentoInstanciaMap = await getDepartamentoInstanciaMap(idCliente);

    // ETAPA 3: Decidir qual instância usar e VALIDAR que ela pertence ao cliente
    if (departamentoInstanciaMap[leadData.id_departamento]) {
      const instanceName = departamentoInstanciaMap[leadData.id_departamento];
      
      // VALIDAÇÃO CRÍTICA: Verificar se a instância realmente pertence ao cliente
      const isValid = await validateInstanceBelongsToClient(instanceName, idCliente);
      
      if (isValid) {
        return instanceName;
      } else {
        // Se a instância não pertence ao cliente, logar erro e usar fallback
        console.warn(`⚠️ Instância "${instanceName}" do departamento ${leadData.id_departamento} não pertence ao cliente ${idCliente}. Usando instância padrão.`);
        return await getPrimeiraInstancia();
      }
    } else {
      return await getPrimeiraInstancia();
    }

  } catch (error) {
    return await getPrimeiraInstancia();
  }
}

// Função para obter o chip padrão do cliente (DESABILITADA RELAÇÃO COM DEPARTAMENTOS)
async function getChipPadraoCliente(): Promise<string | null> {
  try {
    // Obter o usuário atual para buscar informações do cliente
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuário não autenticado');
    }
    
    
    // Primeiro, verificar se o usuário é um atendente/gestor
    const { data: atendenteData, error: atendenteError } = await supabase
      .from('atendentes')
      .select('id_cliente')
      .eq('email', user.email)
      .single();

    if (atendenteData) {
      // Usuário é atendente/gestor, buscar informações do cliente
      
      const { data: clientInfo, error: clientError } = await supabase
        .from('clientes_info')
        .select('instance_name')
        .eq('id', atendenteData.id_cliente)
        .single();
        
      if (clientError || !clientInfo?.instance_name) {
        throw new Error('Instância do WhatsApp não encontrada para o cliente associado');
      }
      
      return clientInfo.instance_name;
    }

    // Usuário é cliente, buscar diretamente na tabela clientes_info
    
    // Buscar todos os registros com este email e pegar o mais antigo (ID menor)
    const { data: clientesInfo, error: clientError } = await supabase
      .from('clientes_info')
      .select('instance_name')
      .eq('email', user.email)
      .order('id', { ascending: true })
      .limit(1);
    
    if (clientError) {
      throw new Error('Erro ao buscar informações do cliente');
    }
    
    if (!clientesInfo || clientesInfo.length === 0) {
      throw new Error('Cliente não encontrado');
    }
    
    const clientInfo = clientesInfo[0];
    
    if (!clientInfo?.instance_name) {
      throw new Error('Chip padrão não configurado para este cliente');
    }
    
    return clientInfo.instance_name;
  } catch (error) {
    throw new Error('Chip padrão não configurado para este cliente');
  }
}

// Função auxiliar para buscar informações da instância WhatsApp baseada no nome da instância
async function getWhatsAppInstanceInfoByInstanceName(userEmail: string, instanceName: string) {
  // Primeiro, verificar se o usuário é um atendente/gestor
  const { data: atendenteData, error: atendenteError } = await supabase
    .from('atendentes')
    .select('id_cliente')
    .eq('email', userEmail)
    .single();

  if (atendenteData) {
    // Usuário é atendente/gestor, buscar informações do cliente
    
    const { data: clientInfo, error: clientError } = await supabase
      .from('clientes_info')
      .select('instance_name, instance_name_2, apikey')
      .eq('id', atendenteData.id_cliente)
      .single();
      
    if (clientError || !clientInfo) {
      throw new Error('Instância do WhatsApp não encontrada para o cliente associado');
    }
    
    // Verificar se a instância solicitada é o chip 1 ou chip 2
    if (clientInfo.instance_name === instanceName) {
      return {
        instance_name: clientInfo.instance_name,
        apikey: clientInfo.apikey
      };
    } else if (clientInfo.instance_name_2 === instanceName) {
      // Para chip 2, precisamos buscar a apikey específica ou usar a mesma
      return {
        instance_name: clientInfo.instance_name_2,
        apikey: clientInfo.apikey // Assumindo que ambos os chips usam a mesma apikey
      };
    } else {
      throw new Error(`Instância ${instanceName} não encontrada para este cliente`);
    }
  }

  // Usuário é cliente, buscar diretamente na tabela clientes_info
  
  const { data: clientesInfo, error: clientError } = await supabase
    .from('clientes_info')
    .select('instance_name, instance_name_2, apikey')
    .eq('email', userEmail)
    .order('id', { ascending: true })
    .limit(1);
  
  if (clientError || !clientesInfo || clientesInfo.length === 0) {
    throw new Error('Erro ao buscar informações do cliente');
  }
  
  const clientInfo = clientesInfo[0];
  
  // Verificar se a instância solicitada é o chip 1 ou chip 2
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
    throw new Error(`Instância ${instanceName} não encontrada para este cliente`);
  }
}

// Função auxiliar para buscar informações da instância WhatsApp
async function getWhatsAppInstanceInfo(userEmail: string) {
  // Primeiro, verificar se o usuário é um atendente/gestor
  const { data: atendenteData, error: atendenteError } = await supabase
    .from('atendentes')
    .select('id_cliente')
    .eq('email', userEmail)
    .single();

  if (atendenteData) {
    // Usuário é atendente/gestor, buscar informações do cliente
    
    const { data: clientInfo, error: clientError } = await supabase
      .from('clientes_info')
      .select('instance_name, apikey')
      .eq('id', atendenteData.id_cliente)
      .single();
      
    if (clientError || !clientInfo?.instance_name) {
      console.error(`❌ [${userEmail}] Erro ao buscar instância do cliente:`, clientError);
      throw new Error('Instância do WhatsApp não encontrada para o cliente associado');
    }
    
    return clientInfo;
  }

  // Usuário é cliente, buscar diretamente na tabela clientes_info
  
  const { data: clientInfo, error: clientError } = await supabase
    .from('clientes_info')
    .select('instance_name, apikey')
    .eq('email', userEmail)
    .single();
    
  if (clientError || !clientInfo?.instance_name) {
    throw new Error('Instância do WhatsApp não encontrada para este usuário');
  }
  
  return clientInfo;
}

// Função de conveniência para enviar mensagem para um lead específico
export async function sendMessageToLead(leadId: number, text: string) {
  try {
    // Buscar informações do lead para obter o telefone
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Buscar informações do lead
    const { data: leadData, error: leadError } = await supabase
      .from('leads')
      .select('telefone, id_cliente')
      .eq('id', leadId)
      .single();

    if (leadError || !leadData) {
      throw new Error('Lead não encontrado');
    }

    if (!leadData.telefone) {
      throw new Error('Lead não possui telefone cadastrado');
    }

    // Limpar o telefone antes de enviar
    const telefoneLimpo = limparTelefone(leadData.telefone);
    
    // Enviar mensagem usando a função principal, passando idCliente e telefone limpo para busca
    return await sendMessage(leadData.telefone, text, leadData.id_cliente, telefoneLimpo);
  } catch (error) {
    throw error;
  }
}

export async function sendMessage(number: string, text: string, idCliente?: number, telefone?: string) {
  // Obter o usuário atual
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Usuário não autenticado');
  }
  
  // Buscar id_cliente automaticamente se não fornecido
  let clienteId = idCliente;
  if (!clienteId) {
    clienteId = await getIdClienteLogado();
  }
  
  // Verificar se cliente tem Cloud API ativa
  if (clienteId) {
    const { data: metaConn } = await supabase
      .from("meta_connections")
      .select("access_token, needs_reauth")
      .eq("id_cliente", clienteId)
      .single();

    const { data: waNumber } = await supabase
      .from("wa_numbers")
      .select("phone_number_id")
      .eq("id_cliente", clienteId)
      .single();

    if (metaConn?.access_token && !metaConn?.needs_reauth && waNumber?.phone_number_id) {
      const normalizedMetaTo = limparTelefone(number);
      const metaPayload = {
        messaging_product: "whatsapp",
        to: normalizedMetaTo,
        type: "text",
        text: { body: text },
      };

      const metaResponse = await fetch(
        `https://graph.facebook.com/v21.0/${waNumber.phone_number_id}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${metaConn.access_token}`,
          },
          body: JSON.stringify(metaPayload),
        }
      );

      if (metaResponse.ok) {
        getNomeAtendente().then((nome) => {
          setTimeout(() => updateNomeAtendenteParaUltimaMensagem(number, nome), 1500);
        }).catch(() => {});
        return metaResponse.json();
      }
      const metaErrorText = await metaResponse.text().catch(() => "");
      console.error("[META SEND] Falha no envio", {
        status: metaResponse.status,
        statusText: metaResponse.statusText,
        phone_number_id: waNumber.phone_number_id,
        to: normalizedMetaTo,
        response: metaErrorText,
      });
      // Se falhou, continuar para Evolution/UAZAPI como fallback
    }
  }

  // Usar o number como telefone se telefone não for fornecido
  let telefoneParaBusca = telefone || number;
  
  // Limpar o telefone para busca
  let telefoneLimpo = limparTelefone(telefoneParaBusca);
  
  let instanceName: string | null;
  
  if (clienteId && telefoneLimpo) {
    // Usar lógica dinâmica baseada no departamento
    instanceName = await getChipByDepartment(clienteId, telefoneLimpo);
  } else {
    // Usar primeira instância como fallback
    instanceName = await getPrimeiraInstancia();
  }
  
  // Validar se instanceName é válido
  if (!instanceName) {
    throw new Error('Nome da instância não encontrado');
  }
  
  // Buscar informações da instância WhatsApp
  const clientInfo = await getWhatsAppInstanceInfoByInstanceName(user.email, instanceName);
  
  // Preparar dados da requisição Evolution
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
    console.log('✅ Mensagem enviada com sucesso pela Evolution API');
    getNomeAtendente().then((nome) => {
      setTimeout(() => updateNomeAtendenteParaUltimaMensagem(number, nome), 1500);
    }).catch(() => {});
    return evolutionResult.value;
  }

  if (uazapiResult.status === 'fulfilled') {
    console.log('✅ Mensagem enviada com sucesso pela UAZAPI');
    getNomeAtendente().then((nome) => {
      setTimeout(() => updateNomeAtendenteParaUltimaMensagem(number, nome), 1500);
    }).catch(() => {});
    return uazapiResult.value;
  }

  // Se ambas falharam, lançar erro combinado
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
  // ID único para rastrear esta requisição
  const requestId = `AUDIO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // 🎯 SEMPRE USAR MP3 PARA COMPATIBILIDADE MÁXIMA
    const fileName = `audio_${Date.now()}.mp3`;
    const mimetype = 'audio/mpeg';
    const formatInfo = { nome: 'MP3 (Universal)', whatsappCompatible: true };
    
    // Log detalhado para debug
    console.log(`🎵 [${requestId}] Configuração de áudio (EXCLUSIVAMENTE para novo endpoint):`, {
      audioUrl,
      fileName,
      mimetype,
      formatInfo: formatInfo.nome
    });
    
    // Obter o usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error(`❌ [${requestId}] Usuário não autenticado`);
      throw new Error('Usuário não autenticado');
    }
    
    // Obter o chip padrão do cliente (relação com departamentos desabilitada)
    console.log(`🔍 [${requestId}] Buscando chip padrão do cliente...`);
    const instanceName = await getChipPadraoCliente();
    console.log(`📱 [${requestId}] Chip padrão:`, instanceName);
    
    // Buscar informações da instância WhatsApp
    console.log(`🔍 [${requestId}] Buscando informações da instância...`);
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
    console.log(`📤 [${requestId}] Payload para novo endpoint de áudio:`, {
      number,
      mediatype: requestBody.mediatype,
      media: audioUrl,
      fileName: requestBody.fileName,
      mimetype: requestBody.mimetype,
      ptt: requestBody.ptt,
      instanceName,
      user_id: user.id
    });

    // 🎯 ENVIAR EXCLUSIVAMENTE PARA O NOVO ENDPOINT DE ÁUDIO
    const audioWebhookUrl = 'https://webhook.dev.usesmartcrm.com/webhook/audio-teste';
    
    // Payload para o novo endpoint (mesmo payload + informações adicionais)
    const webhookPayload = {
      ...requestBody,
      instanceName,        // Nome da instância
      apikey: clientInfo.apikey || 'MI8J85niN3Ir70htmScnxGpGKl2jZgwa', // Chave da API
      user_id: user.id     // ID do usuário
    };
    
    console.log(`📤 [${requestId}] Payload para novo endpoint de áudio:`, webhookPayload);
    
    // Enviar EXCLUSIVAMENTE para o novo endpoint de áudio (não mais para Evolution API)
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
        console.log(`✅ [${requestId}] Resposta do novo endpoint de áudio:`, webhookData);
        getNomeAtendente().then((nome) => {
          setTimeout(() => updateNomeAtendenteParaUltimaMensagem(number, nome), 1500);
        }).catch(() => {});
        return webhookData;
      } else {
        console.error(`❌ [${requestId}] Erro no novo endpoint de áudio: ${webhookResponse.status}`);
      
      let errorData;
      try {
          errorData = await webhookResponse.json();
        console.error(`📄 [${requestId}] Detalhes do erro:`, errorData);
      } catch (parseError) {
        errorData = { message: 'Erro desconhecido' };
      }
      
        throw new Error(`Erro ao enviar áudio ${formatInfo.nome}: ${webhookResponse.status} - ${JSON.stringify(errorData)}`);
      }
    } catch (webhookError) {
      console.error(`💥 [${requestId}] ERRO ao enviar para novo endpoint de áudio:`, webhookError);
      throw new Error(`Falha ao enviar áudio para o novo endpoint: ${webhookError.message}`);
    }
    
  } catch (error) {
    console.error(`💥 [${requestId}] ERRO sendAudioMessage:`, error.message);
    throw error;
  }
}

export async function sendImageMessage(number: string, imageUrl: string, caption?: string) {
  // ID único para rastrear esta requisição
  const requestId = `IMAGE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Detectar formato da imagem
  let fileName = `image_${Date.now()}`;
  let mimetype = 'image/jpeg'; // padrão
  
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
  
  // Obter o usuário atual
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error(`❌ [${requestId}] Usuário não autenticado`);
    throw new Error('Usuário não autenticado');
  }
  
  // Obter o chip padrão do cliente (relação com departamentos desabilitada)
  console.log(`🔍 [${requestId}] Buscando chip padrão do cliente...`);
  const instanceName = await getChipPadraoCliente();
  console.log(`📱 [${requestId}] Chip padrão:`, instanceName);
  
  // Buscar informações da instância WhatsApp
  console.log(`🔍 [${requestId}] Buscando informações da instância...`);
  const clientInfo = await getWhatsAppInstanceInfo(user.email);
  
  // Preparar requisição Evolution
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
  
  console.log(`📷 [${requestId}] sendImageMessage: ${number} - URL: ${imageUrl} - File: ${fileName}`);
  
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
    console.log(`✅ [${requestId}] Imagem enviada com sucesso pela Evolution API`);
    getNomeAtendente().then((nome) => {
      setTimeout(() => updateNomeAtendenteParaUltimaMensagem(number, nome), 1500);
    }).catch(() => {});
    return evolutionResult.value;
  }

  if (uazapiResult.status === 'fulfilled') {
    console.log(`✅ [${requestId}] Imagem enviada com sucesso pela UAZAPI`);
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
  // ID único para rastrear esta requisição
  const requestId = `DOC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // Detectar formato do documento
    let mimetype = 'application/pdf'; // padrão
    
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
    
    // Obter o usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error(`❌ [${requestId}] Usuário não autenticado`);
      throw new Error('Usuário não autenticado');
    }
    
    // Obter o chip padrão do cliente (relação com departamentos desabilitada)
    console.log(`🔍 [${requestId}] Buscando chip padrão do cliente...`);
    const instanceName = await getChipPadraoCliente();
    console.log(`📱 [${requestId}] Chip padrão:`, instanceName);
    
    // Buscar informações da instância WhatsApp
    console.log(`🔍 [${requestId}] Buscando informações da instância...`);
    const clientInfo = await getWhatsAppInstanceInfo(user.email);
    
    // Preparar requisição Evolution
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
    
    console.log(`📄 [${requestId}] sendDocumentMessage: ${number} - URL: ${documentUrl} - File: ${fileName}`);
    
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
      console.log(`✅ [${requestId}] Documento enviado com sucesso pela Evolution API`);
      getNomeAtendente().then((nome) => {
        setTimeout(() => updateNomeAtendenteParaUltimaMensagem(number, nome), 1500);
      }).catch(() => {});
      return evolutionResult.value;
    }

    if (uazapiResult.status === 'fulfilled') {
      console.log(`✅ [${requestId}] Documento enviado com sucesso pela UAZAPI`);
      getNomeAtendente().then((nome) => {
        setTimeout(() => updateNomeAtendenteParaUltimaMensagem(number, nome), 1500);
      }).catch(() => {});
      return uazapiResult.value;
    }

    // Se ambas falharam, lançar erro combinado
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
    console.error(`💥 [${requestId}] ERRO sendDocumentMessage:`, error);
    throw error;
  }
}

export async function sendVideoMessage(number: string, videoUrl: string, caption: string = '') {
  // ID único para rastrear esta requisição
  const requestId = `VIDEO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Detectar formato do vídeo
  let fileName = `video_${Date.now()}`;
  let mimetype = 'video/mp4'; // padrão

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

  // Obter o usuário atual
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error(`❌ [${requestId}] Usuário não autenticado`);
    throw new Error('Usuário não autenticado');
  }
  
  // Obter o chip padrão do cliente (relação com departamentos desabilitada)
  console.log(`🔍 [${requestId}] Buscando chip padrão do cliente...`);
  const instanceName = await getChipPadraoCliente();
  console.log(`📱 [${requestId}] Chip padrão:`, instanceName);
  
  // Buscar informações da instância WhatsApp
  console.log(`🔍 [${requestId}] Buscando informações da instância...`);
  const clientInfo = await getWhatsAppInstanceInfo(user.email);
  
  // Preparar requisição Evolution
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
      throw new Error(`Erro ao enviar vídeo Evolution: ${response.status} - ${JSON.stringify(errorData)}`);
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
      throw new Error(`Erro ao enviar vídeo UAZAPI: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  })();

  // Executar ambas em paralelo e aguardar resultados
  const results = await Promise.allSettled([evolutionPromise, uazapiPromise]);
  
  const evolutionResult = results[0];
  const uazapiResult = results[1];
  
  // Se pelo menos uma funcionou, registrar nome_atendente e retornar
  if (evolutionResult.status === 'fulfilled') {
    console.log(`✅ [${requestId}] Vídeo enviado com sucesso pela Evolution API`);
    getNomeAtendente().then((nome) => {
      setTimeout(() => updateNomeAtendenteParaUltimaMensagem(number, nome), 1500);
    }).catch(() => {});
    return evolutionResult.value;
  }

  if (uazapiResult.status === 'fulfilled') {
    console.log(`✅ [${requestId}] Vídeo enviado com sucesso pela UAZAPI`);
    getNomeAtendente().then((nome) => {
      setTimeout(() => updateNomeAtendenteParaUltimaMensagem(number, nome), 1500);
    }).catch(() => {});
    return uazapiResult.value;
  }

  // Se ambas falharam, lançar erro combinado
  const evolutionError = evolutionResult.status === 'rejected' ? evolutionResult.reason : null;
  const uazapiError = uazapiResult.status === 'rejected' ? uazapiResult.reason : null;
  
  const errorMessages = [];
  if (evolutionError) {
    errorMessages.push(`Evolution: ${evolutionError.message || evolutionError}`);
  }
  if (uazapiError) {
    errorMessages.push(`UAZAPI: ${uazapiError.message || uazapiError}`);
  }
  
  throw new Error(`Erro ao enviar vídeo (ambas APIs falharam): ${errorMessages.join(' | ')}`);
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

// Função para buscar mensagens com paginação e scroll infinito
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

    // Aplicar paginação
    const from = page * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar mensagens:', error);
      throw new Error(`Erro ao buscar mensagens: ${error.message}`);
    }

    // Inverter a ordem para mostrar as mais antigas primeiro (cronológica)
    const messages = data ? data.reverse() : [];

    return {
      messages,
      hasMore: data && data.length === limit,
      totalCount: count || 0
    };
  } catch (error) {
    console.error('Erro ao buscar mensagens com paginação:', error);
    throw error;
  }
}

// Função para buscar as últimas mensagens de um contato específico
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

// Função para configurar subscription em tempo real para mensagens
export function setupMessagesSubscription(
  instanceIds: string[],
  onNewMessage: (message: any) => void,
  onError?: (error: any) => void
) {
  try {
    // Criar canal único para evitar duplicações
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

// Função para remover subscription
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

// Função para marcar mensagens como lidas
export async function markMessagesAsRead(phoneNumber: string, instanceIds: string[]) {
  try {
    const { error } = await supabase
      .from('agente_conversacional_whatsapp')
      .update({ foi_lida: true })
      .eq('telefone_id', phoneNumber)
      .in('instance_id', instanceIds)
      .eq('tipo', false) // Apenas mensagens recebidas
      .eq('foi_lida', false); // Apenas mensagens não lidas

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

// Função para buscar estatísticas de mensagens não lidas
export async function getUnreadMessageCounts(instanceIds: string[]) {
  try {
    // Buscar todas as mensagens não lidas
    const { data, error } = await supabase
      .from('agente_conversacional_whatsapp')
      .select('telefone_id')
      .in('instance_id', instanceIds)
      .eq('tipo', false) // Apenas mensagens recebidas
      .eq('foi_lida', false); // Apenas mensagens não lidas

    if (error) {
      console.error('Erro ao buscar contagem de mensagens não lidas:', error);
      throw new Error(`Erro ao buscar contagem de mensagens não lidas: ${error.message}`);
    }

    // Contar mensagens por telefone
    const unreadCounts: Record<string, number> = {};
    data?.forEach(item => {
      unreadCounts[item.telefone_id] = (unreadCounts[item.telefone_id] || 0) + 1;
    });

    return unreadCounts;
  } catch (error) {
    console.error('Erro ao buscar contagem de mensagens não lidas:', error);
    throw error;
  }
}