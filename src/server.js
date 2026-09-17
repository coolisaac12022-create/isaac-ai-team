require('dotenv').config();
const path = require('path');
const express = require('express');
const { checkDatabaseStatus } = require('./config/db');
const { isConfigured, generateAssistantReply, extractMemories } = require('./services/aiService');
const { listAgents, buildAgentPrompt } = require('./services/agentService');
const { saveMessage, listMessages, listMemories, saveMemory, listLeads, saveLead } = require('./services/messageStore');
const { getSiteContext, isMarketingAgent } = require('./services/siteService');
const { getIntegrationStatus, fetchMetaPageData, fetchGmailMessages, searchInternet } = require('./services/integrationService');
const {
  listUsers,
  createUser,
  loginUser,
  listProjects,
  createProject,
  listTasksForProject,
  createTask,
  findProjectById,
  findUserById
} = require('./services/dataStore');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const APP_PASSWORD = process.env.APP_PASSWORD || '';

function isPasswordEnabled() {
  return Boolean(APP_PASSWORD && APP_PASSWORD.trim());
}

function checkPassword(req) {
  const headerPassword = req.headers['x-app-password'];
  const authHeader = req.headers.authorization || '';
  const bearerPassword = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const bodyPassword = req.body && typeof req.body.password === 'string' ? req.body.password : '';
  const requestPassword = headerPassword || bearerPassword || bodyPassword;

  return !isPasswordEnabled() || requestPassword === APP_PASSWORD;
}

app.use(express.json());
app.use((req, res, next) => {
  const publicRoutes = ['/api/health', '/api/auth/login', '/api/auth/status'];

  if (!isPasswordEnabled() || !req.path.startsWith('/api/') || publicRoutes.includes(req.path)) {
    return next();
  }

  if (checkPassword(req)) {
    return next();
  }

  return res.status(401).json({ error: 'Accès protégé. Mot de passe requis.' });
});
app.use(express.static(path.join(__dirname, '..', 'public'), {
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    }
  }
}));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'chat.html'));
});

app.get('/api/health', async (req, res) => {
  const database = await checkDatabaseStatus();
  res.json({
    status: 'ok',
    service: 'isaac-ai-team',
    database,
    ai: {
      ready: isConfigured(),
      provider: isConfigured() ? 'Google Gemini' : 'not configured'
    }
  });
});

app.get('/api/auth/status', (req, res) => {
  res.json({
    passwordProtected: isPasswordEnabled(),
    message: isPasswordEnabled() ? 'Protection active.' : 'Protection désactivée.'
  });
});

app.post('/api/auth/login', (req, res) => {
  const password = req.body && typeof req.body.password === 'string' ? req.body.password : '';

  if (!isPasswordEnabled()) {
    return res.json({ ok: true, message: 'Protection désactivée.' });
  }

  if (password === APP_PASSWORD) {
    return res.json({ ok: true, message: 'Connexion autorisée.' });
  }

  return res.status(401).json({ ok: false, error: 'Mot de passe incorrect.' });
});

app.get('/api/agents', (req, res) => {
  res.json({ agents: listAgents() });
});

app.get('/api/integrations/status', (req, res) => {
  res.json(getIntegrationStatus());
});

app.get('/api/marketing/meta', async (req, res) => {
  try {
    return res.json(await fetchMetaPageData());
  } catch (error) {
    return res.status(502).json({ error: error.message });
  }
});

app.get('/api/marketing/gmail', async (req, res) => {
  try {
    return res.json(await fetchGmailMessages(req.query.q || 'newer_than:30d'));
  } catch (error) {
    return res.status(502).json({ error: error.message });
  }
});

app.get('/api/marketing/research', async (req, res) => {
  const query = String(req.query.q || '').trim();
  if (!query) {
    return res.status(400).json({ error: 'Le paramètre q est obligatoire.' });
  }

  try {
    return res.json({ query, results: await searchInternet(query) });
  } catch (error) {
    return res.status(502).json({ error: error.message });
  }
});

