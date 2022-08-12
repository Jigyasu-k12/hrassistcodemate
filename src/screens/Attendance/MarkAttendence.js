//import liraries
import React, { useEffect, useState, useContext } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, Platform, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import moment from 'moment';
import Geolocation from '@react-native-community/geolocation';

import AuthContext from '../../context/AuthContext';
import Toast from 'react-native-simple-toast'
import * as ApiService from '../../Utils/Utils';

import { useFocusEffect } from '@react-navigation/native';

import { GlobalColor } from '../../constants/Colors';
import { GlobalFontSize } from '../../constants/FontSize';
import Text from '../../components/reusable/Text';
import { LoadingScreen } from '../../components/reusable/LoadingScreen';


const MarkAttendence = () => {
    const [fromDate, setFromDate] = useState(new Date());
    const [toDate, setToDate] = useState(new Date());
    const [open, setOpen] = useState(false);
    const [openSecond, setOpenSecond] = useState(false);
    const [MarkAttandance, setMarkAttandance] = useState(0);
    const [loader, setLoader] = useState(false)
    const [MapLisenceKey, setMapLisenceKey] = useState("");
    const [horizental, setHorizental] = useState(false);
    const [userLocation, setUserLocation] = useState('');
    const { authContext, AppUserData } = useContext(AuthContext);
    const [location, setLocation] = useState('');

  
    // To Hide or show based on getGpsAvailable
    const [ShowAttandanceTabs, setShowAttandanceTabs] = useState(false);

  
  
    useFocusEffect(
      React.useCallback(() => {
        const unsubscribe = checkGpsAvailable();
        return () => unsubscribe;
      }, [])
    );
  
    const checkGpsAvailable = () => {
      setShowAttandanceTabs(true);
      setMarkAttandance(0);
      getUserCurrentLocation();
      getLocationLisenceKey();
    }
  
  
    const getUserCurrentLocation = () => {
      Geolocation.getCurrentPosition(position => {
        console.log('position', position);
        const { latitude, longitude } = position.coords;
        setLocation({
          latitude,
          longitude,
        });
      },
        error => console.log('Error', JSON.stringify(error)),
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 },
      );
    }
  
    
  
    const getMobDevice = () => {
      let apiData = { "UserName": AppUserData?.data?.userId };
      setLoader(true);
      if (Platform.OS == 'android') {
        // AppUserData?.data?.userId 222852
        let token = AppUserData.token;
        ApiService.PostMethode('/GetMobDevice', apiData, token, authContext)
          .then(result => {
            console.log("APiresult GetMobDevice", result);
            setLoader(false);
            if (result.Value.length > 0) {
              // DEVC_ID: "1"
              // DEVC_NAME: "ONEPLUS A3003, Redmi Note 4"
              let model = result.Value[0].DEVC_NAME;
              let modelfrmplug = Platform.Model;
  
              if (model.includes(modelfrmplug)) {
                console.log("inside");
                let notSupported = true;
                Toast.show('Session expired login again');
              } else {
                // Toast.show('Worked');
              }
            }
          })
          .catch(error => {
            setLoader(false);
            // console.log('Error occurred==> getMobDevice', error);
            ApiService.showErrorMessage(error, authContext);
          });
      }
  
      if (location.latitude && location.longitude) {
        let url = 'https://maps.googleapis.com/maps/api/geocode/json?latlng=' + parseFloat(location.latitude) + ',' + parseFloat(location.longitude) + '&key=' + MapLisenceKey
        console.log(url);
        ApiService.getRawurl(url)
          .then(result => {
            console.log("APiresult getRawurl", result);
            setLoader(false);
            let location = result.results[0].formatted_address;
            setUserLocation(location)
            let date = "13-11-1993";
            CallAPIToStoreAddress(location, date, location.latitude, location.longitude);
  
          })
          .catch(error => {
            CallAPIToStoreAddress();
            setLoader(false);
            // console.log('Error occurred==> APiresult getRawurl', error);
            ApiService.showErrorMessage(error, authContext);
          });
      } else {
        CallAPIToStoreAddress();
      }
    };
  
  
    const CallAPIToStoreAddress = (location = "", dati = "", lat = "", lon = "") => {
      let token = AppUserData.token
      let EmplID = AppUserData?.data?.userId
      let apiData = {
        // EmplID: EmplID
        StaffNo: EmplID
      }
      setLoader(true);
      ApiService.PostMethode('/SubmitPunchRO', apiData, token, authContext)
        .then(result => {
          setLoader(false);
          console.log('ApiResult SubmitPunchRO', result);
          Alert.alert("Success", result.Result);
          // let responseData = result.Value[0].SHIS_YYMM_CODE
          // console.log('GetMonth', responseData)
          // setMonth(responseData)
  
        })
        .catch(error => {
          setLoader(false);
          console.log('Error occurred==> SubmitPunchRO', error);
          ApiService.showErrorMessage(error, authContext);
        });
    }
  
    const getLocationLisenceKey = () => {
      let token = AppUserData.token
      let EmplID = AppUserData.data
      let apiData = {
        EmplID: EmplID
      }
      setLoader(true);
      ApiService.PostMethode('/GetMapsLicenseKey', {}, token)
        .then(result => {
          setLoader(false);
          console.log('ApiResult GetMapsLicenseKey', result);
          if (result.Result) {
            setMapLisenceKey(result.Result);
          }
        })
        .catch(error => {
          setLoader(false);
          ApiService.showErrorMessage(error, authContext);
        });
    };
  
    if (loader) {
      return (
        <LoadingScreen />
      )
    }


  return (
    <View style={styles.container}>      

      <View style={{ flex: 1 }}>
       
          <View>
            <TouchableOpacity style={styles.content}>
              <Text>Live Location
                <Icon name='map-marker-radius' size={25} color={'green'} />
              </Text>
              <TouchableOpacity
                style={styles.circle}
                onPress={() => {
                  getMobDevice();
                }}>
                <Text>Punch</Text>
              </TouchableOpacity>
              <Text style={{ textAlign: 'center' }}>{userLocation}</Text>

            </TouchableOpacity>
            <TouchableOpacity onPress={() => getUserCurrentLocation()} style={styles.resetLocation}>
              <Text style={styles.resetLocationTxt}>Reset Location</Text>
              <Ionicons name='ios-locate-outline' size={30} color={'green'} />
            </TouchableOpacity>

          </View>
        
      </View>
    </View>
  )
}

