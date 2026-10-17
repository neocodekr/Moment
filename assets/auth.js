import { authConfig } from './auth-config.js';
import { authConfigured, authorizeUrl, pendingKey, pkceChallenge, randomUrlSafe } from './auth-core.js';
import { firebaseAuth } from './firebase-client.js';

const dialog = document.getElementById('loginDialog');
const status = document.getElementById('loginStatus');
const providers = document.querySelector('.loginProviders');
const logoutButton = document.querySelector('[data-auth-logout]');
const socialButtons = document.querySelectorAll('[data-login-provider]');
const accountId = document.querySelector('[data-account-id]');
const brandSubtitle = document.querySelector('[data-brand-subtitle]');
let authStatePromise;

function message(ko, en) {
  return document.documentElement.lang === 'en' ? en : ko;
}

function showStatus(value) {
  if (!dialog.open) dialog.showModal();
  status.textContent = value;
}

function loginId(user) {
  return [user.displayName, user.email, user.uid]
    .find(value => typeof value === 'string' && value.trim())?.trim() || '';
}

function showSignedIn(user) {
  const signedIn = Boolean(user);
  providers.hidden = signedIn;
  logoutButton.hidden = !signedIn;
  brandSubtitle.hidden = signedIn;
  accountId.hidden = !signedIn;
  accountId.textContent = signedIn ? `ID: ${loginId(user)}` : '';
  accountId.title = accountId.textContent;
}

function watchAuthState() {
  authStatePromise ??= firebaseAuth().then(firebase => {
    firebase.onAuthStateChanged(firebase.auth, user => {
      showSignedIn(user);
      if (sessionStorage.getItem('moment.oauth.result') === 'success') {
        sessionStorage.removeItem('moment.oauth.result');
        if (user) showStatus(message('로그인되었습니다.', 'You are signed in.'));
        else showStatus(message('로그인 상태를 확인하지 못했습니다. 다시 시도해 주세요.',
          'Could not confirm sign-in. Please try again.'));
      } else if (user && dialog.open) {
        status.textContent = message('로그인되었습니다.', 'You are signed in.');
      }
    });
    return firebase;
  }).catch(error => {
    authStatePromise = undefined;
    throw error;
  });
  return authStatePromise;
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
  if (provider === 'instagram') {
    startLogin(provider).catch(() => showStatus(message('로그인을 시작하지 못했습니다.', 'Could not start sign-in.')));
  } else if (provider === 'tiktok') {
    showStatus(message('틱톡 로그인은 준비 중입니다.', 'TikTok sign-in is coming soon.'));
  } else {
    showStatus(message('구글 로그인은 준비 중입니다.', 'Google sign-in is coming soon.'));
  }
}));

document.querySelectorAll('[data-open-login]').forEach(button => button.addEventListener('click', async () => {
  if (!authConfigured(authConfig, 'instagram')) return;
  try {
    const firebase = await watchAuthState();
    if (firebase.auth.currentUser) {
      status.textContent = message('로그인되었습니다.', 'You are signed in.');
    }
  } catch { /* OAuth buttons can still start without loading Firebase first. */ }
}));

logoutButton.addEventListener('click', async () => {
  try {
    const firebase = await firebaseAuth();
    await firebase.signOut(firebase.auth);
    showSignedIn(null);
    showStatus(message('로그아웃되었습니다.', 'You are signed out.'));
  } catch {
    showStatus(message('로그아웃에 실패했습니다.', 'Could not sign out.'));
  }
});

if (sessionStorage.getItem('moment.oauth.result') === 'success') {
  watchAuthState().catch(() => {
    sessionStorage.removeItem('moment.oauth.result');
    showStatus(message('로그인 상태를 확인하지 못했습니다. 다시 시도해 주세요.',
      'Could not confirm sign-in. Please try again.'));
  });
} else if ('requestIdleCallback' in window) {
  requestIdleCallback(() => { watchAuthState().catch(() => {}); }, { timeout: 1500 });
} else {
  setTimeout(() => { watchAuthState().catch(() => {}); }, 0);
}
