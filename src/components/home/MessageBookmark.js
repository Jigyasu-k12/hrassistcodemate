// "MSIL Operating System" — a bookmark ribbon on the right edge of Home that
// opens the company message video in a full-screen, cinematic player.
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  View,
  Modal,
  Pressable,
  TouchableOpacity,
  Animated,
  Easing,
  PanResponder,
  StyleSheet,
  Dimensions,
  AppState,
  ActivityIndicator,
  StatusBar,
  Platform,
  Image,
} from 'react-native';
import Video from 'react-native-video';
import Svg, {
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Path,
} from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useSafeAreaInsets,
  initialWindowMetrics,
} from 'react-native-safe-area-context';
import AuthContext from '../../context/AuthContext';
import {P, HText, useReduceMotion} from './homeTheme';
import {AppIcon} from '../icons/AppIcon';

const VIDEO = require('../../assets/Images/MSIL_Operating_System.mp4');
const TITLE = 'MSIL Operating System';
const WORDMARK = require('../../assets/Images/MarutiLogo1.png'); // 8340×867
const CONTROLS_HIDE_MS = 2800;

const seenKey = user => `msil_os_video_seen_${user || 'anon'}`;
const fmt = s => {
  const t = Math.max(0, Math.floor(s || 0));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
};

// ── Full-screen player ──────────────────────────────────────────
const VideoPlayer = ({visible, onClose, onWatched, origin}) => {
  const ctxInsets = useSafeAreaInsets();
  const dev = (initialWindowMetrics && initialWindowMetrics.insets) || {};
  const insets = {
    top: Math.max(
      ctxInsets.top,
      dev.top || 0,
      Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 20,
    ),
    bottom: Math.max(ctxInsets.bottom, dev.bottom || 0),
  };
  const {width: W, height: H} = Dimensions.get('window');
  const reduceMotion = useReduceMotion();
  const ref = useRef(null);

  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [time, setTime] = useState(0);
  const [ratio, setRatio] = useState(9 / 16);
  const [buffering, setBuffering] = useState(true);
  const [ended, setEnded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [controls, setControls] = useState(true);
  const [scrub, setScrub] = useState(null); // 0..1 while dragging
  const [barW, setBarW] = useState(1);

  const chrome = useRef(new Animated.Value(1)).current;
  // ── opening intro: panel unfolds from the bookmark → brand → dissolve ──
  const [intro, setIntro] = useState(false);
  const unfold = useRef(new Animated.Value(0)).current;
  const introIn = useRef(new Animated.Value(0)).current;
  const line = useRef(new Animated.Value(0)).current;
  const introOut = useRef(new Animated.Value(1)).current;
  const hideTimer = useRef(null);
  const live = useRef({});
  live.current = {duration, barW};

  // reset + entrance each time it opens
  useEffect(() => {
    if (!visible) {
      return;
    }
    setPaused(false);
    setEnded(false);
    setFailed(false);
    setTime(0);
    setBuffering(true);
    setControls(true);
    if (reduceMotion) {
      unfold.setValue(1);
      introOut.setValue(0);
      setIntro(false);
      return;
    }
    setIntro(true);
    unfold.setValue(0);
    introIn.setValue(0);
    line.setValue(0);
    introOut.setValue(1);
    // 1) panel unfolds from the bookmark to full screen
    Animated.timing(unfold, {
      toValue: 1,
      duration: 580,
      easing: Easing.bezier(0.7, 0, 0.2, 1),
      useNativeDriver: true,
    }).start();
    // 2) wordmark + title rise in, amber line draws across
    Animated.timing(introIn, {
      toValue: 1,
      duration: 640,
      delay: 380,
      easing: Easing.bezier(0.2, 0.7, 0.2, 1),
      useNativeDriver: true,
    }).start();
    Animated.timing(line, {
      toValue: 1,
      duration: 720,
      delay: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    // 3) dissolve into the player (video was loading underneath)
    const t = setTimeout(() => {
      Animated.timing(introOut, {
        toValue: 0,
        duration: 500,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }).start(() => setIntro(false));
    }, 1700);
    return () => clearTimeout(t);
  }, [visible, reduceMotion, unfold, introIn, line, introOut]);

  // controls fade
  useEffect(() => {
    Animated.timing(chrome, {
      toValue: controls ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [controls, chrome]);

  const scheduleHide = useCallback(() => {
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControls(false), CONTROLS_HIDE_MS);
  }, []);
  useEffect(() => {
    if (visible && !paused && !ended && controls && !buffering) {
      scheduleHide();
    }
    return () => clearTimeout(hideTimer.current);
  }, [visible, paused, ended, controls, buffering, scheduleHide]);

  // pause when the app goes to the background
  useEffect(() => {
    const sub = AppState.addEventListener('change', s => {
      if (s !== 'active') {
        setPaused(true);
        setControls(true);
      }
    });
    return () => sub && sub.remove && sub.remove();
  }, []);

  const togglePlay = () => {
    if (ended) {
      return replay();
    }
    setPaused(p => !p);
    setControls(true);
  };
  const replay = () => {
    ref.current && ref.current.seek(0);
    setTime(0);
    setEnded(false);
    setPaused(false);
    setControls(true);
  };

  // scrubbing on the progress bar
  const seekTo = frac => {
    const d = live.current.duration;
    if (d > 0 && ref.current) {
      const t = Math.max(0, Math.min(d, frac * d));
      ref.current.seek(t);
      setTime(t);
      setEnded(false);
    }
  };
  const fracAt = x => Math.max(0, Math.min(1, x / live.current.barW));
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: e => {
        clearTimeout(hideTimer.current);
        setScrub(fracAt(e.nativeEvent.locationX));
      },
      onPanResponderMove: e => setScrub(fracAt(e.nativeEvent.locationX)),
      onPanResponderRelease: e => {
        seekTo(fracAt(e.nativeEvent.locationX));
        setScrub(null);
      },
      onPanResponderTerminate: () => setScrub(null),
    }),
  ).current;

  // where the unfold starts (the bookmark's rect), with a sensible fallback
  const o = origin || {x: W - RIBBON_W, y: H * 0.46, w: RIBBON_W, h: RIBBON_H};
  const ow = o.w;
  const oh = o.h;
  const ocx = o.x + o.w / 2;
  const ocy = o.y + o.h / 2;

  const progress = scrub !== null ? scrub : duration ? time / duration : 0;
  const videoH = Math.min(W * ratio, Dimensions.get('window').height * 0.62);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}>
      <StatusBar hidden={!controls && !paused} barStyle="light-content" />
      <Animated.View
        style={[
          styles.player,
          {
            // revealed only once the unfolding panel has covered the screen
            opacity: unfold.interpolate({
              inputRange: [0, 0.85, 1],
              outputRange: [0, 0, 1],
            }),
          },
        ]}>
        {/* cinematic stage */}
        <LinearGradient
          colors={[P.deep, P.deeper, '#030E0F']}
          style={StyleSheet.absoluteFill}
        />

        <Pressable
          style={[StyleSheet.absoluteFill, styles.center]}
          onPress={() => setControls(c => !c)}
          accessibilityLabel={controls ? 'Hide controls' : 'Show controls'}>
          {failed ? (
            <View style={styles.center}>
              <AppIcon
                name="sparkle"
                size={40}
                color="rgba(255,255,255,0.4)"
                strokeWidth={1.4}
              />
              <HText style={styles.failText}>
                The video couldn't be played.
              </HText>
            </View>
          ) : (
            <Video
              ref={ref}
              source={VIDEO}
              style={{width: W, height: videoH}}
              resizeMode="contain"
              paused={paused || !visible || intro}
              muted={muted}
              repeat={false}
              playInBackground={false}
              ignoreSilentSwitch="ignore"
              preventsDisplaySleepDuringVideoPlayback
              progressUpdateInterval={250}
              onLoad={({duration: d, naturalSize}) => {
                setDuration(d || 0);
                setBuffering(false);
                if (naturalSize && naturalSize.width && naturalSize.height) {
                  const portrait = naturalSize.orientation === 'portrait';
                  const w = portrait
                    ? Math.min(naturalSize.width, naturalSize.height)
                    : naturalSize.width;
                  const h = portrait
                    ? Math.max(naturalSize.width, naturalSize.height)
                    : naturalSize.height;
                  setRatio(h / w);
                }
                onWatched && onWatched();
              }}
              onProgress={({currentTime}) =>
                scrub === null && setTime(currentTime)
              }
              onBuffer={({isBuffering}) => setBuffering(isBuffering)}
              onEnd={() => {
                setEnded(true);
                setPaused(true);
                setControls(true);
              }}
              onError={() => {
                setFailed(true);
                setBuffering(false);
              }}
            />
          )}
          {buffering && !failed && (
            <View
              style={[StyleSheet.absoluteFill, styles.center]}
              pointerEvents="none">
              <ActivityIndicator size="large" color={P.amber} />
            </View>
          )}
        </Pressable>

        {/* top chrome */}
        <Animated.View
          pointerEvents={controls ? 'box-none' : 'none'}
          style={[styles.top, {paddingTop: insets.top + 8, opacity: chrome}]}>
          <LinearGradient
            colors={['rgba(3,14,15,0.85)', 'rgba(3,14,15,0)']}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={styles.topRow}>
            <View style={styles.brandDot}>
              <AppIcon name="play" size={12} color={P.onAmber} />
            </View>
            <View style={{flex: 1}}>
              <HText style={styles.eyebrow}>MARUTI SUZUKI</HText>
              <HText style={styles.title}>{TITLE}</HText>
            </View>
            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close video"
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
              style={styles.glassBtn}>
              <AppIcon
                name="close"
                size={18}
                color="#FFFFFF"
                strokeWidth={2.4}
              />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* centre play / pause */}
        {!ended && !failed && !buffering && (
          <Animated.View
            pointerEvents={controls ? 'box-none' : 'none'}
            style={[StyleSheet.absoluteFill, styles.center, {opacity: chrome}]}>
            <TouchableOpacity
              onPress={togglePlay}
              accessibilityRole="button"
              accessibilityLabel={paused ? 'Play' : 'Pause'}
              style={styles.bigBtn}>
              <AppIcon
                name={paused ? 'play' : 'pause'}
                size={30}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* bottom chrome: progress, time, mute */}
        {!failed && (
          <Animated.View
            pointerEvents={controls ? 'box-none' : 'none'}
            style={[
              styles.bottom,
              {paddingBottom: insets.bottom + 18, opacity: chrome},
            ]}>
            <LinearGradient
              colors={['rgba(3,14,15,0)', 'rgba(3,14,15,0.9)']}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <View
              style={styles.barHit}
              onLayout={e => setBarW(Math.max(1, e.nativeEvent.layout.width))}
              {...pan.panHandlers}
              accessibilityRole="adjustable"
              accessibilityLabel={`Video position ${fmt(time)} of ${fmt(
                duration,
              )}`}>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, {width: `${progress * 100}%`}]} />
              </View>
              <View
                style={[
                  styles.knob,
                  {left: `${progress * 100}%`},
                  scrub !== null && styles.knobActive,
                ]}
              />
            </View>
            <View style={styles.bottomRow}>
              <HText style={styles.time}>
                {fmt(scrub !== null ? scrub * duration : time)}{' '}
                <HText style={styles.timeSoft}>/ {fmt(duration)}</HText>
              </HText>
              <TouchableOpacity
                onPress={() => setMuted(m => !m)}
                accessibilityRole="button"
                accessibilityLabel={muted ? 'Unmute' : 'Mute'}
                style={styles.muteBtn}>
                <HText style={styles.muteText}>
                  {muted ? 'Sound off' : 'Sound on'}
                </HText>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* end card */}
        {ended && (
          <View
            style={[StyleSheet.absoluteFill, styles.center, styles.endScrim]}>
            <View style={styles.endIcon}>
              <AppIcon
                name="check"
                size={28}
                color={P.onAmber}
                strokeWidth={2.6}
              />
            </View>
            <HText style={styles.endTitle}>Thank you for watching</HText>
            <HText style={styles.endSub}>{TITLE}</HText>
            <View style={styles.endBtns}>
              <TouchableOpacity
                onPress={replay}
                accessibilityRole="button"
                style={[styles.endBtn, styles.endBtnGlass]}>
                <AppIcon
                  name="reset"
                  size={16}
                  color="#FFFFFF"
                  strokeWidth={2.2}
                />
                <HText style={styles.endBtnGlassText}>Replay</HText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onClose}
                accessibilityRole="button"
                style={[styles.endBtn, styles.endBtnAmber]}>
                <HText style={styles.endBtnAmberText}>Done</HText>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Animated.View>

      {intro && (
        <View style={StyleSheet.absoluteFill} pointerEvents="auto">
          {/* the bookmark unfolding into a full-screen page */}
          <Animated.View
            style={[
              styles.unfold,
              {
                width: W,
                height: H,
                opacity: introOut,
                transform: [
                  {
                    translateX: unfold.interpolate({
                      inputRange: [0, 1],
                      outputRange: [ocx - W / 2, 0],
                    }),
                  },
                  {
                    translateY: unfold.interpolate({
                      inputRange: [0, 1],
                      outputRange: [ocy - H / 2, 0],
                    }),
                  },
                  {
                    scaleX: unfold.interpolate({
                      inputRange: [0, 1],
                      outputRange: [Math.max(0.02, ow / W), 1],
                    }),
                  },
                  {
                    scaleY: unfold.interpolate({
                      inputRange: [0, 1],
                      outputRange: [Math.max(0.02, oh / H), 1],
                    }),
                  },
                ],
              },
            ]}>
            <LinearGradient
              colors={[P.tealInk, P.deep, P.deeper]}
              locations={[0, 0.55, 1]}
              start={{x: 0.85, y: 0}}
              end={{x: 0.2, y: 1}}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          {/* brand moment */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              styles.center,
              {opacity: Animated.multiply(introIn, introOut)},
            ]}>
            <Animated.View
              style={{
                alignItems: 'center',
                transform: [
                  {
                    translateY: introIn.interpolate({
                      inputRange: [0, 1],
                      outputRange: [16, 0],
                    }),
                  },
                  {
                    scale: introIn.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.94, 1],
                    }),
                  },
                ],
              }}>
              <View style={styles.introBadge}>
                <Image
                  source={WORDMARK}
                  style={styles.introLogo}
                  resizeMode="contain"
                  accessibilityLabel="Maruti Suzuki"
                />
              </View>
              <Animated.View
                style={[styles.introLine, {transform: [{scaleX: line}]}]}
              />
              <HText style={styles.introTitle}>{TITLE}</HText>
            </Animated.View>
          </Animated.View>
        </View>
      )}
    </Modal>
  );
};

