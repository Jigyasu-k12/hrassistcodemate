//import liraries
import React, { Component ,useContext} from 'react';
import {
  View,
  StyleSheet,
  Image,
  ScrollView,
  TextInput,
  useWindowDimensions,
  SafeAreaView
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import EmployeeDirect from './EmployeeDirect';
import Birthdays from './Birthday/Birthdays';
import { ThemeGlobalColor as GlobalColor, ThemeColor } from '../../constants/Colors';
import { GlobalFontSize } from '../../constants/FontSize';
import Text from '../../components/reusable/Text';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Header } from '../../components/reusable/Header';
import AuthContext from '../../context/AuthContext';

const Tab = createMaterialTopTabNavigator();




const EmployeLookUp = ({ navigation }) => {

  const {authContext, AppUserData} = useContext(AuthContext);
  let usrAccess = AppUserData?.data?.userFlag;
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', (e) => {
      // Prevent default behavior
      e.preventDefault();

      alert('Default behavior prevented');
      // Do something manually
      // ...
    });

    return unsubscribe;
  }, [navigation]);

  
  return (
    <SafeAreaView style={{ flex: 1, width: '100%', height: '100%' }}>
      <Header title={"Employee Lookup"}/>
     <LinearGradient colors={['#171C8F','#171C8F','#171C8F']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.mystyl}>
       <View style={{flex:1,flexDirection:'row'}}>
      <Tab.Navigator
        swipeEnabled={false}
        screenOptions={{
          tabBarLabelStyle: { fontSize: GlobalFontSize.TabTitle, fontWeight:'700'},
          tabBarActiveTintColor: '#fff',
          tabBarIndicatorStyle: { borderBottomWidth: 5, borderBottomColor: 'rgba(255,255,255,0.22)' },
          tabBarStyle: { backgroundColor: 'rgba(255,255,255,0)', elevation: 0 },
        }}>
        <Tab.Screen name="Employee Directory" component={EmployeeDirect} />
        {usrAccess != 'Y' ?( <Tab.Screen name="Birthdays" component={Birthdays} />):null}
      </Tab.Navigator>
      </View>
     </LinearGradient>
     
      {/* <TabView
        renderTabBar={props => {
          return (
            <LinearGradient  colors={[ThemeColor.Teal, ThemeColor.Teal]} style={{marginTop:-1,zIndex:-1}}>
              <TabBar
                {...props}
                style={{
                  backgroundColor: ThemeColor.Teal, elevation: 5
                }}
                renderLabel={({ route, focused, color }) => (
                  <Text style={{ color, fontWeight:'700', textTransform:'uppercase'}}>
                    {route.title}
                  </Text>
                )}
                indicatorContainerStyle={{backgroundColor:ThemeColor.Teal}}
                indicatorStyle={{color:"#01044B", backgroundColor:'#F5F5F5',height:5}}
              />
            </LinearGradient>
          );
        }}
        navigationState={{index, routes}}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{width: layout.width}}
        sceneContainerStyle={{backgroundColor:"#F5F5F5", width:"100%"}}
        style={{backgroundColor:'#01044B'}}
      /> */}
    </SafeAreaView>
  )
};

// define your styles
const styles = StyleSheet.create({
  gradient: {
    padding: 20,
    elevation: 0,
    backgroundColor:'#171C8F'
  },
  container: {
    flexDirection: 'row',
    // flex:1
  },

  mystyl: {
        backgroundColor: 'rgba(255,255,255,0)',
        height:'100%',
        flexDirection: 'row',
      },

  // searchSection: {
  //   top: 10,
  //   width: '90%',
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   alignSelf: 'center',
  //   borderWidth: 1,
  //   borderColor: '#F5F5F5',
  //   borderRadius: 7,
  // },
  // searchIcon: {
  //   padding: 10,
  // },
  // input: {
  //   width: '77%',
  //   paddingTop: 10,
  //   paddingRight: 10,
  //   paddingBottom: 10,
  //   paddingLeft: 0,
  //   backgroundColor: '#F5F5F5',
  //   color: '#171C8F',
  // },
});

// //make this component available to the app
export default EmployeLookUp;
