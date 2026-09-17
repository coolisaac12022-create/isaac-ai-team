const { GoogleGenerativeAI } = require('@google/generative-ai');

// Prefer GEMINI_API_KEY for clarity, fallback to GOOGLE_API_KEY
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

function isConfigured() {
  return Boolean(genAI);
}

async function generateAssistantReply(prompt, context = '') {
  if (!genAI) {
    throw new Error('GEMINI_API_KEY (or GOOGLE_API_KEY) is not configured');
  }

  const model = genAI.getGenerativeModel({ model: modelName });
  const fullPrompt = context
    ? `Contexte:\n${context}\n\nQuestion:\n${prompt}`
    : prompt;

  const result = await model.generateContent(fullPrompt);
  return result.response.text();
}

function extractMemories(agent, userMessage) {
  const text = String(userMessage || '').trim();
  const match = text.match(/(?:je préfère|je prefere|mon objectif est|je veux que tu retiennes|à retenir|a retenir|important pour moi|il faut retenir)\s+(.+)/i);

  if (!match || !match[1]) {
    return [];
  }

  const memory = match[1].trim().replace(/[.!?]+$/, '');
  if (memory.length < 8 || memory.length > 500) {
    return [];
  }

  return [`Pour l'agent ${agent}, l'utilisateur indique : ${memory}.`];
}

module.exports = {
  isConfigured,
  generateAssistantReply,
  extractMemories
};
