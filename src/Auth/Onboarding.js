// OnboardingScreen.js — HR Assist first-launch splash & onboarding
// Built from Figma: "Splash -- Introduction screens" (01 Splash → 02 Card opens →
// 03 Cockpit onboarding → 04 Start the engine).
//
// Behaviour is unchanged from the previous swiper version: shown on first launch,
// and when the user finishes it, `isnotfirstTime` is written to EncryptedStorage
// and the app navigates to "SignIn" (see storeData below — untouched).
//
// No new dependencies: React Native Animated + react-native-linear-gradient
// (already in the project). All transform/opacity animations run on the native
// driver; only the card-open morph (layout props) runs on the JS driver.

import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  Easing,
  Pressable,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import EncryptedStorage from 'react-native-encrypted-storage';
import {tick} from '../components/home/ModeSwitch'; // same haptic as the Employee ⇄ Manager switch

// ─── Assets (run download-splash-assets.sh once to fetch them from Figma) ───
const IMG = {
  bloomCore: require('../assets/Images/splash/bloom_core.png'),
  msilLogo: require('../assets/Images/MarutiLogo1.png'), // same full-colour wordmark as SignIn (8340×867)
  hrLogo: require('../assets/Images/hrass.png'),
  plant: require('../assets/Images/splash/plant.jpg'),
  jimny: require('../assets/Images/splash/jimny.jpg'),
  trees: require('../assets/Images/splash/trees.jpg'),
  night: require('../assets/Images/splash/night.jpg'),
  invicto: require('../assets/Images/splash/invicto.jpg'),
  qc: require('../assets/Images/splash/qc.jpg'),
  gypsy: require('../assets/Images/splash/gypsy.jpg'),
  showroom: require('../assets/Images/splash/showroom.jpg'),
  line800: require('../assets/Images/splash/line800.jpg'),
  cockpit: require('../assets/Images/splash/cockpit.png'),
};

// ─── Design tokens (Figma frame is 440 × 996; everything scales by width) ───
const FRAME_W = 440;
const FRAME_H = 996;

// Set to true once Inter is linked in the app (assets/fonts + react-native.config.js).
// Until then the platform UI font is used (SF Pro / Roboto — visually very close).
const USE_INTER = false;
const font = weight => {
  if (!USE_INTER) {
    return {fontWeight: weight};
  }
  const map = {'400': 'Inter-Regular', '500': 'Inter-Medium', '600': 'Inter-SemiBold', '700': 'Inter-Bold'};
  return {fontFamily: map[weight]};
};

// MSIL palette — forest green · Teal glow #171C8F · Amber #FCBE62 (shared with SignIn.js)
const COLOR = {
  forest: '#171C8F',
  forestDeep: '#01044B',
  forestMid: '#171C8F',
  teal: '#171C8F',
  tealLight: 'rgba(255,255,255,0.72)',
  mint: 'rgba(255,255,255,0.72)',
  amber: '#FCBE62',
  cream: '#FFFFFF',
  bloomTop: '#171C8F',
  bloomMid: '#171C8F',
  bloomBottom: '#01044B',
  tagline: '#FFFFFF',
  title: '#FFFFFF',
  body: 'rgba(255,255,255,0.66)',
  cockpitBase: '#01044B',
};
const teal = a => `rgba(23,28,143,${a})`;
const tealLight = a => `rgba(255,255,255,${a})`;
const amber = a => `#FCBE62`;

// Easing curves, straight from the Figma captions
const E_BLOOM = Easing.bezier(0.4, 0, 0.2, 1);
const E_LOGO = Easing.bezier(0.32, 0.72, 0, 1);
const E_OPEN = Easing.bezier(0.65, 0, 0.35, 1);
const E_SINE = Easing.inOut(Easing.sin);

// Timeline (ms) — matches the absolute times in the Figma captions
const T = {
  bloomIn: [0, 800],
  bloomOpen: [600, 450],
  logo: [650, 1250],
  tagline: [900, 1000],
  spread: [1900, 1550],
  carouselCopy: [3250, 820],
  tapToOpen: 3450,
  autoOpen: 5670, // copy lands at ~4.07s, then the 1.6s hold
  open: 1300,
  settleLead: 850, // cockpit starts 0.45s before the open finishes
  settle: 1200,
  photoHold: 2200,
  crossFade: 900,
  darken: 1000,
  holdFill: 1200,
  holdDrain: 550,
  engineOn: 800,
  orb: 1000,
};

const ROW_ANGLE = 9.17; // degrees
const COS = Math.cos((ROW_ANGLE * Math.PI) / 180);
const SIN = Math.sin((ROW_ANGLE * Math.PI) / 180);
const DRIFT_SECONDS = 10;
const DRIFT_PX = 24 * DRIFT_SECONDS; // 24 px/s

// Portrait photos (line800, qc, gypsy, showroom) share one aspect ratio
const PHOTO_ASPECT = 547.3 / 1191.3;

// ─── Carousel layout (design coordinates, from Figma "Carousel rows") ───
// x/y/bw/bh = rotated bounding box; w/h = the card itself; crop = portrait crop
const LAND = {bw: 205.192, bh: 146.58, w: 188.8, h: 118};
const PORT = {bw: 176.069, bh: 141.879, w: 159.3, h: 118};
const crop = top => ({heightPct: 2.9382, topPct: top});

