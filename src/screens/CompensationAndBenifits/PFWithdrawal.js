//import liraries
import React, { useEffect, useState, useContext } from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView, Modal, TextInput, SectionList, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import AuthContext from '../../context/AuthContext';
import * as ApiService from '../../Utils/Utils';
import Text from '../../components/reusable/Text';
import { ThemeGlobalColor as GlobalColor, ThemeColor } from '../../constants/Colors';
import ListEmptyComponent from '../../components/reusable/ListEmptyComponent';
import { LoadingScreen } from '../../components/reusable/LoadingScreen';
import { Decrypt } from '../../Service/Helper';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import RenderHtml from 'react-native-render-html';
import { useWindowDimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const PFWithdrawal = () => {
    const { width } = useWindowDimensions();
    const scrollViewRef = React.useRef(null);
    const inputViewRef = React.useRef(null);
    const [loader, setLoader] = useState(false)
    const [employeePf, setEmployeePf] = useState();
    const [employerPf, setEmployerPf] = useState();
    const [netBalance, setNetBalance] = useState();
    const { authContext, AppUserData } = useContext(AuthContext);
    const [refresh, setrefresh] = useState(false);

    // ---------- PF Withdrawal states ----------
    const [purposeList, setPurposeList] = useState([]); // raw list from GetPFPurpose
    const [purposeLoader, setPurposeLoader] = useState(false);
    const [purposeModalVisible, setPurposeModalVisible] = useState(false);
    const [selectedPurpose, setSelectedPurpose] = useState(null); // { code, label, category }

    const [eligLoader, setEligLoader] = useState(false);
    const [employeeShare, setEmployeeShare] = useState(null);
    const [employerShare, setEmployerShare] = useState(null);
    const [eligibleAmount, setEligibleAmount] = useState(null);

    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [amountError, setAmountError] = useState('');
    const [declarationChecked, setDeclarationChecked] = useState(false);
    const [submitLoader, setSubmitLoader] = useState(false);

    // ---------- Screen Open Configuration ----------
    const [isPFWithdrawalEnabled, setIsPFWithdrawalEnabled] = useState(false);
    const [screenConfigLoader, setScreenConfigLoader] = useState(true);

    // ---------- Declaration Statement states ----------
    const [declarationHTML, setDeclarationHTML] = useState('');
    const [declarationLoader, setDeclarationLoader] = useState(false);

    // ---------- Calculation Formula states ----------
    const [calculationModalVisible, setCalculationModalVisible] = useState(false);
    const [withdrawMasterData, setWithdrawMasterData] = useState(null);
    const [masterLoader, setMasterLoader] = useState(false);

    const stopLoader = () => {
        setLoader(false);
        setrefresh(false);
    }

   // // Old Pf Balance Api - COMMENTED OUT
  // const PfBalance = async (year) => {
  //   //set Loader
  //   setLoader(true);

  //   try {

  //     //get Api Data
  //     let result = await ApiService.PostMethode('/GetPFStatement', {
  //       "EmplID": AppUserData?.data?.userId,
  //       "FNYR": year
  //     }, AppUserData.token)

  //     //stop Loader
  //     stopLoader();
  //     if(result.Value){
  // // $&
  //       //Set Data
  //       let CB1_CB2 = Decrypt(result.Value.Table3[0].PFST_CB1_CB2)
  //       let PFST_MUL_CB3 = Decrypt(result.Value.Table3[0].PFST_MUL_CB3)
  //       let NetBalance = parseFloat(CB1_CB2) + parseFloat(PFST_MUL_CB3);

  // // $&

  //       setEmployeePf(CB1_CB2)
  //       setEmployerPf(PFST_MUL_CB3)
  //       setNetBalance(parseFloat(NetBalance).toFixed(2))
  //     }

  //   } catch (error) {
  //     //stop Loader
  //     stopLoader()
  //     //Show Error Massage
  //     ApiService.showErrorMessage(error, authContext);

  //   }
  // };

  // New PF Total Api
  const PfBalance = async (year) => {
    //set Loader
    setLoader(true);

    try {
      //get Api Data
      let result = await ApiService.PostMethode('/GetPFTotal', {
        "EmployeeID": AppUserData?.data?.userId
      }, AppUserData.token)

      //stop Loader
      stopLoader();
      if(result.Value){
        // Response format: "128112.17;128112.17"
        // Split the value by semicolon
        let values = result.Value.split(';');
        let employeePfValue = values[0] || '0';
        let employerPfValue = values[1] || '0';
        let NetBalance = parseFloat(employeePfValue) + parseFloat(employerPfValue);

        setEmployeePf(parseFloat(employeePfValue).toFixed(2))
        setEmployerPf(parseFloat(employerPfValue).toFixed(2))
        setNetBalance(parseFloat(NetBalance).toFixed(2))
      }

    } catch (error) {
      //stop Loader
      stopLoader()
      //Show Error Massage
      ApiService.showErrorMessage(error, authContext);

    }
  };

    useEffect(() => {
        // PfBalance()
        getfinancialyear();
        checkPFWithdrawalScreenOpen();
        getPFPurposeList();
    }, []);


    // useFocusEffect(
    //     React.useCallback(() => {
    //       const unsubscribe = getfinancialyear();
    //       return () => unsubscribe;
    //     }, []),
    //   );

      const getfinancialyear = () => {
        let apiData = {
          UserName: AppUserData?.data?.username,
        };
        // AppUserData?.data?.userId 222852
        let token = AppUserData.token;
        setLoader(true);
        ApiService.PostMethode('/LeaveStatus', apiData, token, authContext)
          .then(result => {
// $&
            stopLoader(false);
            if (result.Value) {
            //   setFinancialYear(result.Value.Table1);
              if (result.Value && result.Value.Table1[0].FNYR_YEAR) {
                PfBalance(Decrypt(result.Value.Table1[0].FNYR_YEAR));
              }
            } else {
              Toast.show('No Leave type found');
            }
          })
          .catch(error => {
            stopLoader(false);
            // // console.log($1);
            ApiService.showErrorMessage(error, authContext);
          });
      };

    // ---------- Check if PF Withdrawal screen should be shown ----------
    const checkPFWithdrawalScreenOpen = async () => {
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
                    setIsPFWithdrawalEnabled(true);
                } else {
                    setIsPFWithdrawalEnabled(false);
                }
            } else {
                setIsPFWithdrawalEnabled(false);
            }
        } catch (error) {
            setScreenConfigLoader(false);
            setIsPFWithdrawalEnabled(false);
            ApiService.showErrorMessage(error, authContext);
        }
    };

    // ---------- PF Withdrawal: Get Purpose List ----------
    const getPFPurposeList = async () => {
        setPurposeLoader(true);
        try {
            let result = await ApiService.PostMethode('/GetPFMaster', {
                "PuprposeCode": ""
            }, AppUserData.token, authContext);

            setPurposeLoader(false);

            if (result.Value) {
                // Filter by ACTIVE FLAG = "Y" and group by CATEGORY for a sectioned dropdown
                const grouped = {};
                result.Value.forEach(item => {
                    // Only include items with ACTIVE FLAG = "Y"
                    if (item['ACTIVE FLAG'] === 'Y') {
                        const category = item.CATEGORY;
                        if (!grouped[category]) {
                            grouped[category] = [];
                        }
                        grouped[category].push({
                            code: item['PURPOSE CODE'],
                            label: item['PURPOSE DESC'],
                            category: item.CATEGORY,
                        });
                    }
                });

                const sections = Object.keys(grouped).map(category => ({
                    title: category,
                    data: grouped[category],
                }));

                setPurposeList(sections);
            }
        } catch (error) {
            setPurposeLoader(false);
            ApiService.showErrorMessage(error, authContext);
        }
    };

    // ---------- PF Withdrawal: Get Eligibility on purpose select ----------
    const getPFEligibility = async (purposeCode) => {
        setEligLoader(true);
        // reset previous values while fetching new eligibility
        setEmployeeShare(null);
        setEmployerShare(null);
        setEligibleAmount(null);
        setWithdrawAmount('');
        setAmountError('');

        try {
            let result = await ApiService.PostMethode('/GetPFElig', {
                "EmployeeID": AppUserData?.data?.userId,
                "PurposeCode": purposeCode,
                "PFTimes": ""
            }, AppUserData.token, authContext);

            setEligLoader(false);

            if (result.Value) {
                // Format: "124014.17#171C8F.17~186021.255#"
                // sharePart -> "employeeShare#employerShare", eligPart -> "eligibleAmount#"
                // Error format: "#~#YOU ARE ELIGIBIL FOR ADVANCE PF MAX 0 TIMES DURING "
                const [sharePart, eligPart] = result.Value.split('~');
                const [empShare, emprShare] = (sharePart || '').split('#');
                const eligAmt = (eligPart || '').replace('#', '');

                // Check if we have valid amounts (empShare and emprShare should not be empty)
                if (empShare && emprShare && !isNaN(parseFloat(empShare)) && !isNaN(parseFloat(emprShare))) {
                    // Valid amounts received
                    setEmployeeShare(empShare);
                    setEmployerShare(emprShare);
                    setEligibleAmount(eligAmt);
                } else {
                    // No valid amounts - show error message from API
                    const errorMessage = eligAmt || 'You are not eligible for PF withdrawal for this purpose.';
                    Alert.alert(
                        'Eligibility Check',
                        errorMessage,
                        [{ text: 'OK', onPress: () => {
                            // Reset the purpose selection
                            setSelectedPurpose(null);
                        }}]
                    );
                }
            }
        } catch (error) {
            setEligLoader(false);
            ApiService.showErrorMessage(error, authContext);
        }
    };

    // ---------- Get Declaration Statement ----------
    const getDeclarationStatement = async (purposeLabel) => {
        setDeclarationLoader(true);
        try {
            let result = await ApiService.PostMethode('/GetLOVM', {
                "SystemName": "PFAUTOMATION",
                "ReportName": "PFAUTOMATION",
                "LOVName": "PFAUTOMATION",
                "LOVCode": "",
                "UserName": AppUserData?.data?.userId
            }, AppUserData.token, authContext);

            setDeclarationLoader(false);

            if (result.Value && result.Value.length > 0) {
                const declarationData = result.Value.find(item => item.LOVM_VALUE_CODE === 'DECLARE_STAT');
                if (declarationData && declarationData.LOVM_VALUE_DESC) {
                    // Replace {{PURPOSE}} with the actual purpose label
                    const htmlWithPurpose = declarationData.LOVM_VALUE_DESC.replace(/\{\{PURPOSE\}\}/g, purposeLabel);
                    setDeclarationHTML(htmlWithPurpose);
                }
            }
        } catch (error) {
            setDeclarationLoader(false);
            ApiService.showErrorMessage(error, authContext);
        }
    };

    const onSelectPurpose = (item) => {
        setSelectedPurpose(item);
        setPurposeModalVisible(false);
        getPFEligibility(item.code);
        getDeclarationStatement(item.label);
    };

    // ---------- Get Withdrawal Master for Calculation Formula ----------
    const getWithdrawMaster = async (purposeCode) => {
        setMasterLoader(true);
        try {
            let result = await ApiService.PostMethode('/GetWithdrawMaster', {
                "PuprposeCode": purposeCode
            }, AppUserData.token, authContext);

            setMasterLoader(false);

            if (result.Value && result.Value.length > 0) {
                setWithdrawMasterData(result.Value[0]);
                setCalculationModalVisible(true);
            }
        } catch (error) {
            setMasterLoader(false);
            ApiService.showErrorMessage(error, authContext);
        }
    };

    // ---------- PF Withdrawal: Amount validation ----------
    const onChangeWithdrawAmount = (val) => {
        // allow only positive integers (no decimals, no negative)
        const cleaned = val.replace(/[^0-9]/g, '');
        setWithdrawAmount(cleaned);

        if (!cleaned) {
            setAmountError('');
            return;
        }
        const numeric = parseInt(cleaned, 10);
        const eligibleAmountRounded = eligibleAmount ? Math.floor(parseFloat(eligibleAmount)) : 0;

        if (isNaN(numeric) || numeric <= 0) {
            setAmountError('Please enter a valid amount');
        } else if (eligibleAmount && numeric > eligibleAmountRounded) {
            setAmountError(`Amount cannot be greater than eligible amount (Rs.${eligibleAmountRounded})`);
        } else {
            setAmountError('');
        }
    };

    const isSubmitDisabled = () => {
        if (!selectedPurpose) return true;
        if (!withdrawAmount || amountError) return true;
        if (eligibleAmount === null) return true;
        if (!declarationChecked) return true;
        if (submitLoader) return true;
        return false;
    };

    // ---------- PF Withdrawal: Submit ----------
    const submitPFWithdrawal = async () => {
        if (isSubmitDisabled()) return;

        setSubmitLoader(true);
        try {
            let totalBalance = (parseFloat(employeeShare || 0) + parseFloat(employerShare || 0)).toFixed(2);

            let apiData = {
                "RequestID": "",
                "RequestStatus": "Draft",
                "Action": "Submit",
                "CompCode": AppUserData?.data?.emplcompcode || "",
                "EmployeeID": AppUserData?.data?.userId,
                "OnbehalfFlag": "N",
                "PurposeCode": selectedPurpose?.code,
                "RequestedAmount": withdrawAmount,
                "TotalBalance": totalBalance,
                "EmployeeShare": employeeShare,
                "EmployerShare": employerShare,
                "EligAmount": eligibleAmount,
                "DeclarationFlag": declarationChecked ? "Y" : "N",
                "MakerID": "",
                "MakerActionDate": "",
                "MakerEmplDed": "",
                "MakerEmprDed": "",
                "MakerRemarks": "",
                "CheckerID": "",
                "CheckerActionDate": "",
                "CheckerRemarks": "",
                "ApprovedAmount": "",
                "RejectionReason": "",
                "Comments": "",
                "UserName": AppUserData?.data?.userId || ""
            };

            // Log the exact payload being sent to UpdatePFAction
            console.log('UpdatePFAction Request Payload:', JSON.stringify(apiData, null, 2));

            let result = await ApiService.PostMethode('/UpdatePFAction', apiData, AppUserData.token, authContext);

            // Log the raw response received from UpdatePFAction
            console.log('UpdatePFAction Response:', JSON.stringify(result, null, 2));

            setSubmitLoader(false);

            if (result.Value) {
                // Display the response to the user
                const responseMessage = typeof result.Value === 'string'
                    ? result.Value
                    : JSON.stringify(result.Value, null, 2);

                // Check if response indicates success or error
                const isSuccess = responseMessage.toLowerCase().includes('success') ||
                                responseMessage.toLowerCase().includes('submitted') ||
                                responseMessage.toLowerCase().includes('created');
                const isError = responseMessage.toLowerCase().includes('error') ||
                              responseMessage.toLowerCase().includes('failed') ||
                              responseMessage.toLowerCase().includes('already exists');

                const alertTitle = isError ? 'Error' : (isSuccess ? 'Success' : 'PF Withdrawal Status');

                Alert.alert(
                    alertTitle,
                    responseMessage,
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                // Only reset form on success
                                if (isSuccess && !isError) {
                                    setSelectedPurpose(null);
                                    setEmployeeShare(null);
                                    setEmployerShare(null);
                                    setEligibleAmount(null);
                                    setWithdrawAmount('');
                                    setDeclarationChecked(false);
                                    setAmountError('');
                                }
                            }
                        }
                    ]
                );
            } else {
                // If there's no Value in response, show the whole response
                Alert.alert(
                    'Response',
                    JSON.stringify(result, null, 2),
                    [{ text: 'OK' }]
                );
            }
        } catch (error) {
            // Log the error response as well, in case of a failed call
            console.log('UpdatePFAction Error:', JSON.stringify(error, null, 2));
            setSubmitLoader(false);
            ApiService.showErrorMessage(error, authContext);
        }
    };

    if(loader || screenConfigLoader){
        return(
            <SafeAreaView style={{ flex: 1,backgroundColor: '#F5F5F5'  }}>
                <LoadingScreen/>
            </SafeAreaView>
        )
      }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            >
                <ScrollView
                    ref={scrollViewRef}
                    contentContainerStyle={{ paddingBottom: 120 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={[styles.MainCard, { padding: 10,backgroundColor: '#FFFFFF' }]}>
                        <View>
                            <View style={styles.textContainer}>
                                <Text Bold style={{ fontSize: 13}} >Employee's</Text>
                                <Text Bold style={{ fontSize: 13}}>
                                    Rs.{employeePf}
                                </Text>
                            </View>
                            <View style={{ borderBottomWidth:0.5,marginHorizontal:5, borderColor:'#171C8F',}}/>
                            <View style={styles.textContainer}>
                                <Text Bold style={{ fontSize: 13}} >Employer's</Text>
                                <Text Bold style={{ fontSize: 13}}>
                                    Rs.{employerPf}
                                </Text>
                            </View>
                            <View style={{ borderBottomWidth:0.5,marginHorizontal:5, borderColor:'#171C8F',}}/>
                            <View style={styles.textContainer2}>
                                <Text Bold style={{fontSize:16}}>Net Balance</Text>
                                <Text Bold style={{fontSize:16}}>
                                    Rs.{netBalance}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* ---------- PF Withdrawal Section ---------- */}
                    {isPFWithdrawalEnabled && (
                    <View style={[styles.MainCard, { padding: 15, backgroundColor: '#FFFFFF' }]}>
                        <Text Bold style={{ fontSize: 15, marginBottom: 10 }}>PF Withdrawal</Text>

                        {/* Purpose Dropdown Trigger */}
                        <TouchableOpacity
                            style={styles.dropdownTrigger}
                            onPress={() => setPurposeModalVisible(true)}
                            disabled={purposeLoader}
                        >
                            <Text style={{ fontSize: 13, color: selectedPurpose ? '#01044B' : '#171C8F' }}>
                                {purposeLoader ? 'Loading purposes...' : (selectedPurpose ? selectedPurpose.label : 'Select Purpose')}
                            </Text>
                        </TouchableOpacity>

                        {/* Eligibility loader */}
                        {eligLoader && (
                            <View style={{ marginTop: 15 }}>
                                <Text style={{ fontSize: 12, color: '#171C8F' }}>Fetching eligibility...</Text>
                            </View>
                        )}

                        {/* Eligibility Details */}
                        {!eligLoader && eligibleAmount !== null && (
                            <View style={{ marginTop: 15 }}>
                                <View style={styles.textContainer}>
                                    <Text style={{ fontSize: 13 }}>Employee Share</Text>
                                    <Text style={{ fontSize: 13 }}>Rs.{parseFloat(employeeShare).toFixed(2)}</Text>
                                </View>
                                <View style={styles.textContainer}>
                                    <Text style={{ fontSize: 13 }}>Employer Share</Text>
                                    <Text style={{ fontSize: 13 }}>Rs.{parseFloat(employerShare).toFixed(2)}</Text>
                                </View>
                                <View style={{ borderBottomWidth: 0.5, marginHorizontal: 5, borderColor: '#171C8F' }} />
                                <View style={styles.textContainer2}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Text Bold style={{ fontSize: 14 }}>Eligible Amount</Text>
                                        <TouchableOpacity
                                            onPress={() => getWithdrawMaster(selectedPurpose?.code)}
                                            style={{ marginLeft: 8 }}
                                        >
                                            <Ionicons name="information-circle" size={20} color={'#01044B'} />
                                        </TouchableOpacity>
                                    </View>
                                    <Text Bold style={{ fontSize: 14 }}>Rs.{Math.floor(parseFloat(eligibleAmount))}</Text>
                                </View>

                                {/* Amount Input */}
                                <View
                                    ref={inputViewRef}
                                    style={{ marginTop: 10, width: '90%', alignSelf: 'center' }}
                                    onLayout={() => {}}
                                >
                                    <Text style={{ fontSize: 12, marginBottom: 5, color: '#171C8F' }}>Enter Withdrawal Amount (whole numbers only)</Text>
                                    <TextInput
                                        style={styles.amountInput}
                                        keyboardType="number-pad"
                                        placeholder="Enter amount"
                                        value={withdrawAmount}
                                        onChangeText={onChangeWithdrawAmount}
                                        onFocus={() => {
                                            setTimeout(() => {
                                                inputViewRef.current?.measureLayout(
                                                    scrollViewRef.current,
                                                    (x, y) => {
                                                        scrollViewRef.current?.scrollTo({
                                                            y: y - 50,
                                                            animated: true
                                                        });
                                                    },
                                                    () => {}
                                                );
                                            }, 150);
                                        }}
                                    />
                                    {!!amountError && (
                                        <Text style={{ fontSize: 11, color: '#01044B', marginTop: 5 }}>{amountError}</Text>
                                    )}
                                </View>

                                {/* Declaration Statement HTML */}
                                {declarationLoader && (
                                    <View style={{ marginTop: 15, width: '90%', alignSelf: 'center' }}>
                                        <Text style={{ fontSize: 12, color: '#171C8F' }}>Loading declaration...</Text>
                                    </View>
                                )}

                                {!declarationLoader && declarationHTML !== '' && (
                                    <View style={{ marginTop: 15, width: '90%', alignSelf: 'center', backgroundColor: '#FFFFFF', padding: 10, borderRadius: 8 }}>
                                        <RenderHtml
                                            contentWidth={width * 0.8}
                                            source={{ html: declarationHTML }}
                                            tagsStyles={{
                                                p: { fontSize: 12, lineHeight: 18, marginVertical: 5, color: '#01044B' },
                                                strong: { fontWeight: 'bold', color: '#01044B' },
                                                div: { marginVertical: 5 }
                                            }}
                                        />
                                    </View>
                                )}

                                {/* Declaration Checkbox */}
                                <TouchableOpacity
                                    style={styles.declarationRow}
                                    onPress={() => setDeclarationChecked(!declarationChecked)}
                                >
                                    <View style={[styles.checkbox, declarationChecked && { backgroundColor: '#171C8F', borderColor: '#171C8F' }]}>
                                        {declarationChecked && (
                                            <Ionicons name="checkmark" size={14} color={'#01044B'} />
                                        )}
                                    </View>
                                    <Text style={{ fontSize: 11, flex: 1, marginLeft: 8 }}>
                                        I hereby declare that the information provided above is true to the best of my knowledge.
                                    </Text>
                                </TouchableOpacity>

                                {/* Submit */}
                              {/* Submit */}
<LinearGradient
    style={[
        styles.submitButtonGradient,
        isSubmitDisabled() && { opacity: 0.5 }
    ]}
    colors={['#171C8F', '#171C8F', 'rgba(23,28,143,0.1)']}>
    <TouchableOpacity
        onPress={submitPFWithdrawal}
        disabled={isSubmitDisabled()}
        style={styles.submitButtonInner}>
        <Text Bold style={{ color: '#FFFFFF', fontSize: 14 }}>
            {submitLoader ? 'Submitting...' : 'Submit'}
        </Text>
    </TouchableOpacity>
</LinearGradient>
                            </View>
                        )}
                    </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Purpose Selection Modal */}
            <Modal
                visible={purposeModalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setPurposeModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text Bold style={{ fontSize: 15 }}>Select Purpose</Text>
                            <TouchableOpacity onPress={() => setPurposeModalVisible(false)}>
                                <Text style={{ fontSize: 14, color: '#171C8F' }}>Close</Text>
                            </TouchableOpacity>
                        </View>
                        <SectionList
                            sections={purposeList}
                            keyExtractor={(item) => item.code}
                            renderSectionHeader={({ section: { title } }) => (
                                <Text Bold style={styles.sectionHeader}>{title}</Text>
                            )}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.purposeItem}
                                    onPress={() => onSelectPurpose(item)}
                                >
                                    <Text style={{ fontSize: 13 }}>{item.label}</Text>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={<ListEmptyComponent />}
                        />
                    </View>
                </View>
            </Modal>

            {/* Calculation Formula Modal */}
            <Modal
                visible={calculationModalVisible}
                animationType="fade"
                transparent
                onRequestClose={() => setCalculationModalVisible(false)}
            >
                <View style={styles.calculationModalOverlay}>
                    <View style={styles.calculationModalContent}>
                        <View style={styles.modalHeader}>
                            <Text Bold style={{ fontSize: 16, flex: 1 }}>Eligibility Calculation</Text>
                            <TouchableOpacity onPress={() => setCalculationModalVisible(false)}>
                                <Feather name="x-circle" size={22} color={'#01044B'} />
                            </TouchableOpacity>
                        </View>

                        {masterLoader ? (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <Text style={{ fontSize: 13, color: '#171C8F' }}>Loading...</Text>
                            </View>
                        ) : withdrawMasterData ? (
                            <ScrollView style={{ padding: 15 }} showsVerticalScrollIndicator={false}>
                                <View style={styles.infoCard}>
                                    <Text Bold style={{ fontSize: 14, marginBottom: 10, color: '#01044B' }}>
                                        Purpose Details
                                    </Text>

                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Purpose:</Text>
                                        <Text style={[styles.infoValue, { flex: 1, textAlign: 'right' }]}>
                                            {withdrawMasterData['PURPOSE DESC'] || 'N/A'}
                                        </Text>
                                    </View>

                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Category:</Text>
                                        <Text style={[styles.infoValue, { flex: 1, textAlign: 'right' }]}>
                                            {withdrawMasterData['CATEGORY'] || 'N/A'}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.infoCard}>
                                    <Text Bold style={{ fontSize: 14, marginBottom: 10, color: '#01044B' }}>
                                        Eligibility Criteria
                                    </Text>

                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Max % of Balance:</Text>
                                        <Text Bold style={[styles.infoValue, { color: '#171C8F' }]}>
                                            {withdrawMasterData['MAX PERCENT OF BALANCE'] ? `${withdrawMasterData['MAX PERCENT OF BALANCE']}%` : 'N/A'}
                                        </Text>
                                    </View>

                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Min Service Months:</Text>
                                        <Text style={styles.infoValue}>
                                            {withdrawMasterData['MIN SERVICE MONTHS'] ? `${withdrawMasterData['MIN SERVICE MONTHS']} months` : 'N/A'}
                                        </Text>
                                    </View>

                                    {withdrawMasterData['MAX TIMES ALLOWED'] && (
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Max Times Allowed:</Text>
                                            <Text style={styles.infoValue}>
                                                {withdrawMasterData['MAX TIMES ALLOWED']}
                                            </Text>
                                        </View>
                                    )}

                                    {withdrawMasterData['MAX TIMES PERIOD'] && (
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Max Times Period:</Text>
                                            <Text style={styles.infoValue}>
                                                {withdrawMasterData['MAX TIMES PERIOD']}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                <View style={[styles.infoCard, { backgroundColor: '#F5F5F5' }]}>
                                    <Text Bold style={{ fontSize: 13, marginBottom: 8, color: '#01044B' }}>
                                        Calculation Formula:
                                    </Text>
                                    <Text style={{ fontSize: 12, lineHeight: 18, color: '#01044B' }}>
                                        Eligible Amount = (Employee Share + Employer Share) × {withdrawMasterData['MAX PERCENT OF BALANCE'] ? `${withdrawMasterData['MAX PERCENT OF BALANCE']}%` : 'N/A'}
                                    </Text>
                                    {employeeShare && employerShare && withdrawMasterData['MAX PERCENT OF BALANCE'] && (
                                        <View style={{ marginTop: 10 }}>
                                            <Text style={{ fontSize: 12, color: '#171C8F' }}>
                                                = (Rs.{parseFloat(employeeShare).toFixed(2)} + Rs.{parseFloat(employerShare).toFixed(2)}) × {withdrawMasterData['MAX PERCENT OF BALANCE']}%
                                            </Text>
                                            <Text style={{ fontSize: 12, color: '#171C8F', marginTop: 5 }}>
                                                = Rs.{(parseFloat(employeeShare) + parseFloat(employerShare)).toFixed(2)} × {withdrawMasterData['MAX PERCENT OF BALANCE']}%
                                            </Text>
                                            <Text Bold style={{ fontSize: 13, color: '#171C8F', marginTop: 5 }}>
                                                = Rs.{Math.floor(parseFloat(eligibleAmount))}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </ScrollView>
                        ) : (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <Text style={{ fontSize: 13, color: '#171C8F' }}>No data available</Text>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    )
}

export default PFWithdrawal

const styles = StyleSheet.create({

    textContainer: {
        width: '90%',
        flexDirection: 'row',
        alignSelf: 'center',
        justifyContent: 'space-between',
        marginVertical: 15,

    },
    textContainer2:{
        width: '90%',
        flexDirection: 'row',
        alignSelf: 'center',
        justifyContent: 'space-between',
        marginVertical: 13,

    },
    MainCard: {

        margin: 10,
        shadowColor: '#01044B',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.18,
        shadowRadius: 3.0,
        elevation: 3,
        borderRadius: 4,
    },
    dropdownTrigger: {
        borderWidth: 1,
        borderColor: '#171C8F',
        borderRadius: 4,
        paddingVertical: 12,
        paddingHorizontal: 10,
    },
    amountInput: {
        borderWidth: 1,
        borderColor: '#171C8F',
        borderRadius: 4,
        paddingVertical: 8,
        paddingHorizontal: 10,
        fontSize: 13,
    },
    declarationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '90%',
        alignSelf: 'center',
        marginTop: 15,
    },
    checkbox: {
        width: 18,
        height: 18,
        borderWidth: 1,
        borderColor: '#171C8F',
        borderRadius: 3,
        justifyContent: 'center',
        alignItems: 'center',
    },
   submitButtonGradient: {
    borderRadius: 4,
    width: '90%',
    alignSelf: 'center',
    marginTop: 20,
    marginBottom: 10,
},
submitButtonInner: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
},
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(1,4,75,0.45)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        maxHeight: '70%',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        paddingBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 0.5,
        borderColor: '#171C8F',
    },
    sectionHeader: {
        fontSize: 12,
        backgroundColor: '#F5F5F5',
        paddingVertical: 6,
        paddingHorizontal: 15,
    },
    purposeItem: {
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderBottomWidth: 0.5,
        borderColor: 'rgba(23,28,143,0.1)',
    },
    calculationModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(1,4,75,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    calculationModalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        width: '100%',
        maxHeight: '80%',
        shadowColor: '#01044B',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    infoCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 12,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgba(23,28,143,0.1)',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 5,
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 13,
        color: '#171C8F',
    },
    infoValue: {
        fontSize: 13,
        color: '#01044B',
    },

})
