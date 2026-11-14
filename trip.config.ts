/**
 * 這趟旅行的基本設定。
 *
 * 開新行程時只需要改兩個檔案：這裡，和 trip.data.ts。
 * 程式其他地方都從這裡讀，不要再把名字、年份、幣別寫死在元件裡。
 */

export interface Traveller {
  /** 顯示名稱，也會原樣寫進試算表的「付款者」欄 */
  name: string;
  /** 記帳頁代表色 */
  color: string;
}

export interface Currency {
  /** ISO 代碼，顯示在切換鈕上 */
  code: string;
  /** 金額前的符號 */
  symbol: string;
}

export interface TripConfig {
  /**
   * 這趟行程的代號，建議和 GitHub repo 名稱相同（例如 'kyoto-2027'）。
   * 用途：本機開發的網址路徑、Word 檔名，以及 localStorage 的命名空間——
   * 所有行程網站都在同一個網域，靠它區分兩趟旅行的打勾與購物清單。
   * 每趟都要不一樣。（部署時的網址路徑會自動用 repo 名，不靠這個。）
   */
  id: string;
  /** 標題列的行程名稱 */
  title: string;
  /** 加到主畫面時的 App 名稱，iPhone 大約只顯示 12 個字 */
  shortTitle: string;
  /** 第一天的年份。跨年的行程（例如 12/30–1/2）會自動進位，不用另外處理 */
  year: number;
  /** 一律兩人。順序有意義：第一位是記帳的預設付款者 */
  travellers: readonly [Traveller, Traveller];
  currencies: {
    /** 本國幣（刷卡、出發前的花費） */
    home: Currency;
    /** 當地貨幣（現場花費，記帳預設選這個） */
    local: Currency;
  };
  /** 目的地時區，天氣查詢用（IANA 名稱） */
  timezone: string;
  /** Google 試算表裡的分頁名稱（不是檔名），可被 .env 的 VITE_GOOGLE_SHEET_NAME 覆寫 */
  sheetName: string;
  /**
   * 內建清單（待辦、隨身、托運）改版時往上加。
   * 手機上的清單只在這個值變了才會換成新版，使用者自己新增的項目會保留。
   */
  seedVersion: string;
}

export const TRIP: TripConfig = {
  id: 'tokyo-sendai-2026',
  title: '東京・仙台 秋日紅葉之旅',
  shortTitle: '東京仙台紅葉',
  year: 2026,
  travellers: [
    { name: '安寶', color: '#B83A2E' }, // 楓紅
    { name: '婷寶', color: '#9C6400' }, // 金黃（調深一點，白字才讀得清楚）
  ],
  currencies: {
    home: { code: 'TWD', symbol: '$' },
    local: { code: 'JPY', symbol: '¥' },
  },
  timezone: 'Asia/Tokyo',
  sheetName: '2026東京仙台',
  seedVersion: '3',
};
