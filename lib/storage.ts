import { TRIP } from '../trip.config';

/*
 * 每趟行程都部署在同一個網域（<帳號>.github.io/<repo>/），共用同一份 localStorage。
 * 所以每個鍵都加上行程 id 當前綴——不然開了 B 行程，A 行程的打勾、購物清單、
 * 記帳密鑰就會被覆蓋或清掉。
 *
 * 讀寫都包 try/catch：無痕模式或儲存空間被封鎖時 localStorage 會直接丟錯，
 * 這時退回預設值，App 照常能用，只是不會記住。
 */

const scoped = (name: string) => `${TRIP.id}:${name}`;

export function readStored<T>(name: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(scoped(name));
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch (e) {
    console.error(`讀取 ${name} 失敗，改用預設值`, e);
    return fallback;
  }
}

export function writeStored(name: string, value: unknown): void {
  try {
    localStorage.setItem(scoped(name), JSON.stringify(value));
  } catch (e) {
    console.error(`儲存 ${name} 失敗`, e);
  }
}

export function removeStored(name: string): void {
  try {
    localStorage.removeItem(scoped(name));
  } catch (e) {
    console.error(`清除 ${name} 失敗`, e);
  }
}
