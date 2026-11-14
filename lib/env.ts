import { TRIP } from '../trip.config';

/*
 * 記帳後端設定，全部在建置時從 .env（本機）或 GitHub secrets（部署）注入。
 *
 * GOOGLE_SCRIPT_URL 故意沒有預設值：沿用上一趟的網址，會把這趟的帳寫進上一趟的試算表。
 * 沒設定時記帳頁會顯示「尚未設定」，不會靜默失敗。
 */
export const GOOGLE_SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL || '';
export const GOOGLE_SHEET_NAME = import.meta.env.VITE_GOOGLE_SHEET_NAME || TRIP.sheetName;
// 試算表網址只從環境變數讀：repo 可能是公開的，不寫死在原始碼裡
export const GOOGLE_SHEET_URL = import.meta.env.VITE_GOOGLE_SHEET_URL || '';
