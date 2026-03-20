import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const VERIFY_TOKEN = Deno.env.get("META_WEBHOOK_VERIFY_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const N8N_WEBHOOK_URL = "https://webhook.dev.usesmartcrm.com/webhook/uazapi";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

serve(async (req) => {
  console.log("🚀 [WEBHOOK] Função chamada - Método:", req.method);
  console.log("🚀 [WEBHOOK] URL:", req.url);
  console.log("🚀 [WEBHOOK] Headers:", Object.fromEntries(req.headers.entries()));

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS") {
    console.log("✅ [WEBHOOK] OPTIONS request - retornando CORS");
    return new Response(null, { headers: corsHeaders });
  }

  // Endpoint de teste
  const url = new URL(req.url);
  if (url.searchParams.get("test") === "true") {
    console.log("🧪 [WEBHOOK] Requisição de teste recebida");
    return new Response(
      JSON.stringify({
        status: "ok",
        message: "Webhook está funcionando!",
        timestamp: new Date().toISOString(),
        method: req.method,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // GET — verificação da Meta
  if (req.method === "GET") {
    const urlObj = new URL(req.url);
    const mode = urlObj.searchParams.get("hub.mode");
    const token = urlObj.searchParams.get("hub.verify_token");
    const challenge = urlObj.searchParams.get("hub.challenge");

    console.log("🔔 [WEBHOOK] GET recebido - Verificação da Meta:", {
      mode,
      token: token ? `${token.substring(0, 10)}...` : null,
      challenge: challenge ? `${challenge.substring(0, 20)}...` : null,
    });

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("✅ [WEBHOOK] Verificação bem-sucedida, retornando challenge");
      return new Response(challenge, { status: 200 });
    }

    console.log("❌ [WEBHOOK] Verificação falhou - token não corresponde");
    return new Response("Forbidden", { status: 403 });
  }

  // POST — eventos em tempo real
  if (req.method === "POST") {
    try {
      const bodyText = await req.text();
      console.log("📨 [WEBHOOK] POST recebido - Body (texto):", bodyText.substring(0, 500));

      let body;
      try {
        body = JSON.parse(bodyText);
      } catch (parseError) {
        console.error("❌ [WEBHOOK] Erro ao parsear JSON:", parseError);
        return new Response("OK", { status: 200, headers: corsHeaders });
      }

      console.log("📨 [WEBHOOK] POST recebido - Body completo:", JSON.stringify(body, null, 2));

      const entries = body?.entry ?? [];
      console.log(`📦 [WEBHOOK] Processando ${entries.length} entrada(s)`);

      for (const entry of entries) {
        for (const change of entry.changes ?? []) {
          const value = change.value;

          let phoneNumberId = value?.metadata?.phone_number_id;
          if (!phoneNumberId) phoneNumberId = value?.phone_number_id;
          if (!phoneNumberId) phoneNumberId = change.value?.phone_number_id;
          if (!phoneNumberId && entry.id) phoneNumberId = entry.id;

          console.log("📱 [WEBHOOK] Phone Number ID encontrado:", phoneNumberId);

          if (!phoneNumberId) {
            console.log("⚠️ [WEBHOOK] Phone Number ID não encontrado, pulando...");
            continue;
          }

          // Buscar id_cliente pelo phone_number_id
          const { data: waNumber, error: waError } = await supabase
            .from("wa_numbers")
            .select("id_cliente")
            .eq("phone_number_id", phoneNumberId)
            .single();

          if (waError) {
            console.error("❌ [WEBHOOK] Erro ao buscar wa_number:", waError);
          }

          if (!waNumber?.id_cliente) {
            console.log(`⚠️ [WEBHOOK] Cliente não encontrado para phone_number_id: ${phoneNumberId}`);
            continue;
          }

          const idCliente = waNumber.id_cliente;
          console.log(`✅ [WEBHOOK] Cliente encontrado: id_cliente=${idCliente}`);

          // Repassar mensagens para o n8n
          const messages = value?.messages ?? [];
          console.log(`💬 [WEBHOOK] Processando ${messages.length} mensagem(ns)`);

          for (const msg of messages) {
            const normalizedPhone = String(msg?.from ?? "").replace(/\D/g, "");
            const payload = {
              // Campos legados (mantidos para compatibilidade com o fluxo atual do n8n)
              phone: normalizedPhone || msg.from,
              telefone: normalizedPhone || msg.from,
              telefone_id: normalizedPhone || msg.from,
              message: msg.text?.body ?? "[mídia]",
              id_cliente: idCliente,
              fromMe: false,
              instance_id: phoneNumberId,
              source: "meta_cloud_api",
              // Novos campos para estrutura unificada (sem distinção visual no front)
              canal: "meta_oficial",
              meta_phone_number_id: phoneNumberId,
              meta_waba_id: entry?.id ?? null,
              meta_message_id: msg?.id ?? null,
              meta_status: null,
              payload_raw: {
                entry_id: entry?.id ?? null,
                field: change?.field ?? null,
                metadata: value?.metadata ?? null,
                contacts: value?.contacts ?? [],
                message: msg,
              },
            };

            console.log("📤 [WEBHOOK] Repassando para n8n:", JSON.stringify(payload));

            try {
              const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });
              console.log(`✅ [WEBHOOK] n8n respondeu com status ${n8nResponse.status}`);
            } catch (n8nError) {
              console.error("❌ [WEBHOOK] Erro ao repassar para n8n:", n8nError);
            }
          }

          // Processar atualizações de status
          const statuses = value?.statuses ?? [];
          console.log(`📊 [WEBHOOK] Processando ${statuses.length} atualização(ões) de status`);

          for (const status of statuses) {
            console.log(`📊 [WEBHOOK] Status recebido:`, {
              id_mensagem: status.id,
              status: status.status,
            });

            // Repassa status para o mesmo fluxo n8n para permitir update em meta_status/meta_message_id.
            const statusPayload = {
              id_cliente: idCliente,
              fromMe: true,
              instance_id: phoneNumberId,
              source: "meta_cloud_api_status",
              canal: "meta_oficial",
              meta_phone_number_id: phoneNumberId,
              meta_waba_id: entry?.id ?? null,
              meta_message_id: status?.id ?? null,
              meta_status: status?.status ?? null,
              payload_raw: {
                entry_id: entry?.id ?? null,
                field: change?.field ?? null,
                metadata: value?.metadata ?? null,
                status,
              },
            };

            try {
              const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(statusPayload),
              });
              console.log(`✅ [WEBHOOK] Status repassado ao n8n com status ${n8nResponse.status}`);
            } catch (n8nError) {
              console.error("❌ [WEBHOOK] Erro ao repassar status para n8n:", n8nError);
            }
          }
        }
      }

      console.log("✅ [WEBHOOK] Processamento concluído com sucesso");
      return new Response("OK", { status: 200, headers: corsHeaders });
    } catch (err) {
      console.error("❌ [WEBHOOK] Erro no webhook:", err);
      console.error("❌ [WEBHOOK] Stack trace:", err instanceof Error ? err.stack : "N/A");
      // Sempre retorna 200 para a Meta não reenviar
      return new Response("OK", { status: 200, headers: corsHeaders });
    }
  }

  console.log(`⚠️ [WEBHOOK] Método não permitido: ${req.method}`);
  return new Response("Method Not Allowed", { status: 405 });
});
