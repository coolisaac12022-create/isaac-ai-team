# isaac-ai-team

Application Node.js + Express avec agents IA spécialisés.

## Variables d'environnement

Créez un fichier `.env` à partir de `.env.example` et remplissez les valeurs réelles.

```bash
cp .env.example .env
```

Variables attendues :
- `PORT`
- `DATABASE_URL`
- `GEMINI_API_KEY`
- `JWT_SECRET`
- `APP_PASSWORD`

## Base de données Neon

Exécutez le script SQL suivant dans l’éditeur SQL Neon pour créer la table de messages :

```sql
CREATE TABLE IF NOT EXISTS agent_messages (
  id SERIAL PRIMARY KEY,
  agent VARCHAR(50) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_messages_agent_created_at
  ON agent_messages (agent, created_at DESC);
```

## Lancement local

```bash
npm install
node src/server.js
```

## Déploiement Bonto

1. Pousser le dépôt GitHub.
2. Connecter le dépôt sur Bonto.
3. Définir les variables d’environnement dans Bonto.
4. Déployer automatiquement.

## Sécurité

- Ne jamais committer `.env`
- Utiliser un mot de passe fort pour `APP_PASSWORD`
- Garder les clés API dans les variables d’environnement du serveur
