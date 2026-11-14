# 記帳後端設定

App 的「記帳」分頁透過一支 Google Apps Script 讀寫試算表。每趟旅行開一份新的試算表、部署一次。

## 步驟

1. 準備一個**完全空白**的分頁，名稱和 `trip.config.ts` 的 `sheetName` 一樣（或另外設 secret `VITE_GOOGLE_SHEET_NAME`）
   可以開新試算表，也可以在現有試算表裡新增分頁。**不要沿用舊行程的分頁**
2. 從那份試算表 **擴充功能 → Apps Script**
   （一定要從試算表裡開，這樣才是容器繫結指令碼，`getActiveSpreadsheet()` 才抓得到檔案）
   如果這份試算表本來就有 Apps Script（例如給別的行程用的），貼上去會取代它，見下方「共用試算表」
3. 把 `Code.gs` 整份貼進去，存檔
4. **專案設定（齒輪）→ 指令碼屬性 → 新增**：屬性 `APP_KEY`，值自己想一組密鑰
5. **部署 → 新增部署作業 → 類型選「網頁應用程式」**（第一次會要求授權）
   - 執行身分：**我**
   - 誰可以存取：**所有人**
6. 複製結尾是 `/exec` 的網址，設成 GitHub secret `VITE_GOOGLE_SCRIPT_URL`（見專案 README）

**表頭不用手動建。** App 第一次打開記帳頁時，會在指定的分頁自動寫好標題列與欄位名；分頁只要有任何內容就不會動。

> **為什麼要 `APP_KEY`？** 部署權限是「所有人」，而 `/exec` 網址一定會出現在公開網站的程式碼裡。沒有密鑰，任何人都能讀寫這份試算表。密鑰不放在程式碼裡，由使用者在 App 輸入一次、存在自己手機上。
>
> **共用試算表：** 一份試算表只能綁一支 Apps Script。如果同一份試算表裡還有別的行程正在用舊版程式記帳，貼上新版會讓舊的那個記帳失效（欄位名稱不同）。舊行程已經結束就沒關係。

## 欄位

第 1 列標題、第 2 列欄位名、第 3 列起是資料。

| 欄 | A | B | C | D | E | F | G | H | I | J | K |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 內容 | 時間 | 項目 | 付款者 | 本國幣 | 當地貨幣 | 旅伴A負擔（本國） | 旅伴A負擔（當地） | 旅伴B負擔（本國） | 旅伴B負擔（當地） | 備註 | 分帳方式 |

- 旅伴 A／B ＝ `trip.config.ts` 裡 `travellers` 的第一、第二位；本國／當地 ＝ `currencies.home`／`currencies.local`
- 表頭文字可以自己改成旅伴名字，程式只看欄位位置
- 一筆消費只會有一種幣別有金額，另一種是 0

## 核對與除錯

在瀏覽器打開下面的網址，會回傳分頁清單與前 3 列原始內容：

```
<你的 /exec 網址>?sheetName=<分頁名>&key=<APP_KEY>&action=inspect
```

| 症狀 | 原因 |
|---|---|
| App 一直要求解鎖 | 輸入的密鑰和 `APP_KEY` 不同 |
| 記帳頁顯示「找不到分頁」 | 試算表分頁名稱與 `sheetName`（或 `VITE_GOOGLE_SHEET_NAME`）不一致 |
| 瀏覽器開 `/exec` 出現 Google 登入頁或 404 | 部署時「誰可以存取」沒選「所有人」 |
| 改了 `Code.gs` 沒生效 | 要「管理部署作業 → 編輯 → 版本：新版本」重新部署，只存檔不會更新 |

## 前端契約

前端在 `lib/expenseApi.ts`，兩邊的欄位名一模一樣（就是 `types.ts` 的 `ExpenseRecord`）。

| 動作 | 請求 | 回應 |
|---|---|---|
| 讀取 | `GET ?sheetName=&key=` | `{ data: ExpenseRecord[] }` |
| 核對 | `GET ?sheetName=&key=&action=inspect` | 分頁清單＋前 3 列 |
| 新增 | `POST { action:'add', ...欄位 }` | `{ result:'success' }` |
| 修改 | `POST { action:'edit', rowIndex, ...欄位 }` | `{ result:'success' }` |
| 刪除 | `POST { action:'delete', rowIndex }` | `{ result:'success' }` |
| 任何失敗 | | `{ error: '<原因>' }`，密鑰不符是 `{ error: 'unauthorized' }` |

- POST 都要帶 `sheetName` 與 `key`；`Content-Type` 是 `text/plain`，為了避開 CORS preflight（Apps Script 不回應 OPTIONS）
- **改欄位要兩邊一起改**，然後跑 `npm run test:gas`：它在本機用假的試算表執行真正的 `Code.gs`，並直接比對 `types.ts` 的欄位名，任一邊漏改就會失敗。部署流程也會跑這支測試
