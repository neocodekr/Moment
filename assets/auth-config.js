// Public browser configuration only. Keep provider secrets on the AuthServer.
export const authConfig = {
  baseUrl: 'https://neocode.shop',
  appId: 'com.neocode.moment',
  redirectUri: 'https://www.moment-cut.com/auth/callback/',
  providers: { instagram: 'instagram', tiktok: 'tiktok' },
  firebase: {
    apiKey: 'AIzaSyA5sL863gIZtC-IM6UQwYvyyxqfhB_bIjw',
    authDomain: 'moment-2ec10.firebaseapp.com',
    projectId: 'moment-2ec10',
    appId: '1:684222458520:web:53b7a5fe7842f15e22feed',
  },
};
