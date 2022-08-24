//import liraries
import React, { Component, useContext, useEffect } from 'react';
import { View, StyleSheet, Image, ScrollView, SafeAreaView, Alert, Linking } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import TouchableCard from '../components/Touchable';
import LinearGradient from 'react-native-linear-gradient';
import { SliderBox } from 'react-native-image-slider-box';
import IconBadge from 'react-native-icon-badge';
import { TouchableOpacity } from 'react-native-gesture-handler';
import AuthContext from './../context/AuthContext';
import { GlobalColor } from '../constants/Colors';
import { GlobalFontSize } from '../constants/FontSize';
import Text from '../components/reusable/Text';
import * as ApiService from '../Utils/Utils';




// create a component
const Home = ({ navigation }) => {
  const { authContext, AppUserData } = useContext(AuthContext);
  // images for carousel
  const image = [
    // 'https://1qkeyv41u1op36vgbm47q0i6-wpengine.netdna-ssl.com/wp-content/uploads/2021/07/Mobile-App-Design-Cost-1024x512.png',
    // 'https://static.wingify.com/gcp/uploads/sites/3/2015/10/OG-image_App-or-Website-10-Reasons-Why-Apps-are-Better.png',
    // 'https://www.cubix.co/themes/responsiv-clean/assets/images/blog-images/app-designing-process-b.jpg',
    "https://marutistoragenew.blob.core.windows.net/ag3mobileapp/1.png",
    "https://marutistoragenew.blob.core.windows.net/ag3mobileapp/2.png",
    "https://marutistoragenew.blob.core.windows.net/ag3mobileapp/3.png"
  ];



  const checkAppUpdate = () =>{
    let versionfromplug = '1.1.1';
    let appname = "HR ASSIST";
    let devicetype = "IOS"

    let apiData = {
      "AppName" : appname,
      "DeviceType" : devicetype,
      "Version" : versionfromplug
    }

    let token = AppUserData.token;
    let userId = AppUserData?.data?.userId
    ApiService.PostMethode('/CheckAppVersion', apiData, token, authContext)
    .then(result => {
      if(result.Result){
        let vesionNo = result.Result.split("~");
        // console.log(vesionNo);
        if(vesionNo[1] != versionfromplug){

          Alert.alert(
            "New Update",
            "Please update the app to new version by downloading and installing the app",
            [
              // {
              //   text: "Cancel",
              //   onPress: () => console.log("Cancel Pressed"),
              //   style: "cancel"
              // },
              { text: "OK", onPress: () => {
                Linking.openURL(vesionNo[0]);
              } }
            ]
          );          
        }


      }

      console.log(result);       
    })
    .catch(error => {
      // stopLoader(false);
      console.log('Error occurred==>', error);
      ApiService.showErrorMessage(error, authContext);
    });
  } 
    useEffect(() => {
      const permission = checkAppUpdate();
      return () => {
      permission
      };
    }, []);




  // end array
  return (
    <SafeAreaView style={{ flexGrow: 1 }}>
      <View style={styles.container}>
        <View
          colors={[GlobalColor.PrimaryGradient, GlobalColor.SecondryGradient]}
          style={styles.gradient}>
          <View>
            <View style={styles.headerText1}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Ionicons
                  name="menu-outline"
                  size={30}
                  color={GlobalColor.Primary}
                  onPress={() => navigation.openDrawer()}
                />
                <Text style={[styles.brand, { marginLeft: 15 }]} Bold>HR Assist</Text>
              </View>
              <Image
                style={styles.tinyLogo}
                source={require('./../assets/Images/mslogo.png')}
              />

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <TouchableOpacity
                  onPress={() => {
                    navigation.navigate("Notification");
                  }}>
                  <Feather name="bell" color={GlobalColor.Primary} size={30} />
                  {/* <IconBadge
                  MainElement={<Feather name="bell" color={'#fff'} size={30} />}
                  // BadgeElement={<Text style={{color: '#fff', fontWeight:'700'}}>5</Text>}
                  IconBadgeStyle={{
                    paddingVerticle: 5,
                    backgroundColor: "#4174D0",
                  }}
                /> */}
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ flexDirection: 'row', marginHorizontal: 10, marginVertical: 5, alignItems: 'center' }}
            ><TouchableOpacity onPress={() => { navigation.navigate("EditProfile") }}>
                {AppUserData.data && AppUserData.data.profile_photo ? (
                  <Image
                    source={{ uri: 'data:image/png;base64, ' + AppUserData.data.profile_photo }}
                    style={{ width: 40, height: 40, borderRadius: 50 }}
                  />
                ) : (
                  <Image
                    source={require('../assets/Images/smile.jpg')}
                    style={{ width: 40, height: 40, borderRadius: 50 }}
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => { navigation.navigate("EditProfile") }} style={{ marginHorizontal: 10 }}>
                <Text
                  style={{
                    fontSize: GlobalFontSize.P,
                    color: GlobalColor.Primary,
                    textTransform: 'capitalize'
                  }}
                  Bold>
                  {AppUserData.data && AppUserData?.data?.EMPL_NAME ? AppUserData?.data?.EMPL_NAME : "User"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>


        <View style={styles.carousel}>
          <SliderBox
            images={image}
            autoplay={true}
            circleLoop={true}
            style={styles.carouselimg}
            sliderBoxHeight={250}
          />
        </View>
        <TouchableCard navigation={navigation} />


      </View>
    </SafeAreaView>
  );
};

// define your styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    // justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    fontFamily: 'Montserrat-Regular',
  },
  gradient: {
    width: '100%',
    height: '25%',
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    zIndex: 0,
  },
  headerText1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 10,
  },
  brand: {
    color: GlobalColor.Primary,
    fontSize: GlobalFontSize.H4,
    margin: 10,
    // letterSpacing: 1,
  },
  carousel: {
    marginTop: -40,
    height: 180,
    width: '92%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 3,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1,
    overflow: 'hidden',
    marginBottom: 5,
    borderWidth: 0.5,
    borderColor: GlobalColor.Secondary
  },
  carouselimg: {
    minHeight: '100%',
    width: '100%',
    resizeMode: 'contain',
  },
  tinyLogo:{
    width:60, 
    height:30, 
    resizeMode:'contain',
    marginTop:5 
  }
});

//make this component available to the app
export default Home;