// ── Bookmark ribbon on the right edge of Home ───────────────────
// A slim branded ribbon (play badge · MARUTI SUZUKI / OPERATING SYSTEM ·
// swallowtail end). 24px wide: it only grazes card edges in the page margin —
// icons sit at the centre of tiles, so they're never covered.
const RibbonShape = ({w, h}) => (
  <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
    <Defs>
      <SvgGradient id="osRibbon" x1="0" y1="0" x2="0.6" y2="1">
        <Stop offset="0" stopColor={P.tealInk} />
        <Stop offset="0.55" stopColor={P.deep} />
        <Stop offset="1" stopColor={P.deeper} />
      </SvgGradient>
    </Defs>
    {/* flat against the screen edge, rounded top, forked (swallowtail) bottom */}
    <Path
      d={`M${w} 0 L12 0 Q0 0 0 12 L0 ${h} L${w * 0.55} ${
        h - NOTCH
      } L${w} ${h} Z`}
      fill="url(#osRibbon)"
      stroke={P.amber}
      strokeOpacity={0.55}
      strokeWidth={1}
    />
  </Svg>
);

const MessageBookmark = ({visible = false}) => {
  const {AppUserData} = useContext(AuthContext);
  const user = AppUserData?.data?.username;
  const reduceMotion = useReduceMotion();
  const [open, setOpen] = useState(false);
  const [origin, setOrigin] = useState(null);
  const [seen, setSeen] = useState(null); // null = not loaded yet
  const slide = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(1)).current;
  const shine = useRef(new Animated.Value(0)).current;
  const ribbonRef = useRef(null);

  useEffect(() => {
    AsyncStorage.getItem(seenKey(user))
      .then(v => setSeen(v === '1'))
      .catch(() => setSeen(false));
  }, [user]);

  // slide in from the edge when it becomes available
  useEffect(() => {
    if (!visible) {
      slide.setValue(0);
      return;
    }
    Animated.spring(slide, {
      toValue: 1,
      delay: reduceMotion ? 0 : 600,
      useNativeDriver: true,
      speed: 10,
      bounciness: 6,
    }).start();
  }, [visible, reduceMotion, slide]);

  // soft light sweep every few seconds
  useEffect(() => {
    if (!visible || reduceMotion) {
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(2600),
        Animated.timing(shine, {
          toValue: 1,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(shine, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [visible, reduceMotion, shine]);

  // gentle pulse on the "new" dot until watched
  useEffect(() => {
    if (seen !== false || reduceMotion || !visible) {
      return;
    }
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [seen, reduceMotion, visible, pulse]);

  const markWatched = useCallback(() => {
    setSeen(true);
    AsyncStorage.setItem(seenKey(user), '1').catch(() => {});
  }, [user]);

  // measure the ribbon so the player unfolds from exactly where it sits
  const openVideo = () => {
    const node = ribbonRef.current;
    const go = rect => {
      setOrigin(rect);
      setOpen(true);
    };
    if (node && node.measureInWindow) {
      node.measureInWindow((x, y, w, h) => go(w ? {x, y, w, h} : null));
    } else {
      go(null);
    }
  };

  if (!visible) {
    return null;
  }

  const labelTop = 10 + BADGE + 8;
  const labelLen = RIBBON_H - labelTop - NOTCH - 10;

  return (
    <>
      <Animated.View
        ref={ribbonRef}
        collapsable={false}
        style={[
          styles.ribbonWrap,
          {
            transform: [
              {
                translateX: slide.interpolate({
                  inputRange: [0, 1],
                  outputRange: [RIBBON_W + 16, 0],
                }),
              },
              {scale: press},
            ],
          },
        ]}>
        <Pressable
          onPress={openVideo}
          onPressIn={() =>
            Animated.spring(press, {
              toValue: 0.94,
              useNativeDriver: true,
              speed: 40,
              bounciness: 0,
            }).start()
          }
          onPressOut={() =>
            Animated.spring(press, {
              toValue: 1,
              useNativeDriver: true,
              speed: 20,
              bounciness: 8,
            }).start()
          }
          accessibilityRole="button"
          accessibilityLabel={`Watch Maruti Suzuki ${TITLE}${
            seen === false ? ', new' : ''
          }`}
          hitSlop={{top: 6, bottom: 6, left: 4}}
          style={{width: RIBBON_W, height: RIBBON_H}}>
          <RibbonShape w={RIBBON_W} h={RIBBON_H} />

          {/* light sweep, clipped to the ribbon body */}
          <View style={styles.shineClip} pointerEvents="none">
            <Animated.View
              style={[
                styles.shine,
                {
                  transform: [
                    {
                      translateY: shine.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-60, RIBBON_H],
                      }),
                    },
                  ],
                },
              ]}>
              <LinearGradient
                colors={[
                  'rgba(255,255,255,0)',
                  'rgba(255,255,255,0.22)',
                  'rgba(255,255,255,0)',
                ]}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>

          <View style={[styles.playBadge, {top: 10}]}>
            <AppIcon name="play" size={9} color={P.onAmber} />
          </View>

          {/* vertical branding — its own box sized to the label, then rotated,
              so the text is measured at full length and never truncated */}
          <View
            pointerEvents="none"
            style={[
              styles.labelBox,
              {
                width: labelLen,
                left: (RIBBON_W - labelLen) / 2,
                top: labelTop + (labelLen - LABEL_H) / 2,
              },
            ]}>
            <HText style={styles.labelBrand} numberOfLines={1}>
              MARUTI SUZUKI
            </HText>
            <HText style={styles.labelName} numberOfLines={1}>
              OPERATING SYSTEM
            </HText>
          </View>
        </Pressable>

        {seen === false && (
          <View style={styles.newDotWrap} pointerEvents="none">
            <Animated.View
              style={[
                styles.newHalo,
                {
                  opacity: pulse.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.7, 0],
                  }),
                  transform: [
                    {
                      scale: pulse.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 2.4],
                      }),
                    },
                  ],
                },
              ]}
            />
            <View style={styles.newDot} />
          </View>
        )}
      </Animated.View>

      <VideoPlayer
        visible={open}
        origin={origin}
        onClose={() => setOpen(false)}
        onWatched={markWatched}
      />
    </>
  );
};

