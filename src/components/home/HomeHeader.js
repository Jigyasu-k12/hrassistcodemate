// Home header: deep-teal glow backdrop, greeting row and the "The journey continues" road timeline.
import React, {useContext, useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  PanResponder,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  RadialGradient,
  Stop,
  Rect,
  Path,
  Circle,
  G,
  Ellipse,
} from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {P, HText, TYPE, greetingFor, useReduceMotion} from './homeTheme';
import HomeIcon from './HomeIcons';
import HomeSheet from './HomeSheet';
import StoriesRow from './StoriesRow';
import AuthContext from '../../context/AuthContext';
import {
  FALLBACK_YEARS,
  getHistory,
  refreshHistory,
  subscribeHistory,
  warmAround,
  warmMoments,
  whenHistoryHydrated,
} from './historyStore';
import {
  cachedPhoto,
  ensurePhoto,
  notePhoto,
  subscribePhotos,
} from './historyImageCache';

const STEP = 104; // distance between signposts on the road
const NARROW = Dimensions.get('window').width < 360;
const ROAD_H = 96;
const EASE = Easing.bezier(0.2, 0.7, 0.2, 1);
const ROAD_EASE = Easing.bezier(0.45, 0.05, 0.25, 1);

// ── Backdrop: layered radial glows over a deep-teal vertical gradient ──
// tone="manager" → "dusk": the same deep teal, lit by a warm amber sunset
// glow, so Manager mode is recognisable at a glance but stays in palette.
const BACKDROP_TONES = {
  employee: {
    base: [P.deep, P.deeper],
    teal: {c: P.teal, o: 1, cx: '90%', r: '70%'},
    glow: {c: P.glow, o: 1},
    amber: {o: 0.22, cx: '84%', rx: '45%', ry: '40%'},
  },
  manager: {
    base: ['#123532', '#0A201E'],
    teal: {c: P.teal, o: 0.55, cx: '8%', r: '60%'},
    glow: {c: P.amberDeep, o: 0.32},
    amber: {o: 0.46, cx: '88%', rx: '78%', ry: '70%'},
  },
};

