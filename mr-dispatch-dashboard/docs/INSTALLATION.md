# Guide d'installation — MR Dispatch Dashboard

Ce guide vous accompagne de zéro jusqu'au dashboard en direct. Comptez ~30 min.

---

## Partie 1 — Publier le dashboard sur GitHub Pages

1. Créez un repo GitHub (public) — par ex. `mr-dispatch-dashboard`.
2. Poussez tout le contenu de ce dossier dedans (dont `index.html` à la racine).
3. Sur GitHub : **Settings → Pages**.
4. **Source** : `Deploy from a branch`. **Branch** : `main` / `(root)`. Cliquez **Save**.
5. Patientez 1-2 min. Votre dashboard sera à :
   `https://VOTRE-PSEUDO.github.io/mr-dispatch-dashboard/`
6. Ouvrez cette URL : le dashboard s'affiche en **mode aperçu** (données d'exemple). C'est normal — on branche les données ensuite.

> Astuce : ajoutez cette URL à l'écran d'accueil de votre téléphone pour un accès type appli.

---

## Partie 2 — Importer les workflows dans n8n

Pour chacun des 3 fichiers de `n8n/` :

1. Dans n8n : **Workflows → ... → Import from File** (ou collez le JSON).
2. Importez `workflow-lecture.json`, `workflow-actions.json`, `workflow-relance.json`.

### 2.1 — Brancher le credential Google Sheets

Dans **chaque** workflow, ouvrez les nœuds Google Sheets et remplacez le credential
`REMPLACER_PAR_VOTRE_CREDENTIAL_GOOGLE` par votre compte Google Sheets connecté.

Le `documentId` est déjà réglé sur votre Sheet
(`1skUdxGg9j9pHwj2Cx2gX5AiJGHRVeRFF9WR_ZEPTgZw`). Vérifiez que les onglets
s'appellent bien **Interventions** et **Techniciens**.

### 2.2 — Définir la clé secrète

Dans `workflow-actions.json` et `workflow-relance.json`, nœud **« Vérifier clé secrète »**,
remplacez `CHANGER_CETTE_CLE_SECRETE` par une vraie clé (ex. une longue chaîne aléatoire).
Notez-la : vous la saisirez dans le dashboard.

### 2.3 — Token Whapi (workflow relance)

Dans `workflow-relance.json`, nœud **« Envoyer Whapi »**, remplacez
`VOTRE_TOKEN_WHAPI` par votre token Whapi (de préférence un **token régénéré**).

> Vérifiez l'endpoint Whapi d'envoi de texte (`/messages/text`) selon votre version d'API.

---

## Partie 3 — Activer et récupérer les URLs

1. **Activez** les 3 workflows (toggle en haut à droite).
2. Sur chaque nœud Webhook, copiez l'**URL de production** :
   - Lecture : `https://VOTRE-N8N/webhook/dashboard-data`
   - Actions : `https://VOTRE-N8N/webhook/dashboard-action`
   - Relance : `https://VOTRE-N8N/webhook/dashboard-relance`

---

## Partie 4 — Connecter le dashboard

1. Ouvrez votre dashboard (URL GitHub Pages).
2. Dans la barre du haut, renseignez :
   - **URL lecture (GET)** → URL du webhook lecture
   - **URL relance (POST)** → URL du webhook relance
   - **URL actions (POST)** → URL du webhook actions
   - **Clé secrète** → la clé définie en 2.2
   - **Fréquence** → 30 s (recommandé)
3. Cliquez **Connecter**.
4. Le bandeau passe à **« En direct »** et vos vraies interventions s'affichent.

Vos réglages sont mémorisés : au prochain chargement, la connexion se fait automatiquement.

---

## Dépannage

**« Erreur de connexion / CORS »**
→ Le webhook lecture doit renvoyer l'en-tête `Access-Control-Allow-Origin: *`
(déjà configuré dans le nœud « Répondre au Dashboard »). Vérifiez que le workflow est **actif**.

**Le dashboard reste en aperçu**
→ URL lecture vide ou incorrecte, ou workflow inactif. Testez l'URL dans le navigateur :
elle doit renvoyer du JSON.

**Action « 401 / clé invalide »**
→ La clé du dashboard ne correspond pas à celle des workflows. Re-vérifiez les deux.

**Relance n'envoie rien**
→ Vérifiez le token Whapi, l'endpoint, et que les noms de techniciens du Sheet
correspondent (le matching nom → Group id est insensible à la casse).

**Les statuts s'affichent mal**
→ Le dashboard reconnaît : `en_attente`, `en_validation`, `attribuee`, `rdv`,
`terminee`, `annulee`. Si vous utilisez d'autres libellés, dites-le pour les ajouter.

---

## Rappels de sécurité

- Repo **public** : ne mettez jamais de token ni d'URL sensible dans `index.html`.
- Changez la **clé secrète** et **régénérez le token Whapi**.
- Les webhooks d'action/relance modifient vos données réelles : testez d'abord
  sur une intervention de test.
