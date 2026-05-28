# MR Dispatch Dashboard

Tableau de bord temps réel pour la dispatch de **Établissement PEREZ** — suivi des interventions, des techniciens, des RDV, de la finance et des analyses, avec actions directes (prendre / clôturer / annuler / réassigner / confirmer RDV / note) et relances WhatsApp.

Le dashboard est un **fichier statique unique** (`index.html`). Il lit ses données et déclenche ses actions via **3 webhooks n8n** qui parlent au Google Sheet et à Whapi.

---

## Aperçu

- **6 pages** (menu latéral) : Dispatch · Techniciens · Pings & Dispatch · RDV & Suivi · Finance · Analyse
- **KPI cliquables**, alertes automatiques (annulations en série, attentes longues, validations bloquées)
- **Actions** depuis le dashboard → écrivent dans le Sheet via n8n
- **Relances WhatsApp** → envoyées via n8n + Whapi
- **Analyses** : évolution multi-jours, clients récurrents, doublons, par ligne d'appel
- **Responsive** desktop + mobile
- Fonctionne en **mode aperçu** (données d'exemple) tant qu'aucune URL n'est branchée

---

## Mise en route rapide

1. **Publier le dashboard** sur GitHub Pages (voir `docs/INSTALLATION.md`)
2. **Importer les 3 workflows** depuis `n8n/` dans votre n8n Cloud
3. **Renseigner** dans n8n : credential Google Sheets, token Whapi, clé secrète
4. **Activer** les workflows et copier leurs URLs
5. **Coller les URLs** dans la barre du dashboard + la clé secrète, puis **Connecter**

Les réglages (URLs, clé, fréquence) sont mémorisés dans votre navigateur — **rien de sensible n'est stocké dans le code** (important car le repo est public).

---

## Structure

```
mr-dispatch-dashboard/
├── index.html                  Le dashboard (à publier sur GitHub Pages)
├── README.md
├── docs/
│   └── INSTALLATION.md         Guide pas à pas complet
└── n8n/
    ├── workflow-lecture.json   Webhook GET  → alimente le dashboard
    ├── workflow-actions.json   Webhook POST → écrit dans le Sheet
    └── workflow-relance.json   Webhook POST → envoie via Whapi
```

---

## Sécurité (repo public)

- Aucune URL de webhook ni token n'est écrit dans `index.html`.
- Les workflows d'**action** et de **relance** exigent une **clé secrète** : changez `CHANGER_CETTE_CLE_SECRETE` dans les deux JSON avant import, et saisissez la même clé dans le dashboard.
- ⚠️ **Token Whapi** : pensez à le régénérer dans le panel Whapi (il avait été exposé) et reportez le nouveau dans `workflow-relance.json`.

---

## Format de données attendu

Le webhook de lecture renvoie :

```json
{
  "interventions": [ { "inter_id": "...", "statut": "...", "...": "..." } ],
  "techniciens":   [ { "Nom du partenaire": "...", "Group id": "...", "...": "..." } ],
  "suivi": []
}
```

Les clés correspondent **exactement** aux en-têtes de vos pages Google Sheets.
