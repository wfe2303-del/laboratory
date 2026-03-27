(function(){
  var utils = window.KakaoCheckUtils;

  function setAuthState(state){
    var authState = document.getElementById('authState');
    if(!authState) return;
    if(state && state.user && state.user.email){
      authState.className = utils.statusClass('ok');
      authState.textContent = '로그인됨 · ' + state.user.email;
    } else {
      authState.className = utils.statusClass('warn');
      authState.textContent = '로그인이 필요합니다.';
    }
  }

  function setLoginReady(isReady){
    var loginBtn = document.getElementById('loginBtn');
    if(!loginBtn) return;
    loginBtn.disabled = !isReady;
    loginBtn.textContent = isReady ? 'Google 로그인' : '로그인 준비 중...';
  }

  function setTabState(message, kind){
    var tabState = document.getElementById('tabState');
    if(!tabState) return;
    tabState.className = utils.statusClass(kind || '');
    tabState.textContent = message;
  }

  function setAuthError(message){
    var authErr = document.getElementById('authErr');
    if(authErr) authErr.textContent = message || '';
  }

  function createPanelElement(panelId){
    var template = document.getElementById('panelTemplate');
    var node = template.content.firstElementChild.cloneNode(true);
    node.dataset.panelId = String(panelId);
    utils.qs('.panel-title', node).textContent = '패널 ' + panelId;
    return node;
  }

  function fillSheetOptions(panelEl, titles, selectedTitle){
    var select = utils.qs('.js-sheet-select', panelEl);
    if(!select) return;
    select.innerHTML = '';
    if(!titles.length){
      select.appendChild(new Option('(탭 없음)', ''));
      return;
    }
    select.appendChild(new Option('탭 선택', ''));
    titles.forEach(function(title){
      select.appendChild(new Option(title, title));
    });
    if(selectedTitle && titles.indexOf(selectedTitle) >= 0){
      select.value = selectedTitle;
    }
  }

  function renderFileSummary(panelEl, files){
    var summary = utils.qs('.js-file-summary', panelEl);
    if(!summary) return;
    if(!files.length){
      summary.textContent = '파일 없음';
      return;
    }
    if(files.length === 1){
      summary.textContent = files[0].name;
      return;
    }
    summary.textContent = files.length + '개 파일 선택됨 · ' + files[0].name + ' 외 ' + (files.length - 1) + '개';
  }

  function setPanelStatus(panelEl, message, kind){
    var status = utils.qs('.js-panel-status', panelEl);
    if(!status) return;
    status.className = utils.statusClass(kind || '');
    status.textContent = message;
  }

  function setPanelError(panelEl, message){
    var errorBox = utils.qs('.js-panel-error', panelEl);
    if(errorBox) errorBox.textContent = message || '';
  }

  function renderResults(panelEl, sections){
    var root = utils.qs('.js-panel-results', panelEl);
    if(!root) return;
    root.innerHTML = '';
    if(!sections.length){
      root.innerHTML = '<div class="empty-state">결과가 없습니다.</div>';
      return;
    }
    sections.forEach(function(section){
      var card = document.createElement('div');
      card.className = 'result-card';
      var title = document.createElement('h3');
      title.textContent = section.title;
      card.appendChild(title);
      if(!section.rows.length){
        var empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.textContent = '데이터 없음';
        card.appendChild(empty);
      } else {
        var wrap = document.createElement('div');
        wrap.className = 'table-wrap';
        var table = document.createElement('table');
        var thead = document.createElement('thead');
        var headerRow = document.createElement('tr');
        section.headers.forEach(function(header){
          var th = document.createElement('th');
          th.textContent = header;
          headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);
        var tbody = document.createElement('tbody');
        section.rows.forEach(function(row){
          var tr = document.createElement('tr');
          row.forEach(function(cell){
            var td = document.createElement('td');
            td.textContent = cell == null ? '' : String(cell);
            tr.appendChild(td);
          });
          tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        wrap.appendChild(table);
        card.appendChild(wrap);
      }
      root.appendChild(card);
    });
  }

  window.KakaoCheckUI = {
    setAuthState: setAuthState,
    setLoginReady: setLoginReady,
    setTabState: setTabState,
    setAuthError: setAuthError,
    createPanelElement: createPanelElement,
    fillSheetOptions: fillSheetOptions,
    renderFileSummary: renderFileSummary,
    setPanelStatus: setPanelStatus,
    setPanelError: setPanelError,
    renderResults: renderResults
  };
})();
