//import liraries
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  useWindowDimensions,
  SafeAreaView
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';

import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { GlobalFontSize } from '../../constants/FontSize';
import { ThemeGlobalColor as GlobalColor, ThemeColor } from '../../constants/Colors';
import Text from '../../components/reusable/Text';
import { Header } from '../../components/reusable/Header';
import CreateRequestRhtk from './CreateRequestRhtk';
import ViewRequestRhtk from './ViewRequestRhtk';
import RohtakGatePass from './RohtakGatePass'
import ViewRequestVSDT from './ViewRequestVSDT';


const Tab = createMaterialTopTabNavigator();
const RohtakVisitorHome = ({ navigation, route }) => {

  return (
    <SafeAreaView style={{ flex: 1, width: '100%', height: '100%' }}>
      <Header title="Visitor Gatepass(Rohtak)"/>
      <LinearGradient  colors={['#171C8F', '#171C8F', '#171C8F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.mystyl}   > 
      <View style={{flex: 1, flexDirection: 'row'}}>
      <Tab.Navigator
        swipeEnabled={false}
        
        screenOptions={{
          tabBarScrollEnabled: true,
          tabBarItemStyle: { paddingHorizontal:10, width:'auto' },
          tabBarLabelStyle: { fontSize: GlobalFontSize.TabTitle, fontWeight:'700'},
          tabBarActiveTintColor: '#fff',
          tabBarIndicatorStyle: { borderBottomWidth: 5, borderBottomColor: 'rgba(255,255,255,0.22)' },
          tabBarStyle: { backgroundColor: 'rgba(255,255,255,0)', elevation: 0 },
        }}>
        <Tab.Screen name="Create Request" component={RohtakGatePass}  />
        <Tab.Screen name="View Request" component={ViewRequestVSDT}  />
      
      </Tab.Navigator>
      </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

// define your styles
const styles = StyleSheet.create({
  gradient: {
    padding: 20,
    elevation: 0
  },
  container: {
    flexDirection: 'row',
  },
  searchSection: {
    top: 10,
    width: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(23,28,143,0.1)',
    borderRadius: 7,
  },
  searchIcon: {
    padding: 10,
  },
  input: {
    width: '77%',
    paddingTop: 10,
    paddingRight: 10,
    paddingBottom: 10,
    paddingLeft: 0,
    backgroundColor: '#FFFFFF',
    color: 'rgba(1,4,75,0.62)',
  },
  mystyl: {
    backgroundColor: 'rgba(255,255,255,0)',
    height:'100%',
    flexDirection: 'row',
  },
});

// //make this component available to the app
export default RohtakVisitorHome;