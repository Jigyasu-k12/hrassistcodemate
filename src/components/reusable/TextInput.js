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


export default (props) =>{
    const {placeholder='',value}= props;

    return(
        <TextInput
        {...props}
        
        // placeholder={placeholder}
        // secureTextEntry={false}
        // onChangeText={handleChange('UserName')}
        // onBlur={handleBlur('UserName')}
        value={value}
        style={[{
          flex:1,
          color:'#01044B',
          fontSize:GlobalFontSize.Small,
          fontFamily:'Roboto-Regular',
          textAlign:'left',                           
        }, props.style]}
        placeholderTextColor={'rgba(1,4,75,0.62)'}
      />
    )
}