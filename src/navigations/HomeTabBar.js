// Bottom bar — Home · Quick dials · [role token] · People · Profile.
// White bar with a hairline top, a short indicator that slides to the active
// tab (deep teal for employees, amber in manager mode) and the raised role
// token in the centre.
import React, {useEffect, useRef} from 'react';
import {View, Pressable, Animated, StyleSheet, Dimensions} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {HomePalette as P} from '../constants/Colors';
import {AppIcon} from '../components/icons/AppIcon';
import {HText} from '../components/home/homeTheme';
import {RoleToken} from '../components/home/ModeSwitch';

const SLOTS = [
  {key: 'home', label: 'Home', icon: 'home'},
  {key: 'quick', label: 'Quick dials', icon: 'phone'},
  {key: 'token'},
  {key: 'people', label: 'People', icon: 'people'},
  {key: 'profile', label: 'Profile', icon: 'profile'},
];
// Compact content row: icon (26) + label (13) + breathing room.
const BAR_H = 54;
// The bar may overlap the home-indicator zone a little (as native apps do)
// instead of stacking the full inset underneath.
const INSET_OVERLAP = 14;
const MIN_BOTTOM = 8;
// Transparent strip above the white surface so the raised token stays inside
// the bar's bounds (Android only delivers touches inside a view's bounds).
const RAISE = 28;
const IND_W = 28;

// Which slot the current tab route belongs to (null → no indicator)
const activeSlotFor = routeName => {
  if (routeName === 'Home') {
    return 'home';
  }
  if (routeName === 'Quick Dials' || routeName === 'HospitalNavs') {
    return 'quick';
  }
  if (routeName === 'EmployeeNavs') {
    return 'people';
  }
  return null;
};

const Tab = ({slot, active, accent, onPress}) => {
  const press = useRef(new Animated.Value(1)).current;
  const spring = v =>
    Animated.spring(press, {
      toValue: v,
      useNativeDriver: true,
      speed: 40,
      bounciness: v === 1 ? 8 : 0,
    }).start();
  const color = active ? accent : P.sub;
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => spring(0.9)}
      onPressOut={() => spring(1)}
      accessibilityRole="tab"
      accessibilityState={{selected: active}}
      accessibilityLabel={slot.label}
      style={styles.tab}>
      <Animated.View style={[styles.tabInner, {transform: [{scale: press}]}]}>
        <View style={styles.iconBox}>
          <AppIcon
            name={slot.icon}
            size={22}
            color={color}
            strokeWidth={active ? 2.1 : 1.8}
          />
        </View>
        <HText
          style={[styles.label, {color}, active && styles.labelActive]}
          numberOfLines={1}>
          {slot.label}
        </HText>
      </Animated.View>
    </Pressable>
  );
};

const HomeTabBar = ({
  state,
  navigation,
  isManager,
  tokenManager,
  tokenRef,
  onToggle,
}) => {
  const insets = useSafeAreaInsets();
  const {width: W} = Dimensions.get('window');
  const slotW = W / SLOTS.length;
  const accent = isManager ? P.amberInk : P.deep;
  const active = activeSlotFor(state.routes[state.index]?.name);
  const activeIdx = SLOTS.findIndex(s => s.key === active);

  // sliding indicator
  const x = useRef(new Animated.Value(activeIdx >= 0 ? activeIdx : 0)).current;
  const show = useRef(new Animated.Value(activeIdx >= 0 ? 1 : 0)).current;
  useEffect(() => {
    if (activeIdx >= 0) {
      Animated.spring(x, {
        toValue: activeIdx,
        useNativeDriver: true,
        speed: 16,
        bounciness: 6,
      }).start();
    }
    Animated.timing(show, {
      toValue: activeIdx >= 0 ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [activeIdx, x, show]);

  const emitAndGo = (routeName, params) => {
    const route = state.routes.find(r => r.name === routeName);
    const event = route
      ? navigation.emit({
          type: 'tabPress',
          target: route.key,
          canPreventDefault: true,
        })
      : {defaultPrevented: false};
    if (!event.defaultPrevented) {
      navigation.navigate(routeName, params);
    }
  };

  const go = key => {
    switch (key) {
      case 'home':
        return emitAndGo('Home');
      case 'quick':
        return emitAndGo('Quick Dials');
      case 'people':
        // always the Lookup page's first tab, like the Home tile
        return emitAndGo('EmployeeNavs', {
          screen: 'EmployeLookUp',
          params: {screen: 'Employee Directory'},
        });
      case 'profile':
        return navigation.navigate('EditProfile');
      default:
        return null;
    }
  };

  // Face ID iPhones ≈20 · Touch ID / 3-button Android 8 · gesture Android adapts
  const bottomPad = Math.max(MIN_BOTTOM, insets.bottom - INSET_OVERLAP);

  return (
    <View
      style={[
        styles.bar,
        {height: RAISE + BAR_H + bottomPad, paddingBottom: bottomPad},
      ]}
      pointerEvents="box-none">
      <View style={styles.surface} pointerEvents="none" />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.indicator,
          {
            backgroundColor: accent,
            opacity: show,
            transform: [
              {
                translateX: x.interpolate({
                  inputRange: [0, SLOTS.length - 1],
                  outputRange: [
                    slotW / 2 - IND_W / 2,
                    slotW * (SLOTS.length - 1) + slotW / 2 - IND_W / 2,
                  ],
                }),
              },
            ],
          },
        ]}
      />

      <View style={styles.row} pointerEvents="box-none">
        {SLOTS.map(slot =>
          slot.key === 'token' ? (
            <View key="token" style={styles.tokenSlot} pointerEvents="box-none">
              <RoleToken
                ref={tokenRef}
                isManager={tokenManager}
                onPress={onToggle}
              />
            </View>
          ) : (
            <Tab
              key={slot.key}
              slot={slot}
              active={active === slot.key}
              accent={accent}
              onPress={() => go(slot.key)}
            />
          ),
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {position: 'absolute', left: 0, right: 0, bottom: 0},
  surface: {
    ...StyleSheet.absoluteFillObject,
    top: RAISE,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    borderColor: P.line,
    shadowColor: P.deep,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: -4},
    elevation: 12,
  },
  indicator: {
    position: 'absolute',
    top: RAISE,
    left: 0,
    width: IND_W,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  row: {
    height: BAR_H,
    marginTop: RAISE,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tab: {flex: 1, height: BAR_H, alignItems: 'center', justifyContent: 'center'},
  tabInner: {alignItems: 'center'},
  iconBox: {
    width: 48,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {fontSize: 11, lineHeight: 13, fontWeight: '600', marginTop: 2},
  labelActive: {fontWeight: '700'},
  // raised centre slot for the role token
  // spans the transparent strip too; label bottom lines up with the other tabs
  tokenSlot: {
    flex: 1,
    alignSelf: 'flex-end',
    height: BAR_H + RAISE,
    marginTop: -RAISE,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: Math.round((BAR_H - 41) / 2),
  },
});

export default HomeTabBar;
