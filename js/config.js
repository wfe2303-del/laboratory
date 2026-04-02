(function(){
  var config = {
    startRow: 2,
    columns: Object.freeze({
      name: 'C',
      phone: 'D',
      status: 'M',
      role: 'N'
    }),
    targetRoleText: '수강생',
    statusText: '입장',
    spreadsheetId: '1qclrbo3_VG-sSNIqMW4j1juzwP3nq_ZaT-y1z6WLafc',
    clientId: '18228268359-iifm4ck3j9kqj74eh1p90tco1k2mbpi0.apps.googleusercontent.com',
    googleLoginHint: '',
    googleHostedDomainHint: '',
    allowedOrigins: Object.freeze([]),
    allowedEmailDomains: Object.freeze([]),
    allowedEmails: Object.freeze([]),
    scopes: [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/spreadsheets'
    ].join(' '),
    assertRuntimeReady: function(){
      return Promise.resolve(true);
    }
  };

  Object.freeze(config.columns);
  Object.freeze(config);
  window.KakaoCheckConfig = config;
})();
