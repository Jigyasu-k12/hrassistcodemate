import React, { useContext, useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions, Image } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Entypo';
import Material from 'react-native-vector-icons/MaterialIcons';
import { AppIcon } from '../components/icons/AppIcon';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeGlobalColor as GlobalColor, ThemeColor, HomePalette } from '../constants/Colors';
import { ModePortal, tick } from '../components/home/ModeSwitch';
import HomeTabBar from './HomeTabBar';
import { GlobalFontSize } from '../constants/FontSize';
import ManagerFlexiShift from '../screens/Attendance/managermode/ManagerFlexiShift';
import ManagerLeave from '../screens/Attendance/managermode/ManagerLeave';
import ManagerTaxi from '../screens/Attendance/managermode/ManagerTaxi';
import ManagerAttandance from '../screens/Attendance/managermode/ManagerAttandance';
import ManagerRHTKGatePass from '../screens/Attendance/managermode/ManagerRHTKGatePass';
import Home from '../screens/Home';
import HomeM from '../screens/HomeM';
import AttendanceAdminNav from './AttendanceAdminNav';
import GatePassNavigator from './GatePassNavigator';
import AuthContext from '../context/AuthContext';
import HospitalNavs from './HospitalNavigator';
import EmployeeNavs from './EmployeeNavs';
import CompensationBenifitsNav from './CompensationBenifitsNav';
import CanteeNavigator from './CanteeNavigator';
import BusinessNavigator from './BusinessNavigator';
import OtherApps from '../screens/OtherApps';
import FoodCount from '../screens/Canteen/FoodCount';
import { useNavigation } from '@react-navigation/native';
import { useNavigationState } from '@react-navigation/native';
import ManagerAttandancePercentage from '../screens/Attendance/managermode/ManagerAttandancePercentage';
import ManagerTaxiApproval from '../screens/Attendance/managermode/ManagerTaxiApproval';
import { useFocusEffect } from '@react-navigation/native';
import moment from 'moment';
import { useCallback } from 'react';
import * as ApiService from '../Utils/Utils';
import ExtraHoursApproval from '../screens/Attendance/managermode/ExtraHoursApproval';
import OtherMobilityNavigator from './OtherMobilityNavigator';
import AIChat from '../screens/AIChat';
import HospitalApproval from '../screens/Attendance/managermode/HospitalApproval';


const { width, height } = Dimensions.get('window');


const Tab = createBottomTabNavigator();

const TOOLTIP_SHOWN_KEY = '@ai_tooltip_shown';


