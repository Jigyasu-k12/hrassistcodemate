// Manager Home — same Idea C layout as Home, in Manager mode ("dusk" header,
// amber Manager badge, Manager actions). Behaviour kept from the previous
// HomeM: app-version check, profile call, Diwali theme (same flag & visuals).
// Business card / Scan card / ID card now live on My Profile.
import React, {useContext, useEffect, useState, useRef, useMemo, useCallback} from 'react';
import {
  View,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  Linking,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  Platform,
  StatusBar,
  BackHandler,
  Modal as RNModal,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useFocusEffect, useIsFocused} from '@react-navigation/native';
import Svg, {
  Path,
  Circle,
  Rect,
  Line,
  G,
  Ellipse,
  Defs,
  Stop,
  RadialGradient,
  LinearGradient as SvgLinearGradient,
} from 'react-native-svg';
import AuthContext from './../context/AuthContext';
import {ThemeColor, HomePalette} from '../constants/Colors';
import Text from '../components/reusable/Text';
import * as ApiService from '../Utils/Utils';
import HomeHeader from '../components/home/HomeHeader';
import ManagerActions from '../components/home/ManagerActions';
import HappeningsCard from '../components/home/HappeningsCard';
import ValuesStrip from '../components/home/ValuesStrip';
import BirthdaysSection from '../components/home/BirthdaysSection';
import {useReduceMotion} from '../components/home/homeTheme';

// What's New amber dot — shared with Home so opening it once clears both.
const WHATS_NEW_SEEN_KEY = 'home_whats_new_seen_v2.2.3';

// ═════════════════════════════════════════════════════════════════════════
// === DIWALI THEME (manager mode) ===
// Same festive elements as Home.js, switched on/off by the SAME backend flag:
//   /GetThemeCutoff  { ThemeName: 'WINTER_THEME' }  →  Result === 'Y'
// The opening fireworks and the full-screen Happy Deepavali greeting are
// NOT included here — they already play on Home.js.
// Pieces:
//   1. DiwaliEmber + FlyingSkyLantern – golden embers and paper sky lanterns
//                              slowly rising over the screen (ambient)
//   2. DiwaliHeaderDecor     – warm light string with marigolds, three
//                              swinging lanterns (kandil, star, globe),
//                              twinkling stars and a rangoli watermark
//                              (behind the header text, always readable)
//   3. FestiveWhatsNew       – maroon + gold What's New pill
//   4. DiwaliRocketLauncher  – tappable rocket; its burst also throws out
//                              mini diyas, marigolds, laddoos, lanterns,
//                              stars and a "Shubh Deepavali" wish
// All animations run on the native driver and never block touches.
// ═════════════════════════════════════════════════════════════════════════

const DIWALI = {
  gold: '#FCBE62',
  goldLight: '#FCBE62',
  goldDeep: '#FCBE62',
  maroon: '#01044B',
  plum: '#01044B',
  cream: '#FFFFFF',
};

// Vibrant, saturated palettes — they read well on the night-sky veil
const FIREWORK_PALETTES = [
  ['rgba(23,28,143,0.85)', 'rgba(23,28,143,0.85)', '#F5F5F5'], // gold-saffron
  ['rgba(23,28,143,0.85)', 'rgba(23,28,143,0.85)', '#F5F5F5'], // crimson rose
  ['#171C8F', '#171C8F', '#F5F5F5'], // electric blue
  ['rgba(23,28,143,0.85)', 'rgba(23,28,143,0.85)', 'rgba(23,28,143,0.85)'], // royal purple
  ['#171C8F', '#171C8F', '#F5F5F5'], // emerald
  ['rgba(23,28,143,0.85)', 'rgba(23,28,143,0.85)', '#FFFFFF'], // fire
];
const GOLD_PALETTE = FIREWORK_PALETTES[0];
const WILLOW_PALETTE = ['rgba(23,28,143,0.85)', 'rgba(23,28,143,0.85)', '#F5F5F5'];

// Warm, single-temperature palette for the header lights — elegant, not rainbow
const WARM_BULB_COLORS = ['rgba(23,28,143,0.85)', 'rgba(23,28,143,0.85)', 'rgba(23,28,143,0.85)'];

const EMBER_COLORS = ['rgba(23,28,143,0.85)', 'rgba(23,28,143,0.85)', 'rgba(23,28,143,0.85)'];
const EMBER_COUNT = 10;

// Header gets its own strip for the light string so text stays clear
const HEADER_LIGHT_BAND = 16;

// Night-sky veil shown behind fireworks so the colours pop on the light UI
const NIGHT_VEIL_COLOR = 'rgba(23,28,143,0.85)';

// Rocket launcher placement — bottom-right, above the tab bar
// (bottom-right, above the tab bar). Tweak here if needed.
const ROCKET_PAD_SIZE = 62;
const ROCKET_PAD_RIGHT = 16;
const ROCKET_PAD_BOTTOM = 90;
const ROCKET_W = 28;
const ROCKET_BODY_H = 43;
const ROCKET_FLAME_H = 20;
const ROCKET_H = ROCKET_BODY_H + ROCKET_FLAME_H;

// Hanging lantern + small diya sizes
const LANTERN_W = 26;
const LANTERN_H = 49;
const LEDGE_DIYA_W = 30;
const LEDGE_DIYA_H = 12;
const LEDGE_FLAME_H = 14;

// ── geometry helpers ──
const quadPoint = (p0, c, p1, t) => ({
  x: (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * c.x + t * t * p1.x,
  y: (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * c.y + t * t * p1.y,
});

// A run of hanging swags between x0 and x1 at height y, each dipping by `dip`
const buildSwags = (x0, x1, y, count, dip) => {
  const segW = (x1 - x0) / count;
  const swags = [];
  for (let i = 0; i < count; i++) {
    const p0 = {x: x0 + i * segW, y};
    const p1 = {x: x0 + (i + 1) * segW, y};
    swags.push({p0, p1, c: {x: (p0.x + p1.x) / 2, y: y + dip * 2}});
  }
  return swags;
};

const swagsToPath = swags =>
  swags
    .map(
      (s, i) =>
        `${i === 0 ? `M${s.p0.x} ${s.p0.y} ` : ''}Q${s.c.x} ${s.c.y} ${s.p1.x} ${s.p1.y}`,
    )
    .join(' ');

// ────────────────────────────────────────────────
// 1. Ambient ember
// ────────────────────────────────────────────────
const DiwaliEmber = ({index}) => {
  const anim = useRef(new Animated.Value(0)).current;
  const {width: W, height: H} = Dimensions.get('window');

  const cfg = useMemo(
    () => ({
      x: Math.random() * W,
      size: 2.5 + Math.random() * 2,
      duration: 7000 + Math.random() * 6000,
      delay: index * 400 + Math.random() * 800,
      sway: 10 + Math.random() * 16,
      color: EMBER_COLORS[index % EMBER_COLORS.length],
      peak: 0.35 + Math.random() * 0.3,
    }),
    [],
  );

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(cfg.delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: cfg.duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [H + 20, -40],
  });
  const translateX = anim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, cfg.sway, 0, -cfg.sway, 0],
  });
  const opacity = anim.interpolate({
    inputRange: [0, 0.1, 0.7, 1],
    outputRange: [0, cfg.peak, cfg.peak * 0.8, 0],
  });

  return (
    <Animated.View
      style={[
        diwaliStyles.ember,
        {
          left: cfg.x,
          width: cfg.size,
          height: cfg.size,
          borderRadius: cfg.size / 2,
          backgroundColor: cfg.color,
          shadowColor: cfg.color,
          opacity,
          transform: [{translateX}, {translateY}],
        },
      ]}
    />
  );
};

// ────────────────────────────────────────────────
// Fairy-light bulb (glow halo + bulb + cap + highlight)
// ────────────────────────────────────────────────
const FairyBulb = ({x, y, color, opacity, size = 7}) => {
  const box = size * 2.4;
  const cw = size;
  const ch = size * 1.3;
  const capTop = box / 2 - ch / 2 - 1.5;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        diwaliStyles.bulbWrap,
        {left: x - box / 2, top: y - capTop, width: box, height: box, opacity},
      ]}>
      <View
        style={[
          diwaliStyles.bulbHalo,
          {width: box, height: box, borderRadius: box / 2, backgroundColor: color},
        ]}
      />
      <View
        style={[
          diwaliStyles.bulbCore,
          {width: cw, height: ch, borderRadius: cw / 2, backgroundColor: color, shadowColor: color},
        ]}
      />
      <View style={[diwaliStyles.bulbCap, {width: cw * 0.6, height: 2.5, top: capTop}]} />
      <View
        style={[
          diwaliStyles.bulbShine,
          {
            width: cw * 0.28,
            height: ch * 0.32,
            borderRadius: cw,
            left: box / 2 - cw * 0.25,
            top: box / 2 - ch * 0.28,
          },
        ]}
      />
    </Animated.View>
  );
};

