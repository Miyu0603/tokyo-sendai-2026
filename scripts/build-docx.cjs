/**
 * 從 trip.config.ts + trip.data.ts 產生紙本行程表 .docx（離線備援用）
 *
 *   npm run build:docx
 *
 * 行程資料只有一份，App 與這份文件都從它生成，
 * 所以不會出現「手機上改了、Word 還是舊的」這種漂移。
 *
 * 副檔名是 .cjs：package.json 設了 type: module，.js 會被當成 ESM，require 會失敗。
 * 產出在專案根目錄 行程表-<id>.docx（會先備份舊版），不進版控。
 */

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');
const {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
} = require('docx');

const ROOT = path.resolve(__dirname, '..');

/**
 * 用 esbuild 把行程的 TS 檔打包成 CommonJS 再執行。
 * 以前是用正規表示式剝掉型別再 eval，資料檔多一種寫法就壞；
 * 交給真正的編譯器處理，資料檔怎麼寫都跟 App 的建置結果一致。
 */
function loadTrip() {
  const entry = [
    "export { TRIP } from './trip.config';",
    "export * from './trip.data';",
    "export { toTripIso, weekdayOf } from './lib/tripDates';",
  ].join('\n');

  let result;
  try {
    result = esbuild.buildSync({
      stdin: { contents: entry, resolveDir: ROOT, loader: 'ts' },
      bundle: true,
      format: 'cjs',
      platform: 'node',
      write: false,
      logLevel: 'silent',
      define: { 'import.meta.env': '{}' }, // Vite 專屬語法，Node 裡沒有
    });
  } catch (err) {
    const detail = (err.errors || []).map(e => `  ${e.location?.file ?? ''}:${e.location?.line ?? ''} ${e.text}`).join('\n');
    throw new Error(`讀取行程資料失敗，先跑 npm run check 看是哪裡寫錯：\n${detail || err.message}`);
  }

  const mod = { exports: {} };
  new Function('module', 'exports', 'require', result.outputFiles[0].text)(mod, mod.exports, require);
  return mod.exports;
}

/**
 * 還原住宿真實名稱。
 * repo 是公開的，constants.ts 裡住宿只留代稱；真名放在不進版控的
 * private/accommodation.json。這份 Word 是自己留著的備援，要看得到完整資訊。
 * 檔案不存在就原樣輸出代稱版，不報錯——別台機器 clone 下來一樣跑得動。
 */
function applyPrivateNames(data) {
  const file = path.join(ROOT, 'private', 'accommodation.json');
  if (!fs.existsSync(file)) {
    console.warn('! 找不到 private/accommodation.json，Word 裡的住宿會是代稱');
    return { data, applied: false };
  }

  const { replacements = [], addresses = {} } = JSON.parse(fs.readFileSync(file, 'utf8'));

  const restore = value => {
    if (typeof value === 'string') {
      // replacements 已由長到短排好，先替換長的才不會被短的截掉
      let out = replacements.reduce((acc, [from, to]) => acc.split(from).join(to), value);
      const addr = addresses[out];
      return addr ? `${out}（${addr}）` : out;
    }
    if (Array.isArray(value)) return value.map(restore);
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, restore(v)]));
    }
    return value;
  };

  return { data: restore(data), applied: true };
}

/* ── 版面 ── */
const INK = '2B2B2B';
const WOOD = '5C4033';
const VERMILLION = 'A84836';
const MUTED = '5A5249';
const RULE = 'E4DBCB';
const TINT = 'F2ECE1';

const PAGE_W = 9026;                        // A4 直式扣掉左右邊界後的內容寬（DXA）
const COLS = [1100, 620, 4400, 2906];       // 時間／★○／行程／備註，總和需等於 PAGE_W

const thin = { style: BorderStyle.SINGLE, size: 4, color: RULE };
const CELL_BORDERS = { top: thin, bottom: thin, left: thin, right: thin };
const CELL_MARGINS = { top: 70, bottom: 70, left: 110, right: 110 };

const p = (text, opts = {}) =>
  new Paragraph({
    spacing: { before: opts.before ?? 0, after: opts.after ?? 80, line: 288 },
    alignment: opts.align,
    indent: opts.indent,
    children: [
      new TextRun({
        text,
        bold: opts.bold,
        size: opts.size ?? 19,              // half-points
        color: opts.color ?? INK,
        font: opts.font ?? '游ゴシック',
      }),
    ],
  });

