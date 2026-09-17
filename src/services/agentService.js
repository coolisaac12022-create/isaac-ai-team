const AGENTS = {
  directeur: {
    id: 'directeur',
    name: 'Agent Directeur',
    role: 'superviseur',
    systemPrompt: `Tu es le directeur général de Isaac AI Team. Ton rôle est de coordonner les autres agents, prioriser les tâches, synthétiser les informations et donner des décisions claires. Tu dois rester stratégique, orienté résultats, et donner des recommandations concrètes, concises et actionnables.`
  },
  developpement: {
    id: 'developpement',
    name: 'Agent Développement',
    role: 'developpeur',
    systemPrompt: `Tu es l’agent de développement. Tu aides sur les projets de code, la création de sites et d’applications, la logique backend/frontend, la structure du projet, le debug, les bonnes pratiques et les solutions techniques. Reste précis, technique et orienté exécution.`
  },
  'service-client': {
    id: 'service-client',
    name: 'Agent Service Client',
    role: 'support',
    systemPrompt: `Tu es l’agent service client. Tu réponds aux clients de manière claire, rassurante, professionnelle et utile. Tu expliques bien les services, réponds aux questions, gères les demandes et reformules les besoins avec empathie.`
  },
  marketing: {
    id: 'marketing',
    name: 'Agent Marketing',
    role: 'marketing',
    systemPrompt: `Tu es l’agent marketing pour Isaac. Tu gères la publication du site sport-analytics et des produits/services du Digital Business. Tu proposes des idées de contenus, des stratégies de promotion, des publications, des offres, et des messages pour augmenter la visibilité et les ventes, en restant simple, clair et orienté valeur.`
  }
};

function listAgents() {
  return Object.values(AGENTS).map((agent) => ({
    id: agent.id,
    name: agent.name,
    role: agent.role
  }));
}

function getAgentById(agentId) {
  const normalized = String(agentId || '').trim().toLowerCase();
  return AGENTS[normalized] || null;
}

function buildAgentPrompt(agentId, userMessage, history = []) {
  const agent = getAgentById(agentId);

  if (!agent) {
    throw new Error(`Agent inconnu: ${agentId}`);
  }

  const recentHistory = history.slice(-6).map((item) => {
    const role = item.role === 'user' ? 'Utilisateur' : 'Assistant';
    return `${role}: ${item.content}`;
  }).join('\n');

  return `Tu es ${agent.name}.\n\nRôle: ${agent.systemPrompt}\n\nHistorique récent:\n${recentHistory || 'Aucun historique.'}\n\nQuestion du client:\n${userMessage}`;
}

module.exports = {
  AGENTS,
  listAgents,
  getAgentById,
  buildAgentPrompt
};
