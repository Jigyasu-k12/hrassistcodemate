//import liraries
import React, { useEffect, useState, useRef, useContext } from 'react';
import {
  View,
  StyleSheet,

  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,

} from 'react-native';

import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { FlatList } from 'react-native-gesture-handler';
import Modal from 'react-native-modal';
import SelectDropdown from 'react-native-select-dropdown';
import { DataTable } from 'react-native-paper';
import * as ApiService from '../../Utils/Utils';
import Toast from 'react-native-simple-toast'
import { useFocusEffect } from '@react-navigation/native';
import AuthContext from '../../context/AuthContext';
import Spinner from 'react-native-loading-spinner-overlay/lib';
import { GlobalColor } from '../../constants/Colors';
import { GlobalFontSize } from '../../constants/FontSize';
import Text from '../../components/reusable/Text';

const LeaveViewReport = () => {
  
    const [loader, setLoader] = useState(false);
    const [applyLeave, setapplyLeave] = useState([0]);  
    const [validReason, setValidReason] = useState('Select Reason');
    const { authContext, AppUserData } = useContext(AuthContext);
    // const [comment, setComment] = useState('');
  
    // added for leave page 
    const [LeaveTypes, setLeaveTypes] = useState([]);   
    const [isModalVisible, setModalVisible] = useState(false);
    const [LeaveDetailModal, setLeaveDetailModal] = useState(false);
    const [FinancialYear, setFinancialYear] = useState([]);
    const [EmpLeaveDetail, setEmpLeaveDetail] = useState([]);
    const [modalData, setModalData] = useState([]);
    const [SelectedYear, setSelectedYear] = useState("");  
  
    useFocusEffect(
      React.useCallback(() => {
        const unsubscribe = getleavetypes();
        return () => unsubscribe;
      }, [])
    )
    const fromRef = useRef(null);  
    
    const getleavetypes = () => {
      let apiData = { "UserName": AppUserData?.data?.userId };
      // AppUserData?.data?.userId 222852
      let token = AppUserData.token;
      setLoader(true);
      ApiService.PostMethode('/GetInitialLeave', apiData, token, authContext)
        .then(result => {
          console.log("APiresult getleave types", result);
          setLoader(false);
          if (result.Value) {
            let updatedArray = [];
            result.Value.Table2.forEach((element, index) => {
              updatedArray.push({ ...element, id: index, Type: element.SHORT_NAME, value: element.ABSENCE_ID.replace(/\D/g, "") });
            });
            console.log(updatedArray);
            setLeaveTypes(updatedArray);
          } else {
            Toast.show('No Leave type found');
          }
        })
        .catch(error => {
          setLoader(false);
          console.log('Error occurred==>', error);
          if (error.response) {
            if (error.response.status == 401) {
              console.log('error from api', error.response);
            }
            // client received an error response (5xx, 4xx)
            Toast.show(error.response.data.title);
          } else if (error.request) {
            // client never received a response, or request never left
            Toast.show('Network Error');
            // console.log("error.request", error.request._response);
          } else {
            // anything else
            Toast.show('Session expired login again');
          }
        });
    }

    const getfinancialyear = () => {
      let apiData = {
        "UserName": AppUserData?.data?.userId
      };
      // AppUserData?.data?.userId 222852
      let token = AppUserData.token;
      setLoader(true);
      ApiService.PostMethode('/LeaveStatus', apiData, token, authContext)
        .then(result => {
          console.log("get year financial",result.Value);
          setLoader(false);
          if (result.Value) {
            let reasons = [];
            setFinancialYear(result.Value.Table);
            if (result.Value && result.Value.Table[0].FNYR_YEAR) {
              setSelectedYear(result.Value.Table[0].FNYR_YEAR);
              getEmpLeaveDetail(result.Value.Table[0].FNYR_YEAR);
            }
          } else {
            Toast.show('No Leave type found');
          }
        })
        .catch(error => {
          setLoader(false);
          console.log('Error occurred==>', error);
          if (error.response) {
            if (error.response.status == 401) {
              console.log('error from api', error.response);
            }
            // client received an error response (5xx, 4xx)
            Toast.show(error.response.data.title);
          } else if (error.request) {
            // client never received a response, or request never left
            Toast.show('Network Error');
            // console.log("error.request", error.request._response);
          } else {
            // anything else
            Toast.show('Session expired login again');
          }
        });
    }
  
    const getEmpLeaveDetail = (fnyear) => {
  
      var curryear = ((new Date().getFullYear()).toString()).substring(0, 2);
      var from;
      if (parseInt(((fnyear.toString()).substring(0, 2))) == 99) {
        from = '01-apr-' + (parseInt(curryear) - 10) + ((fnyear.toString()).substring(0, 2));
      } else {
        from = '01-apr-' + curryear + ((fnyear.toString()).substring(0, 2));
      }
      var to = '31-mar-' + curryear + ((fnyear.toString()).substring(2, 4));
      let apiData = {
        "StaffNo": AppUserData?.data?.userId,
        "FromDate": from,
        "ToDate": to
      };
  
      // AppUserData?.data?.userId 222852
      let token = AppUserData.token;
      setLoader(true);
      ApiService.PostMethode('/GetEmplLevDetail', apiData, token, authContext)
        .then(result => {
          // console.log("APiresult GetEmplLevDetail", result);
          setLoader(false);
          let arr = []
          if (result.Value) {
            arr.push(result.Value)
            // console.log("arr",arr);
            setEmpLeaveDetail(...arr);
          } else {
            Toast.show('No Leave type found');
          }
        })
        .catch(error => {
          setLoader(false);
          console.log('Error occurred==>', error);
          if (error.response) {
            if (error.response.status == 401) {
              console.log('error from api', error.response);
            }
            // client received an error response (5xx, 4xx)
            Toast.show(error.response.data.title);
          } else if (error.request) {
            // client never received a response, or request never left
            Toast.show('Network Error');
            // console.log("error.request", error.request._response);
          } else {
            // anything else
            Toast.show('Session expired login again');
          }
        });
    }  
  
    const DeleteLeavePending = (data) => {
  
      let apiData = {
        "UserName": AppUserData?.data?.userId,
        "ApplicationID": data['Application ID']
      }
      // AppUserData?.data?.userId 222852
      let token = AppUserData.token;
      setLoader(true);
      ApiService.PostMethode('/DeleteLeave', apiData, token, authContext)
        .then(result => {
          console.log("APiresult DeleteLeave", result);
          setLoader(false);
          if (result.Result) {
            getEmpLeaveDetail(SelectedYear);
            Toast.show(result.Result);
          } else {
            Toast.show('Unable To delete');
          }
        })
        .catch(error => {
          setLoader(false);
          console.log('Error occurred==>', error);
          if (error.response) {
            if (error.response.status == 401) {
              console.log('error from api', error.response);
            }
            // client received an error response (5xx, 4xx)
            Toast.show(error.response.data.title);
          } else if (error.request) {
            // client never received a response, or request never left
            Toast.show('Network Error');
            // console.log("error.request", error.request._response);
          } else {
            // anything else
            Toast.show('Session expired login again');
          }
        });
    }  
  
    const toggleModal = () => {
      setModalVisible(!isModalVisible);
    };  
    const handleLeave = index => {
      // console.log(index);
      if (index == 1) {
        getfinancialyear()
      }
      setapplyLeave(index);
    };    
  useEffect(()=> {
    handleLeave(1)
  }, []) 

    return (
        <SafeAreaView style={{ flex: 1 }}>
        {/* {
          loader ?
            <Spinner
              visible={loader}
              textContent={'Loading...'}
              textStyle={styles.spinnerTextStyle}
            />
            : null
        } */}
       
          
          
            <View style={{ flexGrow: 1,  }}>
           
                <View style={{ flex: 1 }}>
                  <Text Bold style={{ paddingHorizontal: 0, marginTop: 5 }}>Select Financial Year</Text>
                  <View
                    style={{
                      width: '100%',
                      alignSelf: 'center',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      backgroundColor: '#fff',
                      borderRadius: 0,
                      shadowColor: '#000',
                      shadowOffset: {
                        width: 0,
                        height: 1,
                      },
                      shadowOpacity: 0.18,
                      shadowRadius: 2.0,
                      elevation: 2,
                      marginVertical: 10,
                    }}>
                    <SelectDropdown
                      defaultButtonText={SelectedYear}
                      data={FinancialYear}
                      defaultValue={SelectedYear}
                      defaultValueByIndex={0}
                      buttonStyle={{
                        backgroundColor: 'transparent',
                        width: '100%',
                        height: 50,
                        borderRadius: 0,
                      }}
                      dropdownStyle={{ borderRadius: 0 }}
                      rowTextStyle={{ textAlign: 'left', marginLeft: 5 }}
                      buttonTextStyle={{ textAlign: 'left', marginLeft: 5 }}
                      renderDropdownIcon={isOpened => {
                        return (
                          <FontAwesome
                            name={isOpened ? 'chevron-up' : 'chevron-down'}
                            color={'#444'}
                            size={18}
                          />
                        );
                      }}
                      onSelect={(selectedItem, index) => {
                        getEmpLeaveDetail(selectedItem.FNYR_YEAR);
                        setSelectedYear(selectedItem.FNYR_YEAR);
                        // console.log(selectedItem, index);
                      }}
                      buttonTextAfterSelection={(selectedItem, index) => {
                        return selectedItem.FNYR_YEAR;
                      }}
                      rowTextForSelection={(item, index) => {
                        return item.FNYR_YEAR;
                      }}
                    />
                  </View>
  
  
                  <Text style={{ textAlign: 'center' }}>
                    Tap on Leave To View Details
                  </Text>
  
                  {/* Headings */}
                  <View showsVerticalScrollIndicator={false} style={styles.container}> 
  
                  <View style={{ flex: 1, paddingHorizontal: 0, marginTop: 5 }}>
                    <DataTable
                      style={{
                        width: '100%',
                        backgroundColor: '#fff',
                        // marginVertical: '%',
                      }}>
                      <DataTable.Header style={{ backgroundColor: GlobalColor.White }}>
                        <DataTable.Title>
                          <Text Bold style={{ color: GlobalColor.Primary, fontSize: GlobalFontSize.Small }}>Date</Text>
                        </DataTable.Title>
                        <DataTable.Title numeric>
                          <Text Bold style={{ color: GlobalColor.Primary, fontSize: GlobalFontSize.Small }}>Type</Text>
                        </DataTable.Title>
                        <DataTable.Title numeric>
                          <Text Bold style={{ color: GlobalColor.Primary, fontSize: GlobalFontSize.Small }}>Period</Text>
                        </DataTable.Title>
                        <DataTable.Title numeric>
                          <Text Bold style={{ color: GlobalColor.Primary, fontSize: GlobalFontSize.Small }}>Status</Text>
                        </DataTable.Title>
                      </DataTable.Header>
  
                      <FlatList
                        data={EmpLeaveDetail}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) =>
  
  
                        (
  
                          <View style={{ flex: 1 }} key={item['Application ID']}>
                            <TouchableOpacity
                              style={{ flex: 1 }}
                              key={item.id}
                              onPress={() => {
                                setModalData(item)
                                setLeaveDetailModal(true)
                              }}>
                              <DataTable.Row
                                style={{ borderBottomWidth: 1, paddingVertical: 5, }}>
                                <View
                                  style={{
                                    flexDirection: 'column',
                                    // marginTop: '2%',
                                  }}>
                                  <DataTable.Cell >
                                                                      
                                      {item['From Date']}
                                      {/* {item['To Date']} */}
  
                                  </DataTable.Cell>
                                </View>
  
                                <DataTable.Cell numeric>{item['Leave Type']}</DataTable.Cell>
                                <DataTable.Cell numeric>
                                  {item.Period}
                                </DataTable.Cell>
                                <DataTable.Cell numeric>
                                  {item.Status === 'Approved' ? (
                                    <Text style={{ color: 'green' }}>{item.Status}</Text>
                                  ) : (
                                    <Text style={{ color: 'red' }}>{item.Status}</Text>
                                  )}
                                </DataTable.Cell>
                              </DataTable.Row>
                            </TouchableOpacity>
                          </View>
                        )}
                      />
                    </DataTable>
                    <Modal
                      isVisible={LeaveDetailModal}
                      // animationType="slide"
                      transparent={true}
                    >
                      <View style={{ backgroundColor: '#fff', padding: 10, borderRadius: 0 }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingBottom: 15,
                            paddingVertical: 5,
                            
                          }}>
                          <Text
                            Bold
                            style={{
                              fontSize: GlobalFontSize.H4,
                              color: GlobalColor.Primary
                            }}>
                            Leave Details
                          </Text>
  
                          <TouchableOpacity onPress={() => setLeaveDetailModal(!LeaveDetailModal)}>
                            <Ionicons
                              name="close-circle-outline"
                              size={30}
                              color={GlobalColor.Danger}
                            />
                          </TouchableOpacity>
                        </View>
  
  
  
                        <View style={{ flexDirection: 'row', }}>
                          <View style={{ width: '90%', }}>
                            <Text style={{ fontWeight: "700", marginVertical: 8 }}>
                              Leave Type : {modalData["Leave Type"]}
                            </Text>
                            <Text style={{ fontWeight: "700", marginVertical: 8 }}>
                              Leave From : {modalData["From Date"]}
                            </Text>
                            <Text style={{ fontWeight: "700", marginVertical: 8 }}>
                              Leave To : {modalData["To Date"]}
                            </Text>
                            <Text style={{ fontWeight: "700", marginVertical: 8 }}>
                              No of Days : {modalData.Days}
                            </Text>
                            <Text style={{ fontWeight: "700", marginVertical: 8 }}>
                              Planned/Unplanned : {modalData['Planned/Unplanned']}
                            </Text>
                            <Text style={{ fontWeight: "700", marginVertical: 8 }}>
                              Period : {modalData.Period}
                            </Text>
                            <Text style={{ fontWeight: "700", marginVertical: 8 }}>
                              Reason : {modalData.Reason}
                            </Text>
                            <Text style={{ fontWeight: "700", marginVertical: 12 }}>
                              Remark :
                            </Text>
                            <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'flex-end' }}>
  
                              {
                                modalData.Status && modalData.Status.toLowerCase() == 'pending' ? (
                                  <TouchableOpacity
                                    style={{ padding: 12, borderRadius: 5, backgroundColor: GlobalColor.Secondary, minWidth: 100, marginRight: 25 }}
                                    onPress={() => {
                                      setLeaveDetailModal(!LeaveDetailModal);
                                      DeleteLeavePending(modalData);
                                    }}>
                                    <Text style={{ color: '#fff', alignSelf: 'center' }} Bold>Delete</Text>
                                  </TouchableOpacity>
                                ) : null
                              }
                              <TouchableOpacity
                                style={{ padding: 12, borderRadius: 5, backgroundColor: GlobalColor.Secondary, minWidth: 100 }}
                                onPress={() => {
                                  setLeaveDetailModal(!LeaveDetailModal)
                                }}>
                                <Text style={{ color: '#fff', alignSelf: 'center' }} Bold>Okay</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      </View>
                    </Modal>
  
                  </View>
                </View>
           
            </View>
          </View>
    
      </SafeAreaView>
    )
}

