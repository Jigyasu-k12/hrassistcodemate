// On-device photo cache for "The journey continues".
//
// Every history photo is downloaded once into the app's own storage and from
// then on opens from the phone, instantly and offline, with its shape already
// known (no layout jump). Images are only fetched again when they change:
//   • if the API row carries an update date (e.g. HIST_UPD_DATE) → a new date
//     means a new download, with no extra request at all;
//   • otherwise, like MSIL Happenings, a light header-only check (ETag /
//     Last-Modified) at most once a day per photo decides it.
// A changed photo is downloaded beside the old one and swapped in only once it
// is complete, so the user never sees a blank or half-loaded image.
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DIR = `${RNFS.DocumentDirectoryPath}/msil_history`;
const MANIFEST_KEY = 'msil_history_images_v1';
const RECHECK_MS = 24 * 60 * 60 * 1000; // header check at most daily per photo
const TIMEOUT_MS = 8000;
const PARALLEL = 2; // gentle on the network and the battery
const MAX_BYTES = 30 * 1024 * 1024; // storage cap; least recently viewed go first

let manifest = {}; // id → {url, ver, sig, file, bytes, ratio, broken, checkedAt, usedAt}
const listeners = new Set();

const hashOf = s => {
  let h = 5381;
  const t = String(s || '');
  for (let i = 0; i < t.length; i++) {
    h = ((h << 5) + h + t.charCodeAt(i)) >>> 0;
  }
  return h.toString(36);
};
const extOf = url => {
  const m = /\.(jpe?g|png|webp|gif|tiff?|heic|bmp)(?:[?#]|$)/i.exec(url || '');
  return m ? m[1].toLowerCase() : 'jpg';
};
const safeId = id => String(id || 'x').replace(/[^A-Za-z0-9_-]/g, '_');
const fileUri = path => `file://${path}`;
const withTimeout = (p, ms) =>
  Promise.race([p, new Promise(r => setTimeout(() => r(null), ms))]);

let saveTimer = null;
const save = () => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    AsyncStorage.setItem(MANIFEST_KEY, JSON.stringify(manifest)).catch(
      () => {},
    );
  }, 400);
};
const emit = id => listeners.forEach(fn => fn(id));

