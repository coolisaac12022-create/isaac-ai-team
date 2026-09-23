const { GoogleGenerativeAI } = require('@google/generative-ai');

// Keep the single-key variables compatible while allowing authorized fallbacks.
const apiKeys = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '')
  .split(',')
  .map((key) => key.trim())
  .filter(Boolean);
const configuredModels = process.env.GEMINI_MODELS || [process.env.GEMINI_MODEL || 'gemini-3.6-flash', 'gemini-2.0-flash'].join(',');
const modelNames = configuredModels
  .split(',')
  .map((model) => model.trim())
  .filter(Boolean);
const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 20000);
const AI_RETRY_DELAYS_MS = [1200, 3000];

function isConfigured() {
  return apiKeys.length > 0;
}

async function generateAssistantReply(prompt, context = '') {
  if (!isConfigured()) {
    throw new Error('GEMINI_API_KEY(S) (or GOOGLE_API_KEY) is not configured');
  }

  const fullPrompt = context
    ? `Contexte:\n${context}\n\nQuestion:\n${prompt}`
    : prompt;

  let lastError;
  for (const apiKey of apiKeys) {
    const genAI = new GoogleGenerativeAI(apiKey);
    for (const modelName of modelNames) {
      for (let attempt = 0; attempt <= AI_RETRY_DELAYS_MS.length; attempt += 1) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await Promise.race([
            model.generateContent(fullPrompt),
            new Promise((_, reject) => {
              setTimeout(() => reject(new Error(`Le service IA n'a pas rÃ©pondu dans les ${AI_TIMEOUT_MS / 1000} secondes.`)), AI_TIMEOUT_MS);
            })
          ]);
          return result.response.text();
        } catch (error) {
          lastError = error;
          const errorText = error instanceof Error ? error.message : String(error);
          const normalizedError = errorText.toLowerCase();
          const isTemporary = errorText.includes('429') || errorText.includes('503') || normalizedError.includes('quota') || normalizedError.includes('service unavailable');
          const isUnavailableModel = errorText.includes('404') && normalizedError.includes('model');
          if (!isTemporary && !isUnavailableModel) {
            throw error;
          }
          if (isUnavailableModel) {
            break;
          }
          if (attempt < AI_RETRY_DELAYS_MS.length) {
            await new Promise((resolve) => setTimeout(resolve, AI_RETRY_DELAYS_MS[attempt]));
          }
        }
      }
    }
  }

  throw lastError;
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
