import { ExpenseRecord } from '../types';
import { GOOGLE_SCRIPT_URL, GOOGLE_SHEET_NAME } from './env';
import { readStored, writeStored, removeStored } from './storage';

/**
 * 記帳後端（google-apps-script/Code.gs）的唯一進出口。
 *
 * 讀寫兩個方向都用 ExpenseRecord 的欄位名（amountHome、splitAHome…），
 * Code.gs 的 COL 對照表負責把它們放進試算表的哪一欄。兩邊要一起改。
 *
 * 網站是靜態的公開頁面，/exec 網址一定會出現在 bundle 裡，
 * 所以存取密鑰「不能」寫死在程式碼——寫死等於沒鎖。
 * 改成每台裝置輸入一次，存在自己的 localStorage：
 * bundle 裡沒有鑰匙，別人打開網頁只會看到解鎖畫面。
 */

const ACCESS_KEY = 'expense_access_key';

/** GAS 一律回 HTTP 200，驗證失敗只能從 body 判斷 */
export class UnauthorizedError extends Error {
  constructor() {
    super('存取密鑰不正確');
    this.name = 'UnauthorizedError';
  }
}

export const getAccessKey = (): string => readStored<string>(ACCESS_KEY, '');
export const setAccessKey = (key: string): void => writeStored(ACCESS_KEY, key.trim());
export const clearAccessKey = (): void => removeStored(ACCESS_KEY);

/**
 * 從網址 #key=... 收下密鑰並存起來，然後把 hash 清掉。
 * 這樣把解鎖連結傳給旅伴點一下就好，不用口述一串字。
 */
export const consumeKeyFromUrl = (): void => {
  const match = window.location.hash.match(/(?:^#|&)key=([^&]+)/);
  if (!match) return;
  setAccessKey(decodeURIComponent(match[1]));
  history.replaceState(null, '', window.location.pathname + window.location.search);
};

const assertAuthorized = (payload: unknown) => {
  if (payload && typeof payload === 'object' && (payload as { error?: string }).error === 'unauthorized') {
    throw new UnauthorizedError();
  }
  return payload;
};

/** 試算表的儲存格可能是數字、帶逗號的字串或空白，一律轉成數字 */
const toAmount = (cell: unknown): number => {
  const n = Number(String(cell ?? 0).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

/** 試算表裡沒填分帳方式的列（例如直接在 Google 試算表手動新增的）：從兩人負擔額推回來 */
const inferSplitType = (row: Record<string, unknown>): ExpenseRecord['splitType'] => {
  if (row.splitType === 'equal' || row.splitType === 'manual') return row.splitType;
  const a = toAmount(row.splitAHome) || toAmount(row.splitALocal);
  const b = toAmount(row.splitBHome) || toAmount(row.splitBLocal);
  if (a + b <= 0) return 'equal';
  return Math.abs(a / (a + b) - 0.5) < 0.02 ? 'equal' : 'manual';
};

const FIRST_DATA_ROW = 3; // 第 1 列標題、第 2 列欄位名

/** 讀取全部消費，新的在前 */
export const fetchExpenses = async (): Promise<ExpenseRecord[]> => {
  const params = new URLSearchParams({
    t: String(Date.now()), // 避開快取
    sheetName: GOOGLE_SHEET_NAME,
    key: getAccessKey(),
  });
  const res = await fetch(`${GOOGLE_SCRIPT_URL}?${params}`);
  if (!res.ok) throw new Error(`伺服器回應 ${res.status}`);

  const payload = assertAuthorized(await res.json()) as { data?: unknown; error?: string };
  if (payload.error) throw new Error(payload.error);
  if (!Array.isArray(payload.data)) throw new Error('伺服器回傳的格式不對');

  return (payload.data as Record<string, unknown>[])
    .map(row => ({
      rowIndex: Number(row.rowIndex),
      date: String(row.date ?? ''),
      item: String(row.item ?? ''),
      payer: String(row.payer ?? ''),
      amountHome: toAmount(row.amountHome),
      amountLocal: toAmount(row.amountLocal),
      note: String(row.note ?? ''),
      splitType: inferSplitType(row),
      splitAHome: toAmount(row.splitAHome),
      splitALocal: toAmount(row.splitALocal),
      splitBHome: toAmount(row.splitBHome),
      splitBLocal: toAmount(row.splitBLocal),
    }))
    .filter(r => r.rowIndex >= FIRST_DATA_ROW && r.date !== '')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.rowIndex - a.rowIndex);
};

export type ExpenseWrite =
  | ({ action: 'add' } & Omit<ExpenseRecord, 'rowIndex'>)
  | ({ action: 'edit' } & ExpenseRecord)
  | { action: 'delete'; rowIndex: number };

/** 新增／編輯／刪除共用；密鑰與分頁名在這裡補上，呼叫端不用記 */
export const postExpense = async (write: ExpenseWrite): Promise<void> => {
  const res = await fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    // text/plain 才不會觸發 CORS preflight，GAS 不回應 preflight
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ ...write, sheetName: GOOGLE_SHEET_NAME, key: getAccessKey() }),
  });
  if (!res.ok) throw new Error(`伺服器回應 ${res.status}`);

  const payload = assertAuthorized(await res.json().catch(() => null)) as { error?: string } | null;
  if (payload?.error) throw new Error(payload.error);
};
