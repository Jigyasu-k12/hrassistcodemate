// App-wide line-icon set (Teal Glow). 24×24 grid, round caps/joins, stroke-only.
// Replaces the old PNG icons so every screen shares one visual language.
//
//   <AppIcon name="canteen" />                    — bare icon
//   <IconBadge name="canteen" />                  — icon in a mint chip (lists, cards)
//   <IconBadge name="logout" tone="danger" />     — red-tinted variant
import React from 'react';
import {View, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, {Path} from 'react-native-svg';
import {HomePalette as P} from '../../constants/Colors';

export const ICON_PATHS = {
  // ── Modules ──
  lookup:
    'M10 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM3 20c.8-3.5 3.6-5.5 7-5.5 1 0 1.9.2 2.8.5M17.5 13.5a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM19.7 18.2 22 20.5',
  attendance: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
  pay: 'M6 3h9l4 4v14H6zM15 3v4h4M9 11h6M9 14h6M11 11c2 0 2 3 0 3l3 4',
  hospital: 'M4 21V7l8-4 8 4v14M2 21h20M12 9v6M9 12h6',
  gate: 'M4 21V5a2 2 0 0 1 2-2h8l4 2v16M2 21h20M13 12h.01M18 9h3M18 13h3',
  canteen: 'M5 3v8a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 0-3 2-3 6s1 4 3 4v8',
  apps: 'M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM9 7h2v2H9zM13 7h2v2h-2zM9 11h2v2H9zM13 11h2v2h-2zM11 18h2',
  travel:
    'M4 8h16v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM9 8V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3M4 13h16M10 13v2M14 13v2',
  addon: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM17 14v6M14 17h6',

  // ── Navigation & chrome ──
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
  menu: 'M4 7h16M4 12h11M4 17h16',
  share:
    'M18 2.5a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM6 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM18 15.5a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM8.6 13.5l6.8 3.6M15.4 6.9 8.6 10.5',
  logout: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10',
  settings:
    'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  gift: 'M4 9h16v12H4zM2 5h20v4H2zM12 5v16M12 5c-1.5-3-5-3-5-.5S10 5 12 5zM12 5c1.5-3 5-3 5-.5S14 5 12 5z',
  // What's New — main 4-point sparkle with two small accents
  whatsNew:
    'M10 3.5c.6 3.4 2.1 4.9 5.5 5.5-3.4.6-4.9 2.1-5.5 5.5-.6-3.4-2.1-4.9-5.5-5.5 3.4-.6 4.9-2.1 5.5-5.5zM18 13c.35 1.9 1.1 2.65 3 3-1.9.35-2.65 1.1-3 3-.35-1.9-1.1-2.65-3-3 1.9-.35 2.65-1.1 3-3zM17.5 3.2c.2.9.6 1.3 1.5 1.5-.9.2-1.3.6-1.5 1.5-.2-.9-.6-1.3-1.5-1.5.9-.2 1.3-.6 1.5-1.5z',
  bell: 'M6 9a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9zM10 20a2 2 0 0 0 4 0',
  sparkle: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z',
  cake: 'M4 21h16v-8H4zM4 16c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5M12 13V9M12 6.5c-1-1-.5-2.5 0-3.5.5 1 1 2.5 0 3.5z',
  mail: 'M3 6h18v12H3zM3 7l9 6 9-6',
  arrowRight: 'M5 12h14M13 6l6 6-6 6',
  chevronRight: 'm9 18 6-6-6-6',
  chevronLeft: 'm15 18-6-6 6-6',
  close: 'M6 6l12 12M18 6 6 18',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  plusCircle: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM8 12h8M12 8v8',
  minusCircle: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM8 12h8',

  // ── Time & people ──
  leave:
    'M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM3 10h18M8 3v4M16 3v4',
  holiday:
    'M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM3 10h18M8 3v4M16 3v4M12 12.5l1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2-1.6-1.5 2.2-.3z',
  shift: 'M4 17a8 8 0 1 1 16 0M12 17l4-5M3 21h18',
  profile: 'M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 21c1.2-4 4.3-6 8-6s6.8 2 8 6',
  pin: 'M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21zM12 7a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',

  // ── Customisation ──
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  sliders: 'M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1M15 4v4M9 10v4M17 16v4',
  pinTile: 'M9 3h6l-1 6 3 3v2H7v-2l3-3zM12 14v7',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  eyeOff:
    'M3 3l18 18M10.6 5.1A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6C3.9 8.4 2 12 2 12s3.5 7 10 7c1.8 0 3.4-.5 4.8-1.3M9.9 9.9a3 3 0 0 0 4.2 4.2',
  arrowUp: 'M12 19V5M6 11l6-6 6 6',
  arrowDown: 'M12 5v14M6 13l6 6 6-6',
  toTop: 'M5 4h14M12 20V9M7 13l5-5 5 5',
  plus: 'M12 5v14M5 12h14',
  check: 'm5 12 5 5 9-10',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-3.5-3.5',
  reset: 'M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4',

  // ── Profile & identity ──
  qr: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2',
  card: 'M3 6h18v12H3zM7 10h6M7 14h4M16 10h2',
  scan: 'M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M7 12h10',
  people:
    'M9 4.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5M16.5 6.5a2.5 2.5 0 1 1 0 5M17 14.6c2.4.3 4.2 2 4.5 4.9',

  // ── Manager mode ──
  manager:
    'M12 3a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM4.5 21c1-3.6 3.8-5.5 7.5-5.5s6.5 1.9 7.5 5.5M12 15.5l-1.3 2.4 1.3 3.1 1.3-3.1z',
  swap: 'M4 9h13l-3-3M20 15H7l3 3',
  approve:
    'M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9',
  teamAtt:
    'M8 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM2 20c.6-3.4 3-5 6-5 1.4 0 2.6.3 3.6 1M17 12a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM17 15v2l1.5 1',
  teamLeave:
    'M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM3 10h18M8 3v4M16 3v4M8 14h3M13 14h3M8 17h3',
  extraHours: 'M12 3a9 9 0 1 0 6.4 15.4M12 7v5l3 2M18 3v6M15 6h6',

  // ── Gatepass & rooms ──
  gatepass: 'M4 21V5a2 2 0 0 1 2-2h8l4 2v16M2 21h20M13 12h.01M18 9h3M18 13h3',
  employeePass:
    'M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM9 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM14 10h4M14 14h4',
  visitorPass:
    'M9 4.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5M19 8v6M16 11h6',
  roomBook:
    'M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM3 10h18M8 3v4M16 3v4M12 13v5M9.5 15.5h5',
  roomView: 'M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17M3 21h18M14 12h.01',
  roomManage:
    'M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM3 10h18M8 3v4M16 3v4M9 15l2 2 4-4',

  // ── Canteen ──
  foodCourt: 'M3 18h18M5 18a7 7 0 0 1 14 0M12 8V6M10 6h4M4 21h16',

  // ── Pay & benefits ──
  payslip: 'M6 3h9l4 4v14H6zM15 3v4h4M9 11h6M9 14h6M11 11c2 0 2 3 0 3l3 4',
  taxCalc:
    'M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM8 7h8v3H8zM8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01M16 17.5h.01',
  pf: 'M3 7h18v13H3zM3 11h18M16 15.5h2',
  tax: 'M7 3h10v18l-2-1.5L13 21l-2-1.5L9 21l-2-1.5zM10 8h4M10 12h4',
  form16: 'M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h4',
  encash:
    'M2 7h20v10H2zM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM6 12h.01M18 12h.01',
  conveyance:
    'M3 16v-3l2.2-5.2A2 2 0 0 1 7 6.5h10a2 2 0 0 1 1.8 1.3L21 13v3M3 13h18M3 16h18M6 16v2M18 16v2M7 13.5h.01M17 13.5h.01',
  consent: 'M9 3h6v3H9zM7 4.5H5V21h14V4.5h-2M9 14l2 2 4-4',

  // ── Business travel & add-ons ──
  gst: 'M4 21V5l8-2v18M12 8h8v13M2 21h20M7 8h2M7 12h2M7 16h2M15 12h2M15 16h2',
  shuttle:
    'M5 4h14a1 1 0 0 1 1 1v12H4V5a1 1 0 0 1 1-1zM4 11h16M7 20v-3M17 20v-3M7.5 14h.01M16.5 14h.01',
  taxi: 'M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11M3 11h18v6H3zM6 17v2M18 17v2M7 14h.01M17 14h.01M10 5V3h4v2',
  uniform: 'M8 3 3 6l2 4 2-1v12h10V9l2 1 2-4-5-3a4 4 0 0 1-8 0z',

  // ── Emergency & quick dials ──
  doctor:
    'M5 3v5a4 4 0 0 0 8 0V3M9 12v3a5 5 0 0 0 10 0v-2M19 9a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
  vigilance: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4',
  fire: 'M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5 1-8.5z',
  electricity: 'M13 2 4 14h7l-1 8 9-12h-7z',
  posh: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM12 15s-3-1.8-3-4a1.7 1.7 0 0 1 3-1 1.7 1.7 0 0 1 3 1c0 2.2-3 4-3 4z',
  helpdesk:
    'M4 14v-2a8 8 0 0 1 16 0v2M4 14h3v5H5a1 1 0 0 1-1-1zM20 14h-3v5h2a1 1 0 0 0 1-1zM17 19c0 1.5-2 2-5 2',
  phone:
    'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
};

// Solid glyphs (filled, no stroke)
const FILLED = {
  play: 'M8 5v14l11-7z',
  pause: 'M7 5h3.5v14H7zM13.5 5H17v14h-3.5z',
};

export const AppIcon = ({
  name,
  size = 22,
  color = '#171C8F',
  strokeWidth = 1.8,
  style,
}) => {
  if (FILLED[name]) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
        <Path d={FILLED[name]} fill={color} />
      </Svg>
    );
  }
  const d = ICON_PATHS[name];
  if (!d) {
    return null;
  }
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={style}>
      <Path
        d={d}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
};

