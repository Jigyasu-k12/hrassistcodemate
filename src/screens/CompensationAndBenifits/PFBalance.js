//import libraries
import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import PFWithdrawal from './PFWithdrawal';
import PFReport from './PFReport';
import { ThemeGlobalColor as GlobalColor, ThemeColor } from '../../constants/Colors';
import { GlobalFontSize } from '../../constants/FontSize';
import Text from '../../components/reusable/Text';
import AuthContext from '../../context/AuthContext';
import * as ApiService from '../../Utils/Utils';
import { LoadingScreen } from '../../components/reusable/LoadingScreen';

const Tab = createMaterialTopTabNavigator();

const PFBalance = ({ navigation }) => {
  const [route, setRoute] = useState("PF Withdrawal");
  const { authContext, AppUserData } = useContext(AuthContext);

  // ---------- Screen Open Configuration ----------
  const [isPFEnabled, setIsPFEnabled] = useState(false);
  const [screenConfigLoader, setScreenConfigLoader] = useState(true);

  const tabBarListeners = ({ navigation, route }) => ({
    tabPress: () => {
      setRoute(route.name);
    },
  });

  // ---------- Check if PF screen should be shown ----------
  const checkPFScreenOpen = async () => {
    setScreenConfigLoader(true);
    try {
      let result = await ApiService.PostMethode('/GetLOVM', {
        "SystemName": "PFAUTOMATION",
        "ReportName": "HR-ASSIST",
        "LOVName": "SCREEN_OPEN",
        "LOVCode": "",
        "UserName": AppUserData?.data?.userId
      }, AppUserData.token, authContext);

      setScreenConfigLoader(false);

      if (result.Value && result.Value.length > 0) {
        const screenConfig = result.Value.find(item => item.LOVM_LOV_NAME === 'SCREEN_OPEN');
        if (screenConfig && screenConfig.LOVM_VALUE_CODE === 'Y') {
          setIsPFEnabled(true);
        } else {
          setIsPFEnabled(false);
        }
      } else {
        setIsPFEnabled(false);
      }
    } catch (error) {
      setScreenConfigLoader(false);
      setIsPFEnabled(false);
      ApiService.showErrorMessage(error, authContext);
    }
  };

  useEffect(() => {
    checkPFScreenOpen();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, width: '100%', position: 'relative' }}>
      <LinearGradient
        colors={['#171C8F', '#171C8F', '#171C8F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.container}>
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              width: 40,
              alignItems: 'center',
            }}>
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
          </View>

          <Text
            Bold
            style={{
              color: '#FFFFFF',
              fontSize: GlobalFontSize.H4,
              marginLeft: 15,
            }}>
            Bhavishya Sanchaya (PF)
          </Text>
        </View>
      </LinearGradient>

      <LinearGradient
        colors={['#171C8F', '#171C8F', '#171C8F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.mystyl}>
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <Tab.Navigator
            swipeEnabled={false}
            screenOptions={{
              tabBarScrollEnabled: true,
              tabBarLabelStyle: { fontSize: 13, fontWeight: '700' },
              tabBarActiveTintColor: '#fff',
              tabBarItemStyle: { paddingHorizontal: 15, width: 'auto' },
              tabBarIndicatorStyle: { borderBottomWidth: 5, borderBottomColor: 'rgba(255,255,255,0.22)' },
              tabBarStyle: { backgroundColor: 'rgba(255,255,255,0)', elevation: 0 },
              tabBarAllowFontScaling: false,
            }}>
            <Tab.Screen name="PF Withdrawal" component={PFWithdrawal} listeners={tabBarListeners} />
            {!screenConfigLoader && isPFEnabled && (
              <Tab.Screen name="Activity Log" component={PFReport} listeners={tabBarListeners} />
            )}
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
  mystyl: {
    backgroundColor: 'rgba(255,255,255,0)',
    height: '83%',
    flexDirection: 'row',
  },
});

export default PFBalance;