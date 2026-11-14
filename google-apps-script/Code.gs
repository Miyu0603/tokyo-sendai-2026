/**
 * 記帳後端（trip-kit）
 *
 * ── 安裝（每趟旅行一次）──
 * 1. 開一份新的 Google 試算表，把第一個分頁改名成 trip.config.ts 的 sheetName。
 * 2. 「擴充功能 → Apps Script」開啟（這樣才是容器繫結指令碼，
 *    SpreadsheetApp.getActiveSpreadsheet() 才抓得到這份檔案），把本檔整份貼進去。
 * 3. 上方函式選單選 setupSheet → 執行一次，會寫好標題列與欄位名。
 *    不要拿舊行程的試算表來複製——欄位順序對不上，帳會寫進錯的欄位。
 * 4. 「專案設定 → 指令碼屬性」新增 APP_KEY（自己想一組密鑰）。
 * 5. 「部署 → 新增部署作業 → 網頁應用程式」：執行身分「我」、誰可以存取「所有人」。
 *    拿到的 /exec 網址放進 GitHub secrets 的 VITE_GOOGLE_SCRIPT_URL。
 *
 * ── 為什麼要 APP_KEY ──
 * 部署權限是「所有人」，而 /exec 網址一定會出現在公開網站的 JS 裡，
 * 沒有密鑰的話，任何打開網頁原始碼的人都能讀寫這份試算表。
 * 密鑰不寫在前端程式裡，由使用者在 App 輸入一次、存在自己手機上。
 * 沒設 APP_KEY 時不檢查——可以先部署，設好屬性才開始生效。
 *
 * ── 與前端的契約（lib/expenseApi.ts，兩邊要一起改）──
 * 每個請求都要帶 key（GET 放 query、POST 放 body）。
 * GET  ?sheetName=&key=                 → { data: [ExpenseRow] }
 * GET  ?sheetName=&key=&action=inspect  → 前 3 列原始內容，用來核對欄位
 * POST { action:'add'|'edit', rowIndex?, ...ExpenseRow欄位, sheetName, key } → { result:'success' }
 * POST { action:'delete', rowIndex, sheetName, key }                         → { result:'success' }
 * 任何失敗一律回 { error: '<原因>' }；密鑰不符是 { error: 'unauthorized' }。
 *
 * ExpenseRow：rowIndex, date, item, payer, amountHome, amountLocal, note, splitType,
 *             splitAHome, splitALocal, splitBHome, splitBLocal
 * A／B ＝ trip.config.ts 的第一、第二位旅伴；home／local ＝ 本國幣／當地貨幣。
 */

/** 欄位位置（1 = A 欄）。表頭文字可以自己改成旅伴名字，程式只看位置。 */
var COL = {
  date: 1,          // A 時間
  item: 2,          // B 項目
  payer: 3,         // C 付款者
  amountHome: 4,    // D 本國幣
  amountLocal: 5,   // E 當地貨幣
  splitAHome: 6,    // F 旅伴 A 負擔（本國幣）
  splitALocal: 7,   // G 旅伴 A 負擔（當地貨幣）
  splitBHome: 8,    // H 旅伴 B 負擔（本國幣）
  splitBLocal: 9,   // I 旅伴 B 負擔（當地貨幣）
  note: 10,         // J 備註
  splitType: 11,    // K 分帳方式（equal / manual）
};

var HEADERS = [
  '時間', '項目', '付款者', '本國幣', '當地貨幣',
  '旅伴A負擔（本國）', '旅伴A負擔（當地）', '旅伴B負擔（本國）', '旅伴B負擔（當地）',
  '備註', '分帳方式',
];

var TITLE_ROW = 1;
var HEADER_ROW = 2;
var FIRST_DATA_ROW = 3;
var LAST_COL = HEADERS.length;

/**
 * 在目前的分頁寫好標題列與欄位名。從 Apps Script 編輯器手動執行一次。
 * 分頁裡已經有東西就拒絕，不覆蓋任何資料。
 */
function setupSheet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  if (sheet.getLastRow() > 0) {
    throw new Error('分頁「' + sheet.getName() + '」已經有內容，為了不覆蓋資料，請在空白分頁執行。');
  }
  sheet.getRange(TITLE_ROW, 1).setValue('旅費記帳').setFontWeight('bold').setFontSize(14);
  sheet.getRange(HEADER_ROW, 1, 1, LAST_COL).setValues([HEADERS]).setFontWeight('bold').setBackground('#F2ECE1');
  sheet.setFrozenRows(HEADER_ROW);
  Logger.log('已在「' + sheet.getName() + '」建立表頭。分頁名稱要和 trip.config.ts 的 sheetName 一致。');
}

