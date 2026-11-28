// The manager Home hero: a calm, high-contrast entry point into the
// manager toolkit. It replaces the employee-only sections on Manager Home.
import React from 'react';
import {View, Pressable, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {HText, TYPE} from './homeTheme';
import {AppIcon} from '../icons/AppIcon';
import Icon3D from './Icon3D';

const ManagerCommandCard = ({onOpenTools}) => {
  return (
    <LinearGradient
      colors={['#171C8F', '#01044B']}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.card}>
      <View style={styles.halo} />
      <View style={styles.ring} />
      <View style={styles.ringSmall} />

      <View style={styles.kickerRow}>
        <View style={styles.kickerDot} />
        <HText style={styles.kicker}>MANAGER MODE</HText>
      </View>

      <HText style={styles.title}>Your team, in one place</HText>
      <HText style={styles.sub}>
        Approvals, attendance, leave and travel — ready when you are.
      </HText>

      <View style={styles.iconRow}>
        <Icon3D
          dark
          name="approve"
          size={42}
          iconSize={22}
          color="#FFFFFF"
          style={styles.icon}
        />
        <Icon3D
          dark
          name="teamAtt"
          size={42}
          iconSize={22}
          color="#FFFFFF"
          style={styles.icon}
        />
        <Icon3D
          dark
          name="taxi"
          size={42}
          iconSize={22}
          color="#FFFFFF"
          style={styles.iconLast}
        />
      </View>

      <Pressable
        onPress={onOpenTools}
        accessibilityRole="button"
        accessibilityLabel="Open manager tools"
        style={({pressed}) => [styles.cta, pressed && styles.ctaPressed]}>
        <HText style={styles.ctaText}>Open manager tools</HText>
        <AppIcon name="arrowRight" size={16} color="#01044B" strokeWidth={2.2} />
      </Pressable>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 18,
    overflow: 'hidden',
    backgroundColor: '#171C8F',
    shadowColor: '#01044B',
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: {width: 0, height: 10},
    elevation: 7,
  },
  halo: {
    position: 'absolute',
    right: -58,
    top: -74,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  ring: {
    position: 'absolute',
    right: -18,
    top: -34,
    width: 136,
    height: 136,
    borderRadius: 68,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  ringSmall: {
    position: 'absolute',
    right: 18,
    top: 16,
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  kickerRow: {flexDirection: 'row', alignItems: 'center'},
  kickerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginRight: 7,
  },
  kicker: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.14,
    color: 'rgba(255,255,255,0.72)',
  },
  title: {
    ...TYPE.display,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 10,
  },
  sub: {
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(255,255,255,0.72)',
    marginTop: 6,
    maxWidth: 270,
  },
  iconRow: {flexDirection: 'row', alignItems: 'center', marginTop: 16},
  icon: {marginRight: 10},
  iconLast: {marginRight: 0},
  cta: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#01044B',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 5},
    elevation: 4,
  },
  ctaPressed: {transform: [{scale: 0.985}]},
  ctaText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#01044B',
    marginRight: 6,
  },
});

export default ManagerCommandCard;
