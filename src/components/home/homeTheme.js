// Shared tokens, text primitive and content for the redesigned Home screen.
import React, {useEffect, useState} from 'react';
import {AccessibilityInfo, Text} from 'react-native';
import {HomePalette as P} from '../../constants/Colors';

export {P};

export const SPACE = {xs: 4, sm: 8, md: 12, lg: 16, xl: 24};
export const RADIUS = {sm: 10, md: 12, card: 18, lg: 20, sheet: 26, pill: 99};

// System font with real weights (300–700) on both platforms. The app's
// bundled fonts only ship Regular/Bold on iOS, which can't express the
// light display years or semibold labels the design relies on.
export const TYPE = {
  display: {
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: -0.6,
    lineHeight: 30,
  },
  title: {fontSize: 17, fontWeight: '700', letterSpacing: -0.2},
  sheetTitle: {fontSize: 21, fontWeight: '700', lineHeight: 26},
  body: {fontSize: 14, fontWeight: '400', lineHeight: 20},
  bodyStrong: {fontSize: 14, fontWeight: '700'},
  label: {fontSize: 12, fontWeight: '600', lineHeight: 15},
  caption: {fontSize: 12, fontWeight: '400', lineHeight: 16},
  eyebrow: {fontSize: 11, fontWeight: '700', letterSpacing: 0.3},
};

// Text with sensible defaults; caps font scaling so large accessibility
// sizes stay readable without breaking fixed-height layouts.
export const HText = ({style, children, ...rest}) => (
  <Text
    maxFontSizeMultiplier={1.3}
    {...rest}
    style={[{color: P.deep, fontSize: 14}, style]}>
    {children}
  </Text>
);

export const useReduceMotion = () => {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then(v => alive && setReduce(!!v))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', v =>
      setReduce(!!v),
    );
    return () => {
      alive = false;
      sub?.remove?.();
    };
  }, []);
  return reduce;
};

// ── Company content ──────────────────────────────────────────
export const HISTORY = [
  {
    year: '1981',
    head: 'Maruti Udyog Limited is established',
    desc: 'Maruti Udyog Limited is incorporated on 24 February 1981 to bring a modern car to India.',
    more: 'It was founded by the Government of India.',
  },
  {
    year: '1982',
    head: 'A partnership with Suzuki',
    desc: 'A joint-venture agreement is signed with Suzuki Motor Corporation, which takes a 26% stake.',
    more: 'The Gurugram plant opened the same year.',
  },
  {
    year: '1983',
    head: 'The Maruti 800 enters production',
    desc: 'Production of the Maruti 800 begins on 14 December 1983, the first car built by Maruti.',
    more: '',
  },
  {
    year: '1987',
    head: 'First cars exported',
    desc: 'The first export consignment of about 500 cars is shipped to Hungary.',
    more: '',
  },
  {
    year: '1992',
    head: 'Suzuki deepens its stake',
    desc: 'Suzuki raises its shareholding in the joint venture to 50%.',
    more: '',
  },
  {
    year: '2000',
    head: 'The Alto joins the range',
    desc: 'The Suzuki Alto is launched in India in 796cc Alto LX and 1,061cc Alto VX variants.',
    more: '',
  },
  {
    year: '2003',
    head: 'Listed on the stock exchanges',
    desc: 'After a public issue, the company is listed on the BSE and NSE.',
    more: '',
  },
  {
    year: '2007',
    head: 'Manesar and a new name',
    desc: 'The Manesar plant is inaugurated, and the company becomes Maruti Suzuki India Limited.',
    more: '',
  },
  {
    year: '2012',
    head: '10 million cars in India',
    desc: 'Maruti Suzuki sells its ten-millionth vehicle in India in February 2012.',
    more: '',
  },
  {
    year: '2022',
    head: 'Kharkhoda takes shape',
    desc: 'The foundation stone for the Kharkhoda plant in Haryana is laid in August 2022.',
    more: 'The site covers about 800 acres.',
  },
  {
    year: '2025',
    head: 'Production begins at Kharkhoda',
    desc: 'Commercial production starts at Kharkhoda on 25 February 2025, beginning with the Brezza.',
    more: 'Initial capacity is 250,000 units a year.',
  },
];

export const VISION = [
  'The Leader in the Indian Mobility Industry.',
  'Enhancing Customer Delight and Stakeholder Value.',
  'Driving a Sustainable Future.',
  'A Pride of India.',
];
export const MISSION = [
  'Develop products of superior value by focusing on the customer',
  'Establish a refreshing and innovative company through teamwork',
  'Strive for individual excellence through continuous improvement',
];
export const PHILOSOPHY = [
  {
    term: 'Genba, Genbutsu, Genjitsu, Genri, Gensoku',
    meaning:
      'Actual place, actual thing, actual situation, fundamental principle, fundamental rule',
  },
  {
    term: 'Sho‑Sho‑Kei‑Tan‑Bi',
    meaning: 'Smaller, fewer, lighter, shorter, beauty',
  },
  {term: 'YARAMAIKA', meaning: 'Entrepreneurial spirit (Hamamatsu dialect)'},
];

export const greetingFor = (date = new Date()) => {
  const h = date.getHours();
  return h < 12
    ? 'Good morning,'
    : h < 17
    ? 'Good afternoon,'
    : 'Good evening,';
};

// Honorifics that HR records prefix to names ("MR. RAHUL SHARMA", "MR.RAHUL …")
const SALUTATIONS = new Set([
  'MR', 'MRS', 'MS', 'MISS', 'MX', 'DR', 'PROF', 'SHRI', 'SH', 'SMT', 'KUM', 'KUMARI', 'SRI', 'CAPT', 'COL', 'LT', 'MAJ', 'ER',
]);

export const firstNameOf = full => {
  const words = String(full || '')
    .replace(/\./g, ' ') // "MR.RAHUL" → "MR RAHUL"
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  // Skip leading titles; fall back to the original first word if that's all there is
  const names = words.filter(w => !SALUTATIONS.has(w.toUpperCase()));
  // Prefer a real name over initials ("A K SINGH" → "Singh")
  const first = names.find(w => w.length > 1) || names[0] || words[0] || '';
  return first
    ? first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
    : '';
};
