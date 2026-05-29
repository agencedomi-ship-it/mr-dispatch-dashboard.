// MR Dispatch — Worker
// Routes :
//   GET  /         -> sert le dashboard (index.html)
//   GET  /data     -> renvoie les données stockées dans le KV
//   POST /push     -> reçoit les données de n8n et les stocke dans le KV
//   POST /relance  -> transmet une relance au webhook n8n
//   POST /action   -> transmet une action (assigner / réassigner / note) au webhook n8n
//   *              -> sert les autres fichiers statiques

const SECRET = "MR_DISPATCH_2026";

const RELANCE_WEBHOOK_URL = "https://mrdispatch.app.n8n.cloud/webhook/dashboard-relance";
const ACTION_WEBHOOK_URL  = "https://mrdispatch.app.n8n.cloud/webhook/dashboard-action";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

async function relayToWebhook(webhookUrl, body) {
  try {
    const r = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) return jsonResponse({ ok: false, error: "Erreur n8n: " + r.status }, 502);
    return jsonResponse({ ok: true });
  } catch (e) {
    return jsonResponse({ ok: false, error: "Erreur reseau: " + e.message }, 502);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Préflight CORS pour tous les endpoints API
    if (method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }

    // GET /data — lecture des données par le dashboard
    if (path === "/data" && method === "GET") {
      const data = await env.DISPATCH_KV.get("dispatch_data");
      return new Response(data || '{"interventions":[],"techniciens":[],"suivi":[]}', {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // POST /push — écriture par n8n
    if (path === "/push" && method === "POST") {
      let body;
      try { body = await request.json(); }
      catch (e) { return jsonResponse({ ok: false, error: "JSON invalide" }, 400); }
      if (body.secret !== SECRET) return jsonResponse({ ok: false, error: "Cle invalide" }, 401);
      const payload = {
        interventions: body.interventions || [],
        techniciens:   body.techniciens   || [],
        suivi:         body.suivi         || [],
        updated_at:    new Date().toISOString(),
      };
      await env.DISPATCH_KV.put("dispatch_data", JSON.stringify(payload));
      return jsonResponse({ ok: true, count: payload.interventions.length });
    }

    // POST /relance — relance WhatsApp depuis le dashboard
    if (path === "/relance" && method === "POST") {
      let body;
      try { body = await request.json(); }
      catch (e) { return jsonResponse({ ok: false, error: "JSON invalide" }, 400); }
      if (body.secret !== SECRET) return jsonResponse({ ok: false, error: "Cle invalide" }, 401);
      return relayToWebhook(RELANCE_WEBHOOK_URL, body);
    }

    // POST /action — action (assigner / reassigner / note) depuis le dashboard
    if (path === "/action" && method === "POST") {
      let body;
      try { body = await request.json(); }
      catch (e) { return jsonResponse({ ok: false, error: "JSON invalide" }, 400); }
      if (body.secret !== SECRET) return jsonResponse({ ok: false, error: "Cle invalide" }, 401);
      return relayToWebhook(ACTION_WEBHOOK_URL, body);
    }

    // Fallback : sert le dashboard et les autres fichiers statiques
    return env.ASSETS.fetch(request);
  },
};
