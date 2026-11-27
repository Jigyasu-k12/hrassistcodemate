//import liraries
import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, FlatList, SafeAreaView, Modal, Pressable } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-simple-toast'
import * as ApiService from '../../Utils/Utils';
import AuthContext from '../../context/AuthContext';
import Spinner from 'react-native-loading-spinner-overlay';
import { useFocusEffect } from '@react-navigation/native';
import Text from '../../components/reusable/Text';
import { Header } from '../../components/reusable/Header';
import { ThemeGlobalColor as GlobalColor, ThemeColor, HomePalette } from '../../constants/Colors';
import { AppIcon } from '../../components/icons/AppIcon';
import ListEmptyComponent from '../../components/reusable/ListEmptyComponent';
import { LoadingScreen } from '../../components/reusable/LoadingScreen';


// create a component
const EmergencyContacts = ({ navigation }) => {
  const myNavigation = useNavigation();
  const { authContext, AppUserData } = useContext(AuthContext);
  const [loader, setLoader] = useState(false);
  const [refresh, setrefresh] = useState(false);
  const [emerList, setEmerList] = useState();

  const stopLoader = () => {
    try {
      setLoader(false);
      setrefresh(false);
    } catch(error){
// $&
    }
}


  const GetEmerMain = (pulldown = false) => {

    if(!pulldown){
      setLoader(true);
    }

    let apiData = {}
    let token = AppUserData.token
    // console.log(apiData)
    setLoader(true);
    ApiService.PostMethode('/GetEmerMain', apiData, token, authContext)
      .then(result => {
        stopLoader(false);
        let ApiValue = result.Value
// $&
        setEmerList(ApiValue)
      })
      .catch(error => {
        stopLoader(false);
        // // console.log($1);
        ApiService.showErrorMessage(error, authContext);
      });
  };

  useFocusEffect(
    React.useCallback(() => {
      const unsubscribe = GetEmerMain();
      return () => unsubscribe;
    }, [])
  )

  // Line icon per contact type (Teal Glow icon set)
  const iconBox = (type) => {
    switch (type) {
      case 'Doctor': return 'doctor';
      case 'Vigilance': return 'vigilance';
      case 'Fire Control': return 'fire';
      case 'Electricity': return 'electricity';
      case 'POSH Cell': return 'posh';
      case 'Helpdesk': return 'helpdesk';
      case 'Taxi Helpline': return 'taxi';
      default: return 'phone';
    }
  };


  if(loader){
    return(
      <SafeAreaView style={styles.container}>
        <LoadingScreen/>
      </SafeAreaView>
    )
  }


  return (

    <SafeAreaView style={styles.container}>
          <FlatList
            // contentContainerStyle={{ flex:1}}
            contentContainerStyle={{ paddingBottom: 50 }}
            data={emerList}
            ListEmptyComponent={() => <ListEmptyComponent enableRefresh={true} onRefreshCallback={()=>GetEmerMain(true)} refreshing={refresh} />}
            renderItem={({ item }) => {
              let image = iconBox(item.EMER_DESC);
              return (
                <TouchableOpacity
                  key={item.CONTACT_NUMBER}
                  style={styles.box}
                  // onPress={() => {
                  //   myNavigation.navigate("DoctorsContacts", {
                  //     data: item,
                  //     pageName: item.EMER_DESC == "Doctor" ? "Doctor" : (item.EMER_DESC == "Vigilance" ? "Vigilance" : (item.EMER_DESC == "Fire Control" ? "Fire Control" : (item.EMER_DESC == "Electricity" ? "Electricity" :  (item.EMER_DESC == "Helpdesk" ? "Helpdesk" : "POSH Cell"))))
                  //   })
                  // }}
                  onPress={() => {
                    myNavigation.navigate("DoctorsContacts", {
                      data: item,
                      pageName:
                        item.EMER_DESC == "Doctor"
                          ? "Doctor"
                          : item.EMER_DESC == "Vigilance"
                          ? "Vigilance"
                          : item.EMER_DESC == "Fire Control"
                          ? "Fire Control"
                          : item.EMER_DESC == "Electricity"
                          ? "Electricity"
                          : item.EMER_DESC == "Helpdesk"
                          ? "Helpdesk"
                          : item.EMER_DESC == "Taxi Helpline"
                          ? "Taxi Helpline"
                          : "POSH Cell"
                    });
                  }}
                  >
                  <View style={styles.iconBox}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 13,
                        backgroundColor: HomePalette.mint,
                        justifyContent: 'center',
                        alignItems: 'center',
                        overflow: 'hidden'
                      }}>
                      <AppIcon name={image} size={22} />
                    </View>
                  </View>
                  <View style={styles.item}>
                    <Text style={{fontSize:13}}>{item.EMER_DESC}</Text>
                    <Feather name="corner-up-right" size={18} color={ThemeColor.Teal}/>
                  </View>
                </TouchableOpacity>
              )
            }}
          />    
    </SafeAreaView>

  );
};

// define your styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GlobalColor.PrimaryLight,
    paddingHorizontal:10,
    marginBottom:"35%"
  },
  spinnerTextStyle: {
    color: GlobalColor.White
  },
  box: {
    flexDirection: 'row',
    marginTop: 10,
    width: '100%',
    paddingVertical: 10,
    alignSelf: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderWidth:0.5,
    borderColor:GlobalColor.Secondary,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
export default EmergencyContacts;
