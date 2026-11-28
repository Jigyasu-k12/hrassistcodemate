// Vision · Mission · Philosophy — compact rotating strip + full sheet.
import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  Easing,
  StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {P, HText, VISION, MISSION, PHILOSOPHY} from './homeTheme';
import HomeSheet from './HomeSheet';

const ITEMS = [
  ...VISION.map(t => ({tab: 0, text: t})),
  ...MISSION.map((t, i) => ({tab: 1, text: `${i + 1}. ${t}`})),
  ...PHILOSOPHY.map(p => ({tab: 2, text: p.term, sub: p.meaning})),
];
const FIRST = [0, VISION.length, VISION.length + MISSION.length];
const TABS = ['Vision', 'Mission', 'Philosophy'];

const ValuesSheet = ({visible, onClose}) => (
  <HomeSheet
    visible={visible}
    onClose={onClose}
    eyebrow="Maruti Suzuki"
    title="Vision, Mission & Philosophy">
    <LinearGradient colors={['#F5F5F5', '#F5F5F5']} style={styles.sheetCard}>
      <View style={styles.block}>
        <HText style={styles.visionTitle}>Vision</HText>
        {VISION.map(v => (
          <HText key={v} style={styles.visionLine}>
            {v}
          </HText>
        ))}
      </View>

      <View style={styles.block}>
        <HText style={styles.sectionTitle}>Mission Statement</HText>
        {MISSION.map((m, i) => (
          <View key={m} style={styles.missionRow}>
            <View style={styles.missionNum}>
              <HText style={styles.missionNumText}>{i + 1}</HText>
            </View>
            <HText style={styles.missionText}>{m}</HText>
          </View>
        ))}
      </View>

      <View>
        <HText style={[styles.sectionTitle, {fontStyle: 'italic'}]}>
          Philosophy of Conduct
        </HText>
        {PHILOSOPHY.map(p => (
          <View key={p.term} style={styles.philRow}>
            <LinearGradient
              colors={['#171C8F', '#01044B']}
              start={{x: 0.5, y: 0}}
              end={{x: 0.5, y: 0.8}}
              style={styles.philPill}>
              <HText style={styles.philTerm}>{p.term}</HText>
            </LinearGradient>
            <HText style={styles.philMeaning}>{p.meaning}</HText>
          </View>
        ))}
      </View>
    </LinearGradient>
  </HomeSheet>
);

const ValuesStrip = ({active = true, reduceMotion = false}) => {
  const [vi, setVi] = useState(0);
  const [open, setOpen] = useState(false);
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!active || open || reduceMotion) {
      return;
    }
    const t = setInterval(() => setVi(i => (i + 1) % ITEMS.length), 5500);
    return () => clearInterval(t);
  }, [active, open, reduceMotion]);

  useEffect(() => {
    if (reduceMotion) {
      fade.setValue(1);
      return;
    }
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 800,
      delay: 200,
      easing: Easing.bezier(0.2, 0.7, 0.2, 1),
      useNativeDriver: true,
    }).start();
  }, [vi, reduceMotion, fade]);

  const item = ITEMS[vi];

  return (
    <View style={styles.card}>
      <View style={styles.tabsRow}>
        <View style={styles.tabs} accessibilityRole="tablist">
          {TABS.map((label, i) => {
            const on = item.tab === i;
            return (
              <TouchableOpacity
                key={label}
                onPress={() => setVi(FIRST[i])}
                accessibilityRole="tab"
                accessibilityState={{selected: on}}
                style={[styles.tab, on && styles.tabOn]}>
                <HText
                  style={[
                    styles.tabText,
                    on && {
                      fontWeight: '700',
                      color: i === 0 ? '#171C8F' : '#01044B',
                    },
                  ]}>
                  {label}
                </HText>
              </TouchableOpacity>
            );
          })}
        </View>
        <TouchableOpacity
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          style={styles.viewAll}>
          <HText style={styles.viewAllText}>View all</HText>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Open full vision, mission and philosophy"
        style={styles.stage}>
        <Animated.View
          style={{
            alignItems: 'center',
            opacity: fade,
            transform: [
              {
                translateY: fade.interpolate({
                  inputRange: [0, 1],
                  outputRange: [8, 0],
                }),
              },
            ],
          }}>
          <HText
            style={[styles.main, {fontSize: item.tab === 1 ? 13.5 : 15}]}
            numberOfLines={2}>
            {item.text}
          </HText>
          {!!item.sub && (
            <HText style={styles.sub} numberOfLines={1}>
              {item.sub}
            </HText>
          )}
        </Animated.View>
      </TouchableOpacity>

      <ValuesSheet visible={open} onClose={() => setOpen(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(23,28,143,0.1)',
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 6,
  },
  tabsRow: {flexDirection: 'row', alignItems: 'center'},
  tabs: {
    flex: 1,
    flexDirection: 'row',
    padding: 3,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  tab: {
    flex: 1,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabOn: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#01044B',
    shadowOpacity: 0.14,
    shadowRadius: 3,
    shadowOffset: {width: 0, height: 1},
    elevation: 1,
  },
  tabText: {fontSize: 12, fontWeight: '600', color: 'rgba(1,4,75,0.62)'},
  viewAll: {
    height: 32,
    paddingHorizontal: 10,
    justifyContent: 'center',
    marginLeft: 4,
  },
  viewAllText: {fontSize: 13, fontWeight: '600', color: '#171C8F'},
  stage: {minHeight: 58, justifyContent: 'center', paddingHorizontal: 4},
  main: {fontWeight: '700', lineHeight: 20, color: '#01044B', textAlign: 'center'},
  sub: {
    fontSize: 11.5,
    fontWeight: '600',
    lineHeight: 15,
    color: 'rgba(1,4,75,0.62)',
    marginTop: 2,
    textAlign: 'center',
  },

  sheetCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(23,28,143,0.1)',
    padding: 16,
  },
  block: {marginBottom: 20},
  visionTitle: {
    fontSize: 26,
    fontWeight: '300',
    letterSpacing: -0.5,
    color: '#171C8F',
    textAlign: 'center',
    marginBottom: 8,
  },
  visionLine: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
    color: '#01044B',
    textAlign: 'center',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#01044B',
    textAlign: 'center',
    marginBottom: 10,
  },
  missionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  missionNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#171C8F',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  missionNumText: {fontSize: 12, fontWeight: '700', color: '#FFFFFF'},
  missionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
    color: '#01044B',
  },
  philRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 10},
  philPill: {
    width: 140,
    minHeight: 56,
    borderRadius: 28,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  philTerm: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  philMeaning: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    color: '#01044B',
  },
});

export default ValuesStrip;