// ────────────────────────────────────────────────
// Toran artwork (marigolds + mango leaves)
// ────────────────────────────────────────────────
const marigoldNode = (key, cx, cy, r) => (
  <G key={key}>
    {[...Array(10)].map((_, i) => {
      const a = (i / 10) * Math.PI * 2;
      return (
        <Circle
          key={i}
          cx={cx + Math.cos(a) * r * 0.62}
          cy={cy + Math.sin(a) * r * 0.62}
          r={r * 0.48}
          fill={i % 2 ? '#FCBE62' : '#FCBE62'}
        />
      );
    })}
    <Circle cx={cx} cy={cy} r={r * 0.55} fill="#FCBE62" />
    <Circle cx={cx} cy={cy} r={r * 0.25} fill="#FCBE62" />
  </G>
);

const mangoLeaf = (key, x, y, rot, len = 10) => (
  <Path
    key={key}
    d={`M0 0 C${len * 0.35} ${len * 0.25} ${len * 0.3} ${len * 0.8} 0 ${len} C${-len * 0.3} ${len * 0.8} ${-len * 0.35} ${len * 0.25} 0 0 Z`}
    fill="#171C8F"
    stroke="#171C8F"
    strokeWidth="0.6"
    transform={`translate(${x} ${y}) rotate(${rot})`}
  />
);

// ────────────────────────────────────────────────
// Hanging lanterns (akash kandil) — three styles
// ────────────────────────────────────────────────
const STAR_LANTERN_PATH = (() => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 ? 4.3 : 9.6;
    pts.push(`${(10 + r * Math.cos(a)).toFixed(2)} ${(20.5 + r * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join(' L')} Z`;
})();

const LanternArt = ({variant = 'kandil'}) => {
  if (variant === 'star') {
    return (
      <Svg width={LANTERN_W} height={LANTERN_H} viewBox="0 0 20 38">
        <Defs>
          <SvgLinearGradient id="starLantern" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" />
            <Stop offset="1" stopColor="#FFFFFF" />
          </SvgLinearGradient>
        </Defs>
        <Line x1="10" y1="0" x2="10" y2="11.2" stroke="#FCBE62" strokeWidth="1" />
        <Path
          d={STAR_LANTERN_PATH}
          fill="url(#starLantern)"
          stroke={'#FCBE62'}
          strokeWidth="0.7"
          strokeLinejoin="round"
        />
        <Circle cx="10" cy="20.5" r="3" fill="#F5F5F5" fillOpacity="0.9" />
        <Line x1="10" y1="24.8" x2="10" y2="34.6" stroke="#01044B" strokeWidth="1.2" />
        <Circle cx="10" cy="35.8" r="1.7" fill={'#FCBE62'} />
        <Line x1="4.4" y1="28.3" x2="3.8" y2="33" stroke="#FCBE62" strokeWidth="0.9" />
        <Line x1="15.6" y1="28.3" x2="16.2" y2="33" stroke="#FCBE62" strokeWidth="0.9" />
      </Svg>
    );
  }
  if (variant === 'globe') {
    return (
      <Svg width={LANTERN_W} height={LANTERN_H} viewBox="0 0 20 38">
        <Defs>
          <SvgLinearGradient id="globeLantern" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" />
            <Stop offset="1" stopColor="#FFFFFF" />
          </SvgLinearGradient>
        </Defs>
        <Line x1="10" y1="0" x2="10" y2="8" stroke="#FCBE62" strokeWidth="1" />
        <Rect x="6.5" y="7.5" width="7" height="2.6" rx="1" fill={'#FCBE62'} />
        <Ellipse cx="10" cy="20" rx="8.8" ry="10" fill="url(#globeLantern)" />
        <Ellipse cx="10" cy="21" rx="4.2" ry="6.2" fill="#F5F5F5" fillOpacity="0.5" />
        <Ellipse
          cx="10"
          cy="20"
          rx="4.6"
          ry="10"
          stroke={'#171C8F'}
          strokeWidth="0.7"
          strokeOpacity="0.85"
          fill="none"
        />
        <Line x1="10" y1="10" x2="10" y2="30" stroke={'#171C8F'} strokeWidth="0.7" strokeOpacity="0.85" />
        <Rect x="6.5" y="29.4" width="7" height="2.4" rx="1" fill={'#FCBE62'} />
        <Line x1="10" y1="31.8" x2="10" y2="37" stroke="#FCBE62" strokeWidth="1.2" />
        <Line x1="8" y1="31.6" x2="7.2" y2="35.6" stroke="#FCBE62" strokeWidth="0.8" />
        <Line x1="12" y1="31.6" x2="12.8" y2="35.6" stroke="#FCBE62" strokeWidth="0.8" />
      </Svg>
    );
  }
  return (
    <Svg width={LANTERN_W} height={LANTERN_H} viewBox="0 0 20 38">
      <Defs>
        <SvgLinearGradient id="kandilBody" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#FFFFFF" />
        </SvgLinearGradient>
      </Defs>
      <Line x1="10" y1="0" x2="10" y2="8" stroke="#FCBE62" strokeWidth="1" />
      <Rect x="6.2" y="7.6" width="7.6" height="3" rx="1" fill={'#FCBE62'} />
      <Path d="M10 10.5 L19 17 L19 23.5 L10 30 L1 23.5 L1 17 Z" fill="url(#kandilBody)" />
      <Path
        d="M10 13.5 L15 17.5 L15 23 L10 27 L5 23 L5 17.5 Z"
        fill="#F5F5F5"
        fillOpacity="0.6"
      />
      <Path d="M1 17 L19 17 M1 23.5 L19 23.5" stroke={'#FCBE62'} strokeWidth="1" />
      <Line x1="10" y1="30" x2="10" y2="37" stroke="#FCBE62" strokeWidth="1.3" />
      <Line x1="7.4" y1="29" x2="6.4" y2="35.5" stroke="#FCBE62" strokeWidth="0.9" />
      <Line x1="12.6" y1="29" x2="13.6" y2="35.5" stroke="#FCBE62" strokeWidth="0.9" />
    </Svg>
  );
};

// Swinging lantern; `drop` lengthens its string so lanterns hang at
// staggered heights.
const SkyLantern = ({x, y, swing, reverse, variant = 'kandil', drop = 0}) => {
  const totalH = LANTERN_H + drop;
  const rotate = swing.interpolate({
    inputRange: [0, 1],
    outputRange: reverse ? ['7deg', '-7deg'] : ['-7deg', '7deg'],
  });
  const glowOpacity = swing.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 1, 0.6],
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        diwaliStyles.lanternWrap,
        {
          left: x - LANTERN_W / 2,
          top: y,
          height: totalH,
          // pivot around the top of the string
          transform: [
            {translateY: -totalH / 2},
            {rotate},
            {translateY: totalH / 2},
          ],
        },
      ]}>
      {drop > 0 && <View style={[diwaliStyles.lanternString, {height: drop}]} />}
      <Animated.View
        style={[diwaliStyles.lanternGlow, {top: drop + 1, opacity: glowOpacity}]}>
        <GlowOrb size={52} />
      </Animated.View>
      <LanternArt variant={variant} />
    </Animated.View>
  );
};

// ────────────────────────────────────────────────
// Flying sky lanterns — paper lanterns that rise slowly up the screen
// ────────────────────────────────────────────────
const FLYING_LANTERN_COUNT = 5;

