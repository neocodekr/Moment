import { authConfig } from './auth-config.js';

let firebasePromise;

export async function firebaseAuth() {
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
