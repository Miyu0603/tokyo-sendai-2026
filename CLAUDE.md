# trip-kit

兩人旅行的行程 App 範本（React + Vite + Tailwind CDN，GitHub Pages，記帳走 Google Apps Script）。
使用方式與部署步驟見 README.md。

## 開新行程時改哪裡

- `trip.config.ts`：旅伴、年份、幣別、時區、試算表分頁名
- `trip.data.ts`：行程、地點、憑證、清單、天氣城市。改完跑 `npm run check`
- `phrases.ts`：只有換國家才需要改
- 其他檔案不應該出現任何特定行程的名字、年份或幣別；需要的話從 `TRIP` 讀

## 不能破壞的規則

- **住宿真名與地址不能出現在任何追蹤中的檔案。** 資料裡只寫代稱＋最近車站，真名放 `private/accommodation.json`。commit 前用 `git ls-files -z | xargs -0 grep -l <真名>` 確認——掃整個 repo，不是只掃資料檔（行程匯出檔與設計稿曾經夾帶整份行程進了公開 repo）。
- **`VITE_GOOGLE_SCRIPT_URL` 沒有預設值。** 沿用舊網址會把帳寫進上一趟的試算表。
- **記帳契約兩邊一起改**：`types.ts` 的 `ExpenseRecord` ↔ `google-apps-script/Code.gs` 的 `COL`。改完跑 `npm run test:gas`。
- **星期幾由日期計算**（`lib/tripDates.ts` 的 `weekdayOf`），不要在資料裡加 weekday 欄位。
- **日期用裝置本地時區**（`localIsoDate`），不要用 `toISOString()`：日本半夜會被算成前一天。
- **localStorage 一律經過 `lib/storage.ts`**：所有行程網站同網域，鍵要加行程 id 前綴，否則兩趟旅行互相覆蓋。
- **營業時間、公休日以店家官網為準**，不要只抄評論網站摘要。寫進資料前逐一打開官網確認。

## 指令

`npm run check`（型別與資料）・`npm run test:gas`（記帳契約）・`npm run build:docx`（Word 備援）・`npm run build`
