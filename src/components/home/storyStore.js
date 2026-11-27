// MSIL Happenings stories — background discovery with a saved result
// ("stale-while-revalidate"): Home shows the last known stories instantly and
// re-checks silently and often; the row only changes when the server changes.
//
// Each check is light: a header-only request per image ("exists? changed?").
// An image is downloaded only when it's new or its content changed; unchanged
// stories are reused straight from the image cache.
import {Image} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORY_BASE = 'https://swifttest.maruti.co.in/HRAssistWebAPIMVC/Images/';
const PROBE_BATCH = 5;
const PROBE_MAX = 20;
const PROBE_TIMEOUT_MS = 8000;
export const MIN_GAP_MS = 60 * 1000; // never re-check more than once a minute (forced calls excepted)
export const POLL_MS = 2 * 60 * 1000; // while Home is on screen
const CACHE_KEY = 'msil_stories_cache_v2';

let memory = null; // {at, items: [{n, uri, ratio, sig}]}
let inflight = null;
const listeners = new Set();

const baseOf = uri => String(uri || '').split('?')[0];
// Same set of stories (by image number) → no layout animation needed
export const sameStories = (a = [], b = []) =>
  a.length === b.length &&
  a.every((x, i) => baseOf(x.uri) === baseOf(b[i].uri));

const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise(resolve => setTimeout(() => resolve(null), ms)),
  ]);

// Full download + decode → {ratio} or null
const measure = uri =>
  withTimeout(
    new Promise(resolve =>
      Image.getSize(
        uri,
        (w, h) => resolve(w > 0 && h > 0 ? {ratio: h / w} : null),
        () => resolve(null),
      ),
    ),
    PROBE_TIMEOUT_MS,
  );

// Header-only check → {exists, sig} | {exists:false} | null (unknown → fall back)
const head = async url => {
  try {
    const res = await withTimeout(
      fetch(url, {
        method: 'HEAD',
        headers: {'Cache-Control': 'no-cache', Pragma: 'no-cache'},
      }),
      PROBE_TIMEOUT_MS,
    );
    if (!res) {
      return null; // timed out
    }
    if (res.status === 404 || res.status === 410 || res.status === 403) {
      return {exists: false};
    }
    if (!res.ok) {
      return null; // e.g. HEAD not allowed → verify with a real download
    }
    const type = res.headers.get('content-type') || '';
    if (type && !type.startsWith('image/')) {
      return {exists: false}; // an HTML "not found" page served as 200
    }
    const sig =
      res.headers.get('etag') ||
      res.headers.get('last-modified') ||
      res.headers.get('content-length') ||
      '';
    return {exists: true, sig};
  } catch (e) {
    return null;
  }
};

// One image number → story item, MISSING (server says it isn't there), or
// null (couldn't check — e.g. no network). Reuses the saved item when unchanged.
const MISSING = 'missing';
const check = async (n, prevByN) => {
  const base = `${STORY_BASE}${n}.png`;
  const h = await head(base);
  if (h && !h.exists) {
    return MISSING;
  }
  const prev = prevByN[n];
  if (h && h.sig && prev && prev.sig === h.sig) {
    return prev; // unchanged → no download
  }
  if (!h && prev) {
    return prev; // couldn't check → keep the saved story, never drop it
  }
  // New / changed / unknown: version the URL by its signature so the image
  // cache stays valid until the server's file actually changes.
  const version = h && h.sig ? encodeURIComponent(h.sig) : String(Date.now());
  const uri = `${base}?v=${version}`;
  const m = await measure(uri);
  return m ? {n, uri, ratio: m.ratio, sig: (h && h.sig) || ''} : null;
};
let lastRunReliable = true;

// 1.png, 2.png, … in batches; stops after the first batch with a missing image.
const discover = async () => {
  const prevByN = {};
  (memory ? memory.items : []).forEach(it => {
    prevByN[it.n] = it;
  });
  const found = [];
  let unknown = 0;
  for (let start = 1; start <= PROBE_MAX; start += PROBE_BATCH) {
    const batch = [...Array(PROBE_BATCH)].map((_, k) => start + k);
    const results = await Promise.all(batch.map(n => check(n, prevByN)));
    results.forEach(r => {
      if (r === null) {
        unknown++;
      } else if (r !== MISSING) {
        found.push(r);
      }
    });
    if (results.some(r => r === null || r === MISSING)) {
      break;
    }
  }
  // Nothing found and nothing confirmed missing = we simply couldn't reach the
  // server. That must never replace the stories we already have.
  lastRunReliable = !(unknown > 0 && found.length === 0);
  return found;
};

// Saved result, read once at app start so it's ready before Home's first frame.
const hydrated = AsyncStorage.getItem(CACHE_KEY)
  .then(raw => {
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && Array.isArray(parsed.items) && !memory) {
      memory = parsed;
    }
  })
  .catch(() => {});

export const getCachedStories = () => (memory ? memory.items : null);
export const whenHydrated = () => hydrated;

export const subscribeStories = fn => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

// Silent background refresh. Throttled to once a minute unless forced
// (pull-to-refresh / sign-in). Concurrent calls share one check.
export const refreshStories = async ({force = false} = {}) => {
  await hydrated;
  if (!force && memory && Date.now() - memory.at < MIN_GAP_MS) {
    return memory.items;
  }
  if (inflight) {
    return inflight;
  }
  // No offline pre-check: the phone's network status can be stale after a
  // network change. Offline requests fail fast and saved content stays.
  if (inflight) {
    return inflight;
  }
  inflight = withTimeout(discover(), 45000)
    .then(items => {
      if (!items || (!lastRunReliable && memory && memory.items.length)) {
        return memory ? memory.items : []; // unreachable → keep what we have
      }
      const prev = memory ? memory.items : null;
      memory = {at: Date.now(), items};
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(memory)).catch(() => {});
      const changed =
        !prev ||
        prev.length !== items.length ||
        prev.some((p, i) => p.uri !== items[i].uri);
      if (changed) {
        listeners.forEach(fn => fn(items, prev));
      }
      return items;
    })
    .catch(() => (memory ? memory.items : []))
    .finally(() => {
      inflight = null;
    });
  return inflight;
};
