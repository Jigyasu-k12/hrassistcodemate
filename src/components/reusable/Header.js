import React, { Component } from "react";
import {AppIcon} from '../icons/AppIcon';
import { View, ActivityIndicator, TouchableOpacity, Image } from "react-native";
import { ThemeGlobalColor as GlobalColor, ThemeColor } from '../../constants/Colors';
import { GlobalFontSize } from "../../constants/FontSize";
import Text from './Text';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
// import { scale, verticalScale, moderateScale } from 'react-native-size-matters';


export const Header = ({back=false, title="", onPress }) =>  { 
    const navigation = useNavigation();
    
    
    return (
        <LinearGradient colors={['#171C8F', '#171C8F', '#01044B']}
               start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.container}>
            <View style={{ flex:1,flexDirection:'row' }}>            
                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        width: 40,
                        alignItems: 'center',
                    }}>
                    {back ? (
                        <Ionicons
                        name="chevron-back-outline"
                        size={25}
                        color={'#FFFFFF'}
                        onPress={() => navigation.goBack()}
                    />
                    ): (
                        <View style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                width: 40,
                                alignItems: 'center',
                            }}>
                            <Ionicons
                                name="chevron-back-outline"
                                size={25}
                                color={'#FFFFFF'}
                                onPress={() => navigation.goBack()}
                            />
                            <Ionicons
                                name="menu-outline"
                                size={20}
                                color={'#FFFFFF'}
                                onPress={() => navigation.openDrawer()}
                            />
                        </View>
                    )}
                </View>

                <Text
                Bold
                style={{
                    color: '#FFFFFF',
                    fontSize: GlobalFontSize.H4,
                    marginLeft: 15,
                }}>
                {title}
                </Text>
            </View>
            
            {onPress?(
            <TouchableOpacity 
                style={{alignSelf:'flex-end'}}>                
              <AppIcon name="settings" size={26} color={'#FFFFFF'} />
            </TouchableOpacity>
            ): null}
        </LinearGradient>
    );
}

const styles = {
    container: {
        flexDirection: 'row',
        paddingVertical: 20,
        padding: 10,
    }
};