export function base64Url(bytes) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function randomUrlSafe(byteCount = 32, cryptoApi = globalThis.crypto) {
  return base64Url(cryptoApi.getRandomValues(new Uint8Array(byteCount)));
}

export async function pkceChallenge(verifier, cryptoApi = globalThis.crypto) {
  const digest = await cryptoApi.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64Url(new Uint8Array(digest));
}

export function authorizeUrl(config, provider, state, challenge) {
  const url = new URL('/api/v1/auth/authorize', config.baseUrl);
  url.search = new URLSearchParams({
    appId: config.appId,
    provider,
    redirectUri: config.redirectUri,
    codeChallenge: challenge,
    codeChallengeMethod: 'S256',
    state,
  }).toString();
  return url.toString();
}

async function jsonResponse(response) {
  if (!response.ok) throw new Error(`AuthServer HTTP ${response.status}`);
  return response.json();
}

export async function exchangeCode(fetchApi, config, code, codeVerifier) {
  const response = await fetchApi(new URL('/api/v1/auth/token', config.baseUrl), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ appId: config.appId, code, codeVerifier }),
  });
  const result = await jsonResponse(response);
  if (typeof result.accessToken !== 'string' || !result.accessToken) {
    throw new Error('AuthServer response has no accessToken');
  }
  return result.accessToken;
}

export async function firebaseCustomToken(fetchApi, config, accessToken) {
  const response = await fetchApi(new URL('/api/v1/auth/firebase/custom-token', config.baseUrl), {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
  });
  const result = await jsonResponse(response);
  if (typeof result.customToken !== 'string' || !result.customToken) {
    throw new Error('AuthServer response has no customToken');
  }
  if (result.projectId !== config.firebase.projectId) {
    throw new Error('Firebase project mismatch');
  }
  return result.customToken;
}
