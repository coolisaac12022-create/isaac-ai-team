const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GOOGLE_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

function isConfigured() {
  return Boolean(genAI);
}

async function generateAssistantReply(prompt, context = '') {
  if (!genAI) {
    throw new Error('GOOGLE_API_KEY is not configured');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const fullPrompt = context
    ? `Contexte:\n${context}\n\nQuestion:\n${prompt}`
    : prompt;

  const result = await model.generateContent(fullPrompt);
  return result.response.text();
}

module.exports = {
  isConfigured,
  generateAssistantReply
};
