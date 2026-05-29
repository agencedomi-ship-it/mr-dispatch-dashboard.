// MR Dispatch — Worker : sert le dashboard + gère /data (lecture), /push (écriture n8n) et /relance (relances WhatsApp)
const SECRET = "MR_DISPATCH_2026"; // clé secrète : à reporter dans n8n

// URL du webhook n8n qui envoie la relance via Whapi (à mettre à jour avec ta vraie URL n8n)
const RELANCE_WEBHOOK_URL = "https://mrdispatch.app.n8n.cloud/webhook/dashboard-relance";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    // GET /data — le dashboard lit les données
    if (url.pathname === "/data" && request.method === "GET") {
      const data = await env.DISPATCH_KV.get("dispatch_data");
      return new Response(data || '{"interventions":[],"techniciens":[],"suivi":[]}', {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // POST /push — n8n envoie les données du Sheet
    if (url.pathname === "/push" && request.method === "POST") {
      let body;
      try {
        body = await request.json();
      } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: "JSON invalide" }), {
          status: 400, headers: { ...cors, "Content-Type": "application/json" },
        });
      }
      if (body.secret !== SECRET) {
        return new Response(JSON.stringify({ ok: false, error: "Cle secrete invalide" }), {
          status: 401, headers: { ...cors, "Content-Type": "application/json" },
        });
      }
      const payload = {
        interventions: body.interventions || [],
        techniciens: body.techniciens || [],
        suivi: body.suivi || [],
        updated_at: new Date().toISOString(),
      };
      await env.DISPATCH_KV.put("dispatch_data", JSON.stringify(payload));
      return new Response(JSON.stringify({ ok: true, count: payload.interventions.length }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // POST /relance — le dashboard demande d'envoyer une relance WhatsApp à un tech
    if (url.pathname === "/relance" && request.method === "POST") {
      let body;
      try {
        body = await request.json();
      } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: "JSON invalide" }), {
          status: 400, headers: { ...cors, "Content-Type": "application/json" },
        });
      }
      if (body.secret !== SECRET) {
        return new Response(JSON.stringify({ ok: false, error: "Cle secrete invalide" }), {
          status: 401, headers: { ...cors, "Content-Type": "application/json" },
        });
      }
      // Transmet la demande à n8n qui se chargera de l'envoi via Whapi
      try {
        const r = await fetch(RELANCE_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!r.ok) {
          return new Response(JSON.stringify({ ok: false, error: "Erreur n8n: " + r.status }), {
            status: 502, headers: { ...cors, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...cors, "Content-Type": "application/json" },
        });
      } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: "Erreur reseau: " + e.message }), {
          status: 502, headers: { ...cors, "Content-Type": "application/json" },
        });
      }
    }

    // Sinon → sert les fichiers statiques (le dashboard)
    return env.ASSETS.fetch(request);
  },
};