app.get('/api/leads', async (req, res) => {
  try {
    return res.json({ leads: await listLeads() });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/leads', async (req, res) => {
  try {
    const lead = await saveLead(req.body || {});
    if (!lead) {
      return res.status(400).json({ error: 'email ou profileUrl est requis.' });
    }
    return res.status(201).json({ lead });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/webhooks/whatsapp', (req, res) => {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  if (verifyToken && req.query['hub.verify_token'] === verifyToken) {
    return res.send(req.query['hub.challenge']);
  }
  return res.status(403).send('Forbidden');
});

app.post('/api/webhooks/whatsapp', (req, res) => {
  console.log('WhatsApp webhook received:', JSON.stringify(req.body));
  return res.sendStatus(200);
});

app.get('/api/chat/history', async (req, res) => {
  const { agent } = req.query;
  const messages = await listMessages(agent || 'directeur');
  return res.json({ messages });
});

app.post('/api/chat', async (req, res) => {
  const { agent, message } = req.body || {};

  if (!agent || !message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'agent et message sont requis.' });
  }

  try {
    const history = await listMessages(agent);
    const memories = await listMemories(agent);
    let externalContext = '';
    if (isMarketingAgent(agent)) {
      try {
        externalContext = await getSiteContext();
      } catch (siteError) {
        console.error('Marketing site context skipped:', siteError.message);
      }
    }
    const prompt = buildAgentPrompt(agent, message.trim(), history, memories, externalContext);
    const reply = await generateAssistantReply(prompt, '');

    await saveMessage(agent, 'user', message.trim());
    await saveMessage(agent, 'assistant', reply);

    try {
      const newMemories = extractMemories(agent, message.trim());
      await Promise.all(newMemories.map((memory) => saveMemory(agent, memory)));
    } catch (memoryError) {
      console.error('Agent memory update skipped:', memoryError.message);
    }

    return res.json({ agent, reply });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error('Chat agent error:', errorMessage);

    if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('quota')) {
      const retryMatch = errorMessage.match(/retryDelay[^0-9]*(\d+)/i) || errorMessage.match(/retry in ([0-9.]+)s/i);
      const retryAfter = retryMatch ? Math.max(1, Math.ceil(Number(retryMatch[1]))) : 60;
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({
        error: 'Le quota Gemini est temporairement atteint. Réessayez plus tard ou augmentez le quota API.',
        retryAfter
      });
    }

    return res.status(500).json({
      error: `Erreur Gemini: ${errorMessage}`,
      details: errorMessage
    });
  }
});

app.get('/api/users', (req, res) => {
  res.json(listUsers());
});

app.post('/api/users/register', (req, res) => {
  const { name, email, password, role } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email et password sont obligatoires.' });
  }

  try {
    const user = createUser({ name, email, password, role });
    return res.status(201).json({ message: 'Utilisateur créé', user });
  } catch (error) {
    return res.status(409).json({ error: error.message });
  }
});

app.post('/api/users/login', (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'email et password sont obligatoires.' });
  }

  try {
    const user = loginUser(email, password);
    return res.json({ message: 'Connexion réussie', user });
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }
});

app.get('/api/projects', (req, res) => {
  res.json(listProjects());
});

app.post('/api/projects', (req, res) => {
  const { name, description, ownerId } = req.body || {};

  if (!name || !ownerId) {
    return res.status(400).json({ error: 'name et ownerId sont obligatoires.' });
  }

  const owner = findUserById(ownerId);
  if (!owner) {
    return res.status(404).json({ error: 'Propriétaire introuvable.' });
  }

  const project = createProject({ name, description, ownerId });
  return res.status(201).json({ message: 'Projet créé', project });
});

app.get('/api/projects/:id/tasks', (req, res) => {
  const project = findProjectById(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Projet introuvable.' });
  }

  return res.json(listTasksForProject(req.params.id));
});

app.post('/api/projects/:id/tasks', (req, res) => {
  const project = findProjectById(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Projet introuvable.' });
  }

  const { title, description, status, assignedTo } = req.body || {};
  if (!title) {
    return res.status(400).json({ error: 'title est obligatoire.' });
  }

  const task = createTask({
    projectId: req.params.id,
    title,
    description,
    status,
    assignedTo
  });

  return res.status(201).json({ message: 'Tâche créée', task });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route introuvable', path: req.originalUrl });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`isaac-ai-team demarre sur le port ${PORT}`);
  });
}

module.exports = { app };