export const HeaderBackdrop = ({
  width,
  height,
  idPrefix = 'hdr',
  tone = 'employee',
}) => {
  if (!(width > 0 && height > 0)) {
    return null;
  }
  const t = BACKDROP_TONES[tone] || BACKDROP_TONES.employee;
  return (
    <Svg
      width={width}
      height={height}
      style={StyleSheet.absoluteFill}
      pointerEvents="none">
      <Defs>
        <SvgLinearGradient id={`${idPrefix}Base`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={t.base[0]} />
          <Stop offset="1" stopColor={t.base[1]} />
        </SvgLinearGradient>
        <RadialGradient
          id={`${idPrefix}Teal`}
          cx={t.teal.cx}
          cy="0%"
          rx={t.teal.r}
          ry={t.teal.r}
          fx={t.teal.cx}
          fy="0%">
          <Stop offset="0" stopColor={t.teal.c} stopOpacity={t.teal.o} />
          <Stop offset="0.6" stopColor={t.teal.c} stopOpacity="0" />
        </RadialGradient>
        <RadialGradient
          id={`${idPrefix}Glow`}
          cx="0%"
          cy="100%"
          rx="70%"
          ry="60%"
          fx="0%"
          fy="100%">
          <Stop offset="0" stopColor={t.glow.c} stopOpacity={t.glow.o} />
          <Stop offset="0.65" stopColor={t.glow.c} stopOpacity="0" />
        </RadialGradient>
        <RadialGradient
          id={`${idPrefix}Amber`}
          cx={t.amber.cx}
          cy="4%"
          rx={t.amber.rx}
          ry={t.amber.ry}
          fx={t.amber.cx}
          fy="4%">
          <Stop offset="0" stopColor={P.amber} stopOpacity={t.amber.o} />
          <Stop offset="0.7" stopColor={P.amber} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect
        x="0"
        y="0"
        width={width}
        height={height}
        fill={`url(#${idPrefix}Base)`}
      />
      <Rect
        x="0"
        y="0"
        width={width}
        height={height}
        fill={`url(#${idPrefix}Glow)`}
      />
      <Rect
        x="0"
        y="0"
        width={width}
        height={height}
        fill={`url(#${idPrefix}Teal)`}
      />
      <Rect
        x="0"
        y="0"
        width={width}
        height={height}
        fill={`url(#${idPrefix}Amber)`}
      />
    </Svg>
  );
};

// ── Little white hatchback that drives the timeline ──
const Car = () => (
  <Svg width={56} height={28} viewBox="0 0 56 28">
    <G transform="translate(56, 0) scale(-1, 1)">
      <Path
        d="M4 20 L4 15 Q4 12 8 11.5 L16 10 L22 4 Q23.5 2.5 26 2.5 L38 2.5 Q41 2.5 43 4.5 L48 10 L51 11 Q54 12 54 15 L54 20 Z"
        fill="#FFFFFF"
      />
      <Path d="M23.5 5 L26.5 4.5 L31 4.5 L31 10 L18.5 10 Z" fill={P.tealInk} />
      <Path
        d="M33 4.5 L38 4.5 Q40 4.5 41.5 6 L45 10 L33 10 Z"
        fill={P.tealInk}
      />
      <Circle
        cx="15"
        cy="21"
        r="5"
        fill={P.deep}
        stroke={P.softOnDark}
        strokeWidth="2"
      />
      <Circle
        cx="43"
        cy="21"
        r="5"
        fill={P.deep}
        stroke={P.softOnDark}
        strokeWidth="2"
      />
      <Rect x="2" y="13" width="4" height="2.5" rx="1" fill={P.amber} />
      <Rect x="51" y="14" width="3" height="3" rx="1" fill="#E5302A" />
    </G>
  </Svg>
);

// ── Round translucent icon button used in the header ──
const GlassButton = ({icon, iconNode, onPress, label, children}) => (
  <TouchableOpacity
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={label}
    activeOpacity={0.7}
    style={styles.glassBtn}>
    {iconNode || (
      <HomeIcon name={icon} size={20} color="#FFFFFF" strokeWidth={1.8} />
    )}
    {children}
  </TouchableOpacity>
);

// What's New sparkles — a gentle twinkle every few seconds while there's
// something new; perfectly still once seen (or with Reduce Motion on).
const WhatsNewIcon = ({active, reduceMotion}) => {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    t.setValue(0);
    if (!active || reduceMotion) {
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(2400),
        Animated.timing(t, {
          toValue: 1,
          duration: 360,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(t, {
          toValue: 0,
          duration: 520,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, reduceMotion, t]);
  return (
    <Animated.View
      style={{
        transform: [
          {scale: t.interpolate({inputRange: [0, 1], outputRange: [1, 1.16]})},
          {
            rotate: t.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '14deg'],
            }),
          },
        ],
      }}>
      <HomeIcon name="whatsNew" size={21} color="#FFFFFF" strokeWidth={1.7} />
    </Animated.View>
  );
};

// Amber "new" dot with a soft pulsing halo
const NewDot = ({reduceMotion}) => {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduceMotion) {
      return;
    }
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 2000,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, pulse]);
  return (
    <View pointerEvents="none" style={styles.dotWrap}>
      <Animated.View
        style={[
          styles.dotHalo,
          {
            opacity: pulse.interpolate({
              inputRange: [0, 1],
              outputRange: [0.7, 0],
            }),
            transform: [
              {
                scale: pulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 2.3],
                }),
              },
            ],
          },
        ]}
      />
      <View style={styles.dot} />
    </View>
  );
};

// ── helpers for the API timeline ──
const isYear = label => /^\d{4}$/.test(label);
// Road starts on the latest dated year (undated "2020s"-style stops sit after it)
const startIndexOf = years => {
  for (let i = years.length - 1; i >= 0; i--) {
    if (isYear(years[i].label)) {
      return i;
    }
  }
  return Math.max(0, years.length - 1);
};
const plain = s =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
const RATIO = new Map(); // remembered photo shapes → no jump when reopened

