import { DaySchedule, ChecklistItem, LocationDetail, UsefulLink, EmergencyContact, Voucher, WeatherSpot } from './types';

/*
 * ============================================================
 *  東京・仙台 秋日紅葉之旅（2026/11/19–11/24）
 *  資料來源：東京仙台秋日紅葉之旅_2026_App完整建置資料.md（2026/11/14 整理）
 *
 *  - 日期寫 '月/日'，年份在 trip.config.ts，星期幾自動算
 *  - 改完跑 `npm run check`
 *
 *  狀態標示（寫在 note 開頭，卡片上第一眼就看得到）：
 *    【已購】【已預約】【尚未預約】【待確認】【彈性】
 *  ★（isHighlight）只給「已訂而且時間固定」的：はやぶさ 101、排球展、排球少年咖啡廳、返台班機
 *  「目標班次」一律標【待確認】，出發前核對官方時刻表才拿掉。
 *  營業時間、御朱印受理時間、店址沒有查證前一律不填，不要用猜的。
 *
 *  ⚠️ repo 可能是公開的：住宿只寫代稱（東京飯店、仙台飯店），
 *  真名、地址、電話放 private/accommodation.json；訂位代號、QR、取票代碼放雲端硬碟。
 * ============================================================
 */

/** Google 地圖搜尋連結 */
const map = (query: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

/* 「準備」頁最上方的提醒 */
export const PRE_TRIP_NOTES: string[] = [
  '御朱印是這趟的重點：盡量配合各神社寺院授與所的時間，御朱印與已預約的活動，優先於餐廳排隊和購物',
  '已買的指定列車和已預約的活動不能動：はやぶさ 101、排球展、排球少年咖啡廳、返台班機',
  'Klook 新幹線的 QR Code 是「取票」用，不能直接刷進閘門。11/21 晚上就要在上野站換成紙票',
  '高尾山票（TAMa-GO）是要即時連網的電子票，不是 Suica，不能用截圖代替，11/21 之前不要啟用',
  'Nintendo TOKYO 只停 30 分鐘；松島不安排遊船；極樂湯不能刪',
  '行程時間都是日本時間，只有回台抵達是台灣時間',
  '記帳不要重複：同一筆合購訂單，不要又在個別電子票各記一次總金額',
];

/* 出發前待辦（資料第六、十章）。改了內容記得把 trip.config.ts 的 seedVersion 往上加 */
export const TODO_LIST: ChecklistItem[] = [
  // ── 高優先 ──
  { id: 'todo_1', text: '安寶 eSIM 購買' },
  { id: 'todo_2', text: '婷寶 eSIM 購買' },
  { id: 'todo_3', text: '確認兩支手機支援 eSIM、效期從安裝還是連網開始算' },
  { id: 'todo_4', text: '安裝或保存 eSIM 啟用資訊' },
  { id: 'todo_5', text: '預約 11/20 19:30 新宿壽喜燒（すき焼き 伊吹，2 人）' },
  { id: 'todo_6', text: '預約 11/21 約 19:00 WAGYU SUKIYAKI 極（2 人）' },
  { id: 'todo_7', text: '排球少年咖啡廳：正式店名、地址、報到與取消規則' },
  { id: 'todo_8', text: '確認 11/20 排球展入場憑證' },
  { id: 'todo_9', text: '補去回程機票、兩間飯店訂房單' },
  { id: 'todo_10', text: 'Klook Skyliner：憑證核發與兌換規則' },
  { id: 'todo_11', text: 'Klook 新幹線：取票 QR Code／17 位數代碼' },
  { id: 'todo_12', text: '上野站可取票的售票機位置與營業時間' },
  { id: 'todo_13', text: '日暮里大型行李寄放處與取件期限' },
  // ── 交通與營業時間查證 ──
  { id: 'todo_14', text: '核對 11/19 天王寺御朱印時間、谷中商店閉店時間' },
  { id: 'todo_15', text: '核對 11/20 赤城神社（官網沒寫）、花園神社御朱印時間' },
  { id: 'todo_16', text: '確認 Nintendo TOKYO 當天要不要入店整理券' },
  { id: 'todo_17', text: '確認高尾山纜車、吊椅、極樂湯營業時間' },
  { id: 'todo_19', text: '核對 11/22 松島寺院御朱印與步行時間' },
  { id: 'todo_20', text: '確認仙台站到排球少年咖啡廳的最快交通' },
  { id: 'todo_21', text: '核對 11/23 山寺 08:18、12:21 班次與御朱印受理' },
  { id: 'todo_22', text: '核對 11/23 大崎八幡宮→瑞鳳殿交通、點燈與御集印時間' },
  // ── 一般準備 ──
  { id: 'todo_24', text: 'Visit Japan Web' },
  { id: 'todo_25', text: '日圓現金、Suica 儲值' },
  { id: 'todo_26', text: '旅遊保險' },
  { id: 'todo_27', text: '確認航空公司兩件大行李的託運額度' },
];

/* 行李清單：沿用名古屋版，補上東北 11 月保暖、登山、泡湯、御朱印 */
export const PACKING_CARRY_ON: ChecklistItem[] = [
  { id: 'co_1', text: '充電用具（手機、手錶、行充）' },
  { id: 'co_2', text: '護照' },
  { id: 'co_3', text: '信用卡' },
  { id: 'co_4', text: '錢包（日幣）' },
  { id: 'co_5', text: '耳機' },
  { id: 'co_6', text: '行動電源（高尾山電子票要一直連網）' },
  { id: 'co_7', text: '保溫杯' },
  { id: 'co_8', text: '牙線棒' },
  { id: 'co_9', text: '護唇膏' },
  { id: 'co_10', text: '雨具' },
  { id: 'co_11', text: '袖珍包面紙' },
  { id: 'co_12', text: '口罩' },
  { id: 'co_13', text: '眼藥水' },
  { id: 'co_14', text: '防曬用品（外套袖套）' },
  { id: 'co_15', text: '登山鞋（高尾山、山寺）' },
  { id: 'co_16', text: '御朱印帳' },
];

export const PACKING_CHECKED: ChecklistItem[] = [
  { id: 'ch_1', text: '浴巾、毛巾' },
  { id: 'ch_2', text: '錢包（台幣）' },
  { id: 'ch_3', text: '換洗衣物（衣褲鞋襪）' },
  { id: 'ch_4', text: '行李袋（備用，購物用）' },
  { id: 'ch_5', text: '保養品（卸妝、小藍瓶、凝露）' },
  { id: 'ch_6', text: '化妝品（DD、遮瑕、眼線、腮紅、口紅）' },
  { id: 'ch_7', text: '防曬噴霧' },
  { id: 'ch_8', text: '護髮' },
  { id: 'ch_9', text: '牙刷牙膏' },
  { id: 'ch_10', text: '折疊衣架' },
  { id: 'ch_11', text: '毛夾、髮夾、髮圈' },
  { id: 'ch_12', text: '梳子' },
  { id: 'ch_13', text: '睡衣' },
  { id: 'ch_14', text: '藥品（內外用、痠痛藥）' },
  { id: 'ch_15', text: '小洗衣板' },
  { id: 'ch_16', text: '離子夾' },
  { id: 'ch_17', text: '定型液' },
  { id: 'ch_18', text: '指甲剪' },
  { id: 'ch_19', text: '保暖外套（東北 11 月）' },
  { id: 'ch_20', text: '泡湯替換衣物（極樂湯）' },
];

/* 「資訊」頁的常用連結 */
export const USEFUL_LINKS: UsefulLink[] = [
  { title: 'Visit Japan Web（入境手續）', url: 'https://vjw-lp.digital.go.jp/zh-hant/' },
  { title: 'TAMa-GO（高尾山電子票）', url: 'https://www.keio-eticket-ss.com/' },
  { title: 'えきねっと（新幹線取票）', url: 'https://www.eki-net.com/' },
];

/*
 * 旅遊憑證：訂房單、機票、票券的雲端連結，依行程先後排序。
 * 目前都還待補（資料第九章），空陣列時「準備」頁不顯示這一區。
 * 雲端檔案設「限定對象」，不要設「知道連結的人都能看」。
 */
export const VOUCHERS: Voucher[] = [];

/* 標題列天氣：每天顯示「人在戶外最久的地方」此刻的氣溫 */
export const WEATHER_SPOTS: WeatherSpot[] = [
  { date: '11/19', label: '東京', latitude: 35.7128, longitude: 139.7732 },
  { date: '11/20', label: '東京', latitude: 35.6785, longitude: 139.6823 },
  { date: '11/21', label: '高尾山', latitude: 35.6251, longitude: 139.2436 },
  { date: '11/22', label: '松島', latitude: 38.3680, longitude: 141.0636 },
  { date: '11/23', label: '山寺', latitude: 38.3127, longitude: 140.4370 },
  { date: '11/24', label: '仙台', latitude: 38.2682, longitude: 140.8694 },
];

export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  { title: '警察', number: '110' },
  { title: '救護/火警', number: '119' },
  { title: '訪日外國人急難熱線 (JNTO)', number: '050-3816-2787', note: '24小時多語種對應' },
  { title: '臺北駐日經濟文化代表處', number: '+81-3-3280-7811' },
];

