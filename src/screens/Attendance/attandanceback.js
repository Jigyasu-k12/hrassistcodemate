//import liraries
import { ThemeGlobalColor as GlobalColor, ThemeColor } from '../../constants/Colors';
import React, {useState, useEffect,useContext} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import {TabView, SceneMap, TabBar} from 'react-native-tab-view';
import Attendance from './Attendence';
import Leave from './Leave';
import Shift from './Shift';
import HolidayCalendar from './HolidayCalendar';
import {TouchableOpacity} from 'react-native-gesture-handler';

const FirstRoute = () => <Attendance />;
const SecondRoute = () => <Leave />;
const ThirdRoute = () => <Shift />;
const FourthdRoute = () => <HolidayCalendar />;

const AttendanceAdmin = ({navigation}) => {
  const [horizental, setHorizental] = useState(false);
  const [manager, setManager] = useState(false);
  useEffect(() => {
    setManager(false);
  }, []);

  const handelHorizental = () => {
    setHorizental(!horizental);
  };
  const renderScene = SceneMap({
    first: FirstRoute,
    second: SecondRoute,
    third: ThirdRoute,
    fourth: FourthdRoute,
  });
  const layout = useWindowDimensions();
  const [index, setIndex] = React.useState(0);
  const [routes] = React.useState([
    {key: 'first', title: 'Attendance'},
    {key: 'second', title: 'Leave'},
    {key: 'third', title: 'Shift'},
    {key: 'fourth', title: 'HoliCalendar'},
  ]);
  return (
    <View style={{flex: 1, width: '100%', height: '100%'}}>
      <LinearGradient
     colors={['#171C8F','rgba(23,28,143,0.1)']}
        style={styles.gradient}>
        <View style={styles.container}>
        {horizental == true ? (
            <View
              style={{
                padding: 5,
                backgroundColor: '#FFFFFF',
                position: 'absolute',
                top: 30,
                right: 50,
                zIndex:1000,
                borderRadius:8
              }}>
              <Text>Attendance Percentage</Text>
            </View>
          ) : null}
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
              color={'#FFFFFF'}
              onPress={() => navigation.goBack()}
            />
            <Ionicons
              name="menu-outline"
              size={25}
              color={'#FFFFFF'}
              onPress={() => navigation.openDrawer()}
            />
          </View>
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 18,
              letterSpacing: 1,
              marginLeft: 30,
            }}>
            Attendance & Admin
          </Text>

          {/* <View style={{alignContent:'center'}}> */}
          <TouchableOpacity
            style={{marginLeft: '35%'}}
            onPress={() => {
              horizental == true ? setHorizental(false) : setHorizental(true);
            }}>
            <Ionicons
              name="ellipsis-vertical-circle"
              size={25}
              color={'#FFFFFF'}
            />
          </TouchableOpacity>

          <View
            style={{
              flexDirection: 'row',
              width: manager == true ? '50%' : '8%',
              position: 'absolute',
              bottom: -5,
              right: -20,
              alignItems: 'center',
              backgroundColor: '#171C8F',
              borderTopLeftRadius: 20,
              borderBottomLeftRadius: 20,
              paddingVertical: 5,
            }}>
            <TouchableOpacity>
              <Ionicons
                style={{marginLeft: '5%'}}
                name="ios-person-circle-outline"
                size={25}
                color={'#FFFFFF'}
                onPress={() => {
                  manager == true ? setManager(false) : setManager(true);
                }}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={{alignSelf: 'center'}}
              onPress={() => {
                navigation.navigate('ManagerMode');
              }}>
              {manager == true ? (
                <Text style={{color: '#FFFFFF', marginLeft: 0}}>
                  Go-To Manager-Mode
                </Text>
              ) : null}
            </TouchableOpacity>
          </View>
          {/* </View> */}
        </View>
      </LinearGradient>
     
      <TabView
        renderTabBar={props => {
          return (
            <LinearGradient
              colors={['#171C8F','rgba(23,28,143,0.1)']}
              style={{marginTop: -1, zIndex: -1}}>
              <TabBar
                renderLabel={({route, focused, color}) => (
                  <Text style={{fontSize: 13, color: '#FFFFFF'}}>
                    {route.title}
                  </Text>
                )}
                {...props}
                style={{backgroundColor: 'rgba(255,255,255,0)', elevation: 0}}
              />
            </LinearGradient>
          );
        }}
        navigationState={{index, routes}}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{width: layout.width}}
      />
    </View>
  );
};

// define your styles
const styles = StyleSheet.create({
  gradient: {
    padding: 20,
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
});

// //make this component available to the app
export default AttendanceAdmin;
