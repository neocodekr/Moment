// Public browser configuration only. Keep provider secrets on the AuthServer.
export const authConfig = {
  baseUrl: 'https://neocode.shop',
  appId: 'com.neocode.moment',
  redirectUri: 'https://www.moment-cut.com/auth/callback/',
  providers: { instagram: 'instagram', tiktok: 'tiktok' },
  firebase: { apiKey: '', authDomain: '', projectId: 'moment-2ec10', appId: '' },
};