// ── The road: sliding signposts, lane markings and the car ──
const LegacyRoad = ({years, index, onPick, reduceMotion}) => {
  const width = Dimensions.get('window').width;
  const center = width / 2;
  const trackW = center * 2 + years.length * STEP;
  const trackX = useRef(new Animated.Value(-index * STEP)).current;
  const float = useRef(new Animated.Value(0)).current;
  const prev = useRef(index);
  const [dir, setDir] = useState(1);

  useEffect(() => {
    if (index !== prev.current) {
      setDir(index > prev.current ? 1 : -1);
    }
    prev.current = index;
    if (reduceMotion) {
      trackX.setValue(-index * STEP);
      return;
    }
    Animated.timing(trackX, {
      toValue: -index * STEP,
      duration: 1400,
      easing: ROAD_EASE,
      useNativeDriver: true,
    }).start();
  }, [index, reduceMotion, trackX]);

  useEffect(() => {
    if (reduceMotion) {
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, float]);

  // Horizontal swipe on the road steps through years
  const live = useRef({index, onPick, count: years.length});
  live.current = {index, onPick, count: years.length};
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderRelease: (_, g) => {
        if (Math.abs(g.dx) < 40) {
          return;
        }
        const {index: i, onPick: pick, count} = live.current;
        const next = Math.max(0, Math.min(count - 1, i + (g.dx < 0 ? 1 : -1)));
        if (next !== i) {
          pick(next, false);
        }
      },
    }),
  ).current;

  const dashes = useMemo(
    () => [...Array(Math.ceil((trackW + 800) / 28))],
    [trackW],
  );

  return (
    <View style={[styles.road, {width}]} {...pan.panHandlers}>
      <Animated.View
        style={[
          styles.track,
          {width: trackW, transform: [{translateX: trackX}]},
        ]}>
        <View style={[styles.roadBand, {width: trackW + 800}]} />
        <View style={[styles.lane, {width: trackW + 800}]}>
          {dashes.map((_, i) => (
            <View key={i} style={styles.dash} />
          ))}
        </View>
        {years.map((y, i) => {
          const on = i === index;
          const past = i < index;
          return (
            <TouchableOpacity
              key={y.key}
              onPress={() => onPick(i, on)}
              accessibilityRole="button"
              accessibilityLabel={`${y.label}: ${y.moments[0].head}`}
              accessibilityState={{selected: on}}
              activeOpacity={0.8}
              style={[styles.post, {left: center + i * STEP - 32}]}>
              <View
                style={[
                  styles.sign,
                  on ? styles.signOn : past ? styles.signPast : styles.signNext,
                ]}>
                <HText
                  style={[
                    styles.signText,
                    {color: on ? P.deep : past ? '#FFFFFF' : P.mutedOnDark},
                  ]}>
                  {y.label}
                </HText>
              </View>
              <View
                style={[
                  styles.pole,
                  {backgroundColor: on ? P.amber : 'rgba(156,189,182,0.4)'},
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </Animated.View>
      <View
        pointerEvents="none"
        style={[styles.carShadow, {left: center - 32}]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.car,
          {
            left: center - 28,
            transform: [
              {
                translateY: float.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -4],
                }),
              },
              {scaleX: dir},
            ],
          },
        ]}>
        <Car />
      </Animated.View>
    </View>
  );
};

// Brand hero — shown when a moment has no photo, or the photo can't load
const StoryHero = ({label}) => (
  <LinearGradient colors={[P.tealInk, P.deep]} style={styles.storyHero}>
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 350 150"
      preserveAspectRatio="none"
      style={StyleSheet.absoluteFill}>
      <Ellipse
        cx="175"
        cy="150"
        rx="210"
        ry="60"
        fill="none"
        stroke="rgba(156,189,182,0.45)"
        strokeWidth="6"
      />
      <Path d="M0 104 L350 98" stroke="rgba(156,189,182,0.4)" />
    </Svg>
    <HText style={styles.storyYear}>{label}</HText>
    <HText style={styles.storyCaption}>
      Maruti Suzuki · The journey continues
    </HText>
  </LinearGradient>
);

// Archive photo. Saved on the device after the first view → opens instantly
// and offline at its known shape. Not saved yet → downloaded first in line
// (soft placeholder meanwhile), falling back to the network if needed.
const clampRatio = r => Math.max(0.8, Math.min(1.9, r));
const HistoryPhoto = ({moment, label, alt}) => {
  const first = cachedPhoto(moment);
  const [photo, setPhoto] = useState(first); // device copy {uri, ratio, broken}
  const [remote, setRemote] = useState(false);
  const [failed, setFailed] = useState(!moment.img);
  const [ratio, setRatio] = useState(
    first && first.ratio
      ? clampRatio(first.ratio)
      : RATIO.get(moment.img) || 16 / 10,
  );
  const fade = useRef(new Animated.Value(first ? 1 : 0)).current;

  useEffect(() => {
    if (!moment.img) {
      return;
    }
    let alive = true;
    const sync = () => {
      const c = cachedPhoto(moment);
      if (!alive || !c) {
        return false;
      }
      setPhoto(p => (p && p.uri === c.uri ? p : c));
      if (c.ratio) {
        setRatio(clampRatio(c.ratio));
      }
      return true;
    };
    // a newer version finished downloading → swap it in
    const unsub = subscribePhotos(id => id === moment.id && sync());
    ensurePhoto(moment, true).then(() => {
      if (alive && !sync()) {
        setRemote(true); // couldn't save it → load straight from the server
      }
    });
    return () => {
      alive = false;
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moment.id, moment.img]);

  const src = photo && !photo.broken ? photo.uri : remote ? moment.img : null;
  if (failed || (photo && photo.broken && !remote)) {
    return <StoryHero label={label} />;
  }
  return (
    <View style={[styles.photoBox, {aspectRatio: ratio}]}>
      <LinearGradient
        colors={[P.mint, '#DCEDE8']}
        style={[StyleSheet.absoluteFill, styles.photoPh]}>
        <HText style={styles.photoPhYear}>{label}</HText>
        <ActivityIndicator color={P.teal} />
      </LinearGradient>
      {!!src && (
        <Animated.Image
          source={{uri: src}}
          resizeMode="cover"
          resizeMethod="resize" // Android: decode at display size, not full size
          accessible
          accessibilityLabel={alt}
          style={[StyleSheet.absoluteFill, {opacity: fade}]}
          onLoad={e => {
            const s = e && e.nativeEvent && e.nativeEvent.source;
            if (s && s.width > 0 && s.height > 0) {
              const r = clampRatio(s.width / s.height);
              RATIO.set(moment.img, r);
              setRatio(r);
              if (photo && src === photo.uri) {
                notePhoto(moment.id, {ratio: r}); // remembered → no jump next time
              }
            }
            Animated.timing(fade, {
              toValue: 1,
              duration: 260,
              easing: EASE,
              useNativeDriver: true,
            }).start();
          }}
          onError={() => {
            if (photo && src === photo.uri) {
              notePhoto(moment.id, {broken: true});
              setPhoto(null); // device copy unreadable → try the server
              setRemote(true);
            } else {
              setFailed(true); // nothing to show → brand card
            }
          }}
        />
      )}
    </View>
  );
};

// ── Story sheet: one moment (heading · photo · description · more) ──
const StorySheet = ({visible, years, index, moment, onClose, onGo}) => {
  const y = years[index];
  const n = y ? y.moments.length : 0;
  const mi = Math.min(moment, Math.max(0, n - 1));
  const m = y ? y.moments[mi] : null;

  // previous / next moment, crossing into the neighbouring year at the ends
  const target = d => {
    if (!y) {
      return [0, 0];
    }
    if (mi + d >= 0 && mi + d < n) {
      return [index, mi + d];
    }
    const yi = (index + d + years.length) % years.length;
    return [yi, d > 0 ? 0 : years[yi].moments.length - 1];
  };
  const [pyi, pmi] = target(-1);
  const [nyi, nmi] = target(1);

  // warm the photos either side so stepping feels instant
  useEffect(() => {
    if (visible && years[pyi] && years[nyi]) {
      warmMoments([years[pyi].moments[pmi], years[nyi].moments[nmi]], true);
    }
  }, [visible, years, pyi, pmi, nyi, nmi]);

  if (!m) {
    return null;
  }
  const showDesc = !!m.desc && plain(m.desc) !== plain(m.head);
  const prevLabel = pyi === index ? 'Previous' : years[pyi].label;
  const nextLabel = nyi === index ? 'Next' : years[nyi].label;

  return (
    <HomeSheet
      visible={visible}
      onClose={onClose}
      eyebrow={m.when}
      title={m.head}>
      <HistoryPhoto
        key={`${m.id}|${m.img}`}
        moment={m}
        label={y.label}
        alt={m.head}
      />

      {n > 1 && (
        <View style={styles.momentRow}>
          <View style={styles.row}>
            {y.moments.map((x, i) => (
              <TouchableOpacity
                key={x.id}
                onPress={() => onGo(index, i)}
                accessibilityRole="button"
                accessibilityLabel={`Moment ${i + 1} of ${n}: ${x.head}`}
                accessibilityState={{selected: i === mi}}
                hitSlop={{top: 10, bottom: 10, left: 4, right: 4}}
                style={[styles.mDot, i === mi && styles.mDotOn]}
              />
            ))}
          </View>
          <HText style={styles.momentCount}>
            {mi + 1} of {n} in {y.label}
          </HText>
        </View>
      )}

      {showDesc && <HText style={styles.storyText}>{m.desc}</HText>}
      {!!m.sub && <HText style={styles.storyMore}>{m.sub}</HText>}

      {years.length * n > 1 && (
        <View style={styles.storyBtns}>
          <TouchableOpacity
            onPress={() => onGo(pyi, pmi)}
            accessibilityRole="button"
            accessibilityLabel={`Previous: ${years[pyi].moments[pmi].head}`}
            style={[styles.btn, styles.btnOutline]}>
            <HomeIcon
              name="chevronLeft"
              size={16}
              color={P.deep}
              strokeWidth={2.4}
            />
            <HText style={styles.btnOutlineText}>{prevLabel}</HText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onGo(nyi, nmi)}
            accessibilityRole="button"
            accessibilityLabel={`Next: ${years[nyi].moments[nmi].head}`}
            style={[styles.btn, styles.btnAmber]}>
            <HText style={styles.btnAmberText}>{nextLabel}</HText>
            <HomeIcon
              name="chevronRight"
              size={16}
              color={P.onAmber}
              strokeWidth={2.4}
            />
          </TouchableOpacity>
        </View>
      )}
    </HomeSheet>
  );
};

// ── "The journey continues · since 1981" ──
const LegacySection = ({active, reduceMotion}) => {
  const {AppUserData, authContext} = useContext(AuthContext);
  const [years, setYears] = useState(() => getHistory() || FALLBACK_YEARS);
  const [index, setIndex] = useState(() =>
    startIndexOf(getHistory() || FALLBACK_YEARS),
  );
  const [moment, setMoment] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [storyOpen, setStoryOpen] = useState(false);
  const info = useRef(new Animated.Value(1)).current;
  const prev = useRef(index);
  const [dir, setDir] = useState(1);

  // Saved timeline instantly, fresh one silently; keep the user's place
  const live = useRef({years, index});
  live.current = {years, index};
  useEffect(() => {
    const apply = next => {
      const {years: was, index: at} = live.current;
      if (!next || !next.length || next === was) {
        return;
      }
      const key = was[at] && was[at].key;
      const k = next.findIndex(y => y.key === key);
      setYears(next);
      setIndex(was === FALLBACK_YEARS || k < 0 ? startIndexOf(next) : k);
      setMoment(0);
    };
    const unsub = subscribeHistory(apply);
    whenHistoryHydrated().then(() => apply(getHistory()));
    return unsub;
  }, []);

  const token = AppUserData && AppUserData.token;
  const userId = AppUserData && AppUserData.data && AppUserData.data.userId;
  useEffect(() => {
    if (active) {
      refreshHistory({token, userId, authContext});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, token, userId]);

  const safeIndex = Math.min(index, years.length - 1);
  useEffect(() => {
    warmAround(years, safeIndex);
  }, [years, safeIndex]);

  useEffect(() => {
    if (!playing || !active || storyOpen || reduceMotion || years.length < 2) {
      return;
    }
    const t = setInterval(() => {
      setIndex(i => (i + 1) % years.length);
      setMoment(0);
    }, 7000);
    return () => clearInterval(t);
  }, [playing, active, storyOpen, reduceMotion, years.length]);

  useEffect(() => {
    if (safeIndex !== prev.current) {
      setDir(safeIndex > prev.current ? 1 : -1);
    }
    prev.current = safeIndex;
    if (reduceMotion) {
      return info.setValue(1);
    }
    info.setValue(0);
    Animated.timing(info, {
      toValue: 1,
      duration: 900,
      delay: 350,
      easing: EASE,
      useNativeDriver: true,
    }).start();
  }, [safeIndex, reduceMotion, info]);

  const pick = (i, isCurrent) => {
    setMoment(0);
    if (isCurrent) {
      return setStoryOpen(true);
    }
    setIndex(i);
    setPlaying(false);
  };
  const cur = years[safeIndex];
  const lead = cur.moments[0];
  const extra = cur.moments.length - 1;

  return (
    <View style={styles.legacy}>
      <View style={styles.legacyHead}>
        <HText
          style={styles.legacyTitle}
          accessibilityRole="header"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.85}>
          The journey continues
          {/* narrow phones (< 360pt): the years are on the signposts below anyway */}
          {!NARROW && <HText style={styles.legacySince}> · since 1981</HText>}
        </HText>
        <View style={styles.row}>
          <HText style={styles.legacyCount}>
            {safeIndex + 1} / {years.length}
          </HText>
          <TouchableOpacity
            onPress={() => setPlaying(p => !p)}
            accessibilityRole="button"
            accessibilityLabel={playing ? 'Pause history' : 'Play history'}
            style={styles.playBtn}>
            <HomeIcon
              name={playing ? 'pause' : 'play'}
              size={13}
              color={P.mutedOnDark}
            />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => {
          setMoment(0);
          setStoryOpen(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={`Read the story of ${cur.label}: ${lead.head}${
          extra > 0 ? `, and ${extra} more` : ''
        }`}
        style={styles.infoBtn}>
        <Animated.View
          style={{
            opacity: info,
            transform: [
              {
                translateX: info.interpolate({
                  inputRange: [0, 1],
                  outputRange: [dir * 16, 0],
                }),
              },
            ],
          }}>
          <View style={styles.row}>
            <HText style={styles.infoYear}>{cur.label}</HText>
            {extra > 0 && (
              <View style={styles.infoChip}>
                <HText style={styles.infoChipText}>
                  {cur.moments.length} moments
                </HText>
              </View>
            )}
          </View>
          <HText style={styles.infoHead} numberOfLines={1}>
            {lead.head}
          </HText>
        </Animated.View>
      </TouchableOpacity>

      <LegacyRoad
        years={years}
        index={safeIndex}
        onPick={pick}
        reduceMotion={reduceMotion}
      />

      <StorySheet
        visible={storyOpen}
        years={years}
        index={safeIndex}
        moment={moment}
        onClose={() => setStoryOpen(false)}
        onGo={(yi, mi) => {
          setPlaying(false);
          setIndex(yi);
          setMoment(mi);
        }}
      />
    </View>
  );
};

// ── Header ──
// ── Top bar row: menu · greeting + name · What's New (shared by both layouts) ──
const TopRow = ({
  name,
  onMenu,
  onProfile,
  onBell,
  onWhatsNew,
  showWhatsNew,
  whatsNewDot,
  devAction,
  isManager,
  reduceMotion,
}) => {
  // Long names never get cut: if the name needs more than one line at the
  // normal size, switch to a slightly smaller size and let it wrap.
  const [wrap, setWrap] = useState(false);
  useEffect(() => setWrap(false), [name]);
  return (
    <View style={styles.topRow}>
      <TouchableOpacity
        onPress={onMenu}
        accessibilityRole="button"
        accessibilityLabel="Open menu"
        style={styles.menuBtn}>
        <HomeIcon name="menu" size={22} color="#FFFFFF" strokeWidth={2} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.greetWrap}
        onPress={onProfile}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`${greetingFor()} ${name}. Open my profile`}>
        {/* Two lines so long names get the full row; never pushes the buttons */}
        <View style={styles.greetTop}>
          <HText style={[styles.greetSoft, {flexShrink: 1}]} numberOfLines={1}>
            {greetingFor()}
          </HText>
          {isManager && (
            <View style={styles.roleBadge} accessibilityLabel="Manager mode">
              <HText style={styles.roleBadgeText}>Manager</HText>
            </View>
          )}
        </View>
        <HText
          style={[styles.greet, wrap && styles.greetWrapped]}
          onTextLayout={e => {
            if (!wrap && e.nativeEvent.lines.length > 1) {
              setWrap(true);
            }
          }}>
          {name || 'User'}
        </HText>
      </TouchableOpacity>

      {devAction}
      {showWhatsNew && (
        <GlassButton
          iconNode={
            <WhatsNewIcon active={whatsNewDot} reduceMotion={reduceMotion} />
          }
          onPress={onWhatsNew}
          label={
            whatsNewDot
              ? "What's new in this update, new"
              : "What's new in this update"
          }>
          {whatsNewDot && <NewDot reduceMotion={reduceMotion} />}
        </GlassButton>
      )}
      {!!onBell && (
        <GlassButton icon="bell" onPress={onBell} label="Notifications" />
      )}
    </View>
  );
};

// ── Pinned top bar for the collapsing layout ──
// Transparent at rest (the header backdrop shows through), then fills with the
// same deep-teal glow as the sections below slide under it.
export const HomeTopBar = ({
  scrollY,
  fadeStart = 60,
  fadeEnd = 140,
  onHeight,
  mode = 'employee',
  bandStyle,
  showWhatsNew = true,
  ...rowProps
}) => {
  const isManager = mode === 'manager';
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const [size, setSize] = useState({width: 0, height: 0});
  const fill = scrollY.interpolate({
    inputRange: [fadeStart, Math.max(fadeStart + 1, fadeEnd)],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  return (
    <View
      style={styles.bar}
      onLayout={e => {
        const {width, height} = e.nativeEvent.layout;
        if (width !== size.width || height !== size.height) {
          setSize({width, height});
          onHeight && onHeight(height);
        }
      }}>
      <Animated.View
        pointerEvents="none"
        style={[styles.barBg, {opacity: fill}]}>
        <View style={styles.barBgClip}>
          <HeaderBackdrop
            width={size.width}
            height={size.height}
            tone={isManager ? 'manager' : 'employee'}
            idPrefix={isManager ? 'barM' : 'bar'}
          />
        </View>
      </Animated.View>
      <View style={[{paddingTop: insets.top + 6}, bandStyle]}>
        <TopRow
          {...rowProps}
          showWhatsNew={showWhatsNew}
          isManager={isManager}
          reduceMotion={reduceMotion}
        />
      </View>
    </View>
  );
};

const HomeHeader = ({
  name,
  onMenu,
  onProfile,
  onBell,
  onWhatsNew,
  showWhatsNew = true,
  whatsNewDot = false,
  active = true,
  decor = null,
  bandStyle,
  devAction = null,
  mode = 'employee', // 'manager' → dusk backdrop + Manager badge
  stories = null, // MSIL Happenings banners → story bubbles above The journey continues
  // Collapsing layout: {scrollY, barHeight}. The top row is rendered by
  // <HomeTopBar> (pinned); this body extends behind it and fades as it scrolls.
  collapsible = null,
  onHeight,
}) => {
  const isManager = mode === 'manager';
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const [size, setSize] = useState({width: 0, height: 0});

  const barH = collapsible ? collapsible.barHeight : 0;
  const dist = Math.max(1, size.height - barH);
  const contentMotion = collapsible
    ? {
        opacity: collapsible.scrollY.interpolate({
          inputRange: [0, dist * 0.7],
          outputRange: [1, 0],
          extrapolate: 'clamp',
        }),
        // drifts a little slower than the scroll → soft parallax depth
        transform: [
          {
            translateY: collapsible.scrollY.interpolate({
              inputRange: [0, dist],
              outputRange: [0, dist * 0.22],
              extrapolate: 'clamp',
            }),
          },
          {
            scale: collapsible.scrollY.interpolate({
              inputRange: [0, dist],
              outputRange: [1, 0.97],
              extrapolate: 'clamp',
            }),
          },
        ],
      }
    : null;

  return (
    <View
      style={[styles.header, collapsible && {marginTop: -barH}]}
      onLayout={e => {
        const {width, height} = e.nativeEvent.layout;
        if (width !== size.width || height !== size.height) {
          setSize({width, height});
          onHeight && onHeight(height);
        }
      }}>
      <HeaderBackdrop
        width={size.width}
        height={size.height}
        tone={isManager ? 'manager' : 'employee'}
        idPrefix={isManager ? 'hdrM' : 'hdr'}
      />
      {decor}
      {collapsible ? (
        <View style={{paddingTop: barH}}>
          <Animated.View style={contentMotion}>
            {!!stories && stories.length > 0 && (
              <StoriesRow stories={stories} />
            )}
            <LegacySection active={active} reduceMotion={reduceMotion} />
          </Animated.View>
        </View>
      ) : (
        <View style={[{paddingTop: insets.top + 6}, bandStyle]}>
          <TopRow
            name={name}
            onMenu={onMenu}
            onProfile={onProfile}
            onBell={onBell}
            onWhatsNew={onWhatsNew}
            showWhatsNew={showWhatsNew}
            whatsNewDot={whatsNewDot}
            devAction={devAction}
            isManager={isManager}
            reduceMotion={reduceMotion}
          />
          {!!stories && stories.length > 0 && <StoriesRow stories={stories} />}
          <LegacySection active={active} reduceMotion={reduceMotion} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    overflow: 'hidden',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: P.deep,
  },
  row: {flexDirection: 'row', alignItems: 'center'},
  bar: {paddingHorizontal: 16, zIndex: 10, elevation: 10},
  barBg: {
    ...StyleSheet.absoluteFillObject,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    backgroundColor: P.deep,
    shadowColor: P.deeper,
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 6},
  },
  barBgClip: {
    ...StyleSheet.absoluteFillObject,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    overflow: 'hidden',
  },
  topRow: {flexDirection: 'row', alignItems: 'center', minHeight: 48},
  menuBtn: {
    width: 44,
    height: 44,
    marginLeft: -8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetWrap: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  greet: {
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    textTransform: 'capitalize', // same as the previous Home
  },
  // long names: a touch smaller and allowed to wrap (never truncated)
  greetWrapped: {fontSize: 15, lineHeight: 19, marginTop: 1},
  greetSoft: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '500',
    color: P.mutedOnDark,
  },
  greetTop: {flexDirection: 'row', alignItems: 'center'},
  roleBadge: {
    height: 18,
    paddingHorizontal: 7,
    borderRadius: 9,
    marginLeft: 8,
    backgroundColor: P.amber,
    justifyContent: 'center',
  },
  roleBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: P.deep,
  },
  glassBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginLeft: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotWrap: {position: 'absolute', top: 8, right: 9, width: 9, height: 9},
  dot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: P.amber,
    borderWidth: 1.5,
    borderColor: P.deep,
  },
  dotHalo: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 4.5,
    backgroundColor: P.amber,
  },

  legacy: {marginTop: 6},
  legacyHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 34,
  },
  legacyTitle: {
    flexShrink: 1,
    marginRight: 8,
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  legacySince: {fontSize: 15, fontWeight: '500', color: P.mutedOnDark},
  legacyCount: {...TYPE.label, color: P.mutedOnDark},
  playBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBtn: {height: 58, justifyContent: 'center'},
  infoYear: {...TYPE.display, color: P.amber},
  infoChip: {
    marginLeft: 10,
    height: 22,
    paddingHorizontal: 9,
    borderRadius: 11,
    justifyContent: 'center',
    backgroundColor: 'rgba(242,203,138,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(242,203,138,0.35)',
  },
  infoChipText: {fontSize: 11, fontWeight: '700', color: P.amber},
  infoHead: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
    color: P.softOnDark,
    marginTop: 3,
  },

  road: {height: ROAD_H, marginHorizontal: -16, overflow: 'hidden'},
  track: {position: 'absolute', left: 0, top: 0, height: ROAD_H},
  roadBand: {
    position: 'absolute',
    left: -400,
    top: 54,
    height: 34,
    backgroundColor: 'rgba(7,30,32,0.42)',
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderTopColor: 'rgba(156,189,182,0.35)',
    borderBottomColor: 'rgba(156,189,182,0.18)',
  },
  lane: {
    position: 'absolute',
    left: -400,
    top: 70,
    height: 2,
    flexDirection: 'row',
  },
  dash: {
    width: 14,
    height: 2,
    marginRight: 14,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  post: {
    position: 'absolute',
    top: 0,
    width: 64,
    height: 56,
    alignItems: 'center',
  },
  sign: {
    height: 26,
    paddingHorizontal: 9,
    borderRadius: 8,
    justifyContent: 'center',
  },
  signOn: {
    backgroundColor: P.amber,
    shadowColor: P.amber,
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 0},
    elevation: 4,
  },
  signPast: {backgroundColor: 'rgba(255,255,255,0.14)'},
  signNext: {borderWidth: 1, borderColor: 'rgba(156,189,182,0.45)'},
  signText: {fontSize: 12, fontWeight: '700'},
  pole: {width: 2, flex: 1},
  carShadow: {
    position: 'absolute',
    top: 80,
    width: 64,
    height: 8,
    borderRadius: 32,
    backgroundColor: 'rgba(7,30,32,0.55)',
  },
  car: {position: 'absolute', top: 54, width: 56, height: 28},

  storyHero: {
    height: 150,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 12,
  },
  storyYear: {
    position: 'absolute',
    right: 14,
    top: 6,
    fontSize: 62,
    fontWeight: '300',
    letterSpacing: -1.2,
    color: 'rgba(255,255,255,0.16)',
  },
  storyCaption: {
    position: 'absolute',
    left: 14,
    bottom: 10,
    ...TYPE.eyebrow,
    color: P.lineStrong,
  },
  photoBox: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: P.mint,
  },
  photoPh: {alignItems: 'center', justifyContent: 'center'},
  photoPhYear: {
    position: 'absolute',
    right: 14,
    top: 6,
    fontSize: 62,
    fontWeight: '300',
    letterSpacing: -1.2,
    color: 'rgba(30,106,98,0.12)',
  },
  momentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -2,
    marginBottom: 12,
  },
  mDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
    backgroundColor: P.lineStrong,
  },
  mDotOn: {width: 20, backgroundColor: P.teal},
  momentCount: {fontSize: 12, fontWeight: '600', color: P.sub},
  storyText: {fontSize: 15, lineHeight: 23, color: P.body},
  storyMore: {fontSize: 14, lineHeight: 21, color: P.sub, marginTop: 8},
  storyBtns: {flexDirection: 'row', marginTop: 16},
  btn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOutline: {
    borderWidth: 1,
    borderColor: P.lineStrong,
    backgroundColor: '#FFFFFF',
    marginRight: 10,
  },
  btnOutlineText: {
    fontSize: 14,
    fontWeight: '700',
    color: P.deep,
    marginLeft: 4,
  },
  btnAmber: {
    backgroundColor: P.amber,
    shadowColor: P.amberStrong,
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 6},
    elevation: 3,
  },
  btnAmberText: {
    fontSize: 14,
    fontWeight: '700',
    color: P.onAmber,
    marginRight: 4,
  },
});

export default HomeHeader;