/*
 * 地點詳情：行程事件用 locationId 連過來，點開事件會看到。
 * 取票、電子票的操作步驟（資料第五章）也放在這裡，當天打開就能照著做。
 */
export const LOCATION_DETAILS: Record<string, LocationDetail> = {
  // ===== 住宿（只寫代稱）=====
  'hotel_tokyo': {
    id: 'hotel_tokyo',
    title: '東京飯店',
    description: '11/19 入住、11/22 退房（3 晚）。銀座線稻荷町站 3 號出口步行約 4 分鐘。\n完整名稱、地址、電話在 Word 行程表；訂房單待補。\n11/22 06:45 就要退房出發。',
    mapUrl: map('稲荷町駅'),
  },
  'hotel_sendai': {
    id: 'hotel_sendai',
    title: '仙台飯店',
    description: '11/22 入住、11/24 退房（2 晚）。JR 仙台站西口步行約 4–5 分鐘，鄰近地下鐵仙台站西 1 出口。\n櫃檯在 4 樓。\n11/22 一抵達先寄放兩件大型行李，寄完直接走到 JR あおば通駅搭仙石線，不用折返仙台站。\n11/24 約 12:45 回來取行李。\n完整名稱、地址、電話在 Word 行程表；訂房單待補。',
    mapUrl: map('仙台駅 西口'),
  },

  // ===== 交通與票券 =====
  'skyliner': {
    id: 'skyliner',
    title: 'Skyliner 兌票（成田 T2 B1F 京成站）',
    description: '【已購】Klook 成人 2 張，共 NT$856，空港第2ビル → 日暮里。目前沒有指定座位。\n\n步驟：\n1. 入境、領完行李\n2. 打開 Klook Skyliner 訂單，依規則「核發」兌換憑證（為了保留取消彈性，還沒手動核發）\n3. 到 T2 B1F 京成車站的兌換窗口或可用設備\n4. 出示 Klook 憑證，選實際搭得上的班次，換兩張指定席車票\n5. 核對日期、時間、車廂、座位再進站\n\n⚠️ 不保證搭得到 14:22；Skyliner 全車指定席，要依兌票劃位結果搭乘。\n⚠️ 核發憑證可能影響取消條件，依 Klook 訂單規定。\n⚠️ 不要把 Skyliner 憑證和新幹線取票 QR 搞混。',
    mapUrl: map('空港第2ビル駅'),
  },
  'nippori_luggage': {
    id: 'nippori_luggage',
    title: '日暮里 寄放大型行李',
    description: '兩個 26–28 吋行李。\n⚠️ 需確認大型置物櫃或寄放處、取件期限。優先保住神社與行李取件，咖啡廳和購物可以縮短。',
    mapUrl: map('日暮里駅'),
  },
  'takao_kippu': {
    id: 'takao_kippu',
    title: '京王 高尾山きっぷ（TAMa-GO 電子票）',
    description: '【已購・已分票】京王線発 高尾山きっぷ（新宿駅発），成人 2 張共 ¥2,180，台新 Richart 付款。安寶、婷寶各自帳號裡有 1 張未使用的票。\n內含：京王線新宿 ↔ 高尾山口來回，加纜車或吊椅單程一次。這次用在「纜車上山」；吊椅下山另買，極樂湯另付。\n\n步驟：\n1. 11/21 當天各自用自己的手機登入 TAMa-GO\n2. 點「デジタルチケット一覧」，打開自己的高尾山きっぷ\n3. 依畫面開始使用，顯示即時 QR Code\n4. 在京王線的 QR 驗票機使用；到高尾山後依頁面指示使用纜車單程\n5. 回程京王線也是用這張，保留到回新宿\n\n⚠️ 每人要有自己的手機和網路；不能用截圖代替；11/21 之前不要啟用；不是 Suica 也不是 Apple Wallet 票券。帶行動電源。',
    websiteUrl: 'https://www.keio-eticket-ss.com/',
    mapUrl: map('高尾山口駅'),
  },
  'shinkansen_pickup': {
    id: 'shinkansen_pickup',
    title: '上野站 領 11/22 新幹線紙票',
    description: '【已購・待領紙票】Klook，11/22 はやぶさ 101，上野 07:22 → 仙台 08:49，8 號車 12A、12B。\n\n⚠️ Klook 的取票 QR Code 不能直接刷進新幹線閘門，一定要先換成紙票。\n⚠️ 19:30–21:00 只是行程安排的時段，不是已確認的售票機營業時間，要先查機器位置與可用時段。\n\n步驟：\n1. 在上野站找有「えきねっと」標示的指定席券売機\n2. 選語言，選預約車票領取\n3. 選えきねっと預約取票\n4. 掃 Klook 訂單裡的取票 QR Code；掃不到就輸入 17 位數取票代碼\n5. 核對 11/22、07:22、はやぶさ 101、8 號車、12A／12B\n6. 按「この予約を発券する」\n7. 拿齊所有紙票，逐張核對\n\n紙票可能是每人「乗車券 1 張＋特急券 1 張」共 4 張，以機器印出為準；張數不對就問 JR 站務員。\n今晚取票失敗的話，當晚就要找替代方式，不要拖到隔天清晨。',
    mapUrl: map('上野駅'),
  },
  'hayabusa101': {
    id: 'hayabusa101',
    title: '東北新幹線 はやぶさ 101',
    description: '06:40 先確認兩人的紙票都帶齊；07:00 前到上野站新幹線剪票口附近。\n如果乗車券和特急券是分開印的，進閘門時把同一個人的兩張一起投入，記得取回退出的票。到仙台出站前都要留著。',
    reservation: {
      id: 'はやぶさ 101',
      sections: [
        {
          title: '11/22（日）',
          items: [
            { label: '上野', value: '07:22 發車', isFullWidth: true },
            { label: '仙台', value: '08:49 抵達', isFullWidth: true },
            { label: '車廂', value: '8 號車' },
            { label: '座位', value: '12A／12B' },
          ],
        },
      ],
    },
  },
  'senseki_line': {
    id: 'senseki_line',
    title: 'JR 仙石線（あおば通 → 本塩釜）',
    description: '仙台寄行李的建議走法：新幹線出站 → 仙台站西口 → 飯店 4 樓寄行李 → 步行到 JR あおば通駅 → 搭 09:28。\n時間估算：08:49–08:58 出站；08:58–09:06 步行；09:06–09:13 寄行李；09:13–09:23 走到月台；09:28 發車。都是理想情況，不保證。\n班次已對過 JR 東日本 2026 年 11 月時刻表（土休日）：09:28、09:46、09:56、10:08 都會停本塩釜。',
    mapUrl: map('あおば通駅'),
  },
  'jx863': {
    id: 'jx863',
    title: '回程 星宇 JX863',
    description: '仙台 17:25（日本時間）→ 桃園 20:35（台灣時間）。訂位代號待補。\n機場線已對過 JR 東日本 2026 年 11 月時刻表（平日）：14:30 → 仙台空港 14:57，每 20 分鐘一班。\n⚠️ 行李託運與報到要留充裕時間。',
    address: '仙台空港',
    mapUrl: map('仙台空港'),
    reservation: {
      id: 'JX863',
      sections: [
        {
          title: '11/24（二）',
          items: [
            { label: '仙台 SDJ', value: '17:25 起飛（日本時間）', isFullWidth: true },
            { label: '桃園 TPE', value: '20:35 抵達（台灣時間）', isFullWidth: true },
          ],
        },
      ],
    },
  },

  // ===== Day 1 谷中・根津 =====
  'tennoji': { id: 'tennoji', title: '天王寺（谷中）', description: '參拜、御朱印。御朱印時間待核對。', mapUrl: map('天王寺 台東区谷中') },
  'nezu_jinja': {
    id: 'nezu_jinja',
    title: '根津神社',
    description: '參拜、御朱印。\n⚠️ 11 月授與所 16:30 就結束（官網）。行程 16:05 到，緩衝很少。\nSkyliner 搭晚了或寄行李太久，就先跳過天王寺，直接來這裡。這天優先保住神社，咖啡廳和購物可以縮短。',
    openingHours: '唐門 6:00–17:00｜授與所 9:30–16:30（11–12 月）',
    websiteUrl: 'https://nedujinja.or.jp/openclose/',
    mapUrl: map('根津神社'),
  },
  'kissa_nikai': { id: 'kissa_nikai', title: '喫茶ニカイ（Kissaten NIKAI）', description: '咖啡、甜點。', mapUrl: map('喫茶ニカイ 谷中') },
  'yanaka_shops': {
    id: 'yanaka_shops',
    title: '谷中散步：東京キッチュ・YUZURIHA・谷中銀座・松野屋',
    description: '時間不夠可以縮短。各店閉店時間待核對。',
    mapUrl: map('谷中銀座商店街'),
  },
  'egg_baby_cafe': { id: 'egg_baby_cafe', title: 'egg baby cafe', description: '晚餐，現場候位，沒有訂位。', mapUrl: map('egg baby cafe') },

  // ===== Day 2 六本木・新宿 =====
  'cafe_lapin': { id: 'cafe_lapin', title: 'Cafe Lapin', description: '早餐。', mapUrl: map('Cafe Lapin 東京') },
  'haikyu_ten': {
    id: 'haikyu_ten',
    title: '排球少年展覽（六本木）',
    description: '固定時段 10:30–12:30，旅伴可以自由活動。\n10:00 前備好入場憑證（憑證待補）。',
    mapUrl: map('ハイキュー 展 六本木'),
  },
  'roppongi_hills': { id: 'roppongi_hills', title: '六本木 Hills', description: '會合、午餐，現場選餐廳。', mapUrl: map('六本木ヒルズ') },
  'gaien_icho': { id: 'gaien_icho', title: '神宮外苑 銀杏並木', description: '賞銀杏。', mapUrl: map('明治神宮外苑 いちょう並木') },
  'yasukuni': { id: 'yasukuni', title: '靖國神社', description: '御朱印。', mapUrl: map('靖國神社') },
  'akagi_jinja': {
    id: 'akagi_jinja',
    title: '赤城神社',
    description: '官網沒有寫受理時間。非官方資料：社務所 9:00–17:00，照這個時間 16:10 到來得及；不確定的話可以先打電話問 03-3260-5071。\n原本的神樂坂散步已經移出行程。',
    mapUrl: map('赤城神社 新宿区'),
  },
  'nintendo_tokyo': {
    id: 'nintendo_tokyo',
    title: 'Nintendo TOKYO（澀谷 PARCO 6F）',
    description: '只安排 30 分鐘（17:10–17:40）。\n如果有入店管制，停留時間可能受影響；要不要整理券待確認。',
    mapUrl: map('Nintendo TOKYO 渋谷PARCO'),
  },
  'hanazono_jinja': { id: 'hanazono_jinja', title: '花園神社', description: '參拜。御朱印不保證。', mapUrl: map('花園神社 新宿') },
  'golden_gai': { id: 'golden_gai', title: '新宿 Golden Gai', description: '街區散步。', mapUrl: map('新宿ゴールデン街') },
  'sukiyaki_ibuki': {
    id: 'sukiyaki_ibuki',
    title: 'すき焼き 伊吹（候選）',
    description: '【尚未預約】建議訂 11/20 19:30、2 人。訂好後補地址、訂位編號、取消規則。',
    mapUrl: map('すき焼き 伊吹 新宿'),
  },

  // ===== Day 3 高尾山・神田・藏前 =====
  'takao_cable': {
    id: 'takao_cable',
    title: '高尾山纜車（Cable Car）',
    description: '上山用高尾山きっぷ裡的單程資格。\n⚠️ 賞楓旺季的週六、又是三連休第一天，纜車和吊椅可能大排長龍。御朱印與極樂湯優先於藏前購物。',
    mapUrl: map('高尾山ケーブルカー 清滝駅'),
  },
  'yakuoin': { id: 'yakuoin', title: '高尾山藥王院', description: '御朱印。', mapUrl: map('高尾山薬王院') },
  'takao_summit': { id: 'takao_summit', title: '高尾山頂', description: '賞楓、拍照、補給。', mapUrl: map('高尾山 山頂') },
  'echo_lift': {
    id: 'echo_lift',
    title: '雙人 Echo Lift 吊椅（下山）',
    description: '【需另買單程票】現場購買，要算進排隊時間。',
    mapUrl: map('高尾山 リフト 山上駅'),
  },
  'gokurakuyu': {
    id: 'gokurakuyu',
    title: '京王高尾山溫泉 極樂湯',
    description: '【必留・現場付費】記得帶泡湯替換衣物。營業時間待確認。',
    mapUrl: map('京王高尾山温泉 極楽湯'),
  },
  'kanda_myojin': { id: 'kanda_myojin', title: '神田明神', description: '御朱印。', mapUrl: map('神田明神') },
  'kuramae': { id: 'kuramae', title: '藏前 商店、甜甜圈', description: '可以縮短。', mapUrl: map('蔵前駅') },
  'wagyu_kiwami': {
    id: 'wagyu_kiwami',
    title: 'WAGYU SUKIYAKI 極',
    description: '【尚未預約】2 人，可以考慮訂 19:00。高尾山旺季可能延誤，訂位不要太早。',
    mapUrl: map('WAGYU SUKIYAKI 極'),
  },

  // ===== Day 4 鹽竈・松島・仙台 =====
  'shiogama_jinja': { id: 'shiogama_jinja', title: '鹽竈神社', description: '參拜、御朱印。', mapUrl: map('鹽竈神社') },
  'zuiganji': { id: 'zuiganji', title: '瑞巖寺', description: '御朱印（松島第一優先）。御朱印時間待核對。', mapUrl: map('瑞巌寺 松島') },
  'entsuin': { id: 'entsuin', title: '圓通院', description: '御朱印（松島第二優先）。', mapUrl: map('円通院 松島') },
  'godaido': { id: 'godaido', title: '五大堂', description: '有時間才去，可以刪。不安排遊船。', mapUrl: map('五大堂 松島') },
  'haikyu_cafe': {
    id: 'haikyu_cafe',
    title: '排球少年咖啡廳（仙台）',
    description: '【已預約】16:00，不能隨便延後。\n⚠️ 正式店名、地址、預約代號、報到規則都待補——一定要在出發前拿到地址。\n松島海岸 14:53 → 仙台 15:31，再到店裡的交通是這天最大的風險；必要時搭計程車。',
  },
  'sendai_shopping': { id: 'sendai_shopping', title: '一番町・Clis Road・仙台 PARCO', description: '逛街，晚餐在 PARCO 9F 一帶現場選。', mapUrl: map('仙台 クリスロード') },

  // ===== Day 5 山寺・仙台 =====
  'yamadera': {
    id: 'yamadera',
    title: '寶珠山立石寺（山寺）',
    description: '登山、御朱印、賞景。\n⚠️ 11/23 是日本國定假日。登山時間和 12:21 回程很緊，11:50 左右就要準備往車站。體力、天候、交通要現場再評估。',
    mapUrl: map('山寺 立石寺'),
  },
  'sendai_toshogu': { id: 'sendai_toshogu', title: '仙台東照宮', description: '御朱印。', mapUrl: map('仙台東照宮') },
  'osaki_hachimangu': { id: 'osaki_hachimangu', title: '大崎八幡宮', description: '御朱印。前後的交通路線待細排。', mapUrl: map('大崎八幡宮') },
  'zuihoden': {
    id: 'zuihoden',
    title: '瑞鳳殿（紅葉點燈）',
    description: '【尚未購票】\n⚠️ 夜間開放不代表御集印窗口也延長，受理時間要另外核對。',
    mapUrl: map('瑞鳳殿'),
  },

  // ===== Day 6 仙台・返台 =====
  'sakuraoka': { id: 'sakuraoka', title: '櫻岡大神宮', description: '御朱印。', mapUrl: map('櫻岡大神宮') },
  'sendai_castle': { id: 'sendai_castle', title: '仙台城跡・伊達政宗像', description: '拍照。', mapUrl: map('仙台城跡') },
  'gyutan_street': {
    id: 'gyutan_street',
    title: '仙台站 牛舌通',
    description: '現場候位，排太久就換一家。不要影響去機場的時間。',
    mapUrl: map('仙台駅 牛たん通り'),
  },
};

