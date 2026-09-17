const DEFAULT_SITE_URL = 'https://sport-analytics-zhy3.onrender.com';
const CACHE_DURATION_MS = 15 * 60 * 1000;

let cachedSiteContext = null;
let cachedAt = 0;

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

async function getSiteContext() {
  const siteUrl = process.env.SITE_URL || DEFAULT_SITE_URL;
  if (cachedSiteContext && Date.now() - cachedAt < CACHE_DURATION_MS) {
    return cachedSiteContext;
  }

  const response = await fetch(siteUrl, {
    headers: { 'User-Agent': 'Isaac-AI-Team-Marketing/1.0' },
    signal: AbortSignal.timeout(8000)
  });

  if (!response.ok) {
    throw new Error(`Site marketing inaccessible (${response.status})`);
  }

  const html = await response.text();
  const text = stripHtml(html).slice(0, 12000);
  cachedSiteContext = `Source publique: ${siteUrl}\nContenu du site: ${text}`;
  cachedAt = Date.now();
  return cachedSiteContext;
}

function isMarketingAgent(agentId) {
  return String(agentId || '').trim().toLowerCase() === 'marketing';
}

module.exports = {
  getSiteContext,
  isMarketingAgent
};
