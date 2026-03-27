(function(){
  var utils = window.KakaoCheckUtils;
  var parser = window.KakaoCheckParser;
  var config = window.KakaoCheckConfig;

  function buildResult(rosterRows, parsed){
    var summary = parser.summarizeActiveState(parsed.events);
    var activeDigitsByName = summary.activeDigitsByName;
    var leftFinalDigitsByName = summary.leftFinalDigitsByName;
    var sentinel = parser.NAME_ONLY_SENTINEL;
    var nameCount = new Map();
    var rosterNames = new Set();

    rosterRows.forEach(function(row){
      if(!row.nameNormalized) return;
      rosterNames.add(row.nameNormalized);
      nameCount.set(row.nameNormalized, (nameCount.get(row.nameNormalized) || 0) + 1);
    });

    var report = [];
    var updates = [];
    var unresolved = [];

    rosterRows.forEach(function(row){
      var nameKey = row.nameNormalized;
      var phone4 = utils.last4Digits(row.phone);
      var activeSet = activeDigitsByName.get(nameKey) || new Set();
      var isDup = (nameCount.get(nameKey) || 0) > 1;
      var hasNameOnly = activeSet.has(sentinel);
      var hasExactPhone = phone4 ? activeSet.has(phone4) : false;
      var hasAnyJoin = activeSet.size > 0;
      var confidentAttendance = false;
      var status = '미입장';
      var notes = '';
      var matched = '';

      if(!nameKey){
        report.push([row.rowNumber, row.name, row.phone, status, matched, notes]);
        return;
      }

      if(isDup){
        if(hasExactPhone){
          confidentAttendance = true;
          matched = row.name + '/' + phone4;
        } else if(hasNameOnly && hasAnyJoin){
          unresolved.push([row.rowNumber, row.name, '동명이인 + 입장로그 번호없음']);
          notes = '동명이인 / 번호없음';
        } else if(hasAnyJoin){
          unresolved.push([row.rowNumber, row.name, '동명이인 + 번호불일치']);
          notes = '동명이인 / 번호불일치';
        }
      } else {
        if(hasExactPhone){
          confidentAttendance = true;
          matched = row.name + '/' + phone4;
        } else if(hasAnyJoin){
          confidentAttendance = true;
          matched = hasNameOnly ? row.name : row.name + '/' + firstNonSentinel(activeSet, sentinel);
          if(hasNameOnly) notes = '번호없음';
        }
      }

      if(confidentAttendance){
        status = '입장';
        updates.push({ rowNumber: row.rowNumber, range: row.sheetTitle + '!' + config.columns.status + row.rowNumber, values: [[config.statusText]] });
      }

      report.push([row.rowNumber, row.name, row.phone, status, matched, notes]);
    });

    var extra = [];
    activeDigitsByName.forEach(function(set, nameKey){
      if(rosterNames.has(nameKey)) return;
      var values = Array.from(set);
      values.forEach(function(value){
        if(value === sentinel) extra.push([nameKey + '(번호없음)']);
        else extra.push([nameKey + '/' + value]);
      });
    });
    extra.sort(compareRow);

    var leavers = [];
    leftFinalDigitsByName.forEach(function(set, nameKey){
      var activeSet = activeDigitsByName.get(nameKey);
      set.forEach(function(value){
        if(activeSet && activeSet.has(value)) return;
        if(value === sentinel) leavers.push([nameKey + '(번호없음)']);
        else leavers.push([nameKey + '/' + value]);
      });
    });
    leavers.sort(compareRow);

    return {
      report: report,
      extra: extra,
      leavers: leavers,
      unresolved: unresolved,
      updates: updates,
      joinedCount: parsed.joinedCount,
      leftCount: parsed.leftCount,
      attendingCount: updates.length
    };
  }

  function firstNonSentinel(set, sentinel){
    var arr = Array.from(set || []);
    for(var i = 0; i < arr.length; i += 1){
      if(arr[i] !== sentinel) return arr[i];
    }
    return '';
  }

  function compareRow(a, b){
    return String(a[0] || '').localeCompare(String(b[0] || ''), 'ko');
  }

  window.KakaoCheckMatcher = {
    buildResult: buildResult
  };
})();
