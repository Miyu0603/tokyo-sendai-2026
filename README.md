# 東京・仙台 秋日紅葉之旅 2026

> 由 [trip-kit](https://github.com/Miyu0603/trip-kit) 範本建立。以下是範本的使用說明。


兩人旅行用的行程 App 範本：行程時間軸、記帳分帳、行李與購物清單、旅遊憑證、會話速查，加到 iPhone 主畫面當 App 用。
React + Vite + Tailwind，部署在 GitHub Pages，記帳存在自己的 Google 試算表。

每趟旅行從這個範本開一個新 repo，改兩個檔案就能用。

---

## 開一趟新行程

### 1. 建立 repo

GitHub 上按 **Use this template → Create a new repository**：

- 名稱用行程代號，例如 `kyoto-2027`（網址會是 `<帳號>.github.io/kyoto-2027/`）
- 選 **Public**。GitHub Pages 免費方案只能部署公開 repo，所以下面第 5 節的隱私規則很重要

```bash
git clone https://github.com/<帳號>/kyoto-2027.git
cd kyoto-2027
npm install
```

### 2. 改 `trip.config.ts`：這趟是誰、去哪、什麼時候

| 欄位 | 說明 |
|---|---|
| `id` | 跟 repo 名稱相同。每趟都要不一樣（它也是手機上儲存資料的命名空間） |
| `title` / `shortTitle` | 標題列名稱／主畫面 App 名稱 |
| `year` | 第一天的年份。跨年行程會自動進位 |
| `travellers` | 兩位旅伴的名字與代表色。第一位是記帳的預設付款者 |
| `currencies` | 本國幣與當地貨幣（代碼＋符號） |
| `timezone` | 目的地時區，例如 `Asia/Tokyo`、`Asia/Seoul` |
| `sheetName` | Google 試算表的分頁名稱 |
| `seedVersion` | 出發後還要改內建清單時往上加，手機上的清單才會更新 |

### 3. 改 `trip.data.ts`：行程內容

行程、地點詳情、憑證、待辦、行李、天氣城市、緊急聯絡，全部在這一個檔案。檔案開頭有格式說明，範例行程示範了每一種欄位。

可以請 Claude 照範例格式產生。改完跑：

```bash
npm run check
```

格式錯了（少欄位、打錯字、類型不對）會直接列出哪一行。

去日本以外的國家，另外改 `phrases.ts`（會話速查）和 `trip.data.ts` 裡的 `EMERGENCY_CONTACTS`。

### 4. 記帳後端（Google 試算表）

照 [`google-apps-script/README.md`](google-apps-script/README.md) 做，大約 5 分鐘：準備空白分頁 → 貼上 `Code.gs` → 設定 `APP_KEY` → 部署拿到 `/exec` 網址。表頭會在第一次用記帳時自動建好。

**每趟都用新的空白分頁。** 不要沿用上一趟的分頁：欄位順序可能對不上，帳會寫進錯的欄位。

### 5. 部署

GitHub repo 的 **Settings**：

1. **Pages → Build and deployment → Source** 選 **GitHub Actions**
2. **Secrets and variables → Actions → New repository secret**：

| Secret | 必填 | 內容 |
|---|---|---|
| `VITE_GOOGLE_SCRIPT_URL` | ✓ | 第 4 步拿到的 `/exec` 網址 |
| `VITE_GOOGLE_SHEET_URL` | | 試算表網址（記帳頁底部的「開啟試算表」） |
| `VITE_GOOGLE_SHEET_NAME` | | 分頁名稱，不填就用 `trip.config.ts` 的 `sheetName` |

推上 `main` 就會自動檢查、測試、建置、部署。

### 6. 手機上

1. Safari 開 `https://<帳號>.github.io/<repo>/` → 分享 → **加入主畫面**
2. 記帳頁輸入 `APP_KEY` 解鎖（只要一次）。也可以把 `https://<帳號>.github.io/<repo>/#key=<密鑰>` 用 LINE 傳給旅伴，點開就解鎖
3. **兩支手機都要在出發前試過記帳**

---

## 隱私規則（repo 是公開的）

這些規則來自上一趟踩過的雷：真實住宿名稱曾經跟著行程匯出檔一起進了公開 repo，最後只能改寫 git 歷史。

- **住宿只寫代稱＋最近車站**（「京都 飯店」，地圖連到京都駅）。真名與地址放 `private/accommodation.json`（從 `private.example/` 複製，已在 `.gitignore`），只有產生 Word 時會用到
- **訂房單、票券放雲端硬碟，權限設「限定對象」**，連結貼在 `VOUCHERS`
- **行程的匯出檔、草稿、設計稿不要放進 repo**：它們常常內嵌整份行程。`.gitignore` 已經擋掉常見檔名，其他的自己留意
- **第一次 push 前**，把住宿真名在整個專案搜一次，確定只出現在 `private/`：

  ```bash
  git ls-files -z | xargs -0 grep -l "飯店真名"
  ```

- 網站已設 `noindex`，不會被搜尋引擎收錄；記帳有 `APP_KEY` 保護
- 旅行結束後可以把 repo 刪除或轉 private（轉 private 後網站會停止）

---

## 指令

| 指令 | 用途 |
|---|---|
| `npm run dev` | 本機開發（記帳要先把 `.env.example` 複製成 `.env.local` 並填網址） |
| `npm run check` | 型別與資料格式檢查 |
| `npm run test:gas` | 記帳後端契約測試（在本機模擬試算表跑 `Code.gs`） |
| `npm run build:docx` | 產生 Word 行程表 `行程表-<id>.docx`，離線備援用；有 `private/` 時會換回住宿真名 |
| `npm run build` | 建置網站到 `dist/` |

---

## 檔案

```
trip.config.ts        這趟的基本設定        ← 每趟要改
trip.data.ts          行程內容              ← 每趟要改
phrases.ts            會話速查              ← 換國家時改
private.example/      住宿真名對照表範例     ← 複製成 private/
google-apps-script/   記帳後端與契約測試
scripts/build-docx.cjs  Word 行程表產生器
lib/                  記帳 API、日期換算、本機儲存
views/ components/    畫面
```

## 部署到 GitHub Pages 以外

網站路徑預設是 `/<repo 名>/`。部署到根網域（例如 Cloudflare Pages，repo 可以維持 private）時，建置前設 `BASE_PATH=/`。