const cell = (text, { bold, color, size, width, shade, align } = {}) =>
  new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: CELL_BORDERS,
    shading: shade ? { type: ShadingType.CLEAR, fill: shade, color: 'auto' } : undefined,
    margins: CELL_MARGINS,
    children: [
      new Paragraph({
        alignment: align,
        spacing: { after: 0, line: 276 },
        children: [new TextRun({ text, bold, size: size ?? 18, color: color ?? INK, font: '游ゴシック' })],
      }),
    ],
  });

/** 多行備註要拆成多個 Paragraph——docx 不吃 \n */
const multiLineCell = (lines, width) =>
  new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: CELL_BORDERS,
    margins: CELL_MARGINS,
    children: (lines.length ? lines : ['']).map(line =>
      new Paragraph({
        spacing: { after: 0, line: 264 },
        children: [new TextRun({ text: line, size: 16, color: MUTED, font: '游ゴシック' })],
      })
    ),
  });

const CAVEAT = /⚠️|務必|不要|注意|公休|預約|要看|先確認|底線|最晚|記得|不能|不收|提前|限/;

/**
 * 每天的「今日要點」：只收真正需要提醒的句子，不是把景點描述整段倒出來。
 * 條件是該景點有營業時間，或描述裡出現警語關鍵字。
 */
function dayNotes(day, LOCATION_DETAILS) {
  const seen = new Set();
  const notes = [];

  for (const ev of day.events) {
    const loc = ev.locationId && LOCATION_DETAILS[ev.locationId];
    if (!loc || seen.has(loc.id)) continue;
    seen.add(loc.id);

    const bits = [];
    if (loc.openingHours) bits.push(loc.openingHours);

    for (const line of (loc.description || '').split('\n')) {
      const text = line.trim().replace(/^⚠️\s*/, '');
      if (!text || !CAVEAT.test(line)) continue;
      // 營業時間常常也寫在描述第一句，不要印兩次
      if (bits.some(b => text.startsWith(b) || b.startsWith(text))) continue;
      bits.push(text);
    }

    if (bits.length) notes.push({ title: loc.title, bits });
  }
  return notes;
}

/** 把 legs / alternatives 攤平成備註欄的文字行 */
function noteLines(ev) {
  const lines = [];
  if (ev.note) lines.push(ev.note);

  if (ev.legs?.length) {
    const stops = [ev.origin, ...ev.legs.map(l => `${l.to}${l.arrive ? ` ${l.arrive}` : ''}`)].filter(Boolean);
    lines.push(`${stops.join(' → ')}（${ev.legs.map(l => l.via).join('／')}）`);
  }

  if (ev.alternatives?.length) {
    lines.push(ev.alternatives.map(a => `${a.when} ${a.detail}${a.isPlan ? '（採用）' : ''}`).join('；'));
  }
  return lines;
}