const ROW_TOP = [
  {img: 'trees', x: -413.7, y: 277.41, ...LAND},
  {img: 'plant', x: -211.5, y: 244.71, ...LAND},
  {img: 'jimny', x: -9.3, y: 212.01, ...LAND},
  {img: 'trees', x: 192.8, y: 179.41, ...LAND},
  {img: 'night', x: 395.02, y: 148.8, bw: 192.951, bh: 144.604, w: 176.4, h: 118},
  {img: 'invicto', x: 597.2, y: 116.1, ...LAND},
];
const ROW_MID = [
  {img: 'qc', x: -223.83, y: 383.06, ...PORT, crop: crop(-1.1748)},
  {img: 'gypsy', x: -50.73, y: 355.06, ...PORT, crop: crop(-1.2629)},
  {img: 'line800', x: 121.21, y: 317.13, bw: 197.188, bh: 158.941, w: 178.4, h: 132.2, crop: {heightPct: 2.9371, topPct: -1.2916}, hero: true},
  {img: 'showroom', x: 314.27, y: 296.16, ...PORT, crop: crop(-1.1454)},
  {img: 'qc', x: 487.27, y: 268.26, ...PORT, crop: crop(-1.1748)},
];
const ROW_BOTTOM = [
  {img: 'jimny', x: -264.1, y: 516.61, ...LAND},
  {img: 'invicto', x: -61.9, y: 483.91, ...LAND},
  {img: 'plant', x: 140.3, y: 451.21, ...LAND},
  {img: 'jimny', x: 342.5, y: 418.61, ...LAND},
  {img: 'trees', x: 544.7, y: 386.01, ...LAND},
];

const LOGO_CENTER = {x: 220, y: 360.65};
const TAG_W = 380; // width of the tagline reveal window
const TAGLINE = 'Built around our people';
const HERO = ROW_MID.find(c => c.hero);
const HERO_CENTER = {x: HERO.x + HERO.bw / 2, y: HERO.y + HERO.bh / 2};

// ─── Cockpit onboarding (03 → 04) ───
const PHOTOS = [
  {img: 'line800', top: -323.9},
  {img: 'showroom', top: -264.3},
  {img: 'qc', top: -276.3},
  {img: 'gypsy', top: -312},
];
const COPY = [
  {title: 'Where it all began', line: 'Four decades of cars, and the people who make them'},
  {title: 'Made for every family', line: "Every car we make ends up in someone's story"},
  {title: 'Every detail, checked', line: 'The same care goes into looking after our people'},
  {title: 'Built for every terrain', line: 'Wherever work takes you, HR Assist comes along'},
  {title: 'Start your engine', line: 'Leave, attendance, gatepasses and more, all in one simple app'},
];
const START_COPY = COPY.length - 1;

// ─── Make the layout robust to how layers were exported from Figma ───
const assetSize = src => {
  const r = Image.resolveAssetSource(src) || {};
  return {w: r.width || 0, h: r.height || 0};
};
const closest = (ratio, options) =>
  options.reduce((best, o) => (Math.abs(o.W / o.H - ratio) < Math.abs(best.W / best.H - ratio) ? o : best));

// Figma drop shadow on the cards: y 10, blur 26 → export grows 26 / 26 / 16 / 36 (l/r/t/b)
const SHADOW = {l: 26, r: 26, t: 16, b: 36};
const landscapeLayout = card => {
  const {w, h} = assetSize(IMG[card.img]);
  const options = [
    {W: card.w, H: card.h, flat: true}, // straight photo
    {W: card.bw, H: card.bh, dy: 0}, // tilted card
    {W: card.bw + SHADOW.l + SHADOW.r, H: card.bh + SHADOW.t + SHADOW.b, dy: (SHADOW.b - SHADOW.t) / 2}, // tilted card + shadow
  ];
  return w && h ? closest(w / h, options) : options[0];
};

// Cockpit: either the image layer (732.2 × 1593.7) or the whole Cockpit frame (440 × 996)
const cockpitLayout = () => {
  const {w, h} = assetSize(IMG.cockpit);
  const options = [
    {W: 732.2, H: 1593.7, left: -292.2, bottomOffset: FRAME_H - (-113.2 + 1593.7)},
    {W: 440, H: 996, left: 0, bottomOffset: 0},
  ];
  return w && h ? closest(w / h, options) : options[0];
};

const useAnim = (count, init = 0) =>
  useRef(Array.from({length: count}, () => new Animated.Value(init))).current;

// ─────────────────────────────────────────────────────────────────────────────