const FlyingLanternArt = () => (
  <Svg width={28} height={36} viewBox="0 0 28 36">
    <Defs>
      <SvgLinearGradient id="flyPaper" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#FFFFFF" />
        <Stop offset="0.6" stopColor="#FFFFFF" />
        <Stop offset="1" stopColor="#FFFFFF" />
      </SvgLinearGradient>
      <RadialGradient id="flyLight" cx="50%" cy="82%" r="62%">
        <Stop offset="0" stopColor="#F5F5F5" stopOpacity="0.95" />
        <Stop offset="1" stopColor="#F5F5F5" stopOpacity="0" />
      </RadialGradient>
    </Defs>
    <Path d="M5 4 Q14 -1.5 23 4 L26 27 Q14 31 2 27 Z" fill="url(#flyPaper)" />
    <Path d="M5 4 Q14 -1.5 23 4 L26 27 Q14 31 2 27 Z" fill="url(#flyLight)" />
    <Path
      d="M10 2.2 L8.5 28.6 M18 2.2 L19.5 28.6"
      stroke="rgba(23,28,143,0.1)"
      strokeOpacity="0.35"
      strokeWidth="0.6"
    />
    <Ellipse cx="14" cy="27.6" rx="12" ry="2.2" fill="#F5F5F5" fillOpacity="0.55" />
    <Line x1="6" y1="28" x2="12" y2="32.5" stroke="#01044B" strokeWidth="0.6" />
    <Line x1="22" y1="28" x2="16" y2="32.5" stroke="#01044B" strokeWidth="0.6" />
    <Ellipse cx="14" cy="33" rx="2.6" ry="2.4" fill="#F5F5F5" />
    <Ellipse cx="14" cy="33.3" rx="1.2" ry="1.2" fill="#FFFFFF" />
  </Svg>
);

