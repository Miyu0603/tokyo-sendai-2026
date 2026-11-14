
export interface LocationDetail {
  id: string;
  title: string;
  description: string;
  address?: string;
  openingHours?: string;
  mapUrl?: string;
  websiteUrl?: string;
  carNaviPhone?: string; // For Japanese Car GPS
  mapCode?: string;      // Japanese car navi map code (マップコード)
  imageUrl?: string;
  reservation?: {
    id: string;
    sections: ReservationSection[];
  };
}

export interface ReservationSection {
  title: string;
  items: { label: string; value: string; isFullWidth?: boolean }[];
}

/** 同一段路的替代班次：落地快慢不同就搭不同班 */
export interface TransitAlternative {
  /** 什麼狀況下選這班：很順／正常／偏慢／很慢 */
  when: string;
  /** 班次內容 */
  detail: string;
  /** 目前行程採用的那班 */
  isPlan?: boolean;
}

/** 轉乘的其中一段。卡片只顯示頭尾，這些中間段只在詳情彈窗展開。 */
export interface TransitLeg {
  /** 搭什麼：中央線快速、小田急、新幹線、步行 10 分… */
  via: string;
  /** 這一段到哪 */
  to: string;
  /** 抵達時間，原始行程沒寫就留空 */
  arrive?: string;
}

/** 詳情彈窗左上角的分類標籤 */
export type EventCategory = 'transit' | 'food' | 'event' | 'spot' | 'stay';

export interface ItineraryEvent {
  time: string;
  description: string;
  isHighlight?: boolean; // 朱砂紅：時間與菱形節點
  note?: string;
  locationId?: string; // Link to LocationDetail
  /** 省略時由 ItineraryView 依關鍵字推斷 */
  category?: EventCategory;
  /** 轉乘起點；有 legs 時必填 */
  origin?: string;
  /** 中間各段轉乘，只在詳情彈窗顯示 */
  legs?: TransitLeg[];
  /** 同一段的其他可選班次，只在詳情彈窗顯示 */
  alternatives?: TransitAlternative[];
}

export interface DaySchedule {
  /** '月/日'，例如 '4/1'。年份在 trip.config.ts，星期幾由日期算出 */
  date: string;
  title: string;
  accommodation?: string;
  accommodationMapUrl?: string; // New: Link for accommodation
  mapUrl?: string;
  /** 當日專用的外部連結，顯示在日期標題下方 */
  links?: { label: string; url: string }[];
  events: ItineraryEvent[];
}

export interface ChecklistItem {
  id: string;
  text: string;
  category?: string;
}

export interface Voucher {
  name: string;
  url: string;
  type?: 'hotel' | 'train' | 'tour' | 'ticket';
}

/** 某一天要顯示哪個城市的天氣 */
export interface WeatherSpot {
  date: string; // 與 ITINERARY 的 date 同格式，例如 '9/24'
  label: string;
  latitude: number;
  longitude: number;
}

/** 某一天所在城市「此刻」的天氣——不是預報 */
export interface DayWeather {
  label: string;
  code: number;
  temp: number;
}

export interface UsefulLink {
  title: string;
  url: string;
}

export interface EmergencyContact {
  title: string;
  number: string;
  note?: string;
}

export interface ShoppingItem {
  id: string;
  text: string;
  isCompleted: boolean;
}

/**
 * 一筆消費。兩位旅伴固定用 A、B 稱呼（= trip.config.ts 的 travellers[0]、[1]），
 * 幣別固定用 home、local（= currencies.home、currencies.local），
 * 這樣換旅伴或換國家都不用改欄位名。
 */
export interface ExpenseRecord {
  /** 試算表列號，編輯與刪除靠它定位 */
  rowIndex: number;
  date: string;
  item: string;
  /** 付款者的名字，對應 travellers 其中一位 */
  payer: string;
  /** 一筆只會有一種幣別有值，另一個是 0 */
  amountHome: number;
  amountLocal: number;
  note: string;
  splitType: 'equal' | 'manual';
  /** 各自實際負擔的金額 */
  splitAHome: number;
  splitALocal: number;
  splitBHome: number;
  splitBLocal: number;
}

export enum Tab {
  ITINERARY = 'Itinerary',
  PREP = 'Prep',
  COST = 'Cost',
  PACKING = 'Packing',
  SHOPPING = 'Shopping',
  INFO = 'Info'
}
