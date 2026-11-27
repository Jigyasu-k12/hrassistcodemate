import React from 'react';
import { TouchableOpacity, StyleSheet, Text } from 'react-native';
import { ThemeGlobalColor as GlobalColor, ThemeColor } from '../../constants/Colors';
import { GlobalFontSize } from '../../constants/FontSize';
export default props => <Text {...props} style={[{fontFamily: props.Bold ? 'Roboto-Bold': 'Roboto-Regular', fontSize: GlobalFontSize.P, color:GlobalColor.Text}, props.style]}>{props.children}</Text>