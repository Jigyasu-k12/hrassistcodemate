//import liraries
import React, {useState, useEffect, useContext} from 'react';
import {
  View,
  StyleSheet,
  Image,
  ScrollView,
  TextInput,
  useWindowDimensions,
  Alert,
  SafeAreaView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import {TabView, SceneMap, TabBar} from 'react-native-tab-view';

import {TouchableOpacity} from 'react-native-gesture-handler';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import { ThemeGlobalColor as GlobalColor, ThemeColor } from '../../constants/Colors';
import {GlobalFontSize} from '../../constants/FontSize';
import {Header} from './../../components/reusable/Header';
import Text from '../../components/reusable/Text';
import AuthContext from '../../context/AuthContext';
import InitTaxiReq from './InitTaxiReq';
import BusinessTravelHome from './BusinessTravelHome';
import MergeTripReq from './MergeTripReq';
import TaxiReportHome from './TaxiReportHome';

const Tab = createMaterialTopTabNavigator();

const BusinessTravelMain = ({navigation}) => {
  const [route, setroute] = useState('Attendance');
   const [horizental, setHorizental] = useState(false);

   const {authContext, AppUserData} = useContext(AuthContext);
   let usrAccess = AppUserData?.data?.userFlag;

  //  console.log("User Flag is ", usrAccess);

  const tabBarListeners = ({navigation, route}) => ({
    tabPress: () => {
      setHorizental(false);
      setroute(route.name);
      // console.log(navigation, route);
    },
  });

  return (
    <SafeAreaView style={{flex: 1, width: '100%', position: 'relative'}}>
      <LinearGradient
       colors={[ThemeColor.Teal, ThemeColor.Teal, ThemeColor.Teal]}
       start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.container}>
        <View style={{flex: 1, flexDirection: 'row'}}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              width: 40,
              alignItems: 'center',
            }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                width: 40,
                alignItems: 'center',
              }}>
              <Ionicons
                name="chevron-back-outline"
                size={25}
                color={'white'}
                onPress={() => navigation.goBack()}
              />
              <Ionicons
                name="menu-outline"
                size={20}
                color={'white'}
                onPress={() => navigation.openDrawer()}
              />
            </View>
          </View>

          <Text
            Bold
            style={{
              color: '#fff',
              fontSize: GlobalFontSize.H4,
              marginLeft: 15,
            }}>
            Taxi Booking
          </Text>
        </View>

        
      </LinearGradient>

      

      <LinearGradient  colors={[ThemeColor.Teal, ThemeColor.Teal, ThemeColor.Teal]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.mystyl}   > 
      <View style={{flex: 1, flexDirection: 'row'}}>
        <Tab.Navigator
          swipeEnabled={false}
          screenOptions={{
            tabBarScrollEnabled: true,
            tabBarLabelStyle: {
              fontSize: 13,
              fontWeight: '700',
            },
            tabBarActiveTintColor: ThemeColor.OnDark,
          tabBarInactiveTintColor: ThemeColor.OnDarkMuted,
            tabBarItemStyle: {paddingHorizontal: 15, width: 'auto'},

             tabBarIndicatorStyle: { height: 4, borderRadius: 2, backgroundColor: ThemeColor.Amber },
            tabBarStyle: {backgroundColor: 'transparent', elevation: 0},
          }}>
          <Tab.Screen
            name="Initiate Request"
            component={InitTaxiReq}
            listeners={tabBarListeners}
          />
          <Tab.Screen
            name="Merge Request"
            component={MergeTripReq}
            listeners={tabBarListeners}
          />
          <Tab.Screen
            name="Report"
            component={TaxiReportHome}
            listeners={tabBarListeners}
          />
         
         
        </Tab.Navigator>
      </View>
      </LinearGradient>

    
    </SafeAreaView>
  );
};

// define your styles
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 20,
    padding: 10,
  },

  containermy: {
    paddingVertical: 20,
    padding: 10,
  },

  fullWidthButton: {
    backgroundColor: ThemeColor.Teal,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidthButtonText: {
    color: GlobalColor.White,
    marginLeft: 8,
    fontSize:13
  },
  addtnlBtn: {
    // position:'absolute',
    // right:10,
    // top:5,
    zIndex: 55555555,
  },
  mystyl: {
    backgroundColor: 'transparent',
    height:'83%',
    flexDirection: 'row',
  },
});

export default BusinessTravelMain;
