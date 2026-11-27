// MSIL Happenings as stories — a bubble row for the dark Home header and a
// full-screen viewer (progress bars, tap to step, hold to pause, swipe down to close).
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useMemo,
} from 'react';
import {
  View,
  ScrollView,
  Image,
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
  LayoutAnimation,
  UIManager,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useSafeAreaInsets,
  initialWindowMetrics,
} from 'react-native-safe-area-context';
import {P, HText, useReduceMotion} from './homeTheme';
import {AppIcon} from '../icons/AppIcon';
import AuthContext from '../../context/AuthContext';
import {
  getCachedStories,
  whenHydrated,
  subscribeStories,
  refreshStories,
  sameStories,
  POLL_MS,
} from './storyStore';

const STORY_MS = 5000;
const BUBBLE = 56;
const TAP_MAX_MS = 220; // shorter than this = tap, longer = hold-to-pause

// Seen state resets daily so fresh highlights get the bright ring again.
// Per user + per day: each login on a shared device has its own viewed state.
const SEEN_PREFIX = 'home_stories_seen_';
const todayKey = user => {
  const d = new Date();
  return `${SEEN_PREFIX}${user || 'anon'}_${d.getFullYear()}-${
    d.getMonth() + 1
  }-${d.getDate()}`;
};
// Drop earlier days' entries and the old shared (no-username) format.
// Other users' entries for today are kept.
const dateSuffix = () => {
  const d = new Date();
  return `_${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};
const OLD_SHARED_FORMAT = new RegExp(
  `^${SEEN_PREFIX}\\d{4}-\\d{1,2}-\\d{1,2}$`,
);
export const isStaleSeenKey = k =>
  k.startsWith(SEEN_PREFIX) &&
  (OLD_SHARED_FORMAT.test(k) || !k.endsWith(dateSuffix()));
const pruneOldSeen = () =>
  AsyncStorage.getAllKeys()
    .then(keys => {
      const stale = keys.filter(isStaleSeenKey);
      return stale.length ? AsyncStorage.multiRemove(stale) : null;
    })
    .catch(() => {});
const baseOf = uri => String(uri || '').split('?')[0]; // ignore cache-bust param
// "Watched" is tied to the story's VERSION, not just its file name: when the
// content team replaces 1.png, the server's version stamp (ETag / Last-Modified)
// changes, so the story counts as new again — no renaming (1_1.png) needed.
// If the server sends no stamp, fall back to the file name alone.
const seenKeyOf = st => {
  const base = baseOf(st && st.uri);
  return st && st.sig ? `${base}#${st.sig}` : base;
};

// ── Stories source: saved result shown instantly, re-checked silently ──
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// active: Home is on screen — re-check on focus, on app foreground and every
// POLL_MS while visible (all silent; throttled inside the store).
// True while a story viewer is open or still dismissing. LayoutAnimation must
// not run during a Modal's dismissal — on iOS that can leave the Modal's
// invisible window on screen and swallow every touch.
let viewerActive = false;

export const useStoryImages = (refreshKey = 0, active = true) => {
  // Start from the saved list (loaded at app start) — no pop-in on open.
  const [stories, setStories] = useState(() => getCachedStories() || []);
  const current = useRef(stories);
  current.current = stories;

  const apply = useCallback(items => {
    if (!sameStories(current.current, items) && !viewerActive) {
      // only animate when the set really changed, and never under a Modal
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setStories(items);
  }, []);

  useEffect(() => subscribeStories(items => apply(items)), [apply]);

  useEffect(() => {
    let alive = true;
    whenHydrated().then(() => {
      const saved = getCachedStories();
      if (alive && saved && !current.current.length && saved.length) {
        apply(saved);
      }
      // silent background check (forced on pull-to-refresh)
      refreshStories({force: refreshKey > 0});
    });
    return () => {
      alive = false;
    };
  }, [refreshKey, apply]);

  useEffect(() => {
    if (!active) {
      return;
    }
    refreshStories(); // on focus
    const poll = setInterval(() => {
      if (AppState.currentState === 'active') {
        refreshStories();
      }
    }, POLL_MS);
    const sub = AppState.addEventListener('change', st => {
      if (st === 'active') {
        refreshStories(); // back from background
      }
    });
    return () => {
      clearInterval(poll);
      sub && sub.remove && sub.remove();
    };
  }, [active]);

  return stories;
};

// ── Bubble (no caption — the ring says new / seen) ──
const Bubble = ({seen, onPress, index, count}) => {
  const press = useRef(new Animated.Value(1)).current;
  const to = v =>
    Animated.spring(press, {
      toValue: v,
      useNativeDriver: true,
      speed: 30,
      bounciness: v === 1 ? 8 : 0,
    }).start();
  const inner = (
    <View style={styles.ringGap}>
      <Emblem n={index + 1} seen={seen} />
    </View>
  );
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => to(0.9)}
      onPressOut={() => to(1)}
      accessibilityRole="button"
      accessibilityLabel={`MSIL highlight ${index + 1} of ${count}${
        seen ? ', viewed' : ', new'
      }`}
      hitSlop={6}>
      <Animated.View style={{transform: [{scale: press}]}}>
        {seen ? (
          <View style={[styles.ring, styles.ringSeen]}>{inner}</View>
        ) : (
          <LinearGradient
            colors={[P.amberSoft, P.amber, P.amberStrong, P.teal]}
            locations={[0, 0.35, 0.62, 1]}
            start={{x: 0.15, y: 0}}
            end={{x: 0.85, y: 1}}
            style={styles.ring}>
            {inner}
          </LinearGradient>
        )}
      </Animated.View>
    </Pressable>
  );
};

