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

// PASSO 2.5 — Auto-descoberta de WABA ID e Phone Number ID via API Meta
// O backend descobre esses dados sozinho, sem depender do frontend (que pode ter race condition).
async function discoverWabaAndPhone(accessToken: string): Promise<{
  waba_id: string | null;
  phone_number_id: string | null;
  display_phone_number: string | null;
}> {
  let wabaId: string | null = null;
  let phoneNumberId: string | null = null;
  let displayPhoneNumber: string | null = null;

  // Tentativa A: listar WABAs compartilhados com o App (fluxo Embedded Signup / Tech Provider)
  console.log("🔍 [DISCOVER] Tentativa A: GET /{APP_ID}/whatsapp_business_accounts...");
  try {
    const resp = await fetch(
      `https://graph.facebook.com/v21.0/${META_APP_ID}/whatsapp_business_accounts?access_token=${accessToken}`
    );
    const data = await resp.json();
    console.log("🔍 [DISCOVER] Resposta whatsapp_business_accounts:", JSON.stringify(data));

    if (data?.data?.length > 0) {
      wabaId = data.data[0].id;
      console.log("✅ [DISCOVER] WABA ID encontrado via App:", wabaId);
    } else {
      console.log("⚠️ [DISCOVER] Nenhum WABA retornado pela tentativa A");
    }
  } catch (err) {
    console.warn("⚠️ [DISCOVER] Erro na tentativa A:", err);
  }

  // Tentativa B: debug_token — extrai granular_scopes que contêm os IDs vinculados ao token
  if (!wabaId) {
    console.log("🔍 [DISCOVER] Tentativa B: GET /debug_token para extrair granular_scopes...");
    try {
      const resp = await fetch(
        `https://graph.facebook.com/v21.0/debug_token?input_token=${accessToken}&access_token=${META_APP_ID}|${META_APP_SECRET}`
      );
      const data = await resp.json();
      console.log("🔍 [DISCOVER] debug_token response:", JSON.stringify(data));

      const granularScopes: Array<{ scope: string; target_ids?: string[] }> =
        data?.data?.granular_scopes ?? [];

      for (const scope of granularScopes) {
        if (
          (scope.scope === "whatsapp_business_management" ||
            scope.scope === "business_management") &&
          scope.target_ids?.length
        ) {
          wabaId = scope.target_ids[0];
          console.log("✅ [DISCOVER] WABA ID extraído do debug_token:", wabaId);
          break;
        }
      }

      if (!wabaId) {
        console.log(
          "⚠️ [DISCOVER] WABA ID não encontrado no debug_token. granular_scopes:",
          JSON.stringify(granularScopes)
        );
      }
    } catch (err) {
      console.warn("⚠️ [DISCOVER] Erro na tentativa B:", err);
    }
  }

  // Com o WABA ID em mãos, buscar os phone numbers
  if (wabaId) {
    console.log("🔍 [DISCOVER] Buscando phone_numbers para WABA:", wabaId);
    try {
      const resp = await fetch(
        `https://graph.facebook.com/v21.0/${wabaId}/phone_numbers?access_token=${accessToken}`
      );
      const data = await resp.json();
      console.log("🔍 [DISCOVER] phone_numbers response:", JSON.stringify(data));

      if (data?.data?.length > 0) {
        phoneNumberId = data.data[0].id;
        displayPhoneNumber = data.data[0].display_phone_number ?? null;
        console.log(
          "✅ [DISCOVER] Phone Number ID encontrado:",
          phoneNumberId,
          "=>",
          displayPhoneNumber
        );
      } else {
        console.log("⚠️ [DISCOVER] Nenhum phone number encontrado para o WABA");
      }
    } catch (err) {
      console.warn("⚠️ [DISCOVER] Erro ao buscar phone_numbers:", err);
    }
  }

  return { waba_id: wabaId, phone_number_id: phoneNumberId, display_phone_number: displayPhoneNumber };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // waba_id e phone_number_id do frontend são OPCIONAIS — usados apenas como fallback
    const {
      code,
      waba_id: frontendWabaId,
      phone_number_id: frontendPhoneNumberId,
      id_cliente,
    } = await req.json();

    console.log("📥 [AUTH] Recebido:", {
      code: code?.slice(0, 20) + "...",
      waba_id: frontendWabaId ?? "(ausente)",
      phone_number_id: frontendPhoneNumberId ?? "(ausente)",
      id_cliente,
    });

    if (!code || !id_cliente) {
      return new Response(
        JSON.stringify({ error: "Parâmetros obrigatórios ausentes: code e id_cliente" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // PASSO 1: Trocar code por token de curta duração
    console.log("🔑 [AUTH] Passo 1: trocando code por short-lived token...");
    const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&code=${code}`;
    const tokenResp = await fetch(tokenUrl);
    const tokenData = await tokenResp.json();
    console.log("🔑 [AUTH] Short token response:", JSON.stringify({
      ...tokenData,
      access_token: tokenData.access_token ? "[REDACTED]" : undefined,
    }));

    if (!tokenData.access_token) {
      return new Response(
        JSON.stringify({ error: "Falha ao obter token", detail: tokenData }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const shortToken = tokenData.access_token;

    // PASSO 2: Trocar por token de longa duração
    console.log("🔑 [AUTH] Passo 2: trocando por long-lived token...");
    const longTokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${shortToken}`;
    const longTokenResp = await fetch(longTokenUrl);
    const longTokenData = await longTokenResp.json();
    console.log("🔑 [AUTH] Long token response:", JSON.stringify({
      ...longTokenData,
      access_token: longTokenData.access_token ? "[REDACTED]" : undefined,
    }));

    const rawAccessToken = longTokenData.access_token ?? shortToken;
    // Normaliza para evitar \r\n no final (causa 401 no envio)
    const accessToken = String(rawAccessToken).replace(/[\r\n]+$/g, "").trim();
    const expiresIn = longTokenData.expires_in ?? 3600;
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // PASSO 2.5: Backend descobre WABA ID e Phone Number ID via API
    // Frontend pode ter chegado com undefined por race condition — backend resolve isso
    console.log("🔍 [AUTH] Passo 2.5: auto-descoberta de WABA e Phone Number via API Meta...");
    const discovered = await discoverWabaAndPhone(accessToken);

    console.log("📋 [AUTH] Auto-descoberta concluída:", {
      waba_id: discovered.waba_id ?? "(não encontrado)",
      phone_number_id: discovered.phone_number_id ?? "(não encontrado)",
      display_phone_number: discovered.display_phone_number ?? "(não encontrado)",
    });

    // Backend tem prioridade; frontend é fallback
    const finalWabaId = discovered.waba_id ?? frontendWabaId ?? null;
    let finalPhoneNumberId = discovered.phone_number_id ?? frontendPhoneNumberId ?? null;
    let finalDisplayPhone = discovered.display_phone_number;

    console.log("📋 [AUTH] IDs finais após mesclagem:", {
      waba_id: finalWabaId ?? "(ausente)",
      phone_number_id: finalPhoneNumberId ?? "(ausente)",
      fonte_waba: discovered.waba_id ? "backend" : frontendWabaId ? "frontend" : "nenhuma",
      fonte_phone: discovered.phone_number_id ? "backend" : frontendPhoneNumberId ? "frontend" : "nenhuma",
    });

    // Último recurso: se ainda sem phone_number_id, tentar via waba_id do frontend
    if (!finalPhoneNumberId && frontendWabaId) {
      console.log("🔍 [AUTH] Último recurso: buscando phone number via waba_id do frontend:", frontendWabaId);
      try {
        const resp = await fetch(
          `https://graph.facebook.com/v21.0/${frontendWabaId}/phone_numbers?access_token=${accessToken}`
        );
        const data = await resp.json();
        console.log("🔍 [AUTH] phone_numbers via waba_id do frontend:", JSON.stringify(data));
        if (data?.data?.length > 0) {
          finalPhoneNumberId = data.data[0].id;
          finalDisplayPhone = data.data[0].display_phone_number ?? null;
          console.log("✅ [AUTH] Phone Number ID obtido via waba_id do frontend:", finalPhoneNumberId);
        }
      } catch (err) {
        console.warn("⚠️ [AUTH] Erro ao buscar phone number via waba_id do frontend:", err);
      }
    }

    // PASSO 3: Validar token para o phone_number_id antes de persistir
    if (finalPhoneNumberId) {
      console.log("✅ [AUTH] Passo 3: validando token para phone_number_id:", finalPhoneNumberId);
      const validationResp = await fetch(
        `https://graph.facebook.com/v21.0/${finalPhoneNumberId}?fields=id&access_token=${accessToken}`
      );
      const validationData = await validationResp.json();
      if (!validationResp.ok || validationData?.error) {
        console.error("❌ [AUTH] Token inválido para phone_number_id", {
          status: validationResp.status,
          phone_number_id: finalPhoneNumberId,
          detail: validationData,
        });
        return new Response(
          JSON.stringify({ error: "Token inválido para o número conectado", detail: validationData }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log("✅ [AUTH] Token validado com sucesso");
    } else {
      console.warn("⚠️ [AUTH] Passo 3: phone_number_id ausente, validação de token pulada");
    }

    // PASSO 4: Salvar token em meta_connections
    console.log("💾 [AUTH] Passo 4: salvando em meta_connections para id_cliente:", id_cliente);
    const { error: connError } = await supabase.from("meta_connections").upsert(
      {
        id_cliente,
        access_token: accessToken,
        expires_at: expiresAt,
        needs_reauth: false,
        refresh_error: null,
        last_refresh_at: new Date().toISOString(),
      },
      { onConflict: "id_cliente" }
    );

    if (connError) {
      console.error("❌ [AUTH] Erro ao salvar meta_connections:", JSON.stringify(connError));
    } else {
      console.log("✅ [AUTH] meta_connections salvo com sucesso");
    }

    // PASSO 5: Salvar phone_number_id, waba_id e display_phone_number em wa_numbers
    if (finalPhoneNumberId) {
      console.log("💾 [AUTH] Passo 5: salvando em wa_numbers...");

      // Buscar display_phone_number se ainda não temos
      if (!finalDisplayPhone) {
        try {
          const phoneResp = await fetch(
            `https://graph.facebook.com/v21.0/${finalPhoneNumberId}?fields=display_phone_number&access_token=${accessToken}`
          );
          const phoneData = await phoneResp.json();
          console.log("🔍 [AUTH] display_phone_number response:", JSON.stringify(phoneData));
          finalDisplayPhone = phoneData?.display_phone_number ?? null;
        } catch (err) {
          console.warn("⚠️ [AUTH] Erro ao buscar display_phone_number:", err);
        }
      }

      const { error: waError } = await supabase.from("wa_numbers").upsert(
        {
          phone_number_id: finalPhoneNumberId,
          id_cliente,
          display_phone_number: finalDisplayPhone ?? null,
          waba_id: finalWabaId ?? null, // persiste waba_id para uso futuro (subscribed_apps, etc.)
        },
        { onConflict: "phone_number_id" }
      );

      if (waError) {
        console.error("❌ [AUTH] Erro ao salvar wa_numbers:", JSON.stringify(waError));
      } else {
        console.log("✅ [AUTH] wa_numbers salvo com sucesso:", {
          phone_number_id: finalPhoneNumberId,
          display_phone_number: finalDisplayPhone,
          waba_id: finalWabaId,
        });
      }
    } else {
      console.warn("⚠️ [AUTH] Passo 5: phone_number_id ausente, wa_numbers não atualizado");
    }

    // PASSO 6: Inscrever webhook (subscribed_apps)
    // Usa finalWabaId (descoberto pelo backend) — não depende mais do frontend
    if (finalPhoneNumberId && accessToken) {
      console.log("🔔 [AUTH] Passo 6: inscrevendo webhook...");

      // Método A: via WABA ID (recomendado para Tech Provider)
      if (finalWabaId) {
        try {
          const checkResp = await fetch(
            `https://graph.facebook.com/v21.0/${finalWabaId}/subscribed_apps`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          const checkData = await checkResp.json();
          console.log("🔔 [AUTH] subscribed_apps atual (WABA):", JSON.stringify(checkData));

          const isSubscribed = checkData.data?.some(
            (app: { id: string; subscribed_fields?: string[] }) =>
              (app.id === META_APP_ID || app.id === String(META_APP_ID)) &&
              app.subscribed_fields?.includes("messages")
          );

          if (isSubscribed) {
            console.log("✅ [AUTH] App já inscrito no WABA ID");
          } else {
            const subResp = await fetch(
              `https://graph.facebook.com/v21.0/${finalWabaId}/subscribed_apps`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ subscribed_fields: ["messages"] }),
              }
            );
            const subData = await subResp.json();
            console.log("🔔 [AUTH] Resposta inscrição via WABA:", JSON.stringify(subData));
            if (subData.success) {
              console.log("✅ [AUTH] Webhook inscrito com sucesso via WABA ID");
            } else {
              console.warn("⚠️ [AUTH] Falha ao inscrever via WABA:", subData.error?.message, "código:", subData.error?.code);
            }
          }
        } catch (err) {
          console.warn("⚠️ [AUTH] Erro ao inscrever via WABA ID:", err);
        }
      } else {
        console.warn("⚠️ [AUTH] WABA ID ausente — inscrição via WABA pulada");
      }

      // Método B: via Phone Number ID (fallback)
      try {
        const subResp = await fetch(
          `https://graph.facebook.com/v21.0/${finalPhoneNumberId}/subscribed_apps`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ subscribed_fields: ["messages"] }),
          }
        );
        const subData = await subResp.json();
        console.log("🔔 [AUTH] Resposta inscrição via Phone Number ID:", JSON.stringify(subData));
        if (subData.success) {
          console.log("✅ [AUTH] Webhook inscrito via Phone Number ID");
        } else {
          console.warn("⚠️ [AUTH] Falha ao inscrever via Phone Number ID:", subData.error?.message, "código:", subData.error?.code);
        }
      } catch (err) {
        console.warn("⚠️ [AUTH] Erro ao inscrever via Phone Number ID:", err);
      }
    } else {
      console.warn("⚠️ [AUTH] Passo 6: dados insuficientes para inscrever webhook", {
        phone_number_id: !!finalPhoneNumberId,
        access_token: !!accessToken,
      });
    }

    console.log("✅ [AUTH] Fluxo concluído com sucesso");
    return new Response(
      JSON.stringify({
        ok: true,
        phone_number_id: finalPhoneNumberId,
        waba_id: finalWabaId,
        expires_at: expiresAt,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("❌ [AUTH] Erro inesperado:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno", detail: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