/*
 * 每日行程。
 * category：transit 交通／food 美食／event 活動／spot 景點／stay 住宿
 */
export const ITINERARY: DaySchedule[] = [
  {
    date: '11/19',
    title: '成田・日暮里・谷中・根津',
    accommodation: '東京飯店',
    accommodationMapUrl: map('稲荷町駅'),
    events: [
      { time: '12:35', description: '抵達成田機場 T2', category: 'transit', note: '去程航班號碼待補。落地先打開 eSIM 測試網路' },
      { time: '12:35', description: '入境、領行李、簡單午餐', category: 'transit', note: '12:35–14:00，入境時間不確定' },
      { time: '14:00', description: '到 B1F 京成車站兌換 Skyliner', category: 'transit', locationId: 'skyliner', note: '約 14:00。先在 Klook 核發憑證再兌票，步驟點開看' },
      {
        time: '14:22', description: '空港第2ビル → 日暮里 15:05', category: 'transit', locationId: 'skyliner',
        note: '【已購・未劃位】目標班次，兌票時依現場選車次',
        origin: '空港第2ビル',
        legs: [{ via: 'Skyliner', to: '日暮里', arrive: '15:05' }],
        alternatives: [
          { when: '入境很快', detail: '14:02 發車' },
          { when: '正常', detail: '14:22 發車 → 日暮里 15:05', isPlan: true },
          { when: '入境較慢', detail: '14:42 發車，或其他搭得上的班次' },
        ],
      },
      { time: '15:05', description: '日暮里寄放兩件大型行李', category: 'stay', locationId: 'nippori_luggage', note: '【待確認】15:05–15:25，寄放處與取件期限要先查' },
      { time: '15:30', description: '天王寺', category: 'spot', locationId: 'tennoji', note: '15:30–15:40，參拜、御朱印' },
      { time: '15:40', description: '步行往根津神社', category: 'transit', note: '15:40–16:05' },
      { time: '16:05', description: '根津神社', category: 'spot', locationId: 'nezu_jinja', note: '⚠️ 授與所 16:30 結束（官網）。16:05–16:25，參拜、御朱印' },
      { time: '16:40', description: '喫茶ニカイ', category: 'food', locationId: 'kissa_nikai', note: '【彈性】16:40–17:20，咖啡、甜點' },
      { time: '17:30', description: '東京キッチュ・YUZURIHA・谷中銀座・松野屋', category: 'spot', locationId: 'yanaka_shops', note: '【彈性】17:30–18:20，時間不夠可縮短' },
      { time: '18:25', description: '日暮里領回大型行李', category: 'stay', locationId: 'nippori_luggage', note: '18:25–18:40，確認取件期限' },
      { time: '18:40', description: '前往東京飯店 Check-in', category: 'stay', locationId: 'hotel_tokyo' },
      { time: '19:30', description: 'egg baby cafe 晚餐', category: 'food', locationId: 'egg_baby_cafe', note: '約 19:30，現場候位' },
    ],
  },
  {
    date: '11/20',
    title: '六本木・銀杏・御朱印・任天堂・新宿',
    accommodation: '東京飯店',
    accommodationMapUrl: map('稲荷町駅'),
    events: [
      { time: '08:30', description: 'Cafe Lapin 早餐', category: 'food', locationId: 'cafe_lapin', note: '08:30–09:00' },
      { time: '09:00', description: '前往六本木', category: 'transit', note: '09:00–10:15，預留入場時間' },
      { time: '10:30', description: '排球少年展覽', category: 'event', isHighlight: true, locationId: 'haikyu_ten', note: '固定時段 10:30–12:30。10:00 前備好入場憑證' },
      { time: '12:30', description: '六本木 Hills 會合、午餐', category: 'food', locationId: 'roppongi_hills', note: '12:30–13:30，現場選餐廳' },
      { time: '13:50', description: '神宮外苑 銀杏並木', category: 'spot', locationId: 'gaien_icho', note: '13:50–14:30，賞銀杏' },
      { time: '14:55', description: '靖國神社', category: 'spot', locationId: 'yasukuni', note: '14:55–15:35，御朱印' },
      { time: '15:35', description: '前往赤城神社', category: 'transit', note: '15:35–16:10' },
      { time: '16:10', description: '赤城神社', category: 'spot', locationId: 'akagi_jinja', note: '【待確認】16:10–16:30，御朱印。非官方資料社務所到 17:00' },
      { time: '16:30', description: '前往澀谷', category: 'transit', note: '16:30–17:10' },
      { time: '17:10', description: 'Nintendo TOKYO', category: 'spot', locationId: 'nintendo_tokyo', note: '只停 30 分鐘（17:10–17:40），澀谷 PARCO 6F' },
      { time: '17:40', description: '前往新宿', category: 'transit', note: '17:40–18:15' },
      { time: '18:15', description: '花園神社', category: 'spot', locationId: 'hanazono_jinja', note: '18:15–18:40，參拜；御朱印不保證' },
      { time: '18:40', description: 'Golden Gai／新宿街區散步', category: 'spot', locationId: 'golden_gai', note: '18:40–19:20' },
      { time: '19:30', description: '新宿壽喜燒（すき焼き 伊吹・候選）', category: 'food', locationId: 'sukiyaki_ibuki', note: '【尚未預約】19:30–20:30，建議訂 2 人' },
      { time: '20:30', description: 'Bic Camera、回飯店', category: 'spot', note: '20:30 後，以營業時間為準' },
    ],
  },
  {
    date: '11/21',
    title: '高尾山・極樂湯・神田明神・藏前',
    accommodation: '東京飯店',
    accommodationMapUrl: map('稲荷町駅'),
    events: [
      {
        time: '07:05', description: '上野 → 高尾山口 08:34', category: 'transit', locationId: 'takao_kippu',
        note: '【待確認】京王線新宿 07:39 是目標班次。出門前兩人各自打開 TAMa-GO 確認票、網路、電量',
        origin: '上野',
        legs: [
          { via: 'JR 山手線', to: '新宿' },
          { via: '京王線（北野轉乘）', to: '高尾山口', arrive: '08:34' },
        ],
      },
      { time: '08:45', description: '纜車上山', category: 'transit', locationId: 'takao_cable', note: '約 08:45，用高尾山きっぷ的單程資格' },
      { time: '09:15', description: '高尾山藥王院', category: 'spot', locationId: 'yakuoin', note: '09:15–09:50，御朱印' },
      { time: '09:50', description: '前往山頂', category: 'transit', note: '09:50–10:20' },
      { time: '10:20', description: '高尾山頂 賞楓', category: 'spot', locationId: 'takao_summit', note: '10:20–11:00，拍照、補給' },
      { time: '11:00', description: '步行往吊椅山上站', category: 'transit', note: '11:00–11:35' },
      { time: '11:35', description: '雙人 Echo Lift 吊椅下山', category: 'transit', locationId: 'echo_lift', note: '【需另買單程票】11:35–12:20，含排隊時間' },
      { time: '12:30', description: '京王高尾山溫泉 極樂湯', category: 'spot', locationId: 'gokurakuyu', note: '【必留・現場付費】12:30–13:30' },
      { time: '14:00', description: '返回東京，往御茶之水', category: 'transit', locationId: 'takao_kippu', note: '14:00 後，京王線回程用高尾山きっぷ' },
      { time: '15:30', description: '神田明神', category: 'spot', locationId: 'kanda_myojin', note: '15:30–16:00，御朱印' },
      { time: '16:30', description: '藏前 商店、甜甜圈', category: 'spot', locationId: 'kuramae', note: '【彈性】16:30–18:00，可縮短' },
      { time: '18:35', description: 'WAGYU SUKIYAKI 極', category: 'food', locationId: 'wagyu_kiwami', note: '【尚未預約】18:35–19:35，可考慮訂 19:00' },
      { time: '晚餐後', description: 'JR 上野站 領 11/22 新幹線紙票', category: 'transit', locationId: 'shinkansen_pickup', note: '⚠️ 關鍵任務。先查售票機位置與營業時間，步驟點開看' },
    ],
  },
  {
    date: '11/22',
    title: '仙台・鹽竈・松島・排球少年咖啡廳',
    accommodation: '仙台飯店',
    accommodationMapUrl: map('仙台駅 西口'),
    events: [
      { time: '06:45', description: '東京飯店退房、前往上野', category: 'stay', locationId: 'hotel_tokyo', note: '06:40 先確認兩人紙票帶齊；07:00 前到新幹線剪票口附近' },
      {
        time: '07:22', description: '上野 → 仙台 08:49', category: 'transit', isHighlight: true, locationId: 'hayabusa101',
        note: '【已購】はやぶさ 101，8 號車 12A／12B',
        origin: '上野',
        legs: [{ via: '東北新幹線 はやぶさ 101', to: '仙台', arrive: '08:49' }],
      },
      { time: '08:49', description: '仙台飯店寄放兩件大型行李', category: 'stay', locationId: 'hotel_sendai', note: '08:49–09:15，目標時間、偏緊。寄完直接走到あおば通駅' },
      {
        time: '09:28', description: 'あおば通 → 本塩釜 09:59', category: 'transit', locationId: 'senseki_line',
        note: '【已核對】石巻行普通；趕不上就搭後面的',
        origin: 'あおば通',
        legs: [{ via: 'JR 仙石線', to: '本塩釜', arrive: '09:59' }],
        alternatives: [
          { when: '順利', detail: '09:28 → 本塩釜 09:59（石巻行）', isPlan: true },
          { when: '寄行李較慢', detail: '09:46 → 本塩釜 10:19（東塩釜行）' },
          { when: '再晚一點', detail: '09:56 → 本塩釜 10:27（高城町行）' },
          { when: '更晚', detail: '10:08 → 本塩釜 10:39（松島海岸行）' },
        ],
      },
      { time: '10:15', description: '鹽竈神社', category: 'spot', locationId: 'shiogama_jinja', note: '10:15–11:20，參拜、御朱印' },
      { time: '11:20', description: '回本塩釜站，沿途簡單午餐', category: 'food', note: '隨便吃，不指定餐廳、不訂位，便利商店也可以' },
      {
        time: '12:39', description: '本塩釜 → 松島海岸 12:49', category: 'transit',
        note: '【已核對】松島海岸行普通',
        origin: '本塩釜',
        legs: [{ via: 'JR 仙石線', to: '松島海岸', arrive: '12:49' }],
        alternatives: [
          { when: '原定', detail: '12:39 → 松島海岸 12:49', isPlan: true },
          { when: '錯過', detail: '12:59 → 松島海岸 約 13:09（石巻行）' },
        ],
      },
      { time: '13:00', description: '瑞巖寺', category: 'spot', locationId: 'zuiganji', note: '13:00–13:45，御朱印（第一優先）' },
      { time: '13:50', description: '圓通院', category: 'spot', locationId: 'entsuin', note: '13:50–14:20，御朱印' },
      { time: '14:20', description: '五大堂', category: 'spot', locationId: 'godaido', note: '【彈性】14:20–14:35，有時間才去' },
      { time: '14:40', description: '回到松島海岸站', category: 'transit', note: '14:35 就要往車站走，14:40 前到站留候車緩衝' },
      {
        time: '14:53', description: '松島海岸 → 仙台 15:31', category: 'transit',
        note: '⚠️ 關鍵班次【已核對】。能早走就搭 14:32，16:00 咖啡廳比較從容',
        origin: '松島海岸',
        legs: [{ via: 'JR 仙石線', to: '仙台', arrive: '15:31' }],
        alternatives: [
          { when: '提早', detail: '14:32 → 仙台 15:09' },
          { when: '原定', detail: '14:53 → 仙台 15:31', isPlan: true },
          { when: '錯過', detail: '15:10 → 仙台 15:48，16:00 會非常趕' },
        ],
      },
      { time: '15:31', description: '前往排球少年咖啡廳', category: 'transit', locationId: 'haikyu_cafe', note: '店址待補；必要時搭計程車' },
      { time: '16:00', description: '排球少年咖啡廳', category: 'food', isHighlight: true, locationId: 'haikyu_cafe', note: '【已預約】不能隨便延後' },
      { time: '17:20', description: '一番町・Clis Road・PARCO', category: 'spot', locationId: 'sendai_shopping', note: '17:20–19:30，逛街' },
      { time: '19:30', description: 'PARCO 9F 一帶晚餐', category: 'food', note: '現場選' },
      { time: '20:45', description: '仙台飯店 Check-in', category: 'stay', locationId: 'hotel_sendai', note: '約 20:45' },
    ],
  },
  {
    date: '11/23',
    title: '山寺・仙台東照宮・大崎八幡宮・瑞鳳殿',
    accommodation: '仙台飯店',
    accommodationMapUrl: map('仙台駅 西口'),
    events: [
      { time: '早上', description: '仙台站買午餐和飲料', category: 'food', note: '山寺帶輕食' },
      {
        time: '08:18', description: '仙台 → 山寺 09:26', category: 'transit',
        note: '【待確認】目標班次',
        origin: '仙台',
        legs: [{ via: 'JR 仙山線', to: '山寺', arrive: '09:26' }],
      },
      { time: '09:26', description: '步行到山寺登山口', category: 'transit', note: '09:26–09:45' },
      { time: '09:45', description: '寶珠山立石寺（山寺）', category: 'spot', locationId: 'yamadera', note: '09:45–11:45，登山、御朱印、賞景' },
      { time: '11:45', description: '簡單午餐、回車站', category: 'food', note: '11:45–12:15。約 11:50 就要準備回程' },
      {
        time: '12:21', description: '山寺 → 東照宮 13:16', category: 'transit',
        note: '【待確認】重要目標班次',
        origin: '山寺',
        legs: [{ via: 'JR 仙山線', to: '東照宮', arrive: '13:16' }],
      },
      { time: '13:25', description: '仙台東照宮', category: 'spot', locationId: 'sendai_toshogu', note: '13:25–13:55，御朱印' },
      { time: '13:55', description: '前往大崎八幡宮', category: 'transit', note: '13:55–14:40，路線待細排' },
      { time: '14:40', description: '大崎八幡宮', category: 'spot', locationId: 'osaki_hachimangu', note: '14:40–15:15，御朱印' },
      { time: '15:15', description: '前往瑞鳳殿', category: 'transit', note: '15:15–16:15，路線待細排' },
      { time: '16:15', description: '瑞鳳殿 紅葉點燈', category: 'spot', locationId: 'zuihoden', note: '【尚未購票】16:15–17:15，御集印時間待核對' },
      { time: '17:30', description: '仙台晚餐、購物', category: 'food', note: '【彈性】17:30 後' },
    ],
  },
  {
    date: '11/24',
    title: '櫻岡大神宮・仙台城跡・牛舌・返台',
    events: [
      { time: '早上', description: '整理行李、準備退房', category: 'stay', locationId: 'hotel_sendai' },
      {
        time: '08:47', description: '仙台 → 大町西公園 08:51', category: 'transit',
        note: '【待確認】班次待核對',
        origin: '仙台',
        legs: [{ via: '地下鐵東西線', to: '大町西公園', arrive: '08:51' }],
      },
      { time: '09:00', description: '櫻岡大神宮', category: 'spot', locationId: 'sakuraoka', note: '09:00–09:20，御朱印' },
      { time: '09:20', description: '步行上坡往仙台城跡', category: 'transit', note: '09:20–10:00' },
      { time: '10:00', description: '仙台城跡、伊達政宗像', category: 'spot', locationId: 'sendai_castle', note: '10:00–11:00，拍照' },
      { time: '11:00', description: '步行到國際中心站', category: 'transit', note: '11:00–11:25' },
      {
        time: '11:25', description: '國際中心 → 仙台', category: 'transit',
        origin: '國際中心',
        legs: [{ via: '地下鐵東西線', to: '仙台' }],
      },
      { time: '11:40', description: '仙台站牛舌通 午餐', category: 'food', locationId: 'gyutan_street', note: '11:40–12:40，現場候位，太久就換店' },
      { time: '12:45', description: '回飯店取兩件大型行李', category: 'stay', locationId: 'hotel_sendai', note: '約 12:45，同時確認機場線和航班' },
      {
        time: '14:30', description: '仙台 → 仙台空港 14:57', category: 'transit', locationId: 'jx863',
        note: '【已核對】每 20 分鐘一班（:10／:30／:50），想早點到就搭前一班',
        origin: '仙台',
        legs: [{ via: '仙台空港アクセス線（普通）', to: '仙台空港', arrive: '14:57' }],
        alternatives: [
          { when: '想早點到', detail: '14:10 發車（普通約 27 分鐘）' },
          { when: '原定', detail: '14:30 → 仙台空港 14:57', isPlan: true },
          { when: '晚一班', detail: '14:50 → 仙台空港 15:17' },
        ],
      },
      { time: '17:25', description: '星宇 JX863 仙台起飛', category: 'transit', isHighlight: true, locationId: 'jx863', note: '日本時間' },
      { time: '20:35', description: '抵達桃園機場', category: 'transit', note: '台灣時間' },
    ],
  },
];
