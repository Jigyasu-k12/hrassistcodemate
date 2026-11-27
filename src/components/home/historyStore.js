// "The journey continues" — MSIL history from /GetMSILHistory.
//
// Stale-while-revalidate, like storyStore: the last good timeline is saved on
// the device, so Home shows it instantly (even offline); a fresh copy is fetched
// silently and the road only updates when the content actually changed.
// The first sign-in pre-warms it while the "Welcome" screen is showing.
//
// Images are warmed in the background: the latest years first, then the
// neighbours of whatever year is on screen, so the sheet opens with its photo.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ApiService from '../../Utils/Utils';
import {Decrypt} from '../../Service/Helper';
import {HISTORY as FALLBACK} from './homeTheme';
import {ensurePhotos, prunePhotos} from './historyImageCache';

const CACHE_KEY = 'msil_history_cache_v1';
const MIN_GAP_MS = 10 * 60 * 1000; // history changes rarely
const MONTHS = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');

let memory = null; // {at, sig, years}
let inflight = null;
const listeners = new Set();

// ── field helpers (values may arrive plain or encrypted; blanks as null/"null") ──
const looksEncrypted = v =>
  typeof v === 'string' &&
  v.length >= 24 &&
  v.length % 4 === 0 &&
  /^[A-Za-z0-9+/]+={0,2}$/.test(v);
const str = v => {
  if (v == null) {
    return '';
  }
  let s = String(v).trim();
  if (looksEncrypted(s)) {
    try {
      const d = String(Decrypt(s) || '').trim();
      if (d) {
        s = d;
      }
    } catch (e) {}
  }
  return /^(null|undefined|nan)$/i.test(s) ? '' : s;
};
const num = v => {
  const n = parseFloat(str(v));
  return Number.isFinite(n) ? n : null;
};
const url = v => {
  const s = str(v);
  if (!/^https?:\/\//i.test(s)) {
    return '';
  }
  try {
    return encodeURI(decodeURI(s)); // spaces etc. → safe URL, no double-encoding
  } catch (e) {
    return encodeURI(s);
  }
};

// "14 Apr 1982: Suzuki…" → {date: '14 Apr 1982', text: 'Suzuki…'}
const DATE_PREFIX =
  /^((?:\d{1,2}\s+)?(?:[A-Za-z]{3,9}\.?\s+)?\d{4})\s*[:\-–]\s+([\s\S]+)$/;
const splitDate = desc => {
  const m = DATE_PREFIX.exec(desc);
  if (!m) {
    return {date: '', text: desc};
  }
  const text = m[2].trim();
  return {date: m[1].trim(), text: text[0].toUpperCase() + text.slice(1)};
};

// Undated items keep their era: "2021 onwards" → 2020s, "2001-2010" → 2000s
const eraOf = att => {
  const m = /(\d{4})(?:\s*[-–]\s*(\d{4}))?/.exec(str(att));
  if (!m) {
    return null;
  }
  const start = Number(m[1]);
  const end = m[2] ? Number(m[2]) : null;
  const decade = Math.floor((start % 10 === 1 ? start - 1 : start) / 10) * 10;
  return {label: `${decade}s`, sort: (end || 9999) + 0.5};
};

// Optional "updated on" column (e.g. HIST_UPD_DATE / UPDATED_ON) → photo version
const verOf = r => {
  const k = Object.keys(r || {}).find(
    key => /(UPD|MODIF|CHANGED|LAST_?UPDATE)/i.test(key) && str(r[key]),
  );
  return k ? str(r[k]) : '';
};

