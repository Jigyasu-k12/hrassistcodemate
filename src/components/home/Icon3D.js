// A small neumorphic icon tile used across Home and Manager actions.
// The 3D is built only from the four brand colours: white highlights,
// mist surfaces and low-opacity indigo/ink shadows.
import React from 'react';
import {View, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {AppIcon} from '../icons/AppIcon';

const Icon3D = ({
  name,
  size = 38,
  iconSize = 20,
  color = '#171C8F',
  strokeWidth = 2,
  dark = false,
  style,
}) => {
  const radius = Math.round(size * 0.32);
  return (
    <View
      style={[
        styles.wrap,
        {width: size, height: size, borderRadius: radius},
        dark ? styles.wrapDark : styles.wrapLight,
        style,
      ]}>
      <LinearGradient
        colors={
          dark
            ? ['rgba(255,255,255,0.30)', 'rgba(255,255,255,0.06)']
            : ['#FFFFFF', '#F5F5F5']
        }
        start={{x: 0.12, y: 0}}
        end={{x: 0.88, y: 1}}
        style={[styles.inner, {borderRadius: radius - 2}]}>
        <View
          style={[
            styles.sheen,
            {borderRadius: radius - 2, height: Math.round(size * 0.46)},
          ]}
        />
        <View
          style={[
            styles.innerShade,
            {borderRadius: radius - 2, height: Math.round(size * 0.34)},
          ]}
        />
        <AppIcon
          name={name}
          size={iconSize}
          color={color}
          strokeWidth={strokeWidth}
        />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#01044B',
    shadowOpacity: 0.22,
    shadowRadius: 5,
    shadowOffset: {width: 0, height: 3},
    elevation: 4,
  },
  wrapLight: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
  },
  wrapDark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  inner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sheen: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: 'rgba(255,255,255,0.52)',
  },
  innerShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(23,28,143,0.07)',
  },
});

export default Icon3D;
