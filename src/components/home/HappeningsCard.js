// "MSIL Happenings" — company banners presented as a stacked, swipeable card.
import React, {useEffect, useRef, useState} from 'react';
import {View, FlatList, Image, StyleSheet, Dimensions} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {P, HText, TYPE} from './homeTheme';
import HomeIcon from './HomeIcons';

const PAD = 16;
const STACK_OFFSET = 18; // room for the two layers peeking above the card

const Banner = ({uri, width, height}) => {
  const [failed, setFailed] = useState(false);
  return (
    <View style={{width, height, backgroundColor: '#171C8F'}}>
      {failed ? (
        <LinearGradient colors={['#171C8F', '#01044B']} style={styles.fallback}>
          <HomeIcon
            name="sparkle"
            size={36}
            color="rgba(255,255,255,0.45)"
            strokeWidth={1.4}
          />
          <HText style={styles.fallbackText}>Highlights will appear here</HText>
        </LinearGradient>
      ) : (
        <Image
          source={{uri}}
          style={{width, height}}
          resizeMode="cover"
          onError={() => setFailed(true)}
          accessibilityIgnoresInvertColors
        />
      )}
    </View>
  );
};

const HappeningsCard = ({images = [], active = true, reduceMotion = false}) => {
  const cardW = Dimensions.get('window').width - PAD * 2;
  const cardH = Math.round(cardW * 0.52);
  const [idx, setIdx] = useState(0);
  const listRef = useRef(null);
  const count = images.length;

  // Auto-advance; restarts after every manual swipe so it never fights the user
  useEffect(() => {
    if (!active || reduceMotion || count < 2) {
      return;
    }
    const t = setTimeout(() => {
      const next = (idx + 1) % count;
      listRef.current?.scrollToOffset({offset: next * cardW, animated: true});
      setIdx(next);
    }, 5000);
    return () => clearTimeout(t);
  }, [idx, active, reduceMotion, count, cardW]);

  if (!count) {
    return null;
  }

  return (
    <View>
      <View style={styles.head}>
        <View style={styles.titleRow}>
          <HomeIcon
            name="sparkle"
            size={18}
            color={'#171C8F'}
            strokeWidth={2}
          />
          <HText style={styles.title} accessibilityRole="header">
            MSIL Happenings
          </HText>
        </View>
        <View style={styles.countChip}>
          <HText style={styles.countText}>
            {count} highlight{count === 1 ? '' : 's'}
          </HText>
        </View>
      </View>

      <View style={{height: cardH + STACK_OFFSET}}>
        <View style={[styles.layer, styles.layerBack]} />
        <View style={[styles.layer, styles.layerMid]} />
        <View
          style={[
            styles.card,
            {top: STACK_OFFSET, width: cardW, height: cardH},
          ]}>
          <FlatList
            ref={listRef}
            data={images}
            keyExtractor={(u, i) => `${i}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={e =>
              setIdx(Math.round(e.nativeEvent.contentOffset.x / cardW))
            }
            getItemLayout={(_, i) => ({
              length: cardW,
              offset: cardW * i,
              index: i,
            })}
            renderItem={({item, index}) => (
              <View
                accessible
                accessibilityLabel={`Highlight ${index + 1} of ${count}`}>
                <Banner uri={item} width={cardW} height={cardH} />
              </View>
            )}
          />
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(255,255,255,0)', '#01044B']}
            style={styles.scrim}>
            <View style={styles.dots}>
              {images.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dotBase,
                    i === idx ? styles.dotOn : styles.dotOff,
                  ]}
                />
              ))}
            </View>
            <HText style={styles.pos}>
              {idx + 1} / {count}
            </HText>
          </LinearGradient>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleRow: {flexDirection: 'row', alignItems: 'center'},
  title: {...TYPE.title, color: '#01044B', marginLeft: 8},
  countChip: {
    height: 24,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
  },
  countText: {fontSize: 12, fontWeight: '700', color: '#171C8F'},
  layer: {position: 'absolute', height: 120, borderRadius: 18},
  layerBack: {
    left: 28,
    right: 28,
    top: 0,
    backgroundColor: '#171C8F',
    opacity: 0.45,
  },
  layerMid: {
    left: 14,
    right: 14,
    top: 8,
    backgroundColor: '#171C8F',
    opacity: 0.7,
  },
  card: {
    position: 'absolute',
    left: 0,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#171C8F',
    shadowColor: '#01044B',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 10},
    elevation: 6,
  },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 52,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  dots: {flexDirection: 'row', alignItems: 'center'},
  dotBase: {height: 6, borderRadius: 3, marginRight: 5},
  dotOn: {width: 20, backgroundColor: '#FFFFFF'},
  dotOff: {width: 6, backgroundColor: 'rgba(255,255,255,0.55)'},
  pos: {fontSize: 12, fontWeight: '600', color: '#FFFFFF'},
  fallback: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  fallbackText: {...TYPE.caption, color: 'rgba(255,255,255,0.7)', marginTop: 8},
});

export default HappeningsCard;
