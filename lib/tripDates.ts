import { TRIP } from '../trip.config';
import { ITINERARY } from '../trip.data';

/*
 * 行程資料用 '9/23' 這種短日期（好寫、好讀），
 * 但天氣查詢和「今天是第幾天」需要完整的 ISO 日期。
 */

const FIRST_MONTH = Number(ITINERARY[0]?.date.split('/')[0] ?? 1);

/**
 * '4/1' → '2027-04-01'。
 * 月份比第一天小，代表行程跨年了（12/30 出發、1/2 回來），年份要加一。
 */
export const toTripIso = (shortDate: string): string => {
  const [month, day] = shortDate.split('/').map(Number);
  const year = month < FIRST_MONTH ? TRIP.year + 1 : TRIP.year;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

/** 用裝置本地時區，不能用 toISOString()：在日本（UTC+9）半夜會被算成前一天。 */
export const localIsoDate = (d: Date = new Date()): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const TRIP_ISO_DATES = ITINERARY.map(day => toTripIso(day.date));

/** 今天是行程的第幾天（0 起算）；不在行程期間回傳 -1。 */
export const todayTripIndex = (): number => TRIP_ISO_DATES.indexOf(localIsoDate());

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

/**
 * 星期幾從日期算出來，不讓人手填。
 * 手填（或請 AI 填）寫錯一天，連帶「那天店休不休」的判斷也會錯。
 */
export const weekdayOf = (shortDate: string): string => {
  const [year, month, day] = toTripIso(shortDate).split('-').map(Number);
  return WEEKDAYS[new Date(year, month - 1, day).getDay()];
};
