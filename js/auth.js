(function(){
  var config = window.KakaoCheckConfig;
  var accessToken = null;
  var tokenClient = null;
  var currentUser = null;
  var listeners = [];

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

  function init(){
    if(!window.google || !google.accounts || !google.accounts.oauth2){
      throw new Error('Google Identity Services 로드에 실패했습니다.');
    }
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: config.clientId,
      scope: config.scopes,
      prompt: '',
      callback: handleTokenResponse,
      error_callback: function(err){
        throw new Error('OAuth 오류: ' + (err && (err.error || err.type || JSON.stringify(err))));
      }
    });
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

  function login(){
    if(!tokenClient) throw new Error('OAuth 초기화가 아직 끝나지 않았습니다.');
    tokenClient.requestAccessToken({ prompt: 'consent' });
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

  window.KakaoCheckAuth = {
    init: init,
    login: login,
    revoke: revoke,
    onChange: onChange,
    requireToken: requireToken,
    getAccessToken: getAccessToken,
    getCurrentUser: getCurrentUser
  };
})();