// Read the manifest once; drop entries whose file is gone (e.g. app restore)
const hydrated = (async () => {
  try {
    await RNFS.mkdir(DIR);
    const raw = await AsyncStorage.getItem(MANIFEST_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const ids = Object.keys(parsed || {});
    const alive = await Promise.all(
      ids.map(id =>
        parsed[id] && parsed[id].file
          ? RNFS.exists(parsed[id].file).catch(() => false)
          : false,
      ),
    );
    const next = {};
    ids.forEach((id, i) => {
      if (alive[i]) {
        next[id] = parsed[id];
      }
    });
    manifest = {...next, ...manifest};
  } catch (e) {}
})();

export const whenPhotosReady = () => hydrated;
export const subscribePhotos = fn => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

// Shape / decode result reported by the screen when the photo first displays
export const notePhoto = (id, {ratio, broken} = {}) => {
  const e = manifest[id];
  if (!e) {
    return;
  }
  const next = {...e, usedAt: Date.now()};
  if (ratio) {
    next.ratio = ratio;
  }
  if (broken) {
    next.broken = true; // e.g. a .tif Android can't decode → brand card
  }
  manifest[id] = next;
  save();
};

// Keep storage under the cap: drop the least recently viewed photos
const trim = () => {
  const ids = Object.keys(manifest);
  let total = ids.reduce((n, id) => n + (manifest[id].bytes || 0), 0);
  if (total <= MAX_BYTES) {
    return;
  }
  ids
    .sort((a, b) => (manifest[a].usedAt || 0) - (manifest[b].usedAt || 0))
    .some(id => {
      total -= manifest[id].bytes || 0;
      RNFS.unlink(manifest[id].file).catch(() => {});
      delete manifest[id];
      return total <= MAX_BYTES * 0.8;
    });
  save();
};

// Synchronous lookup for first paint: the saved photo for this moment (even if
// a newer version is being fetched in the background), or null.
export const cachedPhoto = m => {
  const e = m && manifest[m.id];
  if (!e || !e.file || e.url !== m.img) {
    return null;
  }
  return {uri: fileUri(e.file), ratio: e.ratio || null, broken: !!e.broken};
};

// Header-only check → signature string, '' (no validator), or null (unknown)
const headSig = async url => {
  try {
    const res = await withTimeout(
      fetch(url, {
        method: 'HEAD',
        headers: {'Cache-Control': 'no-cache', Pragma: 'no-cache'},
      }),
      TIMEOUT_MS,
    );
    if (!res || !res.ok) {
      return null;
    }
    return (
      res.headers.get('etag') ||
      res.headers.get('last-modified') ||
      res.headers.get('content-length') ||
      ''
    );
  } catch (e) {
    return null;
  }
};

// Download beside the old file, then swap in atomically
const download = async (m, sigHint) => {
  await hydrated;
  const tmp = `${DIR}/${safeId(m.id)}.part`;
  let headers = {};
  await RNFS.unlink(tmp).catch(() => {});
  const res = await RNFS.downloadFile({
    fromUrl: m.img,
    toFile: tmp,
    background: true,
    discretionary: false,
    cacheable: false,
    connectionTimeout: 15000,
    readTimeout: 30000,
    begin: b => {
      headers = (b && b.headers) || {};
    },
  }).promise;
  if (
    !res ||
    res.statusCode < 200 ||
    res.statusCode >= 300 ||
    !res.bytesWritten
  ) {
    await RNFS.unlink(tmp).catch(() => {});
    throw new Error(`photo ${m.id}: HTTP ${res && res.statusCode}`);
  }
  const h = k => headers[k] || headers[k.toLowerCase()] || '';
  const sig = h('ETag') || h('Last-Modified') || sigHint || '';
  const file = `${DIR}/${safeId(m.id)}_${hashOf(
    m.img + '|' + (m.ver || '') + '|' + (sig || Date.now()),
  )}.${extOf(m.img)}`;
  await RNFS.unlink(file).catch(() => {});
  await RNFS.moveFile(tmp, file);
  const old = manifest[m.id];
  manifest[m.id] = {
    url: m.img,
    ver: m.ver || '',
    sig,
    file,
    bytes: res.bytesWritten,
    // shape is learnt the first time it's shown (no extra decode here);
    // keep the old one meanwhile if the photo was only refreshed
    ratio: old && old.url === m.img ? old.ratio || null : null,
    broken: false,
    checkedAt: Date.now(),
    usedAt: Date.now(),
  };
  save();
  if (old && old.file && old.file !== file) {
    RNFS.unlink(old.file).catch(() => {});
  }
  trim();
  emit(m.id);
  return manifest[m.id];
};

// Is the saved copy still the server's current one?
const refreshIfStale = async (m, e) => {
  if (m.ver) {
    // the API tells us when the photo changed — no request needed
    return e.ver === m.ver ? e : download(m);
  }
  if (Date.now() - (e.checkedAt || 0) < RECHECK_MS) {
    return e;
  }
  const sig = await headSig(m.img);
  if (sig === null || (sig && sig === e.sig) || (!sig && !e.sig)) {
    // unchanged, or can't tell right now → keep the saved photo
    manifest[m.id] = {...e, checkedAt: Date.now()};
    save();
    return manifest[m.id];
  }
  return download(m, sig);
};

// ── small priority queue: what the user is looking at goes first ──
const jobs = new Map(); // id → promise
const waiting = [];
let running = 0;
const pump = () => {
  while (running < PARALLEL && waiting.length) {
    const {m, resolve} = waiting.shift();
    running++;
    (async () => {
      await hydrated;
      const e = manifest[m.id];
      return e && e.file && e.url === m.img
        ? refreshIfStale(m, e)
        : download(m);
    })()
      .catch(() => cachedPhoto(m) && manifest[m.id])
      .then(r => resolve(r || null))
      .finally(() => {
        running--;
        jobs.delete(m.id);
        pump();
      });
  }
};

// Make sure a moment's photo is on the device (and current). Resolves to the
// manifest entry or null. `front` jumps the queue.
export const ensurePhoto = (m, front = false) => {
  if (!m || !m.img) {
    return Promise.resolve(null);
  }
  if (jobs.has(m.id)) {
    if (front) {
      const k = waiting.findIndex(w => w.m.id === m.id);
      if (k > 0) {
        waiting.unshift(...waiting.splice(k, 1));
      }
    }
    return jobs.get(m.id);
  }
  const p = new Promise(resolve => {
    const job = {m, resolve};
    if (front) {
      waiting.unshift(job);
    } else {
      waiting.push(job);
    }
  });
  jobs.set(m.id, p);
  pump();
  return p;
};

export const ensurePhotos = (moments, front = false) => {
  const list = (moments || []).filter(m => m && m.img);
  (front ? list.slice().reverse() : list).forEach(m => ensurePhoto(m, front));
};

// Forget photos for moments that are no longer in the timeline
export const prunePhotos = async keepIds => {
  await hydrated;
  const keep = new Set(keepIds);
  let changed = false;
  Object.keys(manifest).forEach(id => {
    if (!keep.has(id)) {
      RNFS.unlink(manifest[id].file).catch(() => {});
      delete manifest[id];
      changed = true;
    }
  });
  if (changed) {
    save();
  }
};
