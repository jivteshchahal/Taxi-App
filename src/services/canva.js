const CANVA_AUTH_URL = 'https://www.canva.com/oauth2/authorize';
const CANVA_TOKEN_URL = 'https://www.canva.com/oauth2/token';
const API_BASE_URL = 'https://api.canva.com/rest/v1';

function getAuthUrl() {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.CANVA_CLIENT_ID,
    redirect_uri: process.env.CANVA_REDIRECT_URI,
    scope: 'design:read asset:read',
  });
  return `${CANVA_AUTH_URL}?${params.toString()}`;
}

async function exchangeCodeForToken(code) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: process.env.CANVA_REDIRECT_URI,
    client_id: process.env.CANVA_CLIENT_ID,
    client_secret: process.env.CANVA_CLIENT_SECRET,
  });

  const res = await fetch(CANVA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${text}`);
  }

  return res.json();
}

async function fetchDesigns(accessToken) {
  const res = await fetch(`${API_BASE_URL}/designs`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch designs: ${res.status} ${text}`);
  }

  return res.json();
}

module.exports = {
  getAuthUrl,
  exchangeCodeForToken,
  fetchDesigns,
};