const RIBBON_W = 24;
const RIBBON_H = 196;
const NOTCH = 12; // swallowtail depth
const BADGE = 18;
const LABEL_H = 22; // two rotated lines

const styles = StyleSheet.create({
  center: {alignItems: 'center', justifyContent: 'center'},

  // bookmark ribbon
  ribbonWrap: {
    position: 'absolute',
    right: 0,
    top: Dimensions.get('window').height * 0.46,
    zIndex: 20,
    elevation: 12,
    shadowColor: P.deeper,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: {width: -4, height: 6},
  },
  shineClip: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: NOTCH,
    borderTopLeftRadius: 12,
    overflow: 'hidden',
  },
  shine: {position: 'absolute', left: 0, right: 0, height: 60},
  playBadge: {
    position: 'absolute',
    left: (RIBBON_W - BADGE) / 2,
    width: BADGE,
    height: BADGE,
    borderRadius: BADGE / 2,
    backgroundColor: P.amber,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 1.5,
  },
  labelBox: {
    position: 'absolute',
    height: LABEL_H,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{rotate: '-90deg'}],
  },
  labelBrand: {
    fontSize: 7.5,
    lineHeight: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
    color: P.amber,
  },
  labelName: {
    fontSize: 8.5,
    lineHeight: 11,
    fontWeight: '600',
    letterSpacing: 1.3,
    color: '#FFFFFF',
  },
  newDotWrap: {position: 'absolute', top: -3, left: -3, width: 10, height: 10},
  newDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: P.amber,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  newHalo: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 5,
    backgroundColor: P.amber,
  },

  // intro
  unfold: {position: 'absolute', left: 0, top: 0, overflow: 'hidden'},
  introBadge: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
  },
  introLogo: {width: 200, height: 21},
  introLine: {
    width: 150,
    height: 2,
    borderRadius: 1,
    backgroundColor: P.amber,
    marginTop: 20,
  },
  introTitle: {
    marginTop: 16,
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: -0.5,
    color: '#FFFFFF',
    textAlign: 'center',
  },

  // player
  player: {flex: 1, backgroundColor: '#030E0F'},
  failText: {fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 10},
  top: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  topRow: {flexDirection: 'row', alignItems: 'center'},
  brandDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: P.amber,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    paddingLeft: 2,
  },
  eyebrow: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1.8,
    color: P.amber,
  },
  title: {fontSize: 17, fontWeight: '600', color: '#FFFFFF', marginTop: 2},
  glassBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(12,51,53,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 3,
  },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    paddingTop: 30,
  },
  barHit: {height: 28, justifyContent: 'center'},
  barTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.22)',
    overflow: 'hidden',
  },
  barFill: {height: '100%', backgroundColor: P.amber},
  knob: {
    position: 'absolute',
    width: 14,
    height: 14,
    marginLeft: -7,
    borderRadius: 7,
    backgroundColor: P.amber,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  knobActive: {transform: [{scale: 1.3}]},
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  time: {fontSize: 12.5, fontWeight: '600', color: '#FFFFFF'},
  timeSoft: {fontSize: 12.5, fontWeight: '500', color: P.mutedOnDark},
  muteBtn: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
  },
  muteText: {fontSize: 12, fontWeight: '600', color: '#FFFFFF'},

  // end card
  endScrim: {backgroundColor: 'rgba(3,14,15,0.82)', paddingHorizontal: 32},
  endIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: P.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endTitle: {
    marginTop: 18,
    fontSize: 24,
    fontWeight: '300',
    letterSpacing: -0.4,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  endSub: {
    marginTop: 6,
    fontSize: 14,
    color: P.mutedOnDark,
    textAlign: 'center',
  },
  endBtns: {flexDirection: 'row', marginTop: 24},
  endBtn: {
    height: 46,
    minWidth: 120,
    paddingHorizontal: 20,
    borderRadius: 23,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
  },
  endBtnGlass: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  endBtnGlassText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  endBtnAmber: {backgroundColor: P.amber},
  endBtnAmberText: {fontSize: 14, fontWeight: '700', color: P.onAmber},
});

export default MessageBookmark;