const FlyingSkyLantern = ({index}) => {
  const rise = useRef(new Animated.Value(0)).current;
  const sway = useRef(new Animated.Value(0)).current;
  const {width: W, height: H} = Dimensions.get('window');

  const cfg = useMemo(
    () => ({
      x: W * (0.12 + ((index * 0.19 + Math.random() * 0.08) % 0.76)),
      scale: 1.05 + Math.random() * 0.4,
      duration: 15000 + Math.random() * 7000,
      delay: index * 2600 + Math.random() * 900,
      drift: (Math.random() < 0.5 ? -1 : 1) * (14 + Math.random() * 22),
    }),
    [],
  );

  useEffect(() => {
    const riseLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(cfg.delay),
        Animated.timing(rise, {
          toValue: 1,
          duration: cfg.duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
    );
    const swayLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(sway, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    riseLoop.start();
    swayLoop.start();
    return () => {
      riseLoop.stop();
      swayLoop.stop();
    };
  }, []);

  const translateY = rise.interpolate({inputRange: [0, 1], outputRange: [H + 40, -80]});
  const translateX = Animated.add(
    rise.interpolate({inputRange: [0, 1], outputRange: [0, cfg.drift]}),
    sway.interpolate({inputRange: [0, 1], outputRange: [-6, 6]}),
  );
  const rotate = sway.interpolate({inputRange: [0, 1], outputRange: ['-5deg', '5deg']});
  const opacity = rise.interpolate({
    inputRange: [0, 0.08, 0.8, 1],
    outputRange: [0, 0.8, 0.8, 0],
  });

  return (
    <Animated.View
      style={[
        diwaliStyles.flyingLantern,
        {
          left: cfg.x - 14,
          opacity,
          transform: [{translateX}, {translateY}, {rotate}, {scale: cfg.scale}],
        },
      ]}>
      <View style={diwaliStyles.flyingLanternGlow}>
        <GlowOrb size={48} />
      </View>
      <FlyingLanternArt />
    </Animated.View>
  );
};

// ────────────────────────────────────────────────
// 2. Header decoration — warm light string with marigolds in its own strip
//    ABOVE the header text, three swinging lanterns (kandil, star, globe)
//    in the empty gap of the top row, twinkling stars and a faint rangoli.
//    Rendered BEHIND header content, so nothing covers text or icons.
// ────────────────────────────────────────────────
const HEADER_LANTERNS = [
  {fx: 0.5, variant: 'kandil', drop: 0},
  {fx: 0.612, variant: 'star', drop: 6},
  {fx: 0.724, variant: 'globe', drop: 2},
];
const HEADER_TWINKLES = [
  {fx: 0.556, top: 50, size: 8, delay: 0},
  {fx: 0.668, top: 58, size: 7, delay: 500},
  {fx: 0.78, top: 42, size: 8, delay: 900},
];

const DiwaliHeaderDecor = ({chase}) => {
  const [size, setSize] = useState(null);
  const spin = useRef(new Animated.Value(0)).current;
  const swing = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 48000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    const swingLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(swing, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(swing, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    spinLoop.start();
    swingLoop.start();
    return () => {
      spinLoop.stop();
      swingLoop.stop();
    };
  }, []);

  // Gentle twinkle (never fully off) — calmer than a chase
  const twinkle = useMemo(
    () =>
      [
        [1, 0.55, 0.55, 1],
        [0.55, 1, 0.55, 0.55],
        [0.55, 0.55, 1, 0.55],
      ].map(outputRange =>
        chase.interpolate({inputRange: [0, 0.333, 0.666, 1], outputRange}),
      ),
    [chase],
  );

  const decor = useMemo(() => {
    if (!size) return null;
    const W = size.width;
    const count = W > 420 ? 5 : 4;
    const swags = buildSwags(-4, W + 4, 3, count, 6);
    const bulbs = [];
    const PER_SWAG = 6;
    swags.forEach((s, i) => {
      for (let j = 1; j < PER_SWAG; j++) {
        const p = quadPoint(s.p0, s.c, s.p1, j / PER_SWAG);
        bulbs.push({key: `b${i}_${j}`, x: p.x, y: p.y, idx: i * PER_SWAG + j});
      }
    });
    const joints = [{key: 'jL', x: 4, y: 3}];
    for (let i = 1; i < count; i++) {
      joints.push({key: `j${i}`, x: swags[i].p0.x, y: 3});
    }
    joints.push({key: 'jR', x: W - 4, y: 3});
    const lanternAt = fx => {
      const x = W * fx;
      const s = swags.find(sw => x >= sw.p0.x && x <= sw.p1.x) || swags[0];
      const t = (x - s.p0.x) / (s.p1.x - s.p0.x);
      return {x, y: quadPoint(s.p0, s.c, s.p1, t).y};
    };
    return {
      W,
      path: swagsToPath(swags),
      bulbs,
      joints,
      lanterns: HEADER_LANTERNS.map(l => ({...l, ...lanternAt(l.fx)})),
      twinkles: HEADER_TWINKLES.map(t => ({...t, left: W * t.fx - t.size / 2})),
    };
  }, [size]);

  const spinDeg = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      onLayout={e => {
        const {width, height} = e.nativeEvent.layout;
        if (!size || size.width !== width || size.height !== height) {
          setSize({width, height});
        }
      }}>
      {/* faint rangoli watermark, top-right */}
      <Animated.View
        style={[diwaliStyles.headerMandala, {transform: [{rotate: spinDeg}]}]}>
        <Mandala size={170} />
      </Animated.View>

      {decor && (
        <>
          {decor.twinkles.map((t, i) => (
            <Twinkle
              key={`t${i}`}
              size={t.size}
              delay={t.delay}
              color="#171C8F"
              position={{left: t.left, top: t.top}}
            />
          ))}
          <Svg width={decor.W} height={30} style={diwaliStyles.toranSvg}>
            <Path
              d={decor.path}
              stroke="rgba(23,28,143,0.1)"
              strokeWidth="1"
              strokeOpacity="0.85"
              fill="none"
            />
            {decor.joints.map(j => (
              <G key={j.key}>
                {mangoLeaf(`${j.key}a`, j.x - 2, j.y + 3.5, 26, 9)}
                {mangoLeaf(`${j.key}b`, j.x + 2, j.y + 3.5, -26, 9)}
                {marigoldNode(`${j.key}m`, j.x, j.y + 1.5, 5.2)}
              </G>
            ))}
          </Svg>
          {decor.bulbs.map(b => (
            <FairyBulb
              key={b.key}
              x={b.x}
              y={b.y}
              size={5.5}
              color={WARM_BULB_COLORS[b.idx % WARM_BULB_COLORS.length]}
              opacity={twinkle[b.idx % 3]}
            />
          ))}
          {decor.lanterns.map((l, i) => (
            <SkyLantern
              key={i}
              x={l.x}
              y={l.y}
              swing={swing}
              reverse={i % 2 === 1}
              variant={l.variant}
              drop={l.drop}
            />
          ))}
        </>
      )}
    </View>
  );
};

// ────────────────────────────────────────────────
// Small diya artwork (used in the rocket burst keepsakes)
// ────────────────────────────────────────────────
const SmallDiya = () => (
  <Svg width={LEDGE_DIYA_W} height={LEDGE_DIYA_H} viewBox="0 0 60 24">
    <Defs>
      <SvgLinearGradient id="diyaClaySm" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#FFFFFF" />
        <Stop offset="1" stopColor="#FFFFFF" />
      </SvgLinearGradient>
    </Defs>
    <Path d="M2 5 Q30 8 58 5 Q54 22 30 23 Q6 22 2 5 Z" fill="url(#diyaClaySm)" />
    <Ellipse cx="30" cy="5" rx="28" ry="3.6" fill={'#FCBE62'} />
    <Ellipse cx="30" cy="5" rx="22" ry="2" fill="#FCBE62" />
    <Path d="M12 13 Q30 17 48 13" stroke={'#FCBE62'} strokeWidth="1.2" fill="none" />
    {[18, 30, 42].map(cx => (
      <Circle key={cx} cx={cx} cy={cx === 30 ? 19 : 17.5} r="1.4" fill={'#FCBE62'} />
    ))}
    <Rect x="29" y="0.5" width="2" height="4.5" rx="1" fill="#FCBE62" />
  </Svg>
);

const SmallFlame = () => (
  <Svg width={9} height={LEDGE_FLAME_H} viewBox="0 0 22 36">
    <Defs>
      <RadialGradient id="diyaFlameSm" cx="50%" cy="72%" r="62%">
        <Stop offset="0" stopColor="#FFFFFF" />
        <Stop offset="0.35" stopColor="#FFFFFF" />
        <Stop offset="1" stopColor="#FFFFFF" />
      </RadialGradient>
    </Defs>
    <Path
      d="M11 0 C15 9 21 16 21 24 C21 31 16.5 36 11 36 C5.5 36 1 31 1 24 C1 16 7 9 11 0 Z"
      fill="url(#diyaFlameSm)"
    />
  </Svg>
);

// ────────────────────────────────────────────────
// Festive "What's New" pill (replaces the GIF while the theme is on)
// ────────────────────────────────────────────────
const FestiveWhatsNew = () => {
  const shine = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shine, {
          toValue: 1,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(1800),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateX = shine.interpolate({
    inputRange: [0, 1],
    outputRange: [-36, 120],
  });

  return (
    <LinearGradient
      colors={['#FFFFFF', '#FFFFFF']}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={diwaliStyles.whatsNewPill}>
      <SparkleStar size={11} />
      <Text Bold style={diwaliStyles.whatsNewText}>
        What's New
      </Text>
      <Animated.View
        pointerEvents="none"
        style={[diwaliStyles.whatsNewShine, {transform: [{translateX}, {rotate: '20deg'}]}]}>
        <LinearGradient
          colors={['rgba(255,255,255,0)', '#F5F5F5', 'rgba(255,255,255,0)']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </LinearGradient>
  );
};

// ────────────────────────────────────────────────
// Firework burst — peony (streaks), ring, or willow (drooping gold),
// with optional crackling glitter at the end
// ────────────────────────────────────────────────
const SPARKLE_PATTERNS = [
  [0, 1, 0, 1, 0, 0.8, 0, 0],
  [0, 0, 1, 0, 1, 0, 0.7, 0],
  [0, 1, 0, 0, 1, 0, 1, 0],
  [0, 0, 1, 1, 0, 1, 0, 0],
];

const FireworkBurst = ({
  x,
  y,
  palette = GOLD_PALETTE,
  radius = 90,
  particleCount = 22,
  type = 'peony',
  crackle = false,
  delay = 0,
  onDone,
}) => {
  const progress = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(0)).current;
  const sparkle = useRef(new Animated.Value(0)).current;

  const isWillow = type === 'willow';
  const isRing = type === 'ring';
  const colors = isWillow ? WILLOW_PALETTE : palette;
  const duration = isWillow ? 2600 : 1700;

  const particles = useMemo(() => {
    const list = [];
    if (isRing) {
      const n = particleCount + 6;
      for (let i = 0; i < n; i++) {
        list.push({
          key: `r${i}`,
          angle: (i / n) * Math.PI * 2,
          dist: radius * 0.98,
          len: 4.2,
          thick: 4.2,
          color: colors[i % 2],
        });
      }
      const m = Math.round(n * 0.6);
      for (let i = 0; i < m; i++) {
        list.push({
          key: `s${i}`,
          angle: (i / m) * Math.PI * 2 + Math.PI / m,
          dist: radius * 0.55,
          len: 3.2,
          thick: 3.2,
          color: colors[2],
        });
      }
    } else if (isWillow) {
      const n = particleCount + 8;
      for (let i = 0; i < n; i++) {
        list.push({
          key: `w${i}`,
          angle: (i / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.2,
          dist: radius * (0.55 + Math.random() * 0.35),
          len: 16 + Math.random() * 6,
          thick: 1.8,
          color: colors[i % 3],
        });
      }
    } else {
      for (let i = 0; i < particleCount; i++) {
        list.push({
          key: `o${i}`,
          angle: (i / particleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.18,
          dist: radius * (0.82 + Math.random() * 0.3),
          len: 7 + Math.random() * 5,
          thick: 2.4,
          color: i % 3 === 0 ? colors[2] : colors[i % 2],
        });
      }
      const innerCount = Math.round(particleCount * 0.55);
      for (let i = 0; i < innerCount; i++) {
        list.push({
          key: `i${i}`,
          angle: (i / innerCount) * Math.PI * 2 + Math.PI / innerCount,
          dist: radius * (0.38 + Math.random() * 0.14),
          len: 3.5,
          thick: 3.5,
          color: colors[2],
        });
      }
    }
    return list;
  }, []);

  const sparkles = useMemo(() => {
    if (!crackle) return [];
    return [...Array(14)].map((_, i) => {
      const a = Math.random() * Math.PI * 2;
      const d = radius * (0.45 + Math.random() * 0.7);
      return {
        key: `c${i}`,
        dx: Math.cos(a) * d,
        dy: Math.sin(a) * d + radius * 0.25,
        size: 2 + Math.random() * 1.8,
        pattern: SPARKLE_PATTERNS[i % SPARKLE_PATTERNS.length],
      };
    });
  }, []);

  useEffect(() => {
    const anim = Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(progress, {
          toValue: 1,
          duration,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(flash, {toValue: 1, duration: 110, useNativeDriver: true}),
          Animated.timing(flash, {
            toValue: 0,
            duration: 420,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(duration * 0.45),
          Animated.timing(sparkle, {
            toValue: 1,
            duration: 900,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]);
    anim.start(({finished}) => {
      if (finished && onDone) onDone();
    });
    return () => anim.stop();
  }, []);

  const gravity = radius * (isWillow ? 0.95 : isRing ? 0.18 : 0.32);
  const mid = isWillow ? 0.35 : 0.6;
  const radialAtMid = isWillow ? 0.75 : 0.6;
  const gravityAtMid = isWillow ? 0.1 : 0.3;

  const opacity = progress.interpolate({
    inputRange: [0, 0.04, isWillow ? 0.7 : 0.6, 1],
    outputRange: [0, 1, isWillow ? 0.85 : 0.9, 0],
  });
  const sparkScale = progress.interpolate({
    inputRange: [0, 0.12, 1],
    outputRange: isWillow ? [0.5, 1.05, 0.55] : [0.4, 1.15, 0.3],
  });
  const flashSize = radius * 0.9;
  const flashOpacity = flash.interpolate({inputRange: [0, 1], outputRange: [0, 0.65]});
  const flashScale = flash.interpolate({inputRange: [0, 1], outputRange: [0.4, 1]});
  const sparkleFall = sparkle.interpolate({inputRange: [0, 1], outputRange: [0, 12]});

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          fxStyles.flash,
          {
            left: x - flashSize / 2,
            top: y - flashSize / 2,
            width: flashSize,
            height: flashSize,
            borderRadius: flashSize / 2,
            backgroundColor: colors[2],
            shadowColor: colors[0],
            opacity: flashOpacity,
            transform: [{scale: flashScale}],
          },
        ]}
      />
      {particles.map(p => {
        const tx = Math.cos(p.angle) * p.dist;
        const ty = Math.sin(p.angle) * p.dist;
        const translateX = progress.interpolate({
          inputRange: [0, mid, 1],
          outputRange: [0, tx * radialAtMid, tx],
        });
        const translateY = progress.interpolate({
          inputRange: [0, mid, 1],
          outputRange: [0, ty * radialAtMid + gravity * gravityAtMid, ty + gravity],
        });
        return (
          <Animated.View
            key={p.key}
            style={[
              fxStyles.spark,
              {
                left: x - p.thick / 2,
                top: y - p.len / 2,
                width: p.thick,
                height: p.len,
                borderRadius: p.thick / 2,
                backgroundColor: p.color,
                shadowColor: p.color,
                opacity,
                transform: [
                  {translateX},
                  {translateY},
                  {rotate: `${(p.angle * 180) / Math.PI + 90}deg`},
                  {scale: sparkScale},
                ],
              },
            ]}
          />
        );
      })}
      {sparkles.map(s => (
        <Animated.View
          key={s.key}
          style={[
            fxStyles.sparkle,
            {
              left: x + s.dx - s.size / 2,
              top: y + s.dy - s.size / 2,
              width: s.size,
              height: s.size,
              borderRadius: s.size / 2,
              shadowColor: colors[0],
              opacity: sparkle.interpolate({
                inputRange: [0, 0.14, 0.28, 0.42, 0.56, 0.7, 0.85, 1],
                outputRange: s.pattern,
              }),
              transform: [{translateY: sparkleFall}],
            },
          ]}
        />
      ))}
    </View>
  );
};

// ────────────────────────────────────────────────
// Rocket artwork (SVG)
// ────────────────────────────────────────────────
const RocketBody = ({width = ROCKET_W, height = ROCKET_BODY_H}) => (
  <Svg width={width} height={height} viewBox="0 0 40 62">
    <Defs>
      <SvgLinearGradient id="rocketBody" x1="0" y1="0" x2="1" y2="0">
        <Stop offset="0" stopColor="#FFFFFF" />
        <Stop offset="0.45" stopColor="#FFFFFF" />
        <Stop offset="1" stopColor="#FFFFFF" />
      </SvgLinearGradient>
    </Defs>
    {/* fins */}
    <Path d="M9 34 L1 48 L1 53 L9 48 Z" fill={'#FCBE62'} />
    <Path d="M31 34 L39 48 L39 53 L31 48 Z" fill={'#FCBE62'} />
    {/* body */}
    <Path
      d="M20 2 C28 10 31 22 31 36 L31 50 L9 50 L9 36 C9 22 12 10 20 2 Z"
      fill="url(#rocketBody)"
    />
    {/* nose cone */}
    <Path d="M20 2 C25 7 28 13 29.6 19 L10.4 19 C12 13 15 7 20 2 Z" fill={'#FCBE62'} />
    {/* stripes */}
    <Rect x="9" y="41" width="22" height="3" fill={'#FCBE62'} />
    <Rect x="9" y="46" width="22" height="1.4" fill={'#FCBE62'} />
    {/* window */}
    <Circle cx="20" cy="29" r="4.8" fill={'#01044B'} stroke={'#FCBE62'} strokeWidth="1.6" />
    <Circle cx="18.6" cy="27.6" r="1.5" fill="#FFFFFF" fillOpacity="0.7" />
    {/* nozzle */}
    <Rect x="14" y="50" width="12" height="5" rx="1.2" fill="#FCBE62" />
  </Svg>
);

const RocketFlame = () => (
  <Svg width={15} height={ROCKET_FLAME_H} viewBox="0 0 20 28">
    <Path d="M10 28 C3 18 3 9 6 0 L14 0 C17 9 17 18 10 28 Z" fill="#FCBE62" />
    <Path d="M10 22 C6.5 16 6.5 9 8 2 L12 2 C13.5 9 13.5 16 10 22 Z" fill="#F5F5F5" />
  </Svg>
);

// ────────────────────────────────────────────────
// 5. Rocket launcher — tap → launch → double burst → rocket returns.
//    No pad behind it; a small × tucks it away into an edge tab, and the
//    choice is remembered on this device.
// ────────────────────────────────────────────────
const ROCKET_HIDDEN_KEY = 'diwali_rocket_hidden_v1';
const ROCKET_DOCK_SHIFT = ROCKET_PAD_RIGHT + ROCKET_PAD_SIZE + 24;

const DiwaliRocketLauncher = () => {
  const [area, setArea] = useState(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [bursts, setBursts] = useState([]);
  const [keepsakes, setKeepsakes] = useState([]);
  const [hidden, setHidden] = useState(false);

  const flight = useRef(new Animated.Value(0)).current; // 0 = resting, 1 = apex
  const seat = useRef(new Animated.Value(1)).current; // 0 = hidden below, 1 = seated
  const bob = useRef(new Animated.Value(0)).current; // idle float
  const flicker = useRef(new Animated.Value(0)).current;
  const veil = useRef(new Animated.Value(0)).current;
  const dock = useRef(new Animated.Value(0)).current; // 0 = shown, 1 = tucked away
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const bobLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    const flickerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(flicker, {
          toValue: 1,
          duration: 140,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(flicker, {
          toValue: 0,
          duration: 160,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    bobLoop.start();
    flickerLoop.start();

    AsyncStorage.getItem(ROCKET_HIDDEN_KEY)
      .then(value => {
        if (mountedRef.current && value === '1') {
          dock.setValue(1);
          setHidden(true);
        }
      })
      .catch(() => {});

    return () => {
      mountedRef.current = false;
      bobLoop.stop();
      flickerLoop.stop();
      flight.stopAnimation();
      seat.stopAnimation();
      veil.stopAnimation();
      dock.stopAnimation();
    };
  }, []);

  const setRocketHidden = next => {
    setHidden(next);
    Animated.timing(dock, {
      toValue: next ? 1 : 0,
      duration: 380,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    AsyncStorage.setItem(ROCKET_HIDDEN_KEY, next ? '1' : '0').catch(() => {});
  };

  // Rest position, launch target and the angle the rocket points along
  const geometry = useMemo(() => {
    if (!area) return null;
    const cx = area.width - ROCKET_PAD_RIGHT - ROCKET_PAD_SIZE / 2;
    const cy = area.height - ROCKET_PAD_BOTTOM - ROCKET_PAD_SIZE / 2;
    // Horizontal centre of the phone screen, in this layer's coordinates;
    // the burst height stays as before (upper part of the screen).
    const win = Dimensions.get('window');
    const targetX = Math.min(
      Math.max(win.width / 2 - area.offsetX, 0),
      area.width,
    );
    const targetY = Math.max(area.height * 0.24, 120);
    const dx = targetX - cx;
    const dy = targetY - cy;
    const angleDeg = (Math.atan2(dx, -dy) * 180) / Math.PI;
    return {cx, cy, targetX, targetY, dx, dy, angleDeg};
  }, [area]);

  const handleLaunch = () => {
    if (isLaunching || hidden || !geometry) return;
    setIsLaunching(true);
    flight.setValue(0);

    Animated.timing(flight, {
      toValue: 1,
      duration: 1000,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(({finished}) => {
      if (!finished || !mountedRef.current) return;

      const pick = () =>
        FIREWORK_PALETTES[Math.floor(Math.random() * FIREWORK_PALETTES.length)];
      const stamp = Date.now();
      setBursts(prev => [
        ...prev,
        {
          id: `${stamp}a`,
          x: geometry.targetX,
          y: geometry.targetY,
          palette: pick(),
          type: Math.random() < 0.5 ? 'peony' : 'ring',
          radius: 115,
          crackle: true,
          delay: 0,
        },
        {
          id: `${stamp}b`,
          x: geometry.targetX + 34,
          y: geometry.targetY + 26,
          palette: pick(),
          type: 'ring',
          radius: 58,
          crackle: false,
          delay: 280,
        },
      ]);
      // Diwali keepsakes fly out of the burst along with the sparks
      setKeepsakes(prev => [
        ...prev,
        {id: `${stamp}k`, x: geometry.targetX, y: geometry.targetY, delay: 90},
      ]);

      // brief night-sky dim so the burst pops
      Animated.sequence([
        Animated.timing(veil, {toValue: 1, duration: 180, useNativeDriver: true}),
        Animated.delay(1100),
        Animated.timing(veil, {toValue: 0, duration: 900, useNativeDriver: true}),
      ]).start();

      // Reset (hidden), then glide back into place
      seat.setValue(0);
      flight.setValue(0);
      Animated.sequence([
        Animated.delay(700),
        Animated.spring(seat, {
          toValue: 1,
          friction: 6,
          tension: 70,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (mountedRef.current) setIsLaunching(false);
      });
    });
  };

  // Measure where this layer sits on the physical screen, so the burst is
  // horizontally centred on the phone on every screen size.
  const layerRef = useRef(null);
  const handleLayout = () => {
    const node = layerRef.current;
    if (!node || !node.measureInWindow) return;
    node.measureInWindow((x, y, width, height) => {
      if (!mountedRef.current || !width || !height) return;
      setArea(prev =>
        prev &&
        prev.width === width &&
        prev.height === height &&
        prev.offsetX === x &&
        prev.offsetY === y
          ? prev
          : {width, height, offsetX: x || 0, offsetY: y || 0},
      );
    });
  };

  const trail = useMemo(() => {
    if (!geometry) return [];
    return [0, 1, 2, 3, 4].map(k => {
      const lag = 0.07 * (k + 1);
      const size = 5 - k * 0.7;
      return {
        key: k,
        size,
        translateX: flight.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, geometry.dx * 0.38 * (1 - lag), geometry.dx * (1 - lag)],
        }),
        translateY: flight.interpolate({
          inputRange: [0, 1],
          outputRange: [0, geometry.dy * (1 - lag)],
        }),
        opacity: flight.interpolate({
          inputRange: [0, 0.08, 0.95, 1],
          outputRange: [0, 0.9 - k * 0.15, 0.7 - k * 0.12, 0],
        }),
      };
    });
  }, [geometry]);

  const dockX = dock.interpolate({inputRange: [0, 1], outputRange: [0, ROCKET_DOCK_SHIFT]});
  const dockOpacity = dock.interpolate({inputRange: [0, 0.6, 1], outputRange: [1, 0, 0]});
  const tabX = dock.interpolate({inputRange: [0, 1], outputRange: [44, 0]});
  const tabOpacity = dock.interpolate({inputRange: [0, 0.5, 1], outputRange: [0, 0, 1]});

  let rocketStyle = null;
  let flameStyle = null;
  if (geometry) {
    const translateX = Animated.add(
      flight.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, geometry.dx * 0.38, geometry.dx],
      }),
      dockX,
    );
    const translateY = Animated.add(
      Animated.add(
        flight.interpolate({inputRange: [0, 1], outputRange: [0, geometry.dy]}),
        seat.interpolate({inputRange: [0, 1], outputRange: [46, 0]}),
      ),
      bob.interpolate({inputRange: [0, 1], outputRange: [0, -4]}),
    );
    const rocketScale = Animated.multiply(
      flight.interpolate({inputRange: [0, 1], outputRange: [1, 0.6]}),
      seat.interpolate({inputRange: [0, 1], outputRange: [0.6, 1]}),
    );
    const rocketOpacity = Animated.multiply(
      Animated.multiply(
        seat.interpolate({inputRange: [0, 0.35, 1], outputRange: [0, 1, 1]}),
        flight.interpolate({inputRange: [0, 0.92, 1], outputRange: [1, 1, 0]}),
      ),
      dockOpacity,
    );
    rocketStyle = {
      position: 'absolute',
      left: geometry.cx - ROCKET_W / 2,
      top: geometry.cy - ROCKET_BODY_H / 2 - 1,
      width: ROCKET_W,
      height: ROCKET_H,
      alignItems: 'center',
      opacity: rocketOpacity,
      transform: [
        {translateX},
        {translateY},
        {rotate: `${geometry.angleDeg}deg`},
        {scale: rocketScale},
      ],
    };
    flameStyle = {
      marginTop: -2,
      transform: [
        {
          scaleY: Animated.add(
            flicker.interpolate({inputRange: [0, 1], outputRange: [0.55, 0.75]}),
            flight.interpolate({
              inputRange: [0, 0.15, 1],
              outputRange: [0, 0.6, 0.9],
            }),
          ),
        },
        {
          scaleX: flicker.interpolate({
            inputRange: [0, 1],
            outputRange: [0.92, 1.06],
          }),
        },
      ],
    };
  }

  return (
    <View
      pointerEvents="box-none"
      ref={layerRef}
      collapsable={false}
      style={diwaliStyles.rocketLayer}
      onLayout={handleLayout}>
      <Animated.View
        pointerEvents="none"
        style={[
          diwaliStyles.fireworkVeil,
          {opacity: veil.interpolate({inputRange: [0, 1], outputRange: [0, 0.42]})},
        ]}
      />

      {bursts.map(b => (
        <FireworkBurst
          key={b.id}
          x={b.x}
          y={b.y}
          palette={b.palette}
          radius={b.radius}
          particleCount={26}
          type={b.type}
          crackle={b.crackle}
          delay={b.delay}
          onDone={() =>
            setBursts(prev => prev.filter(item => item.id !== b.id))
          }
        />
      ))}

      {keepsakes.map(k => (
        <BurstKeepsakes
          key={k.id}
          x={k.x}
          y={k.y}
          delay={k.delay}
          onDone={() =>
            setKeepsakes(prev => prev.filter(item => item.id !== k.id))
          }
        />
      ))}

      {geometry && (
        <>
          {/* Spark trail */}
          {trail.map(t => (
            <Animated.View
              key={t.key}
              pointerEvents="none"
              style={[
                diwaliStyles.rocketTrailDot,
                {
                  left: geometry.cx - t.size / 2,
                  top: geometry.cy + 10 - t.size / 2,
                  width: t.size,
                  height: t.size,
                  borderRadius: t.size / 2,
                  opacity: t.opacity,
                  transform: [{translateX: t.translateX}, {translateY: t.translateY}],
                },
              ]}
            />
          ))}

          {/* Rocket */}
          <Animated.View pointerEvents="none" style={rocketStyle}>
            <RocketBody />
            <Animated.View style={flameStyle}>
              <RocketFlame />
            </Animated.View>
          </Animated.View>

          {/* Invisible tap area + hide control */}
          <Animated.View
            pointerEvents={hidden ? 'none' : 'box-none'}
            style={[
              diwaliStyles.rocketTouchWrap,
              {
                right: ROCKET_PAD_RIGHT,
                bottom: ROCKET_PAD_BOTTOM,
                opacity: dockOpacity,
                transform: [{translateX: dockX}],
              },
            ]}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleLaunch}
              disabled={isLaunching}
              accessibilityRole="button"
              accessibilityLabel="Launch a Diwali rocket"
              style={diwaliStyles.rocketTouch}
            />
            <TouchableOpacity
              onPress={() => setRocketHidden(true)}
              disabled={isLaunching}
              accessibilityRole="button"
              accessibilityLabel="Hide the rocket"
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
              style={diwaliStyles.rocketHideBtn}>
              <Ionicons name="close" size={11} color={'#171C8F'} />
            </TouchableOpacity>
          </Animated.View>

          {/* Edge tab to bring the rocket back */}
          <Animated.View
            pointerEvents={hidden ? 'box-none' : 'none'}
            style={[
              diwaliStyles.rocketTabWrap,
              {
                bottom: ROCKET_PAD_BOTTOM + 14,
                opacity: tabOpacity,
                transform: [{translateX: tabX}],
              },
            ]}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setRocketHidden(false)}
              accessibilityRole="button"
              accessibilityLabel="Show the rocket">
              <LinearGradient
                colors={['#FFFFFF', '#FFFFFF']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={diwaliStyles.rocketTab}>
                <View style={{transform: [{rotate: '-35deg'}]}}>
                  <RocketBody width={12} height={18} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </>
      )}
    </View>
  );
};

// ────────────────────────────────────────────────
// Shared artwork (rangoli, glow, sparkle)
// ────────────────────────────────────────────────
const Mandala = ({size}) => (
  <Svg width={size} height={size} viewBox="0 0 200 200">
    <G stroke={'#171C8F'} fill="none" strokeOpacity={0.35}>
      <Circle cx="100" cy="100" r="96" strokeWidth="0.8" />
      <Circle cx="100" cy="100" r="82" strokeWidth="0.6" strokeDasharray="2 4" />
      {[...Array(16)].map((_, i) => (
        <Ellipse
          key={`p${i}`}
          cx="100"
          cy="42"
          rx="9"
          ry="26"
          strokeWidth="0.9"
          transform={`rotate(${i * 22.5} 100 100)`}
        />
      ))}
      {[...Array(8)].map((_, i) => (
        <Ellipse
          key={`q${i}`}
          cx="100"
          cy="66"
          rx="7"
          ry="17"
          strokeWidth="0.8"
          transform={`rotate(${i * 45 + 22.5} 100 100)`}
        />
      ))}
      <Circle cx="100" cy="100" r="30" strokeWidth="0.8" />
    </G>
    {[...Array(16)].map((_, i) => (
      <Circle
        key={`d${i}`}
        cx="100"
        cy="9"
        r="1.8"
        fill={'#171C8F'}
        fillOpacity={0.55}
        transform={`rotate(${i * 22.5} 100 100)`}
      />
    ))}
  </Svg>
);

const GlowOrb = ({size}) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Defs>
      <RadialGradient id="diyaGlowOrb" cx="50%" cy="50%" r="50%">
        <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.55" />
        <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.18" />
        <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
      </RadialGradient>
    </Defs>
    <Circle cx="50" cy="50" r="50" fill="url(#diyaGlowOrb)" />
  </Svg>
);

const SparkleStar = ({size, color = '#171C8F'}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M12 0 L14.5 9.5 L24 12 L14.5 14.5 L12 24 L9.5 14.5 L0 12 L9.5 9.5 Z"
      fill={color}
    />
  </Svg>
);

const Twinkle = ({size, delay, position, color}) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.delay(600),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        diwaliStyles.twinkle,
        position,
        {
          opacity: anim.interpolate({inputRange: [0, 1], outputRange: [0.15, 1]}),
          transform: [
            {scale: anim.interpolate({inputRange: [0, 1], outputRange: [0.6, 1.1]})},
          ],
        },
      ]}>
      <SparkleStar size={size} color={color} />
    </Animated.View>
  );
};

// ────────────────────────────────────────────────
// Rocket burst keepsakes — mini diyas, marigolds, stars, laddoos and
// lanterns that fly out of the rocket's burst and drift down, plus a
// short "Shubh Deepavali" wish at the centre.
// ────────────────────────────────────────────────
const KEEPSAKE_TYPES = ['diya', 'marigold', 'star', 'laddoo', 'lantern', 'star'];

const KeepsakeArt = ({type}) => {
  switch (type) {
    case 'diya':
      return (
        <View style={{alignItems: 'center', transform: [{scale: 0.8}]}}>
          <View style={{marginBottom: -4}}>
            <SmallFlame />
          </View>
          <SmallDiya />
        </View>
      );
    case 'marigold':
      return <Svg width={18} height={18}>{marigoldNode('k', 9, 9, 7)}</Svg>;
    case 'laddoo':
      return (
        <Svg width={15} height={15} viewBox="0 0 16 16">
          <Defs>
            <RadialGradient id="kLaddoo" cx="38%" cy="35%" r="70%">
              <Stop offset="0" stopColor="#FFFFFF" />
              <Stop offset="1" stopColor="#FFFFFF" />
            </RadialGradient>
          </Defs>
          <Circle cx="8" cy="8" r="7.5" fill="url(#kLaddoo)" />
          <Circle cx="5.5" cy="5.5" r="1.6" fill="#FFFFFF" fillOpacity="0.5" />
        </Svg>
      );
    case 'lantern':
      return (
        <View style={{transform: [{scale: 0.62}]}}>
          <LanternArt variant="globe" />
        </View>
      );
    default:
      return <SparkleStar size={14} />;
  }
};

const BurstKeepsakes = ({x, y, delay = 0, onDone}) => {
  const progress = useRef(new Animated.Value(0)).current;
  const items = useMemo(
    () =>
      [...Array(12)].map((_, i) => {
        const angle = (i / 12) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
        const dist = 70 + Math.random() * 60;
        return {
          key: i,
          type: KEEPSAKE_TYPES[i % KEEPSAKE_TYPES.length],
          tx: Math.cos(angle) * dist,
          ty: Math.sin(angle) * dist * 0.85,
          spin: (Math.random() < 0.5 ? -1 : 1) * (90 + Math.random() * 180),
          fall: 60 + Math.random() * 50,
        };
      }),
    [],
  );

  useEffect(() => {
    const anim = Animated.sequence([
      Animated.delay(delay),
      Animated.timing(progress, {
        toValue: 1,
        duration: 2300,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]);
    anim.start(({finished}) => {
      if (finished && onDone) onDone();
    });
    return () => anim.stop();
  }, []);

  const opacity = progress.interpolate({
    inputRange: [0, 0.06, 0.72, 1],
    outputRange: [0, 1, 1, 0],
  });
  const scale = progress.interpolate({
    inputRange: [0, 0.14, 1],
    outputRange: [0.2, 1.1, 0.85],
  });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          diwaliStyles.burstWish,
          {
            left: x - 110,
            top: y - 14,
            opacity: progress.interpolate({
              inputRange: [0, 0.1, 0.6, 0.85],
              outputRange: [0, 1, 1, 0],
            }),
            transform: [
              {translateY: progress.interpolate({inputRange: [0, 1], outputRange: [6, -14]})},
              {
                scale: progress.interpolate({
                  inputRange: [0, 0.15, 1],
                  outputRange: [0.6, 1, 1.04],
                }),
              },
            ],
          },
        ]}>
        <Text Bold style={diwaliStyles.burstWishText}>
          Shubh Deepavali
        </Text>
      </Animated.View>
      {items.map(it => (
        <Animated.View
          key={it.key}
          style={[
            diwaliStyles.keepsake,
            {
              left: x,
              top: y,
              opacity,
              transform: [
                {
                  translateX: progress.interpolate({
                    inputRange: [0, 0.3, 1],
                    outputRange: [0, it.tx * 0.8, it.tx],
                  }),
                },
                {
                  translateY: progress.interpolate({
                    inputRange: [0, 0.3, 1],
                    outputRange: [0, it.ty * 0.8, it.ty + it.fall],
                  }),
                },
                {
                  rotate: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', `${it.spin}deg`],
                  }),
                },
                {scale},
              ],
            },
          ]}>
          <KeepsakeArt type={it.type} />
        </Animated.View>
      ))}
    </View>
  );
};


