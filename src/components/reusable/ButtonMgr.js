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
          backgroundColor: ThemeColor.Amber,
          shadowColor: ThemeColor.AmberDark,
          shadowOffset: {width: 0, height: 3},
          shadowOpacity: 0.35,
          shadowRadius: 6,
          elevation: 3,
        }, {...btnStyle}]}
        colors={[ThemeColor.Amber, ThemeColor.Amber, ThemeColor.Amber]}>
        <TouchableOpacity
          onPress={onPress}
          style={{
            width: '100%',
            paddingVertical: 10,
            alignItems: 'center',
            marginVertical: 5,
          }}>
          <Text
            style={[{fontSize: 16, fontWeight: '700', color: ThemeColor.OnAmber}, {...textStyle}] }
            
           >
            {title} 
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    )
}