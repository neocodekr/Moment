import { authConfig } from './auth-config.mjs';
import { authorizeUrl, exchangeCode, firebaseCustomToken, pkceChallenge, randomUrlSafe } from './auth-core.mjs';

const pendingKey = 'moment.oauth.pending';
const dialog = document.getElementById('loginDialog');
const status = document.getElementById('loginStatus');
const providers = document.querySelector('.loginProviders');
const logoutButton = document.querySelector('[data-auth-logout]');
const socialButtons = document.querySelectorAll('[data-login-provider]');
let firebasePromise;
let authStateListening = false;

function message(ko, en) {
  return document.documentElement.lang === 'en' ? en : ko;
}

function showStatus(value) {
  if (!dialog.open) dialog.showModal();
  status.textContent = value;
}

function configured(provider) {
  const fb = authConfig.firebase;
  return Boolean(authConfig.appId && authConfig.redirectUri && authConfig.providers[provider] &&
    fb.apiKey && fb.authDomain && fb.projectId && fb.appId);
}

async function firebaseAuth() {
  firebasePromise ??= Promise.all([
    import('https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js'),
  ]).then(([appSdk, authSdk]) => {
    const app = appSdk.initializeApp(authConfig.firebase);
    return { auth: authSdk.getAuth(app), signInWithCustomToken: authSdk.signInWithCustomToken,
      signOut: authSdk.signOut, onAuthStateChanged: authSdk.onAuthStateChanged };
  }).catch(error => {
    firebasePromise = undefined;
    throw error;
  });
  return firebasePromise;
}

function showSignedIn(signedIn) {
  providers.hidden = signedIn;
  logoutButton.hidden = !signedIn;
  if (signedIn) showStatus(message('로그인되었습니다.', 'You are signed in.'));
}

async function startLogin(provider) {
  if (!configured(provider)) {
    showStatus(message('로그인 설정을 확인하고 있습니다.', 'Sign-in setup is not complete.'));
    return;
  }
  const callback = new URL(authConfig.redirectUri);
  if (callback.origin !== location.origin || callback.pathname !== location.pathname) {
    showStatus(message('로그인 콜백 주소가 현재 페이지와 다릅니다.', 'The sign-in callback URL does not match this page.'));
    return;
  }
  const state = randomUrlSafe();
  const codeVerifier = randomUrlSafe();
  const challenge = await pkceChallenge(codeVerifier);
  sessionStorage.setItem(pendingKey, JSON.stringify({ state, codeVerifier, provider, createdAt: Date.now() }));
  location.assign(authorizeUrl(authConfig, authConfig.providers[provider], state, challenge));
}

async function completeLogin() {
  const url = new URL(location.href);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  if (!code && !error) return;

  url.searchParams.delete('code');
  url.searchParams.delete('state');
  url.searchParams.delete('error');
  url.searchParams.delete('error_description');
  history.replaceState(null, '', url);

  const pendingText = sessionStorage.getItem(pendingKey);
  sessionStorage.removeItem(pendingKey);
  if (error || !code || !state || !pendingText) {
    showStatus(message('로그인이 취소되었거나 만료되었습니다.', 'Sign-in was cancelled or expired.'));
    return;
  }
  let pending;
  try { pending = JSON.parse(pendingText); } catch { pending = null; }
  if (!pending || pending.state !== state || Date.now() - pending.createdAt > 10 * 60 * 1000 ||
      !configured(pending.provider)) {
    showStatus(message('로그인 요청을 확인할 수 없습니다. 다시 시도해 주세요.', 'Could not verify sign-in. Please try again.'));
    return;
  }

  showStatus(message('로그인을 완료하고 있습니다…', 'Completing sign-in…'));
  try {
    const accessToken = await exchangeCode(fetch, authConfig, code, pending.codeVerifier);
    const customToken = await firebaseCustomToken(fetch, authConfig, accessToken);
    const firebase = await firebaseAuth();
    await firebase.signInWithCustomToken(firebase.auth, customToken);
    showSignedIn(true);
  } catch {
    showStatus(message('로그인을 완료하지 못했습니다. 다시 시도해 주세요.', 'Could not complete sign-in. Please try again.'));
  }
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
  if (!configured('instagram') && !configured('tiktok')) return;
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

completeLogin();
