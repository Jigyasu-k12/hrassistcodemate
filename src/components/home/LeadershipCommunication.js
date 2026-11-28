// Leadership communication — a quiet, horizontal shelf of messages from the
// MSIL leadership team. Replaces the old history timeline on Home.
import React, {useState} from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
  Modal,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Video from 'react-native-video';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {HText, TYPE} from './homeTheme';
import {AppIcon} from '../icons/AppIcon';
import Icon3D from './Icon3D';

const VIDEO = require('../../assets/Images/MSIL_Operating_System.mp4');
const GAP = 12;
const W = Dimensions.get('window').width;
const CARD_W = Math.min(302, Math.round(W * 0.76));

const CARDS = [
  {
    id: 'safety',
    title: 'Safety Week 2026',
    sub: 'A message from leadership',
    dur: '0:32',
    icon: 'vigilance',
    tint: ['#171C8F', '#171C8F'],
    start: {x: 0, y: 0},
    end: {x: 1, y: 1},
  },
  {
    id: 'plant',
    title: 'Inside our plant',
    sub: 'How a car comes to life',
    dur: '0:40',
    icon: 'teamAtt',
    tint: ['#171C8F', '#01044B'],
    start: {x: 1, y: 0},
    end: {x: 0, y: 1},
  },
  {
    id: 'festive',
    title: 'Festive season at MSIL',
    sub: 'Celebrations across our sites',
    dur: '0:24',
    icon: 'sparkle',
    tint: ['#01044B', '#171C8F'],
    start: {x: 0, y: 1},
    end: {x: 1, y: 0},
  },
];

const LeadershipCard = ({card, onPress}) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={`Play ${card.title}, ${card.sub}, ${card.dur}`}
    style={({pressed}) => [
      styles.card,
      {width: CARD_W},
      pressed && styles.cardPressed,
    ]}>
    <LinearGradient
      colors={card.tint}
      start={card.start}
      end={card.end}
      style={StyleSheet.absoluteFill}
    />
    <View style={styles.cardHalo} />
    <View style={styles.cardRing} />

    <View style={styles.cardTop}>
      <Icon3D
        dark
        name={card.icon}
        size={42}
        iconSize={22}
        color="#FFFFFF"
        strokeWidth={1.9}
      />
      <View style={styles.duration}>
        <HText style={styles.durationText}>{card.dur}</HText>
      </View>
    </View>

    <View style={styles.cardCopy}>
      <HText style={styles.cardTitle} numberOfLines={2}>
        {card.title}
      </HText>
      <HText style={styles.cardSub} numberOfLines={1}>
        {card.sub}
      </HText>
    </View>

    <View style={styles.watchRow}>
      <View style={styles.playCircle}>
        <AppIcon name="play" size={13} color="#01044B" />
      </View>
      <HText style={styles.watchText}>Watch</HText>
    </View>
  </Pressable>
);

