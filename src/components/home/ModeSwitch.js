// Employee ⇄ Manager switch.
//
//  RoleToken  — the raised coin in the tab bar. Teal "employee" face, amber
//               "manager" face; it flips in 3D when you change mode.
//  ModePortal — full-screen transition: a circle of the new mode's colour grows
//               out of the token, names the mode you're entering, then dissolves
//               to reveal the new Home. The screen is swapped while covered, so
//               there is never a flash of half-rendered content.
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  Easing,
  StyleSheet,
  Dimensions,
  Platform,
  Vibration,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {P, HText, useReduceMotion} from './homeTheme';
import {AppIcon} from '../icons/AppIcon';

const TOKEN = 58;
const EASE_OUT = Easing.bezier(0.2, 0.8, 0.2, 1);

// iOS needs no permission for a light tick; Android would need VIBRATE.
export const tick = () => {
  if (Platform.OS === 'ios') {
    try {
      Vibration.vibrate(10);
    } catch (e) {}
  }
};

// ── Raised coin in the tab bar ──
export const RoleToken = forwardRef(({isManager, onPress, disabled}, ref) => {
  const flip = useRef(new Animated.Value(isManager ? 1 : 0)).current;
  const press = useRef(new Animated.Value(1)).current;
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    Animated.timing(flip, {
      toValue: isManager ? 1 : 0,
      duration: reduceMotion ? 0 : 800,
      easing: EASE_OUT,
      useNativeDriver: true,
    }).start();
  }, [isManager, reduceMotion, flip]);

  const front = flip.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const back = flip.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });
  // Swap faces exactly at 90° (some Android versions ignore backfaceVisibility)
  const frontOpacity = flip.interpolate({
    inputRange: [0, 0.499, 0.5, 1],
    outputRange: [1, 1, 0, 0],
  });
  const backOpacity = flip.interpolate({
    inputRange: [0, 0.499, 0.5, 1],
    outputRange: [0, 0, 1, 1],
  });
  // a little lift at mid-flip makes it feel like a coin toss
  const lift = flip.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -8, 0],
  });

  const pressIn = () =>
    Animated.spring(press, {
      toValue: 0.92,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  const pressOut = () =>
    Animated.spring(press, {
      toValue: 1,
      useNativeDriver: true,
      speed: 18,
      bounciness: 10,
    }).start();

  return (
    <View style={styles.tokenWrap} pointerEvents="box-none">
      <TouchableOpacity
        ref={ref}
        activeOpacity={1}
        disabled={disabled}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        accessibilityRole="switch"
        accessibilityState={{checked: isManager}}
        accessibilityLabel={
          isManager
            ? 'Manager view. Switch to Employee view'
            : 'Employee view. Switch to Manager view'
        }
        hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
        <Animated.View
          style={[
            styles.token,
            {transform: [{translateY: lift}, {scale: press}]},
          ]}>
          <Animated.View
            style={[
              styles.face,
              {
                opacity: frontOpacity,
                transform: [{perspective: 600}, {rotateY: front}],
              },
            ]}>
            <LinearGradient
              colors={[P.tealInk, P.deep]}
              start={{x: 0.5, y: 0}}
              end={{x: 0.5, y: 1}}
              style={styles.faceFill}>
              <AppIcon
                name="profile"
                size={26}
                color="#FFFFFF"
                strokeWidth={1.9}
              />
            </LinearGradient>
          </Animated.View>
          <Animated.View
            style={[
              styles.face,
              {
                opacity: backOpacity,
                transform: [{perspective: 600}, {rotateY: back}],
              },
            ]}>
            <LinearGradient
              colors={[P.amberSoft, P.amberDeep]}
              start={{x: 0.5, y: 0}}
              end={{x: 0.5, y: 1}}
              style={styles.faceFill}>
              <AppIcon
                name="manager"
                size={26}
                color={P.onAmber}
                strokeWidth={1.9}
              />
            </LinearGradient>
          </Animated.View>
        </Animated.View>
      </TouchableOpacity>
      <View style={styles.tokenLabel} pointerEvents="none">
        <AppIcon
          name="swap"
          size={11}
          color={isManager ? P.amberInk : P.deep}
          strokeWidth={2.6}
        />
        <HText
          style={[
            styles.tokenLabelText,
            {color: isManager ? P.amberInk : P.deep},
          ]}>
          {isManager ? 'Manager' : 'Employee'}
        </HText>
      </View>
    </View>
  );
});

// ── Full-screen transition ──
const COPY = {
  manager: {
    eyebrow: 'SWITCHING TO',
    title: 'Manager mode',
    sub: 'Approvals, attendance and your team — all in one place.',
    chips: ['Approvals', 'Team attendance', 'Taxi'],
    icon: 'manager',
    colors: [P.amberSoft, P.amber, P.amberDeep],
    ink: P.onAmber,
    soft: 'rgba(16,48,47,0.72)',
    glass: 'rgba(255,255,255,0.32)',
  },
  employee: {
    eyebrow: 'BACK TO',
    title: 'Employee mode',
    sub: 'Your own attendance, pay, travel and services.',
    chips: ['Attendance', 'Payslip', 'Canteen'],
    icon: 'profile',
    colors: [P.tealInk, P.deep, P.deeper],
    ink: '#FFFFFF',
    soft: P.mutedOnDark,
    glass: 'rgba(255,255,255,0.10)',
  },
};