const TONES = {
  teal: {bg: '#F5F5F5', fg: '#01044B'},
  amber: {bg: '#F5F5F5', fg: '#01044B'},
  danger: {bg: '#F5F5F5', fg: '#01044B'},
  dark: {bg: 'rgba(255,255,255,0.12)', fg: 'rgba(255,255,255,0.72)'},
};

// Icon inside a soft 3D chip — the standard way icons sit in lists/cards.
export const IconBadge = ({
  name,
  size = 44,
  iconSize,
  tone = 'teal',
  round = false,
  style,
}) => {
  const t = TONES[tone] || TONES.teal;
  const dark = tone === 'dark';
  const radius = round ? size / 2 : Math.round(size * 0.3);
  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: radius,
        },
        dark ? styles.badgeDark : styles.badgeLight,
        style,
      ]}>
      <LinearGradient
        colors={
          dark
            ? ['rgba(255,255,255,0.30)', 'rgba(255,255,255,0.06)']
            : ['#FFFFFF', '#F5F5F5']
        }
        start={{x: 0.12, y: 0}}
        end={{x: 0.88, y: 1}}
        style={[styles.fill, {borderRadius: radius - 2}]}>
        <View
          style={[
            styles.sheen,
            {borderRadius: radius - 2, height: Math.round(size * 0.46)},
          ]}
        />
        <View
          style={[
            styles.shade,
            {borderRadius: radius - 2, height: Math.round(size * 0.34)},
          ]}
        />
        <AppIcon
          name={name}
          size={iconSize || Math.round(size * 0.52)}
          color={t.fg}
        />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLight: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
  },
  badgeDark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  fill: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sheen: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: 'rgba(255,255,255,0.52)',
  },
  shade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(23,28,143,0.07)',
  },
});

export default AppIcon;
