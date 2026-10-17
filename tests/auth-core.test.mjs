import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { authorizeUrl, exchangeCode, firebaseCustomToken, pkceChallenge, validPending } from '../assets/auth-core.mjs';

const config = {
  baseUrl: 'https://neocode.shop',
  appId: 'moment-web',
  redirectUri: 'https://www.moment-cut.com/',
  firebase: { projectId: 'moment-project' },
};

test('PKCE S256 matches the RFC 7636 example', async () => {
  const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
  assert.equal(await pkceChallenge(verifier, webcrypto), 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
});

test('authorization URL carries the registered redirect and PKCE challenge', () => {
  const url = new URL(authorizeUrl(config, 'tiktok', 'state123', 'challenge123'));
  assert.equal(url.pathname, '/api/v1/auth/authorize');
  assert.equal(url.searchParams.get('appId'), config.appId);
  assert.equal(url.searchParams.get('provider'), 'tiktok');
  assert.equal(url.searchParams.get('redirectUri'), config.redirectUri);
  assert.equal(url.searchParams.get('codeChallengeMethod'), 'S256');
  assert.equal(url.searchParams.get('state'), 'state123');
});

test('authorization code is exchanged with the matching verifier', async () => {
  const calls = [];
  const fetchApi = async (url, options) => {
    calls.push({ url: String(url), options });
    return { ok: true, json: async () => ({ accessToken: 'auth-access' }) };
  };
  assert.equal(await exchangeCode(fetchApi, config, 'one-time-code', 'verifier'), 'auth-access');
  assert.equal(calls[0].url, 'https://neocode.shop/api/v1/auth/token');
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    appId: config.appId, code: 'one-time-code', codeVerifier: 'verifier',
  });
});

test('AuthServer access token requests a Firebase custom token with an empty body', async () => {
  const calls = [];
  const fetchApi = async (url, options) => {
    calls.push({ url: String(url), options });
    return { ok: true, json: async () => ({ customToken: 'firebase-token', projectId: 'moment-project' }) };
  };
  assert.equal(await firebaseCustomToken(fetchApi, config, 'auth-access'), 'firebase-token');
  assert.equal(calls[0].url, 'https://neocode.shop/api/v1/auth/firebase/custom-token');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer auth-access');
  assert.equal(calls[0].options.body, undefined);
});

test('a custom token from another Firebase project is rejected', async () => {
  const fetchApi = async () => ({ ok: true, json: async () => ({ customToken: 'token', projectId: 'other' }) });
  await assert.rejects(firebaseCustomToken(fetchApi, config, 'auth-access'), /project mismatch/);
});

test('callback state must match and be less than ten minutes old', () => {
  const readyConfig = { ...config, providers: { instagram: 'instagram' },
    firebase: { apiKey: 'public-key', authDomain: 'example.firebaseapp.com',
      projectId: 'moment-project', appId: 'web-app' } };
  const pending = { state: 'expected', codeVerifier: 'verifier', provider: 'instagram', createdAt: 1000 };
  assert.equal(validPending(readyConfig, pending, 'expected', 2000), true);
  assert.equal(validPending(readyConfig, pending, 'other', 2000), false);
  assert.equal(validPending(readyConfig, pending, 'expected', 601001), false);
});
