import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const META_APP_ID = Deno.env.get("META_APP_ID")!;
const META_APP_SECRET = Deno.env.get("META_APP_SECRET")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-application-name, x-client-info, apikey",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, waba_id, phone_number_id, id_cliente } = await req.json();
    console.log("Recebido:", { code: code?.slice(0, 20), waba_id, phone_number_id, id_cliente });

    if (!code || !id_cliente) {
      return new Response(
        JSON.stringify({ error: "Parâmetros obrigatórios ausentes" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 1. Trocar code por token
    const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&code=${code}`;
    const tokenResp = await fetch(tokenUrl);
    const tokenData = await tokenResp.json();
    console.log("Token response:", JSON.stringify(tokenData));

    if (!tokenData.access_token) {
      return new Response(
        JSON.stringify({ error: "Falha ao obter token", detail: tokenData }),
        { status: 400, headers: corsHeaders }
      );
    }

    const shortToken = tokenData.access_token;

    // 2. Trocar por token de longa duração
    const longTokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${shortToken}`;
    const longTokenResp = await fetch(longTokenUrl);
    const longTokenData = await longTokenResp.json();
    console.log("Long token response:", JSON.stringify(longTokenData));

    const accessToken = longTokenData.access_token ?? shortToken;
    const expiresIn = longTokenData.expires_in ?? 3600;
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // 3. Buscar phone_number_id se não veio do frontend
    let finalPhoneNumberId = phone_number_id;
    console.log("phone_number_id recebido do frontend:", finalPhoneNumberId);

    if (!finalPhoneNumberId && waba_id) {
      console.log("Buscando phone numbers via waba_id:", waba_id);
      const numbersResp = await fetch(
        `https://graph.facebook.com/v21.0/${waba_id}/phone_numbers?access_token=${accessToken}`
      );
      const numbersData = await numbersResp.json();
      console.log("Phone numbers response:", JSON.stringify(numbersData));
      finalPhoneNumberId = numbersData?.data?.[0]?.id ?? null;
    }

    console.log("finalPhoneNumberId:", finalPhoneNumberId);

    // 4. Salvar token em meta_connections
    console.log("Salvando em meta_connections para id_cliente:", id_cliente);
    const { error: connError } = await supabase.from("meta_connections").upsert({
      id_cliente,
      access_token: accessToken,
      expires_at: expiresAt,
      needs_reauth: false,
      refresh_error: null,
      last_refresh_at: new Date().toISOString(),
    }, { onConflict: "id_cliente" });

    if (connError) {
      console.error("Erro ao salvar meta_connections:", JSON.stringify(connError));
    } else {
      console.log("meta_connections salvo com sucesso");
    }

    // 5. Salvar phone_number_id em wa_numbers
    if (finalPhoneNumberId) {
      const phoneResp = await fetch(
        `https://graph.facebook.com/v21.0/${finalPhoneNumberId}?fields=display_phone_number&access_token=${accessToken}`
      );
      const phoneData = await phoneResp.json();
      console.log("Phone data:", JSON.stringify(phoneData));

      const { error: waError } = await supabase.from("wa_numbers").upsert({
        phone_number_id: finalPhoneNumberId,
        id_cliente,
        display_phone_number: phoneData?.display_phone_number ?? null,
      }, { onConflict: "phone_number_id" });

      if (waError) {
        console.error("Erro ao salvar wa_numbers:", JSON.stringify(waError));
      } else {
        console.log("wa_numbers salvo com sucesso");
      }
    }

    // 6. Inscrever webhook no número de telefone (CRÍTICO para receber mensagens)
    if (finalPhoneNumberId && accessToken && waba_id) {
      try {
        const webhookUrl = `${SUPABASE_URL.replace('/rest/v1', '')}/functions/v1/meta-webhook`;
        console.log("🔔 [AUTH] Tentando inscrever webhook no número:", finalPhoneNumberId);
        console.log("🔔 [AUTH] WABA ID:", waba_id);
        console.log("🔔 [AUTH] Webhook URL:", webhookUrl);
        
        // Método 1: Tentar inscrever via WABA ID (mais confiável)
        // IMPORTANTE: Para Tech Provider, a inscrição deve ser feita no WABA ID
        if (waba_id) {
          try {
            // Primeiro, verificar se já está inscrito
            const checkUrl = `https://graph.facebook.com/v21.0/${waba_id}/subscribed_apps`;
            console.log("🔔 [AUTH] Verificando inscrição atual via WABA ID:", checkUrl);
            
            const checkResponse = await fetch(checkUrl, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              }
            });
            
            const checkData = await checkResponse.json();
            console.log("🔔 [AUTH] Status atual da inscrição:", JSON.stringify(checkData));
            
            // Verificar se o App já está inscrito
            const isSubscribed = checkData.data?.some((app: any) => {
              const appIdMatches = app.id === META_APP_ID || app.id === String(META_APP_ID);
              const hasMessages = app.subscribed_fields?.includes('messages');
              return appIdMatches && hasMessages;
            });
            
            if (isSubscribed) {
              console.log("✅ [AUTH] App já está inscrito no WABA ID!");
            } else {
              // Tentar inscrever
              console.log("🔔 [AUTH] App não está inscrito, tentando inscrever...");
              const subscribeUrl = `https://graph.facebook.com/v21.0/${waba_id}/subscribed_apps`;
              
              const subscribeResponse = await fetch(subscribeUrl, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  subscribed_fields: ['messages']
                })
              });
              
              const subscribeData = await subscribeResponse.json();
              console.log("🔔 [AUTH] Resposta da inscrição via WABA:", JSON.stringify(subscribeData));
              
              if (subscribeData.success) {
                console.log("✅ [AUTH] Webhook inscrito com sucesso via WABA ID!");
              } else if (subscribeData.error) {
                console.warn("⚠️ [AUTH] Erro ao inscrever via WABA:", subscribeData.error.message);
                console.warn("⚠️ [AUTH] Código:", subscribeData.error.code);
                console.warn("⚠️ [AUTH] Tipo:", subscribeData.error.type);
                
                // Se o erro for de permissão, pode ser que precise ser feito via painel
                if (subscribeData.error.code === 100 || subscribeData.error.error_subcode === 33) {
                  console.warn("⚠️ [AUTH] Inscrição precisa ser feita via painel da Meta ou requer permissões adicionais");
                }
              }
            }
          } catch (wabaError) {
            console.warn("⚠️ [AUTH] Erro ao inscrever via WABA ID:", wabaError);
          }
        }
        
        // Método 2: Tentar inscrever via Phone Number ID
        try {
          const subscribeUrl = `https://graph.facebook.com/v21.0/${finalPhoneNumberId}/subscribed_apps`;
          console.log("🔔 [AUTH] Tentando via Phone Number ID:", subscribeUrl);
          
          const subscribeResponse = await fetch(subscribeUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              subscribed_fields: ['messages']
            })
          });
          
          const subscribeData = await subscribeResponse.json();
          console.log("🔔 [AUTH] Resposta da inscrição via Phone Number ID:", JSON.stringify(subscribeData));
          
          if (subscribeData.success) {
            console.log("✅ [AUTH] Webhook inscrito com sucesso via Phone Number ID!");
          } else if (subscribeData.error) {
            console.warn("⚠️ [AUTH] Erro ao inscrever via Phone Number ID:", subscribeData.error.message);
            console.warn("⚠️ [AUTH] Código do erro:", subscribeData.error.code);
            console.warn("⚠️ [AUTH] Tipo do erro:", subscribeData.error.type);
          }
        } catch (phoneError) {
          console.warn("⚠️ [AUTH] Erro ao inscrever via Phone Number ID:", phoneError);
        }
        
        // Instruções manuais
        console.warn("⚠️ [AUTH] IMPORTANTE: Se a inscrição automática falhou, inscreva manualmente:");
        console.warn("   1. Acesse: https://developers.facebook.com/apps/[APP_ID]/whatsapp-business/phone-numbers");
        console.warn("   2. Selecione o número: +55 75 9995-3901");
        console.warn("   3. Vá em 'Webhooks' e certifique-se de que está inscrito");
        console.warn("   4. OU use o Graph API Explorer:");
        console.warn(`      POST /${waba_id || finalPhoneNumberId}/subscribed_apps`);
        console.warn(`      Body: { "subscribed_fields": ["messages"] }`);
        
      } catch (webhookError) {
        console.error("❌ [AUTH] Erro geral ao inscrever webhook:", webhookError);
      }
    } else {
      console.warn("⚠️ [AUTH] Não foi possível inscrever webhook - dados ausentes:", {
        phone_number_id: !!finalPhoneNumberId,
        access_token: !!accessToken,
        waba_id: !!waba_id
      });
    }

    console.log("Retornando ok: true");
    return new Response(
      JSON.stringify({
        ok: true,
        phone_number_id: finalPhoneNumberId,
        expires_at: expiresAt,
        webhook_note: "Configure o webhook manualmente no painel da Meta",
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (err) {
    console.error("Erro em meta-auth:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno", detail: String(err) }),
      { status: 500, headers: corsHeaders }
    );
  }
});