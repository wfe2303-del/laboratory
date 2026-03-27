(function(){
  var auth = window.KakaoCheckAuth;
  var sheets = window.KakaoCheckSheets;
  var parser = window.KakaoCheckParser;
  var matcher = window.KakaoCheckMatcher;
  var ui = window.KakaoCheckUI;
  var utils = window.KakaoCheckUtils;

  var state = {
    nextPanelId: 1,
    sheetTitles: [],
    panels: new Map()
  };

  function bootstrap(){
    ui.renderSpreadsheetLink();
    bindTopLevelEvents();
    auth.onChange(function(payload){
      ui.setAuthState(payload);
      ui.setAuthError('');
      if(payload && payload.accessToken){
        loadSheetTitles();
      } else {
        ui.setTabState('탭 목록 미로드', '');
      }
    });

    try {
      auth.init();
    } catch (error) {
      ui.setAuthError(error.message);
    }

    addPanel();
  }

  function bindTopLevelEvents(){
    document.getElementById('loginBtn').addEventListener('click', function(){
      try {
        ui.setAuthError('');
        auth.login();
      } catch (error) {
        ui.setAuthError(error.message);
      }
    });

    document.getElementById('logoutBtn').addEventListener('click', function(){
      auth.revoke();
    });

    document.getElementById('refreshTabsBtn').addEventListener('click', function(){
      loadSheetTitles();
    });

    document.getElementById('addPanelBtn').addEventListener('click', function(){
      addPanel();
    });
  }

  async function loadSheetTitles(){
    try {
      ui.setTabState('탭 목록 불러오는 중...', 'warn');
      state.sheetTitles = await sheets.listSheetTitles();
      ui.setTabState('탭 ' + state.sheetTitles.length + '개 로드 완료', 'ok');
      state.panels.forEach(function(panelState){
        updatePanelSheetOptions(panelState);
      });
    } catch (error) {
      ui.setTabState('탭 목록 로드 실패', 'bad');
      ui.setAuthError(error.message);
    }
  }

  function addPanel(){
    var panelId = state.nextPanelId;
    state.nextPanelId += 1;

    var panelEl = ui.createPanelElement(panelId);
    var panelState = {
      id: panelId,
      el: panelEl,
      files: [],
      search: '',
      selectedSheet: ''
    };
    state.panels.set(panelId, panelState);
    bindPanelEvents(panelState);
    updatePanelSheetOptions(panelState);
    ui.renderFileSummary(panelEl, []);
    ui.setPanelStatus(panelEl, '대기 중', '');
    document.getElementById('panelsRoot').appendChild(panelEl);
    refreshRemoveButtons();
  }

  function removePanel(panelId){
    if(state.panels.size <= 1) return;
    var panelState = state.panels.get(panelId);
    if(!panelState) return;
    panelState.el.remove();
    state.panels.delete(panelId);
    refreshRemoveButtons();
  }

  function refreshRemoveButtons(){
    state.panels.forEach(function(panelState){
      var btn = utils.qs('.panel-remove-btn', panelState.el);
      if(!btn) return;
      btn.disabled = state.panels.size <= 1;
    });
  }

  function bindPanelEvents(panelState){
    var el = panelState.el;
    var searchInput = utils.qs('.js-sheet-search', el);
    var select = utils.qs('.js-sheet-select', el);
    var fileInput = utils.qs('.js-file-input', el);
    var runBtn = utils.qs('.js-run-btn', el);
    var demoBtn = utils.qs('.js-demo-btn', el);
    var removeBtn = utils.qs('.panel-remove-btn', el);

    searchInput.addEventListener('input', function(event){
      panelState.search = String(event.target.value || '');
      updatePanelSheetOptions(panelState);
    });

    select.addEventListener('change', function(event){
      panelState.selectedSheet = String(event.target.value || '');
    });

    fileInput.addEventListener('change', function(event){
      panelState.files = Array.from(event.target.files || []);
      ui.renderFileSummary(el, panelState.files);
    });

    runBtn.addEventListener('click', function(){
      runPanel(panelState.id);
    });

    demoBtn.addEventListener('click', function(){
      runDemo(panelState.id);
    });

    removeBtn.addEventListener('click', function(){
      removePanel(panelState.id);
    });
  }

  function updatePanelSheetOptions(panelState){
    var query = panelState.search.trim().toLowerCase();
    var filtered = state.sheetTitles.filter(function(title){
      return !query || title.toLowerCase().indexOf(query) >= 0;
    });
    ui.fillSheetOptions(panelState.el, filtered, panelState.selectedSheet);
    if(filtered.indexOf(panelState.selectedSheet) < 0){
      panelState.selectedSheet = '';
    }
  }

  async function runPanel(panelId){
    var panelState = state.panels.get(panelId);
    var previewOnly = utils.qs('.js-preview-only', panelState.el).checked;
    try {
      ui.setPanelError(panelState.el, '');
      ui.setPanelStatus(panelState.el, '실행 중...', 'warn');
      if(!auth.getAccessToken()) throw new Error('먼저 Google 로그인하세요.');
      if(!panelState.selectedSheet) throw new Error('탭을 선택하세요.');
      if(!panelState.files.length) throw new Error('카톡 대화로그 파일을 하나 이상 업로드하세요.');

      var chatText = await parser.combineFiles(panelState.files);
      var parsed = parser.parseChatText(chatText);
      var roster = await sheets.loadRosterRows(panelState.selectedSheet);
      var result = matcher.buildResult(roster, parsed);

      if(!previewOnly && result.updates.length){
        await sheets.writeUpdates(result.updates);
      }

      renderRunResult(panelState, result, previewOnly);
      ui.setPanelStatus(panelState.el, previewOnly ? '열람용 완료' : '체크 완료', 'ok');
    } catch (error) {
      ui.setPanelStatus(panelState.el, '실패', 'bad');
      ui.setPanelError(panelState.el, error.message || String(error));
      console.error(error);
    }
  }

  function runDemo(panelId){
    var panelState = state.panels.get(panelId);
    var roster = [
      { rowNumber: 2, sheetTitle: '데모', name: '황현하', phone: '010-1234-5678', nameNormalized: utils.normalizeName('황현하') },
      { rowNumber: 3, sheetTitle: '데모', name: '김혜영', phone: '010-3456-7890', nameNormalized: utils.normalizeName('김혜영') },
      { rowNumber: 4, sheetTitle: '데모', name: '임규리', phone: '010-1717-1771', nameNormalized: utils.normalizeName('임규리') },
      { rowNumber: 5, sheetTitle: '데모', name: '김예은', phone: '010-1111-0000', nameNormalized: utils.normalizeName('김예은') },
      { rowNumber: 6, sheetTitle: '데모', name: '황현하', phone: '010-9999-9999', nameNormalized: utils.normalizeName('황현하') }
    ];
    var parsed = parser.parseChatText([
      '김예은/0000님이 입장하셨습니다',
      '황현하/5678님이 입장하셨습니다',
      '임규리 1771님이 들어왔습니다',
      '김혜영님이 입장하셨습니다',
      '진종범/2514님이 입장하셨습니다',
      '매드드라이버김지현님이 입장하셨습니다',
      '황현하/5678님이 나갔습니다',
      '황현하/5678님이 입장했습니다'
    ].join('\n'));
    var result = matcher.buildResult(roster, parsed);
    ui.setPanelError(panelState.el, '');
    renderRunResult(panelState, result, true);
    ui.setPanelStatus(panelState.el, '데모 완료', 'ok');
  }

  function renderRunResult(panelState, result, previewOnly){
    var sections = [
      {
        title: '명단 기준 상태',
        headers: ['row', 'name', 'phone', 'status', 'matched', 'notes'],
        rows: result.report
      },
      {
        title: '명단 외 입장자',
        headers: ['name/last4'],
        rows: result.extra
      },
      {
        title: '퇴장자 명단(최종)',
        headers: ['name/last4'],
        rows: result.leavers
      },
      {
        title: previewOnly ? '예상 갱신 결과(열람용)' : '실제 갱신 결과',
        headers: ['range'],
        rows: result.updates.map(function(item){ return [item.range + ' ← 입장']; })
      },
      {
        title: '미확인 목록',
        headers: ['row', 'name', 'reason'],
        rows: result.unresolved
      }
    ];
    ui.renderResults(panelState.el, sections);
    ui.setPanelError(panelState.el, 'join ' + result.joinedCount + ' · leave ' + result.leftCount + ' · 체크대상 ' + result.attendingCount + (previewOnly ? ' · 열람용' : ''));
  }

  document.addEventListener('DOMContentLoaded', bootstrap);
})();
