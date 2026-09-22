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
- `GEMINI_API_KEYS` (optionnel, clés autorisées séparées par des virgules)
- `GEMINI_MODELS` (optionnel, modèles de secours séparés par des virgules)
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

CREATE TABLE IF NOT EXISTS agent_memories (
  id SERIAL PRIMARY KEY,
  agent VARCHAR(50) NOT NULL,
  memory TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (agent, memory)
);

CREATE INDEX IF NOT EXISTS idx_agent_memories_agent
  ON agent_memories (agent, updated_at DESC);
```

AprÃ¨s la crÃ©ation de ces tables, l'agent conserve automatiquement les faits durables et utiles issus des conversations. L'extraction est limitÃ©e aux informations explicites et ne permet pas Ã  l'agent de modifier son code ou ses rÃ¨gles.

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
- Garder les clés API dans les variables d’environnement du serveur
