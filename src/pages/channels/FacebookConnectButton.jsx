import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth";
import { clientesService } from "@/services/clientesService";

export default function FacebookConnection({ clientId, onSuccess, onError }) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [popup, setPopup] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const handleMessage = (event) => {
      console.log('[Facebook OAuth] Mensagem recebida:', { 
        origin: event.origin, 
        data: event.data,
        currentOrigin: window.location.origin 
      });

      // Aceitar mensagens de:
      // 1. Webhook dev e app (originais)
      // 2. Mesmo domínio (para rota /oauth-close)
      // 3. Localhost (desenvolvimento)
      const allowedOrigins = [
        "https://webhook.dev.usesmartcrm.com",
        "https://app.usesmartcrm.com",
        window.location.origin, // Mesmo domínio (para /oauth-close)
        "http://localhost:8080",
        "http://localhost:5173",
        "*" // Aceitar de qualquer origem se a mensagem for válida (menos seguro, mas funciona)
      ];

      // Verificar se a origem é permitida OU se é do mesmo domínio
      const isAllowedOrigin = allowedOrigins.includes(event.origin) || 
                             event.origin === window.location.origin ||
                             allowedOrigins.includes("*");

      if (!isAllowedOrigin) {
        console.log('[Facebook OAuth] Origem não permitida:', event.origin);
        return;
      }

      const data = event.data;

      // Verificar se é uma mensagem de OAuth completa
      if (data?.type === "oauth-complete") {
        console.log('[Facebook OAuth] ✅ Mensagem oauth-complete recebida!', data);

        // Fechar popup se ainda estiver aberto
        if (popup && !popup.closed) {
          try {
            popup.close();
            console.log('[Facebook OAuth] Popup fechado via postMessage');
          } catch (e) {
            console.error('[Facebook OAuth] Erro ao fechar popup:', e);
          }
        }
        
        // Verificar se há erro
        if (data.success === false || data.error) {
          setIsConnecting(false);
          setPopup(null);
          onError?.(data.error || "OAuth falhou");
        } else {
          // Se não há erro, não chamar onSuccess ainda
          // Deixar o polling verificar se token_facebook foi preenchido
          console.log('[Facebook OAuth] OAuth completo, aguardando polling verificar condições...');
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [popup, onSuccess, onError]);

  useEffect(() => {
    if (!popup) return;

    const callbackUrl = "https://webhook.dev.usesmartcrm.com/webhook/auth/facebook/callback";
    let lastUrl = '';
    let checkCount = 0;
    const maxChecks = 300; // 5 minutos máximo (300 * 1 segundo)
    
    const timer = setInterval(() => {
      checkCount++;
      
      // Verificar se o popup foi fechado manualmente
      if (popup.closed) {
        console.log('[Facebook OAuth] Popup foi fechado manualmente');
        setIsConnecting(false);
        setPopup(null);
        clearInterval(timer);
        return;
      }

      // Timeout de segurança - fechar após muito tempo
      if (checkCount >= maxChecks) {
        console.log('[Facebook OAuth] Timeout atingido, fechando popup');
        try {
          if (popup && !popup.closed) {
            popup.close();
          }
        } catch (e) {
          console.error('[Facebook OAuth] Erro ao fechar popup no timeout:', e);
        }
        setIsConnecting(false);
        setPopup(null);
        clearInterval(timer);
        onError?.('Timeout: O processo de autenticação demorou muito.');
        return;
      }

      // Tentar verificar a URL do popup para detectar redirecionamento
      try {
        // Acessar a URL do popup (pode falhar por CORS se ainda estiver no Facebook)
        const popupUrl = popup.location.href;
        
        // Log apenas quando a URL mudar
        if (popupUrl !== lastUrl) {
          console.log('[Facebook OAuth] URL do popup mudou:', popupUrl);
          lastUrl = popupUrl;
        }
        
        // Se a URL contém o callback do webhook, significa que o OAuth foi concluído
        if (popupUrl.includes(callbackUrl) || popupUrl.includes('/webhook/auth/facebook')) {
          console.log('[Facebook OAuth] ✅ Callback detectado! Fechando popup...');
          
          // Dar um pequeno delay para garantir que o webhook processou
          setTimeout(() => {
            try {
              // Fechar o popup
              if (popup && !popup.closed) {
                console.log('[Facebook OAuth] Tentando fechar popup...');
                popup.close();
                console.log('[Facebook OAuth] Popup fechado com sucesso');
              }
            } catch (closeError) {
              console.error('[Facebook OAuth] Erro ao fechar popup:', closeError);
              // Tentar forçar fechamento
              try {
                popup.close();
              } catch (e) {
                console.error('[Facebook OAuth] Erro ao forçar fechamento:', e);
              }
            }
            
            // Não fechar o popup nem chamar callbacks aqui
            // O polling vai verificar quando token_facebook for preenchido
            clearInterval(timer);
            
            // Verificar se há parâmetros de erro na URL
            try {
              const urlParams = new URL(popupUrl).searchParams;
              const error = urlParams.get('error');
              
              console.log('[Facebook OAuth] Parâmetros da URL:', { error });
              
              if (error) {
                // Se houver erro explícito, chamar onError
                setIsConnecting(false);
                setPopup(null);
                onError?.(error);
              } else {
                // Se não há erro, apenas fechar o popup e deixar o polling verificar as condições
                console.log('[Facebook OAuth] Callback detectado, aguardando polling verificar condições...');
                // O polling vai verificar token_facebook
              }
            } catch (urlError) {
              // Se não conseguir parsear a URL, deixar o polling verificar
              console.log('[Facebook OAuth] Não foi possível parsear URL, aguardando polling...');
            }
          }, 500); // Delay de 500ms antes de fechar
          
          // Parar o intervalo imediatamente
          clearInterval(timer);
        }
      } catch (error) {
        // Erro de CORS é esperado quando o popup ainda está no Facebook
        // Isso é normal e não é um problema
        // Apenas continuar verificando
        // Log apenas a cada 10 verificações para não poluir o console
        if (checkCount % 10 === 0) {
          // Silencioso - CORS é esperado
        }
      }
    }, 1000); // Verificar a cada 1 segundo (mais eficiente)

    return () => clearInterval(timer);
  }, [popup, onSuccess, onError]);

  // Polling para verificar se o token foi salvo no banco (Solução mais confiável)
  useEffect(() => {
    if (!popup || !isConnecting || !user?.id) return;

    let pollCount = 0;
    const maxPolls = 120; // 2 minutos máximo (120 * 1 segundo)
    let tokenFound = false;

    const pollTimer = setInterval(async () => {
      pollCount++;

      // Timeout de segurança
      if (pollCount >= maxPolls) {
        console.log('[Facebook OAuth] Polling timeout atingido');
        clearInterval(pollTimer);
        return;
      }

      // Não parar o polling se o popup foi fechado
      // Continuar verificando até que token_facebook seja preenchido

      try {
        // Limpar cache para garantir dados atualizados
        clientesService.clearCache(user.id);
        
        // Buscar dados do cliente
        const cliente = await clientesService.getClienteByUserId(user.id);
        
        // Verificar se token_facebook foi preenchido (única fonte de verdade)
        const facebookConectado = !!cliente?.token_facebook && cliente.token_facebook.trim() !== '';
        
        // Log detalhado a cada verificação
        if (pollCount % 5 === 0 || facebookConectado) {
          console.log('[Facebook OAuth] Verificando conexão:', {
            pollCount,
            facebookConectado,
            tokenValue: cliente?.token_facebook ? 'preenchido' : 'NULL'
          });
        }
        
        if (facebookConectado) {
          console.log('[Facebook OAuth] ✅ Token do Facebook detectado! Facebook conectado.');
          tokenFound = true;
          
          // Parar polling
          clearInterval(pollTimer);
          
          // Fechar popup
          try {
            if (popup && !popup.closed) {
              console.log('[Facebook OAuth] Fechando popup após detectar token...');
              popup.close();
              console.log('[Facebook OAuth] Popup fechado com sucesso via polling');
            }
          } catch (closeError) {
            console.error('[Facebook OAuth] Erro ao fechar popup:', closeError);
          }
          
          setIsConnecting(false);
          setPopup(null);
          
          // Chamar onSuccess quando token_facebook for preenchido
          console.log('[Facebook OAuth] Chamando onSuccess via polling...');
          onSuccess?.({ success: true, source: 'polling' });
        } else {
          // Log apenas a cada 5 verificações para não poluir
          if (pollCount % 5 === 0) {
            console.log(`[Facebook OAuth] Polling... (${pollCount}/${maxPolls}) - Facebook conectado: ${facebookConectado}, PopupFechado: ${popup.closed}`);
          }
        }
      } catch (error) {
        console.error('[Facebook OAuth] Erro no polling:', error);
        // Continuar tentando mesmo com erro
      }
    }, 1000); // Verificar a cada 1 segundo

    return () => {
      clearInterval(pollTimer);
      if (tokenFound) {
        console.log('[Facebook OAuth] Polling finalizado - token encontrado');
      }
    };
  }, [popup, isConnecting, user?.id, onSuccess]);

  const handleConnect = async () => {
    console.log('[FacebookConnection] handleConnect chamado', { clientId, user: user?.id });
    
    if (!clientId) {
      console.error('[FacebookConnection] clientId não fornecido');
      onError?.("Client ID não configurado.");
      return;
    }

    setIsConnecting(true);

    const facebookAuthUrl = new URL("https://www.facebook.com/v23.0/dialog/oauth");
    facebookAuthUrl.searchParams.append("client_id", clientId);
    facebookAuthUrl.searchParams.append(
      "redirect_uri",
      "https://webhook.dev.usesmartcrm.com/webhook/auth/facebook/callback"
    );
    facebookAuthUrl.searchParams.append("state", clientId);
    facebookAuthUrl.searchParams.append(
      "scope",
      "ads_management,ads_read,business_management"
    );
    facebookAuthUrl.searchParams.append("response_type", "code");

    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    console.log('[FacebookConnection] Abrindo popup:', facebookAuthUrl.toString());

    const popupWindow = window.open(
      facebookAuthUrl.toString(),
      "FacebookAuth",
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`
    );

    if (!popupWindow) {
      console.error('[FacebookConnection] Popup bloqueado');
      setIsConnecting(false);
      onError?.("Popup bloqueado. Permita popups para conectar com o Facebook.");
      return;
    }

    console.log('[FacebookConnection] Popup aberto com sucesso');
    setPopup(popupWindow);
    popupWindow.focus();
  };

  return (
    <button 
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('[FacebookConnection] Botão clicado');
        handleConnect();
      }} 
      disabled={isConnecting}
      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      style={{ width: '100%' }}
    >
      {isConnecting ? "Conectando..." : "Conectar Facebook"}
    </button>
  );
}