/**
 * 比對存取密鑰。沒有設定 APP_KEY 時一律放行，
 * 這樣「先部署程式、再設定屬性」的順序不會讓記帳中斷。
 */
function checkAuth_(key) {
  var expected = PropertiesService.getScriptProperties().getProperty('APP_KEY');
  if (!expected) return true;
  return String(key || '') === expected;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function errorOut_(err) {
  return json_({ error: String(err && err.message ? err.message : err) });
}

function getSheet_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = name ? ss.getSheetByName(name) : ss.getSheets()[0];
  if (!sheet) {
    var names = ss.getSheets().map(function (s) { return s.getName(); });
    throw new Error('找不到分頁「' + name + '」。這份試算表現有的分頁：' + names.join('、'));
  }
  return sheet;
}

function num_(v) {
  if (v === '' || v === null || v === undefined) return 0;
  var n = Number(String(v).replace(/[^0-9.\-]/g, ''));
  return isNaN(n) ? 0 : n;
}

/** 日期一律輸出成 YYYY/MM/DD，前端用 new Date() 解析後排序 */
function dateOut_(v) {
  if (v instanceof Date) {
    return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy/MM/dd');
  }
  return String(v || '');
}

function rowIndexOrThrow_(value) {
  var n = Number(value);
  if (!(n >= FIRST_DATA_ROW)) throw new Error('rowIndex 不合法：' + value);
  return n;
}

function doGet(e) {
  try {
    var params = (e && e.parameter) || {};
    if (!checkAuth_(params.key)) return json_({ error: 'unauthorized' });
    var sheet = getSheet_(params.sheetName);

    if (params.action === 'inspect') {
      var peek = sheet.getRange(1, 1, Math.min(3, sheet.getLastRow() || 1), LAST_COL).getDisplayValues();
      return json_({
        sheetName: sheet.getName(),
        allSheets: SpreadsheetApp.getActiveSpreadsheet().getSheets().map(function (s) { return s.getName(); }),
        lastRow: sheet.getLastRow(),
        firstRows: peek,
      });
    }

    var lastRow = sheet.getLastRow();
    if (lastRow < FIRST_DATA_ROW) return json_({ data: [] });

    var values = sheet.getRange(FIRST_DATA_ROW, 1, lastRow - FIRST_DATA_ROW + 1, LAST_COL).getValues();
    var data = [];
    for (var i = 0; i < values.length; i++) {
      var row = values[i];
      if (!row[COL.date - 1] && !row[COL.item - 1]) continue; // 整列空白（中間被刪掉的列）
      var record = { rowIndex: FIRST_DATA_ROW + i };
      for (var field in COL) {
        var cell = row[COL[field] - 1];
        if (field === 'date') record.date = dateOut_(cell);
        else if (field === 'item' || field === 'payer' || field === 'note' || field === 'splitType') record[field] = String(cell || '');
        else record[field] = num_(cell);
      }
      data.push(record);
    }
    return json_({ data: data });
  } catch (err) {
    return errorOut_(err);
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var body = JSON.parse(e.postData.contents);
    if (!checkAuth_(body.key)) return json_({ error: 'unauthorized' });
    var sheet = getSheet_(body.sheetName);

    if (body.action === 'delete') {
      sheet.deleteRow(rowIndexOrThrow_(body.rowIndex));
      return json_({ result: 'success' });
    }
    if (body.action !== 'add' && body.action !== 'edit') {
      throw new Error('不認得的動作：' + body.action);
    }

    var values = [];
    for (var field in COL) {
      var v = body[field];
      if (field === 'date' || field === 'item' || field === 'payer' || field === 'note') values[COL[field] - 1] = v || '';
      else if (field === 'splitType') values[COL[field] - 1] = v === 'manual' ? 'manual' : 'equal';
      else values[COL[field] - 1] = num_(v);
    }

    if (body.action === 'edit') {
      sheet.getRange(rowIndexOrThrow_(body.rowIndex), 1, 1, LAST_COL).setValues([values]);
      return json_({ result: 'success' });
    }

    // add：附加在最後一列之後，但至少從 FIRST_DATA_ROW 開始
    var appendRow = Math.max(sheet.getLastRow() + 1, FIRST_DATA_ROW);
    sheet.getRange(appendRow, 1, 1, LAST_COL).setValues([values]);
    return json_({ result: 'success', rowIndex: appendRow });
  } catch (err) {
    return errorOut_(err);
  } finally {
    lock.releaseLock();
  }
}