export const ModePortal = forwardRef((_, ref) => {
  const [run, setRun] = useState(null); // {mode, origin}
  const grow = useRef(new Animated.Value(0)).current;
  const content = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;
  const reduceMotion = useReduceMotion();
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useImperativeHandle(ref, () => ({
    // onCovered fires once the screen is fully covered — switch screens there.
    play: ({toManager, origin, onCovered, onDone}) => {
      timers.current.forEach(clearTimeout);
      const {width: W, height: H} = Dimensions.get('window');
      const o = origin || {x: W / 2, y: H - 60};
      grow.setValue(0);
      content.setValue(0);
      fade.setValue(1);
      setRun({mode: toManager ? 'manager' : 'employee', origin: o});

      const coverMs = reduceMotion ? 120 : 560;
      const holdMs = reduceMotion ? 120 : 520;
      if (reduceMotion) {
        grow.setValue(1);
        Animated.timing(content, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.timing(grow, {
          toValue: 1,
          duration: coverMs,
          easing: Easing.bezier(0.6, 0, 0.2, 1),
          useNativeDriver: true,
        }).start();
        Animated.timing(content, {
          toValue: 1,
          duration: 420,
          delay: 260,
          easing: EASE_OUT,
          useNativeDriver: true,
        }).start();
      }
      timers.current = [
        setTimeout(() => onCovered && onCovered(), coverMs),
        setTimeout(() => {
          Animated.timing(fade, {
            toValue: 0,
            duration: reduceMotion ? 150 : 420,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }).start(() => {
            setRun(null);
            onDone && onDone();
          });
        }, coverMs + holdMs),
      ];
    },
  }));

  if (!run) {
    return null;
  }
  const c = COPY[run.mode];
  const {width: W, height: H} = Dimensions.get('window');
  const {x, y} = run.origin;
  // circle big enough to cover the farthest corner from the origin
  const R = Math.ceil(Math.hypot(Math.max(x, W - x), Math.max(y, H - y))) + 4;

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.portal, {opacity: fade}]}
      pointerEvents="auto"
      accessibilityLiveRegion="polite"
      accessibilityLabel={`${c.title}`}>
      <Animated.View
        style={[
          styles.circle,
          {
            left: x - R,
            top: y - R,
            width: R * 2,
            height: R * 2,
            borderRadius: R,
            transform: [
              {
                scale: grow.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.02, 1],
                }),
              },
            ],
          },
        ]}>
        <LinearGradient
          colors={c.colors}
          start={{x: 0.2, y: 0}}
          end={{x: 0.8, y: 1}}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.portalContent,
          {
            opacity: content,
            transform: [
              {
                translateY: content.interpolate({
                  inputRange: [0, 1],
                  outputRange: [18, 0],
                }),
              },
              {
                scale: fade.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1.04, 1],
                }),
              },
            ],
          },
        ]}>
        <View style={[styles.portalIcon, {backgroundColor: c.glass}]}>
          <AppIcon name={c.icon} size={40} color={c.ink} strokeWidth={1.6} />
        </View>
        <HText style={[styles.portalEyebrow, {color: c.soft}]}>
          {c.eyebrow}
        </HText>
        <HText style={[styles.portalTitle, {color: c.ink}]}>{c.title}</HText>
        <HText style={[styles.portalSub, {color: c.soft}]}>{c.sub}</HText>
        <View style={styles.portalChips}>
          {c.chips.map(ch => (
            <View
              key={ch}
              style={[styles.portalChip, {backgroundColor: c.glass}]}>
              <HText style={[styles.portalChipText, {color: c.ink}]}>
                {ch}
              </HText>
            </View>
          ))}
        </View>
      </Animated.View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  tokenWrap: {alignItems: 'center'},
  token: {
    width: TOKEN,
    height: TOKEN,
    borderRadius: TOKEN / 2,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
    shadowColor: P.deep,
    shadowOpacity: 0.32,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 8},
    elevation: 10,
  },
  face: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: TOKEN / 2,
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
  },
  faceFill: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  tokenLabel: {flexDirection: 'row', alignItems: 'center', marginTop: 3},
  tokenLabelText: {fontSize: 11, fontWeight: '700', marginLeft: 3},

  portal: {zIndex: 10000, elevation: 50},
  circle: {position: 'absolute', overflow: 'hidden'},
  portalContent: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  portalIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  portalEyebrow: {fontSize: 11.5, fontWeight: '700', letterSpacing: 2.2},
  portalTitle: {
    fontSize: 32,
    fontWeight: '300',
    letterSpacing: -0.6,
    marginTop: 6,
  },
  portalSub: {
    fontSize: 14.5,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 300,
  },
  portalChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 20,
  },
  portalChip: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 15,
    justifyContent: 'center',
    margin: 4,
  },
  portalChipText: {fontSize: 12.5, fontWeight: '700'},
});