function Tabs() {
  const navigation = useNavigation();
  const navigationState = useNavigationState((state) => state);


  const lastEmployeeRoute = useRef(null);
  const lastManagerRoute = useRef(null);


  const { AppUserData } = useContext(AuthContext);


  const [isManagerMode, setIsManagerMode] = useState(false);
  // Token flips the moment it's tapped; the screen swaps once the portal covers it.
  const [tokenManager, setTokenManager] = useState(false);
  const portalRef = useRef(null);
  const tokenRef = useRef(null);
  const switching = useRef(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showAIButton, setShowAIButton] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);


  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const tooltipAnim = useRef(new Animated.Value(0)).current;
  const arrowBounceAnim = useRef(new Animated.Value(0)).current;


  const initialLoading = async () => {
    // AI Chatbot is not in use currently — access check disabled.
    // await checkAIAccess();
  };


  useFocusEffect(
    useCallback(() => {
      let isActive = true;


      const loadData = async () => {
        if (isActive) {
          await initialLoading();
        }
      };


      loadData();


      return () => {
        isActive = false;
      };
    }, [])
  );


  useEffect(() => {
    const checkTooltipStatus = async () => {
      if (showAIButton && !isChatOpen) {
        try {
          const tooltipShown = await AsyncStorage.getItem(TOOLTIP_SHOWN_KEY);
         
          if (!tooltipShown) {
            // Tooltip has never been shown, show it now
            setTimeout(() => {
              setShowTooltip(true);
              Animated.spring(tooltipAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
              }).start();


              Animated.loop(
                Animated.sequence([
                  Animated.timing(arrowBounceAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                  }),
                  Animated.timing(arrowBounceAnim, {
                    toValue: 0,
                    duration: 800,
                    useNativeDriver: true,
                  }),
                ])
              ).start();
            }, 1000);
          }
        } catch (error) {
          console.log('Error checking tooltip status:', error);
        }
      }
    };

    checkTooltipStatus();
  }, [showAIButton, isChatOpen]);


  const checkAIAccess = async () => {
    let userId = AppUserData?.data?.userId;
    let token = AppUserData?.token;


    let apiData = {
      EmplID: userId,
      ConsentID: "777",
    };


    try {
      setIsCheckingAccess(true);
      const result = await ApiService.PostMethode(
        '/CheckAIAccess',
        apiData,
        token,
        AuthContext
      );
     
      const hasAccess = !result?.Value || result?.Value === "";
      setShowAIButton(hasAccess);
      setIsCheckingAccess(false);
    } catch (error) {
      setIsCheckingAccess(false);
      setShowAIButton(false);
      ApiService.showErrorMessage(error, AuthContext);
    }
  };


  // Employee ⇄ Manager. Same route memory + reset as before; the swap now
  // happens while the ModePortal covers the screen.
  const flipToggle = () => {
    if (switching.current) {
      return;
    }
    switching.current = true;

    const currentRoute = navigationState.routes[navigationState.index];

    if (isManagerMode) {
      lastManagerRoute.current = currentRoute;
    } else {
      lastEmployeeRoute.current = currentRoute;
    }

    const nextValue = !isManagerMode;
    tick();
    setTokenManager(nextValue);

    const play = origin =>
      portalRef.current
        ? portalRef.current.play({
            toManager: nextValue,
            origin,
            onCovered: () => {
              setIsManagerMode(nextValue);
              const targetRoute = nextValue ? lastManagerRoute.current : lastEmployeeRoute.current;
              if (targetRoute) {
                navigation.reset({
                  index: 0,
                  routes: [{ name: targetRoute.name, params: targetRoute.params }],
                });
              } else {
                navigation.navigate('Home');
              }
            },
            onDone: () => {
              switching.current = false;
            },
          })
        : null;

    const node = tokenRef.current;
    if (node && node.measureInWindow) {
      node.measureInWindow((x, y, w, h) => play(w ? { x: x + w / 2, y: y + h / 2 } : null));
    } else {
      play(null);
    }
  };


  const handleChatPress = async () => {
    setShowTooltip(false);
   
    // Mark tooltip as shown when user opens the chat
    try {
      await AsyncStorage.setItem(TOOLTIP_SHOWN_KEY, 'true');
    } catch (error) {
      console.log('Error saving tooltip status:', error);
    }
   
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();


    setIsChatOpen(true);
  };


  const handleCloseChat = () => {
    setIsChatOpen(false);
  };


  const handleDismissTooltip = async () => {
    // Mark tooltip as shown when user dismisses it
    try {
      await AsyncStorage.setItem(TOOLTIP_SHOWN_KEY, 'true');
    } catch (error) {
      console.log('Error saving tooltip status:', error);
    }
   
    Animated.timing(tooltipAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowTooltip(false);
    });
  };


  const rotateY = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });


  const arrowTranslateY = arrowBounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 10],
  });


  let usrAccess = AppUserData?.data?.userFlag;


  const AIWorldTabButton = ({ color, size }) => (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <View style={styles.aiTabButton}>
        <Image
          source={require('../assets/Images/chatbot_header.gif')}
          style={styles.aiTabGif}
          resizeMode="contain"
        />
      </View>
    </Animated.View>
  );


  const AITooltip = () => {
    if (!showTooltip || !showAIButton) return null;


    return (
      <Animated.View
        style={[
          styles.tooltipContainer,
          {
            opacity: tooltipAnim,
            transform: [
              {
                translateY: tooltipAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
              {
                scale: tooltipAnim,
              },
            ],
          },
        ]}
      >
        <TouchableOpacity activeOpacity={1} onPress={handleDismissTooltip}>
          <View style={styles.tooltipBubble}>
            <LinearGradient
              colors={[ThemeColor.TealLight, ThemeColor.TealSoft]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.tooltipGradient}
            >
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NEW</Text>
              </View>
             
              <Text style={styles.tooltipTitle}>New AI Era! 🚀</Text>
              <View style={styles.tooltipDivider} />
              <Text style={styles.tooltipSubtitle}>AI Chatbot</Text>
              <View style={styles.tooltipDivider} />
              <Text style={styles.tooltipDescription}>
                Tap here to enter the AI world.{'\n'}
                Get instant help, answers, and{'\n'}
                smart assistance powered by AI! ✨
              </Text>
            </LinearGradient>
          </View>


          {/* Arrow pointing to button */}
          <Animated.View
            style={[
              styles.arrowContainer,
              {
                transform: [{ translateY: arrowTranslateY }],
              },
            ]}
          >
            <View style={styles.arrowBorder}>
              <MaterialCommunityIcons
                name="arrow-down"
                size={40}
                color={ThemeColor.Teal}
              />
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    );
  };


  return (
    <>
      <Tab.Navigator
        screenOptions={{ headerShown: false }}
        // Custom bar: Home · Quick dials · [role token] · People · Profile
        tabBar={props => (
          <HomeTabBar
            {...props}
            isManager={isManagerMode}
            tokenManager={tokenManager}
            tokenRef={tokenRef}
            onToggle={flipToggle}
          />
        )}
      >
        <Tab.Screen
          name="Home"
          component={isManagerMode ? HomeM : Home}
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({ color, size }) => <AppIcon name="home" color={color} size={size} strokeWidth={2} />,
          }}
        />


        {/* Role token now lives in HomeTabBar (no placeholder tab needed) */}


        {/* AI Chatbot tab — not in use currently (restore with the access check above)
        {!isCheckingAccess && (
          showAIButton ? (
            <Tab.Screen
              name="AI Chatbot"
              component={() => null}
              options={{
                tabBarLabel: 'AI Chatbot',
                tabBarIcon: AIWorldTabButton,
              }}
              listeners={{
                tabPress: (e) => {
                  e.preventDefault();
                  handleChatPress();
                },
              }}
            />
          ) : ( */}
        <Tab.Screen
          name="Quick Dials"
          component={HospitalNavs}
          options={{
            unmountOnBlur: true,
            tabBarLabel: 'Quick Dials',
            tabBarIcon: ({ color, size }) => (
              <AppIcon name="phone" color={color} size={size} strokeWidth={2} />
            ),
          }}
        />
        {/* ) )} */}


        {/* Hidden Screens */}
        <Tab.Screen name="ManagerLeave" component={ManagerLeave} options={{ tabBarButton: () => null }} />
        <Tab.Screen name="ManagerFlexiShift" component={ManagerFlexiShift} options={{ tabBarButton: () => null }} />
        <Tab.Screen name="ManagerTaxi" component={ManagerTaxi} options={{ tabBarButton: () => null }} />
        <Tab.Screen name="ManagerAttandance" component={ManagerAttandance} options={{ tabBarButton: () => null }} />
        <Tab.Screen name="ManagerAttandancePercentage" component={ManagerAttandancePercentage} options={{ tabBarButton: () => null }} />
        <Tab.Screen name="ManagerRHTKGatePass" component={ManagerRHTKGatePass} options={{ tabBarButton: () => null }} />
        <Tab.Screen name="EmployeeNavs" component={EmployeeNavs} options={{ tabBarButton: () => null }} />
        <Tab.Screen name="CompensationBenifitsNav" component={CompensationBenifitsNav} options={{ tabBarButton: () => null }} />
        <Tab.Screen name="HospitalNavs" component={HospitalNavs} options={{ tabBarButton: () => null }} />
        <Tab.Screen name="CanteeNavigator" component={CanteeNavigator} options={{ tabBarButton: () => null }} />
        <Tab.Screen name="FoodCount" component={FoodCount} options={{ tabBarButton: () => null }} />
        <Tab.Screen name="AttendanceAdminNav" component={AttendanceAdminNav} options={{ tabBarButton: () => null }} />
        <Tab.Screen name="OtherApps" component={OtherApps} options={{ tabBarButton: () => null }} />
        <Tab.Screen name="BusinessNavigator" component={BusinessNavigator} options={{ tabBarButton: () => null }} />
        <Tab.Screen name="ExtraHoursApproval" component={ExtraHoursApproval} options={{ tabBarButton: () => null }} />
        <Tab.Screen name="GatePassNavigator" component={GatePassNavigator} options={{ tabBarButton: () => null }} />
        <Tab.Screen name="ManagerTaxiApproval" component={ManagerTaxiApproval} options={{ tabBarButton: () => null }} />
        <Tab.Screen name="OtherMobilityNavigator" component={OtherMobilityNavigator} options={{ tabBarButton: () => null }} />
        <Tab.Screen name="HospitalApproval" component={HospitalApproval} options={{ tabBarButton: () => null }} />

      </Tab.Navigator>


      {/* AI Chatbot — not in use currently
      {showAIButton && <AITooltip />}
      <AIChat visible={isChatOpen} onClose={handleCloseChat} /> */}

      {/* Employee ⇄ Manager transition (above everything, incl. the tab bar) */}
      <ModePortal ref={portalRef} />
    </>
  );
}