// Numbered emblem — light amber numerals, same voice as the legacy years.
const Emblem = ({n, seen}) => (
  <LinearGradient
    colors={
      seen
        ? ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']
        : [P.glow, P.deep]
    }
    start={{x: 0.3, y: 0}}
    end={{x: 0.7, y: 1}}
    style={[styles.emblem, styles.center]}>
    <HText style={[styles.emblemNum, seen && styles.emblemNumSeen]}>
      {String(n).padStart(2, '0')}
    </HText>
  </LinearGradient>
);

// ── Full-screen viewer ──
const StoryViewer = ({
  visible,
  stories,
  startIndex,
  onClose,
  onSeen,
  onDismissed,
}) => {
  const ctxInsets = useSafeAreaInsets();
  // Inside a full-screen Modal the context can report 0 — fall back to the
  // device's real insets so the header never sits under the notch / clock.
  const deviceInsets =
    (initialWindowMetrics && initialWindowMetrics.insets) || {};
  const insets = {
    top: Math.max(
      ctxInsets.top,
      deviceInsets.top || 0,
      Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 20,
    ),
    bottom: Math.max(ctxInsets.bottom, deviceInsets.bottom || 0),
  };
  const reduceMotion = useReduceMotion();
  const {width: W, height: H} = Dimensions.get('window');
  const [index, setIndex] = useState(startIndex);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [paused, setPaused] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const enter = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const anim = useRef(null);
  const pressedAt = useRef(0);
  const dragging = useRef(false);
  const live = useRef({});

  const go = useCallback(
    next => {
      anim.current && anim.current.stop();
      if (next >= stories.length) {
        onClose();
        return;
      }
      setIndex(Math.max(0, next));
    },
    [stories.length, onClose],
  );
  live.current = {index, go};

  // reset per open
  useEffect(() => {
    if (!visible) {
      return;
    }
    setIndex(startIndex);
    dragY.setValue(0);
    enter.setValue(reduceMotion ? 1 : 0);
    if (!reduceMotion) {
      Animated.timing(enter, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [visible, startIndex, reduceMotion, dragY, enter]);

  // new story → wait for its image
  useEffect(() => {
    progress.setValue(0);
    setLoaded(false);
    setFailed(false);
    if (visible && stories[index]) {
      onSeen(stories[index]);
    }
  }, [index, visible, stories, onSeen, progress]);

  // run the timer once the image is ready (or failed) and not paused
  useEffect(() => {
    if (!visible || paused || !(loaded || failed)) {
      anim.current && anim.current.stop();
      return;
    }
    let remaining = 1;
    progress.stopAnimation(v => {
      remaining = 1 - v;
      anim.current = Animated.timing(progress, {
        toValue: 1,
        duration: Math.max(60, STORY_MS * remaining),
        easing: Easing.linear,
        useNativeDriver: false, // width-based bar
      });
      anim.current.start(
        ({finished}) => finished && live.current.go(live.current.index + 1),
      );
    });
    return () => anim.current && anim.current.stop();
  }, [visible, paused, loaded, failed, index, progress]);

  // pause while the app is in the background
  useEffect(() => {
    const sub = AppState.addEventListener('change', s =>
      setPaused(s !== 'active'),
    );
    return () => sub && sub.remove && sub.remove();
  }, []);

  // swipe down to close
  const pan = useRef(
    PanResponder.create({
      // capture so a downward drag wins over the tap zones underneath
      onMoveShouldSetPanResponderCapture: (_, g) => {
        const yes = g.dy > 10 && Math.abs(g.dy) > Math.abs(g.dx);
        if (yes) {
          dragging.current = true;
        }
        return yes;
      },
      onPanResponderGrant: () => setPaused(true),
      onPanResponderMove: (_, g) => dragY.setValue(Math.max(0, g.dy)),
      onPanResponderRelease: (_, g) => {
        dragging.current = false;
        if (g.dy > 110 || g.vy > 1.2) {
          live.current.close();
        } else {
          Animated.spring(dragY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
          }).start();
          setPaused(false);
        }
      },
      onPanResponderTerminate: () => {
        dragging.current = false;
        Animated.spring(dragY, {toValue: 0, useNativeDriver: true}).start();
        setPaused(false);
      },
    }),
  ).current;
  live.current.close = () => {
    Animated.timing(dragY, {
      toValue: H,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setPaused(false);
      onClose();
    });
  };

  const onPressIn = () => {
    pressedAt.current = Date.now();
    setPaused(true);
  };
  const onPressOut = side => () => {
    if (dragging.current) {
      return; // the press was taken over by swipe-down
    }
    const quick = Date.now() - pressedAt.current < TAP_MAX_MS;
    setPaused(false);
    if (quick) {
      go(side === 'left' ? index - 1 : index + 1);
    }
  };

  const story = stories[index] || {};
  const uri = story.uri;
  const sheetStyle = {
    opacity: enter,
    transform: [
      {translateY: dragY},
      {
        scale: Animated.add(
          enter.interpolate({inputRange: [0, 1], outputRange: [0.94, 1]}),
          dragY.interpolate({
            inputRange: [0, H],
            outputRange: [0, -0.12],
            extrapolate: 'clamp',
          }),
        ),
      },
    ],
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onDismiss={onDismissed}
      onRequestClose={onClose}>
      <StatusBar barStyle="light-content" />
      <Animated.View
        style={[
          styles.scrim,
          {
            opacity: dragY.interpolate({
              inputRange: [0, H * 0.6],
              outputRange: [1, 0],
              extrapolate: 'clamp',
            }),
          },
        ]}
      />
      <Animated.View style={[styles.viewer, sheetStyle]} {...pan.panHandlers}>
        {/* blurred fill + full image, so banners are never cropped */}
        {!!uri && !failed && (
          <Image
            source={{uri}}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            blurRadius={24}
          />
        )}
        <LinearGradient
          colors={[
            'rgba(7,30,32,0.78)',
            'rgba(7,30,32,0.55)',
            'rgba(7,30,32,0.85)',
          ]}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            styles.stage,
            {paddingTop: insets.top + 56, paddingBottom: insets.bottom + 40},
          ]}>
          {failed ? (
            <View style={[styles.center, {flex: 1}]}>
              <AppIcon
                name="sparkle"
                size={44}
                color="rgba(255,255,255,0.4)"
                strokeWidth={1.4}
              />
              <HText style={styles.failText}>
                This highlight couldn't load
              </HText>
            </View>
          ) : (
            <Image
              key={uri}
              source={{uri}}
              style={{
                width: W - 24,
                height: story.ratio
                  ? Math.min((W - 24) * story.ratio, H * 0.72)
                  : H * 0.6,
                borderRadius: 18,
              }}
              resizeMode="contain"
              onLoad={() => setLoaded(true)}
              onError={() => setFailed(true)}
              accessibilityLabel={`MSIL highlight ${index + 1} of ${
                stories.length
              }`}
            />
          )}
          {!loaded && !failed && (
            <View
              style={[StyleSheet.absoluteFill, styles.center]}
              pointerEvents="none">
              <ActivityIndicator color={P.amber} />
            </View>
          )}
        </View>

        {/* tap zones: left third = previous, rest = next; hold anywhere = pause */}
        <View style={styles.zones}>
          <Pressable
            style={{flex: 1}}
            onPressIn={onPressIn}
            onPressOut={onPressOut('left')}
            accessibilityRole="button"
            accessibilityLabel="Previous highlight"
          />
          <Pressable
            style={{flex: 2}}
            onPressIn={onPressIn}
            onPressOut={onPressOut('right')}
            accessibilityRole="button"
            accessibilityLabel="Next highlight"
          />
        </View>

        {/* top chrome */}
        <View
          style={[styles.top, {paddingTop: insets.top + 10}]}
          pointerEvents="box-none">
          <View style={styles.bars}>
            {stories.map((_, i) => (
              <View key={i} style={styles.barTrack}>
                <Animated.View
                  style={[
                    styles.barFill,
                    {
                      width:
                        i < index
                          ? '100%'
                          : i > index
                          ? '0%'
                          : progress.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0%', '100%'],
                            }),
                    },
                  ]}
                />
              </View>
            ))}
          </View>
          <View style={styles.topRow} pointerEvents="box-none">
            <View style={styles.brandDot}>
              <AppIcon
                name="sparkle"
                size={14}
                color={P.onAmber}
                strokeWidth={2.2}
              />
            </View>
            <View style={{flex: 1}}>
              <HText style={styles.topTitle}>MSIL Happenings</HText>
              <HText style={styles.topSub}>
                {paused
                  ? 'Paused'
                  : `Highlight ${index + 1} of ${stories.length}`}
              </HText>
            </View>
            <TouchableOpacity
              onPress={() => live.current.close()}
              accessibilityRole="button"
              accessibilityLabel="Close highlights"
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
              style={styles.closeBtn}>
              <AppIcon
                name="close"
                size={18}
                color="#FFFFFF"
                strokeWidth={2.4}
              />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
};