function build() {
  const D = applyPrivateNames(loadTrip()).data;
  const { TRIP, ITINERARY, toTripIso, weekdayOf } = D;
  const children = [];

  // 封面的日期區間：2027.4.1（四）－ 4.3（六）
  const first = ITINERARY[0];
  const last = ITINERARY[ITINERARY.length - 1];
  const fmt = (day, withYear) => {
    const [y, m, d] = toTripIso(day.date).split('-').map(Number);
    return `${withYear ? `${y}.` : ''}${m}.${d}（${weekdayOf(day.date)}）`;
  };
  const range = `${fmt(first, true)} － ${fmt(last, toTripIso(last.date).slice(0, 4) !== toTripIso(first.date).slice(0, 4))}`;
  const who = TRIP.travellers.map(t => t.name).join(' & ');

  children.push(
    new Paragraph({
      spacing: { after: 100 },
      children: [new TextRun({ text: `${TRIP.title} 行程表`, bold: true, size: 40, color: INK, font: '游明朝' })],
    }),
    p(`${range}｜${ITINERARY.length} 天｜${who}`, { size: 21, color: MUTED }),
    p('★＝已訂或固定班次　○＝可調整', { size: 17, color: MUTED }),
    p(`最後更新 ${new Date().toLocaleDateString('sv-SE')}。出發前一天再確認一次當日班次與營業時間。`,
      { size: 17, color: MUTED, after: 240 }),
  );

  ITINERARY.forEach((day, di) => {
    children.push(
      new Paragraph({
        pageBreakBefore: di > 0,
        spacing: { before: di > 0 ? 0 : 200, after: 60 },
        children: [
          new TextRun({ text: `DAY ${di + 1}　`, bold: true, size: 20, color: VERMILLION, font: '游ゴシック' }),
          new TextRun({ text: `${day.date}（${weekdayOf(day.date)}）${day.title}`, bold: true, size: 28, color: INK, font: '游明朝' }),
        ],
      }),
      p(`住宿：${day.accommodation ?? '當日返台・無住宿'}`, { size: 18, color: MUTED, after: 140 }),
    );

    const rows = [
      new TableRow({
        tableHeader: true,
        children: [
          cell('時間', { bold: true, width: COLS[0], shade: TINT, color: WOOD }),
          cell('', { width: COLS[1], shade: TINT }),
          cell('行程', { bold: true, width: COLS[2], shade: TINT, color: WOOD }),
          cell('備註', { bold: true, width: COLS[3], shade: TINT, color: WOOD }),
        ],
      }),
      ...day.events.map(ev => new TableRow({
        children: [
          cell(ev.time, { width: COLS[0], color: ev.isHighlight ? VERMILLION : INK, bold: ev.isHighlight }),
          cell(ev.isHighlight ? '★' : '○', {
            width: COLS[1], align: AlignmentType.CENTER, color: ev.isHighlight ? VERMILLION : MUTED,
          }),
          cell(ev.description, { width: COLS[2], bold: ev.isHighlight }),
          multiLineCell(noteLines(ev), COLS[3]),
        ],
      })),
    ];

    children.push(new Table({ columnWidths: COLS, width: { size: PAGE_W, type: WidthType.DXA }, rows }));

    const notes = dayNotes(day, D.LOCATION_DETAILS);
    if (notes.length) {
      children.push(p('今日要點', { bold: true, size: 20, color: WOOD, before: 240, after: 80 }));
      for (const n of notes) {
        children.push(p(n.title, { bold: true, size: 18, after: 40 }));
        for (const b of n.bits) {
          children.push(p(`・${b}`, { size: 17, color: MUTED, after: 30, indent: { left: 240 } }));
        }
      }
    }

    for (const link of day.links ?? []) {
      children.push(new Paragraph({
        spacing: { before: 120, after: 0 },
        children: [
          new TextRun({ text: `${link.label}：`, bold: true, size: 17, color: WOOD, font: '游ゴシック' }),
          new TextRun({ text: link.url, size: 16, color: MUTED, font: 'Consolas' }),
        ],
      }));
    }
  });

  children.push(new Paragraph({
    pageBreakBefore: true,
    spacing: { after: 100 },
    children: [new TextRun({ text: '出發前待確認', bold: true, size: 28, color: INK, font: '游明朝' })],
  }));
  for (const t of D.TODO_LIST) children.push(p(`☐　${t.text}`, { size: 19, after: 60 }));

  children.push(p('旅途叮嚀', { bold: true, size: 24, before: 280, after: 80 }));
  D.PRE_TRIP_NOTES.forEach((n, i) => children.push(p(`${i + 1}. ${n}`, { size: 18, color: MUTED, after: 50 })));

  children.push(p('緊急聯絡', { bold: true, size: 24, before: 280, after: 80 }));
  for (const c of D.EMERGENCY_CONTACTS) {
    children.push(p(`${c.title}　${c.number}${c.note ? `（${c.note}）` : ''}`, { size: 18, color: MUTED, after: 50 }));
  }

  if (D.VOUCHERS.length) {
    children.push(p('旅遊憑證', { bold: true, size: 24, before: 280, after: 80 }));
    for (const v of D.VOUCHERS) {
      children.push(new Paragraph({
        spacing: { after: 50, line: 276 },
        children: [
          new TextRun({ text: `${v.name}　`, size: 18, color: INK, font: '游ゴシック' }),
          new TextRun({ text: v.url, size: 15, color: MUTED, font: 'Consolas' }),
        ],
      }));
    }
  }

  const doc = new Document({
    styles: { default: { document: { run: { font: '游ゴシック', size: 19 } } } },
    sections: [{
      properties: { page: { margin: { top: 1000, bottom: 1000, left: 1100, right: 1100 } } },
      children,
    }],
  });

  return {
    doc,
    out: path.join(ROOT, `行程表-${TRIP.id}.docx`),
    days: ITINERARY.length,
    events: ITINERARY.reduce((n, d) => n + d.events.length, 0),
  };
}

const { doc, out: OUT, days, events } = build();

Packer.toBuffer(doc).then(buf => {
  const backup = OUT.replace(/\.docx$/, '.舊版備份.docx');
  const hadOld = fs.existsSync(OUT);
  if (hadOld) fs.copyFileSync(OUT, backup);
  fs.writeFileSync(OUT, buf);
  console.log(`✓ ${path.basename(OUT)}　${days} 天 / ${events} 個行程點 / ${(buf.length / 1024).toFixed(1)} KB`);
  if (hadOld) console.log(`  舊版已備份為 ${path.basename(backup)}`);
});