const LeadershipCommunication = () => {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState(null);
  const [paused, setPaused] = useState(false);

  const open = card => {
    setPaused(false);
    setSelected(card);
  };
  const close = () => {
    setPaused(true);
    setSelected(null);
  };

  return (
    <View>
      <View style={styles.head}>
        <View style={styles.headCopy}>
          <HText style={styles.title} accessibilityRole="header">
            Leadership communication
          </HText>
          <HText style={styles.sub}>Messages from the MSIL leadership team</HText>
        </View>
        <View style={styles.count}>
          <HText style={styles.countText}>{CARDS.length} videos</HText>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={CARD_W + GAP}
        snapToAlignment="start"
        style={styles.shelfScroll}
        contentContainerStyle={styles.shelf}>
        {CARDS.map((card, i) => (
          <View
            key={card.id}
            style={{marginRight: i === CARDS.length - 1 ? 0 : GAP}}>
            <LeadershipCard card={card} onPress={() => open(card)} />
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={!!selected}
        animationType="fade"
        onRequestClose={close}
        statusBarTranslucent>
        <View style={styles.playerRoot}>
          <StatusBar barStyle="light-content" backgroundColor="#01044B" />
          <View style={[styles.playerHead, {paddingTop: insets.top + 8}]}>
            <View style={styles.playerHeadCopy}>
              <HText style={styles.playerKicker}>LEADERSHIP</HText>
              <HText style={styles.playerTitle} numberOfLines={1}>
                {selected?.title || ''}
              </HText>
              <HText style={styles.playerSub} numberOfLines={1}>
                {selected?.sub || ''}
              </HText>
            </View>
            <Pressable
              onPress={close}
              accessibilityRole="button"
              accessibilityLabel="Close video"
              style={styles.closeBtn}>
              <AppIcon name="close" size={18} color="#FFFFFF" strokeWidth={2.2} />
            </Pressable>
          </View>

          <Pressable
            style={styles.stage}
            onPress={() => setPaused(p => !p)}
            accessibilityRole="button"
            accessibilityLabel={paused ? 'Play video' : 'Pause video'}>
            <Video
              key={selected?.id || 'leadership'}
              source={VIDEO}
              style={StyleSheet.absoluteFill}
              resizeMode="contain"
              paused={paused || !selected}
              repeat={false}
              onEnd={() => setPaused(true)}
            />
            {paused && (
              <View style={styles.bigPlay}>
                <AppIcon name="play" size={26} color="#01044B" />
              </View>
            )}
          </Pressable>

          <View style={[styles.playerFoot, {paddingBottom: insets.bottom + 18}]}>
            <View style={styles.playerFootRule} />
            <HText style={styles.playerFootText}>
              MSIL leadership communication
            </HText>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headCopy: {flex: 1, minWidth: 0, marginRight: 10},
  title: {...TYPE.title, color: '#01044B'},
  sub: {
    fontSize: 12.5,
    lineHeight: 17,
    color: 'rgba(1,4,75,0.62)',
    marginTop: 3,
  },
  count: {
    height: 26,
    paddingHorizontal: 10,
    borderRadius: 13,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {fontSize: 11.5, fontWeight: '700', color: '#171C8F'},
  shelfScroll: {marginHorizontal: -16},
  shelf: {paddingHorizontal: 16, paddingBottom: 2},
  card: {
    height: 196,
    borderRadius: 22,
    overflow: 'hidden',
    padding: 15,
    justifyContent: 'space-between',
    backgroundColor: '#171C8F',
    shadowColor: '#01044B',
    shadowOpacity: 0.24,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 8},
    elevation: 6,
  },
  cardPressed: {transform: [{scale: 0.985}]},
  cardHalo: {
    position: 'absolute',
    right: -34,
    top: -48,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  cardRing: {
    position: 'absolute',
    right: 16,
    bottom: 18,
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  duration: {
    height: 22,
    paddingHorizontal: 8,
    borderRadius: 11,
    backgroundColor: 'rgba(1,4,75,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationText: {fontSize: 10.5, fontWeight: '700', color: '#FFFFFF'},
  cardCopy: {marginTop: 12},
  cardTitle: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    letterSpacing: -0.2,
    color: '#FFFFFF',
  },
  cardSub: {
    fontSize: 12.5,
    lineHeight: 17,
    color: 'rgba(255,255,255,0.72)',
    marginTop: 4,
  },
  watchRow: {flexDirection: 'row', alignItems: 'center', marginTop: 12},
  playCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#01044B',
    shadowOpacity: 0.28,
    shadowRadius: 5,
    shadowOffset: {width: 0, height: 3},
    elevation: 4,
    paddingLeft: 2,
  },
  watchText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.78)',
    marginLeft: 8,
  },
  playerRoot: {flex: 1, backgroundColor: '#01044B'},
  playerHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  playerHeadCopy: {flex: 1, minWidth: 0, marginRight: 12},
  playerKicker: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.14,
    color: 'rgba(255,255,255,0.6)',
  },
  playerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 3,
  },
  playerSub: {
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.72)',
    marginTop: 2,
  },
  closeBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stage: {flex: 1, backgroundColor: '#01044B'},
  bigPlay: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 68,
    height: 68,
    marginLeft: -34,
    marginTop: -34,
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4,
    shadowColor: '#01044B',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: {width: 0, height: 8},
    elevation: 8,
  },
  playerFoot: {paddingHorizontal: 16, paddingTop: 12},
  playerFootRule: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.14)',
    marginBottom: 10,
  },
  playerFootText: {
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.6)',
  },
});

export default LeadershipCommunication;
