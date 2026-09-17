const META_GRAPH_URL = 'https://graph.facebook.com/v22.0';
const GMAIL_API_URL = 'https://gmail.googleapis.com/gmail/v1/users/me';

function getMetaConfig() {
  return {
    token: process.env.META_ACCESS_TOKEN,
    pageId: process.env.META_PAGE_ID
  };
}

function getIntegrationStatus() {
  const meta = getMetaConfig();
  return {
    site: Boolean(process.env.SITE_URL || 'https://sport-analytics-zhy3.onrender.com'),
    facebook: Boolean(meta.token && meta.pageId),
    whatsapp: Boolean(process.env.WHATSAPP_VERIFY_TOKEN && process.env.WHATSAPP_ACCESS_TOKEN),
    gmail: Boolean(process.env.GMAIL_ACCESS_TOKEN),
    internet: true
  };
}

async function fetchMetaPageData() {
  const { token, pageId } = getMetaConfig();
  if (!token || !pageId) {
    return { configured: false, reason: 'META_ACCESS_TOKEN et META_PAGE_ID sont requis.' };
  }

  const fields = 'id,name,about,website,feed.limit(25){message,created_time,permalink_url,comments.limit(25){message,from,created_time}}';
  const response = await fetch(`${META_GRAPH_URL}/${pageId}?fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(token)}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || `Meta API error (${response.status})`);
  }
  return { configured: true, data };
}

async function fetchGmailMessages(query = 'newer_than:30d') {
  const token = process.env.GMAIL_ACCESS_TOKEN;
  if (!token) {
    return { configured: false, reason: 'GMAIL_ACCESS_TOKEN est requis.' };
  }

  const listResponse = await fetch(`${GMAIL_API_URL}/messages?q=${encodeURIComponent(query)}&maxResults=20`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const listData = await listResponse.json();
  if (!listResponse.ok) {
    throw new Error(listData.error?.message || `Gmail API error (${listResponse.status})`);
  }

  const messages = await Promise.all((listData.messages || []).map(async ({ id }) => {
    const response = await fetch(`${GMAIL_API_URL}/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.json();
  }));

  return { configured: true, messages };
}

async function searchInternet(query) {
  const response = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
    headers: { 'User-Agent': 'Isaac-AI-Team-Research/1.0' },
    signal: AbortSignal.timeout(8000)
  });
  const html = await response.text();
  if (!response.ok) {
    throw new Error(`Recherche Internet indisponible (${response.status})`);
  }

  const results = [];
  const pattern = /result__a[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi;
  let match;
  while ((match = pattern.exec(html)) && results.length < 10) {
    results.push({
      url: match[1],
      title: match[2].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim()
    });
  }
  return results;
}

module.exports = {
  getIntegrationStatus,
  fetchMetaPageData,
  fetchGmailMessages,
  searchInternet
};
