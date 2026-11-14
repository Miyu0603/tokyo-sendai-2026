/**
 * 記帳後端的契約測試：用假的 SpreadsheetApp 跑真正的 Code.gs。
 *   npm run test:gas
 *
 * Code.gs 只能在 Google 上執行，改壞了要到旅途中記帳才會發現。
 * 這支測試在本機把新增、編輯、刪除、密鑰、錯誤路徑都跑一遍，
 * 並直接讀 types.ts 的 ExpenseRecord 比對欄位名——前後端任一邊改了欄位沒改另一邊，這裡會紅。
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const code = fs.readFileSync(path.join(__dirname, 'Code.gs'), 'utf8');

const typesSrc = fs.readFileSync(path.join(__dirname, '..', 'types.ts'), 'utf8');
const recordBody = typesSrc.match(/export interface ExpenseRecord \{([\s\S]*?)\n\}/)[1];
const FRONTEND_FIELDS = [...recordBody.matchAll(/^\s*(\w+):/gm)].map(m => m[1]).sort();

function makeSheet(name) {
  const rows = []; // rows[r-1][c-1]
  const sheet = {
    getName: () => name,
    getLastRow: () => { for (let r = rows.length; r > 0; r--) if (rows[r-1] && rows[r-1].some(v => v !== '' && v !== undefined)) return r; return 0; },
    getRange: (r, c, nr = 1, nc = 1) => {
      const range = {
        setValues(vals) { vals.forEach((row, i) => { rows[r-1+i] = rows[r-1+i] || []; row.forEach((v, j) => { rows[r-1+i][c-1+j] = v; }); }); return range; },
        setValue(v) { return range.setValues([[v]]); },
        getValues() { return Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => (rows[r-1+i] || [])[c-1+j] ?? '')); },
        getDisplayValues() { return range.getValues().map(row => row.map(String)); },
        setFontWeight() { return range; }, setFontSize() { return range; }, setBackground() { return range; },
      };
      return range;
    },
    deleteRow: r => { rows.splice(r - 1, 1); },
    setFrozenRows: () => {},
    _rows: rows,
  };
  return sheet;
}

const sheet = makeSheet('範例行程');
let appKey = null;
const ctx = {
  SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: n => (n === '範例行程' ? sheet : null), getSheets: () => [sheet], getActiveSheet: () => sheet }) },
  PropertiesService: { getScriptProperties: () => ({ getProperty: k => (k === 'APP_KEY' ? appKey : null) }) },
  ContentService: { createTextOutput: s => ({ setMimeType() { return JSON.parse(s); } }), MimeType: { JSON: 'json' } },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  Utilities: { formatDate: d => d.toISOString().slice(0, 10).replace(/-/g, '/') },
  Session: { getScriptTimeZone: () => 'Asia/Tokyo' },
  Logger: { log() {} },
};
vm.createContext(ctx);
vm.runInContext(code, ctx);

const get = q => ctx.doGet({ parameter: q });
const post = b => ctx.doPost({ postData: { contents: JSON.stringify(b) } });
const S = { sheetName: '範例行程' };
let pass = 0, fail = 0;
const check = (label, cond, extra = '') => { cond ? pass++ : fail++; console.log(`${cond ? '✓' : '✗'} ${label}${extra ? '  ' + extra : ''}`); };

// 空表
ctx.setupSheet();
check('setupSheet 寫入表頭（11 欄）', sheet._rows[1].length === 11 && sheet._rows[1][0] === '時間');
let threw = false; try { ctx.setupSheet(); } catch (e) { threw = true; }
check('setupSheet 在非空分頁拒絕執行（不覆蓋）', threw);
check('空表讀取回傳 data: []', JSON.stringify(get(S)) === '{"data":[]}');

// 新增兩筆
const rec = { date: '2027/04/01', item: '拉麵', payer: '旅伴A', amountHome: 0, amountLocal: 2000, note: '', splitType: 'equal', splitAHome: 0, splitALocal: 1000, splitBHome: 0, splitBLocal: 1000 };
check('新增 → success', post({ ...S, action: 'add', ...rec }).result === 'success');
post({ ...S, action: 'add', ...rec, item: '車票', payer: '旅伴B', amountHome: 500, amountLocal: 0, splitType: 'manual', splitAHome: 300, splitALocal: 0, splitBHome: 200 });
let data = get(S).data;
check('讀回 2 筆', data.length === 2);
const gasFields = Object.keys(data[0]).sort();
check('回傳欄位與 types.ts 的 ExpenseRecord 完全一致', JSON.stringify(gasFields) === JSON.stringify(FRONTEND_FIELDS),
  JSON.stringify(gasFields) === JSON.stringify(FRONTEND_FIELDS) ? '' : `GAS: ${gasFields}  前端: ${FRONTEND_FIELDS}`);
check('數值與分帳方式保留', data[1].amountHome === 500 && data[1].splitAHome === 300 && data[1].splitType === 'manual');
check('第一筆從第 3 列開始', data[0].rowIndex === 3);

// 編輯
post({ ...S, action: 'edit', rowIndex: 3, ...rec, item: '拉麵（大碗）' });
check('編輯後內容更新', get(S).data[0].item === '拉麵（大碗）');

// 錯誤路徑
check('rowIndex 不合法 → { error }', typeof post({ ...S, action: 'edit', rowIndex: 1, ...rec }).error === 'string');
check('不認得的動作 → { error }', /不認得/.test(post({ ...S, action: 'hack' }).error || ''));
check('分頁不存在 → { error }', /找不到分頁/.test(get({ sheetName: '不存在' }).error || ''));
check('splitType 亂填會被收斂成 equal', (post({ ...S, action: 'edit', rowIndex: 3, ...rec, splitType: 'evil' }), get(S).data[0].splitType === 'equal'));

// 刪除
post({ ...S, action: 'delete', rowIndex: 3 });
data = get(S).data;
check('刪除後剩 1 筆、列號往上補', data.length === 1 && data[0].item === '車票' && data[0].rowIndex === 3);

// 密鑰
appKey = 'secret-123';
check('設 APP_KEY 後無密鑰讀取 → unauthorized', get(S).error === 'unauthorized');
check('錯誤密鑰 → unauthorized', get({ ...S, key: 'nope' }).error === 'unauthorized');
check('錯誤密鑰寫入 → unauthorized，且沒有寫入', post({ ...S, key: 'nope', action: 'add', ...rec }).error === 'unauthorized' && get({ ...S, key: 'secret-123' }).data.length === 1);
check('正確密鑰 → 讀得到', get({ ...S, key: 'secret-123' }).data.length === 1);

console.log(`\n${pass} 通過，${fail} 失敗`);
process.exit(fail ? 1 : 0);