// API rows → years (one signpost per year), moments ordered by order → month
export const normalise = rows => {
  const byKey = new Map();
  (Array.isArray(rows) ? rows : []).forEach((r, i) => {
    const head = str(r.HIST_HEAD);
    const rawDesc = str(r.HIST_DESC);
    if (!head && !rawDesc) {
      return; // nothing to show
    }
    const {date, text} = splitDate(rawDesc);
    let year = num(r.HIST_YEAR);
    if (year == null && date) {
      year = Number(date.slice(-4)); // "2025: …" → 2025
    }
    year = year != null ? Math.round(year) : null;
    const era = year == null ? eraOf(r.HIST_ATT_1) : null;
    const key = year != null ? String(year) : era ? era.label : 'More';
    const sort = year != null ? year : era ? era.sort : 99999;
    const month = num(r.HIST_MONTH);
    const monthName =
      month && month >= 1 && month <= 12 ? MONTHS[month - 1] : '';
    if (!byKey.has(key)) {
      byKey.set(key, {key, label: key, sort, moments: []});
    }
    byKey.get(key).moments.push({
      id: str(r.HIST_ID) || `${key}-${i}`,
      head: head || text,
      desc: head ? text : '',
      sub: str(r.HIST_SUB_DESC),
      img: url(r.HIST_IMG_LINK),
      ver: verOf(r),
      // eyebrow: the exact date if the text had one, else "Apr 1982", else "1982"
      when:
        date ||
        (year != null ? [monthName, year].filter(Boolean).join(' ') : key),
      order: num(r.HIST_ORDER),
      month,
      i,
    });
  });
  const years = [...byKey.values()].sort((a, b) => a.sort - b.sort);
  years.forEach(y =>
    y.moments.sort(
      (a, b) =>
        (a.order ?? 999) - (b.order ?? 999) ||
        (a.month ?? 0) - (b.month ?? 0) ||
        a.i - b.i,
    ),
  );
  return years;
};

// Reply → rows, tolerating Value as a JSON string or under Result / Table
const rowsOf = res => {
  let v = res && (res.Value ?? res.Result ?? res.Table ?? res);
  if (typeof v === 'string') {
    try {
      v = JSON.parse(v);
    } catch (e) {
      return [];
    }
  }
  if (v && !Array.isArray(v) && Array.isArray(v.Table)) {
    v = v.Table;
  }
  return Array.isArray(v) ? v : [];
};

// Built-in timeline, used only until the first successful fetch
export const FALLBACK_YEARS = FALLBACK.map(h => ({
  key: String(h.year),
  label: String(h.year),
  sort: Number(h.year),
  moments: [
    {
      id: `local-${h.year}`,
      head: h.head,
      desc: h.desc,
      sub: h.more || '',
      img: '',
      when: String(h.year),
    },
  ],
}));

const signature = years =>
  years
    .map(
      y =>
        y.key +
        ':' +
        y.moments
          .map(m => m.id + m.head + m.desc + m.sub + m.img + (m.ver || ''))
          .join('|'),
    )
    .join('§');

// ── photo warming (downloaded once to the device; see historyImageCache) ──
export const warmMoments = (moments, front = false) =>
  ensurePhotos(moments, front);
// The road showing year i → save just that year's lead photo (the one the
// sheet opens on). Everything else is saved only when actually reached.
export const warmAround = (years, i) =>
  years[i] ? ensurePhotos([years[i].moments[0]]) : undefined;

// ── cache ──
const hydrated = AsyncStorage.getItem(CACHE_KEY)
  .then(raw => {
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && Array.isArray(parsed.years) && parsed.years.length) {
      memory = parsed;
      listeners.forEach(fn => fn(memory.years));
    }
  })
  .catch(() => {});

export const getHistory = () => (memory ? memory.years : null);
export const whenHistoryHydrated = () => hydrated;
export const subscribeHistory = fn => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

// Silent refresh. Throttled unless forced (sign-in). Calls share one request.
export const refreshHistory = async ({
  token,
  userId,
  authContext = null,
  force = false,
} = {}) => {
  await hydrated;
  if (!token || !userId) {
    return getHistory();
  }
  if (!force && memory && Date.now() - memory.at < MIN_GAP_MS) {
    return memory.years;
  }
  if (inflight) {
    return inflight;
  }
  // No offline pre-check: the phone's network status can be stale after a
  // network change. Offline requests fail fast and saved content stays.
  inflight = ApiService.PostMethode(
    '/GetMSILHistory',
    {StaffNo: String(userId)},
    token,
    authContext,
  )
    .then(res => {
      const years = normalise(rowsOf(res));
      if (!years.length) {
        return getHistory(); // empty/bad reply → keep what we have
      }
      const sig = signature(years);
      const changed = !memory || memory.sig !== sig;
      memory = {at: Date.now(), sig, years};
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(memory)).catch(() => {});
      if (changed) {
        listeners.forEach(fn => fn(years));
      }
      // Lightweight: no bulk download — photos are saved as they're reached.
      // Just drop saved photos for entries that no longer exist.
      prunePhotos(years.flatMap(y => y.moments.map(m => m.id)));
      return years;
    })
    .catch(() => getHistory())
    .finally(() => {
      inflight = null;
    });
  return inflight;
};
