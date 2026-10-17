import { authConfig } from './auth-config.js';
import { authConfigured, authorizeUrl, pendingKey, pkceChallenge, randomUrlSafe } from './auth-core.js';
import { firebaseAuth } from './firebase-client.js';

const dialog = document.getElementById('loginDialog');
const status = document.getElementById('loginStatus');
const providers = document.querySelector('.loginProviders');
const logoutButton = document.querySelector('[data-auth-logout]');
const socialButtons = document.querySelectorAll('[data-login-provider]');
let authStateListening = false;

function message(ko, en) {
  return document.documentElement.lang === 'en' ? en : ko;
}

function showStatus(value) {
  if (!dialog.open) dialog.showModal();
  status.textContent = value;
}

function showSignedIn(signedIn) {
  providers.hidden = signedIn;
  logoutButton.hidden = !signedIn;
  if (signedIn) showStatus(message('로그인되었습니다.', 'You are signed in.'));
}

async function startLogin(provider) {
  if (!authConfigured(authConfig, provider)) {
    showStatus(message('로그인 설정을 확인하고 있습니다.', 'Sign-in setup is not complete.'));
    return;
  }
  const callback = new URL(authConfig.redirectUri);
  if (callback.origin !== location.origin) {
    showStatus(message('로그인 콜백 주소가 현재 페이지와 다릅니다.', 'The sign-in callback URL does not match this page.'));
    return;
  }
  const state = randomUrlSafe();
  const codeVerifier = randomUrlSafe();
  const challenge = await pkceChallenge(codeVerifier);
  sessionStorage.setItem(pendingKey, JSON.stringify({ state, codeVerifier, provider, createdAt: Date.now() }));
  location.assign(authorizeUrl(authConfig, authConfig.providers[provider], state, challenge));
}

socialButtons.forEach(button => button.addEventListener('click', () => {
  const provider = button.dataset.loginProvider;
  if (provider === 'instagram' || provider === 'tiktok') {
    startLogin(provider).catch(() => showStatus(message('로그인을 시작하지 못했습니다.', 'Could not start sign-in.')));
  } else {
    showStatus(message('구글 로그인은 준비 중입니다.', 'Google sign-in is coming soon.'));
  }
}));

document.querySelectorAll('[data-open-login]').forEach(button => button.addEventListener('click', async () => {
  if (!authConfigured(authConfig, 'instagram') && !authConfigured(authConfig, 'tiktok')) return;
  try {
    const firebase = await firebaseAuth();
    if (!authStateListening) {
      firebase.onAuthStateChanged(firebase.auth, user => showSignedIn(Boolean(user)), () => {});
      authStateListening = true;
    }
  } catch { /* OAuth buttons can still start without loading Firebase first. */ }
}));

logoutButton.addEventListener('click', async () => {
  try {
    const firebase = await firebaseAuth();
    await firebase.signOut(firebase.auth);
    showSignedIn(false);
    showStatus(message('로그아웃되었습니다.', 'You are signed out.'));
  } catch {
    showStatus(message('로그아웃에 실패했습니다.', 'Could not sign out.'));
  }
});

if (sessionStorage.getItem('moment.oauth.result') === 'success') {
  sessionStorage.removeItem('moment.oauth.result');
  showSignedIn(true);
}
