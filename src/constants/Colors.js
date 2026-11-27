export const GlobalColor = {
    PrimaryGradient:'#499fd0',
    SecondryGradient:'#0083B0',
    Primary:'#192a56',
    PrimaryLight:"#ebf4fa",
    Secondary:'#43C6DB',
    Text:"#444",
    Dark:"#000",
    Light:"#f8f9fa",
    LightDark:'#7f8c8d',
    White:"#fff",
    Black:"#000",
    ShadowColor:"#000",


    Danger:'#f00'
}

// ─────────────────────────────────────────────────────────────
// "Teal Glow" theme — new brand palette.
// Primary  : Teal  #2B8379 (replaces the old blues)
// Accent   : Amber #F2CB8A (action buttons)
// Being rolled out screen by screen; use these instead of hex literals.
// ─────────────────────────────────────────────────────────────
export const ThemeColor = {
    // Teal scale
    Teal: '#2B8379',          // primary — icons, links, brand text (4.5:1 on white)
    TealDark: '#1F6B62',      // pressed states, emphasised text
    TealDeep: '#163F3A',      // headings / high-contrast text
    TealSoft: '#CFE6E2',      // borders, dividers, hairlines
    TealLight: '#EAF4F2',     // tinted surfaces, header wash
    TealGlow: 'rgba(43, 131, 121, 0.18)', // soft glow / shadow tint

    // Amber accent (action buttons)
    Amber: '#F2CB8A',         // default
    AmberLight: '#F5D9AE',    // hover / subtle
    AmberDark: '#E2B983',     // pressed
    OnAmber: '#1C2B27',       // text & icons on amber
    FocusRing: '#3B6B5E',     // focus/selected outline around amber

    // Forest — deep surfaces (hero cards, sidebar). Also used as the
    // Manager-mode colour so managers can still tell which mode they are in.
    Forest: '#1D3D36',
    ForestDeep: '#16302A',

    // Neutrals (warm, from the MSIL EX reference)
    Canvas: '#F6F4EE',        // page background
    Card: '#FFFFFF',          // card surface
    CardBorder: '#E4E2DA',    // card outline
    Sage: '#E3ECE7',          // icon tiles, chips, inactive pills
    SageMid: '#B9CFC4',       // decorative accents on Forest
    TextPrimary: '#1C2B27',
    TextSecondary: '#3D4744',
    TextMuted: '#66716D',
    OnDark: '#FFFFFF',
    OnDarkMuted: 'rgba(255, 255, 255, 0.72)',

    // Disabled action
    DisabledBg: '#EEEFEA',
    DisabledBorder: '#7D827C',
    DisabledText: '#5E645E',
}

// Drop-in replacement for GlobalColor (same keys) for screens already moved
// to the Teal Glow theme:
//   import { ThemeGlobalColor as GlobalColor, ThemeColor } from '../constants/Colors';
export const ThemeGlobalColor = {
    ...GlobalColor,
    PrimaryGradient: ThemeColor.Teal,
    SecondryGradient: ThemeColor.TealDark,
    Primary: ThemeColor.TealDeep,        // was navy  — headings / strong text
    PrimaryLight: ThemeColor.Canvas,     // was ice-blue — page & row backgrounds
    Secondary: ThemeColor.Teal,          // was cyan  — accents, borders, labels
    Text: ThemeColor.TextSecondary,
    LightDark: ThemeColor.TextMuted,
}
// ─────────────────────────────────────────────────────────────
// Home "Idea C" palette — deep-teal header, mint surfaces, amber accents.
// Source: HomeIdeaC design tokens.
// ─────────────────────────────────────────────────────────────
export const HomePalette = {
    deep: '#0C3335',          // header base, primary ink
    deeper: '#071E20',        // header gradient end
    glow: '#0F4547',          // header glow
    teal: '#2B8379',          // brand teal
    tealInk: '#1E6A62',       // icons, links on light
    body: '#12403F',          // long-form text
    sub: '#4F6E6A',           // secondary text on light
    mint: '#EAF6F2',          // icon chips, segmented bg
    canvas: '#F6FBF9',        // page background
    line: '#D6E6E1',          // card borders
    lineStrong: '#BFD7D1',    // outline buttons, handles
    inkOnDark: '#FFFFFF',
    mutedOnDark: '#9CBDB6',
    softOnDark: '#D6E6E1',
    amber: '#F2CB8A',
    amberSoft: '#F7DDB0',
    amberStrong: '#E8B865',
    amberDeep: '#C99A4E',
    amberInk: '#8A6212',      // amber-tinted text on light
    amberCream: '#FBF1DA',
    onAmber: '#10302F',
    alert: '#FF7468',
}