// ────────────────────────────────────────────────
// Manager Home Component
// ────────────────────────────────────────────────
const HomeM = ({navigation}) => {
  const {authContext, AppUserData} = useContext(AuthContext);

  let usrAccess = AppUserData?.data?.userFlag;

  const [refresh, setrefresh] = useState(false);
  const [loader, setLoader] = useState(false);

  // === DIWALI THEME state (driven by the same theme flag) ===
  const [isDiwaliThemeActive, setIsDiwaliThemeActive] = useState(false);
  // One shared value drives the twinkling header lights
  const diwaliChase = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isDiwaliThemeActive) return;
    diwaliChase.setValue(0);
    const loop = Animated.loop(
      Animated.timing(diwaliChase, {
        toValue: 1,
        duration: 2400,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [isDiwaliThemeActive]);

  // Check theme status from API
  const checkThemeStatus = () => {
    try {
      let token = AppUserData.token;
      let apiData = {
        ThemeName: 'DIWALI_THEME',
      };

      ApiService.PostMethode('/GetThemeCutoff', apiData, token, authContext)
        .then(result => {
          const currentThemeStatus = result.Result === 'Y';
          setIsDiwaliThemeActive(currentThemeStatus);
        })
        .catch(error => {
          setIsDiwaliThemeActive(false);
          ApiService.showErrorMessage(error, authContext);
        });
    } catch (error) {
      console.log('Theme check error:', error);
    }
  };

  const checkAppUpdate = () => {
    let versionfromplug = '2.2.3';
    let appname = 'HR ASSIST';
    let devicetype = 'IOS';

    let apiData = {
      AppName: appname,
      DeviceType: devicetype,
      Version: versionfromplug,
    };

    let token = AppUserData.token;
    ApiService.PostMethode('/CheckAppVersion', apiData, token, authContext)
      .then(result => {
        if (result.Result) {
          let vesionNo = result.Result.split('~');
          if (vesionNo[1] != versionfromplug) {
            Alert.alert(
              'New Update',
              "Please update the app to Newer version  by downloading and installing the app.\nPlease check the What's New section after installing the newer version for latest updates",
              [
                {
                  text: 'OK',
                  onPress: () => {
                    BackHandler.exitApp();
                    Linking.openURL(vesionNo[0]);
                  },
                },
              ],
            );
          }
        }
      })
      .catch(error => {
        ApiService.showErrorMessage(error, authContext);
      });
  };

  const stopLoader = () => {
    try {
      setLoader(false);
      setrefresh(false);
    } catch (error) {
      // console.log(error);
    }
  };

  const showBanner = () => {
    let token = AppUserData.token;
    let apiData = {
      UserName: AppUserData?.data?.username,
    };
    setLoader(true);
    ApiService.PostMethode('/GetEmployeeProfile', apiData, token, authContext)
      .then(result => {
        stopLoader(false);
      })
      .catch(error => {
        stopLoader(false);
        ApiService.showErrorMessage(error, authContext);
      });
  };

  const initialLoading = () => {
    showBanner();
    checkAppUpdate();
    checkThemeStatus();
  };

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      if (isActive) {
        initialLoading();
      }

      return () => {
        isActive = false;
      };
    }, []),
  );

  // ── Idea C layout (same as Home) ──
  const isHomeFocused = useIsFocused();
  const reduceMotion = useReduceMotion();
  const [homeRefreshKey, setHomeRefreshKey] = useState(0);
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const [whatsNewSeen, setWhatsNewSeen] = useState(true);

  const bannerImages = useMemo(() => {
    const t = Date.now();
    return [1, 2, 3].map(
      n => `https://swifttest.maruti.co.in/HRAssistWebAPIMVC/Images/${n}.png?t=${t}`,
    );
  }, [homeRefreshKey]);

  useEffect(() => {
    AsyncStorage.getItem(WHATS_NEW_SEEN_KEY)
      .then(v => setWhatsNewSeen(v === '1'))
      .catch(() => {});
  }, []);

  const openWhatsNew = () => {
    setWhatsNewSeen(true);
    AsyncStorage.setItem(WHATS_NEW_SEEN_KEY, '1').catch(() => {});
    navigation.navigate('Whatsnew');
  };

  const handlePullRefresh = () => {
    setPullRefreshing(true);
    setHomeRefreshKey(k => k + 1);
    setTimeout(() => setPullRefreshing(false), 900);
  };

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      if (Platform.OS === 'android') StatusBar.setBackgroundColor('#171C8F');
      return () => {
        if (Platform.OS === 'android') StatusBar.setBackgroundColor('#171C8F');
      };
    }, []),
  );

  return (
    <View style={styles.root}>
      {/* === DIWALI THEME: golden embers + flying sky lanterns === */}
      {isDiwaliThemeActive && (
        <View style={diwaliStyles.ambientLayer} pointerEvents="none">
          {[...Array(EMBER_COUNT)].map((_, i) => (
            <DiwaliEmber key={i} index={i} />
          ))}
          {[...Array(FLYING_LANTERN_COUNT)].map((_, i) => (
            <FlyingSkyLantern key={`fl${i}`} index={i} />
          ))}
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={pullRefreshing}
            onRefresh={handlePullRefresh}
            tintColor={'#FCBE62'}
            colors={['#FCBE62']}
          />
        }>
        <HomeHeader
          mode="manager"
          name={AppUserData?.data?.EMPL_NAME ? AppUserData?.data?.EMPL_NAME : 'User'}
          onMenu={() => navigation.openDrawer()}
          onProfile={() => navigation.navigate('EditProfile')}
          showWhatsNew={usrAccess != 'Y'}
          whatsNewDot={!whatsNewSeen}
          onWhatsNew={openWhatsNew}
          active={isHomeFocused}
          decor={isDiwaliThemeActive ? <DiwaliHeaderDecor chase={diwaliChase} /> : null}
          bandStyle={isDiwaliThemeActive ? diwaliStyles.headerLightBand : undefined}
        />

        <View style={styles.body}>
          <View style={styles.section}>
            <ManagerActions navigation={navigation} />
          </View>
          <View style={styles.section}>
            <HappeningsCard
              images={bannerImages}
              active={isHomeFocused}
              reduceMotion={reduceMotion}
            />
          </View>
          <View style={styles.section}>
            <ValuesStrip active={isHomeFocused} reduceMotion={reduceMotion} />
          </View>
          {usrAccess != 'Y' && (
            <View style={styles.section}>
              <BirthdaysSection
                navigation={navigation}
                active={isHomeFocused}
                refreshKey={homeRefreshKey}
              />
            </View>
          )}
        </View>
      </ScrollView>

      {/* === DIWALI THEME: tappable rocket, bottom-right === */}
      {isDiwaliThemeActive && <DiwaliRocketLauncher />}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#F5F5F5'},
  scroll: {flex: 1},
  scrollContent: {paddingBottom: 110},
  body: {paddingHorizontal: 16, paddingTop: 14},
  section: {marginBottom: 20},
});

