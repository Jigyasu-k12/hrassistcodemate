import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { GlobalFontSize } from '../../constants/FontSize';
import { ThemeGlobalColor as GlobalColor, ThemeColor } from '../../constants/Colors';
import LinearGradient from 'react-native-linear-gradient';
import Text from './Text';


export default (props) =>{
    const {title ='Save', btnStyle, textStyle, onPress}= props;
    return(
    <LinearGradient
        style={[{
          margin: 5,
          borderRadius: 28,
          width: '100%',
          alignSelf: 'center',
          backgroundColor: '#FCBE62',
          shadowColor: '#01044B',
          shadowOffset: {width: 0, height: 3},
          shadowOpacity: 0.35,
          shadowRadius: 6,
          elevation: 3,
        }, {...btnStyle}]}
        colors={['#FCBE62', '#FCBE62', '#FCBE62']}>
        <TouchableOpacity
          onPress={onPress}
          style={{
            width: '100%',
            paddingVertical: 10,
            alignItems: 'center',
            marginVertical: 5,
          }}>
          <Text
            style={[{fontSize: 16, fontWeight: '700', color: '#01044B'}, {...textStyle}]}
            >
            {title}
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    )
}