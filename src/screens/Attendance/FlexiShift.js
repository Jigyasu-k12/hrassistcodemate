//import liraries
import React, {useContext, useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  TextInput,
  SafeAreaView,
  Alert
} from 'react-native';
import SegmentedControlTab from 'react-native-segmented-control-tab';
import DatePicker from 'react-native-date-picker';
import moment from 'moment';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Modal from 'react-native-modal';
import LinearGradient from 'react-native-linear-gradient';
import {DataTable} from 'react-native-paper';
import * as ApiService from '../../Utils/Utils';
import Toast from 'react-native-simple-toast'
import AuthContext from '../../context/AuthContext';
import Spinner from 'react-native-loading-spinner-overlay';
import { useFocusEffect } from '@react-navigation/native';
import { GlobalColor } from '../../constants/Colors';
import { GlobalFontSize } from '../../constants/FontSize';
import Text from '../../components/reusable/Text';
import TextInput2 from '../../components/reusable/TextInput';
import Button from './../../components/reusable/Button';
import ShiftDetails from './ShiftDetails';


const FlexiShift = () => {

    const [fromDate, setFromDate] = useState(new Date());
    const [toDate, setToDate] = useState(new Date());
    const [selectDate, setSelectDate] = useState(new Date());
    const [open, setOpen] = useState(false);
    const [second, setSecond] = useState(false);
    const [textinputDate, setTextinputDate] = useState('');
    const [textinputSecondDate, setTextinputSecondDate] = useState('');
    const [openThird, setOpenThird] = useState(false);
    const [Shift, setShift] = useState([]);
    const [shiftData, setShiftData] = useState([]);
    const [shiftType, setShiftType] = useState([]);
    const [shiftName, setShiftName] = useState('');
    const [currentShift, setCurrentShift] = useState('');
    const [shiftStatus, setShiftStatus] = useState([]);
    const [flexiShiftElig, setFlexiShiftElig] = useState('');
    const [flexidate, setFlexiDate] = useState([]);
    const [isModalVisible, setModalVisible] = useState(false);
    const [choseDate, setChoseDate] = useState('');
    const { authContext, AppUserData } = useContext(AuthContext);
    const [loader,setLoader] = useState(false)
    const [horizental, setHorizental] = useState(false);
  
  
  
  
  
  
      const LoadInitial= ()=>{
        FlexiShiftElig()
        // GetEmplShift()
        flexiShiftPlanLov()
        CurrentShift()
        FlexiShiftStartDateLOV()
        RptShiftStatus()
      }
  
      // ENd
    // useEffect(() => {
    //   FlexiShiftElig()
    //   GetEmplShift()
    //   flexiShiftPlanLov()
    //   CurrentShift()
    //   FlexiShiftStartDateLOV()
    //   RptShiftStatus()
    // }, [])
  
    useFocusEffect(
      React.useCallback(() => {
        const unsubscribe = LoadInitial();
        return () => unsubscribe;
      }, [])
    )
  
    
      const handleShift = index => {
        setShift(index);
      };
  
  
  // SHIFT DETAILS API
    const GetEmplShift = () => {
      let userId = AppUserData?.data?.userId;
      let token = AppUserData.token;
      let fromdate =moment(fromDate).format('DD-MMM-YYYY');
      let toDate =moment(toDate).format('DD-MMM-YYYY');
      let apiData = {
        "FromDate": fromdate,
        "ToDate":toDate,
        "EmplID":userId
        };
      setLoader(true);
      ApiService.PostMethode('/GetEmplShift', apiData, token, authContext)
        .then(result => {
          console.log("GetEmplShift", result);
          setLoader(false);
          let ApiResult = result.Value
          setShiftData(ApiResult)
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
  // END 
  
  // FLEXI SHIFT API
  
  const flexiShiftPlanLov = () => {
    let userId = AppUserData?.data?.EMPL_NAME;
    let token = AppUserData.token;
    let apiData = {
      "UserName": userId,
      };
    setLoader(true);
    ApiService.PostMethode('/flexiShiftPlanLov', apiData, token, authContext)
      .then(result => {
        console.log("flexiShiftPlanLov", result);
        setLoader(false);
        let ApiResult = result.Value
        setShiftType(ApiResult)
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
  
  
  const CurrentShift = () => {
    let userId = AppUserData?.data?.userId;
    let token = AppUserData.token;
    let apiData = {
      "StaffNo": userId,
      };
    setLoader(true);
    ApiService.PostMethode('/CurrentShift', apiData, token, authContext)
      .then(result => {
        console.log("CurrentShift", result);
        setLoader(false);
        let ApiResult = result.Result
        setCurrentShift(ApiResult)
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
  
  
  
  const SubmitFlexiShiftPlan = () => {
    let userId = AppUserData?.data?.userId;
    let token = AppUserData.token;
    let apiData = {
      "Staffid": userId,
      };
    setLoader(true);
    ApiService.PostMethode('/SubmitFlexiShiftPlan', apiData, token, authContext)
      .then(result => {
        console.log("SubmitFlexiShiftPlan", result);
        setLoader(false);
        let ApiResult = result.Result
        alert(ApiResult)
        // setSubmitShift(ApiResult)
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
  
  
  const RptShiftStatus = () => {
    let userId = AppUserData?.data?.userId;
    let token = AppUserData.token;
    let apiData = {
      "StaffNo": userId,
    };
    setLoader(true);
    ApiService.PostMethode('/RptShiftStatus', apiData, token, authContext)
      .then(result => {
        console.log("RptShiftStatus", result);
        setLoader(false);
        let ApiResult = result.Value
        setShiftStatus(ApiResult)
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
  
  const FlexiShiftElig = () => {
    let userId = AppUserData?.data?.userId;
    let token = AppUserData.token;
    let apiData = {
      "UserName": userId,
      };
    setLoader(true);
    ApiService.PostMethode('/FlexiShiftElig', apiData, token, authContext)
      .then(result => {
        console.log("FlexiShiftElig", result.Result);
        setLoader(false);
        let ApiResult = result.Result
        setFlexiShiftElig(ApiResult)
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

  const FlatList_Header = () => {
    return (
      <View style={{
        width: "100%",
        justifyContent: 'space-between',
        paddingHorizontal:10,
        paddingVertical:15,
        backgroundColor:GlobalColor.White,
        flexDirection:'row', 
      }}>        
        <Text Bold style={[styles.HeaderColumn, {flex:0.40}]}>Shift</Text>
        <Text Bold style={[styles.HeaderColumn, {flex:0.40}]}>Applicable Date</Text>
        <Text Bold style={[styles.HeaderColumn, {flex:0.20}]}>Status</Text>
      </View>
    );
  }
  
  
  const FlexiShiftStartDateLOV = () => {
    let userId = AppUserData?.data?.userId;
    let token = AppUserData.token;
    let apiData = {
      "StaffNo": userId,
      };
    setLoader(true);
    ApiService.PostMethode('/FlexiShiftStartDateLOV', apiData, token, authContext)
      .then(result => {
        console.log("FlexiShiftStartDateLOV", result.Result);
        setLoader(false);
        let ApiResult = result.Result
        setFlexiDate(ApiResult)
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
  
  const handleSubmit = () => {
    if(shiftName==''){
      alert("Please select shift name")
    }
    else if(choseDate==''){
      alert("Please select Date")
    }
    else{
      
      submitAlert('Warning', 'Are You Sure?', 'yes', 'No');
    }
  }
  
    
  
    const toggleModal = () => {
      setModalVisible(!isModalVisible);
    };
  
    const submitAlert = (title, body, btnTxt, btnTxt2) => {
      Alert.alert(title, body, [
        {
          text: btnTxt,
          onPress: () => {
            SubmitFlexiShiftPlan();
            RptShiftStatus();
          },
        },
        {
          text: btnTxt2,
          onPress: () => {
            console.log('No Pressed');
          },
        },
      ]);
    };
  
  
    const rederReason = ({item}) => {
      return (
        <View
          style={{
            padding: 10,
            margin: 2,
            borderBottomWidth: 1,
            borderBottomColor: GlobalColor.Secondary,
            paddingVertical:15
          }}>
          <TouchableOpacity
            onPress={() => {
              // console.log('selected reason', item);
              setShiftName(item.SHIFT_DESCRIPTION);
              setModalVisible(false);
              console.log('data', shiftName);
            }}>
            <Text style={{ paddingHorizontal: 10}}>
              {item.SHIFT_DESCRIPTION}
            </Text>
          </TouchableOpacity>
        </View>
      );
    };
  return (
    <SafeAreaView style={styles.container}>
    {loader == true ? (
       <Spinner
         visible={loader}
         textContent={'Loading...'}
         textStyle={styles.spinnerTextStyle}
       />
     ) : null} 
    
  
     <ScrollView style={{ flex:1, paddingHorizontal:10 }}>
       <Text style={{paddingVertical: 15, paddingHorizontal: 0,}} Bold>
         Shift Name
       </Text>
       <View style={styles.box}>
         <TouchableOpacity
           onPress={toggleModal}
           style={{
             flexDirection: 'row',
             alignItems: 'center',
             paddingHorizontal: 10,
             paddingVertical:5,
             justifyContent: 'space-between',
           }}>
          {/* {shiftName==''} */}
          <Text Bold>{shiftName !==''? shiftName :(<Text Bold> Select Shift</Text>)}</Text>
           <Ionicons name="arrow-forward-outline" color={'#23d'} size={25} />
           <Modal isVisible={isModalVisible}>
             <View
                 style={{
                   height: '100%',
                   backgroundColor: GlobalColor.White,
                   borderRadius: 0,
                 }}
               >
                 <View
                   style={{
                     flexDirection: 'row',
                     alignItems: 'center',
                     justifyContent: 'space-between',
                     paddingHorizontal: 20,
                     paddingVertical: 5,
                   }}>
                   <Text
                     Bold
                     style={{
                       color: GlobalColor.Primary,
                       fontSize: GlobalFontSize.H4,
                     }}>
                     Select Shift
                   </Text>

                   <TouchableOpacity onPress={toggleModal}>
                     <Ionicons
                       name="close-circle-outline"
                       size={30}
                       color={GlobalColor.Danger}
                     />
                   </TouchableOpacity>
                 </View>
                 <FlatList
                   data={shiftType}
                   keyExtractor={item => item.id}
                   renderItem={rederReason}
                 />
             </View>
           </Modal>
         </TouchableOpacity>
       </View>


       <Text Bold style={{paddingVertical: 15, paddingHorizontal: 0}}>
         Applicable Date
       </Text>

       <DatePicker
         modal
         open={openThird}
         date={selectDate}
         mode="date"
         onConfirm={selectDate => {
           setOpenThird(false);
           setSelectDate(selectDate);
           let formatDate = moment(selectDate).format('MMM Do YYYY');
           setChoseDate(formatDate);
           console.log(choseDate);
         }}
         onCancel={() => {
           setOpenThird(false);
         }}
       />

       <View style={styles.inputBox}>
         <TextInput2
           placeholder="Select Date"
           width={'90%'}
           editable={false}
           paddingHorizontal={10}
           value={choseDate}
         />
         <TouchableOpacity onPress={() => setOpenThird(true)}>
           <Ionicons name="calendar-outline" size={30} color={GlobalColor.Secondary} />
         </TouchableOpacity>
       </View>



       <Text Bold style={{paddingVertical: 15, paddingHorizontal: 0}}>
         Current Shift
       </Text>
       <View style={styles.inputBox}>
         <TextInput2
           value={currentShift}
           width={'80%'}
           editable={false}
           paddingHorizontal={10}
         />
       </View>
       {/* Button */}
       
       {
         flexiShiftElig==='N' ? (
           <View style={{  marginTop:10, width:"100%",alignSelf:'center' }}>
             <Button
               onPress={() => {
                 handleSubmit()
               }}
               title={"Submit"}
             ></Button>
         </View>
         ):null
       }


       {/* Report */}
       <Text style={{textAlign: 'center',marginTop:5, marginBottom:5}}>Report</Text>
         {/* <DataTable.Header style={{backgroundColor: GlobalColor.White}}>
           <DataTable.Title>
             <Text Bold style={{color: GlobalColor.Primary, fontSize: GlobalFontSize.Small}}>Shift</Text>
           </DataTable.Title>
           <DataTable.Title numeric>
             <Text Bold style={{color: GlobalColor.Primary, fontSize: GlobalFontSize.Small}}>
               Applicable Date
             </Text>
           </DataTable.Title>
           <DataTable.Title numeric>
             <Text Bold style={{color: GlobalColor.Primary, fontSize: GlobalFontSize.Small}}>Status</Text>
           </DataTable.Title>
         </DataTable.Header> */}

         
         <FlatList
           data={shiftStatus}
           keyExtractor={item => item.id}
           ListHeaderComponent={FlatList_Header}
           ListHeaderComponentStyle={{ borderBottomColor: GlobalColor.Secondary, borderBottomWidth: 1 }}
           renderItem={({item}) => (
             <View  style={{
               width: '100%',
               backgroundColor: '#fff',
               marginVertical: 0,
               flexDirection:'row',
               justifyContent:'space-between',
               padding:10, 
               paddingVertical:15, 
               borderBottomWidth:0.4,
               borderBottomColor:GlobalColor.LightDark
             }}>
               <Text style={{ flex:0.40 }}>{item.SHFT_START_SHIFT}</Text>
               <Text style={{ flex:0.40 }}>{moment(item.SHFT_START_DATE).format('M/DD/YYYY')}</Text>
               <Text style={{ flex:0.20 }}>{item.STATUS === 'Approved' ? (
                     <Text style={{color: 'green'}}>{item.STATUS}</Text>
                   ) : (
                     <Text style={{color: 'green'}}>{item.STATUS}</Text>
                   )}
              </Text>
             </View>
           )}
         />
     </ScrollView>

 </SafeAreaView>
  )
}
// define your styles
const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:GlobalColor.PrimaryLight
    },
    box: {
      width: '100%',
      padding: 5,
      paddingVertical:10,
      backgroundColor: '#FFF',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.18,
      shadowRadius: 2.0,
      elevation: 5,
      borderRadius: 0,
    },
      inlineDatepicker:{
        width: '100%',
        alignSelf: 'center',
        borderWidth: 1,
        borderColor: '#fff',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexDirection: 'row',
        padding: 10,
        marginVertical: 0,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      },
    inputBox: {
      width: '100%',
      backgroundColor: '#fff',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingRight: 10,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.18,
      shadowRadius: 2.0,
      elevation: 5,
      borderRadius: 0,
    },
    tabsContainerStyle: {
      marginTop: 10,
      borderRadius:0,
      width:'100%',
    },
    tabStyle: {
      paddingVertical: 10,
      paddingHorizontal:15,
      borderWidth: 1,
      borderRadius:0,
      borderColor:GlobalColor.Secondary
    },
    tabTextStyle: {
      fontSize:GlobalFontSize.P,
      color: 'grey',
      fontFamily:'Roboto-Bold',
    },
    activeTabStyle: {
      backgroundColor: GlobalColor.PrimaryLight,
      borderBottomWidth: 4,
      borderBottomColor: GlobalColor.Secondary,
    },
    activeTabTextStyle: {
      color: GlobalColor.Secondary,
    },
    dataRow:{
      width:'100%',
      justifyContent:'space-between',
      flexDirection:'row',
      borderBottomWidth:0.5,
      paddingHorizontal:10, 
      paddingVertical:5
    },
    addtnlBtn:{
      position:'absolute',
      right:10,
      top:0,
      zIndex:55555
    },
    HeaderColumn:{
      flex:0.25,
    },
    spinnerTextStyle: {
      color: '#fff'
    },
  });
export default FlexiShift