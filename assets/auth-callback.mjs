import { authConfig } from './auth-config.mjs';
import { exchangeCode, firebaseCustomToken, pendingKey, validPending } from './auth-core.mjs';
import { firebaseAuth } from './firebase-client.mjs';

const status = document.getElementById('callbackStatus');
const english = localStorage.getItem('moment_lang') === 'en';
document.documentElement.lang = english ? 'en' : 'ko';
const message = (ko, en) => english ? en : ko;

async function finish() {
  const callback = new URL(location.href);
  const code = callback.searchParams.get('code');
  const state = callback.searchParams.get('state');
  const error = callback.searchParams.get('error');
  callback.searchParams.delete('code');
  callback.searchParams.delete('state');
  callback.searchParams.delete('error');
  callback.searchParams.delete('error_description');
  history.replaceState(null, '', callback);

  const pendingText = sessionStorage.getItem(pendingKey);
  sessionStorage.removeItem(pendingKey);
  if (error || !code || !state || !pendingText) {
    throw new Error('Missing or rejected authorization response');
  }
  let pending;
  try { pending = JSON.parse(pendingText); } catch { pending = null; }
  if (!validPending(authConfig, pending, state)) {
    throw new Error('Invalid authorization state');
  }

  const accessToken = await exchangeCode(fetch, authConfig, code, pending.codeVerifier);
  const customToken = await firebaseCustomToken(fetch, authConfig, accessToken);
  const firebase = await firebaseAuth();
  await firebase.signInWithCustomToken(firebase.auth, customToken);
  sessionStorage.setItem('moment.oauth.result', 'success');
  location.replace('/');
}

finish().catch(() => {
  status.textContent = message('로그인을 완료하지 못했습니다. 다시 시도해 주세요.',
    'Could not complete sign-in. Please try again.');
});