// define your styles
const styles = StyleSheet.create({
    container: {
      flex: 1,
      // paddingHorizontal: 10,
      position: 'relative',
      backgroundColor: GlobalColor.PrimaryLight
    },
          
    tabTextStyle: {
      fontSize: GlobalFontSize.P,
      color: 'grey',
      fontFamily: 'Roboto-Bold',
    },
   
    activeTabTextStyle: {
      color: GlobalColor.Secondary,
    },
    content: {
      top: 10,
      alignItems: 'center',
      padding: 10,
      backgroundColor: 'white',
      borderRadius: 5,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.18,
      shadowRadius: 2.0,
      elevation: 5,
      marginVertical: 10
    },
    circle: {
      height: 100,
      width: 100,
      borderWidth: 3,
      borderColor: 'green',
      borderRadius: 100,
      alignSelf: 'center',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 8,
      marginVertical: 30,
    },
    renderitem: {
      paddingVertical: 15,
      paddingHorizontal: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: '#fff',
      marginTop: 10,
      borderWidth: 0.5,
      borderColor: GlobalColor.LightDark
    },
    resetLocation: {
      marginTop: 20,
      flexDirection: 'row',
      alignSelf: 'center',
      backgroundColor: '#4a4a4a',
      alignItems: 'center',
      padding: 10
    },
    resetLocationTxt: {
      color: "#fff",
      marginRight: 5,
      fontWeight: "700"
    }
  
  });
  
//make this component available to the app
export default MarkAttendence