// ── Row (for the dark header) ──
// Heading mirrors "The journey continues · since 1981" (title · muted meta, control on the
// right) so the two sections read as one continuous header.
const StoriesRow = ({stories = []}) => {
  const {AppUserData} = useContext(AuthContext);
  const user = AppUserData?.data?.username;
  const [seen, setSeen] = useState({});
  const [openAt, setOpenAt] = useState(null); // position in the viewer's list
  // Order is frozen while the viewer is open (Instagram doesn't reshuffle the
  // tray under you) and re-sorted when it closes.
  const [frozen, setFrozen] = useState(null); // [uri] while viewing
  const unfreezeTimer = useRef(null);
  useEffect(
    () => () => {
      clearTimeout(unfreezeTimer.current);
      viewerActive = false;
    },
    [],
  );
  // Stable list for the viewer (a new array each render would restart the
  // current story whenever "seen" updates).
  const viewerStories = useMemo(
    () =>
      frozen
        ? frozen.map(u => stories.find(st => st.uri === u)).filter(Boolean)
        : [],
    [frozen, stories],
  );

  useEffect(() => {
    let alive = true;
    setSeen({}); // new login → start from "new", never another user's state
    const key = todayKey(user);
    AsyncStorage.getItem(key)
      .then(raw => {
        if (alive && raw) {
          setSeen(JSON.parse(raw) || {});
        }
      })
      .catch(() => {});
    pruneOldSeen();
    return () => {
      alive = false;
    };
  }, [user]);

  const markSeen = useCallback(
    st => {
      const k = seenKeyOf(st);
      setSeen(prev => {
        if (prev[k]) {
          return prev;
        }
        const next = {...prev, [k]: 1};
        AsyncStorage.setItem(todayKey(user), JSON.stringify(next)).catch(
          () => {},
        );
        return next;
      });
    },
    [user],
  );

  if (!stories.length) {
    return null;
  }

  // Instagram order: unwatched first, watched last (each keeps its sequence).
  // `i` stays the story's own number (01, 02…) so a bubble keeps its identity.
  const all = stories.map((st, i) => ({
    story: st,
    uri: st.uri,
    i,
    seen: !!seen[seenKeyOf(st)],
  }));
  const sorted = [...all.filter(x => !x.seen), ...all.filter(x => x.seen)];
  const byUri = Object.fromEntries(all.map(x => [x.uri, x]));
  const items = frozen ? frozen.map(u => byUri[u]).filter(Boolean) : sorted;
  const newCount = all.filter(x => !x.seen).length;

  const openFrom = pos => {
    clearTimeout(unfreezeTimer.current);
    viewerActive = true;
    setFrozen(items.map(x => x.uri));
    setOpenAt(pos);
  };
  // Re-sort once the Modal has fully dismissed (never during dismissal).
  const unfreeze = () => {
    clearTimeout(unfreezeTimer.current);
    if (!viewerActive) {
      return;
    }
    viewerActive = false;
    // watched stories glide to the end as the tray re-sorts
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFrozen(null);
  };
  const closeViewer = () => {
    setOpenAt(null); // 1) close the Modal — no layout animation here
    // 2) iOS calls onDismiss when it's gone; Android has no such event, so
    //    fall back to a short delay (also a safety net if onDismiss is missed)
    clearTimeout(unfreezeTimer.current);
    unfreezeTimer.current = setTimeout(unfreeze, 400);
  };

  const bubbles = items.map((x, pos) => (
    <View key={x.uri} style={pos < items.length - 1 ? styles.storyGap : null}>
      <Bubble
        index={x.i}
        count={items.length}
        seen={x.seen}
        onPress={() => openFrom(pos)}
      />
    </View>
  ));

  return (
    <View style={styles.row}>
      <View style={styles.rowHead}>
        <HText
          style={styles.rowTitle}
          accessibilityRole="header"
          numberOfLines={1}>
          MSIL Happenings{' '}
          <HText style={styles.rowMeta}>
            · {newCount ? `${newCount} new` : 'all caught up'}
          </HText>
        </HText>
        <TouchableOpacity
          onPress={() => openFrom(0)}
          accessibilityRole="button"
          accessibilityLabel="Watch MSIL highlights"
          style={styles.watch}>
          <HText style={styles.watchText}>Watch</HText>
          <View style={styles.watchBtn}>
            <AppIcon name="play" size={11} color={P.mutedOnDark} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Instagram-style tray: left-aligned with the heading, even spacing,
          bleeds to the screen edges so extra stories scroll off naturally */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tray}
        contentContainerStyle={styles.trayContent}>
        {bubbles}
      </ScrollView>

      {/* soft hand-off into "The journey continues" */}
      <LinearGradient
        colors={[
          'rgba(156,189,182,0)',
          'rgba(156,189,182,0.28)',
          'rgba(156,189,182,0)',
        ]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={styles.divider}
      />

      <StoryViewer
        visible={openAt !== null}
        stories={viewerStories}
        startIndex={openAt || 0}
        onClose={closeViewer}
        onSeen={markSeen}
        onDismissed={unfreeze}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  center: {alignItems: 'center', justifyContent: 'center'},

  row: {marginTop: 6},
  rowHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 34,
  },
  rowTitle: {flex: 1, fontSize: 15, fontWeight: '600', color: '#FFFFFF'},
  rowMeta: {fontSize: 15, fontWeight: '500', color: P.mutedOnDark},
  watch: {flexDirection: 'row', alignItems: 'center', height: 34},
  watchText: {fontSize: 12, fontWeight: '600', color: P.mutedOnDark},
  watchBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // header has 16px side padding: bleed out, then pad back in to align with text
  tray: {marginHorizontal: -16},
  trayContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 2,
    alignItems: 'center',
  },
  storyGap: {marginRight: 12},
  ring: {
    width: BUBBLE,
    height: BUBBLE,
    borderRadius: BUBBLE / 2,
    padding: 2.5,
    marginRight: 0,
    shadowColor: P.amber,
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 0},
  },
  ringSeen: {
    borderWidth: 1.5,
    borderColor: 'rgba(156,189,182,0.42)',
    padding: 2,
    shadowOpacity: 0,
  },
  ringGap: {
    flex: 1,
    borderRadius: BUBBLE / 2,
    padding: 2.5,
    backgroundColor: P.deep,
  },
  emblem: {flex: 1, borderRadius: BUBBLE / 2, overflow: 'hidden'},
  emblemNum: {
    fontSize: 17,
    fontWeight: '300',
    letterSpacing: -0.4,
    color: P.amber,
  },
  emblemNumSeen: {color: P.mutedOnDark},
  divider: {height: 1, marginTop: 14, marginHorizontal: 8},

  scrim: {...StyleSheet.absoluteFillObject, backgroundColor: P.deeper},
  viewer: {flex: 1, overflow: 'hidden', backgroundColor: P.deeper},
  stage: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  failText: {fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 10},
  zones: {...StyleSheet.absoluteFillObject, flexDirection: 'row', top: 110},
  top: {position: 'absolute', left: 0, right: 0, top: 0, paddingHorizontal: 12},
  bars: {flexDirection: 'row'},
  barTrack: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    marginHorizontal: 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  barFill: {height: '100%', backgroundColor: P.amber, borderRadius: 2},
  topRow: {flexDirection: 'row', alignItems: 'center', marginTop: 12},
  brandDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: P.amber,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  topTitle: {fontSize: 14, fontWeight: '700', color: '#FFFFFF'},
  topSub: {fontSize: 12, color: P.mutedOnDark, marginTop: 1},
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default StoriesRow;
