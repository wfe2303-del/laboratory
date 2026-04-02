(function(){
  var config = window.KakaoCheckConfig;
  var accessToken = null;
  var tokenClient = null;
  var currentUser = null;
  var listeners = [];
  var initPromise = null;
  var initialized = false;

  function notify(){
    listeners.forEach(function(listener){
      try {
        listener({ accessToken: accessToken, user: currentUser });
      } catch (error) {
        console.error(error);
      }
    });
  }

  function onChange(listener){
    listeners.push(listener);
  }

  function waitForGoogleIdentity(timeoutMs, intervalMs){
    return new Promise(function(resolve, reject){
      var startedAt = Date.now();
      function check(){
        if(window.google && google.accounts && google.accounts.oauth2){
          resolve();
          return;
        }
        if(Date.now() - startedAt >= timeoutMs){
          reject(new Error('Google 로그인 스크립트를 불러오지 못했습니다. 새로고침 후 다시 시도하세요.'));
          return;
        }
        setTimeout(check, intervalMs);
      }
      check();
    });
  }

  function init(){
    if(initPromise) return initPromise;
    initPromise = waitForGoogleIdentity(15000, 100).then(function(){
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: config.clientId,
        scope: config.scopes,
        prompt: '',
        login_hint: config.googleLoginHint || undefined,
        hd: config.googleHostedDomainHint || undefined,
        callback: handleTokenResponse,
        error_callback: function(err){
          console.error(err);
          alert('OAuth 오류: ' + (err && (err.error || err.type || JSON.stringify(err))));
        }
      });
      initialized = true;
      return true;
    });
    return initPromise;
  }

  async function handleTokenResponse(response){
    try {
      accessToken = response && response.access_token ? response.access_token : null;
      currentUser = accessToken ? await fetchUserInfo() : null;
      validateUser(currentUser);
      notify();
    } catch (error) {
      accessToken = null;
      currentUser = null;
      notify();
      alert(error.message);
    }
  }

  async function fetchUserInfo(){
    var res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: 'Bearer ' + accessToken }
    });
    if(!res.ok) throw new Error('로그인 사용자 정보를 불러오지 못했습니다.');
    return res.json();
  }

  function validateUser(user){
    var email = String(user && user.email || '').toLowerCase();
    var domain = email.split('@')[1] || '';
    var allowedEmails = config.allowedEmails.map(function(item){ return item.toLowerCase(); });
    if(allowedEmails.length && allowedEmails.indexOf(email) >= 0) return;
    if(config.allowedEmailDomains.indexOf(domain) >= 0) return;
    revoke();
    throw new Error('허용되지 않은 계정입니다. classaround.co.kr 또는 titanz.co.kr 계정으로 로그인하세요.');
  }

  async function login(){
    await init();
    if(!tokenClient) throw new Error('로그인 준비가 아직 끝나지 않았습니다.');
    tokenClient.requestAccessToken({ prompt: 'consent', login_hint: config.googleLoginHint || undefined });
  }

  function revoke(){
    if(accessToken && window.google && google.accounts && google.accounts.oauth2){
      google.accounts.oauth2.revoke(accessToken, function(){});
    }
    accessToken = null;
    currentUser = null;
    notify();
  }

  function requireToken(){
    if(!accessToken) throw new Error('먼저 Google 로그인하세요.');
    return accessToken;
  }

  function getAccessToken(){ return accessToken; }
  function getCurrentUser(){ return currentUser; }
  function isInitialized(){ return initialized; }

  window.KakaoCheckAuth = {
    init: init,
    login: login,
    revoke: revoke,
    onChange: onChange,
    requireToken: requireToken,
    getAccessToken: getAccessToken,
    getCurrentUser: getCurrentUser,
    isInitialized: isInitialized
  };
})();