const styles = StyleSheet.create({
  managerButtonWrapper: {
    position: 'absolute',
    bottom: 8,
    width: 96,
    left: width * 0.5 - 48,
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  managerText: {
    fontSize: 10,
    color: '#000',
    marginTop: 5,
    fontWeight: '800',
    textAlign: 'center',
  },
  aiTabButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 30,
    height: 30,
  },
  aiTabGif: {
    width: 30,
    height: 30,
  },
  tooltipContainer: {
    position: 'absolute',
    bottom: height * 0.15,
    right: width * 0.025,
    zIndex: 9999,
    alignItems: 'flex-end',
  },
  tooltipBubble: {
    borderRadius: 20,
    elevation: 15,
    shadowColor: ThemeColor.Teal,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 15,
  },
  tooltipGradient: {
    borderRadius: 20,
    padding: 20,
    paddingTop: 30,
    paddingBottom: 25,
    width: width * 0.75,
    borderWidth: 2,
    borderColor: ThemeColor.Teal,
  },
  newBadge: {
    position: 'absolute',
    top: 8,
    right: 15,
    backgroundColor: '#FF4757',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
    elevation: 6,
    shadowColor: '#FF4757',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 10,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  tooltipTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: ThemeColor.TealDark,
    marginBottom: 10,
    textAlign: 'center',
    textShadowColor: 'rgba(2, 119, 189, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    fontStyle: 'italic',
  },
  tooltipDivider: {
    height: 2,
    backgroundColor: 'rgba(2, 119, 189, 0.2)',
    marginVertical: 10,
    borderRadius: 1,
  },
  tooltipSubtitle: {
    fontSize: 20,
    fontWeight: '800',
    color: ThemeColor.Teal,
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  tooltipDescription: {
    fontSize: 14,
    color: ThemeColor.TealDeep,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '600',
  },
  arrowContainer: {
    alignItems: 'flex-end',
    marginTop: 25,
    marginRight: width * 0.16,
  },
  arrowBorder: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 3,
    elevation: 8,
    shadowColor: ThemeColor.Teal,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    borderWidth: 2,
    borderColor: ThemeColor.Teal,
  },
});


export default Tabs;