// define your styles
const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        width: '100%',
        backgroundColor: GlobalColor.PrimaryLight
    },
    tabsContainerStyle: {
        marginTop: 10,
        borderRadius: 0,
        width: '100%',

    },
    tabStyle: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderRadius: 0,
        borderColor: GlobalColor.Secondary
    },
    tabTextStyle: {
        fontSize: GlobalFontSize.P,
        color: 'grey',
        fontFamily: 'Roboto-Bold',
    },
    activeTabStyle: {
        backgroundColor: GlobalColor.PrimaryLight,
        borderBottomWidth: 4,
        borderBottomColor: GlobalColor.Secondary,
    },
    activeTabTextStyle: {
        color: GlobalColor.Secondary,
    },
    circleBox: {
        width: "16.6%",
        height: 60,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
    },
    circle: {
        borderWidth: 1,
        borderColor: '#00B4DB',
        width: 40,
        height: 40,
        borderRadius: 40,
        padding: 5,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        // marginBottom: 10,
        // marginRight:15
        // marginHorizontal: 28,
    },
    box: {
        // width: '90%',
        padding: 5,
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.18,
        shadowRadius: 2.0,
        elevation: 5,
    },
    comment: {
        marginTop: 20,
        alignSelf: 'center',
        width: '100%',
        maxHeight: 100,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 10
    },
    spinnerTextStyle: {
        color: '#fff'
    },
    addtnlBtn: {
        position: 'absolute',
        right: 10,
        top: 0,
        zIndex: 55555
    },
    checkboxContainer: {
        width: "50%",
        flexDirection: 'row',
        alignItems: 'center'
    },
    checkboxText: {
        marginLeft: 2
    }
});

export default LeaveViewReport