// ─────────────────────────────────────────────────────
// === DIWALI THEME: styles ===
// ─────────────────────────────────────────────────────
const diwaliStyles = StyleSheet.create({
  ambientLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    elevation: 999,
  },
  rocketLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1001,
    elevation: 1001,
  },
  ember: {
    position: 'absolute',
    top: 0,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.9,
    shadowRadius: 4,
  },

  // Rocket launcher
  rocketTrailDot: {
    position: 'absolute',
    backgroundColor: '#F5F5F5',
    shadowColor: '#01044B',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 1,
    shadowRadius: 5,
  },

  twinkle: {
    position: 'absolute',
  },
  rocketTouchWrap: {
    position: 'absolute',
    width: ROCKET_PAD_SIZE,
    height: ROCKET_PAD_SIZE,
  },
  rocketTouch: {
    width: ROCKET_PAD_SIZE,
    height: ROCKET_PAD_SIZE,
  },
  rocketHideBtn: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rocketTabWrap: {
    position: 'absolute',
    right: 0,
  },
  rocketTab: {
    width: 30,
    height: 36,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 3,
  },
  headerLightBand: {
    paddingTop: HEADER_LIGHT_BAND,
  },
  whatsNewPill: {
    height: 30,
    minWidth: 85,
    paddingHorizontal: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    overflow: 'hidden',
  },
  whatsNewText: {
    fontSize: 12,
    color: 'rgba(1,4,75,0.45)',
    letterSpacing: 0.3,
  },
  whatsNewShine: {
    position: 'absolute',
    top: -10,
    bottom: -10,
    left: 0,
    width: 22,
  },
  headerMandala: {
    position: 'absolute',
    top: -48,
    right: -56,
    opacity: 0.35,
  },
  toranSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  lanternWrap: {
    position: 'absolute',
    width: LANTERN_W,
    height: LANTERN_H,
    alignItems: 'center',
  },
  lanternGlow: {
    position: 'absolute',
    left: (LANTERN_W - 52) / 2,
  },
  bulbWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulbHalo: {
    position: 'absolute',
    opacity: 0.3,
  },
  bulbCore: {
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.9,
    shadowRadius: 4,
  },
  bulbCap: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  bulbShine: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  lanternString: {
    width: 1,
    backgroundColor: '#FCBE62',
  },
  flyingLantern: {
    position: 'absolute',
    top: 0,
    width: 28,
    height: 36,
    alignItems: 'center',
  },
  flyingLanternGlow: {
    position: 'absolute',
    top: -6,
    left: -10,
  },
  keepsake: {
    position: 'absolute',
    width: 0,
    height: 0,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  burstWish: {
    position: 'absolute',
    width: 220,
    alignItems: 'center',
  },
  burstWishText: {
    fontSize: 20,
    color: 'rgba(1,4,75,0.45)',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(1,4,75,0.35)',
    textShadowOffset: {width: 0, height: 0},
    textShadowRadius: 10,
  },
  fireworkVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: NIGHT_VEIL_COLOR,
  },
});

// === DIWALI THEME: firework particle styles ===
const fxStyles = StyleSheet.create({
  flash: {
    position: 'absolute',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.9,
    shadowRadius: 18,
  },
  spark: {
    position: 'absolute',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 1,
    shadowRadius: 3,
  },
  sparkle: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 1,
    shadowRadius: 4,
  },
});

//make this component available to the app
export default HomeM;
