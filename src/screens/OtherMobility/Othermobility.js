//import libraries
import React, {Component,useContext} from 'react';
import {AppIcon} from '../../components/icons/AppIcon';
import {View, StyleSheet, TouchableOpacity, Image,SafeAreaView} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Header } from '../../components/reusable/Header';
import { ThemeGlobalColor as GlobalColor, ThemeColor, HomePalette } from '../../constants/Colors';
import { GlobalFontSize } from '../../constants/FontSize';
import Text from '../../components/reusable/Text';

import AuthContext from '../../context/AuthContext';

// create a component
const Othermobility = ({navigation}) => {

  const { authContext, AppUserData } = useContext(AuthContext);
   let usrAccess = AppUserData?.data?.userFlag;

  return (
    <SafeAreaView style={{ flex: 1, width: '100%', height: '100%' }}>
    <Header title={"Add-On Menu"}/>
    <View style={styles.container}>
      {/* Uniform Management */}
      <TouchableOpacity style={styles.box}
      onPress={() =>{navigation.navigate("UniformMgmt")}}>
        <View style={styles.iconBox}>
          <View
            style={{
              width: 45,
              height: 45,
              borderRadius: 14,
              backgroundColor: '#F5F5F5',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <AppIcon name="uniform" size={22} />
          </View>
        </View>
        <View style={styles.item}>
          <Text style={{fontSize:14}} Bold>
          Uniform Management
          </Text>
          <Ionicons name="chevron-forward-outline" color={'#171C8F'} size={18} />
        </View>
      </TouchableOpacity>

      {/* Hospitalization System */}
      <TouchableOpacity style={styles.box}
      onPress={() =>{navigation.navigate("HospitalizationSystem")}}>
        <View style={styles.iconBox}>
          <View
            style={{
              width: 45,
              height: 45,
              borderRadius: 14,
              backgroundColor: '#F5F5F5',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <AppIcon name="hospital" size={22} />
          </View>
        </View>
        <View style={styles.item}>
          <Text style={{fontSize:14}} Bold>
          Hospitalization System
          </Text>
          <Ionicons name="chevron-forward-outline" color={'#171C8F'} size={18} />
        </View>
      </TouchableOpacity>

    </View>
    </SafeAreaView>
  );
};

// define your styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingHorizontal:10
  },
  box: {
    flexDirection: 'row',
    marginTop: 20,
    width: '100%',
    paddingVertical: 10,
    alignSelf: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#01044B',
    shadowOffset: {
      width: -0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 5,
    borderRadius:5
  },
  iconBox: {
    width: '20%',
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  item: {
    width: '80%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
});

//make this component available to the app
export default Othermobility;