const OnboardingScreen = ({navigation}) => {
  const {width: W, height: H} = useWindowDimensions();
  const s = W / FRAME_W;
  // Anything that sits on the dash is anchored to the bottom of the screen
  const fromBottom = designBottom => (FRAME_H - designBottom) * s;

  // ── Unchanged: first-run flag + navigation ──
  const storeData = async () => {
    try {
      await EncryptedStorage.setItem('isnotfirstTime', 'abcd').then(() => {
        navigation.navigate('SignIn');
      });
    } catch (e) {
      // saving error
    }
  };

  // ── UI state ──
  const [barStyle, setBarStyle] = useState('light-content');
  const [heroVisible, setHeroVisible] = useState(false);
  const [startEnabled, setStartEnabled] = useState(false);
  const [startLabel, setStartLabel] = useState('Tap to start');

  const phase = useRef('intro'); // intro → carousel → opening → cockpit → start → engine
  const photoIdx = useRef(0);
  const copyIdx = useRef(0);
  const lastAdvance = useRef(0);
  const timers = useRef([]);
  const photoTimer = useRef(null);
  const finished = useRef(false);

  // ── Animated values (native driver unless noted) ──
  const [coreIn, coreOpen, logoIn, logoOut, tagline, toWhite] = useAnim(6);
  const [spreadT, midGlide, drift, carouselCopy, carouselOut] = useAnim(5);
  const [cockpitIn, darkV, hold, breath, spin, engineV, flashV, orbV] = useAnim(8);
  const photoFade = useAnim(PHOTOS.length);
  const photoDrift = useAnim(PHOTOS.length);
  const copyV = useAnim(COPY.length);
  // JS driver (layout props for the card-open morph)
  const openT = useRef(new Animated.Value(0)).current;
  const settleT = useRef(new Animated.Value(0)).current;

  const later = useCallback((fn, ms) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  }, []);

  const run = (value, toValue, duration, easing = E_BLOOM, delay = 0, native = true) =>
    Animated.timing(value, {toValue, duration, easing, delay, useNativeDriver: native});

  // ── Copy swap: old copy fades, new one rises 10px ──
  const showCopy = useCallback(
    next => {
      if (copyIdx.current === next) {
        return;
      }
      run(copyV[copyIdx.current], 0, 300).start();
      run(copyV[next], 1, 600, E_BLOOM, 250).start();
      copyIdx.current = next;
    },
    [copyV],
  );

  // ── 04 · Start the engine ──
  const goStartStep = useCallback(() => {
    if (phase.current === 'start' || phase.current === 'engine') {
      return;
    }
    phase.current = 'start';
    clearTimeout(photoTimer.current);
    run(darkV, 1, T.darken, E_OPEN).start();
    showCopy(START_COPY);
  }, [darkV, showCopy]);

  // ── 03 · Photo cycle ──
  const showPhoto = useCallback(
    i => {
      photoIdx.current = i;
      lastAdvance.current = Date.now();
      run(photoFade[i], 1, T.crossFade, E_BLOOM).start();
      run(photoDrift[i], 1, T.crossFade + T.photoHold, Easing.linear).start();
      showCopy(i);
      clearTimeout(photoTimer.current);
      photoTimer.current = later(() => advance(), T.crossFade + T.photoHold);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [photoFade, photoDrift, showCopy, later],
  );

  const advance = useCallback(() => {
    if (phase.current !== 'cockpit') {
      return;
    }
    clearTimeout(photoTimer.current);
    if (photoIdx.current < PHOTOS.length - 1) {
      showPhoto(photoIdx.current + 1);
    } else {
      goStartStep();
    }
  }, [showPhoto, goStartStep]);

  // ── 02 · Card opens → 03.1 cockpit settles ──
  const openCard = useCallback(() => {
    if (phase.current !== 'intro' && phase.current !== 'carousel') {
      return;
    }
    phase.current = 'opening';
    setHeroVisible(true);
    run(carouselOut, 1, T.open * 0.4, E_OPEN).start();
    run(openT, 1, T.open, E_OPEN, 0, false).start();

    later(() => {
      setBarStyle('light-content');
      run(settleT, 1, T.settle, E_OPEN, 0, false).start();
      run(cockpitIn, 1, T.settle, E_OPEN).start();
      run(copyV[0], 1, 600, E_BLOOM, 300).start();
      run(photoDrift[0], 1, T.settle + T.photoHold, Easing.linear).start();
      later(() => {
        phase.current = 'cockpit';
        setStartEnabled(true);
        lastAdvance.current = Date.now();
        photoTimer.current = later(() => advance(), T.photoHold);
      }, T.settle);
    }, T.settleLead);
  }, [carouselOut, openT, settleT, cockpitIn, copyV, photoDrift, later, advance]);

  // ── 04.3 Engine on → 04.4 App opens ──
  const engineOn = useCallback(() => {
    if (phase.current === 'engine') {
      return;
    }
    phase.current = 'engine';
    setStartLabel('Engine on');
    clearTimeout(photoTimer.current);
    run(darkV, 1, 600, E_OPEN).start();
    showCopy(START_COPY);
    run(engineV, 1, 250).start();
    Animated.sequence([run(flashV, 0.5, 160), run(flashV, 1, T.engineOn - 160, E_OPEN)]).start();
    later(() => {
      run(orbV, 1, T.orb, E_OPEN).start(() => {
        if (!finished.current) {
          finished.current = true;
          storeData();
        }
      });
    }, T.engineOn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [darkV, engineV, flashV, orbV, showCopy, later]);

  // ── Tap to start: light haptic, ring snaps closed, engine on straight away ──
  const onStartPress = () => {
    if (!startEnabled || phase.current === 'engine') {
      return;
    }
    tick();
    Animated.timing(hold, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
    engineOn();
  };

  // ── Taps: open the card sooner / bring the next photo sooner ──
  const onScreenPress = () => {
    if (phase.current === 'carousel') {
      openCard();
    } else if (phase.current === 'cockpit' && Date.now() - lastAdvance.current > 500) {
      advance();
    }
  };

  // ── 01 · Splash timeline ──
  useEffect(() => {
    run(coreIn, 1, T.bloomIn[1], E_BLOOM, T.bloomIn[0]).start();
    run(coreOpen, 1, T.bloomOpen[1], E_BLOOM, T.bloomOpen[0]).start();
    run(logoIn, 1, T.logo[1], E_LOGO, T.logo[0]).start();
    run(tagline, 1, T.tagline[1], E_LOGO, T.tagline[0]).start();

    run(spreadT, 1, T.spread[1], Easing.linear, T.spread[0]).start();
    run(midGlide, 1, T.spread[1], E_LOGO, T.spread[0]).start();
    run(toWhite, 1, 600, E_BLOOM, T.spread[0]).start();
    run(logoOut, 1, 500, E_BLOOM, T.spread[0]).start();
    run(drift, 1, DRIFT_SECONDS * 1000, Easing.linear, T.spread[0]).start();
    run(carouselCopy, 1, T.carouselCopy[1], E_LOGO, T.carouselCopy[0]).start();

    later(() => {
      if (phase.current === 'intro') {
        phase.current = 'carousel';
      }
    }, T.tapToOpen);
    later(openCard, T.autoOpen);

    // Start button idle life: slow turning light + breathing
    Animated.loop(run(spin, 1, 6000, Easing.linear)).start();
    Animated.loop(Animated.sequence([run(breath, 1, 1400, E_SINE), run(breath, 0, 1400, E_SINE)])).start();

    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      clearTimeout(photoTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derived geometry ──
  const cover = useMemo(() => {
    if (W / H > PHOTO_ASPECT) {
      const ch = W / PHOTO_ASPECT;
      return {left: 0, top: (H - ch) / 2, width: W, height: ch};
    }
    const cw = H * PHOTO_ASPECT;
    return {left: (W - cw) / 2, top: 0, width: cw, height: H};
  }, [W, H]);

  const cockpit = useMemo(cockpitLayout, []);

  const photoRect = top => ({left: -53.7 * s, top: top * s, width: 547.3 * s, height: 1191.3 * s});

  // ── Render helpers ──
  // Landscape photo inside a tilted card. If the file is the tilted card exported
  // from Figma, counter-rotate it so its card lines up exactly with this clip;
  // the clip then trims the export's white frame / shadow area.
  const renderLandscape = card => {
    const L = landscapeLayout(card);
    if (L.flat) {
      return <Image source={IMG[card.img]} resizeMode="cover" style={styles.fill} />;
    }
    const k = 1.04; // push the export's own rounded edge just outside the clip
    const iw = L.W * s * k;
    const ih = L.H * s * k;
    return (
      <View style={[StyleSheet.absoluteFill, {transform: [{rotate: `${ROW_ANGLE}deg`}]}]}>
        <Image
          source={IMG[card.img]}
          resizeMode="stretch"
          style={{position: 'absolute', width: iw, height: ih, left: (card.w * s - iw) / 2, top: (card.h * s - ih) / 2 + L.dy * s}}
        />
      </View>
    );
  };

  const renderCard = (card, key, rowStyle) => {
    const cx = card.x + card.bw / 2;
    const cy = card.y + card.bh / 2;
    const dist = Math.hypot(cx - LOGO_CENTER.x, cy - LOGO_CENTER.y);
    const d = 0.3 * Math.min(1, dist / 450); // cards nearer the logo leave first
    const p = spreadT.interpolate({
      inputRange: [d, d + 0.12, d + 0.3, d + 0.5, d + 0.7],
      outputRange: [0, 0.55, 0.85, 0.97, 1],
      extrapolate: 'clamp',
    });
    const hidden = card.hero && heroVisible;
    return (
      <Animated.View
        key={key}
        style={[
          styles.abs,
          {
            left: card.x * s,
            top: card.y * s,
            width: card.bw * s,
            height: card.bh * s,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: hidden ? 0 : p.interpolate({inputRange: [0, 0.3, 1], outputRange: [0, 1, 1]}),
            transform: [
              {translateX: p.interpolate({inputRange: [0, 1], outputRange: [(LOGO_CENTER.x - cx) * s, 0]})},
              {translateY: p.interpolate({inputRange: [0, 1], outputRange: [(LOGO_CENTER.y - cy) * s, 0]})},
              {scale: p.interpolate({inputRange: [0, 1], outputRange: [0.35, 1]})},
            ],
          },
          rowStyle,
        ]}>
        <View style={[styles.cardShadow, {width: card.w * s, height: card.h * s, borderRadius: 20 * s, transform: [{rotate: `-${ROW_ANGLE}deg`}]}]}>
          <View style={[styles.cardClip, {borderRadius: 20 * s, borderWidth: 1.2 * s}]}>
            {card.crop ? (
              <Image
                source={IMG[card.img]}
                resizeMode="cover"
                style={{position: 'absolute', left: 0, width: '100%', height: card.h * s * card.crop.heightPct, top: card.h * s * card.crop.topPct}}
              />
            ) : (
              renderLandscape(card)
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  // Row motion: top/bottom drift 24 px/s in opposite directions along the 9° tilt,
  // centre row glides in once and lands on the 800 card.
  const topRowStyle = {
    transform: [
      {translateX: drift.interpolate({inputRange: [0, 1], outputRange: [0, DRIFT_PX * COS * s]})},
      {translateY: drift.interpolate({inputRange: [0, 1], outputRange: [0, -DRIFT_PX * SIN * s]})},
    ],
  };
  const bottomRowStyle = {
    transform: [
      {translateX: drift.interpolate({inputRange: [0, 1], outputRange: [0, -DRIFT_PX * COS * s]})},
      {translateY: drift.interpolate({inputRange: [0, 1], outputRange: [0, DRIFT_PX * SIN * s]})},
    ],
  };
  const midRowStyle = {
    transform: [
      {translateX: midGlide.interpolate({inputRange: [0, 1], outputRange: [-170 * COS * s, 0]})},
      {translateY: midGlide.interpolate({inputRange: [0, 1], outputRange: [170 * SIN * s, 0]})},
    ],
  };
  const carouselVisible = carouselOut.interpolate({inputRange: [0, 1], outputRange: [1, 0]});

  // Hero (800 card → full screen → settles above the dash). JS driver.
  const heroSum = Animated.add(openT, settleT);
  const target0 = photoRect(PHOTOS[0].top);
  const heroCard = {
    left: (HERO_CENTER.x - HERO.w / 2) * s,
    top: (HERO_CENTER.y - HERO.h / 2) * s,
    width: HERO.w * s,
    height: HERO.h * s,
  };
  const io = (v, a, b) => v.interpolate({inputRange: [0, 1], outputRange: [a, b]});
  const io3 = (v, a, b, c) => v.interpolate({inputRange: [0, 1, 2], outputRange: [a, b, c], extrapolate: 'clamp'});

  // Hold ring geometry (inside the 330 × 330 start button)
  const B = 330 * s;
  const C = B / 2;
  const RING = 138 * s;
  const STROKE = Math.max(2, 3 * s);
  const ringRight = hold.interpolate({inputRange: [0, 0.5, 1], outputRange: ['-135deg', '45deg', '45deg']});
  const ringLeft = hold.interpolate({inputRange: [0, 0.5, 1], outputRange: ['-135deg', '-135deg', '45deg']});
  const glow = Animated.add(
    breath.interpolate({inputRange: [0, 1], outputRange: [0.35, 0.75]}),
    Animated.add(hold.interpolate({inputRange: [0, 1], outputRange: [0, 0.6]}), engineV),
  ).interpolate({inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp'});

  // Orb has to grow until it covers the farthest corner
  const orbCenterY = H - fromBottom(951.8) - 165 * s;
  const orbReach = Math.hypot(W / 2, orbCenterY);
  const orbScale = (orbReach / (250 * s)) * 1.1;

  const fadeH = Math.max(568.4 * s, H - 427.6 * s);
  const fadeK = (568.4 * s) / fadeH;

  const glowRing = (size, alpha, width) => (
    <View
      style={[
        styles.abs,
        {left: C - size / 2, top: C - size / 2, width: size, height: size, borderRadius: size / 2, borderWidth: width, borderColor: tealLight(alpha)},
      ]}
    />
  );

  return (
    <Pressable style={styles.root} onPress={onScreenPress} accessible={false}>
      <StatusBar translucent backgroundColor="rgba(255,255,255,0)" barStyle={barStyle} />

      {/* ── 01.3 base: forest page with the teal wash ── */}
      <View style={[StyleSheet.absoluteFill, {backgroundColor: '#171C8F'}]} />
      <Animated.View style={[styles.abs, {left: 0, top: 0, width: W, height: 300 * s, opacity: toWhite}]}>
        <LinearGradient
          colors={[teal(0.75), teal(0.28), teal(0)]}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* ── 01.1 / 01.2 bloom: light blooms out of the centre ── */}
      <Animated.View style={[StyleSheet.absoluteFill, {opacity: io(toWhite, 1, 0)}]} pointerEvents="none">
        <LinearGradient
          colors={['#171C8F', '#01044B', '#171C8F', '#01044B']}
          locations={[0, 0.38, 0.72, 1]}
          start={{x: 0.95, y: 0}}
          end={{x: 0.1, y: 1}}
          style={StyleSheet.absoluteFill}
        />
        {[1, 1.18, 0.82].map((k, i) => (
          <Animated.Image
            key={`core${i}`}
            source={IMG.bloomCore}
            resizeMode="stretch"
            style={[
              styles.abs,
              {
                tintColor: i === 2 ? '#FFFFFF' : '#171C8F',
                left: 10 * s,
                top: 190 * s,
                width: 420 * s,
                height: 560 * s,
                opacity: i === 0 ? Animated.multiply(coreIn, 0.55) : io(coreOpen, 0, i === 1 ? 0.4 : 0.22),
                transform: [
                  {translateY: io(coreOpen, 0, -(470 - LOGO_CENTER.y) * s)},
                  {scale: Animated.multiply(coreIn, io(coreOpen, 1, 1.95 * k))},
                ],
              },
            ]}
          />
        ))}
      </Animated.View>

      {/* ── 01.3 carousel ── */}
      <Animated.View style={[StyleSheet.absoluteFill, {opacity: carouselVisible}]} pointerEvents="none">
        {ROW_TOP.map((c, i) => renderCard(c, `t${i}`, topRowStyle))}
        {ROW_BOTTOM.map((c, i) => renderCard(c, `b${i}`, bottomRowStyle))}
        {ROW_MID.map((c, i) => renderCard(c, `m${i}`, midRowStyle))}

        <Animated.View style={[styles.abs, {left: 0, top: 427.6 * s, width: W, height: fadeH, opacity: toWhite}]}>
          <LinearGradient
            colors={['rgba(255,255,255,0)', '#171C8F', '#171C8F', '#171C8F']}
            locations={[0, 0.186 * fadeK, 0.31 * fadeK, 1]}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.abs,
            {left: 28 * s, top: 640 * s, width: 384 * s, opacity: carouselCopy, transform: [{translateY: io(carouselCopy, 14 * s, 0)}]},
          ]}>
          <Text allowFontScaling={false} style={[font('700'), {fontSize: 11.5 * s, letterSpacing: 2 * s, color: '#FFFFFF', marginBottom: 8 * s}]}>
            MADE FOR THE EVERYDAY
          </Text>
          <Text allowFontScaling={false} style={[font('700'), {fontSize: 27 * s, lineHeight: 33 * s, color: '#FFFFFF'}]}>
            Meet the new HR Assist
          </Text>
          <Text allowFontScaling={false} style={[font('400'), {marginTop: 13 * s, fontSize: 16.5 * s, lineHeight: 23 * s, color: '#FFFFFF'}]}>
            Leave, attendance, gatepasses and more, all in one simple app
          </Text>
        </Animated.View>
      </Animated.View>

      {/* ── 01.2 logos + tagline (revealed left → right) ── */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, {opacity: Animated.multiply(logoIn.interpolate({inputRange: [0, 0.35, 1], outputRange: [0, 1, 1]}), io(logoOut, 1, 0))}]}>
        <Animated.View
          style={[
            styles.abs,
            styles.logoShadow,
            {
              left: 40 * s,
              top: 268 * s,
              width: 360 * s,
              height: 184 * s,
              alignItems: 'center',
              transform: [{scale: Animated.multiply(io(logoIn, 1.14, 1), io(logoOut, 1, 0.86))}],
            },
          ]}>
          {/* white plate + full-colour wordmark, same as SignIn */}
          <View
            style={{
              paddingHorizontal: 18 * s,
              paddingVertical: 13 * s,
              borderRadius: 14 * s,
              backgroundColor: '#FFFFFF',
              shadowColor: '#01044B',
              shadowOpacity: 0.28,
              shadowRadius: 16 * s,
              shadowOffset: {width: 0, height: 8 * s},
              elevation: 6,
            }}>
            <Image
              source={IMG.msilLogo}
              resizeMode="contain"
              accessibilityLabel="Maruti Suzuki"
              style={{width: 282 * s, height: 282 * s * (867 / 8340)}}
            />
          </View>
          <View style={{width: 34 * s, height: 2 * s, borderRadius: s, marginTop: 22 * s, marginBottom: 14 * s, backgroundColor: '#FCBE62'}} />
          <Image source={IMG.hrLogo} resizeMode="contain" style={{width: 270 * s, height: 82 * s, tintColor: '#FFFFFF'}} />
        </Animated.View>

        <View style={[styles.abs, {left: (W - TAG_W * s) / 2, top: 474 * s, width: TAG_W * s, height: 36 * s, overflow: 'hidden'}]}>
          <Animated.View style={[StyleSheet.absoluteFill, {overflow: 'hidden', transform: [{translateX: io(tagline, -TAG_W * s, 0)}]}]}>
            <Animated.View style={[StyleSheet.absoluteFill, {transform: [{translateX: io(tagline, TAG_W * s, 0)}]}]}>
              <Text allowFontScaling={false} style={[font('500'), {fontSize: 23 * s, lineHeight: 33 * s, letterSpacing: 0.4 * s, color: '#FFFFFF', textAlign: 'center'}]}>
                {TAGLINE}
              </Text>
            </Animated.View>
          </Animated.View>
        </View>
      </Animated.View>

      {/* ── 02 hero card → 03 photos ── */}
      <Animated.View style={[StyleSheet.absoluteFill, {opacity: heroVisible ? 1 : 0}]} pointerEvents="none">
        <Animated.View style={[StyleSheet.absoluteFill, {backgroundColor: '#01044B', opacity: cockpitIn}]} />
        <Animated.View style={[StyleSheet.absoluteFill, {transform: [{scale: io(photoDrift[0], 1, 1.03)}]}]}>
          <Animated.View
            style={[
              styles.abs,
              {
                overflow: 'hidden',
                left: io(openT, heroCard.left, 0),
                top: io(openT, heroCard.top, 0),
                width: io(openT, heroCard.width, W),
                height: io(openT, heroCard.height, H),
                borderRadius: io(openT, 20 * s, 0),
                transform: [{rotate: io(openT, `-${ROW_ANGLE}deg`, '0deg')}],
              },
            ]}>
            <Animated.Image
              source={IMG.line800}
              resizeMode="cover"
              style={[
                styles.abs,
                {
                  left: io3(heroSum, 0, cover.left, target0.left),
                  top: io3(heroSum, heroCard.height * HERO.crop.topPct, cover.top, target0.top),
                  width: io3(heroSum, heroCard.width, cover.width, target0.width),
                  height: io3(heroSum, heroCard.height * HERO.crop.heightPct, cover.height, target0.height),
                },
              ]}
            />
          </Animated.View>
        </Animated.View>

        {PHOTOS.slice(1).map((ph, k) => {
          const i = k + 1;
          return (
            <Animated.View
              key={ph.img}
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: '#01044B',
                  opacity: photoFade[i],
                  transform: [{scale: Animated.multiply(io(photoFade[i], 1.04, 1), io(photoDrift[i], 1, 1.03))}],
                },
              ]}>
              <Image source={IMG[ph.img]} resizeMode="cover" style={[styles.abs, photoRect(ph.top)]} />
            </Animated.View>
          );
        })}
      </Animated.View>

      {/* ── 03 cockpit: top shade, dash (26px lift), copy ── */}
      <Animated.View pointerEvents="box-none" style={[StyleSheet.absoluteFill, {opacity: cockpitIn}]}>
        <LinearGradient
          colors={['#01044B', '#01044B', 'rgba(255,255,255,0)']}
          locations={[0, 0.55, 1]}
          style={[styles.abs, {left: 0, top: 0, width: W, height: 300 * s}]}
          pointerEvents="none"
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.abs,
            {left: cockpit.left * s, bottom: cockpit.bottomOffset * s, width: cockpit.W * s, height: cockpit.H * s, transform: [{translateY: io(cockpitIn, 26 * s, 0)}]},
          ]}>
          <Image source={IMG.cockpit} resizeMode="cover" style={styles.fill} />
        </Animated.View>

        {/* 04 · cockpit fades to near black */}
        <Animated.View pointerEvents="none" style={[styles.abs, {left: 0, bottom: 0, width: W, height: 468.4 * s, opacity: darkV}]}>
          <LinearGradient
            colors={['rgba(255,255,255,0)', '#01044B', '#01044B', '#01044B']}
            locations={[0, 0.2, 0.45, 1]}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {COPY.map((c, i) => (
          <Animated.View
            key={c.title}
            pointerEvents="none"
            style={[styles.abs, {left: 28 * s, top: 102.2 * s, width: 384 * s, opacity: copyV[i], transform: [{translateY: io(copyV[i], 10 * s, 0)}]}]}>
            <Text allowFontScaling={false} style={[font('700'), styles.copyShadow, {fontSize: 31 * s, lineHeight: 37 * s, color: '#FFFFFF'}]}>
              {c.title}
            </Text>
            <Text
              allowFontScaling={false}
              style={[font('400'), styles.copyShadow, {marginTop: 14 * s, fontSize: 20 * s, lineHeight: 28 * s, color: 'rgba(255,255,255,0.72)'}]}>
              {c.line}
            </Text>
          </Animated.View>
        ))}

        {/* ── Start button (Glass): tap to start ── */}
        <Pressable
          disabled={!startEnabled}
          onPress={onStartPress}
          accessibilityRole="button"
          accessibilityLabel="Start"
          accessibilityHint="Opens HR Assist"
          accessibilityActions={[{name: 'activate'}]}
          onAccessibilityAction={e => e.nativeEvent.actionName === 'activate' && onStartPress()}
          hitSlop={8}
          style={[styles.abs, {left: (W - B) / 2, bottom: fromBottom(951.8), width: B, height: B}]}>
          {/* dark pool + teal light on the dash */}
          <Image source={IMG.bloomCore} resizeMode="stretch" style={[styles.abs, {left: C - 150 * s, top: C - 160 * s, width: 300 * s, height: 320 * s, tintColor: '#01044B', opacity: 0.28}]} />
          <Animated.Image
            source={IMG.bloomCore}
            resizeMode="stretch"
            style={[styles.abs, {left: C - 165 * s, top: C - 180 * s, width: 330 * s, height: 360 * s, tintColor: '#FFFFFF', opacity: Animated.multiply(glow, 0.22)}]}
          />
          <Animated.Image
            source={IMG.bloomCore}
            resizeMode="stretch"
            style={[styles.abs, {left: C - 120 * s, top: C - 135 * s, width: 240 * s, height: 270 * s, tintColor: '#171C8F', opacity: Animated.multiply(glow, 0.75)}]}
          />
          {/* dim ring line */}
          <View style={[styles.abs, {left: C - RING / 2, top: C - RING / 2, width: RING, height: RING, borderRadius: RING / 2, borderWidth: 1.5 * s, borderColor: tealLight(0.28)}]} />
          {/* glass */}
          <View style={[styles.abs, styles.glassShadow, {left: C - 64 * s, top: C - 64 * s, width: 128 * s, height: 128 * s, borderRadius: 64 * s}]}>
            <LinearGradient
              colors={['#171C8F', '#171C8F', '#01044B']}
              locations={[0, 0.55, 1]}
              start={{x: 0.3, y: 0}}
              end={{x: 0.7, y: 1}}
              style={[styles.fill, {borderRadius: 64 * s, borderWidth: 1.3 * s, borderColor: 'rgba(255,255,255,0.28)'}]}
            />
            <View style={[styles.abs, {left: 29 * s, top: 11 * s, width: 70 * s, height: 30 * s, borderRadius: 35 * s, backgroundColor: 'rgba(255,255,255,0.08)'}]} />
            <View style={[styles.fill, {alignItems: 'center', justifyContent: 'center'}]}>
              <View style={{width: 34 * s, height: 34 * s}}>
                <Ionicons name="power" size={34 * s} color="rgba(255,255,255,0.72)" style={styles.abs} />
                <Animated.View style={[styles.abs, {opacity: Animated.add(engineV, hold.interpolate({inputRange: [0, 1], outputRange: [0, 0.6]}))}]}>
                  <Ionicons name="power" size={34 * s} color={'#FFFFFF'} />
                </Animated.View>
              </View>
              <Text allowFontScaling={false} style={[font('600'), {marginTop: 8 * s, fontSize: 10 * s, letterSpacing: 2.4 * s, color: 'rgba(255,255,255,0.5)'}]}>
                START
              </Text>
            </View>
          </View>
          <Text
            allowFontScaling={false}
            style={[styles.abs, font('500'), {left: 0, right: 0, top: 266 * s, textAlign: 'center', fontSize: 14 * s, color: startLabel === 'Engine on' ? '#FFFFFF' : 'rgba(255,255,255,0.62)'}]}>
            {startLabel}
          </Text>

          {/* ring of light: breathes while waiting, brightens while holding */}
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, {opacity: glow}]}>
            {glowRing(142 * s, 0.5, 2 * s)}
            {glowRing(152 * s, 0.22, 3 * s)}
            {glowRing(166 * s, 0.08, 6 * s)}
          </Animated.View>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.abs,
              {
                left: C - 71 * s,
                top: C - 71 * s,
                width: 142 * s,
                height: 142 * s,
                borderRadius: 71 * s,
                borderWidth: 1.5 * s,
                borderTopColor: amber(0.95),
                borderRightColor: amber(0.3),
                borderBottomColor: 'rgba(23,28,143,0)',
                borderLeftColor: 'rgba(23,28,143,0)',
                opacity: Animated.multiply(glow, io(engineV, 1, 0)),
                transform: [{rotate: spin.interpolate({inputRange: [0, 1], outputRange: ['0deg', '360deg']})}],
              },
            ]}
          />

          {/* white line runs round over 1.2s */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.abs,
              styles.ringGlow,
              {left: C - RING / 2, top: C - RING / 2, width: RING, height: RING, opacity: hold.interpolate({inputRange: [0, 0.02, 1], outputRange: [0, 1, 1]})},
            ]}>
            <View style={[styles.abs, {left: RING / 2, top: 0, width: RING / 2, height: RING, overflow: 'hidden'}]}>
              <Animated.View
                style={[
                  styles.abs,
                  {left: -RING / 2, top: 0, width: RING, height: RING, borderRadius: RING / 2, borderWidth: STROKE},
                  styles.halfTopRight,
                  {transform: [{rotate: ringRight}]},
                ]}
              />
            </View>
            <View style={[styles.abs, {left: 0, top: 0, width: RING / 2, height: RING, overflow: 'hidden'}]}>
              <Animated.View
                style={[
                  styles.abs,
                  {left: 0, top: 0, width: RING, height: RING, borderRadius: RING / 2, borderWidth: STROKE},
                  styles.halfBottomLeft,
                  {transform: [{rotate: ringLeft}]},
                ]}
              />
            </View>
          </Animated.View>

          {/* Engine on: lit amber ring, one flash */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.abs,
              styles.ringGlow,
              {left: C - RING / 2, top: C - RING / 2, width: RING, height: RING, borderRadius: RING / 2, borderWidth: STROKE, borderColor: '#171C8F', opacity: engineV},
            ]}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.abs,
              {
                left: C - 64 * s,
                top: C - 64 * s,
                width: 128 * s,
                height: 128 * s,
                borderRadius: 64 * s,
                backgroundColor: '#FCBE62',
                opacity: flashV.interpolate({inputRange: [0, 0.5, 1], outputRange: [0, 0.55, 0]}),
              },
            ]}
          />
        </Pressable>
      </Animated.View>

      {/* ── 04.4 orb of light grows out of the button ── */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.abs,
          {
            left: (W - 520 * s) / 2,
            bottom: fromBottom(1046.8),
            width: 520 * s,
            height: 520 * s,
            borderRadius: 260 * s,
            overflow: 'hidden',
            backgroundColor: '#171C8F',
            opacity: orbV.interpolate({inputRange: [0, 0.12, 1], outputRange: [0, 1, 1]}),
            transform: [{scale: io(orbV, 0.2, orbScale)}],
          },
        ]}>
        <Image source={IMG.bloomCore} resizeMode="stretch" style={[styles.abs, {left: 120 * s, top: 110 * s, width: 280 * s, height: 300 * s, tintColor: '#171C8F', opacity: 0.35}]} />
        <Image source={IMG.bloomCore} resizeMode="stretch" style={[styles.abs, {left: 40 * s, top: 20 * s, width: 440 * s, height: 480 * s, tintColor: '#FFFFFF', opacity: 0.45}]} />
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#171C8F',
    overflow: 'hidden',
  },
  abs: {
    position: 'absolute',
  },
  // Explicit size: iOS draws an Image at its pixel size if it only has
  // top/left/right/bottom: 0, so every image gets width/height 100%.
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
  },
  logoShadow: {
    shadowColor: '#01044B',
    shadowOpacity: 0.35,
    shadowRadius: 13.5,
    shadowOffset: {width: 0, height: 12},
  },
  cardShadow: {
    backgroundColor: '#171C8F',
    shadowColor: '#01044B',
    shadowOpacity: 0.4,
    shadowRadius: 13,
    shadowOffset: {width: 0, height: 10},
    elevation: 6,
  },
  cardClip: {
    flex: 1,
    overflow: 'hidden',
    borderColor: 'rgba(255,255,255,0.22)',
  },
  copyShadow: {
    textShadowColor: 'rgba(1,4,75,0.35)',
    textShadowRadius: 14,
    textShadowOffset: {width: 0, height: 1},
  },
  glassShadow: {
    shadowColor: '#01044B',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: {width: 0, height: 0},
  },
  ringGlow: {
    shadowColor: '#01044B',
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 0},
  },
  halfTopRight: {
    borderTopColor: '#FCBE62',
    borderRightColor: '#FCBE62',
    borderBottomColor: 'rgba(23,28,143,0)',
    borderLeftColor: 'rgba(23,28,143,0)',
  },
  halfBottomLeft: {
    borderBottomColor: '#FCBE62',
    borderLeftColor: '#FCBE62',
    borderTopColor: 'rgba(23,28,143,0)',
    borderRightColor: 'rgba(23,28,143,0)',
  },
});

export default OnboardingScreen;