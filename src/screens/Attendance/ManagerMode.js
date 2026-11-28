//import liraries
import React, { Component, useState, useEffect, useContext } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Image,
  FlatList,
  SafeAreaView,
  Modal,
  Alert
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import SegmentedControlTab from 'react-native-segmented-control-tab';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import * as ApiService from '../../Utils/Utils';
import Toast from 'react-native-simple-toast'
import { useFocusEffect } from '@react-navigation/native';
import AuthContext from '../../context/AuthContext';
import moment from 'moment';
import Spinner from 'react-native-loading-spinner-overlay';
import { ThemeGlobalColor as GlobalColor, ThemeColor } from '../../constants/Colors';
import Text from '../../components/reusable/Text';
import { Header } from '../../components/reusable/Header';
import { GlobalFontSize } from '../../constants/FontSize';
import ListEmptyComponent from '../../components/reusable/ListEmptyComponent';
import TextInput from '../../components/reusable/TextInput';
import { LoadingScreen } from '../../components/reusable/LoadingScreen';
import ManagerFlexiShift from './managermode/ManagerFlexiShift';
import ManagerLeave from './managermode/ManagerLeave';
import ManagerTaxi from './managermode/ManagerTaxi';
import ManagerAttandance from './managermode/ManagerAttandance';
import ManagerRHTKGatePass from './managermode/ManagerRHTKGatePass'


const Tab = createMaterialTopTabNavigator();


const ManagerMode = ({ navigation }) => {
  return (
    <SafeAreaView style={{ flex: 1, width: '100%', height: '100%', backgroundColor: '#F5F5F5' }}>
      <Header title="Manager Mode" />
      <LinearGradient colors={['#171C8F','#171C8F','#171C8F',]} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.mystyl}>
        <View style={{flex:1,flexDirection:'row'}}>
      <Tab.Navigator
        swipeEnabled={false}
        screenOptions={{
          tabBarScrollEnabled: true,
          tabBarItemStyle: { paddingHorizontal:15, width:'auto' },
          tabBarLabelStyle: { fontSize: 13, fontWeight:'600'},
          tabBarActiveTintColor: ThemeColor.OnDark,
        tabBarInactiveTintColor: ThemeColor.OnDarkMuted,
          tabBarIndicatorStyle: { height: 4, borderRadius: 2, backgroundColor: '#FFFFFF' },
          tabBarStyle: { backgroundColor: 'rgba(255,255,255,0)', elevation: 0 },
        }}>
        <Tab.Screen name="Leave." component={ManagerLeave} />
        <Tab.Screen name="FlexiShift" component={ManagerFlexiShift} />
        <Tab.Screen name="Taxi" component={ManagerTaxi} />
        
        <Tab.Screen name="Attendance." component={ManagerAttandance} />
        <Tab.Screen name="GatePass(Rohtak)" component={ManagerRHTKGatePass} />
        
      </Tab.Navigator>
      </View>
      </LinearGradient>
      <TouchableOpacity style={styles.fullWidthButton}
        onPress={() => {
          navigation.goBack();
        }}>
        <Image source={require("./../../assets/Images/group.png")} style={{ width: 25, height: 25, tintColor: '#FFFFFF' }} />
        <Text style={styles.fullWidthButtonText} >
          Back to Employee Mode
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};








// define your styles
const styles = StyleSheet.create({

  Loadercontainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 10,
  },

  gradient: {
    padding: 20,
  },
  tabsContainerStyle: {
    marginTop: 10,
    borderRadius: 0,
    width: '100%',
  },
  tabStyle: {
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 0,
    borderColor: '#171C8F'
  },
  tabTextStyle: {
    fontSize: GlobalFontSize.P,
    color: 'rgba(1,4,75,0.62)',
    fontFamily: 'Roboto-Bold',
  },
  activeTabStyle: {
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 4,
    borderBottomColor: '#171C8F',
  },
  activeTabTextStyle: {
    color: '#171C8F',
  },
  reportHeader: {
    width: '100%',
    flexDirection: 'row',
    alignSelf: 'center',
    justifyContent: 'space-between',
    padding: 5,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    shadowColor: '#01044B',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 2.0,
    elevation: 5,
    borderRadius: 5,
  },
  reportStyle: {
    width: '100%',
    flexDirection: 'row',
    alignSelf: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#171C8F',
    shadowColor: '#01044B',
    shadowOffset: {
      width: -0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,

  },

  activeTabTextStyle: {
    color: '#171C8F',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center'
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
  FlatListData: {
    width: "100%",    
    flexDirection: 'row',
    alignSelf: 'center',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#01044B',
    shadowOffset: {
      width: -0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 5,
    borderRadius: 3,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: 'rgba(23,28,143,0.1)',
    marginTop: 10,
    padding: 10,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF'
  },
  spinnerTextStyle: {
    color: '#FFFFFF'
  },
  fullWidthButton: {
    backgroundColor: '#171C8F',
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  fullWidthButtonText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize:13
  },
  SearchInput: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#171C8F',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 7,
    backgroundColor: '#FFFFFF'
  },
  mystyl: {
        backgroundColor: 'rgba(255,255,255,0)',
        height:'83%',
        flexDirection: 'row',
      },

});

export default ManagerMode;
