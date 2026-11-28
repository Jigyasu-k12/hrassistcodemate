export const GlobalColor = {
    PrimaryGradient:'#171C8F',
    SecondryGradient:'#01044B',
    Primary:'#01044B',
    PrimaryLight:"#F5F5F5",
    Secondary:'#171C8F',
    Text:"rgba(1,4,75,0.62)",
    Dark:"#01044B",
    Light:"#F5F5F5",
    LightDark:'rgba(1,4,75,0.62)',
    White:"#FFFFFF",
    Black:"#01044B",
    ShadowColor:"#01044B",


    Danger:'#01044B'
}

// ─────────────────────────────────────────────────────────────
// Corporate Accent theme — Ink, Indigo, Mist, White and one Gold accent.
// Primary  : Indigo #171C8F — headers, icons, links, selected states
// Accent   : Gold   #FCBE62 — solid only; never used as text
// ─────────────────────────────────────────────────────────────
export const ThemeColor = {
    // Indigo scale
    Teal: '#171C8F',          // primary — icons, links, brand text (4.5:1 on white)
    TealDark: '#171C8F',      // pressed states, emphasised text
    TealDeep: '#01044B',      // headings / high-contrast text
    TealSoft: 'rgba(23,28,143,0.10)', // borders, dividers, hairlines
    TealLight: '#F5F5F5',     // tinted surfaces, header wash
    TealGlow: 'rgba(23,28,143,0.18)', // soft glow / shadow tint

    // Gold accent (action buttons) — solid only
    Amber: '#FCBE62',         // default
    AmberLight: '#FCBE62',    // hover / subtle
    AmberDark: '#01044B',     // pressed / shadow
    OnAmber: '#01044B',       // text & icons on gold
    FocusRing: '#171C8F',     // focus/selected outline

    // Deep surfaces (hero cards, sidebar). Also used as the
    // Manager-mode colour so managers can still tell which mode they are in.
    Forest: '#171C8F',
    ForestDeep: '#01044B',

    // Neutrals
    Canvas: '#F5F5F5',        // page background
    Card: '#FFFFFF',          // card surface
    CardBorder: 'rgba(23,28,143,0.10)', // card outline
    Sage: '#F5F5F5',          // icon tiles, chips, inactive pills
    SageMid: 'rgba(23,28,143,0.18)', // decorative accents on Forest
    TextPrimary: '#01044B',
    TextSecondary: 'rgba(1,4,75,0.62)',
    TextMuted: 'rgba(1,4,75,0.62)',
    OnDark: '#FFFFFF',
    OnDarkMuted: 'rgba(255,255,255,0.72)',

    // Disabled action
    DisabledBg: '#F5F5F5',
    DisabledBorder: 'rgba(23,28,143,0.30)',
    DisabledText: 'rgba(1,4,75,0.62)',
}

// Drop-in replacement for GlobalColor (same keys) for screens already moved
// to the Corporate Accent theme:
//   import { ThemeGlobalColor as GlobalColor, ThemeColor } from '../constants/Colors';
export const ThemeGlobalColor = {
    ...GlobalColor,
    PrimaryGradient: '#171C8F',
    SecondryGradient: '#01044B',
    Primary: '#01044B',        // headings / strong text
    PrimaryLight: '#F5F5F5',   // page & row backgrounds
    Secondary: '#171C8F',      // accents, borders, labels
    Text: 'rgba(1,4,75,0.62)',
    LightDark: 'rgba(1,4,75,0.62)',
}
// ─────────────────────────────────────────────────────────────
// Home palette — indigo header, mist surfaces, gold accents.
// ─────────────────────────────────────────────────────────────
export const HomePalette = {
    deep: '#171C8F',          // header base
    deeper: '#01044B',        // header gradient end
    glow: 'rgba(23,28,143,0.18)', // header glow
    teal: '#171C8F',          // brand indigo
    tealInk: '#171C8F',       // icons, links on light
    body: '#01044B',          // long-form text
    sub: 'rgba(1,4,75,0.62)', // secondary text on light
    mint: '#F5F5F5',          // icon chips, segmented bg
    canvas: '#F5F5F5',        // page background
    line: 'rgba(23,28,143,0.10)', // card borders
    lineStrong: 'rgba(23,28,143,0.18)', // outline buttons, handles
    inkOnDark: '#FFFFFF',
    mutedOnDark: 'rgba(255,255,255,0.72)',
    softOnDark: 'rgba(255,255,255,0.72)',
    amber: '#FCBE62',
    amberSoft: '#FCBE62',
    amberStrong: '#FCBE62',
    amberDeep: '#FCBE62',
    amberInk: '#171C8F',      // accent text on light
    amberCream: '#F5F5F5',
    onAmber: '#01044B',
    alert: '#01044B',
}
