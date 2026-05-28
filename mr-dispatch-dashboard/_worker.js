// MR Dispatch — Worker : sert le dashboard + gère /data (lecture) et /push (écriture n8n)
const SECRET = "MR_DISPATCH_2026"; // clé secrète : à changer et à reporter dans n8n

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS pour toutes les réponses API
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
        return new Response(JSON.stringify({ ok: false, error: "Clé secrète invalide" }), {
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

    // Sinon → sert les fichiers statiques (le dashboard)
    return env.ASSETS.fetch(request);
  },
};
