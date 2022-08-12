//import liraries
import React, { useEffect, useState, useContext } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, Platform, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import DatePicker from 'react-native-date-picker';
import moment from 'moment';
import Geolocation from '@react-native-community/geolocation';

import AuthContext from '../../context/AuthContext';
import Toast from 'react-native-simple-toast'
import * as ApiService from '../../Utils/Utils';
import { useFocusEffect } from '@react-navigation/native';
import Button from './../../components/reusable/Button'
import { GlobalColor } from '../../constants/Colors';
import { GlobalFontSize } from '../../constants/FontSize';
import Text from '../../components/reusable/Text';
import { LoadingScreen } from './../../components/reusable/LoadingScreen';
import ListEmptyComponent from '../../components/reusable/ListEmptyComponent';
import { DataTable } from 'react-native-paper';



const AttendanceReport = () => {
    const [fromDate, setFromDate] = useState(new Date());
    const [toDate, setToDate] = useState(new Date());
    const [open, setOpen] = useState(false);
    const [openSecond, setOpenSecond] = useState(false);
    const [MarkAttandance, setMarkAttandance] = useState(0);
    const [loader, setLoader] = useState(false)
    const [MapLisenceKey, setMapLisenceKey] = useState("");
    const [location, setLocation] = useState('');
    const { authContext, AppUserData } = useContext(AuthContext);
    // To Hide or show based on getGpsAvailable
    const [ShowAttandanceTabs, setShowAttandanceTabs] = useState(false);
    const [RawPunches, setRawPunches] = useState([]);
  
    useFocusEffect(
      React.useCallback(() => {
        const unsubscribe = GetRawPunch();
        return () => unsubscribe;
      }, [])
    );
  
    const GetRawPunch = () => {
      let apiData = {
        "FromDate": moment(fromDate).format('DD-MMM-YYYY'),
        "ToDate": moment(toDate).format('DD-MMM-YYYY'),
        "StaffNo": AppUserData?.data?.userId
      };
      // console.log(apiData);
      // AppUserData?.data?.userId
      let token = AppUserData.token;
      setLoader(true);
      ApiService.PostMethode('/GetRawPunch', apiData, token, authContext)
        .then(result => {
          console.log("APiresult GetRawPunch", result);
          setLoader(false);
          if (result.Value) {
            setRawPunches(result.Value);
          }
        })
        .catch(error => {
          setLoader(false);
          // console.log('Error occurred==>', error);
          ApiService.showErrorMessage(error, authContext);
        });
    }
  
  
    const renderItem = ({ item }) => {
      // console.log("first data sujsdhg", item)
      return (
        <View style={styles.renderitem}>
          <Text>{item['Staff No']}</Text>
          <Text>{item.Date.slice(0, 12)}</Text>
          <Text>{item.Date.slice("12", 17)}</Text>
          {/* <Text>{item.Date}</Text> */}
          <Text>{item['Moble/Machine']}</Text>
        </View>
      )
    }
  
  
    const handelDate = () => {
      if (fromDate > toDate) {
        Alert.alert('from date should be less then to date');
      } else {
        GetRawPunch();
      }
    }
    if (loader) {
      return (
        <LoadingScreen />
      )
    }
  
  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>

          <View style={{ flex: 1 }}>
            <View
              style={styles.reportView}>
              <View
                style={{
                  width: '48%',
                }}>
                <Text style={styles.titleLabel}>From</Text>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottomWidth: 1,
                    borderBottomColor: 'gray',
                    padding: 3,
                  }}>
                  <Text style={{ color: 'gray' }}>
                    {moment(fromDate).format('MMM Do YYYY')}
                  </Text>
                  <View>
                    <View>
                      <TouchableOpacity onPress={() => setOpen(true)}>
                        <Ionicons
                          name="calendar-outline"
                          size={25}
                          color={GlobalColor.Secondary}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>

              <View
                style={{
                  width: '48%',
                }}>
                <Text style={styles.titleLabel}>To</Text>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottomWidth: 1,
                    borderBottomColor: 'gray',
                    padding: 3,
                  }}>
                  <Text style={{ color: 'gray' }}>
                    {moment(toDate).format('MMM Do YYYY')}
                  </Text>
                  <View>
                    <View>
                      <TouchableOpacity
                        onPress={() => (setOpenSecond(true))}>
                        <Ionicons
                          name="calendar-outline"
                          size={25}
                          color={GlobalColor.Secondary}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>

              {/* DatePicker */}

              <DatePicker
                modal
                open={open}
                date={fromDate}
                mode='date'
                onConfirm={fromDate => {
                  setOpen(false);
                  setFromDate(fromDate);
                  console.log(fromDate);

                }}
                onCancel={() => {
                  setOpen(false);
                }}
              />
              <DatePicker
                modal
                mode='date'
                open={openSecond}
                date={toDate}
                onConfirm={toDate => {
                  setOpenSecond(false);
                  setToDate(toDate);
                  console.log(toDate);
                }}
                onCancel={() => {
                  setOpenSecond(false);
                }}
              />
            </View>
            <Button onPress={() => { handelDate() }} title={"Submit"}></Button>
            <DataTable
              style={{
                width: '100%',
                backgroundColor: '#fff',
                marginVertical: 10,
                flex: 1
              }}>

              <DataTable.Header style={{ backgroundColor: '#fff' }}>
                <DataTable.Title>
                  <Text Bold style={{ color: GlobalColor.Primary, fontSize: GlobalFontSize.Small }}>Staff Id</Text>
                </DataTable.Title>
                <DataTable.Title numeric >
                  <Text Bold style={{ color: GlobalColor.Primary, fontSize: GlobalFontSize.Small }}>
                    Date
                  </Text>
                </DataTable.Title>
                <DataTable.Title numeric>
                  <Text Bold style={{ color: GlobalColor.Primary, fontSize: GlobalFontSize.Small }}>Time</Text>
                </DataTable.Title>
                <DataTable.Title numeric>
                  <Text Bold style={{ color: GlobalColor.Primary, fontSize: GlobalFontSize.Small }}>Source</Text>
                </DataTable.Title>
              </DataTable.Header>

              <FlatList
                contentContainerStyle={{ flexGrow: 1 }}
                data={RawPunches}
                renderItem={renderItem}
                ListEmptyComponent={() => <ListEmptyComponent title="No Data Found" subtitle="Please select dates and submit to view data"></ListEmptyComponent>}
                keyExtractor={item => item.Date.toString()}
              />
            </DataTable>
          </View>
      </View>
    </View>
  )
}

// define your styles
const styles = StyleSheet.create({
    container: {
      flex: 1,      
      position: 'relative',
      backgroundColor: GlobalColor.PrimaryLight
    },
    reportView: {
      width: '100%',
      borderWidth: 1,
      borderColor: '#fff',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexDirection: 'row',
      padding: 10,
      marginVertical: 10,
      backgroundColor: '#fff',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      borderRadius: 0,
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
    titleLabel: {
      color: GlobalColor.Primary,
      fontWeight: '700',
      fontSize: 16
    },

  
  });
  
  //make this component available to the app

export default AttendanceReport